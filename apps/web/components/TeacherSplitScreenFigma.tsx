"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { JobResult, AnswerSegment } from "@repo/shared";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

interface TeacherSplitScreenFigmaProps {
  job: JobResult;
}

export function TeacherSplitScreenFigma({ job }: TeacherSplitScreenFigmaProps) {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    job.questions[0]?.id || null
  );
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [activePageIdx, setActivePageIdx] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Set<string>>(
    new Set([job.questions[0]?.id || ""])
  );
  const [expandAll, setExpandAll] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<"questions" | "canvas">("questions");

  // Ref to actual rendered <img> element for pixel-perfect bounding box alignment
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Calculate actual rendered image dimensions from getBoundingClientRect()
  const updateImgDimensions = useCallback(() => {
    if (imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setImgDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    }
  }, []);

  // Listen to window resize, ResizeObserver on <img>, zoom level, page index, selected question & tab changes
  useEffect(() => {
    updateImgDimensions();

    const handleResize = () => {
      updateImgDimensions();
    };

    window.addEventListener("resize", handleResize);

    let observer: ResizeObserver | null = null;
    if (imgRef.current && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        updateImgDimensions();
      });
      observer.observe(imgRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [updateImgDimensions, zoomLevel, activePageIdx, selectedQuestionId, mobileTab]);

  // Currently selected question & mapping
  const selectedQuestion = job.questions.find((q) => q.id === selectedQuestionId) || null;
  const selectedMapping = selectedQuestion
    ? job.mappings.find((m) => m.questionId === selectedQuestion.id)
    : null;

  // Segments mapped to selected question
  const mappedSegmentIds = selectedMapping?.answerSegmentIds || [];
  const mappedSegments = job.answerSegments.filter((s) => mappedSegmentIds.includes(s.id));

  // Switch page automatically when selected question changes
  useEffect(() => {
    if (mappedSegments.length > 0 && mappedSegments[0].pages.length > 0) {
      const targetPage = mappedSegments[0].pages[0];
      if (typeof targetPage === "number" && targetPage < job.answerSheetPages.length) {
        setActivePageIdx(targetPage);
      }
    }
  }, [selectedQuestionId]);

  // Toggle card expansion
  const toggleExpandCard = (id: string) => {
    setExpandedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle Expand All / Collapse All
  const handleToggleExpandAll = () => {
    if (expandAll) {
      setExpandedQuestionIds(new Set());
      setExpandAll(false);
    } else {
      setExpandedQuestionIds(new Set(job.questions.map((q) => q.id)));
      setExpandAll(true);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile Tab Switcher matching Image 4 (Questions | Answer Sheet) */}
      <div className="flex md:hidden bg-slate-200/70 border border-slate-200/90 p-1 rounded-full text-xs font-bold text-slate-700 w-full max-w-[340px] mx-auto shadow-2xs mb-1">
        <button
          type="button"
          onClick={() => setMobileTab("questions")}
          className={`flex-1 py-2 rounded-full transition-all text-center text-xs ${
            mobileTab === "questions"
              ? "bg-[#25282a] text-white shadow-md font-extrabold"
              : "text-slate-600 hover:text-slate-900 font-semibold"
          }`}
        >
          Questions
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("canvas")}
          className={`flex-1 py-2 rounded-full transition-all text-center text-xs ${
            mobileTab === "canvas"
              ? "bg-[#25282a] text-white shadow-md font-extrabold"
              : "text-slate-600 hover:text-slate-900 font-semibold"
          }`}
        >
          Answer Sheet
        </button>
      </div>

      {/* Main Split Screen View */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Sleek Outer Container Card around Question Section (Image 3) */}
        <div
          className={`md:col-span-6 bg-slate-50/60 sm:bg-white/80 border border-slate-200/90 rounded-[28px] p-3.5 sm:p-5 shadow-xs flex-col space-y-3.5 ${
            mobileTab === "questions" ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Section Header with Title & Expand All Button */}
          <div className="flex items-center justify-between px-1 pb-1">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              Extracted Questions (from question paper)
            </h2>
            <button
              onClick={handleToggleExpandAll}
              className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs px-3.5 py-1.5 rounded-full transition-colors shadow-2xs cursor-pointer"
            >
              {expandAll ? "Collapse All" : "Expand All"}
            </button>
          </div>

          {/* Question Cards List */}
          {job.questions.map((q) => {
            const mapping = job.mappings.find((m) => m.questionId === q.id);
            const grade = job.grades?.find((g) => g.questionId === q.id);
            const isSelected = selectedQuestionId === q.id;
            const isExpanded = expandedQuestionIds.has(q.id) || isSelected;

            // Score calculation & exact Figma pill styling
            const maxScore = grade?.maxScore ?? q.marks ?? 5;
            const score = grade?.score ?? (mapping?.status === "answered" ? maxScore : 0);
            const isFullScore = score === maxScore && maxScore > 0;
            const isZeroScore = score === 0;

            let pillStyle = "bg-[#fff2e8] text-[#f0562e]"; // Light orange default for partial
            if (isFullScore) {
              pillStyle = "bg-[#e6f7ed] text-[#16a34a]"; // Light green for full
            } else if (isZeroScore) {
              pillStyle = "bg-[#f1f5f9] text-[#64748b]"; // Light slate for 0 score
            }

            // Extract main number vs sub-label (e.g., Q "11 a." -> main "11", sub "a.")
            const rawNum = q.number || `${q.order + 1}`;
            const mainNumMatch = rawNum.match(/\d+/);
            const mainNum = mainNumMatch ? mainNumMatch[0] : `${q.order + 1}`;

            let subLabel = "";
            if (rawNum.includes("a") || rawNum.toLowerCase().includes("a.")) subLabel = "a.";
            else if (rawNum.includes("b") || rawNum.toLowerCase().includes("b.")) subLabel = "b.";
            else if (rawNum.includes("c") || rawNum.toLowerCase().includes("c.")) subLabel = "c.";

            return (
              <div
                key={q.id}
                onClick={() => {
                  setSelectedQuestionId(q.id);
                  setSelectedSegmentId(null);
                  if (!isExpanded) {
                    setExpandedQuestionIds((prev) => new Set(prev).add(q.id));
                  }
                }}
                className={`bg-white rounded-3xl border transition-all cursor-pointer shadow-xs ${
                  isSelected
                    ? "border-2 border-[#f0562e] ring-1 ring-orange-300/50"
                    : "border border-slate-100 hover:border-slate-300"
                }`}
              >
                {/* Main Card Header Row - Mobile View matching Image 4 */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                  {/* Top Row on Mobile: Number Badge + Sublabel + Right Score Pill & Chevron */}
                  <div className="flex items-center justify-between w-full sm:w-auto">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full font-extrabold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-2xs text-white ${
                          isSelected ? "bg-[#f0562e]" : "bg-[#383b3e]"
                        }`}
                      >
                        {mainNum}
                      </div>

                      {subLabel && (
                        <span className="font-extrabold text-slate-800 text-xs sm:text-sm shrink-0">
                          {subLabel}
                        </span>
                      )}
                    </div>

                    {/* Mobile Score Pill & Chevron (Top Right on Mobile) */}
                    <div className="flex sm:hidden items-center space-x-2 shrink-0">
                      <span className={`font-extrabold text-xs px-3 py-1 rounded-2xl ${pillStyle}`}>
                        {score}/{maxScore}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpandCard(q.id);
                        }}
                        className="w-7 h-7 rounded-full bg-[#f4f6f8] flex items-center justify-center text-slate-600"
                        aria-label="Toggle details"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Question Text (Full Width below Badge on Mobile, Middle on Desktop) */}
                  <p className="text-slate-800 font-medium text-xs sm:text-sm leading-snug sm:line-clamp-2 min-w-0">
                    {q.text}
                  </p>

                  {/* Desktop Score Pill & Chevron (Right side on Desktop) */}
                  <div className="hidden sm:flex items-center space-x-2 shrink-0">
                    <span className={`font-extrabold text-xs sm:text-sm px-3.5 py-1.5 rounded-2xl ${pillStyle}`}>
                      {score}/{maxScore}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpandCard(q.id);
                      }}
                      className="w-8 h-8 rounded-full bg-[#f4f6f8] hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded AI Evaluation Only */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 space-y-3 border-t border-slate-100 bg-[#fafafa] rounded-b-3xl">
                    <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
                          <Sparkles className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                          <span>AI Feedback & Evaluation</span>
                        </div>
                        {grade?.verdict && (
                          <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {grade.verdict.replace("_", " ")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-sans mt-1">
                        {grade?.feedback ||
                          mapping?.reason ||
                          (mapping?.status === "answered"
                            ? "Correctly answered according to extracted evaluation criteria."
                            : "No answer matched for this question.")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Unmatched Answers Section in Purple Accent */}
          {job.unmatchedAnswers.length > 0 && (
            <div className="bg-white border-2 border-purple-300 rounded-3xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                <span className="text-xs font-bold text-purple-900 flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-purple-600" />
                  <span>Unmatched Answers ({job.unmatchedAnswers.length})</span>
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full">
                  Review Required
                </span>
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {job.unmatchedAnswers.map((u) => {
                  const seg = job.answerSegments.find((s) => s.id === u.answerSegmentId);
                  const isSelected = selectedSegmentId === u.answerSegmentId;

                  return (
                    <div
                      key={u.answerSegmentId}
                      onClick={() => {
                        setSelectedSegmentId(u.answerSegmentId);
                        if (seg && seg.pages.length > 0) {
                          setActivePageIdx(seg.pages[0]);
                        }
                      }}
                      className={`p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? "bg-purple-100 border-purple-500 ring-2 ring-purple-400/40 shadow-xs"
                          : "bg-purple-50/60 border-purple-200 hover:bg-purple-100/60"
                      }`}
                    >
                      <p className="text-purple-950 font-sans text-xs leading-relaxed bg-white p-2.5 rounded-lg border border-purple-100/80">
                        {seg?.transcript || "[Unmatched handwritten response]"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Answer Sheet Viewer (Green for Matched, Purple for Unmatched) */}
        <div className={`md:col-span-6 flex-col space-y-3 ${mobileTab === "canvas" ? "flex" : "hidden md:flex"}`}>
          {/* Dark Control Header Bar */}
          <div className="bg-[#232628] text-white rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between shadow-md">
            <h3 className="font-extrabold text-xs sm:text-sm text-white tracking-wide font-heading hidden sm:block">
              Answer Sheet
            </h3>

            <div className="flex items-center justify-between w-full sm:w-auto space-x-1.5 sm:space-x-2.5">
              {/* Zoom Controls */}
              <div className="flex items-center bg-[#3c3e42] rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs text-white space-x-1 sm:space-x-2 shadow-2xs">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(40, z - 20))}
                  className="p-0.5 sm:p-1 rounded-md hover:bg-slate-700 transition-colors text-white hover:text-orange-400 cursor-pointer"
                  title="Zoom Out"
                >
                  <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                </button>
                <span className="font-bold min-w-[28px] sm:min-w-[36px] text-center select-none">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(200, z + 20))}
                  className="p-0.5 sm:p-1 rounded-md hover:bg-slate-700 transition-colors text-white hover:text-orange-400 cursor-pointer"
                  title="Zoom In"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Page Navigation Controls */}
              <div className="flex items-center bg-[#3c3e42] rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs text-white space-x-1 sm:space-x-2 shadow-2xs">
                <button
                  onClick={() => setActivePageIdx((p) => Math.max(0, p - 1))}
                  disabled={activePageIdx === 0}
                  className="p-0.5 sm:p-1 rounded-md hover:bg-slate-700 disabled:opacity-30 transition-colors text-white hover:text-orange-400 cursor-pointer"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                </button>
                <span className="font-semibold select-none px-0.5 sm:px-1 whitespace-nowrap">
                  Page {activePageIdx + 1} of {job.answerSheetPages.length}
                </span>
                <button
                  onClick={() => setActivePageIdx((p) => Math.min(job.answerSheetPages.length - 1, p + 1))}
                  disabled={activePageIdx === job.answerSheetPages.length - 1}
                  className="p-0.5 sm:p-1 rounded-md hover:bg-slate-700 disabled:opacity-30 transition-colors text-white hover:text-orange-400 cursor-pointer"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* Answer Sheet Viewport with Dynamic ResizeObserver Bounding Box Overlay */}
          <div className="bg-[#1e2022] p-3 sm:p-4 flex justify-center items-start overflow-auto rounded-3xl border border-slate-800 shadow-md min-h-[520px] md:min-h-[620px]">
            <div
              className="relative transition-all duration-200 max-w-full"
              style={{ width: `${zoomLevel}%` }}
            >
              <img
                ref={imgRef}
                src={job.answerSheetPages[activePageIdx]}
                alt={`Answer Sheet Page ${activePageIdx + 1}`}
                onLoad={updateImgDimensions}
                className="w-full h-auto block rounded-lg shadow-sm select-none"
              />

              {/* Dynamic SVG Bounding Box Overlay (Recalculated on ResizeObserver, Zoom & Load) */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                  width: imgDimensions.width ? `${imgDimensions.width}px` : "100%",
                  height: imgDimensions.height ? `${imgDimensions.height}px` : "100%",
                }}
                viewBox={
                  imgDimensions.width && imgDimensions.height
                    ? `0 0 ${imgDimensions.width} ${imgDimensions.height}`
                    : "0 0 100 100"
                }
                preserveAspectRatio="none"
              >
                {job.answerSegments
                  .filter((seg) => {
                    const isMappedToSelectedQ = mappedSegmentIds.includes(seg.id);
                    const isDirectlySelected = selectedSegmentId === seg.id;
                    return isDirectlySelected || isMappedToSelectedQ;
                  })
                  .flatMap((seg) => {
                    const isUnmatched = job.unmatchedAnswers.some(
                      (u) => u.answerSegmentId === seg.id
                    );
                    const pageBoxes = seg.boxes.filter((b) => (b.page ?? 0) === activePageIdx);

                    return pageBoxes.map((box, bIdx) => {
                      const isPx = imgDimensions.width > 0 && imgDimensions.height > 0;
                      const w = imgDimensions.width || 100;
                      const h = imgDimensions.height || 100;

                      // Compute pixel coordinates from rendered image dimensions
                      const pixelX = isPx ? box.x * w : Math.max(box.x * 100, 1.5);
                      const pixelY = isPx ? box.y * h : Math.max(box.y * 100, 1);
                      const pixelW = isPx ? box.w * w : Math.min(box.w * 100, 97 - pixelX);
                      const pixelH = isPx ? box.h * h : Math.min(box.h * 100, 98 - pixelY);

                      const fillCol = isUnmatched
                        ? "rgba(168, 85, 247, 0.22)"
                        : "rgba(34, 197, 94, 0.22)";
                      const strokeCol = isUnmatched ? "#a855f7" : "#16a34a";
                      const strokeWidth = isPx ? 3 : 0.45;
                      const rx = isPx ? 6 : 0.6;

                      return (
                        <g key={`${seg.id}-${bIdx}`}>
                          <rect
                            x={pixelX}
                            y={pixelY}
                            width={pixelW}
                            height={pixelH}
                            fill={fillCol}
                            stroke={strokeCol}
                            strokeWidth={strokeWidth}
                            rx={rx}
                          />
                        </g>
                      );
                    });
                  })}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
