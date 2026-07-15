import { PrismaClient, DiscountType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Truncate tables referencing products to start with a fresh clean database
  await prisma.cartItem.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});

  // ─── Admin + Demo User ──────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const userPassword = await bcrypt.hash("User@123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@urbancart.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@urbancart.com",
      hashedPassword: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "user@urbancart.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "user@urbancart.com",
      hashedPassword: userPassword,
      role: "USER",
      emailVerified: new Date(),
    },
  });

  console.log(`  ✅ Users: admin (${admin.email}), demo (${demoUser.email})`);

  // ─── Categories (parent + children) ─────────────────────────

  const categoriesData = [
    {
      name: "Clothes",
      image: "/clothing-rack.png",
      children: [
        { name: "Shirt", image: "/casual-tshirt-on-white.jpg" },
        { name: "Shorts & Jeans", image: "/denim-jeans.png" },
        { name: "Jacket", image: "/classic-leather-jacket.png" },
        { name: "Dress & Frock", image: "/elegant-dress.png" },
        { name: "T-shirts", image: "/casual-tshirt.png" },
        { name: "Winter Wear", image: "/winter-jacket.png" },
      ],
    },
    {
      name: "Footwear",
      image: "/diverse-sneaker-collection.png",
      children: [
        { name: "Sports Shoes", image: "/images/shoes.png" },
        { name: "Formal Shoes", image: "/elegant-heels.jpg" },
        { name: "Casual Shoes", image: "/black-athletic-shoes.jpg" },
      ],
    },
    {
      name: "Jewelry",
      image: "/gold-jewelry.jpg",
      children: [
        { name: "Earrings", image: "/rose-gold-diamond-earrings.jpg" },
        { name: "Necklace", image: "/silver-heart-necklace.png" },
        { name: "Rings", image: "/gold-jewelry.jpg" },
      ],
    },
    {
      name: "Perfume",
      image: "/perfume-bottles.png",
      children: [
        { name: "Men's Perfume", image: "/perfume-bottles.png" },
        { name: "Women's Perfume", image: "/perfume-bottles.png" },
      ],
    },
    {
      name: "Watches",
      image: "/luxury-watch.jpg",
      children: [
        { name: "Smart Watch", image: "/modern-smartwatch.png" },
        { name: "Classic Watch", image: "/luxury-watch.jpg" },
      ],
    },
    {
      name: "Accessories",
      image: "/stylish-sunglasses.png",
      children: [
        { name: "Belts", image: "/leather-belt.png" },
        { name: "Sunglasses", image: "/stylish-sunglasses.png" },
        { name: "Hat & Caps", image: "/baseball-cap.png" },
        { name: "Bags", image: "/stylish-sunglasses.png" },
      ],
    },
    {
      name: "Beauty & Care",
      image: "/shampoo-conditioner-product-set.jpg",
      children: [],
    },
  ];

  const categoryMap: Record<string, string> = {};

  for (const cat of categoriesData) {
    const parent = await prisma.category.upsert({
      where: { slug: slug(cat.name) },
      update: {},
      create: {
        name: cat.name,
        slug: slug(cat.name),
        image: cat.image,
      },
    });
    categoryMap[cat.name] = parent.id;

    for (const child of cat.children) {
      const sub = await prisma.category.upsert({
        where: { slug: slug(child.name) },
        update: {},
        create: {
          name: child.name,
          slug: slug(child.name),
          image: child.image,
          parentId: parent.id,
        },
      });
      categoryMap[child.name] = sub.id;
    }
  }

  console.log(`  ✅ Categories: ${Object.keys(categoryMap).length} created`);

  // ─── Products (70 products, 10 per category) ─────────────────────────

  const products = [
    // ── Clothes ──
    { name: "Relaxed Fit Cotton T-Shirt", category: "T-shirts", price: 129900, originalPrice: 199900, image: "/casual-tshirt-on-white.jpg", stock: 120, isNewArrival: true, tags: ["casual", "cotton", "men"] },
    { name: "Girls Pink Embroidered Top", category: "Shirt", price: 149900, originalPrice: 229900, image: "/pink-embroidered-top.jpg", stock: 80, isNewArrival: true, tags: ["girls", "embroidery", "pink"] },
    { name: "Black Floral Wrap Midi Skirt", category: "Dress & Frock", price: 189900, originalPrice: 299900, image: "/black-floral-skirt.jpg", stock: 65, isNewArrival: true, tags: ["women", "floral", "midi"] },
    { name: "Pure Garment Dyed Cotton Shirt", category: "Shirt", price: 249900, originalPrice: 349900, image: "/cotton-dress-shirt.jpg", stock: 95, isNewArrival: true, tags: ["men", "cotton", "formal"] },
    { name: "Classic Denim Straight Jeans", category: "Shorts & Jeans", price: 299900, originalPrice: 449900, image: "/denim-jeans.png", stock: 100, isTrending: true, tags: ["men", "denim", "classic"] },
    { name: "Slim Fit Cotton Chinos", category: "Shorts & Jeans", price: 199900, originalPrice: 299900, image: "/denim-jeans.png", stock: 100, tags: ["men", "cotton", "casual"] },
    { name: "Premium Leather Biker Jacket", category: "Jacket", price: 799900, originalPrice: 1199900, image: "/classic-leather-jacket.png", stock: 30, isFeatured: true, tags: ["men", "leather", "premium"] },
    { name: "Elegant Evening Gown", category: "Dress & Frock", price: 599900, originalPrice: 899900, image: "/elegant-dress.png", stock: 40, isFeatured: true, tags: ["women", "evening", "formal"] },
    { name: "Wool Blend Winter Coat", category: "Winter Wear", price: 699900, originalPrice: 999900, image: "/winter-jacket.png", stock: 45, isTopRated: true, tags: ["unisex", "winter", "wool"] },
    { name: "Striped Polo T-Shirt", category: "T-shirts", price: 119900, originalPrice: 179900, image: "/casual-tshirt.png", stock: 150, tags: ["men", "polo", "casual"] },

    // ── Footwear ──
    { name: "Running & Trekking Shoes - White", category: "Sports Shoes", price: 349900, originalPrice: 499900, image: "/images/shoes.png", stock: 90, isTrending: true, tags: ["men", "running", "white"] },
    { name: "Trekking & Running Shoes - Black", category: "Sports Shoes", price: 399900, originalPrice: 549900, image: "/black-athletic-shoes.jpg", stock: 85, isTrending: true, tags: ["men", "trekking", "black"] },
    { name: "Women's Party Wear Heels", category: "Formal Shoes", price: 299900, originalPrice: 449900, image: "/elegant-heels.jpg", stock: 55, isTrending: true, tags: ["women", "party", "heels"] },
    { name: "Sports Claw Women's Shoes", category: "Sports Shoes", price: 329900, originalPrice: 479900, image: "/womens-sports-shoes.jpg", stock: 75, isTrending: true, tags: ["women", "sports", "athletic"] },
    { name: "Classic Canvas Sneakers", category: "Casual Shoes", price: 189900, originalPrice: 279900, image: "/black-athletic-shoes.jpg", stock: 110, isNewArrival: true, tags: ["unisex", "canvas", "casual"] },
    { name: "Premium Leather Loafers", category: "Formal Shoes", price: 449900, originalPrice: 649900, image: "/elegant-heels.jpg", stock: 40, isFeatured: true, tags: ["men", "leather", "formal"] },
    { name: "Leather Chelsea Boots", category: "Formal Shoes", price: 549900, originalPrice: 799900, image: "/elegant-heels.jpg", stock: 35, isFeatured: true, tags: ["men", "leather", "chelsea"] },
    { name: "Lightweight Training Shoes", category: "Sports Shoes", price: 249900, originalPrice: 399900, image: "/images/shoes.png", stock: 80, tags: ["unisex", "training", "lightweight"] },
    { name: "Daily Wear Slip-on Sneakers", category: "Casual Shoes", price: 149900, originalPrice: 219900, image: "/black-athletic-shoes.jpg", stock: 100, tags: ["unisex", "casual", "slipon"] },
    { name: "Leather Gladiator Sandals", category: "Casual Shoes", price: 199900, originalPrice: 299900, image: "/elegant-heels.jpg", stock: 60, tags: ["women", "sandals", "leather"] },

    // ── Jewelry ──
    { name: "Rose Gold Diamond Earring", category: "Earrings", price: 1999900, originalPrice: 2999900, image: "/rose-gold-diamond-earrings.jpg", stock: 15, isDealOfDay: true, isFeatured: true, tags: ["women", "diamond", "rose-gold"] },
    { name: "Silver Deer Heart Necklace", category: "Necklace", price: 189900, originalPrice: 299900, image: "/silver-heart-necklace.png", stock: 50, isTopRated: true, tags: ["women", "silver", "heart"] },
    { name: "Pearl Drop Earrings", category: "Earrings", price: 149900, originalPrice: 229900, image: "/rose-gold-diamond-earrings.jpg", stock: 60, isTopRated: true, tags: ["women", "pearl", "elegant"] },
    { name: "Gold Plated Chain Necklace", category: "Necklace", price: 129900, originalPrice: 199900, image: "/silver-heart-necklace.png", stock: 70, tags: ["women", "gold", "chain"] },
    { name: "Diamond Solitaire Ring", category: "Rings", price: 2499900, originalPrice: 3499900, image: "/gold-jewelry.jpg", stock: 10, isFeatured: true, tags: ["women", "diamond", "engagement"] },
    { name: "Sterling Silver Cuff Bracelet", category: "Rings", price: 219900, originalPrice: 329900, image: "/gold-jewelry.jpg", stock: 45, tags: ["unisex", "silver", "cuff"] },
    { name: "Zirconia Pendant Necklace", category: "Necklace", price: 159900, originalPrice: 249900, image: "/silver-heart-necklace.png", stock: 65, tags: ["women", "zirconia", "pendant"] },
    { name: "Silver Wedding Band", category: "Rings", price: 179900, originalPrice: 279900, image: "/gold-jewelry.jpg", stock: 40, tags: ["unisex", "silver", "ring"] },
    { name: "Gold Hoops Earrings Set", category: "Earrings", price: 99900, originalPrice: 149900, image: "/rose-gold-diamond-earrings.jpg", stock: 80, tags: ["women", "gold", "hoops"] },
    { name: "Minimalist Silver Anklet", category: "Rings", price: 79900, originalPrice: 119900, image: "/gold-jewelry.jpg", stock: 90, tags: ["women", "silver", "anklet"] },

    // ── Perfume ──
    { name: "Ocean Breeze Eau de Toilette", category: "Men's Perfume", price: 189900, originalPrice: 279900, image: "/perfume-bottles.png", stock: 80, isTrending: true, tags: ["men", "fresh", "ocean"] },
    { name: "Midnight Oud Premium Perfume", category: "Men's Perfume", price: 349900, originalPrice: 499900, image: "/perfume-bottles.png", stock: 35, isFeatured: true, tags: ["men", "oud", "premium"] },
    { name: "Rose Garden Women's Perfume", category: "Women's Perfume", price: 219900, originalPrice: 329900, image: "/perfume-bottles.png", stock: 65, isTrending: true, tags: ["women", "rose", "floral"] },
    { name: "Velvet Noir Eau de Parfum", category: "Women's Perfume", price: 299900, originalPrice: 429900, image: "/perfume-bottles.png", stock: 40, tags: ["women", "noir", "luxury"] },
    { name: "Citrus Fresh Sport Cologne", category: "Men's Perfume", price: 149900, originalPrice: 219900, image: "/perfume-bottles.png", stock: 100, tags: ["men", "citrus", "sport"] },
    { name: "Lavender Fields Perfume Mist", category: "Women's Perfume", price: 99900, originalPrice: 149900, image: "/perfume-bottles.png", stock: 120, tags: ["women", "lavender", "fresh"] },
    { name: "Amber Gold Intense Parfum", category: "Men's Perfume", price: 449900, originalPrice: 599900, image: "/perfume-bottles.png", stock: 45, tags: ["men", "amber", "intense"] },
    { name: "Sweet Jasmine Blossom Perfume", category: "Women's Perfume", price: 179900, originalPrice: 249900, image: "/perfume-bottles.png", stock: 70, tags: ["women", "jasmine", "sweet"] },
    { name: "Sandalwood Forest Cologne", category: "Men's Perfume", price: 249900, originalPrice: 349900, image: "/perfume-bottles.png", stock: 55, tags: ["men", "sandalwood", "woody"] },
    { name: "Cherry Blossom Body Splash", category: "Women's Perfume", price: 89900, originalPrice: 129900, image: "/perfume-bottles.png", stock: 150, tags: ["women", "cherry", "sweet"] },

    // ── Watches ──
    { name: "Pocket Watch Leather Pouch", category: "Classic Watch", price: 129900, originalPrice: 199900, image: "/leather-watch-case.jpg", stock: 30, isTopRated: true, tags: ["vintage", "leather", "pocket"] },
    { name: "Smart Watch Vital Plus", category: "Smart Watch", price: 499900, originalPrice: 799900, image: "/modern-smartwatch.png", stock: 50, isTopRated: true, isFeatured: true, tags: ["smart", "fitness", "health"] },
    { name: "Classic Chronograph Watch", category: "Classic Watch", price: 599900, originalPrice: 899900, image: "/luxury-watch.jpg", stock: 25, isFeatured: true, tags: ["men", "chronograph", "classic"] },
    { name: "Fitness Tracker Band Pro", category: "Smart Watch", price: 199900, originalPrice: 299900, image: "/modern-smartwatch.png", stock: 100, tags: ["fitness", "tracker", "waterproof"] },
    { name: "Luxury Dress Watch Gold", category: "Classic Watch", price: 799900, originalPrice: 1199900, image: "/luxury-watch.jpg", stock: 15, tags: ["men", "gold", "luxury"] },
    { name: "Minimalist Leather Watch", category: "Classic Watch", price: 249900, originalPrice: 399900, image: "/luxury-watch.jpg", stock: 65, tags: ["unisex", "minimalist", "leather"] },
    { name: "Active Smartwatch 3", category: "Smart Watch", price: 349900, originalPrice: 549900, image: "/modern-smartwatch.png", stock: 80, tags: ["sports", "smart", "tracker"] },
    { name: "Automatic Mechanical Watch", category: "Classic Watch", price: 699900, originalPrice: 999900, image: "/luxury-watch.jpg", stock: 20, tags: ["premium", "classic", "mechanical"] },
    { name: "Rugged Sport Digital Watch", category: "Classic Watch", price: 149900, originalPrice: 229900, image: "/luxury-watch.jpg", stock: 110, tags: ["sport", "digital", "rugged"] },
    { name: "Hybrid Smart Band", category: "Smart Watch", price: 299900, originalPrice: 449900, image: "/modern-smartwatch.png", stock: 75, tags: ["smart", "hybrid", "fitness"] },

    // ── Accessories ──
    { name: "Mens Leather Reversible Belt", category: "Belts", price: 99900, originalPrice: 149900, image: "/leather-belt.png", stock: 120, isTopRated: true, tags: ["men", "leather", "reversible"] },
    { name: "Premium Aviator Sunglasses", category: "Sunglasses", price: 149900, originalPrice: 229900, image: "/stylish-sunglasses.png", stock: 85, tags: ["unisex", "aviator", "UV"] },
    { name: "Classic Baseball Cap", category: "Hat & Caps", price: 59900, originalPrice: 89900, image: "/baseball-cap.png", stock: 200, tags: ["unisex", "baseball", "casual"] },
    { name: "Braided Leather Belt", category: "Belts", price: 119900, originalPrice: 179900, image: "/leather-belt.png", stock: 75, tags: ["men", "braided", "leather"] },
    { name: "Retro Round Sunglasses", category: "Sunglasses", price: 129900, originalPrice: 189900, image: "/stylish-sunglasses.png", stock: 60, tags: ["unisex", "retro", "round"] },
    { name: "Wool Fedora Hat", category: "Hat & Caps", price: 159900, originalPrice: 249900, image: "/baseball-cap.png", stock: 55, tags: ["unisex", "fedora", "wool"] },
    { name: "Canvas Shoulder Messenger Bag", category: "Bags", price: 249900, originalPrice: 399900, image: "/stylish-sunglasses.png", stock: 90, isFeatured: true, tags: ["canvas", "shoulder", "bag"] },
    { name: "Leather Daily Laptop Backpack", category: "Bags", price: 399900, originalPrice: 599900, image: "/stylish-sunglasses.png", stock: 50, isFeatured: true, tags: ["leather", "backpack", "laptop"] },
    { name: "Quilted Leather Crossbody Purse", category: "Bags", price: 299900, originalPrice: 449900, image: "/stylish-sunglasses.png", stock: 45, tags: ["women", "crossbody", "leather"] },
    { name: "Water Resistant Travel Duffel", category: "Bags", price: 349900, originalPrice: 499900, image: "/stylish-sunglasses.png", stock: 40, tags: ["travel", "duffel", "unisex"] },

    // ── Beauty & Care ──
    { name: "Shampoo, Conditioner & Facewash Packs", category: "Beauty & Care", price: 150000, originalPrice: 200000, image: "/shampoo-conditioner-product-set.jpg", stock: 40, isDealOfDay: true, tags: ["care", "bundle", "daily"] },
    { name: "Organic Hair Oil Treatment", category: "Beauty & Care", price: 59900, originalPrice: 89900, image: "/shampoo-conditioner-product-set.jpg", stock: 150, tags: ["organic", "hair", "treatment"] },
    { name: "Vitamin C Face Serum", category: "Beauty & Care", price: 79900, originalPrice: 119900, image: "/shampoo-conditioner-product-set.jpg", stock: 90, tags: ["skincare", "vitamin-c", "serum"] },
    { name: "Charcoal Face Wash", category: "Beauty & Care", price: 49900, originalPrice: 69900, image: "/shampoo-conditioner-product-set.jpg", stock: 200, tags: ["charcoal", "facewash", "men"] },
    { name: "Hydrating Body Lotion", category: "Beauty & Care", price: 69900, originalPrice: 99900, image: "/shampoo-conditioner-product-set.jpg", stock: 130, tags: ["body", "moisturizer", "hydrating"] },
    { name: "Dead Sea Mud Face Mask", category: "Beauty & Care", price: 54900, originalPrice: 79900, image: "/shampoo-conditioner-product-set.jpg", stock: 75, tags: ["facemask", "clay", "skincare"] },
    { name: "Shea Butter Hand Cream", category: "Beauty & Care", price: 39900, originalPrice: 54900, image: "/shampoo-conditioner-product-set.jpg", stock: 150, tags: ["handcream", "moisturizer", "dryskin"] },
    { name: "Rosewater Facial Toner Mist", category: "Beauty & Care", price: 44900, originalPrice: 59900, image: "/shampoo-conditioner-product-set.jpg", stock: 100, tags: ["toner", "rosewater", "mist"] },
    { name: "Tea Tree Acne Spot Gel", category: "Beauty & Care", price: 49900, originalPrice: 69900, image: "/shampoo-conditioner-product-set.jpg", stock: 80, tags: ["acne", "spotgel", "teatree"] },
    { name: "Aloe Vera Soothing Gel", category: "Beauty & Care", price: 34900, originalPrice: 49900, image: "/shampoo-conditioner-product-set.jpg", stock: 180, tags: ["aloevera", "soothing", "gel"] },
  ];

  // Variants for applicable products
  const clothingSizes = ["S", "M", "L", "XL"];
  const shoeSizes = ["7", "8", "9", "10", "11"];

  let productCount = 0;

  for (const p of products) {
    const categoryId = categoryMap[p.category];
    if (!categoryId) {
      console.warn(`  ⚠️  Category not found for "${p.name}": ${p.category}`);
      continue;
    }

    const productSlug = slug(p.name);

    // Determine if this product needs variants
    const parentCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { parent: { select: { name: true } }, name: true },
    });

    const topCategory = parentCategory?.parent?.name ?? parentCategory?.name ?? "";
    const isClothing = ["Clothes"].includes(topCategory);
    const isFootwear = ["Footwear"].includes(topCategory);

    const variants: { name: string; value: string; stock: number; priceAdd: number }[] = [];

    if (isClothing) {
      for (const size of clothingSizes) {
        variants.push({
          name: "Size",
          value: size,
          stock: Math.floor(p.stock / clothingSizes.length),
          priceAdd: 0,
        });
      }
    } else if (isFootwear) {
      for (const size of shoeSizes) {
        variants.push({
          name: "Size",
          value: size,
          stock: Math.floor(p.stock / shoeSizes.length),
          priceAdd: 0,
        });
      }
    }

    await prisma.product.create({
      data: {
        name: p.name,
        slug: productSlug,
        description: `Premium quality ${p.name.toLowerCase()}. Perfect for any occasion. Shop the best deals at UrbanCart.`,
        price: p.price,
        originalPrice: p.originalPrice,
        image: p.image,
        images: [p.image],
        categoryId,
        stock: p.stock,
        rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
        reviewCount: Math.floor(Math.random() * 50) + 5,
        isFeatured: p.isFeatured ?? false,
        isNewArrival: p.isNewArrival ?? false,
        isTrending: p.isTrending ?? false,
        isTopRated: p.isTopRated ?? false,
        isDealOfDay: p.isDealOfDay ?? false,
        tags: p.tags,
        variants: {
          create: variants,
        },
      },
    });

  }

  console.log(`  ✅ Products: ${productCount} created`);

  // ─── Coupons ────────────────────────────────────────────────

  const coupons = [
    {
      code: "WELCOME10",
      description: "10% off your first order",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      minOrderValue: 50000, // ₹500
      maxDiscount: 20000,   // ₹200 max
      usageLimit: 1000,
      validUntil: new Date("2027-12-31"),
    },
    {
      code: "FLAT200",
      description: "Flat ₹200 off on orders above ₹999",
      discountType: DiscountType.FIXED,
      discountValue: 20000, // ₹200 in paise
      minOrderValue: 99900,
      validUntil: new Date("2027-06-30"),
    },
    {
      code: "SUMMER25",
      description: "25% off summer collection (up to ₹500)",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 25,
      minOrderValue: 100000,
      maxDiscount: 50000,
      usageLimit: 500,
      validUntil: new Date("2026-09-30"),
    },
  ];

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {},
      create: coupon,
    });
  }

  console.log(`  ✅ Coupons: ${coupons.length} created`);

  // ─── Demo Address ───────────────────────────────────────────

  const existingAddress = await prisma.address.findFirst({
    where: { userId: demoUser.id },
  });

  if (!existingAddress) {
    await prisma.address.create({
      data: {
        userId: demoUser.id,
        label: "Home",
        fullName: "Demo User",
        phone: "+91 9876543210",
        line1: "42, MG Road",
        line2: "Near Central Mall",
        city: "Bangalore",
        state: "Karnataka",
        postalCode: "560001",
        country: "IN",
        isDefault: true,
      },
    });
    console.log("  ✅ Demo address created");
  }

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
