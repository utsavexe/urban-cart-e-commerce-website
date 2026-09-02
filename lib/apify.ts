import { ApifyClient } from "apify-client";

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

const ACTOR_ID = "apify/e-commerce-scraping-tool";
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 100;

// ─── URL Normalization ──────────────────────────────────────────

export function normalizeUrl(raw: string): string {
  let url = raw.trim().replace(/[\r\n\t]+/g, "").replace(/\s+/g, "");

  // Remove tracking params that Apify might reject
  try {
    const parsed = new URL(url);
    // Remove common Amazon tracking params
    const trackingParams = ["tag", "linkCode", "ref", "camp", "creative", "creativeASIN", "ascsubtag", "pd_rd_r", "pd_rd_w", "pd_rd_wg", "th", "psc", "spLa"];
    trackingParams.forEach((p) => parsed.searchParams.delete(p));
    url = parsed.toString();
  } catch {
    // URL might be missing protocol
  }

  // Add https:// if missing
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    if (url.startsWith("www.")) {
      url = "https://" + url;
    } else if (url.includes("amazon.") || url.includes("flipkart.") || url.includes("myntra.") || url.includes("amzn.")) {
      url = "https://www." + url;
    } else {
      url = "https://" + url;
    }
  }

  // Remove trailing slashes
  url = url.replace(/\/+$/, "");

  return url;
}

export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

// Amazon shortened URL domains that need resolving
const SHORT_URL_DOMAINS = ["amzn.in", "amzn.to", "a.co", "fktr.in"];

export function isShortUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return SHORT_URL_DOMAINS.some((d) => hostname === d || hostname.endsWith("." + d));
  } catch {
    return false;
  }
}

export async function resolveUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    // response.url contains the final URL after all redirects
    if (res.url && res.url !== url) {
      return res.url;
    }
    return url;
  } catch {
    return url;
  }
}

export async function resolveUrls(urls: string[]): Promise<string[]> {
  const resolved = await Promise.all(
    urls.map(async (url) => {
      if (isShortUrl(url)) {
        const fullUrl = await resolveUrl(url);
        return normalizeUrl(fullUrl);
      }
      return url;
    })
  );
  return resolved;
}

export interface ScrapeUrlsInput {
  urls: string[];
  maxProducts?: number;
}

export interface ScrapeKeywordInput {
  keyword: string;
  site: string;
  maxProducts?: number;
  countryCode?: string;
}

export interface ApifyProduct {
  url?: string;
  name?: string;
  description?: string;
  offers?: {
    price?: number;
    priceCurrency?: string;
  };
  brand?: {
    name?: string;
    slogan?: string;
  };
  image?: string;
  images?: string[];
  rating?: {
    ratingValue?: number;
    reviewCount?: number;
  };
  category?: string;
  asin?: string;
  [key: string]: unknown;
}

function mapSiteToMarketplace(site: string): string[] {
  const siteMap: Record<string, string[]> = {
    amazon: ["www.amazon.in"],
    flipkart: ["www.flipkart.com"],
    myntra: ["www.myntra.com"],
  };
  return siteMap[site.toLowerCase()] || [];
}

export async function scrapeByUrls(input: ScrapeUrlsInput) {
  const { urls, maxProducts = 50 } = input;

  const apifyInput = {
    detailsUrls: urls.map((u) => ({ url: u })),
    additionalProperties: true,
    scrapeMode: "AUTO",
    maxProductResults: maxProducts,
  };

  const run = await client.actor(ACTOR_ID).call(apifyInput, {
    waitSecs: 120,
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  return {
    runId: run.id,
    datasetId: run.defaultDatasetId,
    products: items as ApifyProduct[],
    total: items.length,
  };
}

export async function scrapeByKeywords(input: ScrapeKeywordInput) {
  const { keyword, site, maxProducts = 50, countryCode = "in" } = input;

  const apifyInput: Record<string, unknown> = {
    SearchEngineSearchKeyword: keyword,
    scrapeProductsFromSearchEngine: true,
    scrapeModeSearchEngine: "Google Listing",
    maxSearchEngineProducts: maxProducts,
    countryCode,
    additionalPropertiesSearchEngine: true,
    scrapeMode: "AUTO",
  };

  const marketplaces = mapSiteToMarketplace(site);
  if (marketplaces.length > 0) {
    apifyInput.marketplaces = marketplaces;
  }

  const run = await client.actor(ACTOR_ID).call(apifyInput, {
    waitSecs: 120,
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  return {
    runId: run.id,
    datasetId: run.defaultDatasetId,
    products: items as ApifyProduct[],
    total: items.length,
  };
}

export async function getRunResults(datasetId: string) {
  const { items } = await client.dataset(datasetId).listItems();
  return items as ApifyProduct[];
}

export async function fetchDatasetResults(datasetId: string, limit = 100): Promise<ApifyProduct[]> {
  const { items } = await client.dataset(datasetId).listItems({ limit });
  return items as ApifyProduct[];
}

export async function startActorRun(input: Record<string, unknown>) {
  const run = await client.actor(ACTOR_ID).call(input, { waitSecs: 120 });
  return {
    runId: run.id,
    datasetId: run.defaultDatasetId,
    status: run.status,
  };
}

export function getApifyClient() {
  return client;
}

// ─── Async (non-blocking) start functions for Vercel Hobby plan ───

export async function startScrapeByUrlsAsync(input: ScrapeUrlsInput) {
  const { urls, maxProducts = 50 } = input;

  const run = await client.actor(ACTOR_ID).start({
    detailsUrls: urls.map((u) => ({ url: u })),
    additionalProperties: true,
    scrapeMode: "AUTO",
    maxProductResults: maxProducts,
  });

  return {
    runId: run.id,
    datasetId: run.defaultDatasetId,
    status: run.status,
  };
}

export async function startScrapeByKeywordsAsync(input: ScrapeKeywordInput) {
  const { keyword, site, maxProducts = 50, countryCode = "in" } = input;

  const apifyInput: Record<string, unknown> = {
    SearchEngineSearchKeyword: keyword,
    scrapeProductsFromSearchEngine: true,
    scrapeModeSearchEngine: "Google Listing",
    maxSearchEngineProducts: maxProducts,
    countryCode,
    additionalPropertiesSearchEngine: true,
    scrapeMode: "AUTO",
  };

  const marketplaces = mapSiteToMarketplace(site);
  if (marketplaces.length > 0) {
    apifyInput.marketplaces = marketplaces;
  }

  const run = await client.actor(ACTOR_ID).start(apifyInput);

  return {
    runId: run.id,
    datasetId: run.defaultDatasetId,
    status: run.status,
  };
}

export async function getRunStatus(runId: string) {
  const run = await client.run(runId).get();
  return {
    id: run?.id,
    status: run?.status,
    datasetId: run?.defaultDatasetId,
    stats: run?.stats,
  };
}

export async function pollUntilDone(
  runId: string,
  maxAttempts = MAX_POLL_ATTEMPTS,
  intervalMs = POLL_INTERVAL_MS
): Promise<{ status: string; datasetId: string | undefined }> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const run = await client.run(runId).get();
    const status = run?.status || "UNKNOWN";

    if (status === "SUCCEEDED" || status === "FAILED" || status === "ABORTED") {
      return { status, datasetId: run?.defaultDatasetId };
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return { status: "TIMEOUT", datasetId: undefined };
}
