import { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { FileDropzone } from '../components/FileDropzone';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { validatePdfFile } from '../utils/fileValidation';
import { inspectPdfFile } from '../utils/pdfLogic';
import {
  PDF_PAGE_PRESETS,
  changePdfPageSize,
  type StandardPdfPagePreset,
} from '../utils/pdfAdvancedLogic';
import { formatBytes, stripExtension, sanitizeFilename } from '../utils/formatters';
import { downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

export default function PdfPageSizeChangerTool() {
  const { showToast } = useToast();

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [preset, setPreset] = useState<StandardPdfPagePreset>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [fitMode, setFitMode] = useState<'contain' | 'center' | 'stretch'>('contain');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    const file = files[0];
    const check = await validatePdfFile(file);
    if (!check.valid) {
      setError(check.error || 'Invalid PDF file.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const meta = await inspectPdfFile(file);
      setSourceFile(file);
      setPageCount(meta.pageCount);
    } catch {
      setError(`Could not open "${file.name}". Encrypted PDFs are not supported.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!sourceFile) return;
    setError(null);
    setIsExporting(true);
    try {
      const { blob, pageCount: outPages } = await changePdfPageSize(
        sourceFile,
        preset,
        orientation,
        fitMode
      );
      const base = sanitizeFilename(stripExtension(sourceFile.name));
      downloadBlob(blob, `${base}-${preset}-${orientation}.pdf`);
      showToast(
        'Resized PDF exported',
        'success',
        `${outPages} pages · ${PDF_PAGE_PRESETS[preset].label} (${formatBytes(blob.size)})`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resize PDF pages.';
      setError(msg);
      showToast('Resize failed', 'error', msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setSourceFile(null);
    setPageCount(0);
    setError(null);
  };

  const selectedDims = PDF_PAGE_PRESETS[preset].dimensionsPt;
  const targetW = Math.round(orientation === 'portrait' ? selectedDims[0] : selectedDims[1]);
  const targetH = Math.round(orientation === 'portrait' ? selectedDims[1] : selectedDims[0]);

  return (
    <div className="space-y-6">
      {!sourceFile ? (
        <div className="space-y-4">
          <FileDropzone
            accept=".pdf,application/pdf"
            label="Drop a PDF to resize pages to A4, A3, Letter, or Legal"
            hint="Normalize mixed or oversized PDF pages onto standard print dimensions in Portrait or Landscape."
            error={error}
            disabled={isLoading}
            onFilesSelected={handleFilesSelected}
          />
          {isLoading && (
            <div className="flex justify-center py-2">
              <LoadingSpinner label="Inspecting PDF document..." />
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-sm font-semibold text-[#111827] dark:text-white truncate max-w-sm">
                  {sourceFile.name}
                </p>
                <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  {pageCount} pages · {formatBytes(sourceFile.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 hover:text-rose-600"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                New PDF
              </button>
            </div>

            {/* Paper Size Presets */}
            <div className="space-y-2">
              <span className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Target Paper Size
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(Object.keys(PDF_PAGE_PRESETS) as StandardPdfPagePreset[]).map((key) => {
                  const info = PDF_PAGE_PRESETS[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPreset(key)}
                      aria-pressed={preset === key}
                      className={`p-3 rounded-xl border text-left transition-colors ${
                        preset === key
                          ? 'border-[#635BFF] bg-[#635BFF]/10 text-[#635BFF] dark:text-[#8B5CF6]'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C] text-[#111827] dark:text-slate-200'
                      }`}
                    >
                      <p className="font-display text-sm font-semibold">{info.label}</p>
                      <p className="font-mono text-[11px] opacity-80 mt-0.5">{info.dimensionsMm}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Orientation & Content Fit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                  Orientation
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(['portrait', 'landscape'] as const).map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => setOrientation(dir)}
                      aria-pressed={orientation === dir}
                      className={`py-2.5 px-3 rounded-lg text-xs font-medium border capitalize ${
                        orientation === dir
                          ? 'border-[#635BFF] bg-[#635BFF] text-white'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="pdf-fit-mode" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                  Content Scaling
                </label>
                <select
                  id="pdf-fit-mode"
                  value={fitMode}
                  onChange={(e) => setFitMode(e.target.value as 'contain' | 'center' | 'stretch')}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-sm text-[#111827] dark:text-white"
                >
                  <option value="contain">Scale to Fit (Preserve Aspect)</option>
                  <option value="center">Center Original Size (No Scale)</option>
                  <option value="stretch">Stretch to Fill Page</option>
                </select>
              </div>
            </div>

            {error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

            <button
              type="button"
              disabled={isExporting}
              onClick={handleExport}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-50"
            >
              {isExporting ? (
                <LoadingSpinner label="Converting page sizes..." />
              ) : (
                <>
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Export {PDF_PAGE_PRESETS[preset].label} {orientation === 'portrait' ? 'Portrait' : 'Landscape'} PDF
                </>
              )}
            </button>
          </div>

          {/* Target Aspect Proportion Preview */}
          <div className="lg:col-span-5 p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Output Sheet Proportion ({PDF_PAGE_PRESETS[preset].label} · {orientation})
            </p>
            <div className="h-56 w-full flex items-center justify-center">
              <div
                style={{
                  aspectRatio: `${targetW} / ${targetH}`,
                  height: orientation === 'portrait' ? '200px' : '140px',
                }}
                className="bg-white dark:bg-[#171B26] border-2 border-[#635BFF]/60 rounded-lg shadow-sm flex flex-col items-center justify-center p-3 text-center"
              >
                <span className="font-display text-sm font-bold text-[#111827] dark:text-white">
                  {PDF_PAGE_PRESETS[preset].label}
                </span>
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {targetW} × {targetH} pt
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center max-w-xs">
              Every page is embedded cleanly onto a fresh {PDF_PAGE_PRESETS[preset].label} canvas in your browser.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
