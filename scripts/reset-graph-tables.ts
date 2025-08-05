import { config } from 'dotenv';
config();

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { graphNodes, graphEdges } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/demo_tracer';
const client = postgres(connectionString);
const db = drizzle(client);

async function resetGraphTables(): Promise<void> {
  try {
    console.log('🗑️  Resetting graph tables...');
    
    // Count existing records first
    const edgeCountBefore = await db.select({ count: sql<number>`count(*)` }).from(graphEdges);
    const nodeCountBefore = await db.select({ count: sql<number>`count(*)` }).from(graphNodes);
    
    console.log(`📊 Current data: ${edgeCountBefore[0].count} edges, ${nodeCountBefore[0].count} nodes`);
    
    // Delete all graph edges first (due to foreign key constraints)
    console.log('Deleting all graph edges...');
    await db.delete(graphEdges);
    console.log(`✅ Deleted ${edgeCountBefore[0].count} graph edges`);
    
    // Delete all graph nodes
    console.log('Deleting all graph nodes...');
    await db.delete(graphNodes);
    console.log(`✅ Deleted ${nodeCountBefore[0].count} graph nodes`);
    
    console.log('🎉 Graph tables reset successfully!');
    
  } catch (error) {
    console.error('❌ Reset failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function main() {
  try {
    await resetGraphTables();
    console.log('\n✨ Reset completed successfully!');
  } catch (error) {
    console.error('\n💥 Reset failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { resetGraphTables };