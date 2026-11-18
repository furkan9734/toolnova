import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShieldCheck, ChevronRight } from 'lucide-react';
import { TOOLS_REGISTRY, type ToolDefinition } from '../data/toolsRegistry';
import { ToolIcon } from './ToolIcon';
import { ToolCard } from './ToolCard';

interface ToolWorkspaceProps {
  tool: ToolDefinition;
  isFavorite: (slug: string) => boolean;
  onToggleFavorite: (slug: string) => void;
  children: React.ReactNode;
}

export function ToolWorkspace({
  tool,
  isFavorite,
  onToggleFavorite,
  children,
}: ToolWorkspaceProps) {
  const favorited = isFavorite(tool.slug);
  const relatedTools = TOOLS_REGISTRY.filter(
    (t) => t.slug !== tool.slug && t.category === tool.category
  ).concat(
    TOOLS_REGISTRY.filter((t) => t.slug !== tool.slug && t.category !== tool.category)
  ).slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
      {/* Breadcrumb & Tool Header */}
      <div className="space-y-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:text-[#111827] dark:hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          <Link to="/tools" className="hover:text-[#111827] dark:hover:text-white transition-colors">
            Tools
          </Link>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="text-[#111827] dark:text-slate-200 font-medium truncate">
            {tool.name}
          </span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#635BFF]/10 dark:bg-[#635BFF]/20 text-[#635BFF] dark:text-[#8B5CF6] flex items-center justify-center shrink-0">
              <ToolIcon name={tool.iconName} className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] dark:text-white">
                {tool.name}
              </h1>
              <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl">
                {tool.description}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{tool.categoryLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{tool.acceptedInputs}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-[#22C55E] font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  {tool.processingMode}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleFavorite(tool.slug)}
            aria-pressed={favorited}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635BFF] ${
              favorited
                ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Star
              className={`w-4 h-4 ${favorited ? 'fill-amber-500 text-amber-500' : ''}`}
              aria-hidden="true"
            />
            {favorited ? 'Saved to Favorites' : 'Favorite Tool'}
          </button>
        </div>
      </div>

      {/* Main Tool Workbench */}
      <section
        aria-label={`${tool.name} workspace`}
        className="rounded-2xl bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 p-5 sm:p-7"
      >
        {children}
      </section>

      {/* How to Use Instructions */}
      {tool.instructions.length > 0 && (
        <section
          aria-labelledby="how-to-use-heading"
          className="rounded-2xl bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="how-to-use-heading"
              className="font-display text-base font-semibold text-[#111827] dark:text-white"
            >
              How to Use {tool.name}
            </h2>
            <Link
              to={`/tools?category=${tool.category}`}
              className="text-xs font-medium text-[#635BFF] dark:text-[#8B5CF6] hover:underline"
            >
              Browse all {tool.categoryLabel}
            </Link>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-400">
            {tool.instructions.map((step, index) => (
              <li key={index} className="flex items-start gap-2.5">
                <span className="font-mono text-xs font-semibold text-[#635BFF] dark:text-[#8B5CF6] mt-0.5 shrink-0">
                  0{index + 1}.
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Related Tools */}
      <section aria-labelledby="related-tools-heading" className="pt-2 space-y-5">
        <div className="flex items-center justify-between">
          <h2
            id="related-tools-heading"
            className="font-display text-lg font-semibold text-[#111827] dark:text-white"
          >
            Related Tools
          </h2>
          <Link
            to="/tools"
            className="text-sm font-medium text-[#635BFF] dark:text-[#8B5CF6] hover:underline"
          >
            View all {TOOLS_REGISTRY.length} tools
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {relatedTools.map((rel) => (
            <ToolCard
              key={rel.slug}
              tool={rel}
              isFavorite={isFavorite(rel.slug)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
