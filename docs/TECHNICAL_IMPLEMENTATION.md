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
│       │   ├── api/
│       │   │   ├── cron/clean-jobs/ # Vercel Cron Job automated 10-min storage cleanup API
│       │   │   └── jobs/            # Job creation & polling API routes
│       │   ├── process/[id]/        # Real-time processing progress screen
│       │   ├── results/[id]/        # Teacher split-screen assessment dashboard
│       │   ├── globals.css          # Tailwind CSS & Typography system (Bricolage Grotesque)
│       │   ├── layout.tsx           # Crisp SVG Favicon & Metadata icons
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
│           ├── favicon.svg          # Crisp brand SVG favicon
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
├── vercel.json                      # Monorepo Vercel deployment & Cron Job configuration
└── package.json                     # pnpm workspace configuration
```

---

## 3. Core Technical Subsystems

### 3.1 Vercel Cron Job 10-Minute Data Cleanup (`vercel.json` & `/api/cron/clean-jobs`)
- Scheduled via Vercel Cron Expression: `*/10 * * * *` (Executes every 10 minutes).
- Automatically purges expired job entries from RAM and `/tmp/vedaai_jobs_store.json` once `createdAt` is older than 10 minutes (`TEN_MINUTES_MS = 600,000 ms`).
- Direct & Un-Authenticated Execution: No authentication or CRON_SECRET check is required, allowing Vercel Cron to invoke storage cleanup seamlessly every 10 minutes.

### 3.2 Dynamic ResizeObserver Highlight Alignment & Height Clamping (`TeacherSplitScreenFigma.tsx`)
- **ResizeObserver & `imgRef` Binding**: Highlights dynamically recalculate pixel coordinates from `imgRef.current.getBoundingClientRect()` on window resize, zoom change, page switch, or container resize.
- **Viewport Height Auto-Clamping**: The dark Answer Sheet container uses `h-auto max-h-[calc(100vh-200px)] items-start` so the background ends tightly at the bottom edge of the image page, eliminating empty dark space.

### 3.3 Crisp Brand Favicon (`public/favicon.svg` & `layout.tsx`)
- Configured high-resolution SVG favicon featuring VedaAI's dark card container and glowing coral/orange Gemini sparkle icon.
- Prioritized in `layout.tsx` metadata icons for crisp browser tab rendering.

### 3.4 Production Groq AI Model Pipeline (`apps/web/lib/ai.ts` & `apps/web/lib/grok.ts`)
- Active production models on Groq API:
  1. **`openai/gpt-oss-120b`**: Primary model for question extraction & grading.
  2. **`openai/gpt-oss-20b`**: Fast backup model.
  3. **`qwen/qwen3.8-27b`**: Instruction backup model.

### 3.5 Teacher Split-Screen Dashboard (`TeacherSplitScreenFigma.tsx`)
- **Extracted Questions Panel**: Sleek outer card container (`bg-slate-50/60 sm:bg-white/80 border border-slate-200/90 rounded-[28px] p-3.5 sm:p-5 shadow-xs`).
- **Answer Sheet Viewer**: SVG Bounding Box Overlays in **Green** (`rgba(34, 197, 94, 0.22)` / `#16a34a`) for matched answers and **Purple** (`rgba(168, 85, 247, 0.22)` / `#a855f7`) for unmatched answers.

---

## 4. Key Verification Standards

1. **Monorepo Build Integrity**: `pnpm --filter web build` compiles 100% clean with **0 errors**.
2. **Single Source of Truth**: Data contracts exported strictly from `@repo/shared`.
3. **Automated Maintenance**: Vercel Cron Job executes every 10 minutes to maintain stateless serverless hygiene.
