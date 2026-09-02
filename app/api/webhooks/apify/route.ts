import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processScrapeResults } from "@/lib/scrape-jobs";

// POST /api/webhooks/apify — Receives webhook from Apify when a run completes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, eventData } = body;

    // Verify webhook secret if configured
    const webhookToken = request.headers.get("x-apify-webhook-token");
    if (process.env.APIFY_WEBHOOK_SECRET && webhookToken !== process.env.APIFY_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only process successful runs
    if (eventType !== "ACTOR.RUN.SUCCEEDED") {
      return NextResponse.json({ message: `Ignored event: ${eventType}` });
    }

    const { actorRunId } = eventData;
    if (!actorRunId) {
      return NextResponse.json({ error: "No run ID in webhook" }, { status: 400 });
    }

    // Find the scrape job for this run
    const job = await db.scrapeJob.findFirst({
      where: { apifyRunId: actorRunId },
    });

    if (!job) {
      console.log("[APIFY_WEBHOOK] No matching job for run:", actorRunId);
      return NextResponse.json({ message: "No matching job found" });
    }

    if (job.status === "COMPLETED") {
      return NextResponse.json({ message: "Job already processed" });
    }

    // Get the dataset ID from the run
    const datasetId = eventData.defaultDatasetId || job.datasetId;
    if (!datasetId) {
      return NextResponse.json({ error: "No dataset ID" }, { status: 400 });
    }

    // Process results asynchronously (respond to Apify first)
    processScrapeResults(job.id, datasetId).catch((err) => {
      console.error("[APIFY_WEBHOOK] Process error:", err);
    });

    return NextResponse.json({ message: "Processing started", jobId: job.id });
  } catch (err) {
    console.error("[APIFY_WEBHOOK_ERROR]", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
