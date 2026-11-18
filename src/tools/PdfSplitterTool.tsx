import { useState } from 'react';
import { Download, Scissors, Trash2, AlertCircle } from 'lucide-react';
import { FileDropzone } from '../components/FileDropzone';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { validatePdfFile } from '../utils/fileValidation';
import {
  inspectPdfFile,
  parsePageRangeExpression,
  extractPdfPagesToBlob,
} from '../utils/pdfLogic';
import { formatBytes, stripExtension, sanitizeFilename } from '../utils/formatters';
import { downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

export default function PdfSplitterTool() {
  const { showToast } = useToast();

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [rangeText, setRangeText] = useState<string>('1');
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
      setTotalPages(meta.pageCount);
      setRangeText(meta.pageCount > 1 ? `1-${Math.min(2, meta.pageCount)}` : '1');
    } catch {
      setError(`Unable to parse "${file.name}". It may be encrypted or corrupted.`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleIndividualPage = (pageNum: number) => {
    try {
      const parsed = parsePageRangeExpression(rangeText, totalPages);
      const set = new Set(parsed.pages);
      if (set.has(pageNum)) set.delete(pageNum);
      else set.add(pageNum);
      const sorted = Array.from(set).sort((a, b) => a - b);
      setRangeText(sorted.join(', '));
      setError(null);
    } catch {
      setRangeText(String(pageNum));
      setError(null);
    }
  };

  let activePages: number[] = [];
  let rangeError: string | null = null;
  if (totalPages > 0 && rangeText.trim()) {
    try {
      activePages = parsePageRangeExpression(rangeText, totalPages).pages;
    } catch (err: unknown) {
      rangeError = err instanceof Error ? err.message : 'Invalid page selection.';
    }
  }

  const handleExportCombined = async () => {
    if (!sourceFile) return;
    setError(null);
    try {
      const { pages } = parsePageRangeExpression(rangeText, totalPages);
      setIsExporting(true);
      const { blob, pageCount } = await extractPdfPagesToBlob(sourceFile, pages);
      const base = sanitizeFilename(stripExtension(sourceFile.name));
      downloadBlob(blob, `${base}-extracted-${pageCount}p.pdf`);
      showToast(
        'Extracted PDF downloaded',
        'success',
        `${pageCount} ${pageCount === 1 ? 'page' : 'pages'} (${formatBytes(blob.size)})`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not split PDF.';
      setError(msg);
      showToast('Split failed', 'error', msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSeparateRanges = async () => {
    if (!sourceFile) return;
    setError(null);
    try {
      const { groups } = parsePageRangeExpression(rangeText, totalPages);
      setIsExporting(true);
      const base = sanitizeFilename(stripExtension(sourceFile.name));

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const { blob } = await extractPdfPagesToBlob(sourceFile, group);
        const suffix =
          group.length === 1 ? `p${group[0]}` : `p${group[0]}-${group[group.length - 1]}`;
        downloadBlob(blob, `${base}-${suffix}.pdf`);
      }

      showToast(
        `Downloaded ${groups.length} split PDF ${groups.length === 1 ? 'file' : 'files'}`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not export split PDFs.';
      setError(msg);
      showToast('Export failed', 'error', msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setSourceFile(null);
    setTotalPages(0);
    setRangeText('1');
    setError(null);
  };

  return (
    <div className="space-y-6">
      {!sourceFile ? (
        <div className="space-y-4">
          <FileDropzone
            accept=".pdf,application/pdf"
            label="Drop a PDF file to split"
            hint="Upload any unencrypted PDF (up to 50 MB). Select individual pages or ranges like 1-3, 5."
            error={error}
            disabled={isLoading}
            onFilesSelected={handleFilesSelected}
          />
          {isLoading && (
            <div className="flex justify-center">
              <LoadingSpinner label="Inspecting PDF pages..." />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-[#111827] dark:text-white">
                {sourceFile.name}
              </p>
              <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                {totalPages} {totalPages === 1 ? 'page' : 'pages'} · {formatBytes(sourceFile.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              Change PDF
            </button>
          </div>

          {/* Page range input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="pdf-split-range" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Page Numbers or Ranges (1 – {totalPages})
              </label>
              <div className="flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setRangeText(`1-${totalPages}`)}
                  className="text-[#635BFF] dark:text-[#8B5CF6] hover:underline"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setRangeText('')}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400"
                >
                  Clear
                </button>
              </div>
            </div>
            <input
              id="pdf-split-range"
              type="text"
              value={rangeText}
              onChange={(e) => {
                setRangeText(e.target.value);
                setError(null);
              }}
              placeholder="e.g. 1-3, 5, 8"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] font-mono text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            />
            {(rangeError || error) && (
              <p role="alert" className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{rangeError || error}</span>
              </p>
            )}
          </div>

          {/* Tap-to-toggle page grid (up to 60 pages for clean mobile layout) */}
          {totalPages <= 60 && (
            <div className="space-y-2">
              <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                Tap individual pages to toggle selection
              </span>
              <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-2">
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => {
                  const selected = activePages.includes(pageNum);
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => toggleIndividualPage(pageNum)}
                      aria-pressed={selected}
                      className={`py-2 rounded-lg font-mono text-xs font-medium border transition-colors ${
                        selected
                          ? 'border-[#635BFF] bg-[#635BFF] text-white'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-300 hover:border-[#635BFF]/50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Export Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={isExporting || Boolean(rangeError) || activePages.length === 0}
              onClick={handleExportCombined}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExporting ? (
                <LoadingSpinner label="Extracting..." />
              ) : (
                <>
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Download Selected ({activePages.length} {activePages.length === 1 ? 'page' : 'pages'}) as 1 PDF
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isExporting || Boolean(rangeError) || activePages.length === 0}
              onClick={handleExportSeparateRanges}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-[#111827] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Scissors className="w-4 h-4" aria-hidden="true" />
              Export Separate PDFs per Range
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
