import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { scrapeUrlsSchema, scrapeKeywordSchema, scrapedProductQuerySchema } from "@/lib/validations/scraper";
import { startScrapeByUrlsAsync, startScrapeByKeywordsAsync } from "@/lib/apify";

// POST /api/admin/scraper — Start a new scrape job (async, non-blocking)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();

    const urlParsed = scrapeUrlsSchema.safeParse(body);
    const keywordParsed = scrapeKeywordSchema.safeParse(body);

    let site = "other";
    let keyword: string | undefined;
    let urls: string[] | undefined;
    let runResult: { runId: string; datasetId: string; status: string };

    if (urlParsed.success) {
      urls = urlParsed.data.urls;
      site = urls[0].includes("amazon") ? "amazon"
        : urls[0].includes("flipkart") ? "flipkart"
        : urls[0].includes("myntra") ? "myntra"
        : "other";
      runResult = await startScrapeByUrlsAsync({ urls, maxProducts: urlParsed.data.maxProducts });
    } else if (keywordParsed.success) {
      keyword = keywordParsed.data.keyword;
      site = keywordParsed.data.site;
      runResult = await startScrapeByKeywordsAsync({
        keyword,
        site,
        maxProducts: keywordParsed.data.maxProducts,
        countryCode: keywordParsed.data.countryCode,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid input. Provide either urls or keyword+site." },
        { status: 400 }
      );
    }

    const job = await db.scrapeJob.create({
      data: {
        site,
        keyword: keyword || null,
        urls: urls || [],
        status: "RUNNING",
        apifyRunId: runResult.runId,
        datasetId: runResult.datasetId,
      },
    });

    return NextResponse.json({
      message: "Scrape job started",
      jobId: job.id,
      runId: runResult.runId,
      datasetId: runResult.datasetId,
    });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[SCRAPER_POST_ERROR]", response);
    const message = response instanceof Error ? response.message : "Failed to start scrape";
    return NextResponse.json({ error: message }, { status: 500 });
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
