import { useState, useEffect } from 'react';
import { Download, Trash2, ArrowDownRight } from 'lucide-react';
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

export default function ImageCompressorTool() {
  const { showToast } = useToast();

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceMeta, setSourceMeta] = useState<LoadedImageMeta | null>(null);
  const [outputFormat, setOutputFormat] = useState<ExportImageFormat>('image/jpeg');
  const [quality, setQuality] = useState<number>(78);
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
    const check = validateImageFile(file, ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
    if (!check.valid) {
      setError(check.error || 'Invalid image file.');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const meta = await loadImageFromFile(file);
      const detectedMime = getMimeFromFile(file);
      // PNG canvas export is lossless; default PNGs to WebP or keep PNG if user wants
      const defaultFormat: ExportImageFormat = detectedMime === 'image/png' ? 'image/webp' : detectedMime;
      setSourceFile(file);
      setSourceMeta(meta);
      setOutputFormat(defaultFormat);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load image.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!sourceMeta) return;
    let active = true;
    setIsProcessing(true);

    renderProcessedImage(
      sourceMeta.element,
      sourceMeta.width,
      sourceMeta.height,
      outputFormat,
      quality / 100
    )
      .then((processed) => {
        if (active) {
          setResult(processed);
          setIsProcessing(false);
        } else {
          URL.revokeObjectURL(processed.previewUrl);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Compression failed.');
          setIsProcessing(false);
        }
      });

    return () => {
      active = false;
    };
  }, [sourceMeta, outputFormat, quality]);

  const handleClear = () => {
    setSourceFile(null);
    setSourceMeta(null);
    setResult(null);
    setError(null);
  };

  const handleDownload = () => {
    if (!result || !sourceFile) return;
    const ext = getExtensionForMime(result.mimeType);
    const baseName = sanitizeFilename(stripExtension(sourceFile.name));
    downloadBlob(result.blob, `${baseName}-compressed.${ext}`);
    showToast('Compressed image downloaded', 'success', `${formatBytes(result.size)} saved.`);
  };

  const savingsPercent =
    sourceFile && result
      ? Math.round(((sourceFile.size - result.size) / sourceFile.size) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {!sourceFile || !sourceMeta ? (
        <FileDropzone
          accept="image/jpeg,image/png,image/webp"
          label="Drop an image to compress"
          hint="Supports JPG, PNG, and WebP up to 25 MB. Processing runs locally in your browser."
          error={error}
          onFilesSelected={handleFilesSelected}
        />
      ) : (
        <div className="space-y-6">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 items-end">
            <div className="md:col-span-5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <label htmlFor="compress-quality" className="font-medium text-[#111827] dark:text-slate-200">
                  Compression Quality
                </label>
                <span className="font-mono text-xs font-semibold text-[#635BFF] dark:text-[#8B5CF6]">
                  {outputFormat === 'image/png' ? 'Lossless PNG' : `${quality}%`}
                </span>
              </div>
              <input
                id="compress-quality"
                type="range"
                min={10}
                max={100}
                value={quality}
                disabled={outputFormat === 'image/png'}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-[#635BFF] disabled:opacity-40 cursor-pointer"
              />
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <label htmlFor="compress-format" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Output Format
              </label>
              <select
                id="compress-format"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as ExportImageFormat)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
              >
                <option value="image/jpeg">JPG (Smallest photos)</option>
                <option value="image/webp">WebP (Modern & crisp)</option>
                <option value="image/png">PNG (Lossless)</option>
              </select>
            </div>

            <div className="md:col-span-4 flex flex-wrap sm:flex-nowrap gap-2.5">
              <button
                type="button"
                disabled={!result || isProcessing}
                onClick={handleDownload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                Download
              </button>
              <button
                type="button"
                onClick={handleClear}
                aria-label="Remove image and upload another"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                Reset
              </button>
            </div>
          </div>

          {outputFormat === 'image/png' && (
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Note: PNG uses lossless encoding, so the quality slider does not apply. Choose WebP or JPG for significant size reduction.
            </p>
          )}

          {/* Metrics strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C]">
              <p className="text-xs text-slate-500 dark:text-slate-400">Original Size</p>
              <p className="mt-1 font-mono text-lg font-semibold text-[#111827] dark:text-white">
                {formatBytes(sourceFile.size)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {sourceMeta.width} × {sourceMeta.height} px
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C]">
              <p className="text-xs text-slate-500 dark:text-slate-400">Compressed Size</p>
              <p className="mt-1 font-mono text-lg font-semibold text-[#111827] dark:text-white">
                {isProcessing ? 'Calculating...' : result ? formatBytes(result.size) : '—'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {getExtensionForMime(outputFormat).toUpperCase()}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C]">
              <p className="text-xs text-slate-500 dark:text-slate-400">Net Change</p>
              <p
                className={`mt-1 font-mono text-lg font-semibold inline-flex items-center gap-1 ${
                  savingsPercent > 0
                    ? 'text-[#22C55E]'
                    : savingsPercent < 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-[#111827] dark:text-white'
                }`}
              >
                {savingsPercent > 0 && <ArrowDownRight className="w-4 h-4" aria-hidden="true" />}
                {result
                  ? savingsPercent > 0
                    ? `${savingsPercent}% smaller`
                    : savingsPercent < 0
                    ? `${Math.abs(savingsPercent)}% larger`
                    : 'Same size'
                  : '—'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {sourceFile.name}
              </p>
            </div>
          </div>

          {/* Before / After Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Before ({formatBytes(sourceFile.size)})
              </p>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-[#10131C] p-3 flex items-center justify-center min-h-[240px] max-h-[360px] overflow-hidden">
                <img
                  src={sourceMeta.previewUrl}
                  alt="Original uploaded image"
                  className="max-h-[320px] w-auto object-contain rounded"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                After ({result ? formatBytes(result.size) : '...'})
              </p>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-[#10131C] p-3 flex items-center justify-center min-h-[240px] max-h-[360px] overflow-hidden">
                {isProcessing ? (
                  <LoadingSpinner label="Compressing image..." />
                ) : result ? (
                  <img
                    src={result.previewUrl}
                    alt="Compressed output preview"
                    className="max-h-[320px] w-auto object-contain rounded"
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
