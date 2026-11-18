import { useState, useEffect } from 'react';
import { Download, Lock, Unlock, Trash2 } from 'lucide-react';
import { FileDropzone } from '../components/FileDropzone';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { validateImageFile } from '../utils/fileValidation';
import {
  loadImageFromFile,
  renderProcessedImage,
  getExtensionForMime,
  getMimeFromFile,
  type ExportImageFormat,
  type LoadedImageMeta,
  type ProcessedImageResult,
} from '../utils/imageLogic';
import { formatBytes, stripExtension, sanitizeFilename } from '../utils/formatters';
import { downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

export default function ImageResizerTool() {
  const { showToast } = useToast();

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceMeta, setSourceMeta] = useState<LoadedImageMeta | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [outputFormat, setOutputFormat] = useState<ExportImageFormat>('image/png');
  const [result, setResult] = useState<ProcessedImageResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setSourceFile(file);
      setSourceMeta(meta);
      setWidth(meta.width);
      setHeight(meta.height);
      setOutputFormat(getMimeFromFile(file));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to read image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWidthChange = (nextWidth: number) => {
    const clamped = Math.max(1, Math.min(8000, nextWidth || 1));
    setWidth(clamped);
    if (lockAspect && sourceMeta && sourceMeta.width > 0) {
      const ratio = sourceMeta.height / sourceMeta.width;
      setHeight(Math.max(1, Math.round(clamped * ratio)));
    }
  };

  const handleHeightChange = (nextHeight: number) => {
    const clamped = Math.max(1, Math.min(8000, nextHeight || 1));
    setHeight(clamped);
    if (lockAspect && sourceMeta && sourceMeta.height > 0) {
      const ratio = sourceMeta.width / sourceMeta.height;
      setWidth(Math.max(1, Math.round(clamped * ratio)));
    }
  };

  const applyScalePercent = (factor: number) => {
    if (!sourceMeta) return;
    setWidth(Math.max(1, Math.round(sourceMeta.width * factor)));
    setHeight(Math.max(1, Math.round(sourceMeta.height * factor)));
  };

  const handleGeneratePreview = async () => {
    if (!sourceMeta) return;
    setIsProcessing(true);
    setError(null);
    try {
      const processed = await renderProcessedImage(
        sourceMeta.element,
        width,
        height,
        outputFormat,
        0.92
      );
      setResult(processed);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Resize failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!sourceMeta || width <= 0 || height <= 0) return;
    const timer = window.setTimeout(() => {
      handleGeneratePreview();
    }, 180);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceMeta, width, height, outputFormat]);

  const handleDownload = () => {
    if (!result || !sourceFile) return;
    const ext = getExtensionForMime(result.mimeType);
    const baseName = sanitizeFilename(stripExtension(sourceFile.name));
    downloadBlob(result.blob, `${baseName}-${result.width}x${result.height}.${ext}`);
    showToast('Resized image downloaded', 'success', `${result.width} × ${result.height} px`);
  };

  const handleClear = () => {
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
          label="Drop an image to resize"
          hint="Supports JPG, PNG, WebP, GIF, and BMP up to 25 MB."
          error={error}
          onFilesSelected={handleFilesSelected}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">Original Dimensions</p>
              <p className="font-mono text-sm font-semibold text-[#111827] dark:text-white">
                {sourceMeta.width} × {sourceMeta.height} px · {formatBytes(sourceFile.size)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="resize-width" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                  Width (px)
                </label>
                <input
                  id="resize-width"
                  type="number"
                  min={1}
                  max={8000}
                  value={width}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] font-mono text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="resize-height" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                  Height (px)
                </label>
                <input
                  id="resize-height"
                  type="number"
                  min={1}
                  max={8000}
                  value={height}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] font-mono text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLockAspect((prev) => !prev)}
              aria-pressed={lockAspect}
              className={`w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium border transition-colors ${
                lockAspect
                  ? 'border-[#635BFF]/40 bg-[#635BFF]/10 text-[#635BFF] dark:text-[#8B5CF6]'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-600 dark:text-slate-300'
              }`}
            >
              {lockAspect ? (
                <>
                  <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  Aspect Ratio Locked
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" aria-hidden="true" />
                  Aspect Ratio Unlocked
                </>
              )}
            </button>

            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                Quick Scale Presets
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '25%', factor: 0.25 },
                  { label: '50%', factor: 0.5 },
                  { label: '75%', factor: 0.75 },
                  { label: '100%', factor: 1 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyScalePercent(preset.factor)}
                    className="py-2 rounded-lg text-xs font-mono font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:border-[#635BFF] transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="resize-format" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Export Format
              </label>
              <select
                id="resize-format"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as ExportImageFormat)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
              >
                <option value="image/png">PNG</option>
                <option value="image/jpeg">JPG</option>
                <option value="image/webp">WebP</option>
              </select>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={!result || isProcessing}
                onClick={handleDownload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-50 transition-colors"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                Download Resized
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                Reset
              </button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-7 flex flex-col justify-between p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400">
              <span>Resized Preview</span>
              <span className="font-mono">
                {result ? `${result.width} × ${result.height} px · ${formatBytes(result.size)}` : `${width} × ${height} px`}
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center min-h-[280px] max-h-[420px] overflow-hidden rounded-lg bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 p-4">
              {isProcessing ? (
                <LoadingSpinner label="Resizing image..." />
              ) : result ? (
                <img
                  src={result.previewUrl}
                  alt="Resized image preview"
                  className="max-h-[380px] w-auto object-contain"
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
