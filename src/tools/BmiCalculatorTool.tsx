import { useState, useMemo } from 'react';
import { RotateCcw, Info, AlertCircle } from 'lucide-react';
import {
  calculateBmiMetric,
  calculateBmiImperial,
  type BmiCategory,
} from '../utils/calculatorLogic';

export default function BmiCalculatorTool() {
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [heightCm, setHeightCm] = useState('175');
  const [weightKg, setWeightKg] = useState('70');

  const [heightFt, setHeightFt] = useState('5');
  const [heightIn, setHeightIn] = useState('9');
  const [weightLbs, setWeightLbs] = useState('154');

  const { result, error } = useMemo(() => {
    try {
      if (unitSystem === 'metric') {
        if (!heightCm || !weightKg) return { result: null, error: null };
        return {
          result: calculateBmiMetric(Number(heightCm), Number(weightKg)),
          error: null,
        };
      }
      if (!heightFt || !weightLbs) return { result: null, error: null };
      return {
        result: calculateBmiImperial(
          Number(heightFt),
          Number(heightIn || 0),
          Number(weightLbs)
        ),
        error: null,
      };
    } catch (err: unknown) {
      return {
        result: null,
        error: err instanceof Error ? err.message : 'Enter valid height and weight.',
      };
    }
  }, [unitSystem, heightCm, weightKg, heightFt, heightIn, weightLbs]);

  const handleReset = () => {
    setHeightCm('175');
    setWeightKg('70');
    setHeightFt('5');
    setHeightIn('9');
    setWeightLbs('154');
  };

  const categoryStyles: Record<BmiCategory, string> = {
    Underweight: 'text-sky-600 dark:text-sky-400',
    'Normal weight': 'text-[#22C55E]',
    Overweight: 'text-amber-600 dark:text-amber-400',
    Obesity: 'text-rose-600 dark:text-rose-400',
  };

  const ranges = [
    { label: 'Underweight', range: 'Below 18.5' },
    { label: 'Normal weight', range: '18.5 – 24.9' },
    { label: 'Overweight', range: '25.0 – 29.9' },
    { label: 'Obesity', range: '30.0 and above' },
  ];

  return (
    <div className="space-y-6">
      {/* Unit System Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Measurement unit system"
          className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800"
        >
          <button
            type="button"
            role="tab"
            aria-selected={unitSystem === 'metric'}
            onClick={() => setUnitSystem('metric')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              unitSystem === 'metric'
                ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Metric (cm / kg)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={unitSystem === 'imperial'}
            onClick={() => setUnitSystem('imperial')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              unitSystem === 'imperial'
                ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Imperial (ft, in / lbs)
          </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-4">
          {unitSystem === 'metric' ? (
            <>
              <div className="space-y-1.5">
                <label htmlFor="bmi-cm" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                  Height (cm)
                </label>
                <input
                  id="bmi-cm"
                  type="number"
                  step="any"
                  min={1}
                  max={300}
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-base text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="bmi-kg" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                  Weight (kg)
                </label>
                <input
                  id="bmi-kg"
                  type="number"
                  step="any"
                  min={1}
                  max={500}
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-base text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="bmi-ft" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                    Feet (ft)
                  </label>
                  <input
                    id="bmi-ft"
                    type="number"
                    min={1}
                    max={9}
                    value={heightFt}
                    onChange={(e) => setHeightFt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-base text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="bmi-in" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                    Inches (in)
                  </label>
                  <input
                    id="bmi-in"
                    type="number"
                    min={0}
                    max={11.9}
                    step="any"
                    value={heightIn}
                    onChange={(e) => setHeightIn(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-base text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="bmi-lbs" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                  Weight (lbs)
                </label>
                <input
                  id="bmi-lbs"
                  type="number"
                  step="any"
                  min={1}
                  max={1100}
                  value={weightLbs}
                  onChange={(e) => setWeightLbs(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-base text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                />
              </div>
            </>
          )}
        </div>

        {/* Result & Adult BMI Table */}
        <div className="lg:col-span-7 space-y-4">
          {error ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-sm text-rose-700 dark:text-rose-300"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          ) : result ? (
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C] space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Your Adult BMI</p>
                  <p className="mt-1 font-mono text-4xl font-bold text-[#111827] dark:text-white">
                    {result.bmi.toFixed(1)}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Standard Category</p>
                  <p className={`mt-1 font-display text-xl font-bold ${categoryStyles[result.category]}`}>
                    {result.category}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                Reference 18.5–24.9 weight range for your height:{' '}
                <span className="font-mono font-semibold text-[#111827] dark:text-white">
                  {unitSystem === 'metric'
                    ? `${result.healthyMinKg.toFixed(1)} – ${result.healthyMaxKg.toFixed(1)} kg`
                    : `${result.healthyMinLbs.toFixed(1)} – ${result.healthyMaxLbs.toFixed(1)} lbs`}
                </span>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C] overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#171B26]">
                  <th className="py-2.5 px-4 font-semibold text-[#111827] dark:text-white">
                    Adult BMI Category
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-[#111827] dark:text-white text-right">
                    BMI Range
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ranges.map((row) => {
                  const isCurrent = result?.category === row.label;
                  return (
                    <tr
                      key={row.label}
                      className={isCurrent ? 'bg-[#635BFF]/10 font-semibold' : ''}
                    >
                      <td className="py-2.5 px-4 text-[#111827] dark:text-slate-200">
                        {row.label}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-right text-slate-600 dark:text-slate-300">
                        {row.range}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Screening Disclaimer */}
      <div className="flex items-start gap-2.5 p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
        <Info className="w-4 h-4 text-[#635BFF] shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          <strong>Disclaimer:</strong> Body Mass Index (BMI) is a simple population-level screening measure based only on height and weight. It does not directly measure body fat percentage, muscle mass, bone density, or overall health, and is not a medical diagnosis. Consult a qualified healthcare professional for personalized health advice.
        </p>
      </div>
    </div>
  );
}
