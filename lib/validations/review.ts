import { z } from "zod";

export const createReviewSchema = z.object({
  productId: z.string().cuid("Invalid product ID"),
  rating: z.number().int().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5"),
  title: z.string().max(100).optional(),
  comment: z.string().max(2000).optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(100).optional(),
  comment: z.string().max(2000).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
