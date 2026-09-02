import { NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const results: string[] = [];

    const columns = [
      { table: "Product", column: "sourceUrl", type: "TEXT" },
      { table: "Product", column: "sourceSite", type: "TEXT" },
      { table: "Product", column: "sourcePrice", type: "DOUBLE PRECISION" },
      { table: "Product", column: "lastSyncedAt", type: "TIMESTAMP(3)" },
    ];

    for (const { table, column, type } of columns) {
      const check = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = '${table}' AND column_name = '${column}'
        ) as exists
      `);
      if (!check.rows[0].exists) {
        await pool.query(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${type}`);
        results.push(`Added ${table}.${column}`);
      } else {
        results.push(`${table}.${column} already exists`);
      }
    }

    const scrapeJobExists = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'ScrapeJob'
      ) as exists
    `);
    if (!scrapeJobExists.rows[0].exists) {
      await pool.query(`
        CREATE TABLE "ScrapeJob" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
          "query" TEXT NOT NULL,
          "platform" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'pending',
          "totalFound" INTEGER NOT NULL DEFAULT 0,
          "totalImported" INTEGER NOT NULL DEFAULT 0,
          "totalSkipped" INTEGER NOT NULL DEFAULT 0,
          "apifyRunId" TEXT,
          "errorMessage" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "ScrapeJob_pkey" PRIMARY KEY ("id")
        )
      `);
      results.push("Created ScrapeJob table");
    } else {
      results.push("ScrapeJob table already exists");
    }

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
