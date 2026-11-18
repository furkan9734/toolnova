import React, { useState, useEffect, useRef } from 'react';
import { Download, Trash2, Grid, SquareDashedMousePointer } from 'lucide-react';
import { FileDropzone } from '../components/FileDropzone';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { validateImageFile } from '../utils/fileValidation';
import {
  loadImageFromFile,
  getMimeFromFile,
  getExtensionForMime,
  type CropRectNormalized,
  type ExportImageFormat,
  type LoadedImageMeta,
} from '../utils/imageLogic';
import { pixelateImage, type AdvancedImageResult } from '../utils/imageAdvancedLogic';
import { formatBytes, stripExtension, sanitizeFilename } from '../utils/formatters';
import { downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

type DragKind = 'move' | 'nw' | 'ne' | 'sw' | 'se' | null;

export default function ImagePixelatorTool() {
  const { showToast } = useToast();

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceMeta, setSourceMeta] = useState<LoadedImageMeta | null>(null);
  const [mode, setMode] = useState<'full' | 'region'>('region');
  const [region, setRegion] = useState<CropRectNormalized>({
    x: 0.2,
    y: 0.2,
    width: 0.6,
    height: 0.45,
  });
  const [pixelSize, setPixelSize] = useState(16);
  const [outputFormat, setOutputFormat] = useState<ExportImageFormat>('image/png');
  const [result, setResult] = useState<AdvancedImageResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    kind: DragKind;
    startX: number;
    startY: number;
    startRect: CropRectNormalized;
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

  const handleFilesSelected = async (files: File[]) => {
    const file = files[0];
    const check = validateImageFile(file);
    if (!check.valid) {
      setError(check.error || 'Invalid image file.');
      return;
    }
    setError(null);
    try {
      const meta = await loadImageFromFile(file);
      setSourceFile(file);
      setSourceMeta(meta);
      setOutputFormat(getMimeFromFile(file));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to decode image.');
    }
  };

  useEffect(() => {
    if (!sourceMeta) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setIsProcessing(true);
      pixelateImage(sourceMeta.element, {
        mode,
        region,
        pixelSize,
        mimeType: outputFormat,
        quality: 0.92,
      })
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
            setError(err instanceof Error ? err.message : 'Pixelation failed.');
            setIsProcessing(false);
          }
        });
    }, 100);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [sourceMeta, mode, region, pixelSize, outputFormat]);

  const startDrag = (kind: DragKind, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      kind,
      startX: e.clientX,
      startY: e.clientY,
      startRect: { ...region },
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const st = dragRef.current;
    const stage = stageRef.current;
    if (!st || !stage) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dx = (e.clientX - st.startX) / rect.width;
    const dy = (e.clientY - st.startY) / rect.height;
    const minSz = 0.05;
    const s = st.startRect;

    if (st.kind === 'move') {
      setRegion({
        ...s,
        x: Math.max(0, Math.min(1 - s.width, s.x + dx)),
        y: Math.max(0, Math.min(1 - s.height, s.y + dy)),
      });
      return;
    }

    let x = s.x;
    let y = s.y;
    let w = s.width;
    let h = s.height;

    if (st.kind === 'se') {
      w = Math.max(minSz, Math.min(1 - s.x, s.width + dx));
      h = Math.max(minSz, Math.min(1 - s.y, s.height + dy));
    } else if (st.kind === 'sw') {
      const right = s.x + s.width;
      x = Math.max(0, Math.min(right - minSz, s.x + dx));
      w = right - x;
      h = Math.max(minSz, Math.min(1 - s.y, s.height + dy));
    } else if (st.kind === 'ne') {
      const bottom = s.y + s.height;
      w = Math.max(minSz, Math.min(1 - s.x, s.width + dx));
      y = Math.max(0, Math.min(bottom - minSz, s.y + dy));
      h = bottom - y;
    } else if (st.kind === 'nw') {
      const right = s.x + s.width;
      const bottom = s.y + s.height;
      x = Math.max(0, Math.min(right - minSz, s.x + dx));
      w = right - x;
      y = Math.max(0, Math.min(bottom - minSz, s.y + dy));
      h = bottom - y;
    }

    setRegion({ x, y, width: w, height: h });
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const handleDownload = () => {
    if (!result || !sourceFile) return;
    const ext = getExtensionForMime(result.mimeType as ExportImageFormat);
    const base = sanitizeFilename(stripExtension(sourceFile.name));
    downloadBlob(result.blob, `${base}-pixelated.${ext}`);
    showToast('Pixelated image downloaded', 'success', `${result.width} × ${result.height} px`);
  };

  const handleReset = () => {
    setSourceFile(null);
    setSourceMeta(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {!sourceFile || !sourceMeta ? (
        <FileDropzone
          accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
          label="Drop an image to pixelate or censor a region"
          hint="Pixelate the entire image or drag a selection box to blur faces, plates, or sensitive text privately."
          error={error}
          onFilesSelected={handleFilesSelected}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Interactive Region Selector & Controls */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 gap-1">
                <button
                  type="button"
                  onClick={() => setMode('region')}
                  aria-pressed={mode === 'region'}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    mode === 'region'
                      ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <SquareDashedMousePointer className="w-3.5 h-3.5" aria-hidden="true" />
                  Selected Region
                </button>
                <button
                  type="button"
                  onClick={() => setMode('full')}
                  aria-pressed={mode === 'full'}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    mode === 'full'
                      ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" aria-hidden="true" />
                  Full Image
                </button>
              </div>

              <div className="flex items-center gap-3 flex-1 max-w-xs">
                <label htmlFor="px-size" className="text-xs font-medium text-[#111827] dark:text-slate-200 whitespace-nowrap">
                  Block: <span className="font-mono">{pixelSize}px</span>
                </label>
                <input
                  id="px-size"
                  type="range"
                  min={4}
                  max={64}
                  value={pixelSize}
                  onChange={(e) => setPixelSize(Number(e.target.value))}
                  className="w-full accent-[#635BFF]"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900/95 p-4 flex items-center justify-center overflow-hidden">
              <div
                ref={stageRef}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className="relative inline-block select-none touch-none max-w-full"
              >
                <img
                  src={result?.previewUrl || sourceMeta.previewUrl}
                  alt="Interactive pixelator preview"
                  draggable={false}
                  className="block max-h-[420px] w-auto max-w-full pointer-events-none"
                />

                {mode === 'region' && (
                  <div
                    onPointerDown={(e) => startDrag('move', e)}
                    style={{
                      left: `${region.x * 100}%`,
                      top: `${region.y * 100}%`,
                      width: `${region.width * 100}%`,
                      height: `${region.height * 100}%`,
                    }}
                    className="absolute border-2 border-[#635BFF] bg-[#635BFF]/10 shadow-[0_0_0_1px_rgba(255,255,255,0.6)] cursor-move touch-none"
                  >
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
                        aria-label={`Resize pixelation region ${h.kind}`}
                        onPointerDown={(e) => startDrag(h.kind, e)}
                        className={`absolute ${h.pos} w-6 h-6 flex items-center justify-center touch-none`}
                      >
                        <span className="w-3.5 h-3.5 rounded-sm bg-[#635BFF] border-2 border-white shadow" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Export Sidebar */}
          <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Export Preview</span>
                <span className="font-mono">
                  {result
                    ? `${result.width} × ${result.height} · ${formatBytes(result.size)}`
                    : '...'}
                </span>
              </div>

              <div className="min-h-[240px] max-h-[300px] rounded-lg bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 p-3 flex items-center justify-center overflow-hidden">
                {isProcessing && !result ? (
                  <LoadingSpinner label="Applying pixelation..." />
                ) : result ? (
                  <img
                    src={result.previewUrl}
                    alt="Final pixelated output"
                    className="max-h-[260px] w-auto object-contain"
                  />
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="px-fmt" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                  Export Format
                </label>
                <select
                  id="px-fmt"
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as ExportImageFormat)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white"
                >
                  <option value="image/png">PNG (Sharp pixel edges)</option>
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
                  Download Image
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 hover:text-rose-600"
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
