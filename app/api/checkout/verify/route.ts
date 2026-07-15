import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { verifyPaymentSchema } from "@/lib/validations/order";
import { sendOrderConfirmationEmail } from "@/lib/email";

// POST /api/checkout/verify — Verify Razorpay payment and confirm order
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const parsed = verifyPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payment data" },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      parsed.data;

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Find the order
    const order = await db.order.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
      include: {
        items: true,
        user: { select: { email: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json({
        message: "Payment already verified",
        orderNumber: order.orderNumber,
      });
    }

    // Update order status
    await db.order.update({
      where: { id: order.id },
      data: {
        status: "PLACED",
        paymentStatus: "PAID",
        razorpayPaymentId: razorpay_payment_id,
      },
    });

    // Decrement stock for each item
    for (const item of order.items) {
      if (item.variantId) {
        await db.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      } else {
        await db.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    // Increment coupon usage
    if (order.couponId) {
      await db.coupon.update({
        where: { id: order.couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Clear user's cart
    const cart = await db.cart.findUnique({
      where: { userId: user.id },
    });

    if (cart) {
      await db.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    // Send confirmation email
    try {
      await sendOrderConfirmationEmail(order.user.email!, {
        orderNumber: order.orderNumber,
        total: order.total,
        itemCount: order.items.length,
      });
    } catch (emailError) {
      console.error("[ORDER_EMAIL_ERROR]", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      message: "Payment verified and order confirmed",
      orderNumber: order.orderNumber,
    });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[VERIFY_PAYMENT_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
