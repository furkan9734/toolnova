import { useState } from 'react';
import { Copy } from 'lucide-react';
import {
  calcPercentOf,
  calcPercentIncrease,
  calcPercentDecrease,
  calcPercentDifference,
  type PercentageResult,
} from '../utils/percentageLogic';
import { formatNumber } from '../utils/formatters';
import { copyToClipboard } from '../utils/download';
import { useToast } from '../hooks/useToast';

type CalcMode = 'percentOf' | 'increase' | 'decrease' | 'difference';

export default function PercentageCalculatorTool() {
  const { showToast } = useToast();

  const [mode, setMode] = useState<CalcMode>('percentOf');
  const [valA, setValA] = useState<string>('25');
  const [valB, setValB] = useState<string>('200');

  const numA = Number(valA);
  const numB = Number(valB);
  const inputsValid = valA.trim() !== '' && valB.trim() !== '' && Number.isFinite(numA) && Number.isFinite(numB);

  let result: PercentageResult | null = null;
  if (inputsValid) {
    if (mode === 'percentOf') result = calcPercentOf(numA, numB);
    else if (mode === 'increase') result = calcPercentIncrease(numA, numB);
    else if (mode === 'decrease') result = calcPercentDecrease(numA, numB);
    else result = calcPercentDifference(numA, numB);
  }

  const handleCopy = async () => {
    if (!result) return;
    const formatted =
      mode === 'difference' ? `${formatNumber(result.value, 4)}%` : formatNumber(result.value, 6);
    const ok = await copyToClipboard(formatted);
    if (ok) showToast('Result copied to clipboard', 'success', formatted);
  };

  const tabs: { id: CalcMode; label: string }[] = [
    { id: 'percentOf', label: '% of a Number' },
    { id: 'increase', label: '% Increase' },
    { id: 'decrease', label: '% Decrease' },
    { id: 'difference', label: '% Difference' },
  ];

  const getFieldLabels = (): { first: string; second: string } => {
    switch (mode) {
      case 'percentOf':
        return { first: 'Percentage (%)', second: 'Base Number' };
      case 'increase':
        return { first: 'Starting Value', second: 'Increase By (%)' };
      case 'decrease':
        return { first: 'Starting Value', second: 'Decrease By (%)' };
      case 'difference':
        return { first: 'First Value', second: 'Second Value' };
    }
  };

  const labels = getFieldLabels();

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div
        role="tablist"
        aria-label="Percentage calculation mode"
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={mode === tab.id}
            onClick={() => setMode(tab.id)}
            className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              mode === tab.id
                ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-[#111827] dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Inputs & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#10131C]">
          <div className="space-y-1.5">
            <label htmlFor="pct-a" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
              {labels.first}
            </label>
            <input
              id="pct-a"
              type="number"
              step="any"
              value={valA}
              onChange={(e) => setValA(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-base text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pct-b" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
              {labels.second}
            </label>
            <input
              id="pct-b"
              type="number"
              step="any"
              value={valB}
              onChange={(e) => setValB(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-base text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            />
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col justify-between p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Calculated Result</p>
              <p
                aria-live="polite"
                className="mt-1 font-mono text-3xl font-bold text-[#635BFF] dark:text-[#8B5CF6] tabular-nums"
              >
                {result
                  ? mode === 'difference'
                    ? `${formatNumber(result.value, 4)}%`
                    : formatNumber(result.value, 6)
                  : '—'}
              </p>
            </div>
            <button
              type="button"
              disabled={!result}
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#171B26] text-[#111827] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors shrink-0"
            >
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              Copy
            </button>
          </div>

          {result && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <p className="text-xs text-slate-600 dark:text-slate-300">{result.summary}</p>
              <p className="font-mono text-xs text-slate-500 dark:text-slate-400 break-all">
                {result.formula}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
