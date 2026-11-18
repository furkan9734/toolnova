import { useState, useMemo } from 'react';
import { ArrowLeftRight, Trash2, Sparkles } from 'lucide-react';
import { computeLineDiff } from '../utils/diffLogic';
import { EmptyState } from '../components/EmptyState';

const SAMPLE_LEFT = `ToolNova v1
Supports 10 core utilities
Runs in modern browsers
Export PNG images`;

const SAMPLE_RIGHT = `ToolNova v2
Supports 25 browser utilities
Runs in modern browsers
Export PNG, JPG, and WebP images
Includes developer tools`;

export default function TextDiffCheckerTool() {
  const [originalText, setOriginalText] = useState('');
  const [modifiedText, setModifiedText] = useState('');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  const diff = useMemo(
    () => computeLineDiff(originalText, modifiedText, ignoreWhitespace),
    [originalText, modifiedText, ignoreWhitespace]
  );

  const handleSwap = () => {
    setOriginalText(modifiedText);
    setModifiedText(originalText);
  };

  const handleSample = () => {
    setOriginalText(SAMPLE_LEFT);
    setModifiedText(SAMPLE_RIGHT);
  };

  const handleReset = () => {
    setOriginalText('');
    setModifiedText('');
  };

  const hasContent = originalText !== '' || modifiedText !== '';

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-sm text-[#111827] dark:text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={ignoreWhitespace}
            onChange={(e) => setIgnoreWhitespace(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#635BFF] focus:ring-[#635BFF]"
          />
          Ignore leading/trailing whitespace
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#635BFF]" aria-hidden="true" />
            Sample Diff
          </button>
          <button
            type="button"
            disabled={!hasContent}
            onClick={handleSwap}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" aria-hidden="true" />
            Swap Panels
          </button>
          <button
            type="button"
            disabled={!hasContent}
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:text-rose-600 disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>

      {/* Two Text Input Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="diff-left" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
            Original Text
          </label>
          <textarea
            id="diff-left"
            rows={8}
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="Paste original version here..."
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] font-mono text-xs sm:text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="diff-right" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
            Modified Text
          </label>
          <textarea
            id="diff-right"
            rows={8}
            value={modifiedText}
            onChange={(e) => setModifiedText(e.target.value)}
            placeholder="Paste modified version here..."
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] font-mono text-xs sm:text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>
      </div>

      {/* Difference Statistics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60">
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Added Lines</p>
          <p className="font-mono text-xl font-bold text-emerald-700 dark:text-emerald-300">
            +{diff.addedCount}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60">
          <p className="text-xs text-rose-700 dark:text-rose-300">Removed Lines</p>
          <p className="font-mono text-xl font-bold text-rose-700 dark:text-rose-300">
            -{diff.removedCount}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">Unchanged</p>
          <p className="font-mono text-xl font-bold text-[#111827] dark:text-white">
            {diff.unchangedCount}
          </p>
        </div>
      </div>

      {/* Diff Result View */}
      {!hasContent ? (
        <EmptyState
          icon={<ArrowLeftRight className="w-5 h-5" aria-hidden="true" />}
          title="Enter text in both panels"
          description="Paste two versions of text, code, or configuration above to inspect line-by-line additions and removals."
        />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C] overflow-x-auto">
          <div className="min-w-[480px] divide-y divide-slate-100 dark:divide-slate-800/70 font-mono text-xs sm:text-sm">
            {diff.lines.map((line, index) => {
              const rowClass =
                line.type === 'added'
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                  : line.type === 'removed'
                  ? 'bg-rose-50/80 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                  : 'text-slate-700 dark:text-slate-300';

              const marker = line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ';

              return (
                <div key={index} className={`flex items-stretch ${rowClass}`}>
                  <span className="w-10 shrink-0 px-2 py-1.5 text-right text-slate-400 select-none border-r border-slate-200/70 dark:border-slate-800">
                    {line.leftLineNumber ?? ''}
                  </span>
                  <span className="w-10 shrink-0 px-2 py-1.5 text-right text-slate-400 select-none border-r border-slate-200/70 dark:border-slate-800">
                    {line.rightLineNumber ?? ''}
                  </span>
                  <span className="w-7 shrink-0 py-1.5 text-center font-bold select-none">
                    {marker}
                  </span>
                  <span className="flex-1 py-1.5 pr-4 whitespace-pre-wrap break-all">
                    {line.text || ' '}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
