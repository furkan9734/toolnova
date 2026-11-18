import { useState, useMemo } from 'react';
import { Copy, Trash2, Sparkles } from 'lucide-react';
import { cleanText, type TextCleanOptions } from '../utils/textLogic';
import { copyToClipboard } from '../utils/download';
import { useToast } from '../hooks/useToast';

const SAMPLE_DIRTY_TEXT = `   ToolNova    Text   Cleaner   saves   time.   

   Remove   extra   spaces   and    blank lines.


	Tabs   and   trailing   spaces   vanish   cleanly.   `;

export default function TextCleanerTool() {
  const { showToast } = useToast();

  const [input, setInput] = useState('');
  const [options, setOptions] = useState<TextCleanOptions>({
    trimText: true,
    trimEachLine: true,
    removeDuplicateSpaces: true,
    removeBlankLines: true,
    convertTabsToSpaces: true,
  });

  const result = useMemo(() => cleanText(input, options), [input, options]);

  const toggle = (key: keyof TextCleanOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = async () => {
    if (!result.cleaned) return;
    const ok = await copyToClipboard(result.cleaned);
    if (ok) showToast('Cleaned text copied', 'success');
  };

  const handleReset = () => {
    setInput('');
    setOptions({
      trimText: true,
      trimEachLine: true,
      removeDuplicateSpaces: true,
      removeBlankLines: true,
      convertTabsToSpaces: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Cleaning Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {(
          [
            { key: 'removeDuplicateSpaces', label: 'Remove extra spaces' },
            { key: 'removeBlankLines', label: 'Remove blank lines' },
            { key: 'trimEachLine', label: 'Trim each line' },
            { key: 'trimText', label: 'Trim outer edges' },
            { key: 'convertTabsToSpaces', label: 'Tabs to single space' },
          ] as const
        ).map((item) => (
          <label
            key={item.key}
            className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#10131C] cursor-pointer text-xs sm:text-sm text-[#111827] dark:text-slate-200"
          >
            <input
              type="checkbox"
              checked={options[item.key]}
              onChange={() => toggle(item.key)}
              className="w-4 h-4 rounded border-slate-300 text-[#635BFF] focus:ring-[#635BFF]"
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>

      {/* Dual Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="cleaner-input" className="text-sm font-medium text-[#111827] dark:text-slate-200">
              Raw Input
            </label>
            <button
              type="button"
              onClick={() => setInput(SAMPLE_DIRTY_TEXT)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#635BFF] dark:text-[#8B5CF6] hover:underline"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Insert Sample
            </button>
          </div>
          <textarea
            id="cleaner-input"
            rows={10}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste messy text with extra spaces, tabs, or blank lines..."
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] font-mono text-sm text-[#111827] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="cleaner-output" className="text-sm font-medium text-[#111827] dark:text-slate-200">
              Cleaned Output
            </label>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
              {result.removedChars} chars removed
            </span>
          </div>
          <textarea
            id="cleaner-output"
            rows={10}
            readOnly
            value={result.cleaned}
            placeholder="Cleaned text appears here automatically..."
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#10131C] font-mono text-sm text-[#111827] dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {result.originalLength.toLocaleString()} → {result.cleanedLength.toLocaleString()} characters
        </p>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={!input}
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:text-rose-600 disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Reset
          </button>
          <button
            type="button"
            disabled={!result.cleaned}
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-40 transition-colors"
          >
            <Copy className="w-4 h-4" aria-hidden="true" />
            Copy Cleaned Text
          </button>
        </div>
      </div>
    </div>
  );
}
