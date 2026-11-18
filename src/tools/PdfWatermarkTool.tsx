import { useState, useEffect } from 'react';
import { Download, Trash2, Type, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { FileDropzone } from '../components/FileDropzone';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { validatePdfFile, validateImageFile } from '../utils/fileValidation';
import { loadImageFromFile, type LoadedImageMeta } from '../utils/imageLogic';
import {
  openPdfForRendering,
  renderPdfPageThumbnail,
  type PdfRenderHandle,
} from '../utils/pdfLogic';
import { addPdfWatermark, type PdfWatermarkPosition } from '../utils/pdfAdvancedLogic';
import { formatBytes, stripExtension, sanitizeFilename } from '../utils/formatters';
import { downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

const WM_POSITIONS: { id: PdfWatermarkPosition; label: string }[] = [
  { id: 'center', label: 'Center' },
  { id: 'diagonal-tile', label: 'Tiled Grid' },
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-right', label: 'Bottom Right' },
];

export default function PdfWatermarkTool() {
  const { showToast } = useToast();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PdfRenderHandle | null>(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewUrl, setPreviewUrl] = useState('');

  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(44);
  const [textColorHex, setTextColorHex] = useState('#635BFF');

  const [wmImageFile, setWmImageFile] = useState<File | null>(null);
  const [wmImageMeta, setWmImageMeta] = useState<LoadedImageMeta | null>(null);
  const [imageScalePct, setImageScalePct] = useState(30);

  const [opacity, setOpacity] = useState(28);
  const [rotationDeg, setRotationDeg] = useState(-35);
  const [position, setPosition] = useState<PdfWatermarkPosition>('center');

  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (pdfDoc) pdfDoc.cleanup().catch(() => {});
    };
  }, [pdfDoc]);

  useEffect(() => {
    return () => {
      if (wmImageMeta?.previewUrl) URL.revokeObjectURL(wmImageMeta.previewUrl);
    };
  }, [wmImageMeta]);

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

  const handlePdfSelected = async (files: File[]) => {
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
      setPdfFile(file);
      setPdfDoc(doc);
      setPreviewPage(1);
    } catch {
      setError(`Could not open "${file.name}". It may be encrypted or corrupted.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelected = async (files: File[]) => {
    const file = files[0];
    const check = validateImageFile(file);
    if (!check.valid) {
      setError(check.error || 'Invalid watermark image.');
      return;
    }
    setError(null);
    try {
      const meta = await loadImageFromFile(file);
      setWmImageFile(file);
      setWmImageMeta(meta);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to decode image.');
    }
  };

  const handleExport = async () => {
    if (!pdfFile) return;
    setError(null);
    setIsExporting(true);
    try {
      const { blob, pageCount } = await addPdfWatermark(pdfFile, {
        mode,
        text,
        fontSize,
        textColorHex,
        imageFile: wmImageFile,
        imageScalePct,
        opacity: opacity / 100,
        rotationDeg,
        position,
      });
      const base = sanitizeFilename(stripExtension(pdfFile.name));
      downloadBlob(blob, `${base}-watermarked.pdf`);
      showToast('Watermarked PDF exported', 'success', `${pageCount} pages · ${formatBytes(blob.size)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to apply PDF watermark.';
      setError(msg);
      showToast('Watermark failed', 'error', msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setPdfDoc(null);
    setPreviewUrl('');
    setWmImageFile(null);
    setWmImageMeta(null);
    setError(null);
  };

  const totalPages = pdfDoc?.numPages ?? 1;

  const anchorClass = (() => {
    switch (position) {
      case 'top-left':
        return 'top-6 left-6';
      case 'top-right':
        return 'top-6 right-6';
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'bottom-right':
        return 'bottom-6 right-6';
      case 'center':
      default:
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    }
  })();

  return (
    <div className="space-y-6">
      {!pdfFile ? (
        <div className="space-y-4">
          <FileDropzone
            accept=".pdf,application/pdf"
            label="Drop a PDF to stamp a text or logo watermark"
            hint="Configure text or image watermarks, opacity, rotation, and position across all pages in your browser."
            error={error}
            disabled={isLoading}
            onFilesSelected={handlePdfSelected}
          />
          {isLoading && (
            <div className="flex justify-center py-2">
              <LoadingSpinner label="Rendering PDF preview..." />
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-4">
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 gap-1">
              <button
                type="button"
                onClick={() => setMode('text')}
                aria-pressed={mode === 'text'}
                className={`inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  mode === 'text'
                    ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Type className="w-3.5 h-3.5" aria-hidden="true" />
                Text Watermark
              </button>
              <button
                type="button"
                onClick={() => setMode('image')}
                aria-pressed={mode === 'image'}
                className={`inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  mode === 'image'
                    ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
                Image / Logo
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-4">
              {mode === 'text' ? (
                <>
                  <div className="space-y-1.5">
                    <label htmlFor="pdf-wm-text" className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                      Watermark Text
                    </label>
                    <input
                      id="pdf-wm-text"
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="CONFIDENTIAL"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <label htmlFor="pdf-wm-fs" className="font-medium text-[#111827] dark:text-slate-200">
                          Size
                        </label>
                        <span className="font-mono text-slate-500">{fontSize}pt</span>
                      </div>
                      <input
                        id="pdf-wm-fs"
                        type="range"
                        min={12}
                        max={84}
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full accent-[#635BFF]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="pdf-wm-col" className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                        Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="pdf-wm-col"
                          type="color"
                          value={textColorHex}
                          onChange={(e) => setTextColorHex(e.target.value)}
                          className="w-9 h-8 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                        />
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                          {textColorHex.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <FileDropzone
                    accept="image/png,image/jpeg,image/webp"
                    label={wmImageFile ? `Logo: ${wmImageFile.name}` : 'Upload logo image (PNG/JPG)'}
                    hint="Transparent PNG works best for PDF stamps."
                    onFilesSelected={handleImageSelected}
                  />
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <label htmlFor="pdf-wm-scale" className="font-medium text-[#111827] dark:text-slate-200">
                        Image Width (% of page)
                      </label>
                      <span className="font-mono text-slate-500">{imageScalePct}%</span>
                    </div>
                    <input
                      id="pdf-wm-scale"
                      type="range"
                      min={10}
                      max={70}
                      value={imageScalePct}
                      onChange={(e) => setImageScalePct(Number(e.target.value))}
                      className="w-full accent-[#635BFF]"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <label htmlFor="pdf-wm-op" className="font-medium text-[#111827] dark:text-slate-200">
                    Opacity
                  </label>
                  <span className="font-mono text-slate-500">{opacity}%</span>
                </div>
                <input
                  id="pdf-wm-op"
                  type="range"
                  min={5}
                  max={100}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full accent-[#635BFF]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <label htmlFor="pdf-wm-rot" className="font-medium text-[#111827] dark:text-slate-200">
                    Rotation
                  </label>
                  <span className="font-mono text-slate-500">{rotationDeg}°</span>
                </div>
                <input
                  id="pdf-wm-rot"
                  type="range"
                  min={-90}
                  max={90}
                  value={rotationDeg}
                  onChange={(e) => setRotationDeg(Number(e.target.value))}
                  className="w-full accent-[#635BFF]"
                />
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                  Position
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {WM_POSITIONS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPosition(p.id)}
                      className={`py-2 px-2.5 rounded-lg text-xs font-medium border ${
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
            </div>

            {error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={isExporting || (mode === 'text' && !text.trim()) || (mode === 'image' && !wmImageFile)}
                onClick={handleExport}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-50"
              >
                {isExporting ? (
                  <LoadingSpinner label="Applying..." />
                ) : (
                  <>
                    <Download className="w-4 h-4" aria-hidden="true" />
                    Export Watermarked PDF
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

          {/* Preview */}
          <div className="lg:col-span-7 p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Live Page Preview</span>
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

            <div className="min-h-[360px] rounded-xl bg-slate-200/70 dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-center">
              {previewUrl ? (
                <div className="relative inline-block shadow-lg bg-white overflow-hidden">
                  <img
                    src={previewUrl}
                    alt={`Page ${previewPage} watermark preview`}
                    className="max-h-[430px] w-auto object-contain block"
                  />

                  {position === 'diagonal-tile' ? (
                    <div
                      style={{ opacity: opacity / 100 }}
                      className="absolute inset-0 grid grid-cols-2 grid-rows-3 place-items-center pointer-events-none"
                    >
                      {Array.from({ length: 6 }).map((_, idx) =>
                        mode === 'text' ? (
                          <span
                            key={idx}
                            style={{
                              color: textColorHex,
                              fontSize: `${Math.max(10, Math.round(fontSize * 0.45))}px`,
                              transform: `rotate(${-rotationDeg}deg)`,
                            }}
                            className="font-bold whitespace-nowrap select-none"
                          >
                            {text}
                          </span>
                        ) : wmImageMeta ? (
                          <img
                            key={idx}
                            src={wmImageMeta.previewUrl}
                            alt=""
                            style={{
                              width: `${Math.max(18, imageScalePct * 0.7)}%`,
                              transform: `rotate(${-rotationDeg}deg)`,
                            }}
                            className="object-contain select-none"
                          />
                        ) : null
                      )}
                    </div>
                  ) : (
                    <div
                      style={{ opacity: opacity / 100 }}
                      className={`absolute pointer-events-none ${anchorClass}`}
                    >
                      {mode === 'text' ? (
                        <span
                          style={{
                            color: textColorHex,
                            fontSize: `${Math.max(12, Math.round(fontSize * 0.55))}px`,
                            transform: `rotate(${-rotationDeg}deg)`,
                          }}
                          className="inline-block font-bold whitespace-nowrap select-none"
                        >
                          {text}
                        </span>
                      ) : wmImageMeta ? (
                        <img
                          src={wmImageMeta.previewUrl}
                          alt="Watermark preview"
                          style={{
                            width: `${Math.max(40, imageScalePct * 3)}px`,
                            transform: `rotate(${-rotationDeg}deg)`,
                          }}
                          className="object-contain select-none"
                        />
                      ) : null}
                    </div>
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
