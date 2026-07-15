import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { updateProductSchema } from "@/lib/validations/product";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/products/[id] — Update product
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

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { variants, ...productData } = parsed.data;

    const product = await db.product.update({
      where: { id },
      data: {
        ...productData,
        ...(variants && {
          variants: { deleteMany: {}, create: variants },
        }),
      },
      include: {
        category: { select: { id: true, name: true } },
        variants: true,
      },
    });

    return NextResponse.json(product);
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[ADMIN_PRODUCT_PATCH_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id] — Delete product
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await db.product.delete({ where: { id } });

    return NextResponse.json({ message: "Product deleted" });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[ADMIN_PRODUCT_DELETE_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
