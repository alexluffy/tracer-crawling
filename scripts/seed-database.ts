// scripts/seed.ts
import { db } from "@/lib/db";
import {
  users,
  wallets,
  walletTags,
  scamDetails,
  walletGraphs,
  graphNodes,
  graphEdges,
} from "../src/lib/db/schema";

async function seedDatabase() {
  console.log("Seeding database...");

  const [seededUser] = await db
    .insert(users)
    .values({
      id: "user_seed_1",
      name: "Admin User",
      email: "admin@example.com",
    })
    .returning();

  await db.insert(wallets).values([
    {
      address: "0x1111111111111111111111111111111111111111",
      ownerName: "Known Hacker",
      chain: "ethereum",
    },
    {
      address: "0x2222222222222222222222222222222222222222",
      ownerName: "Famous KOL",
      chain: "ethereum",
    },
    {
      address: "0x3333333333333333333333333333333333333333",
      chain: "ethereum",
    },
    {
      address: "0x4444444444444444444444444444444444444444",
      chain: "ethereum",
    },
  ]);

  await db.insert(walletTags).values([
    {
      walletAddress: "0x1111111111111111111111111111111111111111",
      tagType: "hacker",
      addedBy: seededUser.id,
    },
    {
      walletAddress: "0x1111111111111111111111111111111111111111",
      tagType: "scam",
      addedBy: seededUser.id,
    },
    {
      walletAddress: "0x2222222222222222222222222222222222222222",
      tagType: "kol",
      addedBy: seededUser.id,
    },
  ]);

  await db.insert(scamDetails).values({
    walletAddress: "0x1111111111111111111111111111111111111111",
    reason: "Ronin Bridge Exploit",
    scamLink:
      "https://www.coindesk.com/tech/2022/03/29/axie-infinitys-ronin-network-suffers-625m-exploit/",
    twitterHandle: "@Ronin_Network",
  });

  const [graph] = await db
    .insert(walletGraphs)
    .values({
      rootWalletAddress: "0x2222222222222222222222222222222222222222",
    })
    .returning();

  // 6. Thêm nodes và edges cho graph đó
  await db.insert(graphNodes).values([
    {
      graphId: graph.id,
      walletAddress: "0x2222222222222222222222222222222222222222",
    },
    {
      graphId: graph.id,
      walletAddress: "0x3333333333333333333333333333333333333333",
    },
    {
      graphId: graph.id,
      walletAddress: "0x4444444444444444444444444444444444444444",
    },
  ]);

  await db.insert(graphEdges).values([
    {
      graphId: graph.id,
      transactionHash: "0xabc...",
      fromWalletAddress: "0x2222222222222222222222222222222222222222",
      toWalletAddress: "0x3333333333333333333333333333333333333333",
      amount: "10.5",
      timestamp: new Date(),
    },
    {
      graphId: graph.id,
      transactionHash: "0xdef...",
      fromWalletAddress: "0x3333333333333333333333333333333333333333",
      toWalletAddress: "0x4444444444444444444444444444444444444444",
      amount: "2.1",
      timestamp: new Date(),
    },
  ]);

  console.log("Database seeded successfully!");
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error("Failed to seed database:", err);
  process.exit(1);
});
