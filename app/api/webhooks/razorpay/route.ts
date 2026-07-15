import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/email";

// POST /api/webhooks/razorpay — Handle Razorpay webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature || !process.env.RAZORPAY_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Missing signature or webhook secret" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    const eventType = event.event;

    switch (eventType) {
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        const razorpayOrderId = payment.order_id;

        const order = await db.order.findUnique({
          where: { razorpayOrderId },
          include: {
            items: true,
            user: { select: { id: true, email: true } },
          },
        });

        if (!order) break;

        // Only process if not already paid (idempotency)
        if (order.paymentStatus !== "PAID") {
          await db.order.update({
            where: { id: order.id },
            data: {
              status: "PLACED",
              paymentStatus: "PAID",
              razorpayPaymentId: payment.id,
            },
          });

          // Decrement stock
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

          // Clear cart
          const cart = await db.cart.findUnique({
            where: { userId: order.userId },
          });
          if (cart) {
            await db.cartItem.deleteMany({ where: { cartId: cart.id } });
          }

          // Send email
          try {
            await sendOrderConfirmationEmail(order.user.email!, {
              orderNumber: order.orderNumber,
              total: order.total,
              itemCount: order.items.length,
            });
          } catch (e) {
            console.error("[WEBHOOK_EMAIL_ERROR]", e);
          }
        }
        break;
      }

      case "payment.failed": {
        const payment = event.payload.payment.entity;
        const razorpayOrderId = payment.order_id;

        await db.order.updateMany({
          where: {
            razorpayOrderId,
            paymentStatus: "PENDING",
          },
          data: {
            paymentStatus: "FAILED",
          },
        });
        break;
      }

      case "refund.processed": {
        const refund = event.payload.refund.entity;
        const paymentId = refund.payment_id;

        await db.order.updateMany({
          where: {
            razorpayPaymentId: paymentId,
          },
          data: {
            paymentStatus: "REFUNDED",
            status: "CANCELLED",
          },
        });
        break;
      }

      default:
        // Unhandled event type, acknowledge receipt
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[RAZORPAY_WEBHOOK_ERROR]", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
