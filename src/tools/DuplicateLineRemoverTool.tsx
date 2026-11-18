import { useState, useMemo } from 'react';
import { Copy, Trash2, Sparkles } from 'lucide-react';
import { removeDuplicateLines, type DuplicateLineOptions } from '../utils/textLogic';
import { copyToClipboard } from '../utils/download';
import { useToast } from '../hooks/useToast';

const SAMPLE_LINES = `apple
banana
orange
apple
grape
banana
kiwi
orange`;

export default function DuplicateLineRemoverTool() {
  const { showToast } = useToast();

  const [input, setInput] = useState('');
  const [options, setOptions] = useState<DuplicateLineOptions>({
    caseSensitive: true,
    trimBeforeCompare: true,
    ignoreBlankLines: false,
  });

  const result = useMemo(() => removeDuplicateLines(input, options), [input, options]);

  const handleCopy = async () => {
    if (!result.output) return;
    const ok = await copyToClipboard(result.output);
    if (ok) showToast('Deduplicated lines copied', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Options & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-7 flex flex-wrap gap-3">
          {(
            [
              { key: 'caseSensitive', label: 'Case-sensitive' },
              { key: 'trimBeforeCompare', label: 'Trim line whitespace' },
              { key: 'ignoreBlankLines', label: 'Remove blank lines' },
            ] as const
          ).map((item) => (
            <label
              key={item.key}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#10131C] cursor-pointer text-xs sm:text-sm text-[#111827] dark:text-slate-200"
            >
              <input
                type="checkbox"
                checked={options[item.key]}
                onChange={() =>
                  setOptions((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                }
                className="w-4 h-4 rounded border-slate-300 text-[#635BFF] focus:ring-[#635BFF]"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>

        <div className="md:col-span-5 grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Input Lines</p>
            <p className="font-mono text-base font-semibold text-[#111827] dark:text-white">
              {result.originalLineCount}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Unique Kept</p>
            <p className="font-mono text-base font-semibold text-[#22C55E]">
              {result.keptLineCount}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Removed</p>
            <p className="font-mono text-base font-semibold text-[#635BFF] dark:text-[#8B5CF6]">
              {result.removedCount}
            </p>
          </div>
        </div>
      </div>

      {/* Dual Textareas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="dedupe-input" className="text-sm font-medium text-[#111827] dark:text-slate-200">
              Original List (One Item per Line)
            </label>
            <button
              type="button"
              onClick={() => setInput(SAMPLE_LINES)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#635BFF] dark:text-[#8B5CF6] hover:underline"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Insert Sample
            </button>
          </div>
          <textarea
            id="dedupe-input"
            rows={10}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste lines to deduplicate..."
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] font-mono text-sm text-[#111827] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="dedupe-output" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
            Unique Lines (Original Order Preserved)
          </label>
          <textarea
            id="dedupe-output"
            rows={10}
            readOnly
            value={result.output}
            placeholder="Unique lines will appear here..."
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#10131C] font-mono text-sm text-[#111827] dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2.5">
        <button
          type="button"
          disabled={!input}
          onClick={() => setInput('')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:text-rose-600 disabled:opacity-40"
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
          Reset
        </button>
        <button
          type="button"
          disabled={!result.output}
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-40 transition-colors"
        >
          <Copy className="w-4 h-4" aria-hidden="true" />
          Copy Unique Lines
        </button>
      </div>
    </div>
  );
}
