import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { updateReviewSchema } from "@/lib/validations/review";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/reviews/[id] — Update own review
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const body = await request.json();
    const parsed = updateReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const review = await db.review.findUnique({ where: { id } });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    if (review.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only edit your own reviews" },
        { status: 403 }
      );
    }

    const updatedReview = await db.review.update({
      where: { id },
      data: parsed.data,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    // Update product rating
    const stats = await db.review.aggregate({
      where: { productId: review.productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await db.product.update({
      where: { id: review.productId },
      data: {
        rating: stats._avg.rating ?? 0,
        reviewCount: stats._count.rating,
      },
    });

    return NextResponse.json(updatedReview);
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[REVIEW_PATCH_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/[id] — Delete own review
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const review = await db.review.findUnique({ where: { id } });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    if (review.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only delete your own reviews" },
        { status: 403 }
      );
    }

    await db.review.delete({ where: { id } });

    // Update product rating
    const stats = await db.review.aggregate({
      where: { productId: review.productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await db.product.update({
      where: { id: review.productId },
      data: {
        rating: stats._avg.rating ?? 0,
        reviewCount: stats._count.rating,
      },
    });

    return NextResponse.json({ message: "Review deleted" });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[REVIEW_DELETE_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
