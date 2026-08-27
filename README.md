# 🎓 VedaAI — AI Academic Assessment Suite

VedaAI is a full-stack monorepo application built with Next.js 14 App Router, Tailwind CSS, TypeScript, and the 100% Groq AI Engine (`llama-3.3-70b-versatile`). It automates exam question extraction, student handwriting segmentation, question-answer mapping with 1–10 confidence scoring, and automated teacher evaluation.

---

## 🌟 Key Features

- **Flexible Student Label Matching**: Recognizes handwritten answer labels like `A 1`, `A-1`, `A.1`, `Ans 1`, `Ans. 1`, `Answer 1`, `Sol 1`, `Solution 1`, `Q1`, `1(a)`.
- **100% Groq AI Vision Engine**: High-speed OCR line clustering and structured question extraction.
- **1–10 Confidence Score Mapping**: Direct label matching (10/10), semantic topic matching (8/10), and ambiguous candidate tagging (5/10).
- **Minimal Pipeline Progress View**: Clean 5-step checklist card with live step spinners and completion checkmarks.
- **Interactive Dual-Viewport Workspace**: 2-column layout (`md:grid-cols-12`) with question cards on the left and pixel-perfect SVG bounding box PDF viewer on the right.
- **Single Source of Truth Architecture**: Monorepo package (`@repo/shared`) for unified type safety across all components and API routes.

---

## 🚀 Quick Start for Anyone Cloning the Repository

Follow these 3 simple steps to set up and run VedaAI locally:

### Step 1: Clone Repository & Install Monorepo Dependencies
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd vedaai

# Single command installs all packages across apps/web and packages/shared
pnpm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local` inside `apps/web`:
```bash
cp apps/web/.env.example apps/web/.env.local
```
Add your free Groq API key inside `apps/web/.env.local`:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### Step 3: Run Development Server
```bash
pnpm dev
```
Open **`http://localhost:3000`** in your browser!

---

## 🛠️ Root Monorepo Commands

| Command | Action |
| :--- | :--- |
| **`pnpm install`** | Installs dependencies across all packages and links `@repo/shared` automatically. |
| **`pnpm dev`** | Runs Next.js development server on port 3000 (`http://localhost:3000`). |
| **`pnpm build`** | Runs type checks on `@repo/shared` and builds `apps/web` with 0 build errors. |
| **`pnpm start`** | Runs Next.js production server. |
| **`pnpm lint`** | Runs Next.js linter. |

---

## ☁️ Deploying to Vercel (100% Free)

1. Push code to your GitHub repository (`git push -u origin main`).
2. Import project in **Vercel** ➔ Set Root Directory: `apps/web`.
3. Framework Preset: **Next.js**.
4. Add Environment Variable: `GROQ_API_KEY` = *your Groq key*.
5. Click **Deploy**! 🚀

---

## 📁 Documentation Suite

- 📖 [`docs/TECHNICAL_IMPLEMENTATION.md`](file:///e:/vedaai/docs/TECHNICAL_IMPLEMENTATION.md) — System Architecture & Technical Specifications
- 📋 [`docs/REQUIREMENTS.md`](file:///e:/vedaai/docs/REQUIREMENTS.md) — Functional & Non-Functional Specifications
- 🧪 [`docs/TESTING.md`](file:///e:/vedaai/docs/TESTING.md) — QA Verification & Manual Test Suite
