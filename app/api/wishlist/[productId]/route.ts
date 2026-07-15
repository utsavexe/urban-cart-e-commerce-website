import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";

interface RouteParams {
  params: Promise<{ productId: string }>;
}

// DELETE /api/wishlist/[productId] — Remove product from wishlist
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { productId } = await params;

    const wishlist = await db.wishlist.findUnique({
      where: { userId: user.id },
    });

    if (!wishlist) {
      return NextResponse.json(
        { error: "Wishlist not found" },
        { status: 404 }
      );
    }

    const item = await db.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Product not in wishlist" },
        { status: 404 }
      );
    }

    await db.wishlistItem.delete({ where: { id: item.id } });

    return NextResponse.json({ message: "Product removed from wishlist" });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[WISHLIST_DELETE_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to remove from wishlist" },
      { status: 500 }
    );
  }
}
