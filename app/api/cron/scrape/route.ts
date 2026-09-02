import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { startScheduledScrape } from "@/lib/scrape-jobs";

// POST /api/cron/scrape — Trigger a scheduled scrape job
// Can be called by admin, Apify schedule, or external cron
export async function POST(request: NextRequest) {
  try {
    // Allow both admin auth and cron secret for external triggers
    const authHeader = request.headers.get("authorization");
    const cronSecret = request.headers.get("x-cron-secret");

    if (cronSecret === process.env.CRON_SECRET) {
      // External cron — authorized via secret
    } else {
      await requireAdmin();
    }

    const body = await request.json();
    const { site, keyword, urls } = body;

    if (!site && !urls) {
      return NextResponse.json(
        { error: "Provide 'site' with 'keyword', or 'urls'" },
        { status: 400 }
      );
    }

    const jobId = await startScheduledScrape(site, keyword, urls);

    return NextResponse.json({
      message: "Scrape job started",
      jobId,
    });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[CRON_SCRAPE_ERROR]", response);
    return NextResponse.json(
      { error: response instanceof Error ? response.message : "Failed to start scrape" },
      { status: 500 }
    );
  }
}

// GET /api/cron/scrape — List recent scrape jobs
export async function GET() {
  try {
    await requireAdmin();
    const { getRecentJobs } = await import("@/lib/scrape-jobs");
    const jobs = await getRecentJobs(20);
    return NextResponse.json({ jobs });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}
