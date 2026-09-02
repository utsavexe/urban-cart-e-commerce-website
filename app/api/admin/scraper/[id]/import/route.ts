import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { importProductSchema } from "@/lib/validations/scraper";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// POST /api/admin/scraper/[id]/import — Import a scraped product into the catalog
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const parsed = importProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const scraped = await db.scrapedProduct.findUnique({ where: { id } });
    if (!scraped) {
      return NextResponse.json({ error: "Scraped product not found" }, { status: 404 });
    }

    if (scraped.status === "IMPORTED") {
      return NextResponse.json({ error: "Product already imported" }, { status: 400 });
    }

    // Generate unique slug
    let slug = generateSlug(scraped.name);
    let slugAttempts = 0;
    while (await db.product.findUnique({ where: { slug } })) {
      slugAttempts++;
      slug = `${generateSlug(scraped.name)}-${slugAttempts}`;
    }

    // Create the product
    const product = await db.product.create({
      data: {
        name: scraped.name,
        slug,
        description: scraped.description || "",
        price: parsed.data.reviewedPrice,
        originalPrice: parsed.data.reviewedPrice,
        image: scraped.image || "/placeholder.svg",
        images: scraped.images || [],
        categoryId: parsed.data.reviewedCategoryId,
        stock: parsed.data.stock,
        rating: scraped.rating || 0,
        reviewCount: scraped.reviewCount || 0,
        tags: scraped.tags || [],
        isFeatured: false,
        isNewArrival: true,
      },
    });

    // Update scraped product status
    await db.scrapedProduct.update({
      where: { id },
      data: {
        status: "IMPORTED",
        importedProductId: product.id,
        reviewedCategoryId: parsed.data.reviewedCategoryId,
        reviewedPrice: parsed.data.reviewedPrice,
      },
    });

    return NextResponse.json({
      message: "Product imported successfully",
      product,
    }, { status: 201 });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[SCRAPER_IMPORT_POST_ERROR]", response);
    return NextResponse.json({ error: "Failed to import product" }, { status: 500 });
  }
}
