import { useState, useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown, Trash2, Download, Images } from 'lucide-react';
import { FileDropzone } from '../components/FileDropzone';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { validateImageFile } from '../utils/fileValidation';
import { loadImageFromFile } from '../utils/imageLogic';
import {
  convertImagesToPdf,
  type PdfPageSizePreset,
  type PdfOrientation,
} from '../utils/pdfLogic';
import { formatBytes } from '../utils/formatters';
import { downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

interface QueuedImage {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

export default function ImageToPdfTool() {
  const { showToast } = useToast();

  const [images, setImages] = useState<QueuedImage[]>([]);
  const [pageSize, setPageSize] = useState<PdfPageSizePreset>('a4');
  const [orientation, setOrientation] = useState<PdfOrientation>('portrait');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imagesRef = useRef<QueuedImage[]>([]);
  imagesRef.current = images;

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  const handleFilesSelected = async (files: File[]) => {
    setError(null);
    const added: QueuedImage[] = [];

    for (const file of files) {
      const check = validateImageFile(file);
      if (!check.valid) {
        setError(check.error || `Unsupported image "${file.name}".`);
        continue;
      }

      try {
        const meta = await loadImageFromFile(file);
        added.push({
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          file,
          previewUrl: meta.previewUrl,
          width: meta.width,
          height: meta.height,
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : `Could not decode "${file.name}".`);
      }
    }

    if (added.length > 0) {
      setImages((prev) => [...prev, ...added]);
      showToast(`Added ${added.length} ${added.length === 1 ? 'image' : 'images'}`, 'info');
    }
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    setImages((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  };

  const removeItem = (id: string) => {
    setImages((prev) => {
      const found = prev.find((i) => i.id === id);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAll = () => {
    images.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setImages([]);
    setError(null);
  };

  const handleGeneratePdf = async () => {
    if (images.length === 0) return;
    setError(null);
    setIsExporting(true);

    try {
      const { blob, pageCount } = await convertImagesToPdf(
        images.map((i) => i.file),
        pageSize,
        orientation
      );
      downloadBlob(blob, `toolnova-images-${Date.now()}.pdf`);
      showToast(
        'PDF generated successfully',
        'success',
        `${pageCount} ${pageCount === 1 ? 'page' : 'pages'} (${formatBytes(blob.size)})`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'PDF generation failed.';
      setError(msg);
      showToast('PDF export failed', 'error', msg);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileDropzone
        accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
        multiple
        label="Add images to convert to PDF"
        hint="Supports JPG, PNG, WebP, GIF, and BMP up to 25 MB each. Reorder images below before exporting."
        error={error}
        disabled={isExporting}
        onFilesSelected={handleFilesSelected}
      />

      {images.length === 0 ? (
        <EmptyState
          icon={<Images className="w-5 h-5" aria-hidden="true" />}
          title="No images queued"
          description="Upload one or more photos or graphics above to arrange them into a multi-page PDF document."
        />
      ) : (
        <div className="space-y-5">
          {/* Page Size & Orientation Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 items-end">
            <div className="space-y-1.5">
              <label htmlFor="imgpdf-size" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Page Size
              </label>
              <select
                id="imgpdf-size"
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as PdfPageSizePreset)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
              >
                <option value="a4">A4 (210 × 297 mm)</option>
                <option value="letter">US Letter (8.5 × 11 in)</option>
                <option value="fit">Fit Page to Each Image</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="imgpdf-orient" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Orientation
              </label>
              <select
                id="imgpdf-orient"
                value={orientation}
                disabled={pageSize === 'fit'}
                onChange={(e) => setOrientation(e.target.value as PdfOrientation)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={isExporting}
                onClick={handleGeneratePdf}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {isExporting ? (
                  <LoadingSpinner label="Building PDF..." />
                ) : (
                  <>
                    <Download className="w-4 h-4" aria-hidden="true" />
                    Generate PDF
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Reset
              </button>
            </div>
          </div>

          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {images.length} {images.length === 1 ? 'image' : 'images'} queued · Will generate a {images.length}-page PDF
          </p>

          <ul className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C]">
            {images.map((item, idx) => (
              <li key={item.id} className="flex items-center justify-between gap-3 p-3.5">
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="font-mono text-xs text-slate-400 w-5 shrink-0">
                    {idx + 1}.
                  </span>
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#111827] dark:text-white truncate">
                      {item.file.name}
                    </p>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {item.width} × {item.height} px · {formatBytes(item.file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, -1)}
                    aria-label={`Move ${item.file.name} up`}
                    className="p-2 rounded-lg text-slate-500 hover:text-[#111827] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                  >
                    <ArrowUp className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === images.length - 1}
                    onClick={() => moveItem(idx, 1)}
                    aria-label={`Move ${item.file.name} down`}
                    className="p-2 rounded-lg text-slate-500 hover:text-[#111827] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                  >
                    <ArrowDown className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.file.name}`}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
