import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updateProductSchema } from "@/lib/validations/product";
import { requireAdmin } from "@/lib/auth-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/products/[id] — Get single product by ID or slug
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const product = await db.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: true,
        reviews: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PRODUCT_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PATCH /api/products/[id] — Update product (admin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { variants, ...productData } = parsed.data;

    // Check product exists
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // If slug is being updated, check uniqueness
    if (productData.slug && productData.slug !== existing.slug) {
      const slugExists = await db.product.findUnique({
        where: { slug: productData.slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "A product with this slug already exists" },
          { status: 409 }
        );
      }
    }

    const product = await db.product.update({
      where: { id },
      data: {
        ...productData,
        // If variants are provided, replace all existing variants
        ...(variants && {
          variants: {
            deleteMany: {},
            create: variants,
          },
        }),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: true,
      },
    });

    return NextResponse.json(product);
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[PRODUCT_PATCH_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] — Delete product (admin only)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    await db.product.delete({ where: { id } });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[PRODUCT_DELETE_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
