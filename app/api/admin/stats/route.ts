import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";

// GET /api/admin/stats — Dashboard statistics
export async function GET() {
  try {
    await requireAdmin();

    const [
      totalOrders,
      totalRevenue,
      totalUsers,
      totalProducts,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      // Total orders (only paid)
      db.order.count({
        where: { paymentStatus: "PAID" },
      }),

      // Total revenue
      db.order.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { total: true },
      }),

      // Total users
      db.user.count(),

      // Total products
      db.product.count(),

      // Recent 5 orders
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { items: true } },
        },
      }),

      // Low stock products (stock < 10)
      db.product.findMany({
        where: { stock: { lt: 10 } },
        select: { id: true, name: true, slug: true, stock: true, image: true },
        orderBy: { stock: "asc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalOrders,
        totalRevenue: totalRevenue._sum.total ?? 0,
        totalUsers,
        totalProducts,
      },
      recentOrders,
      lowStockProducts,
    });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[ADMIN_STATS_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
