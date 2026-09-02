import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { syncExistingProducts } from "@/lib/scrape-jobs";

// POST /api/cron/sync — Sync prices/stock for imported products
export async function POST(request: NextRequest) {
  try {
    // Allow both admin auth and cron secret
    const cronSecret = request.headers.get("x-cron-secret");
    if (cronSecret !== process.env.CRON_SECRET) {
      await requireAdmin();
    }

    const result = await syncExistingProducts();

    return NextResponse.json({
      message: "Sync completed",
      ...result,
    });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[CRON_SYNC_ERROR]", response);
    return NextResponse.json(
      { error: response instanceof Error ? response.message : "Sync failed" },
      { status: 500 }
    );
  }
}
