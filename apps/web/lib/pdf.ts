import { createCanvas, Image, ImageData, DOMMatrix, Path2D } from "@napi-rs/canvas";
import Module from "module";

// Override CJS Module._load to resolve dynamic require('canvas') calls
// to prebuilt @napi-rs/canvas in Node.js runtime environment
const originalLoad = (Module as any)._load;
(Module as any)._load = function (request: string, parent: any, isMain: boolean) {
  if (request === "canvas") {
    return {
      createCanvas,
      Image,
      ImageData,
      DOMMatrix,
      Path2D,
      default: { createCanvas, Image, ImageData, DOMMatrix, Path2D },
    };
  }
  return originalLoad.apply(this, arguments);
};

// Polyfill global canvas objects for pdfjs-dist
if (typeof global !== "undefined") {
  (global as any).HTMLCanvasElement = (createCanvas(1, 1) as any).constructor;
  (global as any).Image = Image;
  (global as any).ImageData = ImageData;
  (global as any).DOMMatrix = DOMMatrix;
  (global as any).Path2D = Path2D;
}

class NodeCanvasFactory {
  create(width: number, height: number) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    return {
      canvas,
      context,
    };
  }

  reset(canvasAndContext: any, width: number, height: number) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext: any) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

/**
 * Renders a PDF file buffer into an array of base64 PNG data URLs using pdfjs-dist and @napi-rs/canvas.
 */
async function renderPdfToPageImages(fileBuffer: Buffer): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.js" as any);
  const pdfWorker = await import("pdfjs-dist/legacy/build/pdf.worker.js" as any);

  if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerPort = pdfWorker;
  }

  const uint8Array = new Uint8Array(fileBuffer);
  const loadingTask = pdfjs.getDocument({
    data: uint8Array,
    disableFontFace: true,
    verbosity: 0,
  });

  const pdfDoc = await loadingTask.promise;
  const pageImages: string[] = [];
  const factory = new NodeCanvasFactory();

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvasAndContext = factory.create(
      Math.floor(viewport.width),
      Math.floor(viewport.height)
    );

    const renderContext = {
      canvasContext: canvasAndContext.context as any,
      viewport: viewport,
      canvasFactory: factory,
    };

    await page.render(renderContext).promise;
    const base64DataUrl = canvasAndContext.canvas.toDataURL("image/png");
    pageImages.push(base64DataUrl);
  }

  return pageImages;
}

/**
 * Renders a base64 PDF data string into base64 page images.
 */
export async function renderPDFToDataUrls(base64: string): Promise<string[]> {
  const base64Clean = base64.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(base64Clean, "base64");
  return await renderPdfToPageImages(buffer);
}

/**
 * Converts an uploaded file (Buffer) into an array of base64 image data URLs.
 */
export async function convertFileToPageImages(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string[]> {
  const normalizedMime = mimeType.toLowerCase();
  const lowerName = fileName.toLowerCase();

  if (
    normalizedMime.startsWith("image/") ||
    lowerName.endsWith(".png") ||
    lowerName.endsWith(".jpg") ||
    lowerName.endsWith(".jpeg") ||
    lowerName.endsWith(".webp")
  ) {
    const format = normalizedMime.includes("png")
      ? "png"
      : normalizedMime.includes("webp")
      ? "webp"
      : "jpeg";
    const base64 = fileBuffer.toString("base64");
    return [`data:image/${format};base64,${base64}`];
  }

  if (normalizedMime === "application/pdf" || lowerName.endsWith(".pdf")) {
    try {
      const pageImages = await renderPdfToPageImages(fileBuffer);
      if (!pageImages || pageImages.length === 0) {
        throw new Error("No pages could be rendered from the PDF document.");
      }
      return pageImages;
    } catch (err: any) {
      console.error(`[pdf.ts] Error rendering PDF '${fileName}':`, err);
      throw new Error(
        `Failed to convert PDF '${fileName}': ${err.message || "Invalid or corrupt PDF file."}`
      );
    }
  }

  throw new Error(
    `Unsupported file format for '${fileName}'. Expected a PDF or PNG/JPG image file.`
  );
}
