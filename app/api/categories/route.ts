import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/categories — List all categories with product counts
export async function GET() {
  try {
    const categories = await db.category.findMany({
      where: { parentId: null }, // top-level categories only
      include: {
        children: {
          include: {
            _count: { select: { products: true } },
          },
          orderBy: { name: "asc" },
        },
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    });

    // Also fetch flat list for simpler use cases
    const allCategories = await db.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ categories, allCategories });
  } catch (error) {
    console.error("[CATEGORIES_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
