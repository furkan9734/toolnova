import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { TOOLS_REGISTRY } from '../data/toolsRegistry';

export default function NotFoundPage() {
  useDocumentMeta('Page Not Found | ToolNova', 'The requested page could not be found on ToolNova.');

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-24 text-center space-y-5">
      <p className="font-mono text-sm font-semibold text-[#635BFF] dark:text-[#8B5CF6]">404</p>
      <h1 className="font-display text-3xl font-bold tracking-tight text-[#111827] dark:text-white">
        Page not found
      </h1>
      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
        The route you visited does not exist or may have moved. Jump back to the homepage or browse all {TOOLS_REGISTRY.length} tools.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Home
        </Link>
        <Link
          to="/tools"
          className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-[#111827] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          View All Tools
        </Link>
      </div>
    </div>
  );
}
