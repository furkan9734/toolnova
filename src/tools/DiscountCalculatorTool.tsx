import { useState, useMemo } from 'react';
import { Copy } from 'lucide-react';
import { calculateDiscount } from '../utils/financeDateLogic';
import { copyToClipboard } from '../utils/download';
import { useToast } from '../hooks/useToast';

const DISCOUNT_PRESETS = [10, 15, 20, 25, 30, 50];
const CURRENCIES = ['$', '₹', '€', '£'];

export default function DiscountCalculatorTool() {
  const { showToast } = useToast();

  const [currency, setCurrency] = useState('$');
  const [originalPrice, setOriginalPrice] = useState('120');
  const [discountPercent, setDiscountPercent] = useState('25');
  const [taxPercent, setTaxPercent] = useState('0');

  const outcome = useMemo(() => {
    try {
      return {
        ok: true as const,
        data: calculateDiscount(
          Number(originalPrice),
          Number(discountPercent),
          Number(taxPercent || 0)
        ),
      };
    } catch (err: unknown) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : 'Enter valid price and discount values.',
      };
    }
  }, [originalPrice, discountPercent, taxPercent]);

  const fmt = (val: number) =>
    `${currency}${val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleCopy = async () => {
    if (!outcome.ok) return;
    const d = outcome.data;
    const text = `Original Price: ${fmt(d.originalPrice)}\nDiscount (${d.discountPercent}%): -${fmt(d.discountAmount)}\nFinal Price: ${fmt(d.finalPrice)}\nYou Save: ${fmt(d.discountAmount)}`;
    const ok = await copyToClipboard(text);
    if (ok) showToast('Discount summary copied', 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-6 space-y-5 p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
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
          <label htmlFor="disc-price" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
            Original Price ({currency})
          </label>
          <input
            id="disc-price"
            type="number"
            min={0}
            step="any"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-base text-[#111827] dark:text-white tabular-nums"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="disc-pct" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
            Discount Percentage (%)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DISCOUNT_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setDiscountPercent(String(p))}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${
                  Number(discountPercent) === p
                    ? 'border-[#635BFF] bg-[#635BFF] text-white'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200'
                }`}
              >
                {p}% off
              </button>
            ))}
          </div>
          <input
            id="disc-pct"
            type="number"
            min={0}
            max={100}
            step="0.5"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-sm text-[#111827] dark:text-white tabular-nums"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="disc-tax" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
            Optional Sales Tax After Discount (%)
          </label>
          <input
            id="disc-tax"
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={taxPercent}
            onChange={(e) => setTaxPercent(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-sm text-[#111827] dark:text-white tabular-nums"
          />
        </div>
      </div>

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
                  Final Price
                </p>
                <p className="font-mono text-3xl sm:text-4xl font-bold text-[#635BFF] dark:text-[#8B5CF6] mt-1 tabular-nums">
                  {fmt(outcome.data.finalPrice)}
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

            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                Total Savings
              </span>
              <span className="font-mono text-lg font-bold text-[#22C55E] tabular-nums">
                {fmt(outcome.data.discountAmount)} ({outcome.data.discountPercent}%)
              </span>
            </div>

            <dl className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-600 dark:text-slate-400">Original Price</dt>
                <dd className="font-mono text-[#111827] dark:text-white tabular-nums">
                  {fmt(outcome.data.originalPrice)}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-600 dark:text-slate-400">Price After Discount</dt>
                <dd className="font-mono text-[#111827] dark:text-white tabular-nums">
                  {fmt(outcome.data.discountedPrice)}
                </dd>
              </div>
              {outcome.data.taxPercent > 0 && (
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">
                    Sales Tax ({outcome.data.taxPercent}%)
                  </dt>
                  <dd className="font-mono text-[#111827] dark:text-white tabular-nums">
                    +{fmt(outcome.data.taxAmount)}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
