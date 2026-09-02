import { db } from "./db";
import {
  scrapeByUrls, scrapeByKeywords, fetchDatasetResults,
  startScrapeByUrlsAsync, startScrapeByKeywordsAsync, getRunStatus,
} from "./apify";
import type { ApifyProduct } from "./apify";
import type { Prisma } from "@prisma/client";

// ─── Configuration ──────────────────────────────────────────────

const DEFAULT_MARKUP_PERCENT = 15;
const DISCOUNT_DISPLAY_PERCENT = 20;

const CATEGORY_MAP: Record<string, string> = {
  electronics: "electronics",
  "cell phones": "electronics",
  laptops: "electronics",
  computers: "electronics",
  clothing: "clothes",
  "men's clothing": "clothes",
  "women's clothing": "clothes",
  apparel: "clothes",
  shoes: "footwear",
  footwear: "footwear",
  watches: "watches",
  jewelry: "jewelry",
  "jewellery": "jewelry",
  beauty: "beauty-care",
  "beauty & personal care": "beauty-care",
  "health & beauty": "beauty-care",
  home: "accessories",
  "home & kitchen": "accessories",
  accessories: "accessories",
  bags: "accessories",
  "luggage & bags": "accessories",
};

// ─── Helpers ────────────────────────────────────────────────────

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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (await db.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

function extractKeywords(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 5)
    .join(" ");
}

// ─── Deduplication ──────────────────────────────────────────────

async function isDuplicate(
  name: string,
  sourceUrl: string,
  sourceSite: string
): Promise<boolean> {
  // Check 1: Exact source URL match
  const byUrl = await db.product.findFirst({ where: { sourceUrl } });
  if (byUrl) return true;

  // Check 2: Similar name + same source site
  const keywords = extractKeywords(name);
  if (keywords.length < 4) return false;

  const byName = await db.product.findFirst({
    where: {
      sourceSite,
      name: { contains: keywords, mode: "insensitive" },
    },
  });
  return !!byName;
}

// ─── Category Mapping ───────────────────────────────────────────

async function mapCategoryToUrbanCart(
  scrapedCategory: string | null
): Promise<string | null> {
  if (!scrapedCategory) return null;

  const lower = scrapedCategory.toLowerCase();

  // Try exact match first
  for (const [key, slug] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) {
      const cat = await db.category.findUnique({ where: { slug } });
      if (cat) return cat.id;
    }
  }

  // Fallback: try to find any category that matches
  const allCategories = await db.category.findMany({
    where: { parentId: null },
  });
  for (const cat of allCategories) {
    if (lower.includes(cat.name.toLowerCase())) {
      return cat.id;
    }
  }

  return null;
}

// ─── Pricing ────────────────────────────────────────────────────

function calculatePrice(
  sourcePrice: number,
  markupPercent: number
): { price: number; originalPrice: number } {
  const price = Math.round(sourcePrice * (1 + markupPercent / 100));
  const originalPrice = Math.round(price * (1 + DISCOUNT_DISPLAY_PERCENT / 100));
  return { price, originalPrice };
}

// ─── Map Apify Product to DB ────────────────────────────────────

function mapProductFields(
  product: ApifyProduct,
  sourceSite: string,
  categoryId: string,
  markupPercent: number
) {
  const sourcePrice = product.offers?.price || 0;
  const { price, originalPrice } = sourcePrice > 0
    ? calculatePrice(sourcePrice, markupPercent)
    : { price: 0, originalPrice: 0 };

  const slug = slugify(product.name || "untitled-product");
  const tags: string[] = [];
  if (product.brand?.name) tags.push(product.brand.name);
  if (product.category) tags.push(product.category);

  return {
    name: product.name || "Untitled Product",
    slug,
    description: product.description || null,
    price,
    originalPrice,
    image: product.image || "/placeholder.svg",
    images: product.images || [],
    categoryId,
    stock: 10,
    rating: product.rating?.ratingValue || 0,
    reviewCount: product.rating?.reviewCount || 0,
    tags,
    isNewArrival: true,
    sourceUrl: product.url || null,
    sourceSite,
    sourcePrice: sourcePrice > 0 ? Math.round(sourcePrice) : null,
  };
}

// ─── Auto-Import Pipeline ───────────────────────────────────────

export async function processScrapeResults(
  jobId: string,
  datasetId: string,
  markupPercent: number = DEFAULT_MARKUP_PERCENT
): Promise<void> {
  // Update job status
  await db.scrapeJob.update({
    where: { id: jobId },
    data: { status: "RUNNING", datasetId },
  });

  try {
    const products = await fetchDatasetResults(datasetId, 200);
    let imported = 0;
    let skipped = 0;

    for (const product of products) {
      const sourceSite = product.url
        ? extractSiteFromUrl(product.url)
        : "other";

      // Deduplication check
      if (await isDuplicate(product.name || "", product.url || "", sourceSite)) {
        skipped++;
        continue;
      }

      // Map category
      const categoryId = await mapCategoryToUrbanCart(product.category || null);
      if (!categoryId) {
        skipped++;
        continue;
      }

      // Create product
      const productData = mapProductFields(
        product,
        sourceSite,
        categoryId,
        markupPercent
      );

      // Generate unique slug
      const uniqueSlug = await generateUniqueSlug(productData.slug);

      try {
        await db.product.create({
          data: { ...productData, slug: uniqueSlug },
        });
        imported++;
      } catch (err) {
        console.error("[AUTO_IMPORT] Failed to create product:", productData.name, err);
        skipped++;
      }
    }

    // Update job stats
    await db.scrapeJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        totalScraped: products.length,
        totalImported: imported,
        totalSkipped: skipped,
        completedAt: new Date(),
      },
    });

    console.log(
      `[AUTO_IMPORT] Job ${jobId}: ${imported} imported, ${skipped} skipped, ${products.length} total`
    );
  } catch (err) {
    await db.scrapeJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
        completedAt: new Date(),
      },
    });
    console.error("[AUTO_IMPORT] Job failed:", jobId, err);
  }
}

// ─── Start Scheduled Scrape (async, non-blocking) ─────────────

export async function startScheduledScrape(
  site: string,
  keyword?: string,
  urls?: string[]
): Promise<string> {
  const job = await db.scrapeJob.create({
    data: {
      site,
      keyword: keyword || null,
      urls: urls || [],
      status: "RUNNING",
    },
  });

  try {
    let result;
    if (urls && urls.length > 0) {
      result = await startScrapeByUrlsAsync({ urls, maxProducts: 50 });
    } else if (keyword) {
      result = await startScrapeByKeywordsAsync({
        keyword,
        site,
        maxProducts: 50,
        countryCode: "in",
      });
    } else {
      throw new Error("Either keyword or urls must be provided");
    }

    await db.scrapeJob.update({
      where: { id: job.id },
      data: {
        apifyRunId: result.runId,
        datasetId: result.datasetId,
        totalScraped: 0,
      },
    });

    return job.id;
  } catch (err) {
    await db.scrapeJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
        completedAt: new Date(),
      },
    });
    throw err;
  }
}

// ─── Sync Existing Products ─────────────────────────────────────

export async function syncExistingProducts(): Promise<{
  updated: number;
  outOfStock: number;
  errors: number;
}> {
  const products = await db.product.findMany({
    where: { sourceUrl: { not: null } },
    select: { id: true, sourceUrl: true, sourceSite: true, sourcePrice: true },
    take: 50,
  });

  let updated = 0;
  let outOfStock = 0;
  let errors = 0;

  for (const product of products) {
    if (!product.sourceUrl) continue;

    try {
      const results = await scrapeByUrls({
        urls: [product.sourceUrl],
        maxProducts: 1,
      });

      if (results.products.length === 0) {
        // Product no longer available — mark out of stock
        await db.product.update({
          where: { id: product.id },
          data: { stock: 0, lastSyncedAt: new Date() },
        });
        outOfStock++;
        continue;
      }

      const scraped = results.products[0];
      const newPrice = scraped.offers?.price
        ? Math.round(scraped.offers.price)
        : product.sourcePrice;

      await db.product.update({
        where: { id: product.id },
        data: {
          sourcePrice: newPrice,
          rating: scraped.rating?.ratingValue || undefined,
          reviewCount: scraped.rating?.reviewCount || undefined,
          lastSyncedAt: new Date(),
        },
      });
      updated++;
    } catch {
      errors++;
    }
  }

  console.log(
    `[SYNC] Completed: ${updated} updated, ${outOfStock} out-of-stock, ${errors} errors`
  );
  return { updated, outOfStock, errors };
}

// ─── Get Recent Jobs ────────────────────────────────────────────

export async function getRecentJobs(limit = 20) {
  return db.scrapeJob.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ─── Process Results into ScrapedProduct Queue ──────────────────

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

export async function processResultsToQueue(
  jobId: string,
  datasetId: string
): Promise<{ saved: number; error?: string }> {
  await db.scrapeJob.update({
    where: { id: jobId },
    data: { status: "PROCESSING" },
  });

  try {
    const products = await fetchDatasetResults(datasetId, 200);

    const data = products.map((p) => {
      const sourceSite = p.url
        ? p.url.includes("amazon") ? "amazon"
          : p.url.includes("flipkart") ? "flipkart"
          : p.url.includes("myntra") ? "myntra"
          : "other"
        : "other";
      return mapApifyToScraped(p, sourceSite);
    });

    const saved = await db.scrapedProduct.createMany({ data });

    await db.scrapeJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        totalScraped: products.length,
        totalImported: saved.count,
        completedAt: new Date(),
      },
    });

    return { saved: saved.count };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await db.scrapeJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage: message,
        completedAt: new Date(),
      },
    });
    return { saved: 0, error: message };
  }
}
