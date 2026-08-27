"use client";

import React, { useState } from "react";
import { AnswerSegment } from "@repo/shared";
import { FileText, Tag, Eye, Layers } from "lucide-react";

interface AnswerSheetViewerProps {
  pageImages: string[];
  answerSegments: AnswerSegment[];
}

export function AnswerSheetViewer({
  pageImages,
  answerSegments,
}: AnswerSheetViewerProps) {
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(
    answerSegments[0]?.id || null
  );
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null);

  // Group boxes by page index
  const boxesByPage: Record<
    number,
    { segment: AnswerSegment; box: AnswerSegment["boxes"][0] }[]
  > = {};

  answerSegments.forEach((segment) => {
    segment.boxes.forEach((box) => {
      const p = box.page ?? 0;
      if (!boxesByPage[p]) boxesByPage[p] = [];
      boxesByPage[p].push({ segment, box });
    });
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Extracted Answer Segments Sidebar */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col h-[750px]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-slate-800 text-base">
              Extracted Answer Segments ({answerSegments.length})
            </h2>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded font-medium">
            Module 3 View
          </span>
        </div>

        {answerSegments.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <FileText className="w-12 h-12 mb-2 text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-medium">No handwritten answer segments detected.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {answerSegments.map((seg) => {
              const isSelected = selectedSegmentId === seg.id;
              const isHovered = hoveredSegmentId === seg.id;
              const isMultiPage = seg.pages.length > 1;

              return (
                <div
                  key={seg.id}
                  onClick={() => setSelectedSegmentId(seg.id)}
                  onMouseEnter={() => setHoveredSegmentId(seg.id)}
                  onMouseLeave={() => setHoveredSegmentId(null)}
                  className={`p-3.5 rounded-xl border text-sm transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500"
                      : isHovered
                      ? "bg-slate-50 border-slate-300"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      {seg.detectedNumber ? (
                        <span className="font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded text-xs flex items-center space-x-1">
                          <Tag className="w-3 h-3 text-emerald-600" />
                          <span>{seg.detectedNumber}</span>
                        </span>
                      ) : (
                        <span className="font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] italic">
                          Unlabeled Segment
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {isMultiPage ? (
                        <span className="text-[10px] bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-semibold flex items-center space-x-1">
                          <Layers className="w-3 h-3 text-purple-600" />
                          <span>Pages {seg.pages.map((p) => p + 1).join(", ")}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          Page {(seg.pages[0] ?? 0) + 1}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-700 text-xs leading-relaxed line-clamp-4 font-mono bg-slate-50/70 p-2 rounded border border-slate-100">
                    {seg.transcript}
                  </p>

                  <div className="mt-2 text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1.5 border-t border-slate-100">
                    <span>
                      Boxes: {seg.boxes.length} region(s)
                    </span>
                    <span>Order: #{seg.order + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Answer Sheet Pages with Bounding Box Overlay */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex items-center justify-between bg-white border border-slate-200 px-4 py-3 rounded-xl shadow-sm">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-slate-800 text-sm">
              Student Answer Sheet Pages & Bounding Box Overlay
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {pageImages.length} page(s)
          </span>
        </div>

        <div className="space-y-6 max-h-[700px] overflow-y-auto pr-1">
          {pageImages.map((src, pageIdx) => {
            const pageItems = boxesByPage[pageIdx] || [];

            return (
              <div
                key={pageIdx}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
              >
                <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Page {pageIdx + 1} of {pageImages.length}</span>
                  <span>{pageItems.length} answer box(es)</span>
                </div>

                <div className="relative w-full bg-slate-900">
                  <img
                    src={src}
                    alt={`Answer Sheet Page ${pageIdx + 1}`}
                    className="w-full h-auto block"
                  />

                  {/* Render SVG Overlay for Bounding Boxes */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    {pageItems.map(({ segment: seg, box }, bIdx) => {
                      const isSelected = selectedSegmentId === seg.id;
                      const isHovered = hoveredSegmentId === seg.id;

                      const strokeColor = isSelected
                        ? "#059669"
                        : isHovered
                        ? "#10b981"
                        : "#8b5cf6";

                      const fillColor = isSelected
                        ? "rgba(5, 150, 105, 0.25)"
                        : isHovered
                        ? "rgba(16, 185, 129, 0.2)"
                        : "rgba(139, 92, 246, 0.14)";

                      const xPct = box.x * 100;
                      const yPct = box.y * 100;
                      const wPct = box.w * 100;
                      const hPct = box.h * 100;

                      const labelText = seg.detectedNumber ? `Ans ${seg.detectedNumber}` : "Unlabeled";

                      return (
                        <g key={`${seg.id}-${bIdx}`}>
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
                            width={Math.max(8, labelText.length * 1.8)}
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
                            {labelText}
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
