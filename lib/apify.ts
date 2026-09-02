import { ApifyClient } from "apify-client";

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

const ACTOR_ID = "apify/e-commerce-scraping-tool";

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
