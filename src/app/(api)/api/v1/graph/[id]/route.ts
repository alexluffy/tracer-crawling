import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  walletGraphs,
  graphNodes,
  graphEdges,
  wallets,
  walletTags,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

// GET /api/v1/graph/[id] - Lấy thông tin chi tiết của một graph
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeWalletDetails =
      searchParams.get("includeWalletDetails") === "true";
    const includeTags = searchParams.get("includeTags") === "true";

    // Validate graph ID
    const graphId = parseInt(id);
    if (isNaN(graphId)) {
      return NextResponse.json(
        {
          error: "Invalid graph ID",
          code: "INVALID_GRAPH_ID",
        },
        { status: 400 }
      );
    }

    // Get graph info
    const graphInfo = await db
      .select({
        id: walletGraphs.id,
        rootWalletAddress: walletGraphs.rootWalletAddress,
        createdAt: walletGraphs.createdAt,
        // Join root wallet info
        rootWalletChain: wallets.chain,
        rootWalletOwnerName: wallets.ownerName,
      })
      .from(walletGraphs)
      .leftJoin(wallets, eq(walletGraphs.rootWalletAddress, wallets.address))
      .where(eq(walletGraphs.id, graphId))
      .limit(1);

    if (graphInfo.length === 0) {
      return NextResponse.json(
        {
          error: "Graph not found",
          code: "GRAPH_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const graph = graphInfo[0];

    // Get all nodes in the graph
    const nodes = includeWalletDetails
      ? await db
          .select({
            id: graphNodes.id,
            walletAddress: graphNodes.walletAddress,
            nodeType: graphNodes.nodeType,
            walletChain: wallets.chain,
            walletOwnerName: wallets.ownerName,
            walletSearchCount: wallets.searchCount,
            walletCreatedAt: wallets.createdAt,
            walletUpdatedAt: wallets.updatedAt,
          })
          .from(graphNodes)
          .leftJoin(wallets, eq(graphNodes.walletAddress, wallets.address))
          .where(eq(graphNodes.graphId, graphId))
      : await db
          .select({
            id: graphNodes.id,
            walletAddress: graphNodes.walletAddress,
            nodeType: graphNodes.nodeType,
          })
          .from(graphNodes)
          .where(eq(graphNodes.graphId, graphId));

    // Get all edges in the graph
    const edges = await db
      .select()
      .from(graphEdges)
      .where(eq(graphEdges.graphId, graphId));

    // Get tags for all wallets if requested
    let walletTags_data: any[] = [];
    if (includeTags && nodes.length > 0) {
      const walletAddresses = nodes.map((node) => node.walletAddress);
      walletTags_data = await db
        .select({
          walletAddress: walletTags.walletAddress,
          tagType: walletTags.tagType,
          addedBy: walletTags.addedBy,
          createdAt: walletTags.createdAt,
        })
        .from(walletTags)
        .where(inArray(walletTags.walletAddress, walletAddresses));
    }

    // Format nodes with additional data
    const formattedNodes = nodes.map((node) => {
      const nodeData: any = {
        id: node.id,
        walletAddress: node.walletAddress,
        nodeType: node.nodeType,
      };

      // Add wallet details if requested
      if (includeWalletDetails && "walletChain" in node) {
        const nodeWithWallet = node as typeof node & {
          walletChain: unknown;
          walletOwnerName: string | null;
          walletSearchCount: number | null;
          walletCreatedAt: Date | null;
          walletUpdatedAt: Date | null;
        };
        nodeData.wallet = {
          chain: nodeWithWallet.walletChain,
          ownerName: nodeWithWallet.walletOwnerName,
          searchCount: nodeWithWallet.walletSearchCount,
          createdAt: nodeWithWallet.walletCreatedAt,
          updatedAt: nodeWithWallet.walletUpdatedAt,
        };
      }

      // Add tags if requested
      if (includeTags) {
        const nodeTags = walletTags_data.filter(
          (tag) => tag.walletAddress === node.walletAddress
        );
        nodeData.tags = nodeTags.map((tag) => ({
          type: tag.tagType,
          addedBy: tag.addedBy,
          createdAt: tag.createdAt,
        }));

        // Calculate risk score
        const riskScore = calculateRiskScore(nodeTags.map((t) => t.tagType));
        nodeData.riskScore = riskScore;
        nodeData.safetyLevel = getSafetyLevel(riskScore);
      }

      return nodeData;
    });

    // Format edges
    const formattedEdges = edges.map((edge) => ({
      id: edge.id,
      fromWalletAddress: edge.fromWalletAddress,
      toWalletAddress: edge.toWalletAddress,
      transactionHash: edge.transactionHash,
      amount: edge.amount,
      timestamp: edge.timestamp,
    }));

    // Calculate graph statistics
    const stats: any = {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodeTypes: nodes.reduce((acc, node) => {
        acc[node.nodeType] = (acc[node.nodeType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    if (includeTags) {
      const allTags = walletTags_data.map((t) => t.tagType);
      stats.tagDistribution = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const riskScores = formattedNodes
        .filter((node) => node.riskScore !== undefined)
        .map((node) => node.riskScore);

      if (riskScores.length > 0) {
        stats.averageRiskScore =
          riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
        stats.highRiskNodes = riskScores.filter((score) => score > 70).length;
      }
    }

    const response = {
      id: graph.id,
      rootWalletAddress: graph.rootWalletAddress,
      createdAt: graph.createdAt,
      rootWallet: {
        chain: graph.rootWalletChain,
        ownerName: graph.rootWalletOwnerName,
      },
      nodes: formattedNodes,
      edges: formattedEdges,
      statistics: stats,
      options: {
        includeWalletDetails,
        includeTags,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching graph details:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/graph/[id] - Xóa graph
// export async function DELETE(
//   _: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const { id } = params;
//     const graphId = parseInt(id);

//     if (isNaN(graphId)) {
//       return NextResponse.json(
//         {
//           error: "Invalid graph ID",
//           code: "INVALID_GRAPH_ID"
//         },
//         { status: 400 }
//       );
//     }

//     // Check if graph exists
//     const existingGraph = await db
//       .select()
//       .from(walletGraphs)
//       .where(eq(walletGraphs.id, graphId))
//       .limit(1);

//     if (existingGraph.length === 0) {
//       return NextResponse.json(
//         {
//           error: "Graph not found",
//           code: "GRAPH_NOT_FOUND"
//         },
//         { status: 404 }
//       );
//     }

//     // Delete edges first (foreign key constraint)
//     const deletedEdges = await db
//       .delete(graphEdges)
//       .where(eq(graphEdges.graphId, graphId))
//       .returning();

//     // Delete nodes
//     const deletedNodes = await db
//       .delete(graphNodes)
//       .where(eq(graphNodes.graphId, graphId))
//       .returning();

//     // Delete the graph
//     await db
//       .delete(walletGraphs)
//       .where(eq(walletGraphs.id, graphId));

//     return NextResponse.json({
//       success: true,
//       message: "Graph deleted successfully",
//       deleted: {
//         graphId,
//         nodesDeleted: deletedNodes.length,
//         edgesDeleted: deletedEdges.length
//       }
//     });

//   } catch (error) {
//     console.error("Error deleting graph:", error);
//     return NextResponse.json(
//       {
//         error: "Internal server error",
//         code: "INTERNAL_ERROR"
//       },
//       { status: 500 }
//     );
//   }
// }

// PUT /api/v1/graph/[id] - Cập nhật graph (thêm nodes/edges)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nodes = [], edges = [], action = "add" } = body;

    const graphId = parseInt(id);
    if (isNaN(graphId)) {
      return NextResponse.json(
        {
          error: "Invalid graph ID",
          code: "INVALID_GRAPH_ID",
        },
        { status: 400 }
      );
    }

    // Check if graph exists
    const existingGraph = await db
      .select()
      .from(walletGraphs)
      .where(eq(walletGraphs.id, graphId))
      .limit(1);

    if (existingGraph.length === 0) {
      return NextResponse.json(
        {
          error: "Graph not found",
          code: "GRAPH_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const results = {
      nodesAdded: 0,
      edgesAdded: 0,
      errors: [] as string[],
    };

    if (action === "add") {
      // Add new nodes
      for (const nodeData of nodes) {
        try {
          const { walletAddress, nodeType = "wallet" } = nodeData;

          if (!walletAddress || !isValidAddress(walletAddress)) {
            results.errors.push(`Invalid wallet address: ${walletAddress}`);
            continue;
          }

          // Ensure wallet exists
          const existingWallet = await db
            .select()
            .from(wallets)
            .where(eq(wallets.address, walletAddress.toLowerCase()))
            .limit(1);

          if (existingWallet.length === 0) {
            await db.insert(wallets).values({
              address: walletAddress.toLowerCase(),
              chain: nodeData.chain || "ethereum",
              ownerName: nodeData.ownerName || null,
            });
          }

          // Check if node already exists in this graph
          const existingNode = await db
            .select()
            .from(graphNodes)
            .where(
              and(
                eq(graphNodes.graphId, graphId),
                eq(graphNodes.walletAddress, walletAddress.toLowerCase())
              )
            )
            .limit(1);

          if (existingNode.length === 0) {
            await db.insert(graphNodes).values({
              graphId,
              walletAddress: walletAddress.toLowerCase(),
              nodeType,
            });
            results.nodesAdded++;
          }
        } catch (error) {
          results.errors.push(
            `Error adding node ${nodeData.walletAddress}: ${error}`
          );
        }
      }

      // Add new edges
      for (const edgeData of edges) {
        try {
          const {
            fromWalletAddress,
            toWalletAddress,
            transactionHash,
            amount,
            timestamp,
          } = edgeData;

          if (
            !fromWalletAddress ||
            !toWalletAddress ||
            !isValidAddress(fromWalletAddress) ||
            !isValidAddress(toWalletAddress)
          ) {
            results.errors.push(
              `Invalid edge addresses: ${fromWalletAddress} -> ${toWalletAddress}`
            );
            continue;
          }

          await db.insert(graphEdges).values({
            graphId,
            fromWalletAddress: fromWalletAddress.toLowerCase(),
            toWalletAddress: toWalletAddress.toLowerCase(),
            transactionHash: transactionHash || null,
            amount: amount || null,
            timestamp: timestamp ? new Date(timestamp) : null,
          });
          results.edgesAdded++;
        } catch (error) {
          results.errors.push(`Error adding edge: ${error}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Graph updated successfully",
      results,
    });
  } catch (error) {
    console.error("Error updating graph:", error);
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
  const ethRegex = /^0x[a-fA-F0-9]{40}$/;
  const tronRegex = /^T[A-Za-z1-9]{33}$/;
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

  return Math.min(100, Math.max(0, totalRisk / tags.length));
}

function getSafetyLevel(riskScore: number): string {
  if (riskScore <= 30) return "safe";
  if (riskScore <= 70) return "caution";
  return "dangerous";
}
