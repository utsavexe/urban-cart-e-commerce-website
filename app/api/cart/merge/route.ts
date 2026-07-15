import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";

const GUEST_CART_COOKIE = "guest_cart_id";

// POST /api/cart/merge — Merge guest cart into logged-in user's cart
export async function POST() {
  try {
    const user = await requireAuth();
    const cookieStore = await cookies();
    const guestId = cookieStore.get(GUEST_CART_COOKIE)?.value;

    if (!guestId) {
      return NextResponse.json({ message: "No guest cart to merge" });
    }

    const guestCart = await db.cart.findUnique({
      where: { guestId },
      include: { items: true },
    });

    if (!guestCart || guestCart.items.length === 0) {
      // Clean up empty guest cart
      if (guestCart) await db.cart.delete({ where: { id: guestCart.id } });
      cookieStore.delete(GUEST_CART_COOKIE);
      return NextResponse.json({ message: "No guest cart items to merge" });
    }

    // Get or create user cart
    let userCart = await db.cart.findUnique({
      where: { userId: user.id },
      include: { items: true },
    });

    if (!userCart) {
      userCart = await db.cart.create({
        data: { userId: user.id },
        include: { items: true },
      });
    }

    // Merge items
    for (const guestItem of guestCart.items) {
      const existingItem = userCart.items.find(
        (item) =>
          item.productId === guestItem.productId &&
          item.variantId === guestItem.variantId
      );

      if (existingItem) {
        // Add quantities (up to stock limit)
        const product = await db.product.findUnique({
          where: { id: guestItem.productId },
          select: { stock: true },
        });
        const maxQty = product?.stock ?? 99;
        const newQty = Math.min(
          existingItem.quantity + guestItem.quantity,
          maxQty
        );

        await db.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQty },
        });
      } else {
        // Add new item to user cart
        await db.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: guestItem.productId,
            variantId: guestItem.variantId,
            quantity: guestItem.quantity,
          },
        });
      }
    }

    // Delete guest cart and cookie
    await db.cart.delete({ where: { id: guestCart.id } });
    cookieStore.delete(GUEST_CART_COOKIE);

    // Return merged cart
    const mergedCart = await db.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: { select: { name: true, slug: true } },
              },
            },
            variant: true,
          },
        },
      },
    });

    return NextResponse.json(mergedCart);
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[CART_MERGE_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to merge cart" },
      { status: 500 }
    );
  }
}
