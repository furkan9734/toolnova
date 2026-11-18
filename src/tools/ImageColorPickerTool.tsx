import React, { useState, useEffect, useRef } from 'react';
import { Copy, Trash2, Pipette } from 'lucide-react';
import { FileDropzone } from '../components/FileDropzone';
import { validateImageFile } from '../utils/fileValidation';
import {
  loadImageFromFile,
  rgbToColorValue,
  type ColorValue,
  type LoadedImageMeta,
} from '../utils/imageLogic';
import { copyToClipboard } from '../utils/download';
import { useToast } from '../hooks/useToast';

export default function ImageColorPickerTool() {
  const { showToast } = useToast();

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceMeta, setSourceMeta] = useState<LoadedImageMeta | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorValue | null>(null);
  const [pickedCoords, setPickedCoords] = useState<{ xPct: number; yPct: number } | null>(null);
  const [history, setHistory] = useState<ColorValue[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => {
      if (sourceMeta?.previewUrl) URL.revokeObjectURL(sourceMeta.previewUrl);
    };
  }, [sourceMeta]);

  useEffect(() => {
    if (!sourceMeta || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = sourceMeta.width;
    canvas.height = sourceMeta.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(sourceMeta.element, 0, 0);

    // Sample center pixel initially so output panel starts populated
    const cx = Math.floor(sourceMeta.width / 2);
    const cy = Math.floor(sourceMeta.height / 2);
    const data = ctx.getImageData(cx, cy, 1, 1).data;
    const initial = rgbToColorValue(data[0], data[1], data[2]);
    setSelectedColor(initial);
    setPickedCoords({ xPct: 50, yPct: 50 });
  }, [sourceMeta]);

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
      setHistory([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to decode image.');
    }
  };

  const sampleAtPointer = (e: React.PointerEvent<HTMLCanvasElement>, addToHistory: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const px = Math.min(canvas.width - 1, Math.floor(normX * canvas.width));
    const py = Math.min(canvas.height - 1, Math.floor(normY * canvas.height));

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const pixel = ctx.getImageData(px, py, 1, 1).data;
    const color = rgbToColorValue(pixel[0], pixel[1], pixel[2]);

    setSelectedColor(color);
    setPickedCoords({ xPct: normX * 100, yPct: normY * 100 });

    if (addToHistory) {
      setHistory((prev) => {
        const filtered = prev.filter((c) => c.hex !== color.hex);
        return [color, ...filtered].slice(0, 10);
      });
    }
  };

  const handleCopy = async (label: string, val: string) => {
    const ok = await copyToClipboard(val);
    if (ok) showToast(`Copied ${label}`, 'success', val);
  };

  const handleReset = () => {
    setSourceFile(null);
    setSourceMeta(null);
    setSelectedColor(null);
    setPickedCoords(null);
    setHistory([]);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {!sourceFile || !sourceMeta ? (
        <FileDropzone
          accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
          label="Drop an image to inspect pixel colors"
          hint="Tap or click anywhere on the image to read exact HEX, RGB, and HSL values locally."
          error={error}
          onFilesSelected={handleFilesSelected}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Interactive Canvas */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <Pipette className="w-3.5 h-3.5 text-[#635BFF]" aria-hidden="true" />
                Click or tap any pixel on the image
              </span>
              <span className="font-mono">
                {sourceMeta.width} × {sourceMeta.height} px
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#10131C] p-3 flex items-center justify-center overflow-hidden">
              <div className="relative inline-block max-w-full">
                <canvas
                  ref={canvasRef}
                  onPointerDown={(e) => sampleAtPointer(e, true)}
                  className="block max-h-[440px] w-auto max-w-full h-auto cursor-crosshair rounded"
                />
                {pickedCoords && (
                  <div
                    aria-hidden="true"
                    style={{
                      left: `${pickedCoords.xPct}%`,
                      top: `${pickedCoords.yPct}%`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-[0_0_0_1.5px_rgba(0,0,0,0.65)] pointer-events-none"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Color Values & Palette History */}
          <div className="lg:col-span-5 space-y-5">
            {selectedColor && (
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-xl border border-slate-300 dark:border-slate-700 shrink-0 shadow-sm"
                    style={{ backgroundColor: selectedColor.hex }}
                  />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Selected Color</p>
                    <p className="font-mono text-2xl font-bold text-[#111827] dark:text-white">
                      {selectedColor.hex}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {(
                    [
                      { label: 'HEX', value: selectedColor.hex },
                      { label: 'RGB', value: selectedColor.rgb },
                      { label: 'HSL', value: selectedColor.hsl },
                    ] as const
                  ).map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-2 p-3 rounded-lg bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800"
                    >
                      <div className="min-w-0">
                        <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">
                          {row.label}
                        </span>
                        <span className="font-mono text-sm font-medium text-[#111827] dark:text-white">
                          {row.value}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(row.label, row.value)}
                        aria-label={`Copy ${row.label} value`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:text-[#635BFF] transition-colors shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {history.length > 0 && (
              <div className="p-4 rounded-xl bg-white dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Picked Palette ({history.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {history.map((item) => (
                    <button
                      key={item.hex}
                      type="button"
                      onClick={() => setSelectedColor(item)}
                      title={item.hex}
                      aria-label={`Select color ${item.hex}`}
                      className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635BFF]"
                      style={{ backgroundColor: item.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Upload Another Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
