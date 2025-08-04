import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wallets, walletTags, scamDetails, walletGraphs, graphNodes, graphEdges } from "@/lib/db/schema";
import { eq, and, gte, count, sql } from "drizzle-orm";

// GET /api/v1/stats - Lấy thống kê tổng quan của hệ thống
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "all"; // all, 7d, 30d, 90d
    const network = searchParams.get("network");

    // Calculate date filter based on timeframe
    let dateFilter: Date | null = null;
    if (timeframe !== "all") {
      const days = {
        "7d": 7,
        "30d": 30,
        "90d": 90
      }[timeframe];
      
      if (days) {
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - days);
      }
    }

    // Basic wallet statistics
    const conditions = [];
    if (network) {
      conditions.push(eq(wallets.chain, network));
    }
    if (dateFilter) {
      conditions.push(gte(wallets.createdAt, dateFilter));
    }
    
    const [walletCount] = await (conditions.length > 0
      ? db.select({ count: count() }).from(wallets).where(and(...conditions))
      : db.select({ count: count() }).from(wallets));

    // Wallet distribution by network
    const networkDistribution = await db
      .select({
        network: wallets.chain,
        count: count()
      })
      .from(wallets)
      .groupBy(wallets.chain);

    // Tag statistics
    const tagDistribution = await (dateFilter
      ? db
          .select({
            tagType: walletTags.tagType,
            count: count()
          })
          .from(walletTags)
          .where(gte(walletTags.createdAt, dateFilter))
          .groupBy(walletTags.tagType)
      : db
          .select({
            tagType: walletTags.tagType,
            count: count()
          })
          .from(walletTags)
          .groupBy(walletTags.tagType));

    // Risk level distribution
    const allWalletTags = await db
      .select({
        walletAddress: walletTags.walletAddress,
        tagType: walletTags.tagType
      })
      .from(walletTags);

    // Group tags by wallet and calculate risk scores
    const walletRiskMap = new Map<string, string[]>();
    allWalletTags.forEach(tag => {
      if (!walletRiskMap.has(tag.walletAddress)) {
        walletRiskMap.set(tag.walletAddress, []);
      }
      walletRiskMap.get(tag.walletAddress)!.push(tag.tagType);
    });

    const riskDistribution = {
      safe: 0,
      caution: 0,
      dangerous: 0,
      untagged: 0
    };

    // Calculate total wallets for risk distribution
    const totalWallets = walletCount.count;
    const taggedWallets = walletRiskMap.size;
    riskDistribution.untagged = totalWallets - taggedWallets;

    walletRiskMap.forEach(tags => {
      const riskScore = calculateRiskScore(tags);
      const safetyLevel = getSafetyLevel(riskScore);
      riskDistribution[safetyLevel as keyof typeof riskDistribution]++;
    });

    // Scam statistics
    const [scamCount] = await (dateFilter
      ? db.select({ count: count() }).from(scamDetails).where(gte(scamDetails.createdAt, dateFilter))
      : db.select({ count: count() }).from(scamDetails));

    // Graph statistics
    const [graphCount] = await (dateFilter
      ? db.select({ count: count() }).from(walletGraphs).where(gte(walletGraphs.createdAt, dateFilter))
      : db.select({ count: count() }).from(walletGraphs));

    // Node and edge counts
    const [nodeCount] = await db.select({ count: count() }).from(graphNodes);
    const [edgeCount] = await db.select({ count: count() }).from(graphEdges);

    // Top searched wallets
    const topSearched = network
      ? await db
          .select({
            address: wallets.address,
            chain: wallets.chain,
            ownerName: wallets.ownerName,
            searchCount: wallets.searchCount
          })
          .from(wallets)
          .where(and(gte(wallets.searchCount, 1), eq(wallets.chain, network)))
          .orderBy(sql`${wallets.searchCount} DESC`)
          .limit(10)
      : await db
          .select({
            address: wallets.address,
            chain: wallets.chain,
            ownerName: wallets.ownerName,
            searchCount: wallets.searchCount
          })
          .from(wallets)
          .where(gte(wallets.searchCount, 1))
          .orderBy(sql`${wallets.searchCount} DESC`)
          .limit(10);

    // Recent activity (last 24 hours)
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const [recentWallets] = await db
      .select({ count: count() })
      .from(wallets)
      .where(gte(wallets.createdAt, last24Hours));

    const [recentTags] = await db
      .select({ count: count() })
      .from(walletTags)
      .where(gte(walletTags.createdAt, last24Hours));

    const [recentGraphs] = await db
      .select({ count: count() })
      .from(walletGraphs)
      .where(gte(walletGraphs.createdAt, last24Hours));

    // Search activity (total searches)
    const [totalSearches] = await db
      .select({ 
        total: sql<number>`SUM(${wallets.searchCount})` 
      })
      .from(wallets);

    // Most active taggers
    const topTaggers = dateFilter
      ? await db
          .select({
            addedBy: walletTags.addedBy,
            count: count()
          })
          .from(walletTags)
          .where(gte(walletTags.createdAt, dateFilter))
          .groupBy(walletTags.addedBy)
          .orderBy(sql`COUNT(*) DESC`)
          .limit(10)
      : await db
          .select({
            addedBy: walletTags.addedBy,
            count: count()
          })
          .from(walletTags)
          .groupBy(walletTags.addedBy)
          .orderBy(sql`COUNT(*) DESC`)
          .limit(10);

    // Build response
    const stats = {
      overview: {
        totalWallets: walletCount.count,
        totalTags: tagDistribution.reduce((sum, tag) => sum + tag.count, 0),
        totalScams: scamCount.count,
        totalGraphs: graphCount.count,
        totalNodes: nodeCount.count,
        totalEdges: edgeCount.count,
        totalSearches: totalSearches.total || 0
      },
      distribution: {
        networks: networkDistribution.reduce((acc, item) => {
          acc[item.network] = item.count;
          return acc;
        }, {} as Record<string, number>),
        tags: tagDistribution.reduce((acc, item) => {
          acc[item.tagType] = item.count;
          return acc;
        }, {} as Record<string, number>),
        riskLevels: riskDistribution
      },
      activity: {
        last24Hours: {
          newWallets: recentWallets.count,
          newTags: recentTags.count,
          newGraphs: recentGraphs.count
        },
        topSearchedWallets: topSearched.map(wallet => ({
          address: wallet.address,
          network: wallet.chain,
          ownerName: wallet.ownerName,
          searchCount: wallet.searchCount
        })),
        topTaggers: topTaggers.map(tagger => ({
          user: tagger.addedBy,
          tagsAdded: tagger.count
        }))
      },
      filters: {
        timeframe,
        network: network || null
      },
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error("Error fetching statistics:", error);
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

  return Math.min(100, Math.max(0, totalRisk / tags.length));
}

function getSafetyLevel(riskScore: number): string {
  if (riskScore <= 30) return "safe";
  if (riskScore <= 70) return "caution";
  return "dangerous";
}