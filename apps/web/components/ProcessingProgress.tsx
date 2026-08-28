"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { JobResult } from "@repo/shared";
import { AlertCircle, ArrowLeft } from "lucide-react";

interface ProcessingProgressProps {
  jobId: string;
}

/* 
  Official Google Gemini AI Icon Sparkle Component
  - Deep Concave Bezier Curved 4-Point Gemini Stars
  - Blends seamlessly with current background (no white box)
  - Staggered CSS Scaling & Coral/Orange Radial Glow
*/
function GeminiSparkleStars() {
  return (
    <div
      className="relative w-[150px] h-[150px] sm:w-[180px] sm:h-[180px] flex items-center justify-center mx-auto mb-4 select-none"
      aria-hidden="true"
    >
      {/* Soft Ambient Radial Glow - Blends with background */}
      <div className="absolute inset-0 bg-gradient-to-tr from-orange-400/20 via-orange-500/10 to-transparent rounded-full blur-2xl animate-pulse" />

      <style jsx>{`
        @keyframes geminiPulseLarge {
          0%,
          100% {
            transform: scale(0.82);
            opacity: 0.7;
            filter: drop-shadow(0 0 8px rgba(240, 86, 46, 0.4));
          }
          50% {
            transform: scale(1.06);
            opacity: 1;
            filter: drop-shadow(0 0 20px rgba(240, 86, 46, 0.85));
          }
        }

        @keyframes geminiPulseMedium {
          0%,
          100% {
            transform: scale(0.78);
            opacity: 0.7;
            filter: drop-shadow(0 0 6px rgba(240, 86, 46, 0.3));
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
            filter: drop-shadow(0 0 16px rgba(240, 86, 46, 0.8));
          }
        }

        @keyframes geminiPulseSmall {
          0%,
          100% {
            transform: scale(0.75);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
            filter: drop-shadow(0 0 12px rgba(240, 86, 46, 0.75));
          }
        }

        .star-top-large {
          animation: geminiPulseLarge 2.4s ease-in-out infinite;
          animation-delay: 0s;
          transform-origin: 105px 55px;
        }

        .star-bottom-left {
          animation: geminiPulseMedium 2.4s ease-in-out infinite;
          animation-delay: 0.8s;
          transform-origin: 75px 105px;
        }

        .star-bottom-right {
          animation: geminiPulseSmall 2.4s ease-in-out infinite;
          animation-delay: 1.6s;
          transform-origin: 132px 110px;
        }

        .star-dot-accent {
          animation: geminiPulseSmall 2.4s ease-in-out infinite;
          animation-delay: 0.3s;
          transform-origin: 55px 52px;
        }

        @media (prefers-reduced-motion: reduce) {
          .star-top-large,
          .star-bottom-left,
          .star-bottom-right,
          .star-dot-accent {
            animation: none !important;
            opacity: 1 !important;
            transform: scale(1) !important;
          }
        }
      `}</style>

      <svg
        width="177"
        height="177"
        viewBox="0 0 177 177"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 overflow-visible"
      >
        <defs>
          {/* Coral to Orange Rich Gradient */}
          <linearGradient
            id="geminiCoralGrad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#ff7e40" />
            <stop offset="50%" stopColor="#f0562e" />
            <stop offset="100%" stopColor="#d94822" />
          </linearGradient>
        </defs>

        {/* Small Coral Dot Accent - Top Left */}
        <circle
          cx="55"
          cy="52"
          r="7.5"
          fill="url(#geminiCoralGrad)"
          className="star-dot-accent"
        />

        {/* 1. LARGEST FIGMA GEMINI STAR - Top Right */}
        <path
          d="M 105 13 C 105 38 122 55 147 55 C 122 55 105 72 105 97 C 105 72 88 55 63 55 C 88 55 105 38 105 13 Z"
          fill="url(#geminiCoralGrad)"
          className="star-top-large"
        />

        {/* 2. MEDIUM FIGMA GEMINI STAR - Bottom Left */}
        <path
          d="M 75 77 C 75 94 86 105 103 105 C 86 105 75 116 75 133 C 75 116 64 105 47 105 C 64 105 75 94 75 77 Z"
          fill="url(#geminiCoralGrad)"
          className="star-bottom-left"
        />

        {/* 3. SMALL FIGMA GEMINI STAR - Bottom Right */}
        <path
          d="M 132 94 C 132 104 138 110 148 110 C 138 110 132 116 132 126 C 132 116 126 110 116 110 C 126 110 132 104 132 94 Z"
          fill="url(#geminiCoralGrad)"
          className="star-bottom-right"
        />
      </svg>
    </div>
  );
}

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
          }, 400);
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

  return (
    <div className="min-h-[55vh] sm:min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-6 sm:py-8 max-w-lg mx-auto bg-transparent">
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
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Upload</span>
          </button>
        </div>
      ) : (
        /* Seamless Transparent Centered Gemini AI Loading Screen */
        <main
          className="flex flex-col items-center justify-center space-y-2.5 sm:space-y-4 my-auto"
          aria-live="polite"
          aria-busy="true"
        >
          {/* Gemini Icon Coral Sparkle Stars */}
          <GeminiSparkleStars />

          {/* Heading & Subtitle */}
          <header className="space-y-1 sm:space-y-1.5 text-center">
            <h1 className="text-2xl sm:text-4xl md:text-[40px] font-bold text-[#1e293b] tracking-tight font-heading leading-tight">
              Extracting...
            </h1>
            <p className="text-sm sm:text-lg md:text-[22px] font-normal text-[#64748b] tracking-normal font-sans">
              This may take a while
            </p>
          </header>
        </main>
      )}
    </div>
  );
}
