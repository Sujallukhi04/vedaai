"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { JobResult } from "@repo/shared";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Sparkles,
  Cpu,
  Layers,
  FileSearch,
  Award
} from "lucide-react";

interface ProcessingProgressProps {
  jobId: string;
}

const STEPS: { key: JobResult["status"]; label: string; description: string; icon: any }[] = [
  {
    key: "uploading",
    label: "Rendering High-Res Pages",
    description: "Converting PDF pages into crisp high-definition image frames",
    icon: Layers,
  },
  {
    key: "extracting_questions",
    label: "Extracting Exam Questions",
    description: "Detecting question labels, marks & structured text via Groq AI",
    icon: FileSearch,
  },
  {
    key: "extracting_answers",
    label: "Transcribing Student Handwriting",
    description: "Scanning handwritten answers & mapping pixel coordinates",
    icon: Cpu,
  },
  {
    key: "mapping",
    label: "Mapping Answers to Questions",
    description: "Matching student responses & tagging rough calculations",
    icon: Sparkles,
  },
  {
    key: "grading",
    label: "AI Evaluation & Auto-Grading",
    description: "Computing detailed criteria feedback & overall test scores",
    icon: Award,
  },
];

export function ProcessingProgress({ jobId }: ProcessingProgressProps) {
  const router = useRouter();
  const [job, setJob] = useState<JobResult | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkStatus() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }
        const data: JobResult = await res.json();
        if (!isMounted) return;

        setJob(data);

        if (data.status === "done") {
          setTimeout(() => {
            router.push(`/results/${jobId}`);
          }, 500);
        }
      } catch (err: any) {
        if (isMounted) {
          setFetchError(err.message || "Failed to query job status");
        }
      }
    }

    checkStatus();

    const interval = setInterval(() => {
      if (job?.status === "done" || job?.status === "error") {
        clearInterval(interval);
        return;
      }
      checkStatus();
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [jobId, job?.status, router]);

  const currentStatus = job?.status || "uploading";
  const isError = currentStatus === "error" || Boolean(fetchError);
  const errorMessage = job?.error || fetchError;

  // Dynamically omit the AI Grading step if auto-grading is disabled by the user
  const isGradingDisabled = job?.enableGrading === false;
  const activeSteps = isGradingDisabled
    ? STEPS.filter((s) => s.key !== "grading")
    : STEPS;

  const currentStepIndex = Math.max(0, activeSteps.findIndex((s) => s.key === currentStatus));

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-3 py-6 sm:py-10 max-w-md mx-auto">
      {isError ? (
        <div className="w-full bg-rose-50/90 border border-rose-200 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-md">
          <div className="w-14 h-14 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto shadow-xs">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-extrabold text-rose-950 text-base sm:text-lg font-heading">
              Processing Interrupted
            </h3>
            <p className="text-xs text-rose-700 font-medium mt-1">
              {errorMessage}
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Upload</span>
          </button>
        </div>
      ) : (
        /* Clean Step-by-Step Processing Card */
        <div className="w-full space-y-4">
          {/* Header Title */}
          <div className="space-y-1 text-center">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading flex items-center justify-center space-x-2">
              <span>Extracting...</span>
              <Loader2 className="w-4.5 h-4.5 text-orange-500 animate-spin" />
            </h2>
            <p className="text-xs font-medium text-slate-500">
              This may take a while
            </p>
          </div>

          {/* Clean Step Checklist Box */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-3.5 sm:p-4 shadow-sm space-y-2.5 text-left">
            <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-100">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Pipeline Progress
              </span>
              <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/60">
                Step {Math.min(currentStepIndex + 1, activeSteps.length)} of {activeSteps.length}
              </span>
            </div>

            <div className="space-y-2 pt-1">
              {activeSteps.map((step, idx) => {
                const isFinished = currentStepIndex > idx || currentStatus === "done";
                const isActive = currentStepIndex === idx && currentStatus !== "done";
                const StepIcon = step.icon;

                return (
                  <div
                    key={step.key}
                    className={`flex items-start space-x-3 p-3 rounded-2xl border transition-all ${
                      isActive
                        ? "bg-orange-50/80 border-orange-300/80 shadow-2xs"
                        : isFinished
                        ? "bg-slate-50/80 border-slate-200/60 opacity-95"
                        : "bg-slate-50/30 border-transparent opacity-40"
                    }`}
                  >
                    {/* Status Indicator Icon */}
                    <div className="shrink-0 pt-0.5">
                      {isFinished ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      ) : isActive ? (
                        <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-xs">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </div>
                      )}
                    </div>

                    {/* Step Title & Subtitle */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <StepIcon
                          className={`w-3.5 h-3.5 ${
                            isActive
                              ? "text-orange-600"
                              : isFinished
                              ? "text-emerald-600"
                              : "text-slate-400"
                          }`}
                        />
                        <p
                          className={`text-xs font-bold ${
                            isActive
                              ? "text-orange-950"
                              : isFinished
                              ? "text-slate-800"
                              : "text-slate-500"
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                      <p
                        className={`text-[10px] mt-0.5 leading-tight ${
                          isActive
                            ? "text-orange-800/90 font-medium"
                            : "text-slate-400"
                        }`}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
