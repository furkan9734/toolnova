import { PDFDocument, PageSizes, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { loadImageFromFile } from './imageLogic';

if (typeof pdfWorkerUrl === 'string') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export interface PdfMetadata {
  pageCount: number;
}

export interface RenderedPdfPage {
  pageNumber: number;
  width: number;
  height: number;
  blob: Blob;
  previewUrl: string;
}

export type PdfPageSizePreset = 'a4' | 'letter' | 'fit';
export type PdfOrientation = 'portrait' | 'landscape';

export interface OrganizedPdfPageItem {
  originalPageNumber: number; // 1-indexed
  rotationDelta: 0 | 90 | 180 | 270;
  thumbnailUrl: string;
}

export async function inspectPdfFile(file: File): Promise<PdfMetadata> {
  const buffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: false });
  return {
    pageCount: doc.getPageCount(),
  };
}

export async function mergePdfFiles(files: File[]): Promise<{ blob: Blob; totalPages: number }> {
  if (files.length < 2) {
    throw new Error('Select at least two PDF files to merge.');
  }

  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const buffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(buffer);
    const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const bytes = await mergedPdf.save();
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });

  return {
    blob,
    totalPages: mergedPdf.getPageCount(),
  };
}

export function parsePageRangeExpression(
  expression: string,
  totalPages: number
): { pages: number[]; groups: number[][] } {
  const cleaned = expression.trim();
  if (!cleaned) {
    throw new Error('Enter at least one page number or range (e.g. 1-3, 5).');
  }

  const tokens = cleaned.split(',').map((t) => t.trim()).filter(Boolean);
  if (tokens.length === 0) {
    throw new Error('Enter a valid page selection.');
  }

  const orderedPages: number[] = [];
  const groups: number[][] = [];
  const seen = new Set<number>();

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      const pageNum = Number(token);
      if (pageNum < 1 || pageNum > totalPages) {
        throw new Error(`Page ${pageNum} is out of range (1–${totalPages}).`);
      }
      groups.push([pageNum]);
      if (!seen.has(pageNum)) {
        seen.add(pageNum);
        orderedPages.push(pageNum);
      }
    } else if (/^(\d+)\s*-\s*(\d+)$/.test(token)) {
      const match = token.match(/^(\d+)\s*-\s*(\d+)$/);
      if (!match) {
        throw new Error(`Invalid range "${token}".`);
      }
      const start = Number(match[1]);
      const end = Number(match[2]);
      if (start < 1 || end < 1 || start > totalPages || end > totalPages) {
        throw new Error(`Range "${token}" exceeds document bounds (1–${totalPages}).`);
      }
      if (start > end) {
        throw new Error(`Range "${token}" start must be less than or equal to end.`);
      }
      const group: number[] = [];
      for (let p = start; p <= end; p++) {
        group.push(p);
        if (!seen.has(p)) {
          seen.add(p);
          orderedPages.push(p);
        }
      }
      groups.push(group);
    } else {
      throw new Error(`Invalid page syntax "${token}". Use numbers and hyphens like 1-3, 5.`);
    }
  }

  return { pages: orderedPages, groups };
}

export async function extractPdfPagesToBlob(
  file: File,
  oneBasedPages: number[]
): Promise<{ blob: Blob; pageCount: number }> {
  if (oneBasedPages.length === 0) {
    throw new Error('Select at least one page to export.');
  }

  const buffer = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(buffer);
  const total = sourcePdf.getPageCount();

  const zeroBased = oneBasedPages.map((p) => {
    if (p < 1 || p > total) {
      throw new Error(`Page ${p} does not exist in this ${total}-page PDF.`);
    }
    return p - 1;
  });

  const outPdf = await PDFDocument.create();
  const copied = await outPdf.copyPages(sourcePdf, zeroBased);
  copied.forEach((page) => outPdf.addPage(page));

  const bytes = await outPdf.save();
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;

  return {
    blob: new Blob([arrayBuffer], { type: 'application/pdf' }),
    pageCount: outPdf.getPageCount(),
  };
}

export async function exportOrganizedPdf(
  file: File,
  items: { originalPageNumber: number; rotationDelta: 0 | 90 | 180 | 270 }[]
): Promise<{ blob: Blob; pageCount: number }> {
  if (items.length === 0) {
    throw new Error('Keep at least one page before exporting.');
  }

  const buffer = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(buffer);
  const total = sourcePdf.getPageCount();

  const outPdf = await PDFDocument.create();
  const indices = items.map((item) => {
    if (item.originalPageNumber < 1 || item.originalPageNumber > total) {
      throw new Error(`Page ${item.originalPageNumber} is out of bounds.`);
    }
    return item.originalPageNumber - 1;
  });

  const copiedPages = await outPdf.copyPages(sourcePdf, indices);

  copiedPages.forEach((page, idx) => {
    const delta = items[idx].rotationDelta;
    if (delta !== 0) {
      const currentAngle = page.getRotation().angle;
      page.setRotation(degrees((currentAngle + delta) % 360));
    }
    outPdf.addPage(page);
  });

  const bytes = await outPdf.save();
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;

  return {
    blob: new Blob([arrayBuffer], { type: 'application/pdf' }),
    pageCount: outPdf.getPageCount(),
  };
}

async function fileToEmbeddableImageBytes(
  file: File
): Promise<{ kind: 'jpg' | 'png'; bytes: ArrayBuffer; width: number; height: number }> {
  const mime = file.type.toLowerCase();
  const meta = await loadImageFromFile(file);

  try {
    if (mime === 'image/jpeg' || mime === 'image/jpg') {
      const bytes = await file.arrayBuffer();
      return { kind: 'jpg', bytes, width: meta.width, height: meta.height };
    }
    if (mime === 'image/png') {
      const bytes = await file.arrayBuffer();
      return { kind: 'png', bytes, width: meta.width, height: meta.height };
    }

    // Convert WebP / GIF / BMP via offscreen canvas to PNG bytes
    const canvas = document.createElement('canvas');
    canvas.width = meta.width;
    canvas.height = meta.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context unavailable while converting image for PDF.');
    }
    ctx.drawImage(meta.element, 0, 0);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((res) => {
        if (!res) reject(new Error(`Could not encode "${file.name}" for PDF.`));
        else resolve(res);
      }, 'image/png');
    });

    const bytes = await pngBlob.arrayBuffer();
    return { kind: 'png', bytes, width: meta.width, height: meta.height };
  } finally {
    URL.revokeObjectURL(meta.previewUrl);
  }
}

export async function convertImagesToPdf(
  files: File[],
  pageSize: PdfPageSizePreset,
  orientation: PdfOrientation,
  marginPt = 24
): Promise<{ blob: Blob; pageCount: number }> {
  if (files.length === 0) {
    throw new Error('Add at least one image to create a PDF.');
  }

  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const imgData = await fileToEmbeddableImageBytes(file);
    const embedded =
      imgData.kind === 'jpg'
        ? await pdfDoc.embedJpg(imgData.bytes)
        : await pdfDoc.embedPng(imgData.bytes);

    if (pageSize === 'fit') {
      const page = pdfDoc.addPage([imgData.width, imgData.height]);
      page.drawImage(embedded, {
        x: 0,
        y: 0,
        width: imgData.width,
        height: imgData.height,
      });
    } else {
      const baseDims = pageSize === 'a4' ? PageSizes.A4 : PageSizes.Letter;
      const pageW = orientation === 'portrait' ? baseDims[0] : baseDims[1];
      const pageH = orientation === 'portrait' ? baseDims[1] : baseDims[0];
      const page = pdfDoc.addPage([pageW, pageH]);

      const maxDrawW = Math.max(10, pageW - marginPt * 2);
      const maxDrawH = Math.max(10, pageH - marginPt * 2);
      const scale = Math.min(maxDrawW / imgData.width, maxDrawH / imgData.height);
      const drawW = imgData.width * scale;
      const drawH = imgData.height * scale;

      page.drawImage(embedded, {
        x: (pageW - drawW) / 2,
        y: (pageH - drawH) / 2,
        width: drawW,
        height: drawH,
      });
    }
  }

  const bytes = await pdfDoc.save();
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;

  return {
    blob: new Blob([arrayBuffer], { type: 'application/pdf' }),
    pageCount: pdfDoc.getPageCount(),
  };
}

export type PdfRenderHandle = pdfjsLib.PDFDocumentProxy;

export async function openPdfForRendering(file: File): Promise<PdfRenderHandle> {
  const buffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({ data: uint8 });
  return loadingTask.promise;
}

export async function renderPdfPageThumbnail(
  pdfDoc: PdfRenderHandle,
  pageNumber: number,
  scale = 0.45
): Promise<string> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize 2D canvas context.');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport,
    canvas,
  }).promise;

  return canvas.toDataURL('image/jpeg', 0.82);
}

export async function renderPdfPageToBlob(
  pdfDoc: PdfRenderHandle,
  pageNumber: number,
  scale: number,
  mimeType: 'image/png' | 'image/jpeg',
  quality = 0.92
): Promise<RenderedPdfPage> {
  if (pageNumber < 1 || pageNumber > pdfDoc.numPages) {
    throw new Error(`Page ${pageNumber} is out of range (1–${pdfDoc.numPages}).`);
  }

  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize 2D canvas context.');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport,
    canvas,
  }).promise;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('Failed to encode PDF page to image.'));
          return;
        }
        resolve(result);
      },
      mimeType,
      mimeType === 'image/jpeg' ? quality : undefined
    );
  });

  const previewUrl = URL.createObjectURL(blob);

  return {
    pageNumber,
    width: canvas.width,
    height: canvas.height,
    blob,
    previewUrl,
  };
}
