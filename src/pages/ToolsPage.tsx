import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Star, X } from 'lucide-react';
import {
  TOOLS_REGISTRY,
  TOOL_CATEGORIES,
  type ToolCategoryId,
} from '../data/toolsRegistry';
import { ToolCard } from '../components/ToolCard';
import { EmptyState } from '../components/EmptyState';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

interface ToolsPageProps {
  isFavorite: (slug: string) => boolean;
  onToggleFavorite: (slug: string) => void;
  favoriteSlugs: string[];
}

export default function ToolsPage({
  isFavorite,
  onToggleFavorite,
  favoriteSlugs,
}: ToolsPageProps) {
  useDocumentMeta(
    'All Online Tools – Directory | ToolNova',
    `Browse all ${TOOLS_REGISTRY.length} browser-native ToolNova utilities across images, PDFs, text, developer tools, security, and calculators.`
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const initialCat = (searchParams.get('category') as ToolCategoryId) || 'all';
  const validCat: ToolCategoryId =
    initialCat === 'all' || TOOL_CATEGORIES.some((c) => c.id === initialCat)
      ? initialCat
      : 'all';

  const [selectedCategory, setSelectedCategory] = useState<ToolCategoryId>(validCat);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  useEffect(() => {
    const paramCat = (searchParams.get('category') as ToolCategoryId) || 'all';
    if (paramCat === 'all' || TOOL_CATEGORIES.some((c) => c.id === paramCat)) {
      setSelectedCategory(paramCat);
    }
  }, [searchParams]);

  const handleCategoryChange = (cat: ToolCategoryId) => {
    setSelectedCategory(cat);
    const next = new URLSearchParams(searchParams);
    if (cat === 'all') next.delete('category');
    else next.set('category', cat);
    setSearchParams(next, { replace: true });
  };

  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS_REGISTRY.filter((tool) => {
      if (onlyFavorites && !favoriteSlugs.includes(tool.slug)) return false;
      if (selectedCategory !== 'all' && tool.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.shortDescription.toLowerCase().includes(q) ||
        tool.categoryLabel.toLowerCase().includes(q) ||
        tool.keywords.some((k) => k.includes(q))
      );
    });
  }, [query, selectedCategory, onlyFavorites, favoriteSlugs]);

  const resetFilters = () => {
    setQuery('');
    setOnlyFavorites(false);
    handleCategoryChange('all');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#111827] dark:text-white">
          All Tools
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Fast, private browser utilities. Pick a tool below to start working immediately.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <label htmlFor="directory-search" className="sr-only">
              Filter tools by name or keyword
            </label>
            <input
              id="directory-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter tools by name, format, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            />
          </div>

          <button
            type="button"
            onClick={() => setOnlyFavorites((prev) => !prev)}
            aria-pressed={onlyFavorites}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors whitespace-nowrap shrink-0 ${
              onlyFavorites
                ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Star
              className={`w-4 h-4 ${onlyFavorites ? 'fill-amber-500 text-amber-500' : ''}`}
              aria-hidden="true"
            />
            Favorites ({favoriteSlugs.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Categories"
            className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#171B26] border border-slate-200 dark:border-slate-800"
          >
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategory === 'all'}
              onClick={() => handleCategoryChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-white dark:bg-[#10131C] text-[#111827] dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              All Tools
            </button>
            {TOOL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-white dark:bg-[#10131C] text-[#111827] dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Showing {filteredTools.length} of {TOOLS_REGISTRY.length}
          </p>
        </div>
      </div>

      {/* Results Grid */}
      {filteredTools.length === 0 ? (
        <EmptyState
          icon={<X className="w-5 h-5" aria-hidden="true" />}
          title="No tools found"
          description={
            onlyFavorites
              ? 'You have not saved any matching favorite tools yet.'
              : 'Try adjusting your search keywords or selected category.'
          }
          action={
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8]"
            >
              Clear All Filters
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => (
            <ToolCard
              key={tool.slug}
              tool={tool}
              isFavorite={isFavorite(tool.slug)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
