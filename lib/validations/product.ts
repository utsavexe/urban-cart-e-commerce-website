import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only")
    .optional(),
  description: z.string().optional(),
  price: z.number().int().positive("Price must be a positive integer (in paise)"),
  originalPrice: z.number().int().positive("Original price must be a positive integer"),
  image: z.string().url().or(z.string().startsWith("/")),
  images: z.array(z.string()).optional().default([]),
  categoryId: z.string().cuid("Invalid category ID"),
  stock: z.number().int().min(0).default(0),
  isFeatured: z.boolean().optional().default(false),
  isNewArrival: z.boolean().optional().default(false),
  isTrending: z.boolean().optional().default(false),
  isTopRated: z.boolean().optional().default(false),
  isDealOfDay: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
  variants: z
    .array(
      z.object({
        name: z.string().min(1),
        value: z.string().min(1),
        stock: z.number().int().min(0).default(0),
        priceAdd: z.number().int().min(0).default(0),
      })
    )
    .optional()
    .default([]),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sort: z
    .enum(["price_asc", "price_desc", "newest", "rating", "name_asc", "name_desc"])
    .optional()
    .default("newest"),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
  featured: z.coerce.boolean().optional(),
  newArrivals: z.coerce.boolean().optional(),
  trending: z.coerce.boolean().optional(),
  topRated: z.coerce.boolean().optional(),
  dealOfDay: z.coerce.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
