import { db } from "@/lib/db";
import {
  scamDetails,
  walletGraphs,
  wallets,
  walletTags,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/address/{id}:
 *   get:
 *     summary: Get wallet address details
 *     description: Retrieve detailed information for a specific wallet address
 *     tags:
 *       - Address
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Wallet address to lookup
 *         schema:
 *           type: string
 *           example: "0x1234567890abcdef"
 *       - name: network
 *         in: query
 *         description: Blockchain network (default: ethereum)
 *         schema:
 *           type: string
 *           default: "ethereum"
 *           example: "ethereum"
 *     responses:
 *       200:
 *         description: Wallet address details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Wallet'
 *       400:
 *         description: Invalid address format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Wallet address not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: address } = await params;
  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get("network") || "ethereum";

    // Validate address format
    if (!address || !isValidAddress(address)) {
      return NextResponse.json(
        {
          error: "Invalid wallet address format",
          code: "INVALID_ADDRESS",
        },
        { status: 400 }
      );
    }

    // Tìm thông tin ví trong database
    const walletInfo = await db
      .select()
      .from(wallets)
      .where(
        and(
          eq(wallets.address, address.toLowerCase()),
          eq(wallets.chain, network)
        )
      )
      .limit(1);

    if (walletInfo.length === 0) {
      return NextResponse.json(
        {
          address,
          network,
          found: false,
          message: "Wallet not found in database",
        },
        { status: 404 }
      );
    }

    const wallet = walletInfo[0];

    // Lấy tất cả tags của ví
    const tags = await db
      .select({
        id: walletTags.id,
        tagType: walletTags.tagType,
        addedBy: walletTags.addedBy,
      })
      .from(walletTags)
      .where(eq(walletTags.walletAddress, address.toLowerCase()));

    // Lấy thông tin scam nếu có
    const scamInfo = await db
      .select()
      .from(scamDetails)
      .where(eq(scamDetails.walletAddress, address.toLowerCase()))
      .limit(1);

    // Tính toán risk score dựa trên tags
    const riskScore = calculateRiskScore(tags.map((t) => t.tagType));
    const safetyLevel = getSafetyLevel(riskScore);

    // Lấy thông tin graph nếu ví là root của graph nào đó
    const graphs = await db
      .select({
        id: walletGraphs.id,
        createdAt: walletGraphs.createdAt,
      })
      .from(walletGraphs)
      .where(eq(walletGraphs.rootWalletAddress, address.toLowerCase()));

    // Cập nhật search count
    await db
      .update(wallets)
      .set({
        searchCount: (wallet.searchCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(wallets.address, address.toLowerCase()));

    // Tạo response
    const response = {
      address: wallet.address,
      network: wallet.chain,
      found: true,
      ownerName: wallet.ownerName,
      riskScore,
      safetyLevel,
      searchCount: (wallet.searchCount || 0) + 1,
      tags: tags.map((tag) => ({
        type: tag.tagType,
        addedBy: tag.addedBy,
      })),
      scamDetails:
        scamInfo.length > 0
          ? {
              reason: scamInfo[0].reason,
              scamLink: scamInfo[0].scamLink,
              twitterHandle: scamInfo[0].twitterHandle,
            }
          : null,
      hasGraphData: graphs.length > 0,
      graphCount: graphs.length,
      lastActivity: wallet.updatedAt,
      createdAt: wallet.createdAt,
      updatedAt: new Date(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching wallet info:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/v1/address/{id}:
 *   post:
 *     summary: Add tag to wallet address
 *     description: Add a new tag to a specific wallet address
 *     tags:
 *       - Address
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Wallet address to tag
 *         schema:
 *           type: string
 *           example: "0x1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tagType
 *               - addedBy
 *             properties:
 *               tagType:
 *                 type: string
 *                 enum: [EXCHANGE, DEFI, SCAM, MIXER, GAMBLING, MINING, BRIDGE, NFT, LENDING, OTHER]
 *                 description: Type of tag to add
 *                 example: "EXCHANGE"
 *               addedBy:
 *                 type: string
 *                 description: User who added the tag
 *                 example: "analyst@company.com"
 *               description:
 *                 type: string
 *                 description: Optional description for the tag
 *                 example: "Major exchange wallet"
 *               scamDetails:
 *                 type: object
 *                 description: Required when tagType is SCAM
 *                 properties:
 *                   scamType:
 *                     type: string
 *                     example: "Phishing"
 *                   description:
 *                     type: string
 *                     example: "Reported phishing wallet"
 *                   reportedBy:
 *                     type: string
 *                     example: "security@company.com"
 *                   verified:
 *                     type: boolean
 *                     default: false
 *             example:
 *               tagType: "EXCHANGE"
 *               addedBy: "analyst@company.com"
 *               description: "Binance hot wallet"
 *     responses:
 *       201:
 *         description: Tag added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Tag added successfully"
 *                 tag:
 *                   $ref: '#/components/schemas/WalletTag'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Tag already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: address } = await params;
  try {
    const body = await request.json();
    const { tagType, addedBy, scamDetails: scamDetailsData } = body;

    // Validate input
    if (!address || !tagType || !addedBy) {
      return NextResponse.json(
        {
          error: "Missing required fields: address, tagType, addedBy",
          code: "MISSING_FIELDS",
        },
        { status: 400 }
      );
    }

    if (!isValidAddress(address)) {
      return NextResponse.json(
        {
          error: "Invalid wallet address format",
          code: "INVALID_ADDRESS",
        },
        { status: 400 }
      );
    }

    // Kiểm tra xem ví đã tồn tại chưa, nếu chưa thì tạo mới
    const existingWallet = await db
      .select()
      .from(wallets)
      .where(eq(wallets.address, address.toLowerCase()))
      .limit(1);

    if (existingWallet.length === 0) {
      // Tạo ví mới
      await db.insert(wallets).values({
        address: address.toLowerCase(),
        chain: body.network || "ethereum",
        ownerName: body.ownerName || null,
      });
    }

    // Thêm tag mới
    const [newTag] = await db
      .insert(walletTags)
      .values({
        walletAddress: address.toLowerCase(),
        tagType,
        addedBy,
      })
      .returning();

    // Nếu là scam tag và có thông tin chi tiết
    if (tagType === "scam" && scamDetailsData) {
      await db
        .insert(scamDetails)
        .values({
          walletAddress: address.toLowerCase(),
          reason: scamDetailsData.reason,
          scamLink: scamDetailsData.scamLink || null,
          twitterHandle: scamDetailsData.twitterHandle || null,
        })
        .onConflictDoUpdate({
          target: scamDetails.walletAddress,
          set: {
            reason: scamDetailsData.reason,
            scamLink: scamDetailsData.scamLink || null,
            twitterHandle: scamDetailsData.twitterHandle || null,
          },
        });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Tag added successfully",
        tag: {
          id: newTag.id,
          walletAddress: newTag.walletAddress,
          tagType: newTag.tagType,
          addedBy: newTag.addedBy,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding wallet tag:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
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

  return (
    ethRegex.test(address) ||
    tronRegex.test(address) ||
    solanaRegex.test(address)
  );
}

function calculateRiskScore(tags: string[]): number {
  const riskWeights: Record<string, number> = {
    scam: 80,
    hacker: 75,
    blacklist: 70,
    otc: 30,
    kol: 10,
    f0_user: 5,
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
