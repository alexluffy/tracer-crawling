import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { graphNodes, wallets, walletTags, graphEdges } from '@/lib/db/schema';
import { eq, and, or, sql } from 'drizzle-orm';

/**
 * @swagger
 * /api/v1/wallets/{address}/node/{nodeId}/connections:
 *   get:
 *     summary: Get connected nodes for a specific node
 *     description: Retrieves nodes that are directly connected to the specified node with pagination support
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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *         description: Number of connections per page
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [incoming, outgoing, both]
 *           default: both
 *         description: Direction of connections to fetch
 *     responses:
 *       200:
 *         description: Connected nodes retrieved successfully
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
 *                     connections:
 *                       type: array
 *                     pagination:
 *                       type: object
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
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const direction = url.searchParams.get('direction') || 'both';
    const offset = (page - 1) * limit;

    // Validate parameters
    if (!address || !nodeId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    if (!['incoming', 'outgoing', 'both'].includes(direction)) {
      return NextResponse.json(
        { success: false, error: 'Invalid direction parameter' },
        { status: 400 }
      );
    }

    // Verify node exists
    const node = await db
      .select({ id: graphNodes.id, graphId: graphNodes.graphId })
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

    // Build edge condition based on direction
    let edgeCondition;
    if (direction === 'incoming') {
      edgeCondition = and(
        eq(graphEdges.graphId, nodeData.graphId),
        eq(graphEdges.toNodeId, nodeData.id)
      );
    } else if (direction === 'outgoing') {
      edgeCondition = and(
        eq(graphEdges.graphId, nodeData.graphId),
        eq(graphEdges.fromNodeId, nodeData.id)
      );
    } else {
      edgeCondition = and(
        eq(graphEdges.graphId, nodeData.graphId),
        or(
          eq(graphEdges.fromNodeId, nodeData.id),
          eq(graphEdges.toNodeId, nodeData.id)
        )
      );
    }

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(graphEdges)
      .where(edgeCondition);

    const totalConnections = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalConnections / limit);

    // Get edges with connected node information
    const edgesWithNodes = await db
      .select({
        edgeId: graphEdges.id,
        fromNodeId: graphEdges.fromNodeId,
        toNodeId: graphEdges.toNodeId,
        edgeType: graphEdges.edgeType,
        amount: graphEdges.amount,
        transactionHash: graphEdges.transactionHash,
        timestamp: graphEdges.timestamp,
        // Connected node info
        connectedNodeId: sql<number>`
          CASE 
            WHEN ${graphEdges.fromNodeId} = ${nodeData.id} THEN ${graphEdges.toNodeId}
            ELSE ${graphEdges.fromNodeId}
          END
        `,
      })
      .from(graphEdges)
      .where(edgeCondition)
      .limit(limit)
      .offset(offset);

    // Get connected nodes details
    const connectedNodeIds = edgesWithNodes.map(edge => edge.connectedNodeId);
    const connectedNodes = connectedNodeIds.length > 0 ? await db
      .select({
        id: graphNodes.id,
        walletAddress: graphNodes.walletAddress,
        nodeType: graphNodes.nodeType,
      })
      .from(graphNodes)
      .where(sql`${graphNodes.id} = ANY(ARRAY[${connectedNodeIds.map(() => '?').join(',')}])`, ...connectedNodeIds) : [];

    // Get wallet info for connected nodes
    const walletAddresses = connectedNodes.map(node => node.walletAddress);
    const walletsInfo = walletAddresses.length > 0 ? await db
      .select()
      .from(wallets)
      .where(sql`${wallets.address} = ANY(ARRAY[${walletAddresses.map(() => '?').join(',')}])`, ...walletAddresses) : [];

    // Get tags for connected nodes
    const allTags = walletAddresses.length > 0 ? await db
      .select()
      .from(walletTags)
      .where(sql`${walletTags.walletAddress} = ANY(ARRAY[${walletAddresses.map(() => '?').join(',')}])`, ...walletAddresses) : [];

    // Create maps for quick lookup
    const walletMap = new Map();
    walletsInfo.forEach(wallet => {
      walletMap.set(wallet.address, wallet);
    });

    const tagsByWallet: Record<string, any[]> = {};
    allTags.forEach(tag => {
      if (!tagsByWallet[tag.walletAddress]) {
        tagsByWallet[tag.walletAddress] = [];
      }
      tagsByWallet[tag.walletAddress].push(tag);
    });

    const nodeMap = new Map();
    connectedNodes.forEach(node => {
      nodeMap.set(node.id, {
        ...node,
        wallet: walletMap.get(node.walletAddress) || null,
        tags: tagsByWallet[node.walletAddress] || [],
      });
    });

    // Combine edges with node information
    const connections = edgesWithNodes.map(edge => ({
      edge: {
        id: edge.edgeId,
        fromNodeId: edge.fromNodeId,
        toNodeId: edge.toNodeId,
        edgeType: edge.edgeType,
        amount: edge.amount,
        transactionHash: edge.transactionHash,
        timestamp: edge.timestamp,
      },
      connectedNode: nodeMap.get(edge.connectedNodeId) || null,
      direction: edge.fromNodeId === nodeData.id ? 'outgoing' : 'incoming',
    }));

    return NextResponse.json({
      success: true,
      data: {
        connections,
        pagination: {
          page,
          limit,
          total: totalConnections,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching node connections:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}