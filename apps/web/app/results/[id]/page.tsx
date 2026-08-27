"use client";

import { useState, useEffect } from "react";
import { JobResult } from "@repo/shared";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { TeacherSplitScreenFigma } from "@/components/TeacherSplitScreenFigma";

export default function ResultsPage({
  params,
}: {
  params: { id: string };
}) {
  const [job, setJob] = useState<JobResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/jobs/${params.id}`);
        if (!res.ok) {
          throw new Error(`Job '${params.id}' not found.`);
        }
        const data: JobResult = await res.json();
        setJob(data);
      } catch (err: any) {
        setError(err.message || "Failed to load job.");
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">
          Loading assessment results interface...
        </p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white border border-slate-200 rounded-2xl text-center shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Job Not Found</h2>
        <p className="text-slate-600 text-sm mb-4">
          {error || `Job '${params.id}' was not found.`}
        </p>
        <Link
          href="/"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Upload New Assessment</span>
        </Link>
      </div>
    );
  }

  return <TeacherSplitScreenFigma job={job} />;
}
