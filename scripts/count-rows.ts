import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const products = await prisma.product.count();
  const categories = await prisma.category.count();
  const users = await prisma.user.count();
  const scraped = await prisma.scrapedProduct.count();

  console.log("Products:", products);
  console.log("Categories:", categories);
  console.log("Users:", users);
  console.log("ScrapedProducts:", scraped);

  await prisma.$disconnect();
  await pool.end();
}

main();
