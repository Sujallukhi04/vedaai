"use client";

import React, { useState } from "react";
import { Question } from "@repo/shared";
import { Eye, HelpCircle, Award, Layers } from "lucide-react";

interface QuestionPaperViewerProps {
  pageImages: string[];
  questions: Question[];
}

export function QuestionPaperViewer({
  pageImages,
  questions,
}: QuestionPaperViewerProps) {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    questions[0]?.id || null
  );
  const [hoveredQuestionId, setHoveredQuestionId] = useState<string | null>(null);

  // Group questions by page
  const questionsByPage: Record<number, Question[]> = {};
  questions.forEach((q) => {
    const p = q.page ?? q.box?.page ?? 0;
    if (!questionsByPage[p]) questionsByPage[p] = [];
    questionsByPage[p].push(q);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Extracted Questions Sidebar */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col h-[750px]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-sky-600" />
            <h2 className="font-bold text-slate-800 text-base">
              Extracted Questions ({questions.length})
            </h2>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">
            Module 2 View
          </span>
        </div>

        {questions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <HelpCircle className="w-12 h-12 mb-2 text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-medium">No questions detected on paper.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {questions.map((q) => {
              const isSelected = selectedQuestionId === q.id;
              const isHovered = hoveredQuestionId === q.id;

              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuestionId(q.id)}
                  onMouseEnter={() => setHoveredQuestionId(q.id)}
                  onMouseLeave={() => setHoveredQuestionId(null)}
                  className={`p-3.5 rounded-xl border text-sm transition-all cursor-pointer ${
                    isSelected
                      ? "bg-sky-50 border-sky-500 shadow-sm ring-1 ring-sky-500"
                      : isHovered
                      ? "bg-slate-50 border-slate-300"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs">
                        {q.number}
                      </span>
                      {q.parentNumber && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          Part of Q{q.parentNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {q.marks !== undefined && (
                        <span className="inline-flex items-center space-x-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
                          <Award className="w-3 h-3" />
                          <span>{q.marks} mks</span>
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        Page {q.page + 1}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-700 text-xs leading-relaxed line-clamp-3">
                    {q.text}
                  </p>

                  <div className="mt-2 text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1.5 border-t border-slate-100">
                    <span>
                      Box: [{q.box.x.toFixed(2)}, {q.box.y.toFixed(2)}, {q.box.w.toFixed(2)}, {q.box.h.toFixed(2)}]
                    </span>
                    <span>Order: #{q.order + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Question Paper Pages with Bounding Box Overlay */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex items-center justify-between bg-white border border-slate-200 px-4 py-3 rounded-xl shadow-sm">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-sky-600" />
            <h2 className="font-bold text-slate-800 text-sm">
              Question Paper Pages & Bounding Box Overlay
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {pageImages.length} page(s)
          </span>
        </div>

        <div className="space-y-6 max-h-[700px] overflow-y-auto pr-1">
          {pageImages.map((src, pageIdx) => {
            const pageQuestions = questionsByPage[pageIdx] || [];

            return (
              <div
                key={pageIdx}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
              >
                <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Page {pageIdx + 1} of {pageImages.length}</span>
                  <span>{pageQuestions.length} bounding box(es)</span>
                </div>

                <div className="relative w-full bg-slate-900">
                  <img
                    src={src}
                    alt={`Question Paper Page ${pageIdx + 1}`}
                    className="w-full h-auto block"
                  />

                  {/* Render SVG Overlay for Bounding Boxes */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    {pageQuestions.map((q) => {
                      const isSelected = selectedQuestionId === q.id;
                      const isHovered = hoveredQuestionId === q.id;
                      const box = q.box;

                      const strokeColor = isSelected
                        ? "#0284c7"
                        : isHovered
                        ? "#0ea5e9"
                        : "#e11d48";

                      const fillColor = isSelected
                        ? "rgba(2, 132, 199, 0.25)"
                        : isHovered
                        ? "rgba(14, 165, 233, 0.2)"
                        : "rgba(225, 29, 72, 0.12)";

                      const xPct = box.x * 100;
                      const yPct = box.y * 100;
                      const wPct = box.w * 100;
                      const hPct = box.h * 100;

                      return (
                        <g key={q.id}>
                          <rect
                            x={xPct}
                            y={yPct}
                            width={wPct}
                            height={hPct}
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={isSelected ? 0.8 : 0.4}
                            rx={0.5}
                          />
                          {/* Label badge */}
                          <rect
                            x={xPct}
                            y={Math.max(0, yPct - 2.5)}
                            width={Math.max(6, q.number.length * 1.8)}
                            height={2.5}
                            fill={strokeColor}
                            rx={0.3}
                          />
                          <text
                            x={xPct + 0.5}
                            y={Math.max(0, yPct - 2.5) + 1.8}
                            fill="#ffffff"
                            fontSize={1.6}
                            fontWeight="bold"
                          >
                            {q.number}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
