"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, ArrowRight, Loader2, Sparkles, CheckSquare, Square, AlertCircle, X } from "lucide-react";

interface UploadFileItem {
  id: string;
  file: File;
  previewUrl: string | null;
}

export default function LandingPage() {
  const router = useRouter();
  const [qpFiles, setQpFiles] = useState<UploadFileItem[]>([]);
  const [asFiles, setAsFiles] = useState<UploadFileItem[]>([]);
  const [enableGrading, setEnableGrading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSingleFileAdd = (
    files: FileList | null,
    setter: React.Dispatch<React.SetStateAction<UploadFileItem[]>>,
    maxSizeMB: number,
    fieldName: string
  ) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);

    const file = files[0];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      setErrorMsg(`${fieldName} exceeds maximum size limit of ${maxSizeMB}MB (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose a smaller file.`);
      return;
    }

    setter((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      return [
        {
          id: Math.random().toString(36).substring(2, 9),
          file,
          previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        },
      ];
    });
  };

  const handleRemove = (
    setter: React.Dispatch<React.SetStateAction<UploadFileItem[]>>
  ) => {
    setter((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      return [];
    });
  };

  const isReady = qpFiles.length === 1 && asFiles.length === 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReady || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      if (qpFiles[0]) formData.append("questionPaper", qpFiles[0].file);
      if (asFiles[0]) formData.append("answerSheet", asFiles[0].file);
      formData.append("enableGrading", enableGrading ? "true" : "false");

      const res = await fetch("/api/jobs", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start job");
      }

      const { jobId } = await res.json();
      router.push(`/process/${jobId}`);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-2 sm:py-4 space-y-3.5 sm:space-y-5 px-2 sm:px-4">
      {/* Title Header matching Figma - Scaled for mobile */}
      <div className="text-center space-y-1.5 sm:space-y-2">
        <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center flex-wrap gap-1.5 sm:gap-2">
          <span>Upload</span>
          <span className="bg-[#feeeea] text-[#f0562e] px-2.5 sm:px-3 py-0.5 rounded-full border border-[#fcd5cb] font-extrabold text-sm sm:text-xl md:text-2xl">
            Question Paper & Answer Sheets
          </span>
        </h1>
        <p className="text-[11px] sm:text-xs md:text-sm font-medium text-slate-500">
          Upload both files to get started
        </p>

        {/* Center Teacher Avatar Illustration - Fluid & Flexible size across mobile, tablet, and desktop */}
        <div className="pt-1 sm:pt-2 flex justify-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-[#fcece1] border border-[#f5d7c4] p-1.5 sm:p-2 flex items-center justify-center shadow-2xs shrink-0 transition-all">
            <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-22 md:h-22 lg:w-24 lg:h-24 rounded-full bg-[#f8d4bf] flex items-center justify-center overflow-hidden p-0.5 shadow-inner">
              <img
                src="/teacher_avatar.png"
                alt="Teacher Avatar Illustration"
                className="w-full h-full object-contain mix-blend-multiply scale-110"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="max-w-2xl mx-auto p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center space-x-2 shadow-xs">
          <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-5">
        {/* Compact Upload Cards Grid - 1 col on mobile, 2 cols on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5 max-w-2xl mx-auto">
          {/* Question Paper Card */}
          <UploadCardFigma
            titleHighlight="Question Paper"
            file={qpFiles[0] || null}
            maxSizeMB={10}
            inputName="qp_input"
            onSelect={(files) => handleSingleFileAdd(files, setQpFiles, 10, "Question Paper")}
            onRemove={() => handleRemove(setQpFiles)}
          />

          {/* Answer Sheet Card */}
          <UploadCardFigma
            titleHighlight="Answer Sheet"
            file={asFiles[0] || null}
            maxSizeMB={10}
            inputName="as_input"
            onSelect={(files) => handleSingleFileAdd(files, setAsFiles, 10, "Answer Sheet")}
            onRemove={() => handleRemove(setAsFiles)}
          />
        </div>

        {/* Optional AI Auto-Grading Layer Toggle - Responsive Layout for Mobile */}
        <div className="max-w-2xl mx-auto bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-100/90 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
              <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-orange-500" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                AI Auto-Grading Layer
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500">
                Automatically grade responses and calculate overall scores.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEnableGrading(!enableGrading)}
            className={`w-full sm:w-auto flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
              enableGrading
                ? "bg-slate-900 text-white border-orange-500 shadow-2xs"
                : "bg-slate-100 text-slate-600 border-slate-300"
            }`}
          >
            {enableGrading ? (
              <>
                <CheckSquare className="w-3.5 h-3.5 text-orange-400" />
                <span>Grading On</span>
              </>
            ) : (
              <>
                <Square className="w-3.5 h-3.5 text-slate-400" />
                <span>Map Only</span>
              </>
            )}
          </button>
        </div>

        {/* Action Button & Disclaimer matching Figma */}
        <div className="text-center space-y-1.5 pt-1">
          <button
            type="submit"
            disabled={!isReady || isSubmitting}
            className={`w-full sm:w-auto px-8 py-2.5 rounded-full font-extrabold text-xs sm:text-sm shadow-xs inline-flex items-center justify-center space-x-2 transition-all ${
              isReady && !isSubmitting
                ? "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer border-2 border-orange-500 hover:shadow-md"
                : "bg-slate-300 text-slate-500 cursor-not-allowed border-transparent"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                <span>Initializing Processing...</span>
              </>
            ) : (
              <>
                <span>Start Mapping</span>
                <ArrowRight className="w-4 h-4 text-orange-400" />
              </>
            )}
          </button>
          <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium px-2">
            Once both files are uploaded, you'll able to map answers with questions
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
  onSelect: (files: FileList | null) => void;
  onRemove: () => void;
}

function UploadCardFigma({
  titleHighlight,
  file,
  maxSizeMB,
  inputName,
  onSelect,
  onRemove,
}: UploadCardFigmaProps) {
  return (
    <div className="bg-[#f8fafc] border-2 border-dashed border-slate-200/90 rounded-3xl p-4 sm:p-6 text-center transition-all hover:border-slate-300 shadow-2xs flex flex-col items-center justify-center min-h-[130px] sm:min-h-[150px] relative">
      {file ? (
        /* Uploaded File View - White pill card with dark X button matching Figma */
        <div className="w-full max-w-xs relative bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-2xs flex items-center space-x-3 text-left">
          {/* File Format Badge Icon */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
            {file.previewUrl ? (
              <img
                src={file.previewUrl}
                alt="Preview"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <span className="text-[9px] font-black text-white bg-rose-600 px-1 py-0.5 rounded leading-none">
                  PDF
                </span>
              </div>
            )}
          </div>

          {/* File Meta Info */}
          <div className="min-w-0 flex-1 pr-3">
            <p className="text-xs font-extrabold text-slate-900 truncate">
              {file.file.name}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              {(file.file.size / (1024 * 1024)).toFixed(1)}MB • {file.file.type.endsWith("pdf") ? "PDF File" : "Image File"}
            </p>
          </div>

          {/* Dark Circular (X) Remove Button */}
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 cursor-pointer"
            title="Remove file"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Empty Compact Dropzone matching Figma */
        <label
          htmlFor={inputName}
          className="w-full h-full flex flex-col items-center justify-center cursor-pointer space-y-1.5 sm:space-y-2 py-1"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-700">
            <Upload className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-700" />
          </div>

          <div>
            <p className="text-xs font-extrabold text-slate-900">
              Upload <span className="text-[#f0562e]">{titleHighlight}</span>
            </p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
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
