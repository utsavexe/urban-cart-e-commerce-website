import { Resend } from "resend";

// Resend client with fallback for build-time evaluation
export const resend = new Resend(process.env.RESEND_API_KEY || "re_dummyKey123");

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: "UrbanCart <onboarding@resend.dev>",
      to: email,
      subject: "Reset your password - UrbanCart",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 8px;">
          <h2 style="font-size: 24px; font-weight: bold; color: #1a202c; margin-bottom: 16px;">Password Reset Request</h2>
          <p style="color: #4a5568; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
            You requested to reset your password for UrbanCart. Click the button below to proceed.
          </p>
          <a href="${resetLink}" style="display: inline-block; background-color: #1a202c; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 6px; font-size: 16px; margin-bottom: 24px;">
            Reset Password
          </a>
          <p style="color: #718096; font-size: 14px; line-height: 20px;">
            If you did not request this email, you can safely ignore it. This link is valid for 1 hour.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("[EMAIL_SEND_ERROR]", error);
    throw new Error("Failed to send reset email");
  }
}

export async function sendOrderConfirmationEmail(
  email: string,
  details: { orderNumber: string; total: number; itemCount: number }
) {
  try {
    await resend.emails.send({
      from: "UrbanCart <onboarding@resend.dev>",
      to: email,
      subject: `Order Confirmed: ${details.orderNumber} - UrbanCart`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 8px;">
          <h2 style="font-size: 24px; font-weight: bold; color: #1a202c; margin-bottom: 16px; color: #2f855a;">Order Confirmed!</h2>
          <p style="color: #4a5568; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
            Thank you for your purchase. We are processing your order <strong>${details.orderNumber}</strong>.
          </p>
          <div style="background-color: #f7fafc; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Items:</strong> ${details.itemCount}</p>
            <p style="margin: 0; font-size: 14px;"><strong>Total Paid:</strong> ₹${(details.total / 100).toLocaleString("en-IN")}</p>
          </div>
          <p style="color: #718096; font-size: 14px; line-height: 20px;">
            You can track your order status by visiting the "Track Order" page in your account dashboard.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("[EMAIL_SEND_ERROR]", error);
  }
}

export async function sendOrderStatusEmail(
  email: string,
  details: { orderNumber: string; status: string }
) {
  try {
    await resend.emails.send({
      from: "UrbanCart <onboarding@resend.dev>",
      to: email,
      subject: `Order Status Update: ${details.orderNumber} - UrbanCart`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 8px;">
          <h2 style="font-size: 24px; font-weight: bold; color: #1a202c; margin-bottom: 16px;">Order Update</h2>
          <p style="color: #4a5568; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
            The status of your order <strong>${details.orderNumber}</strong> has been updated to: <strong style="color: #3182ce;">${details.status}</strong>.
          </p>
          <p style="color: #718096; font-size: 14px; line-height: 20px;">
            Visit your account dashboard on UrbanCart to view full shipping details.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("[EMAIL_SEND_ERROR]", error);
  }
}
