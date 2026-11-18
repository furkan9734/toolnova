import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ label = 'Processing...' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2.5 text-sm font-medium text-slate-600 dark:text-slate-300"
    >
      <Loader2 className="w-4 h-4 animate-spin text-[#635BFF]" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
