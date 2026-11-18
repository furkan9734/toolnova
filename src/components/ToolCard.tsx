import { Link } from 'react-router-dom';
import { Star, ArrowRight } from 'lucide-react';
import type { ToolDefinition } from '../data/toolsRegistry';
import { ToolIcon } from './ToolIcon';

interface ToolCardProps {
  tool: ToolDefinition;
  isFavorite: boolean;
  onToggleFavorite: (slug: string) => void;
}

export function ToolCard({ tool, isFavorite, onToggleFavorite }: ToolCardProps) {
  return (
    <article className="group relative flex flex-col justify-between p-5 rounded-xl bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 hover:border-[#635BFF]/60 dark:hover:border-[#8B5CF6]/60 transition-colors">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <Link
            to={`/tools/${tool.slug}`}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#635BFF]/10 dark:bg-[#635BFF]/20 text-[#635BFF] dark:text-[#8B5CF6] shrink-0"
            tabIndex={-1}
            aria-hidden="true"
          >
            <ToolIcon name={tool.iconName} className="w-5 h-5" />
          </Link>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(tool.slug);
            }}
            aria-label={isFavorite ? `Remove ${tool.name} from favorites` : `Save ${tool.name} to favorites`}
            aria-pressed={isFavorite}
            className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635BFF] ${
              isFavorite
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Star
              className={`w-4 h-4 ${isFavorite ? 'fill-amber-500' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>

        <Link
          to={`/tools/${tool.slug}`}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635BFF] rounded"
        >
          <h3 className="font-display text-base font-semibold text-[#111827] dark:text-white group-hover:text-[#635BFF] dark:group-hover:text-[#8B5CF6] transition-colors">
            {tool.name}
          </h3>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {tool.shortDescription}
          </p>
        </Link>
      </div>

      <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <span>{tool.categoryLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{tool.processingMode}</span>
        </div>
        <Link
          to={`/tools/${tool.slug}`}
          className="inline-flex items-center gap-1 font-medium text-[#635BFF] dark:text-[#8B5CF6] whitespace-nowrap shrink-0 hover:underline"
        >
          Open
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
