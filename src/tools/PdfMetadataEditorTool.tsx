import { useState } from 'react';
import { Download, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FileDropzone } from '../components/FileDropzone';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { validatePdfFile } from '../utils/fileValidation';
import {
  readPdfMetadata,
  updatePdfMetadata,
  type PdfMetadataFields,
  type PdfMetadataInspection,
} from '../utils/pdfAdvancedLogic';
import { formatBytes, stripExtension, sanitizeFilename } from '../utils/formatters';
import { downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

export default function PdfMetadataEditorTool() {
  const { showToast } = useToast();

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [inspection, setInspection] = useState<PdfMetadataInspection | null>(null);
  const [fields, setFields] = useState<PdfMetadataFields>({
    title: '',
    author: '',
    subject: '',
    keywords: '',
    creator: '',
    producer: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
      const info = await readPdfMetadata(file);
      setSourceFile(file);
      setInspection(info);
      setFields({
        title: info.title,
        author: info.author,
        subject: info.subject,
        keywords: info.keywords,
        creator: info.creator,
        producer: info.producer,
      });
    } catch {
      setError(`Could not read metadata from "${file.name}". Encrypted PDFs are not supported.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePdf = async () => {
    if (!sourceFile) return;
    setError(null);
    setIsSaving(true);
    try {
      const { blob, pageCount } = await updatePdfMetadata(sourceFile, fields);
      const base = sanitizeFilename(stripExtension(sourceFile.name));
      downloadBlob(blob, `${base}-metadata.pdf`);
      showToast(
        'Updated PDF downloaded',
        'success',
        `${pageCount} pages preserved (${formatBytes(blob.size)})`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save PDF metadata.';
      setError(msg);
      showToast('Save failed', 'error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSourceFile(null);
    setInspection(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {!sourceFile || !inspection ? (
        <div className="space-y-4">
          <FileDropzone
            accept=".pdf,application/pdf"
            label="Drop a PDF to inspect and edit document metadata"
            hint="Edit Title, Author, Subject, Keywords, Creator, and Producer while preserving every page cleanly."
            error={error}
            disabled={isLoading}
            onFilesSelected={handleFilesSelected}
          />
          {isLoading && (
            <div className="flex justify-center py-2">
              <LoadingSpinner label="Reading PDF Info Dictionary..." />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* File summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-sm font-semibold text-[#111827] dark:text-white truncate max-w-md">
                {sourceFile.name}
              </p>
              <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                {inspection.pageCount} pages · {formatBytes(sourceFile.size)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 hover:text-rose-600"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                New PDF
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSavePdf}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-50"
              >
                {isSaving ? (
                  <LoadingSpinner label="Saving..." />
                ) : (
                  <>
                    <Download className="w-4 h-4" aria-hidden="true" />
                    Save & Download PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Supported Editable Fields */}
            <div className="lg:col-span-7 space-y-4 p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#111827] dark:text-white">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" aria-hidden="true" />
                <h2>Supported PDF Metadata Fields</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="pdf-meta-title" className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                    Title
                  </label>
                  <input
                    id="pdf-meta-title"
                    type="text"
                    value={fields.title}
                    onChange={(e) => setFields((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Document title"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="pdf-meta-author" className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                    Author
                  </label>
                  <input
                    id="pdf-meta-author"
                    type="text"
                    value={fields.author}
                    onChange={(e) => setFields((f) => ({ ...f, author: e.target.value }))}
                    placeholder="Author name"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="pdf-meta-subject" className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                    Subject
                  </label>
                  <input
                    id="pdf-meta-subject"
                    type="text"
                    value={fields.subject}
                    onChange={(e) => setFields((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="Subject or topic"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="pdf-meta-keywords" className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                    Keywords (comma-separated)
                  </label>
                  <input
                    id="pdf-meta-keywords"
                    type="text"
                    value={fields.keywords}
                    onChange={(e) => setFields((f) => ({ ...f, keywords: e.target.value }))}
                    placeholder="invoice, 2025, quarterly report"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="pdf-meta-creator" className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                    Creator Application
                  </label>
                  <input
                    id="pdf-meta-creator"
                    type="text"
                    value={fields.creator}
                    onChange={(e) => setFields((f) => ({ ...f, creator: e.target.value }))}
                    placeholder="e.g. LibreOffice, Word"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="pdf-meta-producer" className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                    PDF Producer
                  </label>
                  <input
                    id="pdf-meta-producer"
                    type="text"
                    value={fields.producer}
                    onChange={(e) => setFields((f) => ({ ...f, producer: e.target.value }))}
                    placeholder="e.g. ToolNova PDF Engine"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Read-only Timestamps & Unsupported Fields Disclosure */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="font-display text-sm font-semibold text-[#111827] dark:text-white">
                  Read-Only Document Timestamps
                </h3>
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500 dark:text-slate-400">Created</dt>
                    <dd className="font-mono text-[#111827] dark:text-slate-200">
                      {inspection.creationDate
                        ? new Date(inspection.creationDate).toLocaleString()
                        : 'Not recorded'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500 dark:text-slate-400">Last Modified</dt>
                    <dd className="font-mono text-[#111827] dark:text-slate-200">
                      {inspection.modificationDate
                        ? new Date(inspection.modificationDate).toLocaleString()
                        : 'Not recorded'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="p-5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-2.5">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <h3>Unsupported Metadata Fields</h3>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
                  Your PDF pages and visual content are preserved verbatim, while the following metadata structures cannot be edited by this client-side writer:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-xs text-amber-800 dark:text-amber-300/90">
                  {inspection.unsupportedFields.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
