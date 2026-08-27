# VedaAI — QA & Verification Manual Test Suite

## 1. Automated Build Verification

Run the following command to verify TypeScript compilation and Next.js App Router build integrity:

```bash
npm run build
```

**Expected Output**:
```
✓ Compiled successfully
✓ Generating static pages (5/5)
```

---

## 2. Test Cases Matrix

| Test Case | Feature Tested | Verification Steps | Pass Criteria |
| :--- | :--- | :--- | :--- |
| **TC-01** | **Handwritten Label & Parent Matching (`3(a)` ➔ `3`)** | 1. Upload answer sheet with handwritten labels `"A 1"`, `"Ans 2"`, `"3(a)"`.<br>2. Inspect extracted answer segments in results view. | Segment `"A 1"` matches Question `"1"`, and segment `"3(a)"` matches Question `"3"` with 10/10 confidence. |
| **TC-02** | **Step-by-Step Processing Screen** | 1. Upload assessment PDF.<br>2. Observe `/process/[id]` screen. | Displays clean 5-step checklist card with active loading spinner and green checkmarks (or 4 steps if auto-grading is off). |
| **TC-03** | **Overall Grade Score Pill Formatting** | 1. Complete an assessment job with 57.5% score.<br>2. Check top overall assessment card badge. | Badge displays clean rounded integer **`58% GRADE`** without font crowding. |
| **TC-04** | **Active Groq AI Production Models** | 1. Observe dev server terminal logs during processing job. | AI pipeline calls active models (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`) with HTTP 200 responses. |
| **TC-05** | **Single Source of Truth Type Safety** | 1. Inspect imports across `apps/web/lib/ai.ts` and `apps/web/components/`. | All models (`Question`, `Grade`, `Mapping`) import directly from `@repo/shared`. |
| **TC-06** | **Vercel Serverless Persistence & Pruning** | 1. Upload assessment on Vercel deployment.<br>2. Inspect `/tmp/vedaai_jobs_store.json` size after processing multiple jobs. | Polling resolves job status cleanly across Vercel instances, and store stays under ~15 MB. |

---

## 3. Manual Verification Checklist

- [x] `npm run build` finishes with 0 errors.
- [x] `normalizeQuestionNumber` maps `"A 1"`, `"Ans 1"`, `"Answer 1"`, `"Sol 1"`, `"Q1"` to `"1"`.
- [x] Parent question matching maps `"3(a)"` / `"3a"` to Question `"3"`.
- [x] Groq API calls use active production models (`openai/gpt-oss-120b`).
- [x] Overall score pill renders rounded integer percentage (`58% GRADE`).
- [x] Vercel Serverless `/tmp` storage synchronization and automatic pruning active.
- [x] Mobile drawer & desktop sidebar animate smoothly.
- [x] Next.js dev server running on `http://localhost:3000`.
