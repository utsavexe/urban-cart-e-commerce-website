import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { batchImportSchema } from "@/lib/validations/scraper";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// POST /api/admin/scraper/batch-import — Bulk import all approved items
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = batchImportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const item of parsed.data.items) {
      try {
        const scraped = await db.scrapedProduct.findUnique({ where: { id: item.id } });
        if (!scraped) {
          results.push({ id: item.id, success: false, error: "Not found" });
          continue;
        }

        if (scraped.status === "IMPORTED") {
          results.push({ id: item.id, success: false, error: "Already imported" });
          continue;
        }

        let slug = generateSlug(scraped.name);
        const existing = await db.product.findUnique({ where: { slug } });
        if (existing) {
          slug = `${slug}-${Date.now()}`;
        }

        const product = await db.product.create({
          data: {
            name: scraped.name,
            slug,
            description: scraped.description || "",
            price: item.price,
            originalPrice: item.price,
            image: scraped.image || "/placeholder.svg",
            images: scraped.images || [],
            categoryId: item.categoryId,
            stock: item.stock,
            rating: scraped.rating || 0,
            reviewCount: scraped.reviewCount || 0,
            tags: scraped.tags || [],
            isFeatured: false,
            isNewArrival: true,
          },
        });

        await db.scrapedProduct.update({
          where: { id: item.id },
          data: {
            status: "IMPORTED",
            importedProductId: product.id,
            reviewedCategoryId: item.categoryId,
            reviewedPrice: item.price,
          },
        });

        results.push({ id: item.id, success: true });
      } catch (err) {
        results.push({
          id: item.id,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const imported = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Imported ${imported} products, ${failed} failed`,
      imported,
      failed,
      results,
    });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[SCRAPER_BATCH_IMPORT_ERROR]", response);
    return NextResponse.json({ error: "Failed to batch import products" }, { status: 500 });
  }
}
