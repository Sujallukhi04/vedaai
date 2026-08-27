# 🎓 VedaAI — AI Academic Assessment Suite

VedaAI is a full-stack monorepo application built with Next.js 14 App Router, Tailwind CSS, TypeScript, and the 100% Groq AI Engine (`openai/gpt-oss-120b`). It automates exam question extraction, student handwriting segmentation, question-answer mapping with 1–10 confidence scoring, and automated teacher evaluation.

---

## 🌟 Key Features

- **Flexible Student Label Matching**: Recognizes handwritten answer labels like `A 1`, `A-1`, `A.1`, `Ans 1`, `Ans. 1`, `Answer 1`, `Sol 1`, `Solution 1`, `Q1`, `1(a)`.
- **100% Groq AI Vision Engine**: High-speed OCR line clustering and structured question extraction.
- **1–10 Confidence Score Mapping**: Direct label matching (10/10), semantic topic matching (8/10), and ambiguous candidate tagging (5/10).
- **Minimal Pipeline Progress View**: Clean 5-step checklist card with live step spinners and completion checkmarks.
- **Interactive Dual-Viewport Workspace**: 2-column layout (`md:grid-cols-12`) with question cards on the left and pixel-perfect SVG bounding box PDF viewer on the right.
- **Single Source of Truth Architecture**: Monorepo package (`@repo/shared`) for unified type safety across all components and API routes.

---

## 📁 Documentation Suite

- 📖 [`docs/TECHNICAL_IMPLEMENTATION.md`](file:///e:/vedaai/docs/TECHNICAL_IMPLEMENTATION.md) — System Architecture & Technical Specifications
- 📋 [`docs/REQUIREMENTS.md`](file:///e:/vedaai/docs/REQUIREMENTS.md) — Functional & Non-Functional Specifications
- 🧪 [`docs/TESTING.md`](file:///e:/vedaai/docs/TESTING.md) — QA Verification & Manual Test Suite

---

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start Next.js development server
pnpm --filter web dev -p 3000

# Build production bundle
pnpm --filter web build
```

Open [http://localhost:3000](http://localhost:3000) to launch VedaAI!
