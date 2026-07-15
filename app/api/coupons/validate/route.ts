import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateCouponSchema } from "@/lib/validations/coupon";

// POST /api/coupons/validate — Validate a coupon code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = validateCouponSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { code, cartTotal } = parsed.data;

    const coupon = await db.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "Invalid coupon code" },
        { status: 404 }
      );
    }

    if (!coupon.isActive) {
      return NextResponse.json(
        { error: "This coupon is no longer active" },
        { status: 400 }
      );
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return NextResponse.json(
        { error: "This coupon has expired" },
        { status: 400 }
      );
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json(
        { error: "This coupon has been fully redeemed" },
        { status: 400 }
      );
    }

    if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
      const minOrder = (coupon.minOrderValue / 100).toFixed(0);
      return NextResponse.json(
        { error: `Minimum order of ₹${minOrder} required for this coupon` },
        { status: 400 }
      );
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = Math.floor((cartTotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = Math.min(coupon.discountValue, cartTotal);
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount, // actual discount amount in paise
    });
  } catch (error) {
    console.error("[COUPON_VALIDATE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
