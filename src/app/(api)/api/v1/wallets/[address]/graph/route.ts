import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { walletGraphs, graphNodes, graphEdges, wallets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

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
        },
      });
    }

    const graphId = graph[0].id;

    // Fetch nodes for this graph
    const nodes = await db
      .select()
      .from(graphNodes)
      .where(eq(graphNodes.graphId, graphId));

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
        nodes: nodes.map(node => ({
          id: node.id,
          walletAddress: node.walletAddress,
          nodeType: node.nodeType,
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