import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { walletGraphs, graphNodes, graphEdges, wallets, walletTags } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * @swagger
 * /api/v1/wallets/{address}/graph:
 *   get:
 *     summary: Get wallet transaction graph
 *     description: Retrieve the transaction flow graph for a specific wallet address
 *     tags:
 *       - Wallets
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address
 *     responses:
 *       200:
 *         description: Wallet graph data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                     rootWalletAddress:
 *                       type: string
 *                     nodes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: number
 *                           walletAddress:
 *                             type: string
 *                           nodeType:
 *                             type: string
 *                     edges:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: number
 *                           fromWalletAddress:
 *                             type: string
 *                           toWalletAddress:
 *                             type: string
 *                           transactionHash:
 *                             type: string
 *                           amount:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                     createdAt:
 *                       type: string
 *       404:
 *         description: Wallet or graph not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const nodeType = url.searchParams.get('nodeType'); // Optional filter
    const offset = (page - 1) * limit;

    // Validate address format (basic validation)
    if (!address || address.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid wallet address format',
        },
        { status: 400 }
      );
    }

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid pagination parameters. Page must be >= 1, limit must be 1-100',
        },
        { status: 400 }
      );
    }

    // Check if wallet exists
    const wallet = await db
      .select()
      .from(wallets)
      .where(eq(wallets.address, address))
      .limit(1);

    if (wallet.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Wallet not found',
        },
        { status: 404 }
      );
    }

    // Find graph for this wallet
    const graph = await db
      .select()
      .from(walletGraphs)
      .where(eq(walletGraphs.rootWalletAddress, address))
      .limit(1);

    if (graph.length === 0) {
      // Return empty graph structure if no graph exists
      return NextResponse.json({
        success: true,
        data: {
          id: null,
          rootWalletAddress: address,
          nodes: [],
          edges: [],
          createdAt: new Date().toISOString(),
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        },
      });
    }

    const graphId = graph[0].id;

    // Get total count of nodes for pagination
    const totalNodesQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(graphNodes)
      .where(nodeType ? and(eq(graphNodes.graphId, graphId), eq(graphNodes.nodeType, nodeType)) : eq(graphNodes.graphId, graphId));
    
    const totalNodesResult = await totalNodesQuery;
    const totalNodes = totalNodesResult[0]?.count || 0;
    const totalPages = Math.ceil(totalNodes / limit);

    // Fetch nodes for this graph with pagination
    const nodesQuery = db
      .select({
        id: graphNodes.id,
        walletAddress: graphNodes.walletAddress,
        nodeType: graphNodes.nodeType,
      })
      .from(graphNodes)
      .where(nodeType ? and(eq(graphNodes.graphId, graphId), eq(graphNodes.nodeType, nodeType)) : eq(graphNodes.graphId, graphId))
      .limit(limit)
      .offset(offset);
    
    const nodes = await nodesQuery;
    
    // Fetch all wallet info in one batch query
    const nodeAddresses = nodes.map(node => node.walletAddress);
    const walletsInfo = nodeAddresses.length > 0 ? await db
      .select()
      .from(wallets)
      .where(sql`${wallets.address} = ANY(ARRAY[${nodeAddresses.map(() => '?').join(',')}])`, ...nodeAddresses) : [];
    
    // Create a map for quick lookup
    const walletMap = new Map();
    walletsInfo.forEach(wallet => {
      walletMap.set(wallet.address, wallet);
    });
    
    // Combine nodes with wallet info
    const nodesWithWallets = nodes.map(node => ({
      ...node,
      wallet: walletMap.get(node.walletAddress) || null
    }));

    // Fetch all tags for all wallet addresses in one query
    const allTags = nodeAddresses.length > 0 ? await db
      .select()
      .from(walletTags)
      .where(sql`${walletTags.walletAddress} = ANY(ARRAY[${nodeAddresses.map(() => '?').join(',')}])`, ...nodeAddresses)
      : [];

    // Group tags by wallet address
    const tagsByWallet: Record<string, any[]> = {};
    allTags.forEach(tag => {
      if (!tagsByWallet[tag.walletAddress]) {
        tagsByWallet[tag.walletAddress] = [];
      }
      tagsByWallet[tag.walletAddress].push(tag);
    });

    // Fetch edges for this graph
    const edges = await db
      .select()
      .from(graphEdges)
      .where(eq(graphEdges.graphId, graphId));

    return NextResponse.json({
      success: true,
      data: {
        id: graph[0].id,
        rootWalletAddress: graph[0].rootWalletAddress,
        nodes: nodesWithWallets.map(node => ({
          id: node.id,
          walletAddress: node.walletAddress,
          nodeType: node.nodeType,
          wallet: node.wallet,
          tags: tagsByWallet[node.walletAddress] || [],
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          fromWalletAddress: edge.fromWalletAddress,
          toWalletAddress: edge.toWalletAddress,
          transactionHash: edge.transactionHash,
          amount: edge.amount,
          timestamp: edge.timestamp?.toISOString(),
        })),
        createdAt: graph[0].createdAt.toISOString(),
        pagination: {
          page,
          limit,
          total: totalNodes,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching wallet graph:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/v1/wallets/{address}/graph:
 *   post:
 *     summary: Create or update wallet transaction graph
 *     description: Create a new transaction graph or update existing one for a wallet
 *     tags:
 *       - Wallets
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nodes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     walletAddress:
 *                       type: string
 *                     nodeType:
 *                       type: string
 *               edges:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     fromWalletAddress:
 *                       type: string
 *                     toWalletAddress:
 *                       type: string
 *                     transactionHash:
 *                       type: string
 *                     amount:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *     responses:
 *       200:
 *         description: Graph created/updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Wallet not found
 *       500:
 *         description: Internal server error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const body = await request.json();

    // Validate address format
    if (!address || address.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid wallet address format',
        },
        { status: 400 }
      );
    }

    // Check if wallet exists
    const wallet = await db
      .select()
      .from(wallets)
      .where(eq(wallets.address, address))
      .limit(1);

    if (wallet.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Wallet not found',
        },
        { status: 404 }
      );
    }

    // Create or get existing graph
    let graph = await db
      .select()
      .from(walletGraphs)
      .where(eq(walletGraphs.rootWalletAddress, address))
      .limit(1);

    let graphId: number;

    if (graph.length === 0) {
      // Create new graph
      const newGraph = await db
        .insert(walletGraphs)
        .values({
          rootWalletAddress: address,
        })
        .returning();
      graphId = newGraph[0].id;
    } else {
      graphId = graph[0].id;
      
      // Clear existing nodes and edges
      await db.delete(graphNodes).where(eq(graphNodes.graphId, graphId));
      await db.delete(graphEdges).where(eq(graphEdges.graphId, graphId));
    }

    // Insert nodes if provided
    if (body.nodes && Array.isArray(body.nodes)) {
      for (const node of body.nodes) {
        await db.insert(graphNodes).values({
          graphId,
          walletAddress: node.walletAddress,
          nodeType: node.nodeType || 'wallet',
        });
      }
    }

    // Insert edges if provided
    if (body.edges && Array.isArray(body.edges)) {
      for (const edge of body.edges) {
        await db.insert(graphEdges).values({
          graphId,
          fromWalletAddress: edge.fromWalletAddress,
          toWalletAddress: edge.toWalletAddress,
          transactionHash: edge.transactionHash,
          amount: edge.amount,
          timestamp: edge.timestamp ? new Date(edge.timestamp) : null,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        graphId,
        message: 'Graph created/updated successfully',
      },
    });
  } catch (error) {
    console.error('Error creating/updating wallet graph:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}