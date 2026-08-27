/**
 * Clean and normalize question number strings for matching.
 * Handles variations like:
 *   "Q. 11 (a)"   -> "11a"
 *   "Question 4"  -> "4"
 *   "A 1"         -> "1"
 *   "A. 1"        -> "1"
 *   "Ans 1"       -> "1"
 *   "Ans. 1(a)"   -> "1a"
 *   "Answer 2"    -> "2"
 *   "Sol 3"       -> "3"
 *   "11(b)"       -> "11b"
 */
export function normalizeQuestionNumber(raw: string): string {
  if (!raw) return "";
  return raw
    .trim()
    .toLowerCase()
    .replace(/^(?:q(?:uestion)?|a(?:ns(?:wer)?)?|sol(?:ution)?)[\.\s\:\-]*/i, "") // Strip Q., Q, Question, A., A, Ans, Answer, Sol, Solution prefixes
    .replace(/[\(\)\[\]\s\.\:\-]/g, "");                                         // Remove parens, brackets, whitespace, dots, colons, hyphens
}

/**
 * Extracts parent question number if applicable (e.g., "11a" -> "11", "3a" -> "3").
 */
export function extractParentQuestionNumber(raw: string): string {
  const normalized = normalizeQuestionNumber(raw);
  const match = normalized.match(/^(\d+)/);
  return match ? match[1] : normalized;
}

/**
 * Returns true if two question number labels match after normalization.
 */
export function isQuestionMatch(labelA: string, labelB: string): boolean {
  const normA = normalizeQuestionNumber(labelA);
  const normB = normalizeQuestionNumber(labelB);
  if (!normA || !normB) return false;
  return normA === normB;
}
