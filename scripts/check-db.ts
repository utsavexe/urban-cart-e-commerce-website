import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const productCount = await db.product.count();
  const categoryCount = await db.category.count();
  const userCount = await db.user.count();
  console.log(`Products: ${productCount}`);
  console.log(`Categories: ${categoryCount}`);
  console.log(`Users: ${userCount}`);
  
  if (productCount === 0) {
    console.log("NO PRODUCTS IN DATABASE! Need to run seed.");
  }
  
  const sample = await db.product.findMany({ take: 3, select: { name: true, price: true, stock: true } });
  console.log("Sample products:", JSON.stringify(sample, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));
