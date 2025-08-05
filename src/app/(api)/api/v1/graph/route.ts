import { db } from "@/lib/db";
import { graphEdges, graphNodes, walletGraphs, wallets } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET /api/v1/graph - Lấy danh sách graphs hoặc theo filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rootWalletAddress = searchParams.get("rootWalletAddress");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const includeNodes = searchParams.get("includeNodes") === "true";
    const includeEdges = searchParams.get("includeEdges") === "true";

    // Validate limit
    if (limit > 50) {
      return NextResponse.json(
        {
          error: "Limit cannot exceed 50",
          code: "LIMIT_EXCEEDED",
        },
        { status: 400 }
      );
    }

    // Build base query
    const baseQuery = db
      .select({
        id: walletGraphs.id,
        rootWalletAddress: walletGraphs.rootWalletAddress,
        createdAt: walletGraphs.createdAt,
        // Join root wallet info
        rootWalletChain: wallets.chain,
        rootWalletOwnerName: wallets.ownerName,
      })
      .from(walletGraphs)
      .leftJoin(wallets, eq(walletGraphs.rootWalletAddress, wallets.address));

    // Apply filtering and pagination
    const graphs = await (rootWalletAddress
      ? baseQuery
          .where(
            eq(walletGraphs.rootWalletAddress, rootWalletAddress.toLowerCase())
          )
          .orderBy(desc(walletGraphs.createdAt))
          .limit(limit)
          .offset(offset)
      : baseQuery
          .orderBy(desc(walletGraphs.createdAt))
          .limit(limit)
          .offset(offset));

    // Get additional data if requested
    const results = [];
    for (const graph of graphs) {
      const result: any = {
        id: graph.id,
        rootWalletAddress: graph.rootWalletAddress,
        createdAt: graph.createdAt,
        rootWallet: {
          chain: graph.rootWalletChain,
          ownerName: graph.rootWalletOwnerName,
        },
      };

      // Include nodes if requested
      if (includeNodes) {
        const nodes = await db
          .select({
            id: graphNodes.id,
            walletAddress: graphNodes.walletAddress,
            nodeType: graphNodes.nodeType,
            // Join wallet info for each node
            walletChain: wallets.chain,
            walletOwnerName: wallets.ownerName,
          })
          .from(graphNodes)
          .leftJoin(wallets, eq(graphNodes.walletAddress, wallets.address))
          .where(eq(graphNodes.graphId, graph.id));

        result.nodes = nodes.map((node) => ({
          id: node.id,
          walletAddress: node.walletAddress,
          nodeType: node.nodeType,
          wallet: {
            chain: node.walletChain,
            ownerName: node.walletOwnerName,
          },
        }));
        result.nodeCount = nodes.length;
      }

      // Include edges if requested
      if (includeEdges) {
        const edges = await db
          .select()
          .from(graphEdges)
          .where(eq(graphEdges.graphId, graph.id));

        result.edges = edges.map((edge) => ({
          id: edge.id,
          fromWalletAddress: edge.fromWalletAddress,
          toWalletAddress: edge.toWalletAddress,
          transactionHash: edge.transactionHash,
          amount: edge.amount,
          timestamp: edge.timestamp,
        }));
        result.edgeCount = edges.length;
      }

      // Get basic counts if not including full data
      if (!includeNodes) {
        const nodeCount = await db
          .select({ count: graphNodes.id })
          .from(graphNodes)
          .where(eq(graphNodes.graphId, graph.id));
        result.nodeCount = nodeCount.length;
      }

      if (!includeEdges) {
        const edgeCount = await db
          .select({ count: graphEdges.id })
          .from(graphEdges)
          .where(eq(graphEdges.graphId, graph.id));
        result.edgeCount = edgeCount.length;
      }

      results.push(result);
    }

    return NextResponse.json({
      graphs: results,
      pagination: {
        limit,
        offset,
        total: results.length,
        hasMore: results.length === limit,
      },
      filters: {
        rootWalletAddress: rootWalletAddress || null,
        includeNodes,
        includeEdges,
      },
    });
  } catch (error) {
    console.error("Error fetching graphs:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

// POST /api/v1/graph - Tạo graph mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rootWalletAddress, nodes = [], edges = [] } = body;

    if (!rootWalletAddress || !isValidAddress(rootWalletAddress)) {
      return NextResponse.json(
        {
          error: "Valid root wallet address is required",
          code: "INVALID_ROOT_ADDRESS",
        },
        { status: 400 }
      );
    }

    // Validate nodes
    if (!Array.isArray(nodes) || nodes.length === 0) {
      return NextResponse.json(
        {
          error: "At least one node is required",
          code: "MISSING_NODES",
        },
        { status: 400 }
      );
    }

    // Validate edges
    if (!Array.isArray(edges)) {
      return NextResponse.json(
        {
          error: "Edges must be an array",
          code: "INVALID_EDGES",
        },
        { status: 400 }
      );
    }

    // Check if root wallet exists, create if not
    const existingRootWallet = await db
      .select()
      .from(wallets)
      .where(eq(wallets.address, rootWalletAddress.toLowerCase()))
      .limit(1);

    if (existingRootWallet.length === 0) {
      await db.insert(wallets).values({
        address: rootWalletAddress.toLowerCase(),
        chain: "ethereum", // Default chain
        ownerName: null,
      });
    }

    // Create the graph
    const [newGraph] = await db
      .insert(walletGraphs)
      .values({
        rootWalletAddress: rootWalletAddress.toLowerCase(),
      })
      .returning();

    // Create nodes
    const createdNodes = [];
    for (const nodeData of nodes) {
      const { walletAddress, nodeType = "wallet" } = nodeData;

      if (!walletAddress || !isValidAddress(walletAddress)) {
        continue; // Skip invalid addresses
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

      const [newNode] = await db
        .insert(graphNodes)
        .values({
          graphId: newGraph.id,
          walletAddress: walletAddress.toLowerCase(),
          nodeType,
        })
        .returning();

      createdNodes.push({
        id: newNode.id,
        walletAddress: newNode.walletAddress,
        nodeType: newNode.nodeType,
      });
    }

    // Create edges
    const createdEdges = [];
    for (const edgeData of edges) {
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
        continue; // Skip invalid edges
      }

      const [newEdge] = await db
        .insert(graphEdges)
        .values({
          graphId: newGraph.id,
          fromWalletAddress: fromWalletAddress.toLowerCase(),
          toWalletAddress: toWalletAddress.toLowerCase(),
          transactionHash: transactionHash || null,
          amount: amount || null,
          timestamp: timestamp ? new Date(timestamp) : null,
        })
        .returning();

      createdEdges.push({
        id: newEdge.id,
        fromWalletAddress: newEdge.fromWalletAddress,
        toWalletAddress: newEdge.toWalletAddress,
        transactionHash: newEdge.transactionHash,
        amount: newEdge.amount,
        timestamp: newEdge.timestamp,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Graph created successfully",
        graph: {
          id: newGraph.id,
          rootWalletAddress: newGraph.rootWalletAddress,
          createdAt: newGraph.createdAt,
          nodeCount: createdNodes.length,
          edgeCount: createdEdges.length,
          nodes: createdNodes,
          edges: createdEdges,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating graph:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

// Utility function
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
