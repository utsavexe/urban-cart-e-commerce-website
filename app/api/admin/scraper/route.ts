import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { scrapeUrlsSchema, scrapeKeywordSchema, scrapedProductQuerySchema } from "@/lib/validations/scraper";
import { scrapeByUrls, scrapeByKeywords } from "@/lib/apify";
import type { ApifyProduct } from "@/lib/apify";
import type { Prisma } from "@prisma/client";

function extractSiteFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes("amazon")) return "amazon";
    if (hostname.includes("flipkart")) return "flipkart";
    if (hostname.includes("myntra")) return "myntra";
    return "other";
  } catch {
    return "other";
  }
}

function mapApifyToScraped(product: ApifyProduct, sourceSite: string) {
  return {
    sourceSite,
    sourceUrl: product.url || "",
    name: product.name || "Untitled Product",
    description: product.description || null,
    price: product.offers?.price || 0,
    currency: product.offers?.priceCurrency || "INR",
    originalPrice: product.offers?.price || null,
    image: product.image || null,
    images: product.images || [],
    brand: product.brand?.name || null,
    rating: product.rating?.ratingValue || null,
    reviewCount: product.rating?.reviewCount || null,
    category: product.category || null,
    tags: product.brand?.name ? [product.brand.name] : [],
    rawJson: product as unknown as Prisma.InputJsonValue,
  };
}

// POST /api/admin/scraper — Start a new scrape job
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();

    // Try URL mode first, then keyword mode
    const urlParsed = scrapeUrlsSchema.safeParse(body);
    const keywordParsed = scrapeKeywordSchema.safeParse(body);

    let results: ApifyProduct[] = [];
    let sourceSite = "other";

    if (urlParsed.success) {
      const { urls, maxProducts } = urlParsed.data;
      sourceSite = extractSiteFromUrl(urls[0]);
      const result = await scrapeByUrls({ urls, maxProducts });
      results = result.products;
    } else if (keywordParsed.success) {
      const { keyword, site, maxProducts, countryCode } = keywordParsed.data;
      sourceSite = site;
      const result = await scrapeByKeywords({ keyword, site, maxProducts, countryCode });
      results = result.products;
    } else {
      return NextResponse.json(
        { error: "Invalid input. Provide either urls or keyword+site." },
        { status: 400 }
      );
    }

    // Save scraped products to database
    const saved = await db.scrapedProduct.createMany({
      data: results.map((p) => mapApifyToScraped(p, sourceSite)),
    });

    return NextResponse.json({
      message: `Scraped ${saved.count} products successfully`,
      count: saved.count,
    });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[SCRAPER_POST_ERROR]", response);
    const message = response instanceof Error ? response.message : "Failed to scrape products";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// GET /api/admin/scraper — List scraped products in queue
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const parsed = scrapedProductQuerySchema.safeParse(query);

    const page = parsed.success ? parsed.data.page : 1;
    const limit = parsed.success ? parsed.data.limit : 20;
    const status = parsed.success ? parsed.data.status : undefined;
    const search = parsed.success ? parsed.data.search : undefined;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sourceSite: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      db.scrapedProduct.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.scrapedProduct.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[SCRAPER_GET_ERROR]", response);
    return NextResponse.json(
      { error: "Failed to fetch scraped products" },
      { status: 500 }
    );
  }
}
