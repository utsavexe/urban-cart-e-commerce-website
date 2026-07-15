import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { createReviewSchema } from "@/lib/validations/review";

// GET /api/reviews?productId=xxx — Get reviews for a product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));

    if (!productId) {
      return NextResponse.json(
        { error: "productId query parameter is required" },
        { status: 400 }
      );
    }

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where: { productId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      }),
      db.review.count({ where: { productId } }),
    ]);

    // Calculate average rating
    const avgResult = await db.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return NextResponse.json({
      reviews,
      stats: {
        averageRating: avgResult._avg.rating ?? 0,
        totalReviews: avgResult._count.rating,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[REVIEWS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST /api/reviews — Create a review (must have purchased the product)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const parsed = createReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { productId, rating, title, comment } = parsed.data;

    // Check if user already reviewed this product
    const existingReview = await db.review.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 }
      );
    }

    // Check if user has purchased this product (delivered orders only)
    const hasPurchased = await db.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: user.id,
          status: "DELIVERED",
        },
      },
    });

    if (!hasPurchased) {
      return NextResponse.json(
        { error: "You can only review products you have purchased and received" },
        { status: 403 }
      );
    }

    const review = await db.review.create({
      data: {
        userId: user.id,
        productId,
        rating,
        title,
        comment,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    // Update product rating and review count
    const stats = await db.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await db.product.update({
      where: { id: productId },
      data: {
        rating: stats._avg.rating ?? 0,
        reviewCount: stats._count.rating,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[REVIEWS_POST_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
