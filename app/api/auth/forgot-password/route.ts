import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 reset requests per IP per 15 minutes
    const rlKey = getRateLimitKey(request, "forgot-password");
    const rl = rateLimit(rlKey, { maxRequests: 3, windowSec: 900 });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(rl.resetIn) } }
      );
    }

    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Always return success to prevent email enumeration
    const user = await db.user.findUnique({ where: { email } });

    if (user && user.hashedPassword) {
      // Delete any existing reset tokens for this email
      await db.passwordResetToken.deleteMany({ where: { email } });

      // Create a new token (expires in 1 hour)
      const token = randomUUID();
      await db.passwordResetToken.create({
        data: {
          email,
          token,
          expires: new Date(Date.now() + 3600 * 1000), // 1 hour
        },
      });

      // Send email
      await sendPasswordResetEmail(email, token);
    }

    return NextResponse.json({
      message: "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("[FORGOT_PASSWORD_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
