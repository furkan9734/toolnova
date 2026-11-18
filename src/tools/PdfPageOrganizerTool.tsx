import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Trash2,
  Download,
  Undo2,
} from 'lucide-react';
import { FileDropzone } from '../components/FileDropzone';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { validatePdfFile } from '../utils/fileValidation';
import {
  openPdfForRendering,
  renderPdfPageThumbnail,
  exportOrganizedPdf,
  type OrganizedPdfPageItem,
  type PdfRenderHandle,
} from '../utils/pdfLogic';
import { formatBytes, stripExtension, sanitizeFilename } from '../utils/formatters';
import { downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

export default function PdfPageOrganizerTool() {
  const { showToast } = useToast();

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PdfRenderHandle | null>(null);
  const [pages, setPages] = useState<OrganizedPdfPageItem[]>([]);
  const [initialPages, setInitialPages] = useState<OrganizedPdfPageItem[]>([]);
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
      const renderedItems: OrganizedPdfPageItem[] = [];

      // Limit thumbnail count safeguard for huge docs; still supports all pages
      const thumbScale = doc.numPages > 24 ? 0.28 : 0.42;
      for (let i = 1; i <= doc.numPages; i++) {
        const thumbUrl = await renderPdfPageThumbnail(doc, i, thumbScale);
        renderedItems.push({
          originalPageNumber: i,
          rotationDelta: 0,
          thumbnailUrl: thumbUrl,
        });
      }

      setSourceFile(file);
      setPdfDoc(doc);
      setPages(renderedItems);
      setInitialPages(renderedItems);
    } catch {
      setError(`Could not open "${file.name}". It may be password-protected or corrupted.`);
    } finally {
      setIsLoading(false);
    }
  };

  const movePage = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= pages.length) return;
    setPages((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  };

  const rotatePage = (index: number) => {
    setPages((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              rotationDelta: (((item.rotationDelta + 90) % 360) as 0 | 90 | 180 | 270),
            }
          : item
      )
    );
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) {
      showToast('A PDF must keep at least 1 page', 'info');
      return;
    }
    setPages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const restoreOriginalOrder = () => {
    setPages(initialPages);
    showToast('Restored original page order and rotations', 'info');
  };

  const handleExport = async () => {
    if (!sourceFile || pages.length === 0) return;
    setError(null);
    setIsExporting(true);

    try {
      const { blob, pageCount } = await exportOrganizedPdf(
        sourceFile,
        pages.map((p) => ({
          originalPageNumber: p.originalPageNumber,
          rotationDelta: p.rotationDelta,
        }))
      );
      const base = sanitizeFilename(stripExtension(sourceFile.name));
      downloadBlob(blob, `${base}-organized.pdf`);
      showToast(
        'Organized PDF exported',
        'success',
        `${pageCount} ${pageCount === 1 ? 'page' : 'pages'} (${formatBytes(blob.size)})`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to export updated PDF.';
      setError(msg);
      showToast('Export failed', 'error', msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearFile = () => {
    setSourceFile(null);
    setPdfDoc(null);
    setPages([]);
    setInitialPages([]);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {!sourceFile ? (
        <div className="space-y-4">
          <FileDropzone
            accept=".pdf,application/pdf"
            label="Drop a PDF to organize, rotate, or delete pages"
            hint="Preview every page thumbnail locally, reorder pages, rotate 90°, delete unwanted pages, and save."
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-[#111827] dark:text-white truncate max-w-xs sm:max-w-md">
                {sourceFile.name}
              </p>
              <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                {pages.length} of {initialPages.length} pages kept · {formatBytes(sourceFile.size)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={restoreOriginalOrder}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Undo2 className="w-3.5 h-3.5" aria-hidden="true" />
                Reset Order
              </button>
              <button
                type="button"
                onClick={handleClearFile}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 hover:text-rose-600"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                New PDF
              </button>
              <button
                type="button"
                disabled={isExporting || pages.length === 0}
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-50 transition-colors"
              >
                {isExporting ? (
                  <LoadingSpinner label="Exporting..." />
                ) : (
                  <>
                    <Download className="w-4 h-4" aria-hidden="true" />
                    Export PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
          )}

          {/* Page Thumbnails Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pages.map((page, idx) => (
              <div
                key={`${page.originalPageNumber}-${idx}`}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#10131C] flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                  <span>Pos {idx + 1}</span>
                  <span>
                    Orig #{page.originalPageNumber}
                    {page.rotationDelta > 0 ? ` · ${page.rotationDelta}°` : ''}
                  </span>
                </div>

                <div className="h-44 rounded-lg bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden p-2">
                  <img
                    src={page.thumbnailUrl}
                    alt={`Page ${page.originalPageNumber} thumbnail`}
                    style={{ transform: `rotate(${page.rotationDelta}deg)` }}
                    className="max-h-full max-w-full object-contain transition-transform"
                  />
                </div>

                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => movePage(idx, -1)}
                    aria-label={`Move page ${idx + 1} earlier`}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-600 dark:text-slate-300 hover:text-[#111827] dark:hover:text-white disabled:opacity-30 flex items-center justify-center"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === pages.length - 1}
                    onClick={() => movePage(idx, 1)}
                    aria-label={`Move page ${idx + 1} later`}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-600 dark:text-slate-300 hover:text-[#111827] dark:hover:text-white disabled:opacity-30 flex items-center justify-center"
                  >
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => rotatePage(idx)}
                    aria-label={`Rotate page ${idx + 1} by 90 degrees`}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-600 dark:text-slate-300 hover:text-[#635BFF] flex items-center justify-center"
                  >
                    <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={pages.length <= 1}
                    onClick={() => deletePage(idx)}
                    aria-label={`Delete page ${idx + 1}`}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-600 dark:text-slate-300 hover:text-rose-600 disabled:opacity-30 flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
