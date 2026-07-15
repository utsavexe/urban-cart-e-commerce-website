import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import { addToCartSchema } from "@/lib/validations/cart";

const GUEST_CART_COOKIE = "guest_cart_id";

/**
 * Get or create a cart for the current user/guest.
 */
async function getOrCreateCart(userId: string | null) {
  if (userId) {
    // Logged-in user: find or create cart
    let cart = await db.cart.findUnique({
      where: { userId },
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

    if (!cart) {
      cart = await db.cart.create({
        data: { userId },
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
    }

    return cart;
  }

  // Guest user: use cookie-based cart
  const cookieStore = await cookies();
  let guestId = cookieStore.get(GUEST_CART_COOKIE)?.value;

  if (guestId) {
    const cart = await db.cart.findUnique({
      where: { guestId },
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

    if (cart) return cart;
  }

  // Create new guest cart
  guestId = randomUUID();
  const cart = await db.cart.create({
    data: { guestId },
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

  // Set cookie (30 days)
  cookieStore.set(GUEST_CART_COOKIE, guestId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  return cart;
}

// GET /api/cart — Get current cart
export async function GET() {
  try {
    const user = await getCurrentUser();
    const cart = await getOrCreateCart(user?.id ?? null);

    return NextResponse.json(cart);
  } catch (error) {
    console.error("[CART_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

// POST /api/cart — Add item to cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = addToCartSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { productId, variantId, quantity } = parsed.data;

    // Validate product exists and has stock
    const product = await db.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Check stock
    let availableStock = product.stock;
    if (variantId) {
      const variant = product.variants.find((v) => v.id === variantId);
      if (!variant) {
        return NextResponse.json(
          { error: "Product variant not found" },
          { status: 404 }
        );
      }
      availableStock = variant.stock;
    }

    if (availableStock < quantity) {
      return NextResponse.json(
        { error: `Only ${availableStock} items available in stock` },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    const cart = await getOrCreateCart(user?.id ?? null);

    // Check if item already in cart
    const existingItem = await db.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > availableStock) {
        return NextResponse.json(
          { error: `Cannot add more. Only ${availableStock} available (${existingItem.quantity} already in cart)` },
          { status: 400 }
        );
      }

      await db.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await db.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: variantId || null,
          quantity,
        },
      });
    }

    // Return updated cart
    const updatedCart = await db.cart.findUnique({
      where: { id: cart.id },
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

    return NextResponse.json(updatedCart, { status: 201 });
  } catch (error) {
    console.error("[CART_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to add item to cart" },
      { status: 500 }
    );
  }
}
