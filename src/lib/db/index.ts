import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { config } from "dotenv";

config({
  path: ".env",
});

// Read DATABASE_URL from environment variables
const postgresURL = process.env.DATABASE_URL!;
console.log(postgresURL);
if (!postgresURL) {
  throw new Error(
    "DATABASE_URL is not defined. Please create a .env.local file with your database connection string."
  );
}

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(postgresURL, { prepare: false });
export const db = drizzle(client, { schema });

export type Database = typeof db;
