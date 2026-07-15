import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { productQuerySchema, createProductSchema } from "@/lib/validations/product";
import { requireAdmin } from "@/lib/auth-utils";
import { Prisma } from "@prisma/client";

// GET /api/products — List products with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const parsed = productQuerySchema.safeParse(query);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      category,
      minPrice,
      maxPrice,
      sort,
      search,
      page,
      limit,
      featured,
      newArrivals,
      trending,
      topRated,
      dealOfDay,
    } = parsed.data;

    // Build where clause
    const where: Prisma.ProductWhereInput = {};

    if (category) {
      const categoryRecord = await db.category.findFirst({
        where: {
          OR: [
            { slug: { equals: category, mode: "insensitive" } },
            { name: { equals: category, mode: "insensitive" } },
          ],
        },
        include: { children: { select: { id: true } } },
      });

      if (categoryRecord) {
        const categoryIds = [categoryRecord.id, ...categoryRecord.children.map((c) => c.id)];
        where.categoryId = { in: categoryIds };
      } else {
        where.categoryId = "non-existent-id";
      }
    }

    if (minPrice !== undefined) where.price = { ...((where.price as object) || {}), gte: minPrice };
    if (maxPrice !== undefined) where.price = { ...((where.price as object) || {}), lte: maxPrice };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    if (featured) where.isFeatured = true;
    if (newArrivals) where.isNewArrival = true;
    if (trending) where.isTrending = true;
    if (topRated) where.isTopRated = true;
    if (dealOfDay) where.isDealOfDay = true;

    // Build orderBy
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    switch (sort) {
      case "price_asc":
        orderBy = { price: "asc" };
        break;
      case "price_desc":
        orderBy = { price: "desc" };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "rating":
        orderBy = { rating: "desc" };
        break;
      case "name_asc":
        orderBy = { name: "asc" };
        break;
      case "name_desc":
        orderBy = { name: "desc" };
        break;
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          variants: true,
        },
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[PRODUCTS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/products — Create product (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();

    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { variants, ...productData } = parsed.data;

    // Auto-generate slug if not provided
    const slug =
      productData.slug ||
      productData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    // Check slug uniqueness
    const existing = await db.product.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A product with this slug already exists" },
        { status: 409 }
      );
    }

    const product = await db.product.create({
      data: {
        ...productData,
        slug,
        variants: {
          create: variants,
        },
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[PRODUCTS_POST_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
