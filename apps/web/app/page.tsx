"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
  Sparkles,
  CheckSquare,
  Square,
} from "lucide-react";

interface UploadFileItem {
  id: string;
  file: File;
  previewUrl?: string;
  pages?: number;
}

/* Dynamic Folded-Corner File Badge Icon (PDF/PNG/JPG/WEBP) */
function FileBadgeIcon({
  ext = "pdf",
  className = "w-8 h-10",
}: {
  ext?: string;
  className?: string;
}) {
  const isPdf = ext.toLowerCase() === "pdf";
  const bgMain = isPdf ? "#EF4444" : "#2563EB";
  const bgFold = isPdf ? "#DC2626" : "#1D4ED8";
  const label = (ext || "file").toUpperCase().slice(0, 4);

  return (
    <div className={`relative shrink-0 ${className}`}>
      <svg
        width="34"
        height="40"
        viewBox="0 0 34 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 6C0 2.68629 2.68629 0 6 0H22L34 12V34C34 37.3137 31.3137 40 28 40H6C2.68629 40 0 37.3137 0 34V6Z"
          fill={bgMain}
        />
        <path
          d="M22 0L34 12H26C23.7909 12 22 10.2091 22 8V0Z"
          fill={bgFold}
        />
        <text
          x="17"
          y="27"
          fill="white"
          fontSize={label.length > 3 ? "7.5" : "8.5"}
          fontWeight="900"
          textAnchor="middle"
          fontFamily="sans-serif"
          letterSpacing="0.5px"
        >
          {label}
        </text>
      </svg>
    </div>
  );
}

async function getPdfPageCount(file: File): Promise<number> {
  try {
    const buffer = await file.arrayBuffer();
    const text = new TextDecoder("latin1").decode(buffer);

    // Look for /Type /Pages ... /Count N
    const pagesMatch = text.match(/\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/);
    if (pagesMatch && pagesMatch[1]) {
      const count = parseInt(pagesMatch[1], 10);
      if (count > 0 && count < 1000) return count;
    }

    // Count occurrences of /Type /Page (excluding /Pages)
    const pageMatches = text.match(/\/Type\s*\/Page\b(?!\s*s)/g);
    if (pageMatches && pageMatches.length > 0) {
      return pageMatches.length;
    }
  } catch (e) {
    console.error("Error reading PDF page count:", e);
  }
  return 2;
}

export default function Home() {
  const router = useRouter();

  const [qpFiles, setQpFiles] = useState<UploadFileItem[]>([]);
  const [asFiles, setAsFiles] = useState<UploadFileItem[]>([]);
  const [enableGrading, setEnableGrading] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSingleFileAdd = async (
    incoming: FileList | null,
    setFiles: React.Dispatch<React.SetStateAction<UploadFileItem[]>>,
    maxSizeMB: number,
    label: string
  ) => {
    if (!incoming || incoming.length === 0) return;
    const file = incoming[0];

    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMsg(`${label} exceeds maximum allowed size of ${maxSizeMB}MB.`);
      return;
    }

    setErrorMsg(null);

    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    let detectedPages = 1;
    if (isPdf) {
      detectedPages = await getPdfPageCount(file);
    }

    const item: UploadFileItem = {
      id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      file,
      pages: detectedPages,
    };

    setFiles([item]);
  };

  const handleRemove = (
    setFiles: React.Dispatch<React.SetStateAction<UploadFileItem[]>>
  ) => {
    setFiles([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qpFiles.length === 0 || asFiles.length === 0) {
      setErrorMsg(
        "Please upload both Question Paper and Answer Sheet to proceed."
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("questionPaper", qpFiles[0].file);
      formData.append("answerSheet", asFiles[0].file);
      formData.append("enableGrading", "true");

      const res = await fetch("/api/jobs", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to start mapping job");
      }

      const data = await res.json();
      router.push(`/process/${data.jobId}`);
    } catch (err: any) {
      setErrorMsg(
        err.message || "An unexpected error occurred. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  const canSubmit = qpFiles.length > 0 && asFiles.length > 0;

  return (
    <div className="max-w-4xl mx-auto py-3 sm:py-8 space-y-5 sm:space-y-6 px-3 sm:px-6">
      {/* Title Header matching Figma - Exact 24px Mobile / 40px Desktop Bricolage Grotesque */}
      <div className="text-center space-y-2.5 sm:space-y-3">
        {/* Desktop Title Header */}
        <h1 className="hidden md:flex text-[40px] font-bold text-slate-900 leading-[1.2] tracking-[-0.04em] items-center justify-center flex-wrap gap-2 font-heading">
          <span>Upload</span>
          <span className="bg-[#feeeea] text-[#f0562e] px-4 py-1 rounded-2xl border border-[#fcd5cb] font-bold">
            Question Paper & Answer Sheets
          </span>
        </h1>

        {/* Mobile Title Header */}
        <h1 className="md:hidden text-[24px] font-bold text-[#0f172a] leading-[1.25] tracking-[-0.03em] text-center font-heading">
          Upload Question Paper <br />
          & Answer Sheets
        </h1>
        <p className="text-xs sm:text-base md:text-lg font-normal text-slate-600 tracking-[0.01em]">
          Upload both files to get started
        </p>

        {/* Center Teacher Avatar Illustration - Mobile 110px x 110px / Desktop 137px x 138px */}
        <div className="pt-2 sm:pt-3 pb-1 flex justify-center">
          <div className="w-[110px] h-[110px] md:w-[137px] md:h-[138px] relative flex items-center justify-center shrink-0 rounded-full overflow-hidden [clip-path:circle(49%_at_50%_50%)]">
            <img
              src="/teacher_avatar_figma.jpg"
              alt="Teacher Avatar Figma Illustration"
              className="w-full h-full object-cover scale-[1.03]"
            />
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="max-w-2xl mx-auto p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs sm:text-sm flex items-center space-x-2.5 shadow-xs">
          <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        {/* Upload Cards Grid Container matching Figma - Mobile 373px x 290px / Desktop 789px x 205px */}
        <div className="bg-[#e9ecef]/70 p-1.5 sm:p-3 rounded-[24px] sm:rounded-[28px] border border-slate-200/90 w-full max-w-[373px] md:max-w-[789px] mx-auto min-h-[280px] md:min-h-[205px] flex items-center justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 w-full">
            {/* Question Paper Card - Mobile 349px x 127px / Desktop 374.5px x 181px */}
            <UploadCardFigma
              titleHighlight="Question Paper"
              file={qpFiles[0] || null}
              maxSizeMB={10}
              inputName="qp_input"
              defaultFileName="Class_10_maths_unit_test.pdf"
              onSelect={(files) =>
                handleSingleFileAdd(files, setQpFiles, 10, "Question Paper")
              }
              onRemove={() => handleRemove(setQpFiles)}
            />

            {/* Answer Sheet Card - Mobile 349px x 127px / Desktop 374.5px x 181px */}
            <UploadCardFigma
              titleHighlight="Answer Sheet"
              file={asFiles[0] || null}
              maxSizeMB={10}
              inputName="as_input"
              defaultFileName="student_1_answer_sheet.pdf"
              onSelect={(files) =>
                handleSingleFileAdd(files, setAsFiles, 10, "Answer Sheet")
              }
              onRemove={() => handleRemove(setAsFiles)}
            />
          </div>
        </div>

        {/* Action Button & Subtitle matching Figma - 161px x 44px Button inside 410px Container */}
        <div className="max-w-[410px] mx-auto text-center space-y-2.5 pt-1">
          <button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            className={`w-[161px] h-[44px] rounded-full font-semibold text-sm transition-all inline-flex items-center justify-center space-x-2 shadow-xs ${
              isSubmitting
                ? "bg-slate-800 text-white cursor-wait opacity-90"
                : canSubmit
                ? "bg-[#f0562e] hover:bg-[#d94822] text-white shadow-orange-500/20 hover:shadow-md cursor-pointer"
                : "bg-[#9c9c9c] text-white cursor-not-allowed opacity-90"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Start Mapping</span>
                <ArrowRight className="w-4 h-4 stroke-[2]" />
              </>
            )}
          </button>

          {/* Figma Subtitle Text */}
          <p className="text-xs sm:text-[13px] text-[#64748b] font-normal leading-relaxed">
            Once both files are uploaded, you&apos;ll able to map answers with questions
          </p>
        </div>
      </form>
    </div>
  );
}

interface UploadCardFigmaProps {
  titleHighlight: string;
  file: UploadFileItem | null;
  maxSizeMB: number;
  inputName: string;
  defaultFileName: string;
  onSelect: (files: FileList | null) => void;
  onRemove: () => void;
}

function UploadCardFigma({
  titleHighlight,
  file,
  maxSizeMB,
  inputName,
  defaultFileName,
  onSelect,
  onRemove,
}: UploadCardFigmaProps) {
  const fileName = file?.file?.name || defaultFileName;
  const ext = fileName.split(".").pop()?.toLowerCase() || "pdf";
  const isPdf = ext === "pdf";

  // Format file size (e.g. 1MB, 2.5MB, or 350KB)
  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes <= 0) return "1MB";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) {
      const formatted = mb.toFixed(1);
      return (formatted.endsWith(".0") ? mb.toFixed(0) : formatted) + "MB";
    } else if (mb >= 0.1) {
      return mb.toFixed(1) + "MB";
    } else {
      const kb = Math.max(1, Math.round(bytes / 1024));
      return kb + "KB";
    }
  };

  const sizeFormatted = file ? formatFileSize(file.file.size) : "1MB";
  const pageNum = file?.pages || 1;
  const pagesText = isPdf ? `${pageNum} ${pageNum === 1 ? "Page" : "Pages"}` : "Image";

  return (
    <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-2 sm:p-5 text-center transition-all hover:border-slate-400 shadow-2xs flex flex-col items-center justify-center min-h-[127px] md:min-h-[181px] w-full max-w-[349px] md:max-w-none mx-auto relative overflow-visible">
      {file ? (
        /* Uploaded File View - Dynamic PDF vs PNG/JPG Badge */
        <div className="w-full max-w-[308px] min-h-[75px] h-auto relative bg-[#f8fafc] border border-slate-200/90 rounded-[16px] p-3 shadow-2xs flex items-center space-x-3 text-left mx-auto my-auto">
          {/* Dynamic File Badge Icon (Red PDF / Blue PNG/JPG) */}
          <FileBadgeIcon ext={ext} className="w-8 h-10 shrink-0" />

          {/* File Meta Info with Multi-Line Text Wrapping for Long File Names */}
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-[13px] sm:text-[14px] font-bold text-slate-900 leading-snug break-words line-clamp-2">
              {fileName}
            </p>
            <p className="text-[11px] sm:text-[12px] text-[#64748b] font-normal mt-1 leading-none">
              {sizeFormatted} • {pagesText}
            </p>
          </div>

          {/* Dark Circular (X) Remove Button */}
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-[#475569] hover:bg-slate-900 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 cursor-pointer z-10"
            title="Remove file"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      ) : (
        /* Empty Compact Dropzone matching Figma - Mobile 349px x 127px / Desktop 374.5px x 181px */
        <label
          htmlFor={inputName}
          className="w-full h-full flex flex-col items-center justify-center cursor-pointer py-2 sm:py-3"
        >
          <div className="w-12 h-12 rounded-[14px] bg-[#f1f5f9] border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-800 shrink-0 mb-2">
            <Upload className="w-5 h-5 text-slate-800 stroke-[2]" />
          </div>

          <div>
            <p className="text-[18px] sm:text-[20px] font-bold text-slate-900 leading-snug">
              Upload <span className="text-[#f0562e]">{titleHighlight}</span>
            </p>
            <p className="text-[13px] sm:text-[14px] text-slate-400 font-normal mt-0.5">
              Max {maxSizeMB}MB
            </p>
          </div>

          <input
            id={inputName}
            type="file"
            multiple={false}
            accept=".pdf,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              onSelect(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}
