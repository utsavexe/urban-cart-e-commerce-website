import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { approveScrapedSchema } from "@/lib/validations/scraper";

// GET /api/admin/scraper/[id] — Get single scraped product
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const item = await db.scrapedProduct.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Scraped product not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[SCRAPER_ID_GET_ERROR]", response);
    return NextResponse.json({ error: "Failed to fetch scraped product" }, { status: 500 });
  }
}

// PATCH /api/admin/scraper/[id] — Approve or reject a scraped product
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();

    // If just changing status (approve/reject)
    if (body.status && !body.reviewedCategoryId) {
      const validStatuses = ["PENDING", "APPROVED", "REJECTED", "IMPORTED"] as const;
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      const item = await db.scrapedProduct.update({
        where: { id },
        data: { status: body.status },
      });
      return NextResponse.json(item);
    }

    // If approving with category and price
    const parsed = approveScrapedSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const item = await db.scrapedProduct.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedCategoryId: parsed.data.reviewedCategoryId,
        reviewedPrice: parsed.data.reviewedPrice,
      },
    });

    return NextResponse.json(item);
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[SCRAPER_ID_PATCH_ERROR]", response);
    return NextResponse.json({ error: "Failed to update scraped product" }, { status: 500 });
  }
}

// DELETE /api/admin/scraper/[id] — Delete a scraped product
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    await db.scrapedProduct.delete({ where: { id } });

    return NextResponse.json({ message: "Scraped product deleted" });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[SCRAPER_ID_DELETE_ERROR]", response);
    return NextResponse.json({ error: "Failed to delete scraped product" }, { status: 500 });
  }
}
