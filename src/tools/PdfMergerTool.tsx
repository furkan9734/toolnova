import { useState } from 'react';
import { ArrowUp, ArrowDown, Trash2, Download, FileText, Layers } from 'lucide-react';
import { FileDropzone } from '../components/FileDropzone';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { validatePdfFile } from '../utils/fileValidation';
import { inspectPdfFile, mergePdfFiles } from '../utils/pdfLogic';
import { formatBytes } from '../utils/formatters';
import { downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

interface QueuedPdf {
  id: string;
  file: File;
  pageCount: number;
}

export default function PdfMergerTool() {
  const { showToast } = useToast();

  const [pdfs, setPdfs] = useState<QueuedPdf[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

  const handleFilesSelected = async (files: File[]) => {
    setError(null);
    setIsValidating(true);
    const added: QueuedPdf[] = [];

    try {
      for (const file of files) {
        const validation = await validatePdfFile(file);
        if (!validation.valid) {
          setError(validation.error || `Invalid PDF file: ${file.name}`);
          continue;
        }

        try {
          const meta = await inspectPdfFile(file);
          added.push({
            id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            file,
            pageCount: meta.pageCount,
          });
        } catch {
          setError(`"${file.name}" appears encrypted or corrupted and cannot be merged.`);
        }
      }

      if (added.length > 0) {
        setPdfs((prev) => [...prev, ...added]);
        showToast(
          `Added ${added.length} PDF ${added.length === 1 ? 'document' : 'documents'}`,
          'info'
        );
      }
    } finally {
      setIsValidating(false);
    }
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= pdfs.length) return;
    setPdfs((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const removeItem = (id: string) => {
    setPdfs((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMerge = async () => {
    if (pdfs.length < 2) {
      setError('Add at least 2 PDF files to merge them together.');
      return;
    }

    setError(null);
    setIsMerging(true);

    try {
      const { blob, totalPages } = await mergePdfFiles(pdfs.map((p) => p.file));
      downloadBlob(blob, `toolnova-merged-${Date.now()}.pdf`);
      showToast(
        'PDF documents merged',
        'success',
        `${totalPages} total pages (${formatBytes(blob.size)}) downloaded.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to merge PDF files.';
      setError(msg);
      showToast('Merge failed', 'error', msg);
    } finally {
      setIsMerging(false);
    }
  };

  const totalPages = pdfs.reduce((sum, item) => sum + item.pageCount, 0);
  const totalSize = pdfs.reduce((sum, item) => sum + item.file.size, 0);

  return (
    <div className="space-y-6">
      <FileDropzone
        accept=".pdf,application/pdf"
        multiple
        label="Add PDF files to merge"
        hint="Select two or more unencrypted PDF documents (up to 50 MB each). Reorder them below before merging."
        error={error}
        disabled={isValidating || isMerging}
        onFilesSelected={handleFilesSelected}
      />

      {isValidating && (
        <div className="flex justify-center py-2">
          <LoadingSpinner label="Validating PDF documents..." />
        </div>
      )}

      {pdfs.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-5 h-5" aria-hidden="true" />}
          title="No PDF files queued"
          description="Upload at least two PDF documents above to arrange their page order and combine them."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600 dark:text-slate-300 font-mono">
              {pdfs.length} {pdfs.length === 1 ? 'file' : 'files'} · {totalPages} pages · {formatBytes(totalSize)}
            </p>
            <button
              type="button"
              onClick={() => setPdfs([])}
              className="text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
            >
              Clear Queue
            </button>
          </div>

          <ul className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#10131C]">
            {pdfs.map((item, idx) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs text-slate-400 w-5 shrink-0">
                    {idx + 1}.
                  </span>
                  <FileText className="w-4 h-4 text-[#635BFF] shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#111827] dark:text-white truncate">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'} · {formatBytes(item.file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, -1)}
                    aria-label={`Move ${item.file.name} up`}
                    className="p-2 rounded-lg text-slate-500 hover:text-[#111827] dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUp className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === pdfs.length - 1}
                    onClick={() => moveItem(idx, 1)}
                    aria-label={`Move ${item.file.name} down`}
                    className="p-2 rounded-lg text-slate-500 hover:text-[#111827] dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
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

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Files are combined in top-to-bottom order directly on your device.
            </p>
            <button
              type="button"
              disabled={pdfs.length < 2 || isMerging}
              onClick={handleMerge}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isMerging ? (
                <LoadingSpinner label="Merging PDFs..." />
              ) : (
                <>
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Merge & Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
