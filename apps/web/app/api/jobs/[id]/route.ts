import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json(
      { error: `Job '${jobId}' not found.` },
      { status: 404 }
    );
  }

  // Optimize polling bandwidth: strip 2.3MB base64 image data during status updates
  if (job.status !== "done" && job.status !== "error") {
    const { questionPaperPages, answerSheetPages, ...lightweightJob } = job;
    return NextResponse.json(lightweightJob, { status: 200 });
  }

  return NextResponse.json(job, { status: 200 });
}
