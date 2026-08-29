import { NextResponse } from "next/server";
import { purgeExpiredJobs } from "@/lib/store";

export async function GET() {
  const purgedCount = purgeExpiredJobs();

  return NextResponse.json({
    success: true,
    message: `Vercel Cron Job executed successfully. Purged ${purgedCount} expired job(s).`,
    timestamp: new Date().toISOString(),
  });
}
