import { useState, useCallback } from 'react';
import { Dices, Copy, Check } from 'lucide-react';
import { generateRandomNumbers } from '../utils/productivityLogic';
import { copyToClipboard } from '../utils/download';
import { useToast } from '../hooks/useToast';

export default function RandomNumberGeneratorTool() {
  const { showToast } = useToast();

  const [minStr, setMinStr] = useState('1');
  const [maxStr, setMaxStr] = useState('100');
  const [countStr, setCountStr] = useState('5');
  const [unique, setUnique] = useState(true);
  const [sort, setSort] = useState<'none' | 'asc' | 'desc'>('none');

  const [numbers, setNumbers] = useState<number[]>(() =>
    generateRandomNumbers({ min: 1, max: 100, count: 5, unique: true, sort: 'none' })
  );
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = useCallback(() => {
    setError(null);
    try {
      const result = generateRandomNumbers({
        min: Number(minStr),
        max: Number(maxStr),
        count: Number(countStr),
        unique,
        sort,
      });
      setNumbers(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to generate numbers.');
    }
  }, [minStr, maxStr, countStr, unique, sort]);

  const handleCopyAll = async () => {
    if (numbers.length === 0) return;
    const ok = await copyToClipboard(numbers.join(', '));
    if (ok) showToast('Generated numbers copied', 'success');
  };

  const handleCopySingle = async (val: number, idx: number) => {
    const ok = await copyToClipboard(String(val));
    if (ok) {
      setCopiedIndex(idx);
      showToast(`Copied ${val}`, 'success');
      window.setTimeout(() => setCopiedIndex(null), 1200);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="rng-min" className="block text-xs font-medium text-[#111827] dark:text-slate-200">
              Minimum Value
            </label>
            <input
              id="rng-min"
              type="number"
              step="1"
              value={minStr}
              onChange={(e) => setMinStr(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-sm text-[#111827] dark:text-white tabular-nums"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="rng-max" className="block text-xs font-medium text-[#111827] dark:text-slate-200">
              Maximum Value
            </label>
            <input
              id="rng-max"
              type="number"
              step="1"
              value={maxStr}
              onChange={(e) => setMaxStr(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-sm text-[#111827] dark:text-white tabular-nums"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="rng-count" className="block text-xs font-medium text-[#111827] dark:text-slate-200">
              Quantity (1–500)
            </label>
            <input
              id="rng-count"
              type="number"
              min={1}
              max={500}
              step="1"
              value={countStr}
              onChange={(e) => setCountStr(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-sm text-[#111827] dark:text-white tabular-nums"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="rng-sort" className="block text-xs font-medium text-[#111827] dark:text-slate-200">
              Result Order
            </label>
            <select
              id="rng-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as 'none' | 'asc' | 'desc')}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white"
            >
              <option value="none">Random Draw Order</option>
              <option value="asc">Ascending (Low → High)</option>
              <option value="desc">Descending (High → Low)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <label className="flex items-center gap-2 text-xs sm:text-sm text-[#111827] dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={unique}
              onChange={(e) => setUnique(e.target.checked)}
              className="rounded border-slate-300 text-[#635BFF] focus:ring-[#635BFF]"
            />
            Require unique numbers (no duplicates)
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopyAll}
              disabled={numbers.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 disabled:opacity-40"
            >
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              Copy All
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#534AE8]"
            >
              <Dices className="w-4 h-4" aria-hidden="true" />
              Generate Numbers
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-sm text-rose-700 dark:text-rose-300"
        >
          {error}
        </div>
      )}

      {/* Results */}
      <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Cryptographic Output (Web Crypto API)</span>
          <span className="font-mono">{numbers.length} values</span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {numbers.map((num, idx) => (
            <button
              key={`${idx}-${num}`}
              type="button"
              onClick={() => handleCopySingle(num, idx)}
              title="Click to copy number"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-lg font-bold text-[#111827] dark:text-white hover:border-[#635BFF] transition-colors tabular-nums"
            >
              <span>{num}</span>
              {copiedIndex === idx ? (
                <Check className="w-3.5 h-3.5 text-[#22C55E]" aria-hidden="true" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
