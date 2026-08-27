"use client";

import React, { useState, useRef, useEffect } from "react";
import { JobResult, Question, AnswerSegment, Grade } from "@repo/shared";
import {
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Award,
  BarChart2
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

  // Currently selected question & mapping
  const selectedQuestion = job.questions.find((q) => q.id === selectedQuestionId) || null;
  const selectedMapping = selectedQuestion
    ? job.mappings.find((m) => m.questionId === selectedQuestion.id)
    : null;
  const selectedGrade = selectedQuestion && job.grades
    ? job.grades.find((g) => g.questionId === selectedQuestion.id)
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

  // Expand All / Collapse All
  const handleToggleExpandAll = () => {
    if (expandAll) {
      setExpandedQuestionIds(new Set());
      setExpandAll(false);
    } else {
      setExpandedQuestionIds(new Set(job.questions.map((q) => q.id)));
      setExpandAll(true);
    }
  };

  // Handle direct bounding box click on answer sheet
  const handleBoxClick = (segmentId: string) => {
    setSelectedSegmentId(segmentId);
    const foundMapping = job.mappings.find((m) => m.answerSegmentIds.includes(segmentId));
    if (foundMapping && foundMapping.questionId) {
      setSelectedQuestionId(foundMapping.questionId);
      setExpandedQuestionIds((prev) => new Set(prev).add(foundMapping.questionId!));
    }
  };

  const summary = job.gradeSummary;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top AI Overall Grading Summary (if grading enabled) */}
      {summary && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center">
          {/* Total Score Circle Metric */}
          <div className="md:col-span-4 flex items-center space-x-4 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4">
            <div className="min-w-[64px] px-2.5 py-2.5 h-16 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shrink-0 border-2 border-orange-500 shadow-sm">
              <span className="text-base sm:text-lg font-black leading-none tracking-tight font-heading">
                {Math.round(summary.percentage)}%
              </span>
              <span className="text-[9px] sm:text-[10px] text-orange-400 font-extrabold uppercase mt-1 tracking-wider">
                Grade
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Award className="w-4 h-4 text-orange-500" />
                <span>Overall Assessment Score</span>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {summary.totalScore} <span className="text-sm font-semibold text-slate-400">/ {summary.maxScore} Marks</span>
              </p>
            </div>
          </div>

          {/* AI Performance Summary Comment */}
          <div className="md:col-span-8 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
              <Sparkles className="w-4 h-4 text-orange-500 fill-orange-500" />
              <span>AI Evaluation Summary</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-200">
              "{summary.overallComment}"
            </p>
          </div>
        </div>
      )}

      {/* Mobile Tab Switcher matching Figma mobile screenshots */}
      <div className="flex md:hidden bg-slate-200/70 border border-slate-200/90 p-1 rounded-full text-xs font-bold text-slate-700 max-w-sm mx-auto shadow-2xs">
        <button
          type="button"
          onClick={() => setMobileTab("questions")}
          className={`flex-1 py-2.5 rounded-full transition-all text-center ${
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
          className={`flex-1 py-2.5 rounded-full transition-all text-center ${
            mobileTab === "canvas"
              ? "bg-[#25282a] text-white shadow-md font-extrabold"
              : "text-slate-600 hover:text-slate-900 font-semibold"
          }`}
        >
          Answer Sheet
        </button>
      </div>

      {/* Main Split Screen View - 2 Columns Side-by-Side on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Extracted Questions (from question paper) */}
        <div className={`md:col-span-5 flex-col space-y-4 ${mobileTab === "questions" ? "flex" : "hidden md:flex"}`}>
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Extracted Questions ({job.questions.length})
            </h2>
            <button
              onClick={handleToggleExpandAll}
              className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-full transition-colors shadow-2xs"
            >
              {expandAll ? "Collapse All" : "Expand All"}
            </button>
          </div>

          {/* Questions Accordion List */}
          <div className="space-y-3.5 max-h-[750px] overflow-y-auto pr-1">
            {job.questions.map((q) => {
              const mapping = job.mappings.find((m) => m.questionId === q.id);
              const grade = job.grades?.find((g) => g.questionId === q.id);
              const isSelected = selectedQuestionId === q.id;
              const isExpanded = expandedQuestionIds.has(q.id) || isSelected;

              const qSegments = (mapping?.answerSegmentIds || [])
                .map((id) => job.answerSegments.find((s) => s.id === id))
                .filter(Boolean) as AnswerSegment[];

              // Determine status / grade badge pill colors matching Figma
              const mapConfScore = mapping?.confidenceScore ?? (mapping?.status === "answered" ? 10 : 0);
              let badgeText = "Mapped";
              let badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold";

              if (job.grades && grade) {
                if (grade.verdict === "correct") {
                  badgeText = `${grade.score}/${grade.maxScore ?? q.marks ?? 5}`;
                  badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold";
                } else if (grade.verdict === "partially_correct") {
                  badgeText = `${grade.score}/${grade.maxScore ?? q.marks ?? 5}`;
                  badgeStyle = "bg-amber-100 text-amber-800 border-amber-300 font-bold";
                } else if (grade.verdict === "incorrect") {
                  badgeText = `0/${grade.maxScore ?? q.marks ?? 5}`;
                  badgeStyle = "bg-rose-100 text-rose-800 border-rose-300 font-bold";
                } else {
                  badgeText = "0/2";
                  badgeStyle = "bg-slate-100 text-slate-600 border-slate-300 font-medium";
                }
              } else if (!job.grades) {
                if (mapping?.status === "answered") {
                  badgeText = `Mapping Conf: ${mapConfScore}/10`;
                  badgeStyle = mapConfScore >= 8
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold"
                    : "bg-amber-100 text-amber-800 border-amber-300 font-bold";
                } else if (mapping?.status === "ambiguous") {
                  badgeText = `Needs Review (${mapConfScore}/10)`;
                  badgeStyle = "bg-amber-100 text-amber-800 border-amber-300 font-bold";
                } else {
                  badgeText = "Unmapped";
                  badgeStyle = "bg-rose-100 text-rose-700 border-rose-300 font-bold";
                }
              }

              const displayNum = q.number;

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
                  className={`bg-white rounded-2xl border transition-all cursor-pointer shadow-xs ${
                    isSelected
                      ? "border-2 border-orange-500 ring-1 ring-orange-400"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Card Top Header Row */}
                  <div className="p-4 flex items-start space-x-3">
                    {/* Circular Question Number Badge */}
                    <div className="w-7 h-7 rounded-full bg-slate-700 text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      {displayNum.replace(/[^0-9]/g, "") || q.order + 1}
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {displayNum.includes("(") || displayNum.includes(".") ? (
                            <span className="font-bold text-slate-800 text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                              {displayNum}
                            </span>
                          ) : null}
                        </div>

                        {/* Score Badge */}
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-bold text-xs px-2.5 py-0.5 rounded-full border ${badgeStyle}`}
                          >
                            {badgeText}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandCard(q.id);
                            }}
                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <p className="text-slate-800 font-medium text-xs leading-relaxed">
                        {q.text}
                      </p>
                    </div>
                  </div>

                  {/* Expanded Section (Figma AI Feedback / Mapped Transcript) */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl">
                      {/* AI Feedback Box matching Figma screenshot */}
                      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-900">
                            <Sparkles className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                            <span>{job.grades ? "AI Feedback & Evaluation" : "Mapping & Extraction Info"}</span>
                          </div>
                          {job.grades && grade && (
                            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              Verdict: {grade.verdict.replace("_", " ")}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                          {job.grades
                            ? (grade?.feedback ||
                              mapping?.reason ||
                              (mapping?.status === "answered"
                                ? "Excellent work! Handwritten answer detected and verified against printed question criteria."
                                : "No handwritten answer detected for this question."))
                            : (qSegments.length > 0
                              ? `Matched ${qSegments.length} segment(s) • Mapping Confidence Score: ${mapConfScore}/10 (${mapConfScore >= 9 ? "High Confidence Direct Match" : "Medium Confidence Semantic Match"}).`
                              : "No handwritten answer matched for this question.")}
                        </p>
                      </div>

                      {/* Mapped Handwriting Transcript */}
                      {qSegments.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Handwritten Answer ({qSegments.length} segment{qSegments.length > 1 ? "s" : ""}):
                          </span>
                          {qSegments.map((seg) => (
                            <div
                              key={seg.id}
                              className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 space-y-1"
                            >
                              <div className="flex items-center justify-between text-[10px] text-slate-500">
                                <span>Label: {seg.detectedNumber || "Unlabeled"}</span>
                                <span>Pages: {seg.pages.map((p) => `P${p + 1}`).join(", ")}</span>
                              </div>
                              <p className="whitespace-pre-wrap leading-relaxed text-slate-900">
                                {seg.transcript}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Unmatched Answers Section */}
          {job.unmatchedAnswers.length > 0 && (
            <div className="bg-white border border-purple-200 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                <span className="text-xs font-bold text-purple-900 flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-purple-600" />
                  <span>Unmatched Answers ({job.unmatchedAnswers.length})</span>
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
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
                      <div className="flex items-center justify-between text-xs font-bold text-purple-900 mb-1">
                        <span className="flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-500" />
                          <span>Unmatched Handwritten Text</span>
                        </span>
                        <span className="text-[10px] bg-purple-200/70 text-purple-800 font-semibold px-2 py-0.5 rounded-md">
                          {seg ? `Page ${(seg.pages[0] ?? 0) + 1}` : "Page 1"}
                        </span>
                      </div>
                      <p className="text-purple-950 font-sans text-xs leading-relaxed bg-white p-2.5 rounded-lg border border-purple-100/80 mt-1">
                        {seg?.transcript || "[No handwritten transcript available]"}
                      </p>
                      <p className="text-[10px] text-purple-600 font-medium mt-1 italic">
                        {u.reason || "Handwritten text does not match any printed question on the exam paper."}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Answer Sheet Viewer */}
        <div className={`md:col-span-7 flex-col space-y-3 ${mobileTab === "canvas" ? "flex" : "hidden md:flex"}`}>
          {/* Answer Sheet Header Bar matching Image 3 reference screenshot */}
          <div className="bg-[#25282a] text-white rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-md">
            <h3 className="font-extrabold text-xs sm:text-sm text-white tracking-wide font-heading hidden sm:block">
              Answer Sheet
            </h3>

            <div className="flex items-center justify-between w-full sm:w-auto space-x-2">
              {/* Zoom Controls */}
              <div className="flex items-center bg-slate-800/90 rounded-full border border-slate-700/80 p-0.5 text-xs">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(40, z - 20))}
                  className="w-6 h-6 rounded-full hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors"
                  title="Zoom Out"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  className="px-2 text-[10px] font-extrabold text-orange-400 hover:text-orange-300 uppercase transition-colors"
                  title="Reset Zoom / Fit Width"
                >
                  FIT
                </button>
                <span className="px-1 font-bold text-slate-200 text-xs min-w-[34px] text-center">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(200, z + 20))}
                  className="w-6 h-6 rounded-full hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors"
                  title="Zoom In"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Page Navigation Controls */}
              <div className="flex items-center bg-slate-800/90 rounded-full border border-slate-700/80 px-2.5 py-1 text-xs font-bold text-slate-200 space-x-2">
                <button
                  onClick={() => setActivePageIdx((p) => Math.max(0, p - 1))}
                  disabled={activePageIdx === 0}
                  className="disabled:opacity-30 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px]">
                  Page {activePageIdx + 1} of {job.answerSheetPages.length}
                </span>
                <button
                  onClick={() => setActivePageIdx((p) => Math.min(job.answerSheetPages.length - 1, p + 1))}
                  disabled={activePageIdx === job.answerSheetPages.length - 1}
                  className="disabled:opacity-30 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Answer Sheet Canvas Viewport - Clean container matching Image 3 */}
          <div className="bg-[#f8fafc] border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs relative p-2 sm:p-3 flex justify-center">
            <div
              className="relative transition-all duration-200 max-w-full"
              style={{ width: `${zoomLevel}%` }}
            >
              {/* Answer Sheet Page Image */}
              <img
                src={job.answerSheetPages[activePageIdx]}
                alt={`Answer Sheet Page ${activePageIdx + 1}`}
                className="w-full h-auto block rounded-xl shadow-xs border border-slate-200/70 select-none"
              />

              {/* SVG Bounding Box Overlay (Pixel-Perfect Responsive Alignment) */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {job.answerSegments
                  .filter((seg) => {
                    const isMappedToSelectedQ = mappedSegmentIds.includes(seg.id);
                    const isDirectlySelected = selectedSegmentId === seg.id;
                    // Show ONLY the highlight box for the active selected question or segment
                    if (selectedSegmentId || selectedQuestionId) {
                      return isDirectlySelected || isMappedToSelectedQ;
                    }
                    return true;
                  })
                  .flatMap((seg) => {
                  const isMappedToSelectedQ = mappedSegmentIds.includes(seg.id);
                  const isDirectlySelected = selectedSegmentId === seg.id;
                  const isUnmatched = job.unmatchedAnswers.some((u) => u.answerSegmentId === seg.id);
                  const isAmbiguous = selectedMapping?.status === "ambiguous" && isMappedToSelectedQ;

                  const pageBoxes = seg.boxes.filter((b) => (b.page ?? 0) === activePageIdx);

                  return pageBoxes.map((box, bIdx) => {
                    const xPct = box.x * 100;
                    const yPct = box.y * 100;
                    const wPct = box.w * 100;
                    const hPct = box.h * 100;

                    let strokeColor = "#22c55e"; // Bright green
                    let fillColor = "rgba(34, 197, 94, 0.18)";
                    let isDashed = false;

                    if (isAmbiguous) {
                      strokeColor = "#f59e0b"; // Amber
                      fillColor = "rgba(245, 158, 11, 0.2)";
                      isDashed = true;
                    } else if (isUnmatched) {
                      strokeColor = "#a855f7"; // Purple
                      fillColor = "rgba(168, 85, 247, 0.2)";
                    } else if (isDirectlySelected || isMappedToSelectedQ) {
                      strokeColor = "#16a34a"; // Bold Green
                      fillColor = "rgba(22, 163, 74, 0.25)";
                    }

                    const qNumberText = isUnmatched
                      ? "Unmatched"
                      : isAmbiguous
                      ? `Q${seg.detectedNumber || "Review"}`
                      : seg.detectedNumber
                      ? `Q${seg.detectedNumber}`
                      : selectedQuestion
                      ? `Q${selectedQuestion.number}`
                      : "Answer";

                    const badgeWidth = Math.max(5.2, qNumberText.length * 1.35);

                    return (
                      <g
                        key={`${seg.id}-${bIdx}`}
                        onClick={() => handleBoxClick(seg.id)}
                        className="cursor-pointer"
                      >
                        {/* Highlight Box with Sleek Thin Border */}
                        <rect
                          x={xPct}
                          y={yPct}
                          width={wPct}
                          height={hPct}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth={isMappedToSelectedQ || isDirectlySelected ? 0.40 : 0.22}
                          strokeDasharray={isDashed ? "1.2,1.2" : "none"}
                          rx={0.5}
                        />

                        {/* Top-Left Tag Badge */}
                        <rect
                          x={xPct}
                          y={Math.max(0, yPct - 2.2)}
                          width={badgeWidth}
                          height={2.2}
                          fill={strokeColor}
                          rx={0.3}
                        />
                        <text
                          x={xPct + 0.5}
                          y={Math.max(0, yPct - 2.2) + 1.55}
                          fill="#ffffff"
                          fontSize={1.3}
                          fontWeight="bold"
                        >
                          {qNumberText}
                        </text>
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
