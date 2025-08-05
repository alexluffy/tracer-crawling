import { config } from "dotenv";
config();

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  wallets,
  walletGraphs,
  graphNodes,
  graphEdges,
} from "../src/lib/db/schema";
import { eq, and } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

// Database connection
const connectionString =
  process.env.DATABASE_URL || "postgresql://localhost:5432/demo_tracer";
const client = postgres(connectionString);
const db = drizzle(client);

interface GraphData {
  nodes: string[];
  edges: {
    from: string;
    to: string;
    value: string;
    hash: string;
  }[];
}

// Function to determine chain from address
function getChainFromAddress(address: string): string {
  // Ethereum addresses are 42 characters long (0x + 40 hex chars)
  if (address.length === 42 && address.startsWith("0x")) {
    return "ethereum";
  }
  // Bitcoin addresses can be various formats, but typically shorter
  return "bitcoin";
}

// Function to ensure wallets exist in database (batch processing)
async function ensureWalletsExist(addresses: string[]): Promise<void> {
  try {
    console.log(`Checking ${addresses.length} wallets...`);

    // Get existing wallets
    const existingWallets = await db
      .select({ address: wallets.address })
      .from(wallets);

    const existingAddresses = new Set(
      existingWallets.map((w) => w.address.toLowerCase())
    );

    // Find wallets that need to be created
    const newWallets = addresses
      .map((addr) => addr.toLowerCase())
      .filter((addr) => !existingAddresses.has(addr))
      .map((address) => ({
        address,
        ownerName: `Wallet ${address.slice(0, 8)}...`,
        chain: getChainFromAddress(address),
        searchCount: 0,
      }));

    if (newWallets.length > 0) {
      console.log(`Creating ${newWallets.length} new wallets...`);

      // Insert in batches
      const batchSize = 100;
      for (let i = 0; i < newWallets.length; i += batchSize) {
        const batch = newWallets.slice(i, i + batchSize);
        await db.insert(wallets).values(batch);
        console.log(
          `Created wallet batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
            newWallets.length / batchSize
          )}`
        );
      }
    } else {
      console.log("All wallets already exist in database.");
    }
  } catch (error) {
    console.error("Error ensuring wallets exist:", error);
    throw error;
  }
}

// Function to import graph data
async function importGraphData(filePath: string): Promise<void> {
  try {
    console.log(`Reading graph data from: ${filePath}`);

    // Read and parse JSON file
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const graphData: GraphData = JSON.parse(fileContent);

    console.log(
      `Found ${graphData.nodes.length} nodes and ${graphData.edges.length} edges`
    );

    // Extract root wallet address from filename
    const fileName = path.basename(filePath);
    const rootWalletMatch = fileName.match(/0x[a-fA-F0-9]{40}/);

    if (!rootWalletMatch) {
      throw new Error("Could not extract root wallet address from filename");
    }

    const rootWalletAddress = rootWalletMatch[0].toLowerCase();
    console.log(`Root wallet address: ${rootWalletAddress}`);

    // Ensure all wallets exist in database
    console.log("Ensuring all wallets exist in database...");
    const allAddresses = [...new Set([...graphData.nodes])];

    await ensureWalletsExist(allAddresses);

    // Check if graph already exists
    const existingGraph = await db
      .select()
      .from(walletGraphs)
      .where(eq(walletGraphs.rootWalletAddress, rootWalletAddress))
      .limit(1);

    let graphId: number;

    if (existingGraph.length > 0) {
      graphId = existingGraph[0].id;
      console.log(`Using existing graph with ID: ${graphId}`);

      // Clear existing nodes and edges
      await db.delete(graphEdges).where(eq(graphEdges.graphId, graphId));
      await db.delete(graphNodes).where(eq(graphNodes.graphId, graphId));
      console.log("Cleared existing graph data");
    } else {
      // Create new graph
      const [newGraph] = await db
        .insert(walletGraphs)
        .values({
          rootWalletAddress,
        })
        .returning({ id: walletGraphs.id });

      graphId = newGraph.id;
      console.log(`Created new graph with ID: ${graphId}`);
    }

    // Insert nodes
    console.log("Inserting graph nodes...");
    const nodeInserts = graphData.nodes.map((address) => ({
      graphId,
      walletAddress: address.toLowerCase(),
    }));

    // Insert nodes in batches to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < nodeInserts.length; i += batchSize) {
      const batch = nodeInserts.slice(i, i + batchSize);
      await db.insert(graphNodes).values(batch);
      console.log(
        `Inserted nodes batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          nodeInserts.length / batchSize
        )}`
      );
    }

    // Insert edges
    console.log("Inserting graph edges...");
    const edgeInserts = graphData.edges.map((edge) => ({
      graphId,
      transactionHash: edge.hash,
      fromWalletAddress: edge.from.toLowerCase(),
      toWalletAddress: edge.to.toLowerCase(),
      amount: edge.value,
    }));

    // Insert edges in batches
    for (let i = 0; i < edgeInserts.length; i += batchSize) {
      const batch = edgeInserts.slice(i, i + batchSize);
      await db.insert(graphEdges).values(batch);
      console.log(
        `Inserted edges batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          edgeInserts.length / batchSize
        )}`
      );
    }

    console.log("\n=== Import Summary ===");
    console.log(`Graph ID: ${graphId}`);
    console.log(`Root wallet: ${rootWalletAddress}`);
    console.log(`Total nodes: ${graphData.nodes.length}`);
    console.log(`Total edges: ${graphData.edges.length}`);
    console.log("Import completed successfully!");
  } catch (error) {
    console.error("Error importing graph data:", error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    const graphFilePath = path.join(
      __dirname,
      "../src/mock/mock-grapth-data/graph_tx_0x684DBab184c7437118698541a2f14880cF58A639_depth_4.json"
    );

    if (!fs.existsSync(graphFilePath)) {
      throw new Error(`Graph file not found: ${graphFilePath}`);
    }

    await importGraphData(graphFilePath);
  } catch (error) {
    console.error("Import failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { importGraphData };
