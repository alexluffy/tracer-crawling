// src/db/schema.ts

import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
  numeric,
} from "drizzle-orm/pg-core";

// --- ENUMS ---
export const tagTypeEnum = pgEnum("tag_type", [
  "scam",
  "otc",
  "blacklist",
  "kol",
  "hacker",
  "f0_user",
]);

// --- AUTHENTICATION TABLES ---
export const users = pgTable("users", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey(account.provider, account.providerAccountId),
  })
);

// --- CORE APPLICATION TABLES ---

export const wallets = pgTable("wallets", {
  address: varchar("address", { length: 42 }).primaryKey(),
  ownerName: text("owner_name"),
  chain: text("chain").notNull(),
  searchCount: integer("search_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const walletTags = pgTable("wallet_tags", {
  id: serial("id").primaryKey(),
  walletAddress: varchar("wallet_address", { length: 42 })
    .notNull()
    .references(() => wallets.address, { onDelete: "cascade" }),
  tagType: tagTypeEnum("tag_type").notNull(),
  addedBy: text("added_by")
    .references(() => users.id, { onDelete: "set null" }), // Ai đã thêm tag
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scamDetails = pgTable("scam_details", {
  walletAddress: varchar("wallet_address", { length: 42 })
    .primaryKey()
    .references(() => wallets.address, { onDelete: "cascade" }),
  twitterHandle: text("twitter_handle"),
  reason: text("reason").notNull(),
  scamLink: text("scam_link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- GRAPH DATA TABLES ---

export const walletGraphs = pgTable("wallet_graphs", {
  id: serial("id").primaryKey(),
  rootWalletAddress: varchar("root_wallet_address", { length: 42 })
    .notNull()
    .references(() => wallets.address),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const graphNodes = pgTable("graph_nodes", {
  id: serial("id").primaryKey(),
  graphId: integer("graph_id")
    .notNull()
    .references(() => walletGraphs.id, { onDelete: "cascade" }),
  walletAddress: varchar("wallet_address", { length: 42 }).notNull(),
  nodeType: text("node_type").default("wallet").notNull(),
});

export const graphEdges = pgTable("graph_edges", {
  id: serial("id").primaryKey(),
  graphId: integer("graph_id")
    .notNull()
    .references(() => walletGraphs.id, { onDelete: "cascade" }),
  transactionHash: varchar("transaction_hash", { length: 66 }),
  fromWalletAddress: varchar("from_wallet_address", { length: 42 }).notNull(),
  toWalletAddress: varchar("to_wallet_address", { length: 42 }).notNull(),
  amount: numeric("amount", { precision: 30, scale: 18 }),
  timestamp: timestamp("timestamp"),
});

// --- RELATIONS ---

export const usersRelations = relations(users, ({ one, many }) => ({
  accounts: many(accounts),
  addedTags: many(walletTags),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  tags: many(walletTags),
  scamDetail: one(scamDetails, {
    fields: [wallets.address],
    references: [scamDetails.walletAddress],
  }),
  graphs: many(walletGraphs),
}));

export const walletTagsRelations = relations(walletTags, ({ one }) => ({
  wallet: one(wallets, {
    fields: [walletTags.walletAddress],
    references: [wallets.address],
  }),
  user: one(users, {
    fields: [walletTags.addedBy],
    references: [users.id],
  }),
}));

export const walletGraphsRelations = relations(
  walletGraphs,
  ({ one, many }) => ({
    rootWallet: one(wallets, {
      fields: [walletGraphs.rootWalletAddress],
      references: [wallets.address],
    }),
    nodes: many(graphNodes),
    edges: many(graphEdges),
  })
);

export const graphNodesRelations = relations(graphNodes, ({ one }) => ({
  graph: one(walletGraphs, {
    fields: [graphNodes.graphId],
    references: [walletGraphs.id],
  }),
}));

export const graphEdgesRelations = relations(graphEdges, ({ one }) => ({
  graph: one(walletGraphs, {
    fields: [graphEdges.graphId],
    references: [walletGraphs.id],
  }),
}));
