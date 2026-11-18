import { useState, useEffect } from 'react';
import { RotateCw, RotateCcw, Download, Trash2, CheckSquare, Square } from 'lucide-react';
import { FileDropzone } from '../components/FileDropzone';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { validatePdfFile } from '../utils/fileValidation';
import {
  openPdfForRendering,
  renderPdfPageThumbnail,
  type PdfRenderHandle,
} from '../utils/pdfLogic';
import { rotatePdfPages } from '../utils/pdfAdvancedLogic';
import { formatBytes, stripExtension, sanitizeFilename } from '../utils/formatters';
import { downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

interface PageThumbItem {
  pageNumber: number;
  thumbnailUrl: string;
}

export default function PdfRotatorTool() {
  const { showToast } = useToast();

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PdfRenderHandle | null>(null);
  const [pages, setPages] = useState<PageThumbItem[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [rotations, setRotations] = useState<Record<number, 0 | 90 | 180 | 270>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (pdfDoc) {
        pdfDoc.cleanup().catch(() => {});
      }
    };
  }, [pdfDoc]);

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
      const doc = await openPdfForRendering(file);
      const scale = doc.numPages > 24 ? 0.28 : 0.42;
      const rendered: PageThumbItem[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const thumbnailUrl = await renderPdfPageThumbnail(doc, i, scale);
        rendered.push({ pageNumber: i, thumbnailUrl });
      }
      setSourceFile(file);
      setPdfDoc(doc);
      setPages(rendered);
      setSelectedPages(rendered.map((p) => p.pageNumber));
      setRotations({});
    } catch {
      setError(`Could not open "${file.name}". It may be encrypted or corrupted.`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectPage = (pageNum: number) => {
    setSelectedPages((prev) =>
      prev.includes(pageNum) ? prev.filter((p) => p !== pageNum) : [...prev, pageNum]
    );
  };

  const applyRotationToPages = (targetPages: number[], delta: 90 | 180 | 270) => {
    if (targetPages.length === 0) {
      showToast('Select at least one page first', 'info');
      return;
    }
    setRotations((prev) => {
      const next = { ...prev };
      for (const p of targetPages) {
        const cur = next[p] ?? 0;
        next[p] = ((cur + delta) % 360) as 0 | 90 | 180 | 270;
      }
      return next;
    });
  };

  const handleExport = async () => {
    if (!sourceFile) return;
    setError(null);
    setIsExporting(true);
    try {
      const { blob, pageCount } = await rotatePdfPages(sourceFile, rotations);
      const base = sanitizeFilename(stripExtension(sourceFile.name));
      downloadBlob(blob, `${base}-rotated.pdf`);
      showToast('Rotated PDF exported', 'success', `${pageCount} pages · ${formatBytes(blob.size)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'PDF rotation export failed.';
      setError(msg);
      showToast('Export failed', 'error', msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClear = () => {
    setSourceFile(null);
    setPdfDoc(null);
    setPages([]);
    setSelectedPages([]);
    setRotations({});
    setError(null);
  };

  const rotatedCount = Object.values(rotations).filter((deg) => deg !== 0).length;

  return (
    <div className="space-y-6">
      {!sourceFile ? (
        <div className="space-y-4">
          <FileDropzone
            accept=".pdf,application/pdf"
            label="Drop a PDF to rotate individual or all pages"
            hint="Preview page thumbnails locally, select specific pages or all pages, rotate 90°/180°/270°, and download."
            error={error}
            disabled={isLoading}
            onFilesSelected={handleFilesSelected}
          />
          {isLoading && (
            <div className="flex justify-center py-2">
              <LoadingSpinner label="Rendering PDF page previews..." />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#111827] dark:text-white truncate max-w-md">
                  {sourceFile.name}
                </p>
                <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  {pages.length} pages · {selectedPages.length} selected · {rotatedCount} rotated
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 hover:text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  New PDF
                </button>
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-50"
                >
                  {isExporting ? (
                    <LoadingSpinner label="Exporting..." />
                  ) : (
                    <>
                      <Download className="w-4 h-4" aria-hidden="true" />
                      Export Rotated PDF
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Batch Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPages(pages.map((p) => p.pageNumber))}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPages([])}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200"
                >
                  Clear Selection
                </button>
                <button
                  type="button"
                  onClick={() => setRotations({})}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200"
                >
                  Reset Angles
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyRotationToPages(selectedPages, 270)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-[#111827] dark:text-white hover:border-[#635BFF]"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  Selected -90°
                </button>
                <button
                  type="button"
                  onClick={() => applyRotationToPages(selectedPages, 90)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-[#111827] dark:text-white hover:border-[#635BFF]"
                >
                  <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                  Selected +90°
                </button>
                <button
                  type="button"
                  onClick={() => applyRotationToPages(selectedPages, 180)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-[#111827] dark:text-white hover:border-[#635BFF]"
                >
                  Selected 180°
                </button>
              </div>
            </div>
          </div>

          {error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pages.map((page) => {
              const deg = rotations[page.pageNumber] ?? 0;
              const isSelected = selectedPages.includes(page.pageNumber);
              return (
                <div
                  key={page.pageNumber}
                  className={`p-3 rounded-xl border transition-colors flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'border-[#635BFF] bg-[#635BFF]/5 dark:bg-[#635BFF]/10'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#10131C]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => toggleSelectPage(page.pageNumber)}
                      aria-pressed={isSelected}
                      className="inline-flex items-center gap-1.5 text-[#111827] dark:text-white font-medium"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#635BFF]" aria-hidden="true" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" aria-hidden="true" />
                      )}
                      Page {page.pageNumber}
                    </button>
                    {deg > 0 && <span className="text-[#635BFF] dark:text-[#8B5CF6]">+{deg}°</span>}
                  </div>

                  <div
                    onClick={() => toggleSelectPage(page.pageNumber)}
                    className="h-40 rounded-lg bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden p-2 cursor-pointer"
                  >
                    <img
                      src={page.thumbnailUrl}
                      alt={`Page ${page.pageNumber} preview`}
                      style={{ transform: `rotate(${deg}deg)` }}
                      className="max-h-full max-w-full object-contain transition-transform"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyRotationToPages([page.pageNumber], 270)}
                      aria-label={`Rotate page ${page.pageNumber} left 90 degrees`}
                      className="py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-xs text-slate-700 dark:text-slate-200 hover:border-[#635BFF] flex items-center justify-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" aria-hidden="true" />
                      -90°
                    </button>
                    <button
                      type="button"
                      onClick={() => applyRotationToPages([page.pageNumber], 90)}
                      aria-label={`Rotate page ${page.pageNumber} right 90 degrees`}
                      className="py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-xs text-slate-700 dark:text-slate-200 hover:border-[#635BFF] flex items-center justify-center gap-1"
                    >
                      <RotateCw className="w-3 h-3" aria-hidden="true" />
                      +90°
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
