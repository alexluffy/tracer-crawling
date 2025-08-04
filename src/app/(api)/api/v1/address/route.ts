import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wallets, walletTags, scamDetails } from "@/lib/db/schema";
import { eq, and, inArray, ilike, or } from "drizzle-orm";

// GET /api/v1/address - Tìm kiếm nhiều địa chỉ ví hoặc theo từ khóa
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const addresses = searchParams.get("addresses")?.split(",") || [];
    const search = searchParams.get("search");
    const network = searchParams.get("network");
    const tagType = searchParams.get("tagType");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Validate limit
    if (limit > 100) {
      return NextResponse.json(
        {
          error: "Limit cannot exceed 100",
          code: "LIMIT_EXCEEDED"
        },
        { status: 400 }
      );
    }

    // Build where conditions
    const conditions = [];

    // Filter by specific addresses
    if (addresses.length > 0) {
      const validAddresses = addresses
        .filter(addr => isValidAddress(addr.trim()))
        .map(addr => addr.trim().toLowerCase());
      
      if (validAddresses.length > 0) {
        conditions.push(inArray(wallets.address, validAddresses));
      }
    }

    // Filter by search term (owner name or address)
    if (search) {
      conditions.push(
        or(
          ilike(wallets.address, `%${search.toLowerCase()}%`),
          ilike(wallets.ownerName, `%${search}%`)
        )
      );
    }

    // Filter by network
    if (network) {
      conditions.push(eq(wallets.chain, network));
    }

    // Build and execute query
    const baseQuery = db.select({
      address: wallets.address,
      chain: wallets.chain,
      ownerName: wallets.ownerName,
      searchCount: wallets.searchCount,
      createdAt: wallets.createdAt,
      updatedAt: wallets.updatedAt
    }).from(wallets);

    const walletsResult = await (conditions.length > 0
      ? baseQuery.where(and(...conditions)).limit(limit).offset(offset)
      : baseQuery.limit(limit).offset(offset));

    // Get tags for each wallet
    const walletAddresses = walletsResult.map(w => w.address);
    const allTags = walletAddresses.length > 0 ? await db
      .select({
        walletAddress: walletTags.walletAddress,
        tagType: walletTags.tagType,
        addedBy: walletTags.addedBy
      })
      .from(walletTags)
      .where(inArray(walletTags.walletAddress, walletAddresses)) : [];

    // Filter by tag type if specified
    let filteredWallets = walletsResult;
    if (tagType) {
      const walletsWithTag = allTags
        .filter(tag => tag.tagType === tagType)
        .map(tag => tag.walletAddress);
      
      filteredWallets = walletsResult.filter(wallet => 
        walletsWithTag.includes(wallet.address)
      );
    }

    // Get scam details for wallets with scam tags
    const scamWallets = allTags
      .filter(tag => tag.tagType === "scam")
      .map(tag => tag.walletAddress);
    
    const scamDetailsResult = scamWallets.length > 0 ? await db
      .select()
      .from(scamDetails)
      .where(inArray(scamDetails.walletAddress, scamWallets)) : [];

    // Build response
    const results = filteredWallets.map(wallet => {
      const walletTags = allTags.filter(tag => tag.walletAddress === wallet.address);
      const riskScore = calculateRiskScore(walletTags.map(t => t.tagType));
      const safetyLevel = getSafetyLevel(riskScore);
      const scamInfo = scamDetailsResult.find(s => s.walletAddress === wallet.address);

      return {
        address: wallet.address,
        network: wallet.chain,
        ownerName: wallet.ownerName,
        riskScore,
        safetyLevel,
        searchCount: wallet.searchCount,
        tags: walletTags.map(tag => ({
          type: tag.tagType,
          addedBy: tag.addedBy
        })),
        scamDetails: scamInfo ? {
          reason: scamInfo.reason,
          scamLink: scamInfo.scamLink,
          twitterHandle: scamInfo.twitterHandle
        } : null,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt
      };
    });

    return NextResponse.json({
      results,
      pagination: {
        limit,
        offset,
        total: results.length,
        hasMore: results.length === limit
      },
      filters: {
        addresses: addresses.length > 0 ? addresses : null,
        search: search || null,
        network: network || null,
        tagType: tagType || null
      }
    });

  } catch (error) {
    console.error("Error searching wallets:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR"
      },
      { status: 500 }
    );
  }
}

// POST /api/v1/address - Thêm nhiều địa chỉ ví cùng lúc
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallets: walletsData } = body;

    if (!Array.isArray(walletsData) || walletsData.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid input: wallets array is required",
          code: "INVALID_INPUT"
        },
        { status: 400 }
      );
    }

    if (walletsData.length > 50) {
      return NextResponse.json(
        {
          error: "Cannot add more than 50 wallets at once",
          code: "BATCH_LIMIT_EXCEEDED"
        },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const walletData of walletsData) {
      try {
        const { address, network = "ethereum", ownerName, tags = [] } = walletData;

        if (!address || !isValidAddress(address)) {
          errors.push({
            address: address || "unknown",
            error: "Invalid address format"
          });
          continue;
        }

        // Check if wallet already exists
        const existingWallet = await db
          .select()
          .from(wallets)
          .where(and(
            eq(wallets.address, address.toLowerCase()),
            eq(wallets.chain, network)
          ))
          .limit(1);

        let wallet;
        if (existingWallet.length === 0) {
          // Create new wallet
          [wallet] = await db
            .insert(wallets)
            .values({
              address: address.toLowerCase(),
              chain: network,
              ownerName: ownerName || null
            })
            .returning();
        } else {
          wallet = existingWallet[0];
          // Update owner name if provided
          if (ownerName && ownerName !== wallet.ownerName) {
            [wallet] = await db
              .update(wallets)
              .set({ ownerName, updatedAt: new Date() })
              .where(eq(wallets.address, address.toLowerCase()))
              .returning();
          }
        }

        // Add tags if provided
        const addedTags = [];
        for (const tagData of tags) {
          if (tagData.type && tagData.addedBy) {
            const [newTag] = await db
              .insert(walletTags)
              .values({
                walletAddress: address.toLowerCase(),
                tagType: tagData.type,
                addedBy: tagData.addedBy
              })
              .returning();
            
            addedTags.push({
              type: newTag.tagType,
              addedBy: newTag.addedBy
            });

            // Add scam details if it's a scam tag
            if (tagData.type === "scam" && tagData.scamDetails) {
              await db
                .insert(scamDetails)
                .values({
                  walletAddress: address.toLowerCase(),
                  reason: tagData.scamDetails.reason,
                  scamLink: tagData.scamDetails.scamLink || null,
                  twitterHandle: tagData.scamDetails.twitterHandle || null
                })
                .onConflictDoUpdate({
                  target: scamDetails.walletAddress,
                  set: {
                    reason: tagData.scamDetails.reason,
                    scamLink: tagData.scamDetails.scamLink || null,
                    twitterHandle: tagData.scamDetails.twitterHandle || null
                  }
                });
            }
          }
        }

        results.push({
          address: wallet.address,
          network: wallet.chain,
          ownerName: wallet.ownerName,
          tagsAdded: addedTags.length,
          tags: addedTags,
          status: "success"
        });

      } catch (error) {
        console.error(`Error processing wallet ${walletData.address}:`, error);
        errors.push({
          address: walletData.address || "unknown",
          error: "Processing failed"
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    }, { status: 201 });

  } catch (error) {
    console.error("Error in batch wallet creation:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR"
      },
      { status: 500 }
    );
  }
}

// Utility functions
function isValidAddress(address: string): boolean {
  // Ethereum address validation (42 characters, starts with 0x)
  const ethRegex = /^0x[a-fA-F0-9]{40}$/;
  
  // Tron address validation (34 characters, starts with T)
  const tronRegex = /^T[A-Za-z1-9]{33}$/;
  
  // Solana address validation (32-44 characters, base58)
  const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  
  return ethRegex.test(address) || tronRegex.test(address) || solanaRegex.test(address);
}

function calculateRiskScore(tags: string[]): number {
  const riskWeights: Record<string, number> = {
    scam: 80,
    hacker: 75,
    blacklist: 70,
    otc: 30,
    kol: 10,
    f0_user: 5
  };

  if (tags.length === 0) return 0;

  const totalRisk = tags.reduce((sum, tag) => {
    return sum + (riskWeights[tag] || 0);
  }, 0);

  // Normalize to 0-100 scale
  return Math.min(100, Math.max(0, totalRisk / tags.length));
}

function getSafetyLevel(riskScore: number): string {
  if (riskScore <= 30) return "safe";
  if (riskScore <= 70) return "caution";
  return "dangerous";
}