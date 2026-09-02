import { z } from "zod";

export const scrapeUrlsSchema = z.object({
  urls: z
    .array(z.string().url("Each URL must be a valid URL"))
    .min(1, "At least one URL is required")
    .max(20, "Maximum 20 URLs per request"),
  maxProducts: z.number().int().min(1).max(200).optional().default(50),
});

export const scrapeKeywordSchema = z.object({
  keyword: z.string().min(2, "Keyword must be at least 2 characters"),
  site: z.enum(["amazon", "flipkart", "myntra", "other"], {
    errorMap: () => ({ message: "Site must be amazon, flipkart, myntra, or other" }),
  }),
  maxProducts: z.number().int().min(1).max(200).optional().default(50),
  countryCode: z.string().length(2).optional().default("in"),
});

export const scrapedProductQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "IMPORTED"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const approveScrapedSchema = z.object({
  reviewedCategoryId: z.string().cuid("Invalid category ID"),
  reviewedPrice: z.number().int().positive("Price must be a positive integer in paise"),
  reviewedStock: z.number().int().min(0).optional().default(10),
});

export const importProductSchema = z.object({
  reviewedCategoryId: z.string().cuid("Invalid category ID"),
  reviewedPrice: z.number().int().positive("Price must be a positive integer in paise"),
  stock: z.number().int().min(0).optional().default(10),
});

export const batchImportSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().cuid(),
        categoryId: z.string().cuid("Invalid category ID"),
        price: z.number().int().positive("Price must be a positive integer in paise"),
        stock: z.number().int().min(0).optional().default(10),
      })
    )
    .min(1, "At least one item is required")
    .max(50, "Maximum 50 items per batch import"),
});

export type ScrapeUrlsInput = z.infer<typeof scrapeUrlsSchema>;
export type ScrapeKeywordInput = z.infer<typeof scrapeKeywordSchema>;
export type ScrapedProductQuery = z.infer<typeof scrapedProductQuerySchema>;
export type ApproveScrapedInput = z.infer<typeof approveScrapedSchema>;
export type ImportProductInput = z.infer<typeof importProductSchema>;
export type BatchImportInput = z.infer<typeof batchImportSchema>;
