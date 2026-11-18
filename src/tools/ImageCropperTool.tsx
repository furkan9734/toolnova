import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, RotateCcw, RotateCw, Trash2 } from 'lucide-react';
import { FileDropzone } from '../components/FileDropzone';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { validateImageFile } from '../utils/fileValidation';
import {
  loadImageFromFile,
  renderRotatedCanvas,
  cropAndRotateImage,
  getExtensionForMime,
  getMimeFromFile,
  type CropRectNormalized,
  type ExportImageFormat,
  type LoadedImageMeta,
  type ProcessedImageResult,
} from '../utils/imageLogic';
import { formatBytes, stripExtension, sanitizeFilename } from '../utils/formatters';
import { downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

type AspectPreset = 'free' | '1:1' | '4:3' | '16:9' | '3:2';

const ASPECT_VALUES: Record<AspectPreset, number | null> = {
  free: null,
  '1:1': 1,
  '4:3': 4 / 3,
  '16:9': 16 / 9,
  '3:2': 3 / 2,
};

type DragKind = 'move' | 'nw' | 'ne' | 'sw' | 'se' | null;

export default function ImageCropperTool() {
  const { showToast } = useToast();

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceMeta, setSourceMeta] = useState<LoadedImageMeta | null>(null);
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [rotatedPreviewUrl, setRotatedPreviewUrl] = useState<string>('');
  const [rotatedDims, setRotatedDims] = useState<{ width: number; height: number }>({
    width: 1,
    height: 1,
  });

  const [aspectPreset, setAspectPreset] = useState<AspectPreset>('free');
  const [crop, setCrop] = useState<CropRectNormalized>({
    x: 0.1,
    y: 0.1,
    width: 0.8,
    height: 0.8,
  });
  const [outputFormat, setOutputFormat] = useState<ExportImageFormat>('image/png');
  const [result, setResult] = useState<ProcessedImageResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    kind: DragKind;
    startX: number;
    startY: number;
    startCrop: CropRectNormalized;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (sourceMeta?.previewUrl) URL.revokeObjectURL(sourceMeta.previewUrl);
    };
  }, [sourceMeta]);

  useEffect(() => {
    return () => {
      if (result?.previewUrl) URL.revokeObjectURL(result.previewUrl);
    };
  }, [result]);

  useEffect(() => {
    if (!sourceMeta) return;
    let active = true;

    renderRotatedCanvas(sourceMeta.element, rotation).then((canvas) => {
      if (!active) return;
      setRotatedDims({ width: canvas.width, height: canvas.height });
      setRotatedPreviewUrl(canvas.toDataURL('image/png'));
    });

    return () => {
      active = false;
    };
  }, [sourceMeta, rotation]);

  const applyAspectPreset = useCallback(
    (preset: AspectPreset, dims = rotatedDims) => {
      setAspectPreset(preset);
      const ratio = ASPECT_VALUES[preset];
      if (!ratio || dims.width <= 0 || dims.height <= 0) return;

      // Target width/height ratio in pixels -> normalized ratio
      const targetNormRatio = (ratio * dims.height) / dims.width;
      let w = 0.8;
      let h = w / targetNormRatio;
      if (h > 0.85) {
        h = 0.85;
        w = h * targetNormRatio;
      }
      if (w > 0.9) {
        w = 0.9;
        h = w / targetNormRatio;
      }
      setCrop({
        x: Math.max(0, (1 - w) / 2),
        y: Math.max(0, (1 - h) / 2),
        width: w,
        height: h,
      });
    },
    [rotatedDims]
  );

  const handleFilesSelected = async (files: File[]) => {
    const file = files[0];
    const check = validateImageFile(file);
    if (!check.valid) {
      setError(check.error || 'Invalid image file.');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const meta = await loadImageFromFile(file);
      setSourceFile(file);
      setSourceMeta(meta);
      setRotation(0);
      setAspectPreset('free');
      setCrop({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
      setOutputFormat(getMimeFromFile(file));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load image.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!sourceMeta) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setIsProcessing(true);
      cropAndRotateImage(sourceMeta.element, crop, rotation, outputFormat, 0.92)
        .then((res) => {
          if (active) {
            setResult(res);
            setIsProcessing(false);
          } else {
            URL.revokeObjectURL(res.previewUrl);
          }
        })
        .catch((err: unknown) => {
          if (active) {
            setError(err instanceof Error ? err.message : 'Crop failed.');
            setIsProcessing(false);
          }
        });
    }, 150);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [sourceMeta, crop, rotation, outputFormat]);

  const startDrag = (kind: DragKind, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStateRef.current = {
      kind,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...crop },
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const state = dragStateRef.current;
    const stage = stageRef.current;
    if (!state || !stage) return;

    const rect = stage.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dx = (e.clientX - state.startX) / rect.width;
    const dy = (e.clientY - state.startY) / rect.height;
    const minSize = 0.06;
    const s = state.startCrop;
    const ratio = ASPECT_VALUES[aspectPreset];
    const normRatio = ratio ? (ratio * rotatedDims.height) / rotatedDims.width : null;

    if (state.kind === 'move') {
      const nextX = Math.max(0, Math.min(1 - s.width, s.x + dx));
      const nextY = Math.max(0, Math.min(1 - s.height, s.y + dy));
      setCrop({ ...s, x: nextX, y: nextY });
      return;
    }

    let nextX = s.x;
    let nextY = s.y;
    let nextW = s.width;
    let nextH = s.height;

    if (state.kind === 'se') {
      nextW = Math.max(minSize, Math.min(1 - s.x, s.width + dx));
      nextH = normRatio
        ? nextW / normRatio
        : Math.max(minSize, Math.min(1 - s.y, s.height + dy));
      if (s.y + nextH > 1) {
        nextH = 1 - s.y;
        if (normRatio) nextW = nextH * normRatio;
      }
    } else if (state.kind === 'sw') {
      const rightEdge = s.x + s.width;
      nextX = Math.max(0, Math.min(rightEdge - minSize, s.x + dx));
      nextW = rightEdge - nextX;
      nextH = normRatio
        ? nextW / normRatio
        : Math.max(minSize, Math.min(1 - s.y, s.height + dy));
      if (s.y + nextH > 1) {
        nextH = 1 - s.y;
        if (normRatio) {
          nextW = nextH * normRatio;
          nextX = rightEdge - nextW;
        }
      }
    } else if (state.kind === 'ne') {
      const bottomEdge = s.y + s.height;
      nextW = Math.max(minSize, Math.min(1 - s.x, s.width + dx));
      if (normRatio) {
        nextH = nextW / normRatio;
        nextY = bottomEdge - nextH;
        if (nextY < 0) {
          nextY = 0;
          nextH = bottomEdge;
          nextW = nextH * normRatio;
        }
      } else {
        nextY = Math.max(0, Math.min(bottomEdge - minSize, s.y + dy));
        nextH = bottomEdge - nextY;
      }
    } else if (state.kind === 'nw') {
      const rightEdge = s.x + s.width;
      const bottomEdge = s.y + s.height;
      nextX = Math.max(0, Math.min(rightEdge - minSize, s.x + dx));
      nextW = rightEdge - nextX;
      if (normRatio) {
        nextH = nextW / normRatio;
        nextY = bottomEdge - nextH;
        if (nextY < 0) {
          nextY = 0;
          nextH = bottomEdge;
          nextW = nextH * normRatio;
          nextX = rightEdge - nextW;
        }
      } else {
        nextY = Math.max(0, Math.min(bottomEdge - minSize, s.y + dy));
        nextH = bottomEdge - nextY;
      }
    }

    setCrop({
      x: Math.max(0, nextX),
      y: Math.max(0, nextY),
      width: Math.max(minSize, Math.min(1, nextW)),
      height: Math.max(minSize, Math.min(1, nextH)),
    });
  };

  const endDrag = () => {
    dragStateRef.current = null;
  };

  const rotateBy = (delta: 90 | -90) => {
    const next = (((rotation + delta) % 360) + 360) % 360 as 0 | 90 | 180 | 270;
    setRotation(next);
    setCrop({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
    setAspectPreset('free');
  };

  const handleDownload = () => {
    if (!result || !sourceFile) return;
    const ext = getExtensionForMime(result.mimeType);
    const baseName = sanitizeFilename(stripExtension(sourceFile.name));
    downloadBlob(result.blob, `${baseName}-cropped.${ext}`);
    showToast('Cropped image downloaded', 'success', `${result.width} × ${result.height} px`);
  };

  const handleReset = () => {
    setSourceFile(null);
    setSourceMeta(null);
    setResult(null);
    setRotatedPreviewUrl('');
    setError(null);
  };

  const cropPxX = Math.round(crop.x * rotatedDims.width);
  const cropPxY = Math.round(crop.y * rotatedDims.height);
  const cropPxW = Math.max(1, Math.round(crop.width * rotatedDims.width));
  const cropPxH = Math.max(1, Math.round(crop.height * rotatedDims.height));

  return (
    <div className="space-y-6">
      {!sourceFile || !sourceMeta ? (
        <FileDropzone
          accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
          label="Drop an image to crop and rotate"
          hint="Supports JPG, PNG, WebP, GIF, and BMP up to 25 MB. Drag the crop handles to select any region."
          error={error}
          onFilesSelected={handleFilesSelected}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Interactive Crop Canvas */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {(['free', '1:1', '4:3', '16:9', '3:2'] as const).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => applyAspectPreset(preset)}
                    aria-pressed={aspectPreset === preset}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      aspectPreset === preset
                        ? 'border-[#635BFF] bg-[#635BFF] text-white'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:border-[#635BFF]/60'
                    }`}
                  >
                    {preset === 'free' ? 'Free' : preset}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => rotateBy(-90)}
                  aria-label="Rotate left 90 degrees"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  -90°
                </button>
                <button
                  type="button"
                  onClick={() => rotateBy(90)}
                  aria-label="Rotate right 90 degrees"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                  +90°
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900/95 p-4 flex items-center justify-center overflow-hidden">
              {rotatedPreviewUrl && (
                <div
                  ref={stageRef}
                  onPointerMove={handlePointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  className="relative inline-block select-none touch-none max-w-full"
                >
                  <img
                    src={rotatedPreviewUrl}
                    alt="Interactive crop canvas"
                    draggable={false}
                    className="block max-h-[420px] w-auto max-w-full pointer-events-none"
                  />

                  {/* Dimmed overlay outside crop box */}
                  <div
                    className="absolute inset-0 bg-black/45 pointer-events-none"
                    style={{
                      clipPath: `polygon(
                        0% 0%, 0% 100%,
                        ${crop.x * 100}% 100%,
                        ${crop.x * 100}% ${crop.y * 100}%,
                        ${(crop.x + crop.width) * 100}% ${crop.y * 100}%,
                        ${(crop.x + crop.width) * 100}% ${(crop.y + crop.height) * 100}%,
                        ${crop.x * 100}% ${(crop.y + crop.height) * 100}%,
                        ${crop.x * 100}% 100%,
                        100% 100%, 100% 0%
                      )`,
                    }}
                  />

                  {/* Crop Frame */}
                  <div
                    onPointerDown={(e) => startDrag('move', e)}
                    style={{
                      left: `${crop.x * 100}%`,
                      top: `${crop.y * 100}%`,
                      width: `${crop.width * 100}%`,
                      height: `${crop.height * 100}%`,
                    }}
                    className="absolute border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)] cursor-move touch-none"
                  >
                    {/* Rule of thirds guide lines */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                      <div className="border-r border-b border-white/25" />
                      <div className="border-r border-b border-white/25" />
                      <div className="border-b border-white/25" />
                      <div className="border-r border-b border-white/25" />
                      <div className="border-r border-b border-white/25" />
                      <div className="border-b border-white/25" />
                      <div className="border-r border-white/25" />
                      <div className="border-r border-white/25" />
                      <div />
                    </div>

                    {/* 4 Corner Handles (44px hit targets via padding for touch) */}
                    {(
                      [
                        { kind: 'nw', pos: '-top-3 -left-3 cursor-nwse-resize' },
                        { kind: 'ne', pos: '-top-3 -right-3 cursor-nesw-resize' },
                        { kind: 'sw', pos: '-bottom-3 -left-3 cursor-nesw-resize' },
                        { kind: 'se', pos: '-bottom-3 -right-3 cursor-nwse-resize' },
                      ] as const
                    ).map((h) => (
                      <button
                        key={h.kind}
                        type="button"
                        aria-label={`Resize crop ${h.kind}`}
                        onPointerDown={(e) => startDrag(h.kind, e)}
                        className={`absolute ${h.pos} w-6 h-6 flex items-center justify-center touch-none focus:outline-none`}
                      >
                        <span className="w-3.5 h-3.5 rounded-sm bg-[#635BFF] border-2 border-white shadow" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">X</span>
                <p className="font-mono font-semibold text-[#111827] dark:text-white">{cropPxX}px</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Y</span>
                <p className="font-mono font-semibold text-[#111827] dark:text-white">{cropPxY}px</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Width</span>
                <p className="font-mono font-semibold text-[#111827] dark:text-white">{cropPxW}px</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Height</span>
                <p className="font-mono font-semibold text-[#111827] dark:text-white">{cropPxH}px</p>
              </div>
            </div>
          </div>

          {/* Cropped Output Preview & Export */}
          <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Cropped Output</span>
                <span className="font-mono">
                  {result ? `${result.width} × ${result.height} px · ${formatBytes(result.size)}` : '...'}
                </span>
              </div>

              <div className="min-h-[220px] max-h-[300px] rounded-lg bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 p-3 flex items-center justify-center overflow-hidden">
                {isProcessing ? (
                  <LoadingSpinner label="Rendering crop..." />
                ) : result ? (
                  <img
                    src={result.previewUrl}
                    alt="Cropped image preview"
                    className="max-h-[260px] w-auto object-contain"
                  />
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="crop-format" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                  Export Format
                </label>
                <select
                  id="crop-format"
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as ExportImageFormat)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                >
                  <option value="image/png">PNG (Lossless)</option>
                  <option value="image/jpeg">JPG</option>
                  <option value="image/webp">WebP</option>
                </select>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  disabled={!result || isProcessing}
                  onClick={handleDownload}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-50 transition-colors"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Download Crop
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  aria-label="Reset image cropper"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
