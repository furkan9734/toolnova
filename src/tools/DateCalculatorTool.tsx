import { useState, useMemo } from 'react';
import { Calendar, Copy } from 'lucide-react';
import {
  calculateDateDifference,
  addOrSubtractDays,
} from '../utils/financeDateLogic';
import { copyToClipboard } from '../utils/download';
import { useToast } from '../hooks/useToast';

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function DateCalculatorTool() {
  const { showToast } = useToast();
  const today = useMemo(() => getTodayIso(), []);

  const [mode, setMode] = useState<'diff' | 'offset'>('diff');

  // Difference mode
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  // Offset mode
  const [baseDate, setBaseDate] = useState(today);
  const [offsetOp, setOffsetOp] = useState<'add' | 'subtract'>('add');
  const [daysCount, setDaysCount] = useState('45');

  const diffOutcome = useMemo(() => {
    if (mode !== 'diff') return null;
    try {
      return { ok: true as const, data: calculateDateDifference(startDate, endDate) };
    } catch (err: unknown) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : 'Enter valid start and end dates.',
      };
    }
  }, [mode, startDate, endDate]);

  const offsetOutcome = useMemo(() => {
    if (mode !== 'offset') return null;
    try {
      return {
        ok: true as const,
        data: addOrSubtractDays(baseDate, Number(daysCount), offsetOp),
      };
    } catch (err: unknown) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : 'Enter a valid date and whole number of days.',
      };
    }
  }, [mode, baseDate, daysCount, offsetOp]);

  const handleCopyResult = async () => {
    if (mode === 'diff' && diffOutcome?.ok) {
      const d = diffOutcome.data;
      const msg = `${d.years} years, ${d.months} months, ${d.days} days (${d.totalDays} total days, ${d.weekdaysCount} weekdays)`;
      const ok = await copyToClipboard(msg);
      if (ok) showToast('Date difference copied', 'success');
    } else if (mode === 'offset' && offsetOutcome?.ok) {
      const msg = `${offsetOutcome.data.weekday}, ${offsetOutcome.data.formattedDate} (${offsetOutcome.data.isoDate})`;
      const ok = await copyToClipboard(msg);
      if (ok) showToast('Resulting date copied', 'success');
    }
  };

  return (
    <div className="space-y-6">
      <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 gap-1">
        <button
          type="button"
          onClick={() => setMode('diff')}
          aria-pressed={mode === 'diff'}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            mode === 'diff'
              ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Difference Between Dates
        </button>
        <button
          type="button"
          onClick={() => setMode('offset')}
          aria-pressed={mode === 'offset'}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            mode === 'offset'
              ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Add / Subtract Days
        </button>
      </div>

      {mode === 'diff' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-4 p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
            <div className="space-y-1.5">
              <label htmlFor="date-start" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Start Date
              </label>
              <input
                id="date-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-sm text-[#111827] dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="date-end" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                End Date
              </label>
              <input
                id="date-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-sm text-[#111827] dark:text-white"
              />
            </div>
          </div>

          <div className="lg:col-span-7">
            {diffOutcome && !diffOutcome.ok ? (
              <div
                role="alert"
                className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-sm text-rose-700 dark:text-rose-300"
              >
                {diffOutcome.error}
              </div>
            ) : diffOutcome?.ok ? (
              <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Exact Duration
                      {diffOutcome.data.direction === 'backward' ? ' (End date is earlier than Start date)' : ''}
                    </p>
                    <p className="font-display text-2xl sm:text-3xl font-bold text-[#635BFF] dark:text-[#8B5CF6] mt-1 tabular-nums">
                      {diffOutcome.data.years}y {diffOutcome.data.months}m {diffOutcome.data.days}d
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyResult}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200"
                  >
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    Copy
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total Days</p>
                    <p className="font-mono text-lg font-semibold text-[#111827] dark:text-white tabular-nums mt-0.5">
                      {diffOutcome.data.totalDays.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Weeks + Days</p>
                    <p className="font-mono text-lg font-semibold text-[#111827] dark:text-white tabular-nums mt-0.5">
                      {diffOutcome.data.totalWeeks}w {diffOutcome.data.remainingDays}d
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Weekdays (Mon–Fri)</p>
                    <p className="font-mono text-lg font-semibold text-[#111827] dark:text-white tabular-nums mt-0.5">
                      {diffOutcome.data.weekdaysCount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-4 p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
            <div className="space-y-1.5">
              <label htmlFor="date-base" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Starting Date
              </label>
              <input
                id="date-base"
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-sm text-[#111827] dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <span className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Operation
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'add', label: '+ Add Days' },
                    { id: 'subtract', label: '- Subtract Days' },
                  ] as const
                ).map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setOffsetOp(op.id)}
                    className={`py-2 rounded-lg text-xs font-medium border ${
                      offsetOp === op.id
                        ? 'border-[#635BFF] bg-[#635BFF] text-white'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="date-days" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Number of Days
              </label>
              <input
                id="date-days"
                type="number"
                min={0}
                max={365000}
                step="1"
                value={daysCount}
                onChange={(e) => setDaysCount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-sm text-[#111827] dark:text-white tabular-nums"
              />
            </div>
          </div>

          <div className="lg:col-span-7">
            {offsetOutcome && !offsetOutcome.ok ? (
              <div
                role="alert"
                className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-sm text-rose-700 dark:text-rose-300"
              >
                {offsetOutcome.error}
              </div>
            ) : offsetOutcome?.ok ? (
              <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Resulting Date
                      </p>
                      <p className="font-display text-2xl sm:text-3xl font-bold text-[#111827] dark:text-white mt-0.5">
                        {offsetOutcome.data.formattedDate}
                      </p>
                      <p className="font-mono text-xs text-[#635BFF] dark:text-[#8B5CF6] mt-1">
                        {offsetOutcome.data.weekday} · {offsetOutcome.data.isoDate}
                        {offsetOutcome.data.isLeapYear ? ' · Leap Year' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyResult}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200"
                  >
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    Copy
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
