import { NextRequest, NextResponse } from "next/server";
import { JobResult, CreateJobInput } from "@repo/shared";
import { extractQuestions, extractAnswerSegments, mapAnswersToQuestions, gradeAnswers } from "@/lib/ai";
import { renderPDFToDataUrls } from "@/lib/pdf";
import { setJob, updateJob, getJob, store } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let questionPaperInput: { name: string; type: string; base64: string } | null = null;
    let answerSheetInput: { name: string; type: string; base64: string } | null = null;
    let enableGrading = true;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const qpFile = formData.get("questionPaper") as File | null;
      const asFile = formData.get("answerSheet") as File | null;
      const gradingVal = formData.get("enableGrading");

      if (gradingVal === "false") enableGrading = false;

      if (qpFile) {
        const arrayBuf = await qpFile.arrayBuffer();
        const base64 = Buffer.from(arrayBuf).toString("base64");
        const mime = qpFile.type || (qpFile.name.endsWith(".pdf") ? "application/pdf" : "image/jpeg");
        questionPaperInput = {
          name: qpFile.name,
          type: mime,
          base64: `data:${mime};base64,${base64}`,
        };
      }

      if (asFile) {
        const arrayBuf = await asFile.arrayBuffer();
        const base64 = Buffer.from(arrayBuf).toString("base64");
        const mime = asFile.type || (asFile.name.endsWith(".pdf") ? "application/pdf" : "image/jpeg");
        answerSheetInput = {
          name: asFile.name,
          type: mime,
          base64: `data:${mime};base64,${base64}`,
        };
      }
    } else {
      const body: CreateJobInput = await req.json();
      questionPaperInput = body.questionPaper;
      answerSheetInput = body.answerSheet;
      enableGrading = body.enableGrading ?? true;
    }

    if (!questionPaperInput || !answerSheetInput) {
      return NextResponse.json(
        { error: "Both questionPaper and answerSheet files are required." },
        { status: 400 }
      );
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const newJob: JobResult = {
      jobId,
      id: jobId,
      status: "uploading",
      questionPaperPages: [],
      answerSheetPages: [],
      questions: [],
      answerSegments: [],
      mappings: [],
      unmatchedAnswers: [],
      grades: [],
      enableGrading,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setJob(jobId, newJob);

    // Await processing directly so Vercel Serverless Function is never killed/frozen mid-execution
    await processJobBackground(jobId, questionPaperInput, answerSheetInput, enableGrading);

    const finalJob = getJob(jobId);
    return NextResponse.json({ jobId, status: finalJob?.status || "done" }, { status: 200 });
  } catch (err: any) {
    console.error("[POST /api/jobs] Error starting job:", err);
    return NextResponse.json(
      { error: err.message || "Failed to initialize processing job" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const allJobs = Array.from(store.values());
  return NextResponse.json({ jobs: allJobs });
}

async function processJobBackground(
  jobId: string,
  questionPaperInput: { name: string; type: string; base64: string },
  answerSheetInput: { name: string; type: string; base64: string },
  enableGrading: boolean = true
) {
  try {
    // Step 1: Render pages into images
    console.log(`[Job ${jobId}] Rendering input documents into high-res page images...`);

    let questionPaperPages: string[] = [];
    let answerSheetPages: string[] = [];

    if (questionPaperInput.type.includes("pdf")) {
      questionPaperPages = await renderPDFToDataUrls(questionPaperInput.base64);
    } else {
      questionPaperPages = [questionPaperInput.base64];
    }

    if (answerSheetInput.type.includes("pdf")) {
      answerSheetPages = await renderPDFToDataUrls(answerSheetInput.base64);
    } else {
      answerSheetPages = [answerSheetInput.base64];
    }

    console.log(
      `[Job ${jobId}] Rendered ${questionPaperPages.length} Question Paper pages and ${answerSheetPages.length} Answer Sheet pages.`
    );

    updateJob(jobId, {
      questionPaperPages,
      answerSheetPages,
      status: "extracting_questions",
    });

    // Step 2: Extract Questions via 100% Groq System
    console.log(`[Job ${jobId}] Extracting questions via 100% Groq System...`);
    const questions = await extractQuestions(questionPaperPages);

    updateJob(jobId, {
      questions,
      status: "extracting_answers",
    });

    // Step 3: Extract Student Answer Segments via 100% Groq System
    console.log(`[Job ${jobId}] Extracting student answer segments via 100% Groq System...`);
    const answerSegments = await extractAnswerSegments(answerSheetPages, questions);

    // Step 4: Map Answers to Questions
    updateJob(jobId, {
      answerSegments,
      status: "mapping",
    });

    console.log(`[Job ${jobId}] Mapping answer segments to questions...`);
    const { mappings, unmatched } = await mapAnswersToQuestions(questions, answerSegments);

    // Step 5: Optional Grading Layer
    if (enableGrading) {
      updateJob(jobId, {
        mappings,
        unmatchedAnswers: unmatched,
        status: "grading",
      });

      console.log(`[Job ${jobId}] Optional Grading Layer: Evaluating answers via AI...`);
      const { grades, summary } = await gradeAnswers(questions, answerSegments, mappings);

      updateJob(jobId, {
        grades,
        gradeSummary: summary,
        status: "done",
      });
      console.log(`[Job ${jobId}] Processing complete with AI grading. Total Score: ${summary.totalScore}/${summary.maxScore} (${summary.percentage}%).`);
    } else {
      updateJob(jobId, {
        mappings,
        unmatchedAnswers: unmatched,
        status: "done",
      });
      console.log(`[Job ${jobId}] Processing complete (Mapping only, grading skipped).`);
    }
  } catch (err: any) {
    console.error(`[Job ${jobId}] Processing failed:`, err);
    updateJob(jobId, {
      status: "error",
      error: err.message || "Pipeline processing failed",
    });
  }
}
