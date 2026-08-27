"use client";

import React, { useState, useRef, useEffect } from "react";
import { JobResult, Question, AnswerSegment } from "@repo/shared";
import {
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  XCircle,
  Eye,
  Info
} from "lucide-react";

interface TeacherSplitScreenProps {
  job: JobResult;
}

export function TeacherSplitScreen({ job }: TeacherSplitScreenProps) {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    job.questions[0]?.id || null
  );
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [activePageIdx, setActivePageIdx] = useState<number>(0);
  const [filterStatus, setFilterStatus] = useState<"all" | "answered" | "ambiguous" | "unanswered">("all");
  const pageContainerRef = useRef<HTMLDivElement | null>(null);

  const answeredCount = job.mappings.filter((m) => m.status === "answered").length;
  const ambiguousCount = job.mappings.filter((m) => m.status === "ambiguous").length;
  const unansweredCount = job.mappings.filter((m) => m.status === "unanswered").length;
  const unmatchedCount = job.unmatchedAnswers.length;

  // Currently selected question object & mapping
  const selectedQuestion = job.questions.find((q) => q.id === selectedQuestionId) || null;
  const selectedMapping = selectedQuestion
    ? job.mappings.find((m) => m.questionId === selectedQuestion.id)
    : null;

  // Segments assigned to selected question
  const mappedSegmentIds = selectedMapping?.answerSegmentIds || [];
  const mappedSegments = job.answerSegments.filter((s) => mappedSegmentIds.includes(s.id));

  // Auto-switch active page when selected question changes
  useEffect(() => {
    if (mappedSegments.length > 0) {
      const firstPage = mappedSegments[0].pages[0];
      if (typeof firstPage === "number") {
        setActivePageIdx(firstPage);
      }
    }
  }, [selectedQuestionId]);

  // When clicking an answer segment directly on the viewer
  const handleSelectSegment = (segmentId: string) => {
    setSelectedSegmentId(segmentId);
    const foundMapping = job.mappings.find((m) => m.answerSegmentIds.includes(segmentId));
    if (foundMapping && foundMapping.questionId) {
      setSelectedQuestionId(foundMapping.questionId);
    }
  };

  // Filter questions list
  const filteredQuestions = job.questions.filter((q) => {
    const m = job.mappings.find((x) => x.questionId === q.id);
    if (filterStatus === "answered") return m?.status === "answered";
    if (filterStatus === "ambiguous") return m?.status === "ambiguous";
    if (filterStatus === "unanswered") return m?.status === "unanswered";
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Metrics & Quick Filter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setFilterStatus("all")}
          className={`p-3 rounded-xl border text-left transition-all ${
            filterStatus === "all"
              ? "bg-sky-50 border-sky-500 shadow-xs ring-1 ring-sky-500"
              : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="text-xs text-slate-500 font-medium">Total Questions</div>
          <div className="text-xl font-bold text-slate-800">{job.questions.length}</div>
        </button>

        <button
          onClick={() => setFilterStatus("answered")}
          className={`p-3 rounded-xl border text-left transition-all ${
            filterStatus === "answered"
              ? "bg-emerald-50 border-emerald-500 shadow-xs ring-1 ring-emerald-500"
              : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="text-xs text-emerald-700 font-medium flex items-center space-x-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Answered</span>
          </div>
          <div className="text-xl font-bold text-emerald-700">{answeredCount}</div>
        </button>

        <button
          onClick={() => setFilterStatus("ambiguous")}
          className={`p-3 rounded-xl border text-left transition-all ${
            filterStatus === "ambiguous"
              ? "bg-amber-50 border-amber-500 shadow-xs ring-1 ring-amber-500"
              : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="text-xs text-amber-700 font-medium flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Ambiguous</span>
          </div>
          <div className="text-xl font-bold text-amber-700">{ambiguousCount}</div>
        </button>

        <button
          onClick={() => setFilterStatus("unanswered")}
          className={`p-3 rounded-xl border text-left transition-all ${
            filterStatus === "unanswered"
              ? "bg-slate-100 border-slate-400 shadow-xs ring-1 ring-slate-400"
              : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="text-xs text-slate-600 font-medium flex items-center space-x-1">
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Unanswered</span>
          </div>
          <div className="text-xl font-bold text-slate-700">{unansweredCount}</div>
        </button>
      </div>

      {/* Main Split-Screen Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL: Questions List & Mappings Detail */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Question Selector List */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3 flex flex-col max-h-[420px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Questions ({filteredQuestions.length})
                </h3>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                Click question to highlight answer
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredQuestions.map((q) => {
                const m = job.mappings.find((x) => x.questionId === q.id);
                const isSelected = selectedQuestionId === q.id;

                let statusBadge = (
                  <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                    <XCircle className="w-3 h-3 text-slate-400" />
                    <span>Unanswered</span>
                  </span>
                );

                if (m?.status === "answered") {
                  statusBadge = (
                    <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>Answered</span>
                    </span>
                  );
                } else if (m?.status === "ambiguous") {
                  statusBadge = (
                    <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>Ambiguous</span>
                    </span>
                  );
                }

                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      setSelectedQuestionId(q.id);
                      setSelectedSegmentId(null);
                    }}
                    className={`p-3 rounded-lg border text-xs transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? "bg-sky-50/80 border-sky-500 shadow-xs ring-1 ring-sky-500"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded border border-sky-200">
                          {q.number}
                        </span>
                        {q.marks && (
                          <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                            {q.marks} Marks
                          </span>
                        )}
                      </div>
                      {statusBadge}
                    </div>
                    <p className="text-slate-800 font-medium line-clamp-2 leading-relaxed">
                      {q.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Question Detail Card */}
          {selectedQuestion && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Selected Question Detail
                </span>
                <span className="text-xs font-bold text-sky-700">
                  {selectedQuestion.number}
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                {selectedQuestion.text}
              </p>

              {/* Mapped Answer Segments */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Mapped Handwriting ({mappedSegments.length}):</span>
                  {selectedMapping?.status === "ambiguous" && (
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                      Confidence: {(selectedMapping.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                {selectedMapping?.reason && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 italic leading-relaxed">
                    <Info className="w-3.5 h-3.5 inline text-sky-600 mr-1" />
                    {selectedMapping.reason}
                  </p>
                )}

                {mappedSegments.length > 0 ? (
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {mappedSegments.map((seg, idx) => (
                      <div
                        key={seg.id}
                        onClick={() => setSelectedSegmentId(seg.id)}
                        className={`p-2.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                          selectedSegmentId === seg.id
                            ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                          <span>
                            Segment #{idx + 1} (Label:{" "}
                            <strong className="text-slate-800">
                              {seg.detectedNumber || "Unlabeled"}
                            </strong>
                            )
                          </span>
                          <span>Pages {seg.pages.map((p) => p + 1).join(", ")}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-slate-900 leading-relaxed text-[11px]">
                          {seg.transcript}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200">
                    No student answer segment detected for this question.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Unmatched Answers Section */}
          {unmatchedCount > 0 && (
            <div className="bg-white border border-purple-200 rounded-xl shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                <span className="text-xs font-bold text-purple-800 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-purple-600" />
                  <span>Unmatched Answer Segments ({unmatchedCount})</span>
                </span>
                <span className="text-[10px] text-purple-600 font-medium">Needs Teacher Review</span>
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
                      className={`p-2.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                        isSelected
                          ? "bg-purple-100 border-purple-500 ring-1 ring-purple-500 shadow-xs"
                          : "bg-purple-50/40 border-purple-200 hover:bg-purple-50"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-purple-900 font-semibold mb-1">
                        <span>Unmatched Segment</span>
                        <span>{seg ? `Page ${(seg.pages[0] ?? 0) + 1}` : ""}</span>
                      </div>
                      <p className="text-purple-950 whitespace-pre-wrap text-[11px] leading-relaxed">
                        {seg?.transcript || "[Transcript Unavailable]"}
                      </p>
                      <p className="text-[10px] text-purple-700 italic mt-1 font-sans">
                        Reason: {u.reason}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Handwritten Answer Sheet Viewer & Highlighting Overlay */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Header & Page Switcher Tabs */}
          <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Student Answer Sheet (Page {activePageIdx + 1} of {job.answerSheetPages.length})
              </h3>
            </div>

            {/* Page Buttons */}
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
              {job.answerSheetPages.map((_, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => setActivePageIdx(pIdx)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    activePageIdx === pIdx
                      ? "bg-white text-emerald-800 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Page {pIdx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Answer Sheet Image Container with Dynamic SVG Bounding Box Highlights */}
          <div
            ref={pageContainerRef}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm relative"
          >
            <div className="relative w-full bg-slate-950">
              <img
                src={job.answerSheetPages[activePageIdx]}
                alt={`Answer Sheet Page ${activePageIdx + 1}`}
                className="w-full h-auto block select-none"
              />

              {/* SVG Overlay for Bounding Boxes on Active Page */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {job.answerSegments.flatMap((seg) => {
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

                    let strokeColor = "#94a3b8"; // Slate
                    let fillColor = "rgba(148, 163, 184, 0.12)";

                    if (isDirectlySelected) {
                      strokeColor = "#2563eb"; // Blue
                      fillColor = "rgba(37, 99, 235, 0.35)";
                    } else if (isAmbiguous) {
                      strokeColor = "#d97706"; // Amber
                      fillColor = "rgba(217, 119, 6, 0.3)";
                    } else if (isMappedToSelectedQ) {
                      strokeColor = "#059669"; // Emerald
                      fillColor = "rgba(5, 150, 105, 0.3)";
                    } else if (isUnmatched) {
                      strokeColor = "#9333ea"; // Purple
                      fillColor = "rgba(147, 51, 234, 0.2)";
                    }

                    const labelText = seg.detectedNumber
                      ? `Ans ${seg.detectedNumber}`
                      : isUnmatched
                      ? "Unmatched"
                      : "Unlabeled";

                    return (
                      <g
                        key={`${seg.id}-${bIdx}`}
                        onClick={() => handleSelectSegment(seg.id)}
                        className="cursor-pointer"
                      >
                        <rect
                          x={xPct}
                          y={yPct}
                          width={wPct}
                          height={hPct}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth={isMappedToSelectedQ || isDirectlySelected ? 0.9 : 0.4}
                          rx={0.5}
                        />
                        {/* Label Badge */}
                        <rect
                          x={xPct}
                          y={Math.max(0, yPct - 2.8)}
                          width={Math.max(10, labelText.length * 1.8)}
                          height={2.8}
                          fill={strokeColor}
                          rx={0.3}
                        />
                        <text
                          x={xPct + 0.6}
                          y={Math.max(0, yPct - 2.8) + 2.0}
                          fill="#ffffff"
                          fontSize={1.7}
                          fontWeight="bold"
                        >
                          {labelText}
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
