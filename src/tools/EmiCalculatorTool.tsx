import { useState, useMemo } from 'react';
import { Copy } from 'lucide-react';
import { calculateEmi } from '../utils/financeDateLogic';
import { copyToClipboard } from '../utils/download';
import { useToast } from '../hooks/useToast';

const CURRENCIES = ['$', '₹', '€', '£'];

export default function EmiCalculatorTool() {
  const { showToast } = useToast();

  const [currency, setCurrency] = useState('$');
  const [principal, setPrincipal] = useState('25000');
  const [annualRate, setAnnualRate] = useState('8.5');
  const [tenure, setTenure] = useState('5');
  const [tenureUnit, setTenureUnit] = useState<'years' | 'months'>('years');

  const outcome = useMemo(() => {
    try {
      const res = calculateEmi(
        Number(principal),
        Number(annualRate),
        Number(tenure),
        tenureUnit
      );
      return { ok: true as const, data: res };
    } catch (err: unknown) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : 'Enter valid loan values.',
      };
    }
  }, [principal, annualRate, tenure, tenureUnit]);

  const fmt = (val: number) =>
    `${currency}${val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleCopySummary = async () => {
    if (!outcome.ok) return;
    const d = outcome.data;
    const summary = `Monthly EMI: ${fmt(d.monthlyEmi)}\nTotal Principal: ${fmt(Number(principal))}\nTotal Interest: ${fmt(d.totalInterest)}\nTotal Payment (${d.totalMonths} months): ${fmt(d.totalPayment)}`;
    const ok = await copyToClipboard(summary);
    if (ok) showToast('EMI summary copied', 'success');
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Inputs */}
        <div className="lg:col-span-5 space-y-4 p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Currency Symbol
            </span>
            <div className="inline-flex p-1 rounded-lg bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-700 gap-1">
              {CURRENCIES.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => setCurrency(sym)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-semibold ${
                    currency === sym
                      ? 'bg-[#635BFF] text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="emi-principal" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
              Loan Principal ({currency})
            </label>
            <input
              id="emi-principal"
              type="number"
              min={1}
              step="any"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-sm text-[#111827] dark:text-white tabular-nums"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="emi-rate" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
              Annual Interest Rate (% p.a.)
            </label>
            <input
              id="emi-rate"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={annualRate}
              onChange={(e) => setAnnualRate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-sm text-[#111827] dark:text-white tabular-nums"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="emi-tenure" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
              Loan Tenure
            </label>
            <div className="flex gap-2">
              <input
                id="emi-tenure"
                type="number"
                min={1}
                step="1"
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-sm text-[#111827] dark:text-white tabular-nums"
              />
              <div className="inline-flex p-1 rounded-lg bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-700 gap-1">
                {(['years', 'months'] as const).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setTenureUnit(unit)}
                    className={`px-3 py-1.5 rounded text-xs font-medium capitalize ${
                      tenureUnit === unit
                        ? 'bg-[#635BFF] text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
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
                      Monthly Payment (EMI)
                    </p>
                    <p className="font-mono text-3xl sm:text-4xl font-bold text-[#635BFF] dark:text-[#8B5CF6] mt-1 tabular-nums">
                      {fmt(outcome.data.monthlyEmi)}
                    </p>
                    <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Across {outcome.data.totalMonths} monthly installments
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200"
                  >
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    Copy Summary
                  </button>
                </div>

                {/* Principal vs Interest Bar */}
                <div className="space-y-2">
                  <div className="h-3 w-full rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 flex">
                    <div
                      style={{ width: `${outcome.data.principalPercent}%` }}
                      className="bg-[#635BFF] h-full"
                    />
                    <div
                      style={{ width: `${outcome.data.interestPercent}%` }}
                      className="bg-[#8B5CF6]/55 h-full"
                    />
                  </div>
                  <div className="flex flex-wrap justify-between text-xs text-slate-600 dark:text-slate-400 font-mono">
                    <span>Principal: {outcome.data.principalPercent.toFixed(1)}%</span>
                    <span>Interest: {outcome.data.interestPercent.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Principal Amount</p>
                    <p className="font-mono text-sm sm:text-base font-semibold text-[#111827] dark:text-white tabular-nums mt-0.5">
                      {fmt(Number(principal))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total Interest</p>
                    <p className="font-mono text-sm sm:text-base font-semibold text-[#111827] dark:text-white tabular-nums mt-0.5">
                      {fmt(outcome.data.totalInterest)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total Payable</p>
                    <p className="font-mono text-sm sm:text-base font-semibold text-[#111827] dark:text-white tabular-nums mt-0.5">
                      {fmt(outcome.data.totalPayment)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Yearly Amortization Summary */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C] overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#171B26]">
                  <h3 className="font-display text-sm font-semibold text-[#111827] dark:text-white">
                    Yearly Amortization Summary
                  </h3>
                </div>
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-[#171B26] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold text-[#111827] dark:text-white">Year</th>
                        <th className="py-2.5 px-4 font-semibold text-[#111827] dark:text-white">Principal Paid</th>
                        <th className="py-2.5 px-4 font-semibold text-[#111827] dark:text-white">Interest Paid</th>
                        <th className="py-2.5 px-4 font-semibold text-[#111827] dark:text-white">Remaining Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono tabular-nums">
                      {outcome.data.yearlySchedule.map((row) => (
                        <tr key={row.year}>
                          <td className="py-2 px-4 text-[#111827] dark:text-slate-200">Year {row.year}</td>
                          <td className="py-2 px-4 text-slate-600 dark:text-slate-300">{fmt(row.principalPaid)}</td>
                          <td className="py-2 px-4 text-slate-600 dark:text-slate-300">{fmt(row.interestPaid)}</td>
                          <td className="py-2 px-4 text-[#111827] dark:text-white">{fmt(row.endingBalance)}</td>
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
    </div>
  );
}
