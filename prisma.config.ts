import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Load .env.local (dotenv/config only loads .env by default)
import { config } from "dotenv";
config({ path: path.join(__dirname, ".env.local") });

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),

  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },

  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
