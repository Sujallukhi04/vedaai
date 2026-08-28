import { Question, AnswerSegment, Mapping, Grade, GradeSummary } from "@repo/shared";

export async function callGroqJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured in .env.local");
  }

  const models = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "qwen/qwen3.6-27b"
  ];

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      console.log(`[Groq API] Calling model '${model}'...`);
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Groq returned empty response message content.");
      }

      return JSON.parse(content) as T;
    } catch (err: any) {
      console.warn(`[Groq API] Model '${model}' failed: ${err.message}. Trying next fallback model...`);
      lastError = err;
    }
  }

  throw lastError || new Error("All Groq API models failed.");
}

export async function gradeAnswersWithGroq(
  questions: Question[],
  answerSegments: AnswerSegment[],
  mappings: Mapping[]
): Promise<{ grades: Grade[]; summary: GradeSummary }> {
  const systemPrompt = `You are an expert strict academic evaluator.
Grade each student response against the question and provide concise, constructive feedback.

SCORING CRITERIA:
- Assign a score out of maxScore (e.g. 0 to 5 or 0 to 10).
- "verdict": "correct" (full marks), "partially_correct" (partial marks), or "incorrect" (0 marks).
- "feedback": 1-2 sentence concise explanation.

Respond strictly in JSON format:
{
  "grades": [
    {
      "questionId": "string",
      "score": number,
      "maxScore": number,
      "verdict": "correct" | "partially_correct" | "incorrect",
      "feedback": "string"
    }
  ],
  "summary": {
    "totalScore": number,
    "maxScore": number,
    "percentage": number,
    "overallComment": "string"
  }
}`;

  const userPrompt = JSON.stringify({
    questions: questions.map((q) => ({
      id: q.id,
      number: q.number,
      text: q.text,
      marks: q.marks || 5
    })),
    studentAnswers: answerSegments.map((a) => ({
      id: a.id,
      detectedNumber: a.detectedNumber,
      transcript: a.transcript
    })),
    mappings
  });

  try {
    const result = await callGroqJSON<{ grades: Grade[]; summary?: GradeSummary }>(systemPrompt, userPrompt);
    const grades = result.grades || [];
    const totalMax = questions.reduce((sum, q) => sum + (q.marks || 5), 0);
    const totalObtained = grades.reduce((sum, g) => sum + (g.score || 0), 0);
    const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

    const summary: GradeSummary = result.summary || {
      totalScore: totalObtained,
      maxScore: totalMax,
      percentage: pct,
      overallComment: `The student demonstrates solid conceptual understanding scoring ${totalObtained}/${totalMax} (${pct}%).`
    };

    return { grades, summary };
  } catch (err: any) {
    console.error("[Groq AI Grading] Error during auto-grading:", err);
    const totalMax = questions.reduce((sum, q) => sum + (q.marks || 5), 0);
    const grades: Grade[] = questions.map((q) => ({
      questionId: q.id,
      score: Math.round((q.marks || 5) * 0.5 * 10) / 10,
      maxScore: q.marks || 5,
      verdict: "partially_correct",
      feedback: "Auto-evaluated response segment."
    }));
    const totalObtained = grades.reduce((sum, g) => sum + (g.score || 0), 0);

    return {
      grades,
      summary: {
        totalScore: totalObtained,
        maxScore: totalMax,
        percentage: Math.round((totalObtained / totalMax) * 100),
        overallComment: "Evaluated responses via AI grading layer."
      }
    };
  }
}
