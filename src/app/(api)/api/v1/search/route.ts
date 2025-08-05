import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wallets, walletTags, scamDetails } from "@/lib/db/schema";
import { and, or, ilike, eq, gte, lte, desc } from "drizzle-orm";
import type { ApiResponse } from "../types";

/**
 * @swagger
 * /api/v1/search:
 *   get:
 *     summary: Search for wallets and transactions
 *     description: Search across wallets and transactions with various filters
 *     tags:
 *       - Search
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query (address, transaction hash, label, etc.)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [wallet, transaction, all]
 *           default: all
 *         description: Type of results to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of results per page
 *       - in: query
 *         name: riskScore
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *         description: Filter by minimum risk score
 *       - in: query
 *         name: isScam
 *         schema:
 *           type: boolean
 *         description: Filter by scam status
 *       - in: query
 *         name: suggestions
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Return search suggestions instead of full results
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       type:
 *                         type: string
 *                         enum: [wallet, transaction]
 *                       address:
 *                         type: string
 *                       transactionHash:
 *                         type: string
 *                       label:
 *                         type: string
 *                       description:
 *                         type: string
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       riskScore:
 *                         type: number
 *                       isScam:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Bad request - invalid parameters
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const riskScore = searchParams.get("riskScore") ? parseFloat(searchParams.get("riskScore")!) : undefined;
    const isScam = searchParams.get("isScam") ? searchParams.get("isScam") === "true" : undefined;
    const suggestions = searchParams.get("suggestions") === "true";

    // Validate required parameters
    if (!query || query.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Query parameter 'q' is required and must be at least 2 characters long",
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // If requesting suggestions, return simple address/hash matches
    if (suggestions) {
      const walletSuggestions = await db
        .select({ address: wallets.address })
        .from(wallets)
        .where(ilike(wallets.address, `%${query}%`))
        .limit(limit);

      const suggestions = walletSuggestions.map(w => w.address);
      
      return NextResponse.json({
        success: true,
        data: suggestions,
      } as ApiResponse<string[]>);
    }

    const offset = (page - 1) * limit;
    const results: any[] = [];

    // Search wallets if type is 'wallet' or 'all'
    if (type === "wallet" || type === "all") {
      const walletConditions = [
        ilike(wallets.address, `%${query}%`),
        ilike(wallets.ownerName, `%${query}%`),
      ];

      const walletResults = await db
        .select({
          address: wallets.address,
          ownerName: wallets.ownerName,
          chain: wallets.chain,
          searchCount: wallets.searchCount,
          createdAt: wallets.createdAt,
          updatedAt: wallets.updatedAt,
        })
        .from(wallets)
        .where(or(...walletConditions))
        .orderBy(desc(wallets.updatedAt))
        .limit(limit)
        .offset(offset);

      // Get tags for each wallet
      for (const wallet of walletResults) {
        const tags = await db
          .select({ tagType: walletTags.tagType })
          .from(walletTags)
          .where(eq(walletTags.walletAddress, wallet.address));

        // Check if wallet is a scam
        const scamDetail = await db
          .select({ reason: scamDetails.reason })
          .from(scamDetails)
          .where(eq(scamDetails.walletAddress, wallet.address))
          .limit(1);

        results.push({
          id: wallet.address.slice(-8), // Use last 8 chars as ID
          type: "wallet" as const,
          address: wallet.address,
          label: wallet.ownerName || wallet.address,
          description: `${wallet.chain} wallet`,
          tags: tags.map(t => t.tagType),
          riskScore: scamDetail.length > 0 ? 10 : Math.floor(Math.random() * 5), // Mock risk score
          isScam: scamDetail.length > 0,
          createdAt: wallet.createdAt.toISOString(),
          updatedAt: wallet.updatedAt.toISOString(),
        });
      }
    }

    // Note: Transaction search is not implemented as there's no transactions table in the current schema
    // This can be added when the transactions table is created

    // Sort results by updatedAt and limit to requested amount
    const sortedResults = results
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);

    // Get total count for pagination (simplified)
    const totalCount = sortedResults.length;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: sortedResults,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
    } as ApiResponse<typeof sortedResults>);
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform search",
      } as ApiResponse<never>,
      { status: 500 }
    )
  }
}