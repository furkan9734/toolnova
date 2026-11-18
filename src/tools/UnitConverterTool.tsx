import { useState, useMemo } from 'react';
import { ArrowLeftRight, Copy, RotateCcw } from 'lucide-react';
import {
  UNIT_DEFINITIONS,
  convertUnitValue,
  type UnitCategory,
} from '../utils/calculatorLogic';
import { formatNumber } from '../utils/formatters';
import { copyToClipboard } from '../utils/download';
import { useToast } from '../hooks/useToast';

const CATEGORY_TABS: { id: UnitCategory; label: string; defaultFrom: string; defaultTo: string }[] = [
  { id: 'length', label: 'Length', defaultFrom: 'm', defaultTo: 'ft' },
  { id: 'weight', label: 'Weight', defaultFrom: 'kg', defaultTo: 'lb' },
  { id: 'temperature', label: 'Temperature', defaultFrom: 'c', defaultTo: 'f' },
  { id: 'area', label: 'Area', defaultFrom: 'm2', defaultTo: 'ft2' },
  { id: 'volume', label: 'Volume', defaultFrom: 'l', defaultTo: 'gal' },
];

export default function UnitConverterTool() {
  const { showToast } = useToast();

  const [category, setCategory] = useState<UnitCategory>('length');
  const [fromUnit, setFromUnit] = useState<string>('m');
  const [toUnit, setToUnit] = useState<string>('ft');
  const [rawValue, setRawValue] = useState<string>('1');

  const units = UNIT_DEFINITIONS[category];

  const handleCategoryChange = (nextCat: UnitCategory) => {
    const tab = CATEGORY_TABS.find((t) => t.id === nextCat)!;
    setCategory(nextCat);
    setFromUnit(tab.defaultFrom);
    setToUnit(tab.defaultTo);
  };

  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const numericValue = rawValue.trim() === '' ? NaN : Number(rawValue);
  const convertedValue = useMemo(() => {
    if (!Number.isFinite(numericValue)) return NaN;
    return convertUnitValue(category, numericValue, fromUnit, toUnit);
  }, [category, numericValue, fromUnit, toUnit]);

  const toDef = units.find((u) => u.id === toUnit);
  const fromDef = units.find((u) => u.id === fromUnit);

  const handleCopy = async () => {
    if (!Number.isFinite(convertedValue)) return;
    const text = `${formatNumber(convertedValue, 8)} ${toDef?.symbol || ''}`.trim();
    const ok = await copyToClipboard(text);
    if (ok) showToast('Converted value copied', 'success', text);
  };

  const handleReset = () => {
    setRawValue('1');
    const tab = CATEGORY_TABS.find((t) => t.id === category)!;
    setFromUnit(tab.defaultFrom);
    setToUnit(tab.defaultTo);
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Unit category"
          className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800"
        >
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={category === tab.id}
              onClick={() => handleCategoryChange(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                category === tab.id
                  ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Reset
        </button>
      </div>

      {/* Converter Panel */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 items-end">
        <div className="md:col-span-5 space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="unit-val" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
              Value
            </label>
            <input
              id="unit-val"
              type="number"
              step="any"
              value={rawValue}
              onChange={(e) => setRawValue(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-base text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="unit-from" className="block text-xs font-medium text-slate-500 dark:text-slate-400">
              From Unit
            </label>
            <select
              id="unit-from"
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label} ({u.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="md:col-span-1 flex justify-center pb-1">
          <button
            type="button"
            onClick={handleSwap}
            aria-label="Swap source and target units"
            className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 hover:border-[#635BFF] hover:text-[#635BFF] flex items-center justify-center transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="md:col-span-5 space-y-3">
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171B26] flex items-center justify-between gap-2 min-h-[46px]">
            <div className="min-w-0">
              <span className="font-mono text-lg font-bold text-[#635BFF] dark:text-[#8B5CF6] break-all">
                {Number.isFinite(convertedValue) ? formatNumber(convertedValue, 8) : '—'}
              </span>
              {Number.isFinite(convertedValue) && toDef && (
                <span className="ml-1.5 text-sm text-slate-500 dark:text-slate-400">
                  {toDef.symbol}
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={!Number.isFinite(convertedValue)}
              onClick={handleCopy}
              aria-label="Copy converted result"
              className="p-2 rounded-md text-slate-500 hover:text-[#635BFF] disabled:opacity-40 shrink-0"
            >
              <Copy className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="unit-to" className="block text-xs font-medium text-slate-500 dark:text-slate-400">
              To Unit
            </label>
            <select
              id="unit-to"
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label} ({u.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* All Equivalent Units Breakdown */}
      {Number.isFinite(numericValue) && (
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            All {category} equivalents for {formatNumber(numericValue, 6)} {fromDef?.symbol}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {units.map((u) => {
              const val = convertUnitValue(category, numericValue, fromUnit, u.id);
              return (
                <div
                  key={u.id}
                  className={`p-3 rounded-xl border text-xs ${
                    u.id === toUnit
                      ? 'border-[#635BFF]/50 bg-[#635BFF]/5 dark:bg-[#635BFF]/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C]'
                  }`}
                >
                  <p className="text-slate-500 dark:text-slate-400">{u.label}</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-[#111827] dark:text-white truncate">
                    {formatNumber(val, 6)} {u.symbol}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
