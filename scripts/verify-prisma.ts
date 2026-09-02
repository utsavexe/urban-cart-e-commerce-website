import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const result = await prisma.$queryRawUnsafe<{ result: number }[]>("SELECT 1 AS result");
    const userCount = await prisma.user.count();
    const categoryCount = await prisma.category.count();

    console.log("✅ Connected");
    console.log(`   Users: ${userCount}`);
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Raw query: ${JSON.stringify(result)}`);
  } catch (e) {
    console.error("❌ Connection failed:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
