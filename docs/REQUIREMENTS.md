# VedaAI — Functional & Technical Requirements Specification

## 1. Project Purpose & Scope

VedaAI is an AI-powered academic assessment evaluation suite designed to streamline exam evaluation for educators. It processes multi-page Question Papers (PDF/Images) and student Answer Sheets (handwritten PDF/Images), extracting questions, segmenting handwritten answers, mapping them with confidence scoring, and offering auto-grading recommendations.

---

## 2. Functional Requirements Matrix

| ID | Feature Requirement | Specification & Behavior | Status |
| :--- | :--- | :--- | :--- |
| **FR-01** | **Multi-Format Assessment Upload** | Drag & drop PDF, PNG, JPG, WEBP uploads for Question Papers and Answer Sheets. | `IMPLEMENTED` |
| **FR-02** | **100% Groq AI Question Extraction** | Extracts printed question labels, text prompts, sub-parts, and max marks using active models (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`). | `IMPLEMENTED` |
| **FR-03** | **Student Answer Label & Parent Matching** | Supports handwritten label variations (`A 1`, `Ans 1`, `Answer 1`, `Sol 1`, `Q1`) and maps sub-labels (`3(a)`) directly to parent Question `3`. | `IMPLEMENTED` |
| **FR-04** | **Handwriting Line Clustering** | Groups handwritten strokes into non-overlapping bounding boxes with `[x, y, w, h]` coordinates. | `IMPLEMENTED` |
| **FR-05** | **1–10 Confidence Score Mapping** | Assigns 10/10 for direct label/parent match, 8/10 for semantic match, and 5/10 for ambiguous candidates. | `IMPLEMENTED` |
| **FR-06** | **AI Evaluation & Auto-Grading** | Computes question score, max score, verdict (`correct`, `partially_correct`, `incorrect`), and feedback. | `IMPLEMENTED` |
| **FR-07** | **Step-by-Step Processing View** | Minimal 5-step pipeline progress card with active step loading spinners, green checkmarks, and dynamic step filtering. | `IMPLEMENTED` |
| **FR-08** | **Interactive Split-Screen Workspace** | 2-column layout (`md:grid-cols-12`) with question cards on the left and SVG bounding box PDF viewer on the right. | `IMPLEMENTED` |
| **FR-09** | **Rounded Integer Grade Pill** | Displays overall percentage score as a clean integer badge (e.g. `58% GRADE`). | `IMPLEMENTED` |
| **FR-10** | **Collapsible Sidebar & Navigation** | Smooth mobile drawer and desktop sidebar width transition (`w-20` collapsed / `w-64` expanded). | `IMPLEMENTED` |
| **FR-11** | **Vercel Serverless & Storage Sync** | Ephemeral `/tmp` file-backed storage sync with 1-hour TTL pruning and 15-job max capacity cap to guarantee serverless polling. | `IMPLEMENTED` |

---

## 3. Non-Functional Requirements (NFR)

1. **Accuracy**: 100% mapping accuracy for explicitly labeled handwritten answers (`A 1`, `Ans 1`, `1(a)`).
2. **Performance**: Initial job processing completed in `< 15 seconds` for 2-page assessment sets.
3. **Build Integrity**: `npm run build` compiles cleanly with zero TypeScript or webpack errors.
4. **Single Source of Truth**: All shared models (`Question`, `AnswerSegment`, `Mapping`, `Grade`, `JobResult`) exported strictly from `@repo/shared`.
