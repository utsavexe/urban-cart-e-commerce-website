import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/orders/[id] — Get single order detail
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const order = await db.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
        userId: user.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                price: true,
              },
            },
            variant: { select: { name: true, value: true } },
          },
        },
        address: true,
        coupon: { select: { code: true, description: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[ORDER_DETAIL_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
