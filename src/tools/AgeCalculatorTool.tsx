import { useState, useMemo } from 'react';
import { Calendar, AlertCircle, RotateCcw } from 'lucide-react';
import { calculateExactAge } from '../utils/calculatorLogic';

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function AgeCalculatorTool() {
  const todayIso = useMemo(() => getTodayIso(), []);
  const [dob, setDob] = useState('1998-06-15');
  const [targetDate, setTargetDate] = useState(todayIso);

  const { result, error } = useMemo(() => {
    if (!dob) return { result: null, error: null };
    try {
      return { result: calculateExactAge(dob, targetDate || todayIso), error: null };
    } catch (err: unknown) {
      return {
        result: null,
        error: err instanceof Error ? err.message : 'Invalid dates provided.',
      };
    }
  }, [dob, targetDate, todayIso]);

  const handleReset = () => {
    setDob('');
    setTargetDate(todayIso);
  };

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 items-end">
        <div className="space-y-1.5">
          <label htmlFor="age-dob" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
            Date of Birth
          </label>
          <input
            id="age-dob"
            type="date"
            max={targetDate || todayIso}
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="age-target" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
            Age at Date
          </label>
          <input
            id="age-target"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Reset
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs sm:text-sm text-rose-700 dark:text-rose-300"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {!dob && !error && (
        <div className="p-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
          <Calendar className="w-5 h-5 mx-auto mb-2 text-slate-400" aria-hidden="true" />
          Select a date of birth above to calculate your exact chronological age.
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C]">
            <p className="text-xs text-slate-500 dark:text-slate-400">Exact Age</p>
            <p className="mt-2 font-display text-2xl sm:text-4xl font-bold text-[#111827] dark:text-white tabular-nums">
              <span className="text-[#635BFF] dark:text-[#8B5CF6]">{result.years}</span> years,{' '}
              <span className="text-[#635BFF] dark:text-[#8B5CF6]">{result.months}</span>{' '}
              {result.months === 1 ? 'month' : 'months'},{' '}
              <span className="text-[#635BFF] dark:text-[#8B5CF6]">{result.days}</span>{' '}
              {result.days === 1 ? 'day' : 'days'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#10131C]">
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Days</p>
              <p className="mt-1 font-mono text-xl font-semibold text-[#111827] dark:text-white">
                {result.totalDays.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#10131C]">
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Weeks</p>
              <p className="mt-1 font-mono text-xl font-semibold text-[#111827] dark:text-white">
                {result.totalWeeks.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#10131C]">
              <p className="text-xs text-slate-500 dark:text-slate-400">Next Birthday</p>
              <p className="mt-1 font-mono text-xl font-semibold text-[#22C55E]">
                {result.isBirthdayToday
                  ? 'Today!'
                  : `In ${result.daysUntilNextBirthday} ${
                      result.daysUntilNextBirthday === 1 ? 'day' : 'days'
                    }`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
