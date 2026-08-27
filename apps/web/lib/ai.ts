import {
  BoundingBox,
  Question,
  AnswerSegment,
  Mapping,
  UnmatchedAnswer,
  Grade,
  GradeSummary
} from "@repo/shared";
import { normalizeQuestionNumber } from "@repo/shared";
import { callGroqJSON, gradeAnswersWithGroq } from "./grok";
import { performLocalOCR, processOCRIntoAnswerSegments, OCRPageResult, OCRLine } from "./ocr";

function slugifyQuestionNumber(numStr: string): string {
  const cleaned = numStr
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
  return cleaned ? `q-${cleaned}` : `q-${Math.random().toString(36).substring(2, 7)}`;
}

function clampNormalized(val: number): number {
  if (typeof val !== "number" || isNaN(val)) return 0;
  return Math.min(Math.max(val, 0), 1);
}

// ---------------------------------------------------------------------------
// Module 2: Question Paper Extraction via Local OCR + 100% Groq API
// ---------------------------------------------------------------------------

interface RawExtractedQuestion {
  number: string;
  parentNumber?: string;
  text: string;
  marks?: number;
  page?: number;
  box?: {
    page?: number;
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

interface RawExtractionResponse {
  questions: RawExtractedQuestion[];
}

export async function extractQuestions(
  pageImages: string[]
): Promise<Question[]> {
  if (!pageImages || pageImages.length === 0) return [];

  console.log(`[100% Groq System] Scanning ${pageImages.length} Question Paper page(s) via Local Tesseract OCR...`);
  const ocrPages = await Promise.all(
    pageImages.map((img, i) => performLocalOCR(img, i))
  );

  const combinedOCRText = ocrPages
    .map(
      (p) =>
        `=== PAGE INDEX ${p.pageIndex} ===\n` +
        p.fullText
    )
    .join("\n\n");

  const promptText = `Analyze the following OCR text extracted from a question paper across ${pageImages.length} page(s).

EXTRACTED OCR TEXT:
${combinedOCRText}

INSTRUCTIONS:
1. Identify all questions and sub-questions (e.g., "1", "2", "3(a)", "3(b)", "11(a)").
2. Treat sub-questions like (a), (b), (i), (ii) as SEPARATE entries (e.g. number="3(a)", parentNumber="3").
3. Extract printed marks if mentioned (e.g. [5 Marks] -> marks=5).
4. Provide normalized bounding box estimates ("page": 0-indexed page index, "x": 0.05, "y": 0.05-0.95, "w": 0.85, "h": 0.12).

Respond using ONLY a single valid JSON object formatted as follows:
{
  "questions": [
    {
      "number": "1",
      "parentNumber": null,
      "text": "What is Object-Oriented Programming (OOP)? Explain the main features.",
      "marks": 5,
      "page": 0,
      "box": { "page": 0, "x": 0.05, "y": 0.08, "w": 0.85, "h": 0.15 }
    },
    {
      "number": "3(a)",
      "parentNumber": "3",
      "text": "What is 1NF? Explain with an example.",
      "marks": 5,
      "page": 0,
      "box": { "page": 0, "x": 0.05, "y": 0.38, "w": 0.85, "h": 0.15 }
    }
  ]
}`;

  try {
    const rawResp = await callGroqJSON<RawExtractionResponse>(
      promptText,
      "You are an expert exam paper structure extractor. Respond strictly using JSON."
    );
    const rawList = rawResp?.questions || [];

    const validQuestions: Question[] = [];
    const idCounts: Record<string, number> = {};

    for (let i = 0; i < rawList.length; i++) {
      const raw = rawList[i];
      if (!raw || !raw.text) continue;

      const number = typeof raw.number === "string" ? raw.number.trim() : "Q";
      const parentNumber = typeof raw.parentNumber === "string" ? raw.parentNumber.trim() : undefined;
      const marks = typeof raw.marks === "number" && !isNaN(raw.marks) ? raw.marks : undefined;

      let pageIndex = typeof raw.page === "number" ? Math.floor(raw.page) : 0;
      if (pageIndex < 0 || pageIndex >= pageImages.length) pageIndex = 0;

      const rawBox = raw.box || { x: 0.08, y: 0.08 + i * 0.15, w: 0.84, h: 0.1 };
      const box: BoundingBox = {
        page: pageIndex,
        x: clampNormalized(rawBox.x),
        y: Math.max(clampNormalized(rawBox.y), 0.05),
        w: clampNormalized(rawBox.w) > 0 ? clampNormalized(rawBox.w) : 0.84,
        h: clampNormalized(rawBox.h) > 0 ? clampNormalized(rawBox.h) : 0.1,
      };

      const baseSlug = slugifyQuestionNumber(number);
      idCounts[baseSlug] = (idCounts[baseSlug] || 0) + 1;
      const finalId =
        idCounts[baseSlug] === 1 ? baseSlug : `${baseSlug}-${idCounts[baseSlug]}`;

      validQuestions.push({
        id: finalId,
        number,
        parentNumber,
        text: raw.text.trim(),
        marks,
        page: pageIndex,
        box,
        order: validQuestions.length,
      });
    }

    console.log(
      `[100% Groq System] Successfully extracted ${validQuestions.length} questions via Groq API!`
    );
    return validQuestions;
  } catch (err: any) {
    console.warn(
      `[100% Groq System] Question extraction fallback to direct OCR parsing:`,
      err.message
    );
    return processOCRIntoQuestionsFallback(ocrPages);
  }
}

function processOCRIntoQuestionsFallback(ocrPages: OCRPageResult[]): Question[] {
  const validQuestions: Question[] = [];
  for (const ocrPage of ocrPages) {
    for (const line of ocrPage.lines) {
      const matchNum = line.text.match(
        /^(?:Q|q|Question)?[\.\s]*([0-9]+(?:\([a-z0-9]+\))?[\.]?)/i
      );
      if (matchNum) {
        const numStr = matchNum[1].trim();
        const marksMatch = line.text.match(/\[(\d+)\s*Marks?\]/i);
        const marks = marksMatch ? parseInt(marksMatch[1], 10) : 5;
        const qSlug = slugifyQuestionNumber(numStr);

        validQuestions.push({
          id: qSlug,
          number: numStr,
          text: line.text,
          marks,
          page: ocrPage.pageIndex,
          box: line.box,
          order: validQuestions.length,
        });
      }
    }
  }
  return validQuestions;
}

// ---------------------------------------------------------------------------
// Module 3: Answer Segment Extraction with Multi-Page Continuations & Rough Work
// ---------------------------------------------------------------------------

interface PageRawAnswerItem {
  questionNumber?: string | null;
  questionId?: string | null;
  lineIndices?: number[];
  pageIndex?: number;
  transcript: string;
  isContinuation?: boolean;
}

interface PageClusteringResponse {
  answers?: PageRawAnswerItem[];
  answerSegments?: PageRawAnswerItem[];
  segments?: PageRawAnswerItem[];
}

export async function extractAnswerSegments(
  pageImages: string[],
  knownQuestions: Question[] = []
): Promise<AnswerSegment[]> {
  if (!pageImages || pageImages.length === 0) return [];

  console.log(`[AI Line Clustering Engine] Scanning ${pageImages.length} Answer Sheet page(s) via OCR Engine...`);
  const ocrPages = await Promise.all(
    pageImages.map((img, i) => performLocalOCR(img, i))
  );

  const questionListSummary = knownQuestions.length > 0
    ? knownQuestions.map((q) => `[Question ID: "${q.id}"] Question ${q.number}: ${q.text}`).join("\n")
    : "Questions on paper: 1, 2, 3(a), 3(b), 4, 5";

  // Format all OCR lines with global indices
  let globalLineCounter = 0;
  const allLinesWithGlobalIndex: { globalIdx: number; pageIdx: number; line: OCRLine; isNoise: boolean }[] = [];

  const pagesFormattedText = ocrPages
    .map((p) => {
      const sortedLines = p.lines.slice().sort((a, b) => a.box.y - b.box.y);
      const linesBlock = sortedLines
        .map((l) => {
          const gIdx = globalLineCounter++;
          const isNoise = /^(?:Date|Page|Page\s*No|No\.?|Roll|Class|Name)$/i.test(l.text.trim()) && l.box.y < 0.08;
          allLinesWithGlobalIndex.push({ globalIdx: gIdx, pageIdx: p.pageIndex, line: l, isNoise });
          return `[Line ${gIdx}] (Page ${p.pageIndex + 1}): "${l.text}"`;
        })
        .join("\n");

      return `=== PAGE ${p.pageIndex + 1} (Page Index ${p.pageIndex}) ===\n${linesBlock}`;
    })
    .join("\n\n");

  const promptText = `You are an expert exam evaluation assistant.
Below are the ordered raw OCR text lines detected from a student's handwritten answer sheet across ${pageImages.length} page(s), along with the known questions on the exam paper.

IMPORTANT INSTRUCTIONS:
1. HANDWRITING BULLETS & LABELS: Students may label answers as "A 1", "A-1", "A.1", "Ans 1", "Ans. 1", "Answer 1", "Q1", "Q.1", "Sol 1", or simply "1.". ALWAYS recognize prefixes like "A", "Ans", "Answer", "Sol", "Q" and match "A 1" or "Ans 1(a)" as question number "1" or "3(a)"!
2. MULTI-PAGE CONTINUATIONS: If an answer starts on Page 1 and continues on Page 2, include ALL line indices from both pages in "lineIndices"!
3. ROUGH WORK & UNMATCHED CALCULATIONS: If the student wrote rough work, calculations, or notes that do not belong to a question, include them with "questionNumber": null and "questionId": null.
4. MARGIN NOISE: Discard top notebook margin header lines like "Date" or "Page".

KNOWN QUESTIONS ON EXAM PAPER:
${questionListSummary}

DETECTED OCR TEXT LINES:
${pagesFormattedText}

TASK:
Identify EVERY handwritten answer and calculation block. For each:
- "questionNumber": matched question number (e.g. "1", "3(a)", "3(b)", "2", or null if rough work)
- "questionId": exact Question ID matched (e.g. "q-1", "q-3a", "q-3b", "q-2", or null if rough work)
- "pageIndex": primary page index (0-indexed)
- "lineIndices": array of Line index numbers [e.g. 1, 2, 3, 4] that belong to this block
- "transcript": clean, complete transcript
- "isContinuation": true if this answer continues from the previous page

Respond strictly using ONLY valid JSON:
{
  "answers": [
    {
      "questionNumber": "1",
      "questionId": "q-1",
      "pageIndex": 0,
      "lineIndices": [1, 2, 3, 4],
      "transcript": "Object-oriented programming approach based on object and classes...",
      "isContinuation": false
    },
    {
      "questionNumber": null,
      "questionId": null,
      "pageIndex": 1,
      "lineIndices": [8],
      "transcript": "F = md that nothing 20%",
      "isContinuation": false
    }
  ]
}`;

  try {
    const rawResp = await callGroqJSON<PageClusteringResponse>(
      promptText,
      "You are an expert handwritten exam line segmentation assistant. Respond ONLY with valid JSON."
    );
    const answers =
      (Array.isArray(rawResp) ? rawResp : rawResp?.answers || rawResp?.answerSegments || rawResp?.segments || []);

    const segments: AnswerSegment[] = [];
    const usedLineIndices = new Set<number>();

    for (let i = 0; i < answers.length; i++) {
      const ans = answers[i];
      if (!ans || !ans.transcript) continue;

      const transcript = ans.transcript.trim();
      const detectedNumber =
        typeof ans.questionNumber === "string" &&
        ans.questionNumber.trim().length > 0 &&
        ans.questionNumber.trim().toLowerCase() !== "null"
          ? ans.questionNumber.trim()
          : undefined;

      const targetPageIdx = typeof ans.pageIndex === "number" ? ans.pageIndex : 0;
      const lineIndices: number[] = Array.isArray(ans.lineIndices) ? (ans.lineIndices as number[]) : [];

      lineIndices.forEach((idx: number) => usedLineIndices.add(idx));

      // Find matched physical lines
      let matchedLineItems = allLinesWithGlobalIndex.filter((item) =>
        lineIndices.includes(item.globalIdx)
      );

      // Fallback: keyword overlap matching if line indices were omitted
      if (matchedLineItems.length === 0) {
        const pageLines = allLinesWithGlobalIndex.filter((item) => item.pageIdx === targetPageIdx && !item.isNoise);
        const ansWords = transcript.toLowerCase().replace(/[^a-z0-9]/g, " ").split(/\s+/).filter((w: string) => w.length >= 3);
        const kwMatched = pageLines.filter((item) => {
          const lWords = item.line.text.toLowerCase().replace(/[^a-z0-9]/g, " ").split(/\s+/);
          return lWords.some((w: string) => ansWords.includes(w));
        });
        if (kwMatched.length > 0) {
          matchedLineItems = kwMatched;
          matchedLineItems.forEach((m) => usedLineIndices.add(m.globalIdx));
        }
      }

      // Group lines by page index to accurately support multi-page answer continuations
      const linesByPage = new Map<number, typeof matchedLineItems>();
      for (const item of matchedLineItems) {
        const list = linesByPage.get(item.pageIdx) || [];
        list.push(item);
        linesByPage.set(item.pageIdx, list);
      }

      const pages: number[] = [];
      const boxes: BoundingBox[] = [];

      if (linesByPage.size > 0) {
        Array.from(linesByPage.entries()).forEach(([pIdx, pLines]) => {
          pages.push(pIdx);
          const minX = Math.min(...pLines.map((m) => m.line.box.x));
          const maxX = Math.max(...pLines.map((m) => m.line.box.x + m.line.box.w));
          const minY = Math.min(...pLines.map((m) => m.line.box.y));
          const maxY = Math.max(...pLines.map((m) => m.line.box.y + m.line.box.h));
          boxes.push({
            page: pIdx,
            x: Math.max(minX, 0.02),
            y: Math.max(minY, 0.01),
            w: Math.min(maxX - minX, 0.96 - minX),
            h: Math.min(maxY - minY, 0.98 - minY),
          });
        });
      } else {
        pages.push(targetPageIdx);
        boxes.push({
          page: targetPageIdx,
          x: 0.05,
          y: 0.10 + i * 0.25,
          w: 0.90,
          h: 0.18,
        });
      }

      const numSlug = detectedNumber
        ? slugifyQuestionNumber(detectedNumber).replace(/^q-/, "ans-")
        : `ans-unlabeled-${segments.length + 1}`;

      segments.push({
        id: `${numSlug}-${Math.random().toString(36).substring(2, 6)}`,
        detectedNumber,
        transcript,
        pages,
        boxes,
        isContinuation: ans.isContinuation || pages.length > 1,
        order: segments.length,
      });

      console.log(
        `[AI Line Clustering] Answer ${detectedNumber || "Unlabeled"}: Mapped to ${pages.length} page(s) (P${pages.map((p) => p + 1).join(", P")}) -> Boxes: ${boxes.map((b) => `y=${b.y.toFixed(3)}, h=${b.h.toFixed(3)}`).join("; ")}`
      );
    }

    // Auto-Cluster Any Leftover Unassigned Lines (Rough Work / Calculation Notes)
    const leftoverLines = allLinesWithGlobalIndex.filter(
      (item) => !usedLineIndices.has(item.globalIdx) && !item.isNoise && item.line.text.trim().length > 2
    );

    if (leftoverLines.length > 0) {
      console.log(`[AI Line Clustering] Auto-clustering ${leftoverLines.length} leftover rough work / calculation line(s)...`);
      
      const roughGroups: (typeof leftoverLines)[] = [];
      let currentGroup: typeof leftoverLines = [];

      for (const item of leftoverLines) {
        if (currentGroup.length === 0) {
          currentGroup.push(item);
        } else {
          const prev = currentGroup[currentGroup.length - 1];
          if (prev.pageIdx === item.pageIdx && Math.abs(item.line.box.y - (prev.line.box.y + prev.line.box.h)) < 0.12) {
            currentGroup.push(item);
          } else {
            roughGroups.push(currentGroup);
            currentGroup = [item];
          }
        }
      }
      if (currentGroup.length > 0) roughGroups.push(currentGroup);

      for (const group of roughGroups) {
        const pIdx = group[0].pageIdx;
        const minX = Math.min(...group.map((g) => g.line.box.x));
        const maxX = Math.max(...group.map((g) => g.line.box.x + g.line.box.w));
        const minY = Math.min(...group.map((g) => g.line.box.y));
        const maxY = Math.max(...group.map((g) => g.line.box.y + g.line.box.h));
        const roughText = group.map((g) => g.line.text).join("\n");

        segments.push({
          id: `ans-rough-${Math.random().toString(36).substring(2, 6)}`,
          detectedNumber: undefined,
          transcript: roughText,
          pages: [pIdx],
          boxes: [
            {
              page: pIdx,
              x: Math.max(minX, 0.02),
              y: Math.max(minY, 0.01),
              w: Math.min(maxX - minX, 0.96 - minX),
              h: Math.min(maxY - minY, 0.98 - minY),
            },
          ],
          order: segments.length,
        });

        console.log(`[AI Line Clustering] Created Rough Work segment on Page ${pIdx + 1}: "${roughText}" (Box: x=${minX.toFixed(3)}, y=${minY.toFixed(3)}, w=${(maxX - minX).toFixed(3)}, h=${(maxY - minY).toFixed(3)})`);
      }
    }

    // Mathematical Non-Overlapping Box Clamping Post-Processor
    const pageMap = new Map<number, { seg: AnswerSegment; box: BoundingBox }[]>();
    for (const seg of segments) {
      for (const b of seg.boxes) {
        const p = b.page || 0;
        const list = pageMap.get(p) || [];
        list.push({ seg, box: b });
        pageMap.set(p, list);
      }
    }

    Array.from(pageMap.entries()).forEach(([pIdx, items]) => {
      items.sort((a, b) => a.box.y - b.box.y);
      for (let i = 0; i < items.length - 1; i++) {
        const cur = items[i].box;
        const next = items[i + 1].box;
        const curBottom = cur.y + cur.h;
        if (curBottom > next.y) {
          cur.h = Math.max(next.y - cur.y - 0.008, 0.02);
        }
      }
    });

    console.log(
      `[AI Line Clustering Engine] Successfully created ${segments.length} clean, non-overlapping answer segment(s)!`
    );
    return segments;
  } catch (err: any) {
    console.warn(
      `[AI Line Clustering Engine] Groq AI line clustering fallback to baseline OCR:`,
      err.message
    );
    return processOCRIntoAnswerSegments(ocrPages);
  }
}

// ---------------------------------------------------------------------------
// Module 4: Question-to-Answer Mapping & Ambiguity Handling Logic
// ---------------------------------------------------------------------------

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "what", "where", "when", "which", "whose", "whom", "why", "how",
    "explain", "describe", "define", "state", "discuss", "list", "calculate",
    "with", "from", "that", "this", "these", "those", "have", "has", "had",
    "does", "do", "did", "is", "are", "was", "were", "be", "been", "being",
    "the", "a", "an", "and", "or", "but", "if", "then", "else", "for", "to",
    "of", "in", "on", "at", "by", "into", "onto", "over", "under", "about"
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !stopWords.has(word));
}

export async function mapAnswersToQuestions(
  questions: Question[],
  segments: AnswerSegment[]
): Promise<{ mappings: Mapping[]; unmatched: UnmatchedAnswer[] }> {
  console.log(
    `[mapAnswersToQuestions] Starting mapping for ${questions.length} questions and ${segments.length} answer segments.`
  );

  const questionMapByNorm = new Map<string, Question[]>();
  const parentNumberMap = new Map<string, Question[]>();

  for (const q of questions) {
    const norm = normalizeQuestionNumber(q.number);
    if (norm) {
      const list = questionMapByNorm.get(norm) || [];
      list.push(q);
      questionMapByNorm.set(norm, list);
    }
    if (q.parentNumber) {
      const parentNorm = normalizeQuestionNumber(q.parentNumber);
      if (parentNorm) {
        const pList = parentNumberMap.get(parentNorm) || [];
        pList.push(q);
        parentNumberMap.set(parentNorm, pList);
      }
    }
  }

  const assignedSegmentsPerQuestion = new Map<string, string[]>();
  const ambiguousQuestionsMap = new Map<
    string,
    { segmentId: string; reason: string; confidence: number }
  >();
  questions.forEach((q) => assignedSegmentsPerQuestion.set(q.id, []));

  const unresolvedSegments: AnswerSegment[] = [];
  const unmatched: UnmatchedAnswer[] = [];

  for (const seg of segments) {
    if (!seg.detectedNumber) {
      console.log(
        `[mapAnswersToQuestions] Segment '${seg.id}' has no detectedNumber (unlabeled). Queuing for topic content resolution.`
      );
      unresolvedSegments.push(seg);
      continue;
    }

    const normSeg = normalizeQuestionNumber(seg.detectedNumber);
    const exactMatches = questionMapByNorm.get(normSeg);

    if (exactMatches && exactMatches.length === 1) {
      const matchedQ = exactMatches[0];
      console.log(
        `[mapAnswersToQuestions] PRE-AI MATCH SUCCESS: Segment '${seg.id}' (detectedNumber: '${seg.detectedNumber}') -> Question '${matchedQ.id}' ('${matchedQ.number}').`
      );
      const list = assignedSegmentsPerQuestion.get(matchedQ.id) || [];
      list.push(seg.id);
      assignedSegmentsPerQuestion.set(matchedQ.id, list);
    } else {
      const parentSubQuestions = parentNumberMap.get(normSeg);

      if (parentSubQuestions && parentSubQuestions.length > 1) {
        console.log(
          `[mapAnswersToQuestions] AMBIGUOUS MATCH DETECTED: Segment '${seg.id}' (detectedNumber: '${seg.detectedNumber}') matches parent question '${normSeg}'.`
        );
        for (const parentQ of parentSubQuestions) {
          ambiguousQuestionsMap.set(parentQ.id, {
            segmentId: seg.id,
            reason: `Answer segment '${seg.id}' matches parent question '${normSeg}'.`,
            confidence: 0.5,
          });
          const list = assignedSegmentsPerQuestion.get(parentQ.id) || [];
          list.push(seg.id);
          assignedSegmentsPerQuestion.set(parentQ.id, list);
        }
      } else if (exactMatches && exactMatches.length > 1) {
        for (const matchQ of exactMatches) {
          ambiguousQuestionsMap.set(matchQ.id, {
            segmentId: seg.id,
            reason: `Answer segment '${seg.id}' matches multiple questions.`,
            confidence: 0.5,
          });
          const list = assignedSegmentsPerQuestion.get(matchQ.id) || [];
          list.push(seg.id);
          assignedSegmentsPerQuestion.set(matchQ.id, list);
        }
      } else {
        unresolvedSegments.push(seg);
      }
    }
  }

  // Dynamic Keyword Overlap Resolution for Unresolved / Unlabeled Segments
  for (const seg of unresolvedSegments) {
    const handled = Array.from(assignedSegmentsPerQuestion.values()).some((list) =>
      list.includes(seg.id)
    );
    if (handled) continue;

    let bestQMatch: Question | null = null;
    let maxOverlap = 0;

    const segKeywords = new Set(extractKeywords(seg.transcript));

    for (const q of questions) {
      const qKeywords = extractKeywords(q.text);
      const overlap = qKeywords.filter((kw) => segKeywords.has(kw)).length;

      if (overlap > maxOverlap) {
        maxOverlap = overlap;
        bestQMatch = q;
      }
    }

    if (bestQMatch && maxOverlap >= 1) {
      console.log(
        `[mapAnswersToQuestions] DYNAMIC KEYWORD TOPIC MATCH: Segment '${seg.id}' -> Question '${bestQMatch.id}' ('${bestQMatch.number}') (Overlap: ${maxOverlap} keywords).`
      );
      const list = assignedSegmentsPerQuestion.get(bestQMatch.id) || [];
      list.push(seg.id);
      assignedSegmentsPerQuestion.set(bestQMatch.id, list);
    } else {
      console.log(
        `[mapAnswersToQuestions] UNMATCHED SEGMENT: Segment '${seg.id}' (transcript: "${seg.transcript.slice(0, 40)}...") has no matching question content on paper.`
      );
      unmatched.push({
        answerSegmentId: seg.id,
        reason: "Unlabeled / rough work segment with no matching question content on the exam paper.",
      });
    }
  }

  const mappings: Mapping[] = [];

  for (const q of questions) {
    const assignedIds = assignedSegmentsPerQuestion.get(q.id) || [];
    const ambigInfo = ambiguousQuestionsMap.get(q.id);

    if (ambigInfo && assignedIds.includes(ambigInfo.segmentId)) {
      mappings.push({
        questionId: q.id,
        answerSegmentIds: assignedIds,
        status: "ambiguous",
        confidence: ambigInfo.confidence,
        confidenceScore: 5,
        reason: ambigInfo.reason,
      });
    } else if (assignedIds.length > 0) {
      // Check if mapped via direct question number match
      const primarySeg = segments.find((s) => s.id === assignedIds[0]);
      const isDirectMatch = Boolean(
        primarySeg?.detectedNumber &&
          normalizeQuestionNumber(primarySeg.detectedNumber) === normalizeQuestionNumber(q.number)
      );
      const confScore = isDirectMatch ? 10 : 8;

      mappings.push({
        questionId: q.id,
        answerSegmentIds: assignedIds,
        status: "answered",
        confidence: isDirectMatch ? 1.0 : 0.85,
        confidenceScore: confScore,
        reason: `Matched ${assignedIds.length} segment(s) with ${isDirectMatch ? "direct label" : "semantic content"} match (${confScore}/10 confidence).`,
      });
    } else {
      mappings.push({
        questionId: q.id,
        answerSegmentIds: [],
        status: "unanswered",
        confidence: 0,
        confidenceScore: 0,
        reason: "No handwritten answer detected for this question.",
      });
    }
  }

  return { mappings, unmatched };
}

// ---------------------------------------------------------------------------
// Module 6: 100% Groq AI Auto-Grading Layer
// ---------------------------------------------------------------------------

export async function gradeAnswers(
  questions: Question[],
  segments: AnswerSegment[],
  mappings: Mapping[]
): Promise<{ grades: Grade[]; summary: GradeSummary }> {
  return await gradeAnswersWithGroq(questions, segments, mappings);
}
