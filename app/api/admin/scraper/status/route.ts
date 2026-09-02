import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { getRunStatus, fetchDatasetResults } from "@/lib/apify";
import { processResultsToQueue } from "@/lib/scrape-jobs";

// GET /api/admin/scraper/status?jobId=xxx — Poll scrape job status
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const job = await db.scrapeJob.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // If job is already completed/failed, just return status
    if (job.status === "COMPLETED" || job.status === "FAILED") {
      return NextResponse.json({
        jobId: job.id,
        status: job.status,
        totalScraped: job.totalScraped,
        totalImported: job.totalImported,
        totalSkipped: job.totalSkipped,
        errorMessage: job.errorMessage,
      });
    }

    // If job is still running, check Apify run status
    if (job.apifyRunId) {
      const runStatus = await getRunStatus(job.apifyRunId);

      if (runStatus.status === "SUCCEEDED") {
        // Process results into ScrapedProduct queue
        const result = await processResultsToQueue(job.id, job.datasetId || runStatus.datasetId || "");

        return NextResponse.json({
          jobId: job.id,
          status: "COMPLETED",
          totalImported: result.saved,
          error: result.error,
        });
      } else if (runStatus.status === "FAILED" || runStatus.status === "ABORTED") {
        await db.scrapeJob.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            errorMessage: `Apify run ${runStatus.status}`,
            completedAt: new Date(),
          },
        });

        return NextResponse.json({
          jobId: job.id,
          status: "FAILED",
          errorMessage: `Apify run ${runStatus.status}`,
        });
      }

      // Still running
      return NextResponse.json({
        jobId: job.id,
        status: "RUNNING",
        apifyStatus: runStatus.status,
      });
    }

    // No run ID, check if we can process via dataset
    if (job.datasetId) {
      const result = await processResultsToQueue(job.id, job.datasetId);
      return NextResponse.json({
        jobId: job.id,
        status: "COMPLETED",
        totalImported: result.saved,
        error: result.error,
      });
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
    });
  } catch (response) {
    if (response instanceof NextResponse) return response;
    console.error("[SCRAPER_STATUS_ERROR]", response);
    return NextResponse.json({ error: "Failed to check job status" }, { status: 500 });
  }
}
