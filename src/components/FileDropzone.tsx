import React, { useId, useState, useRef } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';

interface FileDropzoneProps {
  accept: string;
  multiple?: boolean;
  label: string;
  hint: string;
  error?: string | null;
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
}

export function FileDropzone({
  accept,
  multiple = false,
  label,
  hint,
  error,
  disabled = false,
  onFilesSelected,
}: FileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    onFilesSelected(Array.from(fileList));
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center text-center px-6 py-10 rounded-xl border-2 border-dashed transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-[#635BFF] ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        } ${
          isDragging
            ? 'border-[#635BFF] bg-[#635BFF]/5 dark:bg-[#635BFF]/10'
            : error
            ? 'border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-950/20'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-[#131722] hover:border-[#635BFF]/60 dark:hover:border-[#8B5CF6]/60'
        }`}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
          className="sr-only"
        />
        <div className="w-11 h-11 rounded-lg bg-[#635BFF]/10 dark:bg-[#635BFF]/20 text-[#635BFF] dark:text-[#8B5CF6] flex items-center justify-center mb-3">
          <UploadCloud className="w-5 h-5" aria-hidden="true" />
        </div>
        <span className="font-display text-sm font-semibold text-[#111827] dark:text-white">
          {label}
        </span>
        <span className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md">
          {hint}
        </span>
        <span className="mt-4 inline-flex items-center px-4 py-2 rounded-lg text-xs font-medium bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-700 text-[#111827] dark:text-slate-200">
          Choose {multiple ? 'Files' : 'File'}
        </span>
      </label>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-xs text-rose-700 dark:text-rose-300"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
