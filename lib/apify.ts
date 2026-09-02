import { ApifyClient } from "apify-client";

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

const ACTOR_ID = "apify/e-commerce-scraping-tool";
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 100;

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
    detailsUrls: urls,
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
    detailsUrls: urls,
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
