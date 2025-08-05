import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { graphNodes, wallets, walletTags, graphEdges } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';

/**
 * @swagger
 * /api/v1/wallets/{address}/node/{nodeId}:
 *   get:
 *     summary: Get detailed information for a specific node
 *     description: Retrieves detailed information about a specific node including wallet details, tags, and connected edges
 *     tags:
 *       - Wallets
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: The wallet address
 *       - in: path
 *         name: nodeId
 *         required: true
 *         schema:
 *           type: string
 *         description: The node ID
 *     responses:
 *       200:
 *         description: Node details retrieved successfully
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
 *                     node:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         walletAddress:
 *                           type: string
 *                         nodeType:
 *                           type: string
 *                         wallet:
 *                           type: object
 *                         tags:
 *                           type: array
 *                         connectedEdges:
 *                           type: array
 *       404:
 *         description: Node not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string; nodeId: string } }
) {
  try {
    const { address, nodeId } = await params;

    // Validate parameters
    if (!address || !nodeId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validate nodeId is a valid number
    const nodeIdNum = parseInt(nodeId);
    if (isNaN(nodeIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid node ID' },
        { status: 400 }
      );
    }

    // Get the specific node
    const node = await db
      .select({
        id: graphNodes.id,
        walletAddress: graphNodes.walletAddress,
        nodeType: graphNodes.nodeType,
        graphId: graphNodes.graphId,
      })
      .from(graphNodes)
      .where(eq(graphNodes.id, parseInt(nodeId)))
      .limit(1);

    if (node.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Node not found' },
        { status: 404 }
      );
    }

    const nodeData = node[0];

    // Get wallet information
    const walletInfo = await db
      .select()
      .from(wallets)
      .where(eq(wallets.address, nodeData.walletAddress))
      .limit(1);

    // Get wallet tags
    const tags = await db
      .select()
      .from(walletTags)
      .where(eq(walletTags.walletAddress, nodeData.walletAddress));

    // Get connected edges (both incoming and outgoing)
    const connectedEdges = await db
      .select({
        id: graphEdges.id,
        fromNodeId: graphEdges.fromNodeId,
        toNodeId: graphEdges.toNodeId,
        edgeType: graphEdges.edgeType,
        amount: graphEdges.amount,
        transactionHash: graphEdges.transactionHash,
        timestamp: graphEdges.timestamp,
      })
      .from(graphEdges)
      .where(
        and(
          eq(graphEdges.graphId, nodeData.graphId),
          or(
            eq(graphEdges.fromNodeId, nodeData.id),
            eq(graphEdges.toNodeId, nodeData.id)
          )
        )
      );

    return NextResponse.json({
      success: true,
      data: {
        node: {
          id: nodeData.id,
          walletAddress: nodeData.walletAddress,
          nodeType: nodeData.nodeType,
          wallet: walletInfo[0] || null,
          tags: tags || [],
          connectedEdges: connectedEdges || [],
        },
      },
    });
  } catch (error) {
    console.error('Error fetching node details:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}