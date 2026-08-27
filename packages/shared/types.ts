export type BoundingBox = { page: number; x: number; y: number; w: number; h: number };

export type Question = {
  id: string;                 // stable generated id, e.g. "q-11a"
  number: string;             // EXACT printed label, e.g. "11", "11(a)", "Q4"
  parentNumber?: string;      // "11" for both 11(a) and 11(b), for grouping/display
  text: string;                // the question text as printed
  marks?: number;              // if printed on the paper, else undefined
  page: number;
  box: BoundingBox;
  order: number;               // printed order, 0-indexed
};

export type AnswerSegment = {
  id: string;
  detectedNumber?: string;     // number/label the student wrote near this segment, if any
  transcript: string;          // best-effort transcription of the handwriting
  pages: number[];             // supports multi-page answers
  boxes: BoundingBox[];        // one box per page this segment appears on, same order as pages
  isContinuation?: boolean;    // true if this answer continues across page boundaries
  order: number;                // order it appears in the answer sheet (top-to-bottom, page order)
};

export type Mapping = {
  questionId: string | null;    // null only for entries in unmatchedAnswers
  answerSegmentIds: string[];   // an answer can be assembled from multiple segments/pages
  status: "answered" | "unanswered" | "ambiguous";
  confidence: number;           // 0–1
  confidenceScore?: number;     // 1–10 mapping confidence rating
  reason?: string;               // short explanation from the mapping model, for debugging/UI
};

export type UnmatchedAnswer = {
  answerSegmentId: string;
  reason: string;                // e.g. "no legible question number", "number not on paper"
};

export type Grade = {
  questionId: string;
  score: number | null;          // null if ungraded/unanswered
  maxScore: number | null;
  verdict: "correct" | "partially_correct" | "incorrect" | "ungraded";
  feedback: string;
};

export type GradeSummary = {
  totalScore: number;
  maxScore: number;
  percentage: number;
  overallComment: string;
};

export type JobResult = {
  jobId: string;
  id?: string;
  status: "uploading" | "extracting_questions" | "extracting_answers" | "mapping" | "grading" | "done" | "error";
  questionPaperPages: string[];   // base64 or served URLs of rendered page images
  answerSheetPages: string[];
  questions: Question[];
  answerSegments: AnswerSegment[];
  mappings: Mapping[];
  unmatchedAnswers: UnmatchedAnswer[];
  grades?: Grade[];
  gradeSummary?: GradeSummary;
  enableGrading?: boolean;
  error?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateJobInput = {
  questionPaper: { name: string; type: string; base64: string };
  answerSheet: { name: string; type: string; base64: string };
  enableGrading?: boolean;
};
