import { z } from "zod";

export const validateCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").toUpperCase(),
  cartTotal: z.number().int().positive("Cart total must be positive"),
});

export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
