import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updateCartItemSchema } from "@/lib/validations/cart";

interface RouteParams {
  params: Promise<{ itemId: string }>;
}

// PATCH /api/cart/[itemId] — Update cart item quantity
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { itemId } = await params;

    const body = await request.json();
    const parsed = updateCartItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { quantity } = parsed.data;

    // Find the cart item
    const cartItem = await db.cartItem.findUnique({
      where: { id: itemId },
      include: {
        product: { include: { variants: true } },
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: "Cart item not found" },
        { status: 404 }
      );
    }

    // Check stock
    let availableStock = cartItem.product.stock;
    if (cartItem.variantId) {
      const variant = cartItem.product.variants.find(
        (v) => v.id === cartItem.variantId
      );
      if (variant) availableStock = variant.stock;
    }

    if (quantity > availableStock) {
      return NextResponse.json(
        { error: `Only ${availableStock} items available in stock` },
        { status: 400 }
      );
    }

    await db.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return NextResponse.json({ message: "Cart item updated" });
  } catch (error) {
    console.error("[CART_ITEM_PATCH_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update cart item" },
      { status: 500 }
    );
  }
}

// DELETE /api/cart/[itemId] — Remove item from cart
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { itemId } = await params;

    const cartItem = await db.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: "Cart item not found" },
        { status: 404 }
      );
    }

    await db.cartItem.delete({ where: { id: itemId } });

    return NextResponse.json({ message: "Cart item removed" });
  } catch (error) {
    console.error("[CART_ITEM_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to remove cart item" },
      { status: 500 }
    );
  }
}
