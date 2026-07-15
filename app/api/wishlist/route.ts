import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/wishlist — Get user's wishlist
export async function GET() {
  try {
    const user = await requireAuth();

    let wishlist = await db.wishlist.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: { select: { name: true, slug: true } },
              },
            },
          },
          orderBy: { addedAt: "desc" },
        },
      },
    });

    if (!wishlist) {
      wishlist = await db.wishlist.create({
        data: { userId: user.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: { select: { name: true, slug: true } },
                },
              },
            },
          },
        },
      });
    }

    return NextResponse.json(wishlist);
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[WISHLIST_GET_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}

// POST /api/wishlist — Add product to wishlist
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Get or create wishlist
    let wishlist = await db.wishlist.findUnique({
      where: { userId: user.id },
    });

    if (!wishlist) {
      wishlist = await db.wishlist.create({
        data: { userId: user.id },
      });
    }

    // Check if already in wishlist
    const existing = await db.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Product is already in your wishlist" },
        { status: 409 }
      );
    }

    await db.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId,
      },
    });

    return NextResponse.json(
      { message: "Product added to wishlist" },
      { status: 201 }
    );
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[WISHLIST_POST_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to add to wishlist" },
      { status: 500 }
    );
  }
}
