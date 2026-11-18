import { PDFDocument, PageSizes, StandardFonts, degrees, rgb } from 'pdf-lib';
import { loadImageFromFile } from './imageLogic';

function toPdfBlob(bytes: Uint8Array): Blob {
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
  return new Blob([arrayBuffer], { type: 'application/pdf' });
}

function hexToRgbNormalized(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return { r: 0.15, g: 0.15, b: 0.2 };
  }
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return { r, g, b };
}

export async function rotatePdfPages(
  file: File,
  rotationsByPage: Record<number, 0 | 90 | 180 | 270>
): Promise<{ blob: Blob; pageCount: number }> {
  const buffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(buffer);
  const pages = pdfDoc.getPages();

  pages.forEach((page, index) => {
    const oneBased = index + 1;
    const delta = rotationsByPage[oneBased] ?? 0;
    if (delta !== 0) {
      const currentAngle = page.getRotation().angle;
      page.setRotation(degrees((currentAngle + delta) % 360));
    }
  });

  const bytes = await pdfDoc.save();
  return {
    blob: toPdfBlob(bytes),
    pageCount: pages.length,
  };
}

export type PdfPageNumberPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type PdfPageNumberFormat = 'number' | 'page-x' | 'x-of-y' | 'page-x-of-y';

export interface PdfPageNumberOptions {
  position: PdfPageNumberPosition;
  fontSize: number; // 8..36
  startNumber: number; // >= 1
  format: PdfPageNumberFormat;
  marginPt: number;
  textColorHex: string;
  skipFirstPage: boolean;
}

export function formatPageNumberLabel(
  displayNumber: number,
  totalDisplayCount: number,
  format: PdfPageNumberFormat
): string {
  switch (format) {
    case 'page-x':
      return `Page ${displayNumber}`;
    case 'x-of-y':
      return `${displayNumber} / ${totalDisplayCount}`;
    case 'page-x-of-y':
      return `Page ${displayNumber} of ${totalDisplayCount}`;
    case 'number':
    default:
      return String(displayNumber);
  }
}

export async function addPdfPageNumbers(
  file: File,
  options: PdfPageNumberOptions
): Promise<{ blob: Blob; pageCount: number }> {
  const buffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(buffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const { r, g, b } = hexToRgbNormalized(options.textColorHex);
  const safeFontSize = Math.max(8, Math.min(36, options.fontSize));
  const safeMargin = Math.max(12, Math.min(96, options.marginPt));

  const numberedPages = options.skipFirstPage ? Math.max(0, pages.length - 1) : pages.length;
  const totalDisplayEnd = options.startNumber + Math.max(0, numberedPages - 1);

  pages.forEach((page, index) => {
    if (options.skipFirstPage && index === 0) return;

    const offsetIndex = options.skipFirstPage ? index - 1 : index;
    const currentNumber = options.startNumber + offsetIndex;
    const label = formatPageNumberLabel(currentNumber, totalDisplayEnd, options.format);
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(label, safeFontSize);

    let x = (width - textWidth) / 2;
    if (options.position.endsWith('left')) x = safeMargin;
    else if (options.position.endsWith('right')) x = Math.max(safeMargin, width - textWidth - safeMargin);

    const y = options.position.startsWith('top')
      ? Math.max(safeMargin, height - safeMargin - safeFontSize * 0.75)
      : safeMargin;

    page.drawText(label, {
      x,
      y,
      size: safeFontSize,
      font,
      color: rgb(r, g, b),
    });
  });

  const bytes = await pdfDoc.save();
  return {
    blob: toPdfBlob(bytes),
    pageCount: pages.length,
  };
}

export type PdfWatermarkPosition =
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'diagonal-tile';

export interface PdfWatermarkOptions {
  mode: 'text' | 'image';
  text: string;
  fontSize: number;
  textColorHex: string;
  imageFile?: File | null;
  imageScalePct: number; // 10..70
  opacity: number; // 0.05..1
  rotationDeg: number; // -90..90
  position: PdfWatermarkPosition;
}

async function fileToPdfImageBytes(
  file: File
): Promise<{ kind: 'jpg' | 'png'; bytes: ArrayBuffer; width: number; height: number }> {
  const mime = file.type.toLowerCase();
  const meta = await loadImageFromFile(file);
  try {
    if (mime === 'image/jpeg' || mime === 'image/jpg') {
      return { kind: 'jpg', bytes: await file.arrayBuffer(), width: meta.width, height: meta.height };
    }
    if (mime === 'image/png') {
      return { kind: 'png', bytes: await file.arrayBuffer(), width: meta.width, height: meta.height };
    }
    const canvas = document.createElement('canvas');
    canvas.width = meta.width;
    canvas.height = meta.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable.');
    ctx.drawImage(meta.element, 0, 0);
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((res) => {
        if (!res) reject(new Error('Could not encode watermark image for PDF.'));
        else resolve(res);
      }, 'image/png');
    });
    return { kind: 'png', bytes: await pngBlob.arrayBuffer(), width: meta.width, height: meta.height };
  } finally {
    URL.revokeObjectURL(meta.previewUrl);
  }
}

export async function addPdfWatermark(
  pdfFile: File,
  options: PdfWatermarkOptions
): Promise<{ blob: Blob; pageCount: number }> {
  const buffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(buffer);
  const pages = pdfDoc.getPages();
  const safeOpacity = Math.min(1, Math.max(0.05, options.opacity));
  const safeRotation = degrees(options.rotationDeg);

  if (options.mode === 'text') {
    const text = options.text.trim();
    if (!text) throw new Error('Enter watermark text before exporting.');

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { r, g, b } = hexToRgbNormalized(options.textColorHex);
    const fontSize = Math.max(10, Math.min(120, options.fontSize));
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    for (const page of pages) {
      const { width, height } = page.getSize();
      if (options.position === 'diagonal-tile') {
        const cols = 3;
        const rows = 4;
        for (let rIdx = 0; rIdx < rows; rIdx++) {
          for (let cIdx = 0; cIdx < cols; cIdx++) {
            const cx = ((cIdx + 0.5) / cols) * width - textWidth / 2;
            const cy = ((rIdx + 0.5) / rows) * height;
            page.drawText(text, {
              x: cx,
              y: cy,
              size: fontSize,
              font,
              color: rgb(r, g, b),
              opacity: safeOpacity,
              rotate: safeRotation,
            });
          }
        }
      } else {
        let x = width / 2 - textWidth / 2;
        let y = height / 2 - fontSize / 2;
        const pad = 42;
        if (options.position === 'top-left') {
          x = pad;
          y = height - pad - fontSize;
        } else if (options.position === 'top-right') {
          x = Math.max(pad, width - pad - textWidth);
          y = height - pad - fontSize;
        } else if (options.position === 'bottom-left') {
          x = pad;
          y = pad;
        } else if (options.position === 'bottom-right') {
          x = Math.max(pad, width - pad - textWidth);
          y = pad;
        }

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(r, g, b),
          opacity: safeOpacity,
          rotate: safeRotation,
        });
      }
    }
  } else {
    if (!options.imageFile) {
      throw new Error('Upload a PNG or JPG image to use as a PDF watermark.');
    }
    const imgData = await fileToPdfImageBytes(options.imageFile);
    const embedded =
      imgData.kind === 'jpg'
        ? await pdfDoc.embedJpg(imgData.bytes)
        : await pdfDoc.embedPng(imgData.bytes);
    const aspect = imgData.height / Math.max(1, imgData.width);

    for (const page of pages) {
      const { width, height } = page.getSize();
      const drawW = (width * Math.min(80, Math.max(5, options.imageScalePct))) / 100;
      const drawH = drawW * aspect;

      if (options.position === 'diagonal-tile') {
        const cols = 2;
        const rows = 3;
        for (let rIdx = 0; rIdx < rows; rIdx++) {
          for (let cIdx = 0; cIdx < cols; cIdx++) {
            const x = ((cIdx + 0.5) / cols) * width - drawW / 2;
            const y = ((rIdx + 0.5) / rows) * height - drawH / 2;
            page.drawImage(embedded, {
              x,
              y,
              width: drawW,
              height: drawH,
              opacity: safeOpacity,
              rotate: safeRotation,
            });
          }
        }
      } else {
        let x = (width - drawW) / 2;
        let y = (height - drawH) / 2;
        const pad = 32;
        if (options.position === 'top-left') {
          x = pad;
          y = height - pad - drawH;
        } else if (options.position === 'top-right') {
          x = Math.max(pad, width - pad - drawW);
          y = height - pad - drawH;
        } else if (options.position === 'bottom-left') {
          x = pad;
          y = pad;
        } else if (options.position === 'bottom-right') {
          x = Math.max(pad, width - pad - drawW);
          y = pad;
        }

        page.drawImage(embedded, {
          x,
          y,
          width: drawW,
          height: drawH,
          opacity: safeOpacity,
          rotate: safeRotation,
        });
      }
    }
  }

  const bytes = await pdfDoc.save();
  return {
    blob: toPdfBlob(bytes),
    pageCount: pages.length,
  };
}

export interface PdfMetadataFields {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
}

export interface PdfMetadataInspection extends PdfMetadataFields {
  pageCount: number;
  creationDate: string | null;
  modificationDate: string | null;
  hasXmpMetadataStream: boolean;
  unsupportedFields: string[];
}

export async function readPdfMetadata(file: File): Promise<PdfMetadataInspection> {
  const buffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(buffer, { updateMetadata: false });

  const catalogKeys = pdfDoc.catalog.keys().map((k) => k.asString());
  const hasXmpMetadataStream = catalogKeys.includes('/Metadata');

  const unsupportedFields: string[] = [
    'Custom Info Dictionary keys (non-standard properties)',
    'Creation & Modification timestamps (preserved or auto-updated by PDF writer)',
  ];
  if (hasXmpMetadataStream) {
    unsupportedFields.unshift('Embedded XMP XML metadata stream (catalog /Metadata)');
  }

  const creationDate = pdfDoc.getCreationDate();
  const modificationDate = pdfDoc.getModificationDate();

  return {
    title: pdfDoc.getTitle() ?? '',
    author: pdfDoc.getAuthor() ?? '',
    subject: pdfDoc.getSubject() ?? '',
    keywords: pdfDoc.getKeywords() ?? '',
    creator: pdfDoc.getCreator() ?? '',
    producer: pdfDoc.getProducer() ?? '',
    pageCount: pdfDoc.getPageCount(),
    creationDate: creationDate ? creationDate.toISOString() : null,
    modificationDate: modificationDate ? modificationDate.toISOString() : null,
    hasXmpMetadataStream,
    unsupportedFields,
  };
}

export async function updatePdfMetadata(
  file: File,
  fields: PdfMetadataFields
): Promise<{ blob: Blob; pageCount: number }> {
  const buffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(buffer);

  pdfDoc.setTitle(fields.title);
  pdfDoc.setAuthor(fields.author);
  pdfDoc.setSubject(fields.subject);
  const keywordList = fields.keywords
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  pdfDoc.setKeywords(keywordList);
  pdfDoc.setCreator(fields.creator);
  pdfDoc.setProducer(fields.producer);
  pdfDoc.setModificationDate(new Date());

  const bytes = await pdfDoc.save();
  return {
    blob: toPdfBlob(bytes),
    pageCount: pdfDoc.getPageCount(),
  };
}

export type StandardPdfPagePreset = 'a4' | 'a3' | 'letter' | 'legal';

export const PDF_PAGE_PRESETS: Record<
  StandardPdfPagePreset,
  { label: string; dimensionsPt: [number, number]; dimensionsMm: string }
> = {
  a4: { label: 'A4', dimensionsPt: PageSizes.A4, dimensionsMm: '210 × 297 mm' },
  a3: { label: 'A3', dimensionsPt: PageSizes.A3, dimensionsMm: '297 × 420 mm' },
  letter: { label: 'US Letter', dimensionsPt: PageSizes.Letter, dimensionsMm: '215.9 × 279.4 mm' },
  legal: { label: 'US Legal', dimensionsPt: PageSizes.Legal, dimensionsMm: '215.9 × 355.6 mm' },
};

export async function changePdfPageSize(
  file: File,
  preset: StandardPdfPagePreset,
  orientation: 'portrait' | 'landscape',
  fitMode: 'contain' | 'stretch' | 'center'
): Promise<{ blob: Blob; pageCount: number; widthPt: number; heightPt: number }> {
  const buffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(buffer);
  const outDoc = await PDFDocument.create();

  const base = PDF_PAGE_PRESETS[preset].dimensionsPt;
  const targetW = orientation === 'portrait' ? base[0] : base[1];
  const targetH = orientation === 'portrait' ? base[1] : base[0];

  const srcPages = srcDoc.getPages();

  for (const srcPage of srcPages) {
    const newPage = outDoc.addPage([targetW, targetH]);
    const { width: srcW, height: srcH } = srcPage.getSize();
    if (srcW <= 0 || srcH <= 0 || !srcPage.node.Contents()) continue;

    const embeddedPage = await outDoc.embedPage(srcPage);

    if (fitMode === 'stretch') {
      newPage.drawPage(embeddedPage, {
        x: 0,
        y: 0,
        width: targetW,
        height: targetH,
      });
    } else if (fitMode === 'center') {
      newPage.drawPage(embeddedPage, {
        x: (targetW - srcW) / 2,
        y: (targetH - srcH) / 2,
        width: srcW,
        height: srcH,
      });
    } else {
      const scale = Math.min(targetW / srcW, targetH / srcH);
      const drawW = srcW * scale;
      const drawH = srcH * scale;
      newPage.drawPage(embeddedPage, {
        x: (targetW - drawW) / 2,
        y: (targetH - drawH) / 2,
        width: drawW,
        height: drawH,
      });
    }
  }

  const bytes = await outDoc.save();
  return {
    blob: toPdfBlob(bytes),
    pageCount: outDoc.getPageCount(),
    widthPt: Math.round(targetW),
    heightPt: Math.round(targetH),
  };
}
