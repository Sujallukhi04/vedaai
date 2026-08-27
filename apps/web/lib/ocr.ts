import { recognize } from "tesseract.js";
import path from "path";
import fs from "fs";
import { BoundingBox, Question, AnswerSegment } from "@repo/shared";
import { normalizeQuestionNumber } from "@repo/shared";

export interface OCRLine {
  text: string;
  box: BoundingBox;
}

export interface OCRPageResult {
  pageIndex: number;
  fullText: string;
  lines: OCRLine[];
}

function getTesseractWorkerPath(): string | undefined {
  const candidatePaths = [
    path.join(process.cwd(), "node_modules", "tesseract.js", "src", "worker-script", "node", "index.js"),
    path.join(process.cwd(), "..", "..", "node_modules", ".pnpm", "tesseract.js@7.0.0", "node_modules", "tesseract.js", "src", "worker-script", "node", "index.js"),
    path.join(process.cwd(), "node_modules", ".pnpm", "tesseract.js@7.0.0", "node_modules", "tesseract.js", "src", "worker-script", "node", "index.js"),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return undefined;
}

/**
 * Reads exact image width & height from PNG/JPEG/WEBP base64 header.
 */
function getImageDimensions(base64DataUrl: string): { width: number; height: number } {
  try {
    const base64Clean = base64DataUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
    const buffer = Buffer.from(base64Clean, "base64");

    // PNG dimensions
    if (buffer.length > 24 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      if (width > 0 && height > 0) return { width, height };
    }

    // JPEG dimensions
    let offset = 2;
    while (offset < buffer.length - 8) {
      const marker = buffer.readUInt16BE(offset);
      if (marker >= 0xffc0 && marker <= 0xffc3) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        if (width > 0 && height > 0) return { width, height };
      }
      offset += 2 + buffer.readUInt16BE(offset + 2);
    }
  } catch (_) {}

  return { width: 800, height: 1000 };
}

/**
 * Perform Fast Free Handwriting OCR via OCR.space API (Engine 2) with Local Tesseract Fallback.
 */
export async function performLocalOCR(
  base64DataUrl: string,
  pageIndex: number
): Promise<OCRPageResult> {
  const startTime = Date.now();
  console.log(`[OCR Engine] Scanning Page ${pageIndex + 1} via OCR.space Handwriting API...`);

  const { height: pageHeight } = getImageDimensions(base64DataUrl);
  const apiKey = process.env.OCR_SPACE_API_KEY || "helloworld";

  try {
    const formData = new URLSearchParams();
    formData.append("apikey", apiKey);
    formData.append("base64Image", base64DataUrl);
    formData.append("isOverlayRequired", "true");
    formData.append("OCREngine", "2");

    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    if (res.ok) {
      const data = await res.json();
      const parsedResult = data?.ParsedResults?.[0];
      const fullText = parsedResult?.ParsedText || "";
      const rawLines = parsedResult?.TextOverlay?.Lines || [];

      if (rawLines.length > 0 || fullText.length > 0) {
        const lines: OCRLine[] = [];

        const { width: pageWidth, height: pageHeight } = getImageDimensions(base64DataUrl);

        for (const line of rawLines) {
          const lineText = (line.LineText || "").trim();
          if (!lineText) continue;

          let minLeft = 50;
          let maxRight = pageWidth - 50;
          let minTop = typeof line.MinTop === "number" ? line.MinTop : 50;
          let maxBottom = minTop + (typeof line.MaxHeight === "number" ? line.MaxHeight : 20);

          if (Array.isArray(line.Words) && line.Words.length > 0) {
            const validWords = line.Words.filter((w: any) => typeof w.Left === "number" && typeof w.Top === "number");
            if (validWords.length > 0) {
              minLeft = Math.min(...validWords.map((w: any) => w.Left));
              maxRight = Math.max(...validWords.map((w: any) => w.Left + (typeof w.Width === "number" ? w.Width : 20)));
              minTop = Math.min(...validWords.map((w: any) => w.Top));
              maxBottom = Math.max(...validWords.map((w: any) => w.Top + (typeof w.Height === "number" ? w.Height : 20)));
            }
          }

          const xFraction = Math.min(Math.max((minLeft - 12) / pageWidth, 0.02), 0.90);
          const wFraction = Math.min(Math.max((maxRight - minLeft + 24) / pageWidth, 0.15), 0.96 - xFraction);
          const yFraction = Math.min(Math.max((minTop - 5) / pageHeight, 0.01), 0.96);
          const hFraction = Math.min(Math.max((maxBottom - minTop + 10) / pageHeight, 0.02), 0.15);

          lines.push({
            text: lineText,
            box: {
              page: pageIndex,
              x: xFraction,
              y: yFraction,
              w: wFraction,
              h: hFraction,
            },
          });
        }

        const elapsed = Date.now() - startTime;
        console.log(
          `[OCR Engine] Page ${pageIndex + 1} scanned via OCR.space API in ${elapsed}ms! Extracted ${lines.length} line(s).`
        );

        return {
          pageIndex,
          fullText,
          lines,
        };
      }
    }
  } catch (err: any) {
    console.warn(`[OCR Engine] OCR.space API unavailable (${err.message}). Using local Tesseract OCR fallback...`);
  }

  // Fallback to Local Tesseract OCR
  return performLocalTesseractOCR(base64DataUrl, pageIndex, startTime, pageHeight);
}

async function performLocalTesseractOCR(
  base64DataUrl: string,
  pageIndex: number,
  startTime: number,
  pageHeight: number
): Promise<OCRPageResult> {
  const tessdataDir = path.join(process.cwd(), "tessdata");
  const workerPath = getTesseractWorkerPath();

  try {
    const base64Clean = base64DataUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
    const imgBuffer = Buffer.from(base64Clean, "base64");

    const options: any = {
      langPath: tessdataDir,
      gzip: false,
    };
    if (workerPath) {
      options.workerPath = workerPath;
    }

    const ret = await recognize(imgBuffer, "eng", options);
    const fullText = ret?.data?.text || "";

    const rawLines = fullText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const lines: OCRLine[] = [];
    const totalLines = Math.max(rawLines.length, 1);

    for (let i = 0; i < rawLines.length; i++) {
      const lineText = rawLines[i];
      const yFraction = Math.min(Math.max(0.08 + (i / totalLines) * 0.80, 0.08), 0.92);
      const hFraction = Math.min(0.80 / totalLines, 0.10);

      lines.push({
        text: lineText,
        box: {
          page: pageIndex,
          x: 0.05,
          y: yFraction,
          w: 0.9,
          h: hFraction > 0 ? hFraction : 0.04,
        },
      });
    }

    const elapsed = Date.now() - startTime;
    console.log(
      `[Local OCR] Page ${pageIndex + 1} scanned locally in ${elapsed}ms! Extracted ${lines.length} line(s).`
    );

    return {
      pageIndex,
      fullText,
      lines,
    };
  } catch (err: any) {
    console.warn(`[Local OCR] Tesseract error on page ${pageIndex + 1}:`, err.message);
    return {
      pageIndex,
      fullText: "",
      lines: [],
    };
  }
}

/**
 * Purely Dynamic Header-to-Header Answer Segmentation Engine.
 * Segments lines strictly from each detected question header to the next question header.
 */
export function processOCRIntoAnswerSegments(
  ocrResults: OCRPageResult[]
): AnswerSegment[] {
  const segments: AnswerSegment[] = [];
  const headerRegex = /^(?:Q|q|Question|Ans|Answer)?[\.\s]*([0-9]+(?:\([a-z0-9]+\))?|\([a-z0-9]+\))(?:\.|\:|\-|\)|\s+|$)/i;

  for (const ocrPage of ocrResults) {
    const pIdx = ocrPage.pageIndex;
    const lines = ocrPage.lines
      .filter((l) => l.text.trim().length > 0)
      .sort((a, b) => a.box.y - b.box.y);

    if (lines.length === 0) continue;

    // Detect all real question header lines (excluding page margins or unit abbreviations like 1NF)
    const lineHeaders: { lineIndex: number; num: string }[] = [];

    lines.forEach((l, idx) => {
      // Skip top margin header noise
      if (l.box.y < 0.06 && /^(?:date|page|no)/i.test(l.text)) return;

      const match = l.text.match(headerRegex);
      if (match) {
        // Exclude units like 1NF, 100kg
        if (!l.text.match(/^[0-9]+[a-zA-Z]{2,}/)) {
          lineHeaders.push({ lineIndex: idx, num: match[1].trim() });
        }
      }
    });

    if (lineHeaders.length > 0) {
      // Build an answer segment for each header line to the next header line
      for (let i = 0; i < lineHeaders.length; i++) {
        const startIdx = lineHeaders[i].lineIndex;
        const endIdx = i < lineHeaders.length - 1 ? lineHeaders[i + 1].lineIndex : lines.length;

        const blockLines = lines.slice(startIdx, endIdx);
        if (blockLines.length === 0) continue;

        const fullTranscript = blockLines.map((l) => l.text).join("\n");
        const minY = Math.min(...blockLines.map((l) => l.box.y));
        const maxY = Math.max(...blockLines.map((l) => l.box.y + l.box.h));

        const tightBox: BoundingBox = {
          page: pIdx,
          x: 0.05,
          y: Math.max(minY - 0.005, 0.01),
          w: 0.9,
          h: Math.min(Math.max(maxY - minY + 0.008, 0.03), 0.98 - minY),
        };

        const detectedNumber = lineHeaders[i].num.replace(/[\.:,\s\(\)]+$/, "");
        const numSlug = normalizeQuestionNumber(detectedNumber) || `ans-${segments.length + 1}`;

        segments.push({
          id: `ans-${numSlug}-${Math.random().toString(36).substring(2, 6)}`,
          detectedNumber,
          transcript: fullTranscript,
          pages: [pIdx],
          boxes: [tightBox],
          order: segments.length,
        });
      }
    } else {
      // Fallback: full page single answer
      const minY = Math.min(...lines.map((l) => l.box.y));
      const maxY = Math.max(...lines.map((l) => l.box.y + l.box.h));

      segments.push({
        id: `ans-unlabeled-${segments.length + 1}`,
        detectedNumber: undefined,
        transcript: lines.map((l) => l.text).join("\n"),
        pages: [pIdx],
        boxes: [
          {
            page: pIdx,
            x: 0.05,
            y: Math.max(minY - 0.005, 0.01),
            w: 0.9,
            h: Math.min(Math.max(maxY - minY + 0.008, 0.03), 0.98 - minY),
          },
        ],
        order: segments.length,
      });
    }
  }

  console.log(`[Dynamic OCR Engine] Created ${segments.length} exact answer segment(s) via Header-to-Header segmentation.`);
  return segments;
}
