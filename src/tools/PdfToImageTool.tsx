import { useState, useEffect } from 'react';
import { Download, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { FileDropzone } from '../components/FileDropzone';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { validatePdfFile } from '../utils/fileValidation';
import {
  openPdfForRendering,
  renderPdfPageToBlob,
  type PdfRenderHandle,
  type RenderedPdfPage,
} from '../utils/pdfLogic';
import { formatBytes, stripExtension, sanitizeFilename } from '../utils/formatters';
import { downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

export default function PdfToImageTool() {
  const { showToast } = useToast();

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PdfRenderHandle | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(2);
  const [mimeType, setMimeType] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [rendered, setRendered] = useState<RenderedPdfPage | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [isRenderingPage, setIsRenderingPage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (rendered?.previewUrl) URL.revokeObjectURL(rendered.previewUrl);
    };
  }, [rendered]);

  useEffect(() => {
    return () => {
      if (pdfDoc) {
        pdfDoc.cleanup().catch(() => {});
      }
    };
  }, [pdfDoc]);

  const handleFilesSelected = async (files: File[]) => {
    const file = files[0];
    const validation = await validatePdfFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid PDF file.');
      return;
    }

    setError(null);
    setIsLoadingDoc(true);

    try {
      const handle = await openPdfForRendering(file);
      setSourceFile(file);
      setPdfDoc(handle);
      setTotalPages(handle.numPages);
      setSelectedPage(1);
    } catch {
      setError(`Could not parse "${file.name}". It may be password-protected or corrupted.`);
    } finally {
      setIsLoadingDoc(false);
    }
  };

  useEffect(() => {
    if (!pdfDoc || selectedPage < 1 || selectedPage > totalPages) return;
    let active = true;
    setIsRenderingPage(true);
    setError(null);

    renderPdfPageToBlob(pdfDoc, selectedPage, scale, mimeType)
      .then((output) => {
        if (active) {
          setRendered(output);
          setIsRenderingPage(false);
        } else {
          URL.revokeObjectURL(output.previewUrl);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to render selected page.');
          setIsRenderingPage(false);
        }
      });

    return () => {
      active = false;
    };
  }, [pdfDoc, selectedPage, totalPages, scale, mimeType]);

  const handleDownload = () => {
    if (!rendered || !sourceFile) return;
    const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png';
    const baseName = sanitizeFilename(stripExtension(sourceFile.name));
    downloadBlob(rendered.blob, `${baseName}-page-${rendered.pageNumber}.${ext}`);
    showToast(
      `Page ${rendered.pageNumber} exported`,
      'success',
      `${rendered.width} × ${rendered.height} px (${formatBytes(rendered.blob.size)})`
    );
  };

  const handleReset = () => {
    setSourceFile(null);
    setPdfDoc(null);
    setTotalPages(0);
    setSelectedPage(1);
    setRendered(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {!sourceFile || !pdfDoc ? (
        <div className="space-y-4">
          <FileDropzone
            accept=".pdf,application/pdf"
            label="Drop a PDF document to render pages"
            hint="Upload any unencrypted PDF (up to 50 MB). Select a page and export it as PNG or JPG."
            error={error}
            disabled={isLoadingDoc}
            onFilesSelected={handleFilesSelected}
          />
          {isLoadingDoc && (
            <div className="flex justify-center">
              <LoadingSpinner label="Opening PDF document..." />
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-5">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">Loaded Document</p>
              <p className="text-sm font-medium text-[#111827] dark:text-white truncate">
                {sourceFile.name}
              </p>
              <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                {totalPages} {totalPages === 1 ? 'page' : 'pages'} · {formatBytes(sourceFile.size)}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="pdf-page-input" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Select Page (1 – {totalPages})
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={selectedPage <= 1}
                  onClick={() => setSelectedPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>
                <input
                  id="pdf-page-input"
                  type="number"
                  min={1}
                  max={totalPages}
                  value={selectedPage}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!Number.isNaN(val)) {
                      setSelectedPage(Math.min(totalPages, Math.max(1, val)));
                    }
                  }}
                  className="w-full px-3 py-2.5 text-center font-mono text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                />
                <button
                  type="button"
                  disabled={selectedPage >= totalPages}
                  onClick={() => setSelectedPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pdf-scale" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Render Resolution
              </label>
              <select
                id="pdf-scale"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
              >
                <option value={1}>1× (Screen draft)</option>
                <option value={2}>2× (Crisp HD)</option>
                <option value={3}>3× (Print quality)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Image Format
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {(
                  [
                    { value: 'image/png', label: 'PNG' },
                    { value: 'image/jpeg', label: 'JPG' },
                  ] as const
                ).map((fmt) => (
                  <button
                    key={fmt.value}
                    type="button"
                    onClick={() => setMimeType(fmt.value)}
                    aria-pressed={mimeType === fmt.value}
                    className={`py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                      mimeType === fmt.value
                        ? 'border-[#635BFF] bg-[#635BFF] text-white'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={!rendered || isRenderingPage}
                onClick={handleDownload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-50 transition-colors"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                Download Page {selectedPage}
              </button>
              <button
                type="button"
                onClick={handleReset}
                aria-label="Reset PDF selection"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Page Preview */}
          <div className="lg:col-span-8 flex flex-col justify-between p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400">
              <span>Page {selectedPage} of {totalPages}</span>
              <span className="font-mono">
                {rendered
                  ? `${rendered.width} × ${rendered.height} px · ${formatBytes(rendered.blob.size)}`
                  : 'Rendering...'}
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center min-h-[340px] max-h-[540px] overflow-auto rounded-lg bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 p-4">
              {isRenderingPage ? (
                <LoadingSpinner label={`Rendering page ${selectedPage}...`} />
              ) : error ? (
                <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
              ) : rendered ? (
                <img
                  src={rendered.previewUrl}
                  alt={`PDF page ${rendered.pageNumber} rendered preview`}
                  className="max-w-full max-h-[480px] w-auto object-contain shadow-sm"
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
