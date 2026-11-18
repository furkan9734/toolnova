import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  ChevronDown,
  Star,
  Clock,
  Check,
} from 'lucide-react';
import {
  TOOLS_REGISTRY,
  POPULAR_TOOLS,
  TOOL_CATEGORIES,
  HOMEPAGE_FAQS,
  type ToolCategoryId,
} from '../data/toolsRegistry';
import { ToolCard } from '../components/ToolCard';
import { EmptyState } from '../components/EmptyState';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

interface HomePageProps {
  recentSlugs: string[];
  favoriteSlugs: string[];
  isFavorite: (slug: string) => boolean;
  onToggleFavorite: (slug: string) => void;
}

export default function HomePage({
  recentSlugs,
  favoriteSlugs,
  isFavorite,
  onToggleFavorite,
}: HomePageProps) {
  useDocumentMeta(
    'ToolNova – All-in-One Online Tools',
    'Every tool you need in one place. Compress images, merge PDFs, generate QR codes, count words, and calculate percentages privately in your browser.'
  );

  const [heroSearch, setHeroSearch] = useState('');
  const [directoryCategory, setDirectoryCategory] = useState<ToolCategoryId>('all');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const searchMatches = useMemo(() => {
    const q = heroSearch.trim().toLowerCase();
    if (!q) return [];
    return TOOLS_REGISTRY.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.shortDescription.toLowerCase().includes(q) ||
        t.categoryLabel.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.includes(q))
    );
  }, [heroSearch]);

  const directoryTools = useMemo(() => {
    return TOOLS_REGISTRY.filter((t) => {
      const matchesCat = directoryCategory === 'all' || t.category === directoryCategory;
      const q = heroSearch.trim().toLowerCase();
      const matchesQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.shortDescription.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.includes(q));
      return matchesCat && matchesQuery;
    });
  }, [directoryCategory, heroSearch]);

  const recentTools = useMemo(
    () =>
      recentSlugs
        .map((slug) => TOOLS_REGISTRY.find((t) => t.slug === slug))
        .filter((t): t is NonNullable<typeof t> => Boolean(t)),
    [recentSlugs]
  );

  const favoriteTools = useMemo(
    () =>
      favoriteSlugs
        .map((slug) => TOOLS_REGISTRY.find((t) => t.slug === slug))
        .filter((t): t is NonNullable<typeof t> => Boolean(t)),
    [favoriteSlugs]
  );

  return (
    <div className="space-y-16 sm:space-y-20 pb-10">
      {/* Hero Section & Main Search */}
      <section className="pt-10 sm:pt-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <p className="text-xs sm:text-sm font-medium text-[#635BFF] dark:text-[#8B5CF6]">
            Browser-Native Utilities · {TOOLS_REGISTRY.length} Free Tools · Zero Server Uploads
          </p>

          <h1
            className="font-display font-extrabold tracking-tight text-[#111827] dark:text-white leading-[1.1] mx-auto max-w-3xl"
            style={{ fontSize: 'clamp(2.25rem, 4.5vw, 3.75rem)', textWrap: 'balance' }}
          >
            Every Tool You Need. One Place.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Compress images, merge PDFs, build QR codes, format text, and generate cryptographic passwords directly on your device with instant results.
          </p>

          {/* Main Tool Search */}
          <div className="relative max-w-xl mx-auto pt-2">
            <label htmlFor="home-tool-search" className="sr-only">
              Search ToolNova utilities
            </label>
            <div className="relative flex items-center">
              <Search
                className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="home-tool-search"
                type="search"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search tools (e.g. QR code, compress, PDF, password)..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm sm:text-base text-[#111827] dark:text-white placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
              />
            </div>

            {/* Live Instant Search Dropdown */}
            {heroSearch.trim() !== '' && (
              <div className="absolute left-0 right-0 mt-2 rounded-xl bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 shadow-xl z-20 text-left overflow-hidden">
                {searchMatches.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                    No matching tools for &ldquo;{heroSearch}&rdquo;.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                    {searchMatches.map((tool) => (
                      <li key={tool.slug}>
                        <Link
                          to={`/tools/${tool.slug}`}
                          className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#111827] dark:text-white">
                              {tool.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {tool.shortDescription}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-[#635BFF] dark:text-[#8B5CF6] shrink-0">
                            Open
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/tools"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#534AE8] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635BFF]"
            >
              Browse All {TOOLS_REGISTRY.length} Tools
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171B26] text-[#111827] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Compare Free & Premium
            </Link>
          </div>
        </div>
      </section>

      {/* Saved Favorites & Recently Used (only rendered when user has history) */}
      {(favoriteTools.length > 0 || recentTools.length > 0) && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {favoriteTools.length > 0 && (
              <div className="p-5 rounded-xl bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#111827] dark:text-white">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" aria-hidden="true" />
                  <h2>Your Favorites</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {favoriteTools.map((tool) => (
                    <Link
                      key={tool.slug}
                      to={`/tools/${tool.slug}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 text-[#111827] dark:text-slate-200 hover:border-[#635BFF] transition-colors"
                    >
                      {tool.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {recentTools.length > 0 && (
              <div className="p-5 rounded-xl bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#111827] dark:text-white">
                  <Clock className="w-4 h-4 text-[#635BFF]" aria-hidden="true" />
                  <h2>Recently Used</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentTools.map((tool) => (
                    <Link
                      key={tool.slug}
                      to={`/tools/${tool.slug}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 text-[#111827] dark:text-slate-200 hover:border-[#635BFF] transition-colors"
                    >
                      {tool.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Popular Tools */}
      <section aria-labelledby="popular-tools-heading" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2
              id="popular-tools-heading"
              className="font-display text-2xl font-bold tracking-tight text-[#111827] dark:text-white"
            >
              Popular Tools
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Everyday utilities opened most frequently by creators, developers, and teams.
            </p>
          </div>
          <Link
            to="/tools"
            className="text-sm font-medium text-[#635BFF] dark:text-[#8B5CF6] hover:underline whitespace-nowrap"
          >
            Explore directory
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {POPULAR_TOOLS.map((tool) => (
            <ToolCard
              key={tool.slug}
              tool={tool}
              isFavorite={isFavorite(tool.slug)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </section>

      {/* Tool Categories */}
      <section aria-labelledby="categories-heading" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div>
          <h2
            id="categories-heading"
            className="font-display text-2xl font-bold tracking-tight text-[#111827] dark:text-white"
          >
            Tool Categories
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Organized workflows across imaging, documents, writing, security, and calculations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOL_CATEGORIES.map((category, idx) => {
            const count = TOOLS_REGISTRY.filter((t) => t.category === category.id).length;
            return (
              <Link
                key={category.id}
                to={`/tools?category=${category.id}`}
                className="group p-5 rounded-xl bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 hover:border-[#635BFF]/60 dark:hover:border-[#8B5CF6]/60 transition-colors flex flex-col justify-between"
              >
                <div>
                  <span className="font-mono text-xs text-slate-400">
                    0{idx + 1}.
                  </span>
                  <h3 className="mt-1.5 font-display text-base font-semibold text-[#111827] dark:text-white group-hover:text-[#635BFF] dark:group-hover:text-[#8B5CF6] transition-colors">
                    {category.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {category.description}
                  </p>
                </div>
                <p className="mt-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                  {count} {count === 1 ? 'tool' : 'tools'}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* All Tools Directory */}
      <section aria-labelledby="directory-heading" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2
              id="directory-heading"
              className="font-display text-2xl font-bold tracking-tight text-[#111827] dark:text-white"
            >
              All Tools Directory
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Filter by category or use the search bar above to jump directly into any workspace.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filter directory by category"
            className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#171B26] border border-slate-200 dark:border-slate-800"
          >
            <button
              type="button"
              role="tab"
              aria-selected={directoryCategory === 'all'}
              onClick={() => setDirectoryCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                directoryCategory === 'all'
                  ? 'bg-white dark:bg-[#10131C] text-[#111827] dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              All ({TOOLS_REGISTRY.length})
            </button>
            {TOOL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={directoryCategory === cat.id}
                onClick={() => setDirectoryCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  directoryCategory === cat.id
                    ? 'bg-white dark:bg-[#10131C] text-[#111827] dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {directoryTools.length === 0 ? (
          <EmptyState
            icon={<Search className="w-5 h-5" aria-hidden="true" />}
            title="No tools match your filter"
            description={`Clear the search query or switch back to all categories to view all ${TOOLS_REGISTRY.length} tools.`}
            action={
              <button
                type="button"
                onClick={() => {
                  setHeroSearch('');
                  setDirectoryCategory('all');
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8]"
              >
                Reset Filters
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {directoryTools.map((tool) => (
              <ToolCard
                key={tool.slug}
                tool={tool}
                isFavorite={isFavorite(tool.slug)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        )}
      </section>

      {/* Premium Promotion Section */}
      <section aria-labelledby="premium-promo-heading" className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171B26] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <p className="text-xs font-semibold text-[#635BFF] dark:text-[#8B5CF6]">
              Freemium + Upcoming Pro Workspace
            </p>
            <h2
              id="premium-promo-heading"
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] dark:text-white"
            >
              Built free for everyone. Ready to scale with ToolNova Premium.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
              Every single tool on ToolNova runs free in your browser with standard processing and downloads. Our upcoming Premium tier adds multi-file batch queues, saved export presets, and a clean ad-free interface backed by verified billing.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#534AE8] transition-colors"
              >
                View Plan Comparison
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-700 text-[#111827] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Our Architecture
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-3 p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
            <h3 className="font-display text-sm font-semibold text-[#111827] dark:text-white">
              What stays private & included
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" aria-hidden="true" />
                <span>All {TOOLS_REGISTRY.length} core utilities unlocked with zero account required</span>
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" aria-hidden="true" />
                <span>Files stay in local browser memory — never uploaded</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-[#635BFF] shrink-0 mt-0.5" aria-hidden="true" />
                <span>Planned Premium: batch queues, saved presets, ad-free mode</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section aria-labelledby="faq-heading" className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center space-y-2">
          <h2
            id="faq-heading"
            className="font-display text-2xl font-bold tracking-tight text-[#111827] dark:text-white"
          >
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Straightforward answers about browser privacy, mobile support, and ToolNova plans.
          </p>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171B26] overflow-hidden">
          {HOMEPAGE_FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div key={faq.question}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#635BFF]"
                >
                  <span className="font-display text-sm sm:text-base font-semibold text-[#111827] dark:text-white">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
