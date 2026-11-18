import { useState, useMemo } from 'react';
import { Copy } from 'lucide-react';
import { calculateGst } from '../utils/financeDateLogic';
import { copyToClipboard } from '../utils/download';
import { useToast } from '../hooks/useToast';

const RATE_PRESETS = [5, 10, 12, 15, 18, 28];
const CURRENCIES = ['₹', '$', '€', '£'];

export default function GstCalculatorTool() {
  const { showToast } = useToast();

  const [currency, setCurrency] = useState('₹');
  const [mode, setMode] = useState<'exclusive' | 'inclusive'>('exclusive');
  const [amount, setAmount] = useState('1000');
  const [ratePercent, setRatePercent] = useState('18');
  const [showCgstSgst, setShowCgstSgst] = useState(true);

  const outcome = useMemo(() => {
    try {
      return {
        ok: true as const,
        data: calculateGst(Number(amount), Number(ratePercent), mode),
      };
    } catch (err: unknown) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : 'Enter valid GST values.',
      };
    }
  }, [amount, ratePercent, mode]);

  const fmt = (val: number) =>
    `${currency}${val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleCopy = async () => {
    if (!outcome.ok) return;
    const d = outcome.data;
    const lines = [
      `Calculation Mode: ${mode === 'exclusive' ? 'GST Exclusive' : 'GST Inclusive'} (${d.ratePercent}%)`,
      `Net Amount: ${fmt(d.netAmount)}`,
      `Total GST: ${fmt(d.gstAmount)}`,
      ...(showCgstSgst
        ? [`CGST (${d.ratePercent / 2}%): ${fmt(d.cgstAmount)}`, `SGST (${d.ratePercent / 2}%): ${fmt(d.sgstAmount)}`]
        : []),
      `Gross Total: ${fmt(d.grossAmount)}`,
    ];
    const ok = await copyToClipboard(lines.join('\n'));
    if (ok) showToast('GST calculation copied', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 space-y-5 p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex p-1 rounded-xl bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-700 gap-1">
              <button
                type="button"
                onClick={() => setMode('exclusive')}
                aria-pressed={mode === 'exclusive'}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium ${
                  mode === 'exclusive'
                    ? 'bg-[#635BFF] text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                GST Exclusive (Add Tax)
              </button>
              <button
                type="button"
                onClick={() => setMode('inclusive')}
                aria-pressed={mode === 'inclusive'}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium ${
                  mode === 'inclusive'
                    ? 'bg-[#635BFF] text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                GST Inclusive (Remove Tax)
              </button>
            </div>

            <div className="inline-flex p-1 rounded-lg bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-700 gap-1">
              {CURRENCIES.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => setCurrency(sym)}
                  className={`px-2 py-1 rounded text-xs font-mono font-semibold ${
                    currency === sym ? 'bg-[#635BFF] text-white' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="gst-amount" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
              {mode === 'exclusive' ? `Base Price Before Tax (${currency})` : `Tax-Inclusive Total Amount (${currency})`}
            </label>
            <input
              id="gst-amount"
              type="number"
              min={0}
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-base text-[#111827] dark:text-white tabular-nums"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="gst-rate" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
              Tax Rate (%)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {RATE_PRESETS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRatePercent(String(r))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${
                    Number(ratePercent) === r
                      ? 'border-[#635BFF] bg-[#635BFF] text-white'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {r}%
                </button>
              ))}
            </div>
            <input
              id="gst-rate"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={ratePercent}
              onChange={(e) => setRatePercent(e.target.value)}
              placeholder="Custom %"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-sm text-[#111827] dark:text-white tabular-nums"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-[#111827] dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={showCgstSgst}
              onChange={(e) => setShowCgstSgst(e.target.checked)}
              className="rounded border-slate-300 text-[#635BFF] focus:ring-[#635BFF]"
            />
            Show 50/50 CGST &amp; SGST split breakdown
          </label>
        </div>

        {/* Output */}
        <div className="lg:col-span-6 space-y-4">
          {!outcome.ok ? (
            <div
              role="alert"
              className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-sm text-rose-700 dark:text-rose-300"
            >
              {outcome.error}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {mode === 'exclusive' ? 'Total Amount (Including Tax)' : 'Base Net Amount (Excluding Tax)'}
                  </p>
                  <p className="font-mono text-3xl sm:text-4xl font-bold text-[#635BFF] dark:text-[#8B5CF6] mt-1 tabular-nums">
                    {fmt(mode === 'exclusive' ? outcome.data.grossAmount : outcome.data.netAmount)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200"
                >
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  Copy
                </button>
              </div>

              <dl className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                <div className="py-3 flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">Net Price (Pre-Tax)</dt>
                  <dd className="font-mono font-semibold text-[#111827] dark:text-white tabular-nums">
                    {fmt(outcome.data.netAmount)}
                  </dd>
                </div>
                <div className="py-3 flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">
                    Total Tax ({outcome.data.ratePercent}%)
                  </dt>
                  <dd className="font-mono font-semibold text-[#22C55E] tabular-nums">
                    {fmt(outcome.data.gstAmount)}
                  </dd>
                </div>
                {showCgstSgst && (
                  <>
                    <div className="py-2.5 flex justify-between text-xs pl-3">
                      <dt className="text-slate-500 dark:text-slate-400">
                        CGST ({outcome.data.ratePercent / 2}%)
                      </dt>
                      <dd className="font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                        {fmt(outcome.data.cgstAmount)}
                      </dd>
                    </div>
                    <div className="py-2.5 flex justify-between text-xs pl-3">
                      <dt className="text-slate-500 dark:text-slate-400">
                        SGST ({outcome.data.ratePercent / 2}%)
                      </dt>
                      <dd className="font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                        {fmt(outcome.data.sgstAmount)}
                      </dd>
                    </div>
                  </>
                )}
                <div className="py-3 flex justify-between">
                  <dt className="font-semibold text-[#111827] dark:text-white">Gross Total</dt>
                  <dd className="font-mono font-bold text-[#111827] dark:text-white tabular-nums">
                    {fmt(outcome.data.grossAmount)}
                  </dd>
                </div>
              </dl>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Arithmetic calculator only. Always confirm applicable tax rates and filing rules for your jurisdiction and product category.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
