import { useState, useEffect } from 'react';
import { Download, Trash2, ArrowRight } from 'lucide-react';
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

export default function ImageConverterTool() {
  const { showToast } = useToast();

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceMeta, setSourceMeta] = useState<LoadedImageMeta | null>(null);
  const [targetFormat, setTargetFormat] = useState<ExportImageFormat>('image/webp');
  const [quality, setQuality] = useState<number>(90);
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
      const currentMime = getMimeFromFile(file);
      const nextTarget: ExportImageFormat =
        currentMime === 'image/png' ? 'image/webp' : currentMime === 'image/jpeg' ? 'image/png' : 'image/jpeg';
      setSourceFile(file);
      setSourceMeta(meta);
      setTargetFormat(nextTarget);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to decode image.');
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
      targetFormat,
      quality / 100
    )
      .then((converted) => {
        if (active) {
          setResult(converted);
          setIsProcessing(false);
        } else {
          URL.revokeObjectURL(converted.previewUrl);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Conversion failed.');
          setIsProcessing(false);
        }
      });

    return () => {
      active = false;
    };
  }, [sourceMeta, targetFormat, quality]);

  const handleDownload = () => {
    if (!result || !sourceFile) return;
    const ext = getExtensionForMime(result.mimeType);
    const baseName = sanitizeFilename(stripExtension(sourceFile.name));
    downloadBlob(result.blob, `${baseName}.${ext}`);
    showToast('Converted image downloaded', 'success', `Saved as ${ext.toUpperCase()}`);
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
          label="Drop an image to convert format"
          hint="Convert between PNG, JPG, and WebP completely inside your browser."
          error={error}
          onFilesSelected={handleFilesSelected}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-5">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Source File</p>
                <p className="font-medium text-sm text-[#111827] dark:text-white truncate max-w-[180px]">
                  {sourceFile.name}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">Target</p>
                <p className="font-mono text-sm font-semibold text-[#635BFF] dark:text-[#8B5CF6]">
                  {getExtensionForMime(targetFormat).toUpperCase()}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Select Output Format
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                {(
                  [
                    { mime: 'image/png', label: 'PNG' },
                    { mime: 'image/jpeg', label: 'JPG' },
                    { mime: 'image/webp', label: 'WebP' },
                  ] as const
                ).map((fmt) => (
                  <button
                    key={fmt.mime}
                    type="button"
                    onClick={() => setTargetFormat(fmt.mime)}
                    aria-pressed={targetFormat === fmt.mime}
                    className={`py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                      targetFormat === fmt.mime
                        ? 'border-[#635BFF] bg-[#635BFF] text-white'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:border-[#635BFF]/60'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {targetFormat !== 'image/png' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <label htmlFor="convert-quality" className="font-medium text-[#111827] dark:text-slate-200">
                    Export Quality
                  </label>
                  <span className="font-mono text-xs font-semibold text-[#635BFF] dark:text-[#8B5CF6]">
                    {quality}%
                  </span>
                </div>
                <input
                  id="convert-quality"
                  type="range"
                  min={20}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-[#635BFF] cursor-pointer"
                />
              </div>
            )}

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C] grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Input Size</p>
                <p className="mt-1 font-mono font-semibold text-sm text-[#111827] dark:text-white">
                  {formatBytes(sourceFile.size)}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Converted Size</p>
                <p className="mt-1 font-mono font-semibold text-sm text-[#111827] dark:text-white">
                  {isProcessing ? '...' : result ? formatBytes(result.size) : '—'}
                </p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={!result || isProcessing}
                onClick={handleDownload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-50 transition-colors"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                Download {getExtensionForMime(targetFormat).toUpperCase()}
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

          <div className="lg:col-span-7 flex flex-col justify-between p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400">
              <span>Converted Preview</span>
              <span className="font-mono">
                {sourceMeta.width} × {sourceMeta.height} px
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center min-h-[260px] max-h-[400px] overflow-hidden rounded-lg bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 p-4">
              {isProcessing ? (
                <LoadingSpinner label="Converting image..." />
              ) : result ? (
                <img
                  src={result.previewUrl}
                  alt="Converted format preview"
                  className="max-h-[360px] w-auto object-contain"
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
