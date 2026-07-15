import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { updateOrderStatusSchema } from "@/lib/validations/order";
import { sendOrderStatusEmail } from "@/lib/email";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/orders/[id] — Get order detail (admin)
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    const order = await db.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, image: true },
            },
            variant: { select: { name: true, value: true } },
          },
        },
        address: true,
        coupon: { select: { code: true, description: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[ADMIN_ORDER_GET_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/orders/[id] — Update order status (admin)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const parsed = updateOrderStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid status", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const order = await db.order.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { status } = parsed.data;

    const updatedOrder = await db.order.update({
      where: { id },
      data: { status },
    });

    // Send status update email
    try {
      if (order.user.email) {
        await sendOrderStatusEmail(order.user.email, {
          orderNumber: order.orderNumber,
          status,
        });
      }
    } catch (emailError) {
      console.error("[ORDER_STATUS_EMAIL_ERROR]", emailError);
    }

    return NextResponse.json(updatedOrder);
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[ADMIN_ORDER_PATCH_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
