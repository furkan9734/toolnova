import React, { useState, useEffect, useRef } from 'react';
import { Download, Pipette, Eraser, Paintbrush, Undo2, Trash2, Info } from 'lucide-react';
import { FileDropzone } from '../components/FileDropzone';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { validateImageFile } from '../utils/fileValidation';
import {
  loadImageFromFile,
  getMimeFromFile,
  getExtensionForMime,
  type ExportImageFormat,
  type LoadedImageMeta,
} from '../utils/imageLogic';
import {
  replaceImageBackground,
  type MaskBrushStroke,
  type AdvancedImageResult,
} from '../utils/imageAdvancedLogic';
import { formatBytes, stripExtension, sanitizeFilename } from '../utils/formatters';
import { downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

type InteractionTool = 'pick' | 'erase' | 'restore';

export default function ImageBackgroundChangerTool() {
  const { showToast } = useToast();

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceMeta, setSourceMeta] = useState<LoadedImageMeta | null>(null);
  const [activeTool, setActiveTool] = useState<InteractionTool>('pick');
  const [matchMode, setMatchMode] = useState<'flood' | 'global'>('flood');
  const [targetRgb, setTargetRgb] = useState<{ r: number; g: number; b: number } | null>(null);
  const [seedPoints, setSeedPoints] = useState<{ x: number; y: number }[]>([]);
  const [tolerance, setTolerance] = useState(28);
  const [feather, setFeather] = useState(4);
  const [brushSizePct, setBrushSizePct] = useState(4);
  const [brushStrokes, setBrushStrokes] = useState<MaskBrushStroke[]>([]);
  const [replacementMode, setReplacementMode] = useState<'transparent' | 'solid'>('solid');
  const [replacementColor, setReplacementColor] = useState('#FFFFFF');
  const [outputFormat, setOutputFormat] = useState<ExportImageFormat>('image/png');
  const [result, setResult] = useState<AdvancedImageResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeStrokeRef = useRef<MaskBrushStroke | null>(null);
  const isDrawingRef = useRef(false);

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
    setIsProcessing(true);

    try {
      const meta = await loadImageFromFile(file);
      const canvas = document.createElement('canvas');
      canvas.width = meta.width;
      canvas.height = meta.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      let cornerRgb: { r: number; g: number; b: number } | null = null;
      if (ctx) {
        ctx.drawImage(meta.element, 0, 0);
        const px = ctx.getImageData(0, 0, 1, 1).data;
        cornerRgb = { r: px[0], g: px[1], b: px[2] };
      }
      sampleCanvasRef.current = canvas;

      setSourceFile(file);
      setSourceMeta(meta);
      setTargetRgb(cornerRgb);
      setSeedPoints([{ x: 0, y: 0 }]);
      setBrushStrokes([]);
      setOutputFormat(getMimeFromFile(file) === 'image/jpeg' ? 'image/png' : getMimeFromFile(file));
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
      replaceImageBackground(sourceMeta.element, {
        targetRgb,
        tolerance,
        feather,
        matchMode,
        seedPoints,
        brushStrokes,
        replacementMode,
        replacementColor,
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
            setError(err instanceof Error ? err.message : 'Background update failed.');
            setIsProcessing(false);
          }
        });
    }, 120);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [
    sourceMeta,
    targetRgb,
    tolerance,
    feather,
    matchMode,
    seedPoints,
    brushStrokes,
    replacementMode,
    replacementColor,
    outputFormat,
  ]);

  const getNormalizedCoords = (e: React.PointerEvent): { x: number; y: number } | null => {
    const el = stageRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return { x, y };
  };

  const sampleColorAt = (norm: { x: number; y: number }) => {
    const canvas = sampleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const px = Math.min(canvas.width - 1, Math.max(0, Math.round(norm.x * (canvas.width - 1))));
    const py = Math.min(canvas.height - 1, Math.max(0, Math.round(norm.y * (canvas.height - 1))));
    const data = ctx.getImageData(px, py, 1, 1).data;
    setTargetRgb({ r: data[0], g: data[1], b: data[2] });
    setSeedPoints((prev) => [...prev.slice(-7), norm]);
  };

  const handleStagePointerDown = (e: React.PointerEvent) => {
    const norm = getNormalizedCoords(e);
    if (!norm) return;

    if (activeTool === 'pick') {
      sampleColorAt(norm);
      return;
    }

    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const newStroke: MaskBrushStroke = {
      mode: activeTool === 'erase' ? 'erase' : 'restore',
      points: [norm],
      radiusNorm: brushSizePct / 100,
    };
    activeStrokeRef.current = newStroke;
    setBrushStrokes((prev) => [...prev, newStroke]);
  };

  const handleStagePointerMove = (e: React.PointerEvent) => {
    if (!isDrawingRef.current || !activeStrokeRef.current) return;
    const norm = getNormalizedCoords(e);
    if (!norm) return;

    const stroke = activeStrokeRef.current;
    const last = stroke.points[stroke.points.length - 1];
    const dist = Math.hypot(norm.x - last.x, norm.y - last.y);
    if (dist < 0.005) return;

    const updated: MaskBrushStroke = {
      ...stroke,
      points: [...stroke.points, norm],
    };
    activeStrokeRef.current = updated;
    setBrushStrokes((prev) => [...prev.slice(0, -1), updated]);
  };

  const handleStagePointerUp = () => {
    isDrawingRef.current = false;
    activeStrokeRef.current = null;
  };

  const handleDownload = () => {
    if (!result || !sourceFile) return;
    const ext = getExtensionForMime(result.mimeType as ExportImageFormat);
    const base = sanitizeFilename(stripExtension(sourceFile.name));
    downloadBlob(result.blob, `${base}-background.${ext}`);
    showToast('Edited image downloaded', 'success', `${result.width} × ${result.height} px`);
  };

  const handleResetAll = () => {
    setSourceFile(null);
    setSourceMeta(null);
    setResult(null);
    setBrushStrokes([]);
    setSeedPoints([]);
    setTargetRgb(null);
    setError(null);
  };

  const targetHex = targetRgb
    ? `#${[targetRgb.r, targetRgb.g, targetRgb.b]
        .map((n) => n.toString(16).padStart(2, '0').toUpperCase())
        .join('')}`
    : 'None';

  return (
    <div className="space-y-6">
      {!sourceFile || !sourceMeta ? (
        <FileDropzone
          accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
          label="Drop an image to replace or mask its background"
          hint="Click a background region to sample its color, tune tolerance, refine with manual Erase/Restore brushes, and export."
          error={error}
          onFilesSelected={handleFilesSelected}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <Info className="w-4 h-4 text-[#635BFF] shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Background replacement uses color-tolerance flood fill, global chroma-keying, and manual erase/restore brush strokes directly in your browser. Click/tap the background on the original image to target additional areas.
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Interactive Canvas + Controls */}
            <div className="lg:col-span-7 space-y-4">
              {/* Tool Selector */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTool('pick')}
                    aria-pressed={activeTool === 'pick'}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      activeTool === 'pick'
                        ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Pipette className="w-3.5 h-3.5" aria-hidden="true" />
                    Sample Color
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTool('erase')}
                    aria-pressed={activeTool === 'erase'}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      activeTool === 'erase'
                        ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Eraser className="w-3.5 h-3.5" aria-hidden="true" />
                    Erase BG
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTool('restore')}
                    aria-pressed={activeTool === 'restore'}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      activeTool === 'restore'
                        ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Paintbrush className="w-3.5 h-3.5" aria-hidden="true" />
                    Restore FG
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={brushStrokes.length === 0}
                    onClick={() => setBrushStrokes((prev) => prev.slice(0, -1))}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 disabled:opacity-40"
                  >
                    <Undo2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Undo Brush
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSeedPoints([]);
                      setTargetRgb(null);
                      setBrushStrokes([]);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:text-rose-600"
                  >
                    Clear Mask
                  </button>
                </div>
              </div>

              {/* Original Stage for Sampling / Brushing */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900/95 p-4 flex flex-col items-center gap-2">
                <div
                  ref={stageRef}
                  onPointerDown={handleStagePointerDown}
                  onPointerMove={handleStagePointerMove}
                  onPointerUp={handleStagePointerUp}
                  onPointerCancel={handleStagePointerUp}
                  className={`relative inline-block select-none touch-none max-w-full ${
                    activeTool === 'pick' ? 'cursor-crosshair' : 'cursor-cell'
                  }`}
                >
                  <img
                    src={sourceMeta.previewUrl}
                    alt="Original image stage for color sampling and masking"
                    draggable={false}
                    className="block max-h-[380px] w-auto max-w-full pointer-events-none"
                  />
                  {seedPoints.map((pt, idx) => (
                    <span
                      key={idx}
                      style={{ left: `${pt.x * 100}%`, top: `${pt.y * 100}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white bg-[#635BFF] shadow pointer-events-none"
                    />
                  ))}
                </div>
                <p className="text-[11px] text-slate-400">
                  {activeTool === 'pick'
                    ? 'Tap/click any background area above to sample its color and flood-mask similar pixels.'
                    : activeTool === 'erase'
                    ? 'Drag across the image above to manually erase remaining background.'
                    : 'Drag across the image above to manually restore protected foreground areas.'}
                </p>
              </div>

              {/* Mask Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
                <div className="space-y-1.5">
                  <span className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                    Masking Scope
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        { id: 'flood', label: 'Connected Flood' },
                        { id: 'global', label: 'Global Color Key' },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMatchMode(m.id)}
                        className={`px-2.5 py-2 rounded-lg text-xs font-medium border ${
                          matchMode === m.id
                            ? 'border-[#635BFF] bg-[#635BFF] text-white'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                    Sampled Target Color
                  </span>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26]">
                    <span
                      className="w-5 h-5 rounded border border-slate-300 dark:border-slate-600 shrink-0"
                      style={{ backgroundColor: targetRgb ? targetHex : 'transparent' }}
                    />
                    <span className="font-mono text-xs text-[#111827] dark:text-white">
                      {targetHex}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <label htmlFor="bg-tol" className="font-medium text-[#111827] dark:text-slate-200">
                      Color Tolerance
                    </label>
                    <span className="font-mono text-slate-500">{tolerance}%</span>
                  </div>
                  <input
                    id="bg-tol"
                    type="range"
                    min={0}
                    max={85}
                    value={tolerance}
                    onChange={(e) => setTolerance(Number(e.target.value))}
                    className="w-full accent-[#635BFF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <label htmlFor="bg-feather" className="font-medium text-[#111827] dark:text-slate-200">
                      {activeTool === 'pick' ? 'Edge Feather' : 'Brush Radius'}
                    </label>
                    <span className="font-mono text-slate-500">
                      {activeTool === 'pick' ? `${feather}%` : `${brushSizePct}%`}
                    </span>
                  </div>
                  {activeTool === 'pick' ? (
                    <input
                      id="bg-feather"
                      type="range"
                      min={0}
                      max={20}
                      value={feather}
                      onChange={(e) => setFeather(Number(e.target.value))}
                      className="w-full accent-[#635BFF]"
                    />
                  ) : (
                    <input
                      id="bg-feather"
                      type="range"
                      min={1}
                      max={14}
                      value={brushSizePct}
                      onChange={(e) => setBrushSizePct(Number(e.target.value))}
                      className="w-full accent-[#635BFF]"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Replacement Output Preview */}
            <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Live Result Preview</span>
                  <span className="font-mono">
                    {result
                      ? `${result.width} × ${result.height} · ${formatBytes(result.size)}`
                      : '...'}
                  </span>
                </div>

                <div
                  className="min-h-[240px] max-h-[320px] rounded-lg border border-slate-200 dark:border-slate-800 p-3 flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundImage:
                      'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)',
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  {isProcessing && !result ? (
                    <LoadingSpinner label="Updating preview..." />
                  ) : result ? (
                    <img
                      src={result.previewUrl}
                      alt="Background replaced preview"
                      className="max-h-[280px] w-auto object-contain"
                    />
                  ) : null}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                    New Background
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReplacementMode('solid')}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border ${
                        replacementMode === 'solid'
                          ? 'border-[#635BFF] bg-[#635BFF] text-white'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      Solid Color
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplacementMode('transparent');
                        if (outputFormat === 'image/jpeg') setOutputFormat('image/png');
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border ${
                        replacementMode === 'transparent'
                          ? 'border-[#635BFF] bg-[#635BFF] text-white'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      Transparent
                    </button>
                  </div>

                  {replacementMode === 'solid' && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <input
                        type="color"
                        aria-label="Replacement background color"
                        value={replacementColor}
                        onChange={(e) => setReplacementColor(e.target.value)}
                        className="w-10 h-9 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] cursor-pointer"
                      />
                      {['#FFFFFF', '#111827', '#635BFF', '#22C55E', '#F1F5F9', '#FEF3C7'].map(
                        (swatch) => (
                          <button
                            key={swatch}
                            type="button"
                            aria-label={`Use color ${swatch}`}
                            onClick={() => setReplacementColor(swatch)}
                            style={{ backgroundColor: swatch }}
                            className={`w-7 h-7 rounded-md border ${
                              replacementColor.toUpperCase() === swatch
                                ? 'border-[#635BFF] ring-2 ring-[#635BFF]/40'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          />
                        )
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="bg-export-fmt" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                    Export Format
                  </label>
                  <select
                    id="bg-export-fmt"
                    value={replacementMode === 'transparent' && outputFormat === 'image/jpeg' ? 'image/png' : outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value as ExportImageFormat)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white"
                  >
                    <option value="image/png">PNG (Supports Transparency)</option>
                    <option value="image/webp">WebP</option>
                    {replacementMode === 'solid' && <option value="image/jpeg">JPG</option>}
                  </select>
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    disabled={!result}
                    onClick={handleDownload}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-50 transition-colors"
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                    Download Image
                  </button>
                  <button
                    type="button"
                    onClick={handleResetAll}
                    aria-label="Reset background changer"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    New
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
