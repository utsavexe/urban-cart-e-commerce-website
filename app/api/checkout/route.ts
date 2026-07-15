import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { checkoutSchema } from "@/lib/validations/order";
import { razorpay } from "@/lib/razorpay";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

// POST /api/checkout — Create Razorpay order
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 checkout attempts per IP per 15 minutes
    const rlKey = getRateLimitKey(request, "checkout");
    const rl = rateLimit(rlKey, { maxRequests: 10, windowSec: 900 });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(rl.resetIn) } }
      );
    }

    const user = await requireAuth();

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { addressId, couponCode, notes } = parsed.data;

    // Validate address belongs to user
    const address = await db.address.findFirst({
      where: { id: addressId, userId: user.id },
    });

    if (!address) {
      return NextResponse.json(
        { error: "Invalid delivery address" },
        { status: 400 }
      );
    }

    // Get user's cart
    const cart = await db.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Your cart is empty" },
        { status: 400 }
      );
    }

    // Validate stock for all items
    for (const item of cart.items) {
      const availableStock = item.variant?.stock ?? item.product.stock;
      if (item.quantity > availableStock) {
        return NextResponse.json(
          {
            error: `"${item.product.name}" has only ${availableStock} items in stock`,
          },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    let subtotal = 0;
    for (const item of cart.items) {
      const unitPrice = item.product.price + (item.variant?.priceAdd ?? 0);
      subtotal += unitPrice * item.quantity;
    }

    // Apply coupon
    let discount = 0;
    let couponId: string | null = null;

    if (couponCode) {
      const coupon = await db.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      if (
        coupon &&
        coupon.isActive &&
        new Date() >= coupon.validFrom &&
        new Date() <= coupon.validUntil &&
        (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) &&
        (!coupon.minOrderValue || subtotal >= coupon.minOrderValue)
      ) {
        if (coupon.discountType === "PERCENTAGE") {
          discount = Math.floor((subtotal * coupon.discountValue) / 100);
          if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
          }
        } else {
          discount = coupon.discountValue;
        }
        couponId = coupon.id;
      }
    }

    // Shipping (free over ₹500, else ₹49)
    const shipping = subtotal - discount >= 50000 ? 0 : 4900;

    // Tax (18% GST)
    const taxableAmount = subtotal - discount;
    const tax = Math.floor(taxableAmount * 0.18);

    const total = subtotal - discount + shipping + tax;

    // Generate order number
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `UC-${dateStr}-${randomSuffix}`;

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: total, // already in paise
      currency: "INR",
      receipt: orderNumber,
      notes: {
        userId: user.id,
        orderNumber,
      },
    });

    // Create pending order in DB
    const order = await db.order.create({
      data: {
        orderNumber,
        userId: user.id,
        subtotal,
        discount,
        shipping,
        tax,
        total,
        couponId,
        addressId,
        notes,
        razorpayOrderId: razorpayOrder.id,
        status: "PENDING",
        paymentStatus: "PENDING",
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.product.price + (item.variant?.priceAdd ?? 0),
            total:
              (item.product.price + (item.variant?.priceAdd ?? 0)) *
              item.quantity,
          })),
        },
      },
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      razorpayOrderId: razorpayOrder.id,
      amount: total,
      currency: "INR",
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[CHECKOUT_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
