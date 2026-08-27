# VedaAI — Technical Implementation Architecture

## 1. System Architecture Overview

VedaAI is a high-precision AI assessment system designed to extract printed exam questions from Question Papers, segment handwritten student answers from Answer Sheets, map answer segments to their corresponding questions with a 1–10 confidence score, and perform automated evaluation.

```
[ Question Paper PDF/Img ]  --->  [ Canvas Page Renderer ]  --->  [ OCR Engine (OCR.space) ]  --->  [ Groq GPT-OSS 120B AI ]  --->  [ Structured Questions ]
                                                                                                                                                 |
                                                                                                                                                 v
[ Answer Sheet PDF/Img ]    --->  [ AI Line Clustering Engine ]  --->  [ Bounding Box Post-Processor ]  --->  [ 1-10 Confidence Score ]  --->  [ Interactive Dual Viewport ]
```

---

## 2. Monorepo Directory Structure

```
vedaai/
├── apps/
│   └── web/                         # Next.js 14 App Router Full-Stack Application
│       ├── app/
│       │   ├── api/jobs/            # Job creation & polling API routes
│       │   ├── process/[id]/        # Real-time processing progress screen
│       │   ├── results/[id]/        # Teacher split-screen assessment dashboard
│       │   ├── globals.css          # Tailwind CSS & Typography system
│       │   ├── layout.tsx           # Google Fonts (Plus Jakarta Sans, Outfit) & Metadata icons
│       │   └── page.tsx             # Landing upload dashboard
│       ├── components/
│       │   ├── AppShell.tsx         # Responsive navbar & smooth collapsible sidebar (w-20 / w-64)
│       │   ├── ProcessingProgress.tsx # Minimal 5-step AI pipeline progress checklist card
│       │   └── TeacherSplitScreenFigma.tsx # Dual 2-column questions & SVG canvas viewer
│       ├── lib/
│       │   ├── ai.ts                # Groq API vision/text parsing & grading engine
│       │   ├── grok.ts              # Groq multi-model fallback API client
│       │   ├── ocr.ts               # OCR.space API handwriting & line coordinate extractor
│       │   ├── pdf.ts               # PDF-to-image canvas rendering pipeline
│       │   └── store.ts             # In-memory job state repository
│       └── public/
│           ├── veda_logo.png        # Official high-res logo asset
│           ├── favicon.png          # PNG browser tab icon
│           └── favicon.ico          # Favicon icon asset
├── packages/
│   └── shared/                      # Single Source of Truth Shared Package (@repo/shared)
│       ├── index.ts
│       ├── normalize.ts             # Flexible Question Number Normalizer ("A 1", "Ans 1", "Sol 1" -> "1")
│       └── types.ts                 # Single Source of Truth for Question, AnswerSegment, Grade, JobResult
├── docs/
│   ├── TECHNICAL_IMPLEMENTATION.md  # System Architecture & Technical Specifications
│   ├── REQUIREMENTS.md              # Functional & Non-Functional Specifications
│   └── TESTING.md                   # Verification & QA Manual Test Guide
└── package.json                     # pnpm workspace configuration
```

---

## 3. Core Technical Subsystems

### 3.1 Flexible Question Number Normalization Engine (`packages/shared/normalize.ts`)
- Cleans and standardizes printed and handwritten question labels:
  - **`"A 1"` / `"A. 1"` / `"A-1"`** ➔ Normalized to **`"1"`**
  - **`"Ans 1"` / `"Ans. 1"` / `"Answer 1"`** ➔ Normalized to **`"1"`**
  - **`"Ans. 1(a)"` / `"A 1(a)"`** ➔ Normalized to **`"1a"`**
  - **`"Sol 3"` / `"Solution 3"`** ➔ Normalized to **`"3"`**
  - **`"Q. 4"` / `"Question 4"`** ➔ Normalized to **`"4"`**
- Enables 100% direct label matching regardless of student handwriting style.

### 3.2 Dynamic OCR Line Extraction Engine (`apps/web/lib/ocr.ts`)
- Primary scanning powered by OCR.space Handwriting API engine.
- Extracts line-by-line bounding coordinates `[x, y, w, h]` normalized between `0.0` and `1.0`.
- Exponential backoff retry logic (up to 3 retries) handles API rate limits.

### 3.3 100% Groq AI Extraction & Grading Engine (`apps/web/lib/ai.ts` & `apps/web/lib/grok.ts`)
- Uses Groq's high-speed inference API (`openai/gpt-oss-120b` / `llama-3.3-70b-versatile`).
- **Question Paper Extraction**: Parses question numbers, prompt text, maximum marks, and sub-parts.
- **Answer Segment Clustering**: Groups adjacent handwritten lines into non-overlapping answer blocks (`ans-1`, `ans-2`, `ans-3(a)`). Identifies unnumbered scratch calculations as `ans-rough`.

### 3.4 1–10 Mapping Confidence Score Calculator
- Computes mapping certainty based on detection signals:
  - **10/10 Confidence**: Direct printed question label match (e.g., segment `A 1` or `Ans 3(a)` matched to Question `1` or `3(a)`).
  - **8/10 Confidence**: Semantic text/topic match without explicit label.
  - **5/10 Confidence**: Ambiguous or multi-candidate match requiring teacher review.

### 3.5 Minimal Step-by-Step Processing Screen (`ProcessingProgress.tsx`)
- Displays a clean 5-step pipeline checklist card with active loading spinners (`Loader2 animate-spin`), green checkmarks (`CheckCircle2`), and step index badges.

### 3.6 Interactive Dual-Viewport Split Screen (`TeacherSplitScreenFigma.tsx`)
- **Header Badge**: Rounded integer overall grade score pill (e.g., **`58% GRADE`**).
- **Left Column**: Accordion list of questions with score pills, AI evaluation feedback, and transcribed answer text.
- **Right Column**: Interactive Answer Sheet Viewer featuring:
  - Responsive SVG overlay rendering pixel-perfect bounding boxes around handwritten answers.
  - Interactive highlights: Clicking a question highlights its corresponding answer bounding box on the PDF canvas.
  - Dark Toolbar Header (`- FIT 100% +` zoom controls and `< Page 1 of 4 >` navigation).

---

## 4. Key Performance Optimizations

1. **Single Source of Truth**: All data models and interfaces are exported strictly from `@repo/shared` (`packages/shared/types.ts`).
2. **Monorepo Build Integrity**: Zero build warnings or errors across Next.js App Router (`pnpm --filter web build` passes cleanly).
3. **Fluid Responsive UI**: Custom Tailwind grid breakpoints (`md:grid-cols-12`) ensure side-by-side split screen on desktop viewports and tabbed view on mobile.
