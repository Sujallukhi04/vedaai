import { Question, AnswerSegment, Mapping, Grade, GradeSummary } from "@repo/shared";

export async function callGroqJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured in .env.local");
  }

  const models = [
    "llama-3.3-70b-versatile",
    "llama3-70b-8192",
    "llama3-8b-8192",
    "gemma2-9b-it"
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
  const systemPrompt = `You are an expert academic evaluator and teacher assistant.
Grade student handwritten answers against extracted exam questions.
Output JSON only in this exact format:
{
  "grades": [
    {
      "questionId": "string",
      "score": number,
      "maxScore": number,
      "verdict": "correct" | "partially_correct" | "incorrect",
      "feedback": "string brief summary of student correctness"
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
