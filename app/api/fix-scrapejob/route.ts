import { NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const results: string[] = [];

    // Drop old ScrapeJob table with wrong columns
    await pool.query(`DROP TABLE IF EXISTS "ScrapeJob" CASCADE`);
    results.push("Dropped old ScrapeJob table");

    // Recreate with correct schema from Prisma
    await pool.query(`
      CREATE TABLE "ScrapeJob" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "site" TEXT NOT NULL,
        "keyword" TEXT,
        "urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "totalScraped" INTEGER NOT NULL DEFAULT 0,
        "totalImported" INTEGER NOT NULL DEFAULT 0,
        "totalSkipped" INTEGER NOT NULL DEFAULT 0,
        "errorMessage" TEXT,
        "apifyRunId" TEXT,
        "datasetId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "completedAt" TIMESTAMP(3),
        CONSTRAINT "ScrapeJob_pkey" PRIMARY KEY ("id")
      )
    `);
    results.push("Created ScrapeJob with correct columns");

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
