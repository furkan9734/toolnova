import { useState, useMemo } from 'react';
import { Copy } from 'lucide-react';
import {
  calculateCompoundInterest,
  type CompoundingFrequency,
} from '../utils/financeDateLogic';
import { copyToClipboard } from '../utils/download';
import { useToast } from '../hooks/useToast';

const CURRENCIES = ['$', '₹', '€', '£'];

export default function CompoundInterestCalculatorTool() {
  const { showToast } = useToast();

  const [currency, setCurrency] = useState('$');
  const [initialPrincipal, setInitialPrincipal] = useState('10000');
  const [monthlyContribution, setMonthlyContribution] = useState('200');
  const [annualRate, setAnnualRate] = useState('7.5');
  const [years, setYears] = useState('10');
  const [frequency, setFrequency] = useState<CompoundingFrequency>(12);

  const outcome = useMemo(() => {
    try {
      const res = calculateCompoundInterest(
        Number(initialPrincipal),
        Number(annualRate),
        Number(years),
        frequency,
        Number(monthlyContribution || 0)
      );
      return { ok: true as const, data: res };
    } catch (err: unknown) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : 'Enter valid investment values.',
      };
    }
  }, [initialPrincipal, monthlyContribution, annualRate, years, frequency]);

  const fmt = (val: number) =>
    `${currency}${val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleCopy = async () => {
    if (!outcome.ok) return;
    const d = outcome.data;
    const text = `Future Balance (${years} yrs): ${fmt(d.finalBalance)}\nTotal Contributions: ${fmt(d.totalPrincipalAndContributions)}\nTotal Interest Earned: ${fmt(d.totalInterestEarned)}`;
    const ok = await copyToClipboard(text);
    if (ok) showToast('Compound interest summary copied', 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Inputs */}
      <div className="lg:col-span-5 space-y-4 p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Currency</span>
          <div className="inline-flex p-1 rounded-lg bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-700 gap-1">
            {CURRENCIES.map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => setCurrency(sym)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-semibold ${
                  currency === sym ? 'bg-[#635BFF] text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="ci-principal" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
            Initial Investment ({currency})
          </label>
          <input
            id="ci-principal"
            type="number"
            min={0}
            step="any"
            value={initialPrincipal}
            onChange={(e) => setInitialPrincipal(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-sm text-[#111827] dark:text-white tabular-nums"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="ci-contrib" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
            Monthly Contribution ({currency}, optional)
          </label>
          <input
            id="ci-contrib"
            type="number"
            min={0}
            step="any"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-sm text-[#111827] dark:text-white tabular-nums"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="ci-rate" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
              Annual Rate (%)
            </label>
            <input
              id="ci-rate"
              type="number"
              min={0}
              max={200}
              step="0.1"
              value={annualRate}
              onChange={(e) => setAnnualRate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-sm text-[#111827] dark:text-white tabular-nums"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ci-years" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
              Time (Years)
            </label>
            <input
              id="ci-years"
              type="number"
              min={1}
              max={100}
              step="1"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-sm text-[#111827] dark:text-white tabular-nums"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="ci-freq" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
            Compounding Frequency
          </label>
          <select
            id="ci-freq"
            value={frequency}
            onChange={(e) => setFrequency(Number(e.target.value) as CompoundingFrequency)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white"
          >
            <option value={1}>Annually (1× / year)</option>
            <option value={2}>Semi-Annually (2× / year)</option>
            <option value={4}>Quarterly (4× / year)</option>
            <option value={12}>Monthly (12× / year)</option>
            <option value={365}>Daily (365× / year)</option>
          </select>
        </div>
      </div>

      {/* Results & Breakdown */}
      <div className="lg:col-span-7 space-y-5">
        {!outcome.ok ? (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-sm text-rose-700 dark:text-rose-300"
          >
            {outcome.error}
          </div>
        ) : (
          <>
            <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Estimated Future Balance
                  </p>
                  <p className="font-mono text-3xl sm:text-4xl font-bold text-[#635BFF] dark:text-[#8B5CF6] mt-1 tabular-nums">
                    {fmt(outcome.data.finalBalance)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200"
                >
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  Copy Summary
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Principal &amp; Deposits</p>
                  <p className="font-mono text-base font-semibold text-[#111827] dark:text-white tabular-nums mt-0.5">
                    {fmt(outcome.data.totalPrincipalAndContributions)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Compound Interest</p>
                  <p className="font-mono text-base font-semibold text-[#22C55E] tabular-nums mt-0.5">
                    +{fmt(outcome.data.totalInterestEarned)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C] overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#171B26]">
                <h3 className="font-display text-sm font-semibold text-[#111827] dark:text-white">
                  Year-by-Year Growth
                </h3>
              </div>
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-[#171B26] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold text-[#111827] dark:text-white">Year</th>
                      <th className="py-2.5 px-4 font-semibold text-[#111827] dark:text-white">Contributed</th>
                      <th className="py-2.5 px-4 font-semibold text-[#111827] dark:text-white">Interest Earned</th>
                      <th className="py-2.5 px-4 font-semibold text-[#111827] dark:text-white">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono tabular-nums">
                    {outcome.data.yearlyBreakdown.map((row) => (
                      <tr key={row.year}>
                        <td className="py-2 px-4 text-[#111827] dark:text-slate-200">Year {row.year}</td>
                        <td className="py-2 px-4 text-slate-600 dark:text-slate-300">{fmt(row.totalContributed)}</td>
                        <td className="py-2 px-4 text-[#22C55E]">{fmt(row.interestEarned)}</td>
                        <td className="py-2 px-4 text-[#111827] dark:text-white font-semibold">{fmt(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
