import { getExtensionForMime, type CropRectNormalized, type ExportImageFormat } from './imageLogic';

export interface MaskBrushStroke {
  mode: 'erase' | 'restore';
  points: { x: number; y: number }[]; // normalized 0..1
  radiusNorm: number; // relative to image width
}

export interface BackgroundChangeOptions {
  targetRgb: { r: number; g: number; b: number } | null;
  tolerance: number; // 0..100
  feather: number; // 0..20
  matchMode: 'flood' | 'global';
  seedPoints: { x: number; y: number }[]; // normalized 0..1
  brushStrokes: MaskBrushStroke[];
  replacementMode: 'transparent' | 'solid';
  replacementColor: string;
  mimeType: ExportImageFormat;
  quality: number;
}

export interface AdvancedImageResult {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  size: number;
  mimeType: string;
  removedPixelPercent?: number;
}

function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Replaces image background using explicit color-tolerance masking (flood-fill from user seeds/corners
 * or global color-key) plus optional manual erase/restore brush strokes.
 * Does not claim automatic AI semantic segmentation.
 */
export async function replaceImageBackground(
  image: HTMLImageElement,
  options: BackgroundChangeOptions
): Promise<AdvancedImageResult> {
  const width = image.naturalWidth;
  const height = image.naturalHeight;

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = width;
  srcCanvas.height = height;
  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) throw new Error('Browser canvas context is unavailable.');
  srcCtx.drawImage(image, 0, 0, width, height);

  const imgData = srcCtx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const totalPixels = width * height;

  // alphaMask: 0 = fully background (removed), 255 = fully foreground (kept)
  const alphaMask = new Uint8Array(totalPixels);
  alphaMask.fill(255);

  const maxDist = (options.tolerance / 100) * 441.67295593; // sqrt(255^2 * 3)
  const featherDist = maxDist + (options.feather / 100) * 120;

  if (options.targetRgb) {
    const { r: tr, g: tg, b: tb } = options.targetRgb;

    if (options.matchMode === 'global') {
      for (let i = 0; i < totalPixels; i++) {
        const idx = i * 4;
        const dist = colorDistance(data[idx], data[idx + 1], data[idx + 2], tr, tg, tb);
        if (dist <= maxDist) {
          alphaMask[i] = 0;
        } else if (options.feather > 0 && dist < featherDist) {
          const ratio = (dist - maxDist) / Math.max(1, featherDist - maxDist);
          alphaMask[i] = Math.round(ratio * 255);
        }
      }
    } else {
      // Flood fill from user seed points (or image corners if no seed points yet)
      const seeds =
        options.seedPoints.length > 0
          ? options.seedPoints.map((p) => ({
              x: Math.max(0, Math.min(width - 1, Math.round(p.x * (width - 1)))),
              y: Math.max(0, Math.min(height - 1, Math.round(p.y * (height - 1)))),
            }))
          : [
              { x: 0, y: 0 },
              { x: width - 1, y: 0 },
              { x: 0, y: height - 1 },
              { x: width - 1, y: height - 1 },
            ];

      const visited = new Uint8Array(totalPixels);
      const queue = new Int32Array(totalPixels);
      let head = 0;
      let tail = 0;

      for (const s of seeds) {
        const startIdx = s.y * width + s.x;
        if (!visited[startIdx]) {
          visited[startIdx] = 1;
          queue[tail++] = startIdx;
        }
      }

      while (head < tail) {
        const pIdx = queue[head++];
        const rgbaIdx = pIdx * 4;
        const dist = colorDistance(
          data[rgbaIdx],
          data[rgbaIdx + 1],
          data[rgbaIdx + 2],
          tr,
          tg,
          tb
        );

        if (dist <= maxDist) {
          alphaMask[pIdx] = 0;
          const x = pIdx % width;
          const y = (pIdx - x) / width;

          if (x > 0) {
            const left = pIdx - 1;
            if (!visited[left]) {
              visited[left] = 1;
              queue[tail++] = left;
            }
          }
          if (x < width - 1) {
            const right = pIdx + 1;
            if (!visited[right]) {
              visited[right] = 1;
              queue[tail++] = right;
            }
          }
          if (y > 0) {
            const up = pIdx - width;
            if (!visited[up]) {
              visited[up] = 1;
              queue[tail++] = up;
            }
          }
          if (y < height - 1) {
            const down = pIdx + width;
            if (!visited[down]) {
              visited[down] = 1;
              queue[tail++] = down;
            }
          }
        } else if (options.feather > 0 && dist < featherDist) {
          const ratio = (dist - maxDist) / Math.max(1, featherDist - maxDist);
          alphaMask[pIdx] = Math.min(alphaMask[pIdx], Math.round(ratio * 255));
        }
      }
    }
  }

  // Apply manual brush strokes (erase/restore) on top of mask
  if (options.brushStrokes.length > 0) {
    const brushCanvas = document.createElement('canvas');
    brushCanvas.width = width;
    brushCanvas.height = height;
    const bCtx = brushCanvas.getContext('2d');
    if (bCtx) {
      const maskImgData = bCtx.createImageData(width, height);
      for (let i = 0; i < totalPixels; i++) {
        const idx = i * 4;
        const val = alphaMask[i];
        maskImgData.data[idx] = val;
        maskImgData.data[idx + 1] = val;
        maskImgData.data[idx + 2] = val;
        maskImgData.data[idx + 3] = 255;
      }
      bCtx.putImageData(maskImgData, 0, 0);
      bCtx.lineCap = 'round';
      bCtx.lineJoin = 'round';

      for (const stroke of options.brushStrokes) {
        if (stroke.points.length === 0) continue;
        const radiusPx = Math.max(2, stroke.radiusNorm * width);
        bCtx.strokeStyle = stroke.mode === 'erase' ? '#000000' : '#FFFFFF';
        bCtx.fillStyle = stroke.mode === 'erase' ? '#000000' : '#FFFFFF';
        bCtx.lineWidth = radiusPx * 2;

        if (stroke.points.length === 1) {
          const pt = stroke.points[0];
          bCtx.beginPath();
          bCtx.arc(pt.x * width, pt.y * height, radiusPx, 0, Math.PI * 2);
          bCtx.fill();
        } else {
          bCtx.beginPath();
          bCtx.moveTo(stroke.points[0].x * width, stroke.points[0].y * height);
          for (let j = 1; j < stroke.points.length; j++) {
            bCtx.lineTo(stroke.points[j].x * width, stroke.points[j].y * height);
          }
          bCtx.stroke();
        }
      }

      const updatedMask = bCtx.getImageData(0, 0, width, height).data;
      for (let i = 0; i < totalPixels; i++) {
        alphaMask[i] = updatedMask[i * 4];
      }
    }
  }

  let removedCount = 0;
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const m = alphaMask[i];
    if (m < 245) removedCount++;
    data[idx + 3] = Math.round((data[idx + 3] * m) / 255);
  }

  srcCtx.putImageData(imgData, 0, 0);

  // Composite onto final canvas (solid replacement color or transparent)
  const outCanvas = document.createElement('canvas');
  outCanvas.width = width;
  outCanvas.height = height;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('Browser canvas context is unavailable.');

  const effectiveMime: ExportImageFormat =
    options.replacementMode === 'transparent' && options.mimeType === 'image/jpeg'
      ? 'image/png'
      : options.mimeType;

  if (options.replacementMode === 'solid') {
    outCtx.fillStyle = options.replacementColor || '#FFFFFF';
    outCtx.fillRect(0, 0, width, height);
  } else if (effectiveMime === 'image/jpeg') {
    outCtx.fillStyle = '#FFFFFF';
    outCtx.fillRect(0, 0, width, height);
  }

  outCtx.drawImage(srcCanvas, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    outCanvas.toBlob(
      (res) => {
        if (!res) reject(new Error('Failed to export background-edited image.'));
        else resolve(res);
      },
      effectiveMime,
      effectiveMime === 'image/png' ? undefined : Math.min(1, Math.max(0.1, options.quality))
    );
  });

  return {
    blob,
    previewUrl: URL.createObjectURL(blob),
    width,
    height,
    size: blob.size,
    mimeType: effectiveMime,
    removedPixelPercent: totalPixels > 0 ? Math.round((removedCount / totalPixels) * 100) : 0,
  };
}

export type WatermarkAnchor =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'tile';

export interface ImageWatermarkOptions {
  mode: 'text' | 'image';
  text: string;
  textColor: string;
  fontSizePct: number; // % of image short edge (1..25)
  fontWeight: 'normal' | 'bold';
  watermarkImage?: HTMLImageElement | null;
  imageScalePct: number; // % of base image width (5..80)
  opacity: number; // 0.05..1
  rotationDeg: number; // -180..180
  position: WatermarkAnchor;
  marginPct: number; // 0..15
  mimeType: ExportImageFormat;
  quality: number;
}

function getAnchorCenter(
  position: Exclude<WatermarkAnchor, 'tile'>,
  canvasW: number,
  canvasH: number,
  itemW: number,
  itemH: number,
  marginPx: number
): { cx: number; cy: number } {
  let cx = canvasW / 2;
  let cy = canvasH / 2;

  if (position.includes('left')) cx = marginPx + itemW / 2;
  else if (position.includes('right')) cx = canvasW - marginPx - itemW / 2;

  if (position.startsWith('top')) cy = marginPx + itemH / 2;
  else if (position.startsWith('bottom')) cy = canvasH - marginPx - itemH / 2;

  return { cx, cy };
}

export async function applyImageWatermark(
  baseImage: HTMLImageElement,
  options: ImageWatermarkOptions
): Promise<AdvancedImageResult> {
  const width = baseImage.naturalWidth;
  const height = baseImage.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Browser canvas context is unavailable.');

  if (options.mimeType === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(baseImage, 0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = Math.min(1, Math.max(0.05, options.opacity));
  const rad = (options.rotationDeg * Math.PI) / 180;
  const marginPx = (Math.min(width, height) * Math.max(0, options.marginPct)) / 100;

  if (options.mode === 'text') {
    const content = options.text.trim();
    if (!content) {
      throw new Error('Enter watermark text before exporting.');
    }
    const fontPx = Math.max(10, Math.round((Math.min(width, height) * options.fontSizePct) / 100));
    ctx.font = `${options.fontWeight === 'bold' ? '700' : '500'} ${fontPx}px "Plus Jakarta Sans", Inter, system-ui, sans-serif`;
    ctx.fillStyle = options.textColor || '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.28)';
    ctx.shadowBlur = Math.max(2, fontPx * 0.08);

    const metrics = ctx.measureText(content);
    const textW = metrics.width;
    const textH = fontPx * 1.15;

    if (options.position === 'tile') {
      const stepX = Math.max(textW + fontPx * 1.8, width / 4);
      const stepY = Math.max(textH + fontPx * 2.2, height / 4);
      for (let y = stepY / 2; y < height + stepY; y += stepY) {
        for (let x = stepX / 2; x < width + stepX; x += stepX) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rad);
          ctx.fillText(content, 0, 0);
          ctx.restore();
        }
      }
    } else {
      const { cx, cy } = getAnchorCenter(options.position, width, height, textW, textH, marginPx);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rad);
      ctx.fillText(content, 0, 0);
      ctx.restore();
    }
  } else {
    const wmImg = options.watermarkImage;
    if (!wmImg) {
      throw new Error('Upload a watermark image (PNG/SVG/WebP) first.');
    }
    const drawW = Math.max(12, Math.round((width * options.imageScalePct) / 100));
    const ratio = wmImg.naturalHeight / Math.max(1, wmImg.naturalWidth);
    const drawH = Math.max(12, Math.round(drawW * ratio));

    if (options.position === 'tile') {
      const stepX = Math.max(drawW * 1.7, width / 4);
      const stepY = Math.max(drawH * 1.7, height / 4);
      for (let y = stepY / 2; y < height + stepY; y += stepY) {
        for (let x = stepX / 2; x < width + stepX; x += stepX) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rad);
          ctx.drawImage(wmImg, -drawW / 2, -drawH / 2, drawW, drawH);
          ctx.restore();
        }
      }
    } else {
      const { cx, cy } = getAnchorCenter(options.position, width, height, drawW, drawH, marginPx);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rad);
      ctx.drawImage(wmImg, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    }
  }

  ctx.restore();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (res) => {
        if (!res) reject(new Error('Failed to render watermarked image.'));
        else resolve(res);
      },
      options.mimeType,
      options.mimeType === 'image/png' ? undefined : Math.min(1, Math.max(0.1, options.quality))
    );
  });

  return {
    blob,
    previewUrl: URL.createObjectURL(blob),
    width,
    height,
    size: blob.size,
    mimeType: options.mimeType,
  };
}

export interface GeneratedFaviconItem {
  size: number;
  label: string;
  blob: Blob;
  previewUrl: string;
  byteSize: number;
}

export const STANDARD_FAVICON_SIZES = [16, 32, 48, 64, 180, 192, 512] as const;

/**
 * Generates multi-size square PNG icons centered/fitted inside square bounds with optional background fill and padding.
 */
export async function generateFaviconSizes(
  image: HTMLImageElement,
  sizes: number[] = [...STANDARD_FAVICON_SIZES],
  options: { backgroundColor: string | null; paddingPct: number; borderRadiusPct: number }
): Promise<GeneratedFaviconItem[]> {
  const results: GeneratedFaviconItem[] = [];

  for (const size of sizes) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable.');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (options.borderRadiusPct > 0) {
      const r = (size * Math.min(50, options.borderRadiusPct)) / 100;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(size - r, 0);
      ctx.quadraticCurveTo(size, 0, size, r);
      ctx.lineTo(size, size - r);
      ctx.quadraticCurveTo(size, size, size - r, size);
      ctx.lineTo(r, size);
      ctx.quadraticCurveTo(0, size, 0, size - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.clip();
    }

    if (options.backgroundColor) {
      ctx.fillStyle = options.backgroundColor;
      ctx.fillRect(0, 0, size, size);
    }

    const padPx = (size * Math.max(0, Math.min(35, options.paddingPct))) / 100;
    const avail = Math.max(1, size - padPx * 2);
    const scale = Math.min(avail / image.naturalWidth, avail / image.naturalHeight);
    const drawW = image.naturalWidth * scale;
    const drawH = image.naturalHeight * scale;
    const dx = (size - drawW) / 2;
    const dy = (size - drawH) / 2;

    ctx.drawImage(image, dx, dy, drawW, drawH);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((res) => {
        if (!res) reject(new Error(`Failed to encode ${size}x${size} PNG.`));
        else resolve(res);
      }, 'image/png');
    });

    const label =
      size === 180
        ? 'Apple Touch Icon'
        : size === 192
        ? 'Android Chrome'
        : size === 512
        ? 'PWA Splash Icon'
        : 'Browser Favicon';

    results.push({
      size,
      label,
      blob,
      previewUrl: URL.createObjectURL(blob),
      byteSize: blob.size,
    });
  }

  return results;
}

/**
 * Encodes PNG favicon buffers into a genuine Windows/Browser .ico file (ICONDIR + ICONDIRENTRY + PNG payloads).
 */
export async function buildIcoBlobFromPngBlobs(
  entries: { size: number; pngBytes: Uint8Array }[]
): Promise<Blob> {
  if (entries.length === 0) {
    throw new Error('At least one PNG icon size is required to build an ICO file.');
  }

  const headerSize = 6 + entries.length * 16;
  const totalPngBytes = entries.reduce((sum, e) => sum + e.pngBytes.byteLength, 0);
  const buffer = new ArrayBuffer(headerSize + totalPngBytes);
  const view = new DataView(buffer);
  const outBytes = new Uint8Array(buffer);

  // ICONDIR header
  view.setUint16(0, 0, true); // Reserved = 0
  view.setUint16(2, 1, true); // Type = 1 (ICO)
  view.setUint16(4, entries.length, true); // Image count

  let offset = headerSize;
  entries.forEach((entry, i) => {
    const dirOffset = 6 + i * 16;
    const dim = entry.size >= 256 ? 0 : entry.size;
    view.setUint8(dirOffset + 0, dim); // width
    view.setUint8(dirOffset + 1, dim); // height
    view.setUint8(dirOffset + 2, 0); // color palette
    view.setUint8(dirOffset + 3, 0); // reserved
    view.setUint16(dirOffset + 4, 1, true); // color planes
    view.setUint16(dirOffset + 6, 32, true); // bits per pixel
    view.setUint32(dirOffset + 8, entry.pngBytes.byteLength, true); // payload size
    view.setUint32(dirOffset + 12, offset, true); // payload offset

    outBytes.set(entry.pngBytes, offset);
    offset += entry.pngBytes.byteLength;
  });

  return new Blob([buffer], { type: 'image/x-icon' });
}

export async function pixelateImage(
  image: HTMLImageElement,
  options: {
    mode: 'full' | 'region';
    region?: CropRectNormalized;
    pixelSize: number; // 2..100
    mimeType: ExportImageFormat;
    quality: number;
  }
): Promise<AdvancedImageResult> {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const block = Math.max(2, Math.round(options.pixelSize));

  const outCanvas = document.createElement('canvas');
  outCanvas.width = width;
  outCanvas.height = height;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('Browser canvas context is unavailable.');

  if (options.mimeType === 'image/jpeg') {
    outCtx.fillStyle = '#FFFFFF';
    outCtx.fillRect(0, 0, width, height);
  }
  outCtx.drawImage(image, 0, 0, width, height);

  const rx =
    options.mode === 'region' && options.region ? Math.max(0, Math.round(options.region.x * width)) : 0;
  const ry =
    options.mode === 'region' && options.region ? Math.max(0, Math.round(options.region.y * height)) : 0;
  const rw =
    options.mode === 'region' && options.region
      ? Math.max(1, Math.min(width - rx, Math.round(options.region.width * width)))
      : width;
  const rh =
    options.mode === 'region' && options.region
      ? Math.max(1, Math.min(height - ry, Math.round(options.region.height * height)))
      : height;

  const tinyW = Math.max(1, Math.ceil(rw / block));
  const tinyH = Math.max(1, Math.ceil(rh / block));

  const tinyCanvas = document.createElement('canvas');
  tinyCanvas.width = tinyW;
  tinyCanvas.height = tinyH;
  const tinyCtx = tinyCanvas.getContext('2d');
  if (!tinyCtx) throw new Error('Canvas context unavailable.');

  tinyCtx.imageSmoothingEnabled = true;
  tinyCtx.drawImage(image, rx, ry, rw, rh, 0, 0, tinyW, tinyH);

  outCtx.save();
  outCtx.imageSmoothingEnabled = false;
  outCtx.clearRect(rx, ry, rw, rh);
  if (options.mimeType === 'image/jpeg') {
    outCtx.fillStyle = '#FFFFFF';
    outCtx.fillRect(rx, ry, rw, rh);
  }
  outCtx.drawImage(tinyCanvas, 0, 0, tinyW, tinyH, rx, ry, rw, rh);
  outCtx.restore();

  const blob = await new Promise<Blob>((resolve, reject) => {
    outCanvas.toBlob(
      (res) => {
        if (!res) reject(new Error('Failed to export pixelated image.'));
        else resolve(res);
      },
      options.mimeType,
      options.mimeType === 'image/png' ? undefined : Math.min(1, Math.max(0.1, options.quality))
    );
  });

  return {
    blob,
    previewUrl: URL.createObjectURL(blob),
    width,
    height,
    size: blob.size,
    mimeType: options.mimeType,
  };
}

export { getExtensionForMime };
