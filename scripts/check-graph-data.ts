import { config } from 'dotenv';
config();

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { wallets, walletGraphs, graphNodes, graphEdges } from '../src/lib/db/schema';
import { count, sql, eq } from 'drizzle-orm';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/demo_tracer';
const client = postgres(connectionString);
const db = drizzle(client);

async function checkGraphData(): Promise<void> {
  try {
    console.log('=== Graph Data Statistics ===\n');
    
    // Count total graphs
    const totalGraphs = await db.select({ count: count() }).from(walletGraphs);
    console.log(`📊 Total Graphs: ${totalGraphs[0].count}`);
    
    // Count total nodes
    const totalNodes = await db.select({ count: count() }).from(graphNodes);
    console.log(`📍 Total Nodes: ${totalNodes[0].count}`);
    
    // Count total edges
    const totalEdges = await db.select({ count: count() }).from(graphEdges);
    console.log(`🔗 Total Edges: ${totalEdges[0].count}`);
    
    // Get all graphs
    const graphs = await db.select().from(walletGraphs).limit(10);
    
    console.log('\n📋 Recent Graphs:');
    for (const graph of graphs) {
      console.log(`\n🔗 Graph ID: ${graph.id}`);
      console.log(`   Root Wallet: ${graph.rootWalletAddress}`);
      console.log(`   Created: ${graph.createdAt?.toISOString()}`);
      
      // Count nodes for this graph
      const nodeCount = await db
        .select({ count: count() })
        .from(graphNodes)
        .where(eq(graphNodes.graphId, graph.id));
      
      // Count edges for this graph
      const edgeCount = await db
        .select({ count: count() })
        .from(graphEdges)
        .where(eq(graphEdges.graphId, graph.id));
      
      console.log(`   📍 Nodes: ${nodeCount[0]?.count || 0}`);
      console.log(`   🔗 Edges: ${edgeCount[0]?.count || 0}`);
    }
    
    // Sample nodes
    console.log('\n📍 Sample Nodes:');
    const sampleNodes = await db.select().from(graphNodes).limit(5);
    for (const node of sampleNodes) {
      console.log(`   - Graph ${node.graphId}: ${node.walletAddress} (${node.nodeType})`);
    }
    
    // Sample edges
    console.log('\n🔗 Sample Edges:');
    const sampleEdges = await db.select().from(graphEdges).limit(5);
    for (const edge of sampleEdges) {
      console.log(`   - Graph ${edge.graphId}: ${edge.fromWalletAddress} → ${edge.toWalletAddress}`);
      if (edge.amount) {
        console.log(`     Amount: ${edge.amount}`);
      }
      if (edge.transactionHash) {
        console.log(`     TX: ${edge.transactionHash}`);
      }
    }
    
    console.log('\n✅ Graph data check completed successfully!');
    
  } catch (error) {
    console.error('❌ Error checking graph data:', error);
    throw error;
  }
}

async function main() {
  try {
    await checkGraphData();
  } catch (error) {
    console.error('\n💥 Check failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  main();
}

export { checkGraphData };