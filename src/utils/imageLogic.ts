export type ExportImageFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export interface LoadedImageMeta {
  width: number;
  height: number;
  previewUrl: string;
  element: HTMLImageElement;
}

export interface ProcessedImageResult {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  size: number;
  mimeType: ExportImageFormat;
}

export interface CropRectNormalized {
  x: number; // 0..1
  y: number; // 0..1
  width: number; // 0..1
  height: number; // 0..1
}

export interface ColorValue {
  r: number;
  g: number;
  b: number;
  hex: string;
  rgb: string;
  hsl: string;
}

export function loadImageFromFile(file: File): Promise<LoadedImageMeta> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        previewUrl: objectUrl,
        element: img,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Unable to decode "${file.name}". The file may be corrupted.`));
    };
    img.src = objectUrl;
  });
}

export async function renderProcessedImage(
  image: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  mimeType: ExportImageFormat,
  quality: number
): Promise<ProcessedImageResult> {
  const safeWidth = Math.max(1, Math.round(targetWidth));
  const safeHeight = Math.max(1, Math.round(targetHeight));

  const canvas = document.createElement('canvas');
  canvas.width = safeWidth;
  canvas.height = safeHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Browser canvas context is unavailable.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // JPEG does not support alpha transparency; fill with white canvas first
  if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, safeWidth, safeHeight);
  }

  ctx.drawImage(image, 0, 0, safeWidth, safeHeight);

  const normalizedQuality = Math.min(1, Math.max(0.05, quality));

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('Image export failed in this browser.'));
          return;
        }
        resolve(result);
      },
      mimeType,
      mimeType === 'image/png' ? undefined : normalizedQuality
    );
  });

  const previewUrl = URL.createObjectURL(blob);

  return {
    blob,
    previewUrl,
    width: safeWidth,
    height: safeHeight,
    size: blob.size,
    mimeType,
  };
}

export async function renderRotatedCanvas(
  image: HTMLImageElement,
  rotationDeg: 0 | 90 | 180 | 270
): Promise<HTMLCanvasElement> {
  const isQuarterTurn = rotationDeg === 90 || rotationDeg === 270;
  const rotWidth = isQuarterTurn ? image.naturalHeight : image.naturalWidth;
  const rotHeight = isQuarterTurn ? image.naturalWidth : image.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = rotWidth;
  canvas.height = rotHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Browser canvas context is unavailable.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(rotWidth / 2, rotHeight / 2);
  ctx.rotate((rotationDeg * Math.PI) / 180);
  ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

  return canvas;
}

export async function cropAndRotateImage(
  image: HTMLImageElement,
  crop: CropRectNormalized,
  rotationDeg: 0 | 90 | 180 | 270,
  mimeType: ExportImageFormat,
  quality = 0.92
): Promise<ProcessedImageResult> {
  const rotatedCanvas = await renderRotatedCanvas(image, rotationDeg);
  const srcW = rotatedCanvas.width;
  const srcH = rotatedCanvas.height;

  const sx = Math.max(0, Math.round(crop.x * srcW));
  const sy = Math.max(0, Math.round(crop.y * srcH));
  const sw = Math.max(1, Math.min(srcW - sx, Math.round(crop.width * srcW)));
  const sh = Math.max(1, Math.min(srcH - sy, Math.round(crop.height * srcH)));

  const outCanvas = document.createElement('canvas');
  outCanvas.width = sw;
  outCanvas.height = sh;

  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) {
    throw new Error('Browser canvas context is unavailable.');
  }

  if (mimeType === 'image/jpeg') {
    outCtx.fillStyle = '#FFFFFF';
    outCtx.fillRect(0, 0, sw, sh);
  }

  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';
  outCtx.drawImage(rotatedCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

  const normalizedQuality = Math.min(1, Math.max(0.05, quality));

  const blob = await new Promise<Blob>((resolve, reject) => {
    outCanvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('Cropped image export failed.'));
          return;
        }
        resolve(result);
      },
      mimeType,
      mimeType === 'image/png' ? undefined : normalizedQuality
    );
  });

  const previewUrl = URL.createObjectURL(blob);

  return {
    blob,
    previewUrl,
    width: sw,
    height: sh,
    size: blob.size,
    mimeType,
  };
}

export function rgbToColorValue(r: number, g: number, b: number): ColorValue {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0').toUpperCase();
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  const rgb = `rgb(${r}, ${g}, ${b})`;

  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / delta + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / delta + 2;
        break;
      case bn:
        h = (rn - gn) / delta + 4;
        break;
    }
    h /= 6;
  }

  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);

  return {
    r,
    g,
    b,
    hex,
    rgb,
    hsl: `hsl(${hDeg}, ${sPct}%, ${lPct}%)`,
  };
}

export function getExtensionForMime(mimeType: ExportImageFormat): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    case 'image/png':
    default:
      return 'png';
  }
}

export function getMimeFromFile(file: File): ExportImageFormat {
  const lower = file.type.toLowerCase();
  if (lower === 'image/png') return 'image/png';
  if (lower === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}
