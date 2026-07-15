import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { productQuerySchema, createProductSchema } from "@/lib/validations/product";

// GET /api/admin/products — List all products (admin, paginated)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const parsed = productQuerySchema.safeParse(query);

    const page = parsed.success ? parsed.data.page : 1;
    const limit = parsed.success ? parsed.data.limit : 20;
    const search = parsed.success ? parsed.data.search : undefined;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
          _count: { select: { orderItems: true, reviews: true } },
        },
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[ADMIN_PRODUCTS_GET_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/admin/products — Create product (admin only)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { variants, ...productData } = parsed.data;

    const slug =
      productData.slug ||
      productData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

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
        variants: { create: variants },
      },
      include: {
        category: { select: { id: true, name: true } },
        variants: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[ADMIN_PRODUCTS_POST_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
