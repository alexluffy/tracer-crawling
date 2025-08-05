import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { walletTags, wallets } from "@/lib/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";

/**
 * @swagger
 * /api/v1/tags:
 *   get:
 *     summary: Get wallet tags
 *     description: Retrieve a list of wallet tags with optional filtering
 *     tags:
 *       - Tags
 *     parameters:
 *       - name: tagType
 *         in: query
 *         description: Filter by tag type
 *         schema:
 *           type: string
 *           enum: [EXCHANGE, DEFI, SCAM, MIXER, GAMBLING, MINING, BRIDGE, NFT, LENDING, OTHER]
 *       - name: addedBy
 *         in: query
 *         description: Filter by user who added the tag
 *         schema:
 *           type: string
 *           example: "analyst@company.com"
 *       - name: walletAddress
 *         in: query
 *         description: Filter by wallet address
 *         schema:
 *           type: string
 *           example: "0x1234567890abcdef"
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/OffsetParam'
 *     responses:
 *       200:
 *         description: List of wallet tags
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WalletTag'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tagType = searchParams.get("tagType");
    const addedBy = searchParams.get("addedBy");
    const walletAddress = searchParams.get("walletAddress");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Validate limit
    if (limit > 100) {
      return NextResponse.json(
        {
          error: "Limit cannot exceed 100",
          code: "LIMIT_EXCEEDED",
        },
        { status: 400 }
      );
    }

    // Build where conditions
    const conditions = [];

    if (tagType) {
      conditions.push(eq(walletTags.tagType, tagType as any));
    }

    if (addedBy) {
      conditions.push(eq(walletTags.addedBy, addedBy));
    }

    if (walletAddress) {
      conditions.push(
        eq(walletTags.walletAddress, walletAddress.toLowerCase())
      );
    }

    // Build the query with conditions
    const baseQuery = db
      .select({
        id: walletTags.id,
        walletAddress: walletTags.walletAddress,
        tagType: walletTags.tagType,
        addedBy: walletTags.addedBy,
        createdAt: walletTags.createdAt,
        // Join wallet info
        walletChain: wallets.chain,
        walletOwnerName: wallets.ownerName,
      })
      .from(walletTags)
      .leftJoin(wallets, eq(walletTags.walletAddress, wallets.address));

    // Apply conditions and execute query
    const results =
      conditions.length > 0
        ? await baseQuery
            .where(and(...conditions))
            .orderBy(desc(walletTags.createdAt))
            .limit(limit)
            .offset(offset)
        : await baseQuery
            .orderBy(desc(walletTags.createdAt))
            .limit(limit)
            .offset(offset);

    // Get tag statistics
    const tagStats = await db
      .select({
        tagType: walletTags.tagType,
        count: walletTags.id,
      })
      .from(walletTags)
      .groupBy(walletTags.tagType);

    const formattedResults = results.map((result) => ({
      id: result.id,
      walletAddress: result.walletAddress,
      tagType: result.tagType,
      addedBy: result.addedBy,
      createdAt: result.createdAt,
      wallet: {
        chain: result.walletChain,
        ownerName: result.walletOwnerName,
      },
    }));

    return NextResponse.json({
      tags: formattedResults,
      pagination: {
        limit,
        offset,
        total: results.length,
        hasMore: results.length === limit,
      },
      statistics: tagStats.reduce((acc, stat) => {
        acc[stat.tagType] = stat.count;
        return acc;
      }, {} as Record<string, number>),
      filters: {
        tagType: tagType || null,
        addedBy: addedBy || null,
        walletAddress: walletAddress || null,
      },
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/tags - Xóa tags theo IDs
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { tagIds, addedBy } = body;

    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return NextResponse.json(
        {
          error: "Tag IDs array is required",
          code: "MISSING_TAG_IDS",
        },
        { status: 400 }
      );
    }

    if (!addedBy) {
      return NextResponse.json(
        {
          error: "addedBy field is required for authorization",
          code: "MISSING_ADDED_BY",
        },
        { status: 400 }
      );
    }

    // Verify that the user can only delete tags they added
    const tagsToDelete = await db
      .select()
      .from(walletTags)
      .where(
        and(inArray(walletTags.id, tagIds), eq(walletTags.addedBy, addedBy))
      );

    if (tagsToDelete.length === 0) {
      return NextResponse.json(
        {
          error: "No tags found that can be deleted by this user",
          code: "NO_DELETABLE_TAGS",
        },
        { status: 404 }
      );
    }

    const deletableIds = tagsToDelete.map((tag) => tag.id);

    // Delete the tags
    await db.delete(walletTags).where(inArray(walletTags.id, deletableIds));

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletableIds.length} tags`,
      deletedCount: deletableIds.length,
      deletedIds: deletableIds,
      notFound: tagIds.filter((id) => !deletableIds.includes(id)),
    });
  } catch (error) {
    console.error("Error deleting tags:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
