import { z } from "zod";

export const checkoutSchema = z.object({
  addressId: z.string().cuid("Invalid address ID"),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
