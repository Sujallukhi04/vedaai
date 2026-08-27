# VedaAI — QA & Verification Manual Test Suite

## 1. Automated Build Verification

Run the following command to verify TypeScript compilation and Next.js App Router build integrity:

```bash
pnpm --filter web build
```

**Expected Output**:
```
✓ Compiled successfully
✓ Generating static pages (6/6)
```

---

## 2. Test Cases Matrix

| Test Case | Feature Tested | Verification Steps | Pass Criteria |
| :--- | :--- | :--- | :--- |
| **TC-01** | **Handwritten Label Variations (`A 1`, `Ans 1`, `Sol 1`)** | 1. Upload answer sheet with handwritten labels `"A 1"`, `"Ans 2"`, `"Sol 3(a)"`.<br>2. Inspect extracted answer segments in results view. | Segment `"A 1"` matches Question `"1"` with 10/10 confidence. |
| **TC-02** | **Step-by-Step Processing Screen** | 1. Upload assessment PDF.<br>2. Observe `/process/[id]` screen. | Displays clean 5-step checklist card with active loading spinner and green checkmarks. |
| **TC-03** | **Overall Grade Score Pill Formatting** | 1. Complete an assessment job with 57.5% score.<br>2. Check top overall assessment card badge. | Badge displays clean rounded integer **`58% GRADE`** without font crowding. |
| **TC-04** | **Responsive Sidebar Collapsing** | 1. Click sidebar collapse toggle button.<br>2. Test on mobile screen viewports. | Sidebar smoothly animates between `w-20` and `w-64` on desktop and opens as full-height drawer on mobile. |
| **TC-05** | **Single Source of Truth Type Safety** | 1. Inspect imports across `apps/web/lib/ai.ts` and `apps/web/components/`. | All models (`Question`, `Grade`, `Mapping`) import directly from `@repo/shared`. |

---

## 3. Manual Verification Checklist

- [x] `pnpm --filter web build` finishes with 0 errors.
- [x] `normalizeQuestionNumber` maps `"A 1"`, `"Ans 1"`, `"Answer 1"`, `"Sol 1"`, `"Q1"` to `"1"`.
- [x] Overall score pill renders rounded integer percentage (`58% GRADE`).
- [x] Mobile drawer & desktop sidebar animate smoothly.
- [x] Next.js dev server running on `http://localhost:3000`.
