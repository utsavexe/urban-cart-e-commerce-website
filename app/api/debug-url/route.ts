import { NextRequest, NextResponse } from "next/server";
import { normalizeUrl, validateUrl, isShortUrl, resolveUrl } from "@/lib/apify";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawUrl = body.url as string;

    if (!rawUrl) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const step1_normalize = normalizeUrl(rawUrl);
    const step2_valid = validateUrl(step1_normalize);
    const step3_isShort = isShortUrl(step1_normalize);
    let step4_resolved = step1_normalize;

    if (step3_isShort) {
      step4_resolved = await resolveUrl(step1_normalize);
    }

    const step5_final = normalizeUrl(step4_resolved);

    return NextResponse.json({
      input: rawUrl,
      step1_normalize,
      step2_valid,
      step3_isShort,
      step4_resolved,
      step5_final,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
