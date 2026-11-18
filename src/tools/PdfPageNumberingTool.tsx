import { useState, useEffect } from 'react';
import { Download, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { FileDropzone } from '../components/FileDropzone';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { validatePdfFile } from '../utils/fileValidation';
import {
  openPdfForRendering,
  renderPdfPageThumbnail,
  type PdfRenderHandle,
} from '../utils/pdfLogic';
import {
  addPdfPageNumbers,
  formatPageNumberLabel,
  type PdfPageNumberPosition,
  type PdfPageNumberFormat,
} from '../utils/pdfAdvancedLogic';
import { formatBytes, stripExtension, sanitizeFilename } from '../utils/formatters';
import { downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

const POSITIONS: { id: PdfPageNumberPosition; label: string }[] = [
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-center', label: 'Top Center' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-center', label: 'Bottom Center' },
  { id: 'bottom-right', label: 'Bottom Right' },
];

export default function PdfPageNumberingTool() {
  const { showToast } = useToast();

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PdfRenderHandle | null>(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewUrl, setPreviewUrl] = useState('');

  const [position, setPosition] = useState<PdfPageNumberPosition>('bottom-center');
  const [fontSize, setFontSize] = useState(11);
  const [startNumber, setStartNumber] = useState(1);
  const [format, setFormat] = useState<PdfPageNumberFormat>('x-of-y');
  const [marginPt, setMarginPt] = useState(24);
  const [textColorHex, setTextColorHex] = useState('#334155');
  const [skipFirstPage, setSkipFirstPage] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (pdfDoc) pdfDoc.cleanup().catch(() => {});
    };
  }, [pdfDoc]);

  useEffect(() => {
    if (!pdfDoc) return;
    let active = true;
    renderPdfPageThumbnail(pdfDoc, previewPage, 0.85)
      .then((url) => {
        if (active) setPreviewUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pdfDoc, previewPage]);

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
      setSourceFile(file);
      setPdfDoc(doc);
      setPreviewPage(1);
    } catch {
      setError(`Could not open "${file.name}". It may be encrypted or corrupted.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!sourceFile) return;
    setError(null);
    setIsExporting(true);
    try {
      const { blob, pageCount } = await addPdfPageNumbers(sourceFile, {
        position,
        fontSize,
        startNumber: Math.max(1, startNumber),
        format,
        marginPt,
        textColorHex,
        skipFirstPage,
      });
      const base = sanitizeFilename(stripExtension(sourceFile.name));
      downloadBlob(blob, `${base}-numbered.pdf`);
      showToast('Numbered PDF downloaded', 'success', `${pageCount} pages · ${formatBytes(blob.size)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to number PDF pages.';
      setError(msg);
      showToast('Export failed', 'error', msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setSourceFile(null);
    setPdfDoc(null);
    setPreviewUrl('');
    setError(null);
  };

  const totalPages = pdfDoc?.numPages ?? 1;
  const numberedTotal = skipFirstPage ? Math.max(0, totalPages - 1) : totalPages;
  const totalDisplayEnd = Math.max(1, startNumber) + Math.max(0, numberedTotal - 1);
  const showOverlayOnCurrentPage = !(skipFirstPage && previewPage === 1);
  const currentDisplayNum =
    Math.max(1, startNumber) + (skipFirstPage ? previewPage - 2 : previewPage - 1);
  const previewLabel = formatPageNumberLabel(currentDisplayNum, totalDisplayEnd, format);

  const posStyleClass = (() => {
    const v = position.startsWith('top') ? 'top-4' : 'bottom-4';
    const h = position.endsWith('left')
      ? 'left-4 text-left'
      : position.endsWith('right')
      ? 'right-4 text-right'
      : 'left-1/2 -translate-x-1/2 text-center';
    return `${v} ${h}`;
  })();

  return (
    <div className="space-y-6">
      {!sourceFile ? (
        <div className="space-y-4">
          <FileDropzone
            accept=".pdf,application/pdf"
            label="Drop a PDF to add page numbers"
            hint="Customize header or footer position, font size, starting number, and numbering style with live page preview."
            error={error}
            disabled={isLoading}
            onFilesSelected={handleFilesSelected}
          />
          {isLoading && (
            <div className="flex justify-center py-2">
              <LoadingSpinner label="Loading PDF pages..." />
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="space-y-2">
                <span className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                  Number Position
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {POSITIONS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPosition(p.id)}
                      className={`py-2 px-2 rounded-lg text-[11px] font-medium border ${
                        position === p.id
                          ? 'border-[#635BFF] bg-[#635BFF] text-white'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="pn-fmt" className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                  Label Format
                </label>
                <select
                  id="pn-fmt"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as PdfPageNumberFormat)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white"
                >
                  <option value="number">Number only (1, 2, 3)</option>
                  <option value="page-x">Page X (Page 1)</option>
                  <option value="x-of-y">X / Total (1 / {totalDisplayEnd})</option>
                  <option value="page-x-of-y">Page X of Total (Page 1 of {totalDisplayEnd})</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="pn-start" className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                    Starting Number
                  </label>
                  <input
                    id="pn-start"
                    type="number"
                    min={1}
                    max={9999}
                    value={startNumber}
                    onChange={(e) => setStartNumber(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-sm text-[#111827] dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="pn-color" className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                    Text Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="pn-color"
                      type="color"
                      value={textColorHex}
                      onChange={(e) => setTextColorHex(e.target.value)}
                      className="w-10 h-9 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                    />
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                      {textColorHex.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <label htmlFor="pn-size" className="font-medium text-[#111827] dark:text-slate-200">
                    Font Size
                  </label>
                  <span className="font-mono text-slate-500">{fontSize} pt</span>
                </div>
                <input
                  id="pn-size"
                  type="range"
                  min={8}
                  max={28}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-[#635BFF]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <label htmlFor="pn-margin" className="font-medium text-[#111827] dark:text-slate-200">
                    Edge Margin
                  </label>
                  <span className="font-mono text-slate-500">{marginPt} pt</span>
                </div>
                <input
                  id="pn-margin"
                  type="range"
                  min={12}
                  max={72}
                  value={marginPt}
                  onChange={(e) => setMarginPt(Number(e.target.value))}
                  className="w-full accent-[#635BFF]"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-[#111827] dark:text-slate-200 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={skipFirstPage}
                  onChange={(e) => setSkipFirstPage(e.target.checked)}
                  className="rounded border-slate-300 text-[#635BFF] focus:ring-[#635BFF]"
                />
                Skip page 1 (cover page)
              </label>
            </div>

            {error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={isExporting}
                onClick={handleExport}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-50"
              >
                {isExporting ? (
                  <LoadingSpinner label="Numbering..." />
                ) : (
                  <>
                    <Download className="w-4 h-4" aria-hidden="true" />
                    Download Numbered PDF
                  </>
                )}
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

          {/* Interactive Page Preview */}
          <div className="lg:col-span-7 p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Placement Preview ({sourceFile.name})</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={previewPage <= 1}
                  onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous preview page"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <span className="font-mono">
                  Page {previewPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={previewPage >= totalPages}
                  onClick={() => setPreviewPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next preview page"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] disabled:opacity-40"
                >
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="min-h-[340px] rounded-xl bg-slate-200/70 dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-center">
              {previewUrl ? (
                <div className="relative inline-block shadow-lg bg-white">
                  <img
                    src={previewUrl}
                    alt={`Page ${previewPage} preview`}
                    className="max-h-[420px] w-auto object-contain block"
                  />
                  {showOverlayOnCurrentPage && (
                    <span
                      style={{
                        color: textColorHex,
                        fontSize: `${Math.max(10, Math.round(fontSize * 0.95))}px`,
                      }}
                      className={`absolute font-sans font-medium pointer-events-none px-1.5 py-0.5 rounded bg-white/75 ${posStyleClass}`}
                    >
                      {previewLabel}
                    </span>
                  )}
                </div>
              ) : (
                <LoadingSpinner label="Rendering preview..." />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
