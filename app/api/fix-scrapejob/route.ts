import { NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const results: string[] = [];

  try {
    // Create ScrapedStatus enum if missing
    const enumExists = await pool.query(
      `SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ScrapedStatus') as exists`
    );
    if (!enumExists.rows[0].exists) {
      await pool.query(`CREATE TYPE "ScrapedStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'IMPORTED')`);
      results.push("Created ScrapedStatus enum");
    } else {
      results.push("ScrapedStatus enum already exists");
    }

    // Create ScrapedProduct table if missing
    const spExists = await pool.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ScrapedProduct') as exists`
    );
    if (!spExists.rows[0].exists) {
      await pool.query(`
        CREATE TABLE "ScrapedProduct" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
          "sourceSite" TEXT NOT NULL,
          "sourceUrl" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "currency" TEXT NOT NULL DEFAULT 'INR',
          "originalPrice" DOUBLE PRECISION,
          "image" TEXT,
          "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
          "brand" TEXT,
          "rating" DOUBLE PRECISION,
          "reviewCount" INTEGER,
          "category" TEXT,
          "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
          "rawJson" JSONB,
          "status" "ScrapedStatus" NOT NULL DEFAULT 'PENDING',
          "reviewedCategoryId" TEXT,
          "reviewedPrice" INTEGER,
          "importedProductId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "ScrapedProduct_pkey" PRIMARY KEY ("id")
        )
      `);
      results.push("Created ScrapedProduct table");
    } else {
      // Fix status column type if it's TEXT instead of enum
      const colCheck = await pool.query(
        `SELECT data_type FROM information_schema.columns WHERE table_name = 'ScrapedProduct' AND column_name = 'status'`
      );
      if (colCheck.rows[0]?.data_type === "text") {
        await pool.query(`ALTER TABLE "ScrapedProduct" ALTER COLUMN "status" TYPE "ScrapedStatus" USING "status"::"ScrapedStatus"`);
        results.push("Fixed ScrapedProduct.status column type");
      } else {
        results.push("ScrapedProduct already exists with correct schema");
      }
    }

    // Verify ScrapeJob columns
    const sjColumns = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'ScrapeJob' ORDER BY ordinal_position`
    );
    const sjCols = sjColumns.rows.map((r: { column_name: string }) => r.column_name);
    results.push(`ScrapeJob columns: ${sjCols.join(", ")}`);

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
