import Razorpay from "razorpay";

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn(
    "⚠️  Razorpay keys not found. Payment features will not work. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file."
  );
}

// Razorpay client with fallback for build-time evaluation
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dummyId",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dummySecret",
});
