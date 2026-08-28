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
│       │   ├── globals.css          # Tailwind CSS & Typography system (Bricolage Grotesque)
│       │   ├── layout.tsx           # Google Fonts & Metadata icons
│       │   └── page.tsx             # Landing upload dashboard
│       ├── components/
│       │   ├── AppShell.tsx         # Responsive navbar & smooth collapsible sidebar
│       │   ├── ProcessingProgress.tsx # Gemini AI 4-sparkle cluster loading animation screen
│       │   └── TeacherSplitScreenFigma.tsx # Dual 2-column questions & SVG canvas viewer
│       ├── lib/
│       │   ├── ai.ts                # Groq API vision/text parsing & grading engine
│       │   ├── grok.ts              # Groq multi-model fallback API client
│       │   ├── ocr.ts               # OCR.space API handwriting & line coordinate extractor
│       │   ├── pdf.ts               # PDF-to-image canvas rendering & worker polyfill
│       │   └── store.ts             # Ephemeral /tmp file-backed job repository (10-minute TTL)
│       └── public/
│           ├── veda_logo.png        # Official high-res logo asset
│           ├── favicon.png          # PNG browser tab icon
│           └── favicon.ico          # Favicon icon asset
├── packages/
│   └── shared/                      # Single Source of Truth Shared Package (@repo/shared)
│       ├── index.ts
│       ├── normalize.ts             # Question Number Normalizer ("A 1", "Ans 1", "Sol 1" -> "1")
│       └── types.ts                 # Types for Question, AnswerSegment, Grade, JobResult
├── docs/
│   ├── TECHNICAL_IMPLEMENTATION.md  # System Architecture & Technical Specifications
│   ├── REQUIREMENTS.md              # Functional & Non-Functional Specifications
│   └── TESTING.md                   # Verification & QA Manual Test Guide
├── vercel.json                      # Monorepo Vercel deployment configuration
└── package.json                     # pnpm workspace configuration
```

---

## 3. Core Technical Subsystems

### 3.1 Question & Answer Number Normalization (`packages/shared/normalize.ts`)
- Cleans and standardizes printed and handwritten question labels:
  - **`"A 1"` / `"A. 1"` / `"A-1"`** ➔ Normalized to **`"1"`**
  - **`"Ans 1"` / `"Ans. 1"` / `"Answer 1"`** ➔ Normalized to **`"1"`**
  - **`"Ans. 1(a)"` / `"A 1(a)"`** ➔ Normalized to **`"1a"`**
  - **`"Sol 3"` / `"Solution 3"`** ➔ Normalized to **`"3"`**
  - **`"Q. 4"` / `"Question 4"`** ➔ Normalized to **`"4"`**
- **Parent Question Prefix Resolution**: Extracts parent prefix `3` for sub-questions like `3(a)`, `3.a`, or `3a` (`extractParentQuestionNumber("3a")` ➔ `"3"`).

### 3.2 Dynamic OCR Line Extraction Engine (`apps/web/lib/ocr.ts`)
- Primary scanning powered by OCR.space Handwriting API engine.
- Extracts line-by-line bounding coordinates `[x, y, w, h]` normalized between `0.0` and `1.0`.
- Exponential backoff retry logic (up to 3 retries) handles API rate limits.
- Header-to-header segmentation regex identifies question boundaries (`Q1.`, `1.`, `Ans 1`, `3(a)`, `3a`) for clean line clustering.

### 3.3 Production Groq AI Model Pipeline (`apps/web/lib/ai.ts` & `apps/web/lib/grok.ts`)
- Active production models on Groq API:
  1. **`openai/gpt-oss-120b`**: High-intelligence model for question extraction & grading.
  2. **`openai/gpt-oss-20b`**: Fast backup model.
  3. **`qwen/qwen3.8-27b`**: Instruction backup model.
- Automatically retries across fallback models if any single model hits a rate limit.

### 3.4 Gemini AI Sparkle Cluster Loading Screen (`ProcessingProgress.tsx`)
- Vector geometry matching Google Gemini sparkle symbol (4-element cluster: Large Top-Right, Medium Bottom-Left, Small Bottom-Right, Accent Dot).
- Fluid scaling across desktop (`177px × 177px`) and mobile (`130px × 130px`) viewports.
- Blends with app background (`bg-transparent`).

### 3.5 Teacher Split-Screen Dashboard (`TeacherSplitScreenFigma.tsx`)
- **Extracted Questions Panel**:
  - Wrapped inside a sleek outer card container (`bg-slate-50/60 sm:bg-white/80 border border-slate-200/90 rounded-[28px] p-3.5 sm:p-5 shadow-xs`).
  - Active Question: Orange border (`border-2 border-[#f0562e]`) and orange circle badge (`bg-[#f0562e] text-white`).
  - Inactive Question: Clean border (`border border-slate-100`) and dark circle badge (`bg-[#383b3e] text-white`).
  - Score Pills: Green (`bg-[#e6f7ed] text-[#16a34a]`) for full score, Coral (`bg-[#fff2e8] text-[#f0562e]`) for partial.
- **Answer Sheet Viewer**:
  - SVG Bounding Box Overlays: Highlighted in **Green** (`rgba(34, 197, 94, 0.22)` / `#16a34a`) when selecting a question card, and **Purple** (`rgba(168, 85, 247, 0.22)` / `#a855f7`) when selecting an unmatched answer.
  - PDF view remains clean when no item is selected.
  - Large Navigation Buttons: Lucide `ChevronLeft` and `ChevronRight` icons (`w-5 h-5 stroke-[2.5]`).

### 3.6 Mobile Viewport Optimization
- Mobile Tab Switcher: Short clean tab labels **`Questions`** | **`Answer Sheet`**.
- Mobile Question Cards: Number badge and score pill sit on the top row, with question text wrapping below for maximum readability.
- Compact PDF Header Bar: Zoom (`- 100% +`) and Page controls scale cleanly on 375px screens.

### 3.7 Ephemeral Storage with 10-Minute TTL (`store.ts`)
- **10-Minute TTL Expiration**: Jobs in `/tmp/vedaai_jobs_store.json` and memory store automatically expire after 10 minutes (`TEN_MINUTES_MS = 10 * 60 * 1000`).
- **Cap Limit**: Maximum 15 entries stored, keeping disk footprint under 15 MB.
- **Serverless Synchronization**: Awaits synchronous job execution inside `POST /api/jobs` for Vercel deployment.

---

## 4. Key Verification Standards

1. **Monorepo Build Integrity**: `pnpm --filter web build` compiles 100% clean with **0 errors**.
2. **Single Source of Truth**: Data contracts exported strictly from `@repo/shared`.
3. **SEO & Accessibility**: Semantic HTML5 headers, descriptive metadata, fluid responsive design.
