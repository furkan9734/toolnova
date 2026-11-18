import { useState, useEffect, useCallback } from 'react';
import { Copy, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  generateSecurePassword,
  evaluatePasswordStrength,
  type PasswordOptions,
} from '../utils/passwordLogic';
import { copyToClipboard } from '../utils/download';
import { useToast } from '../hooks/useToast';

export default function PasswordGeneratorTool() {
  const { showToast } = useToast();

  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeSimilar: false,
  });

  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const regenerate = useCallback(() => {
    try {
      const next = generateSecurePassword(options);
      setPassword(next);
      setError(null);
    } catch (err: unknown) {
      setPassword('');
      setError(err instanceof Error ? err.message : 'Enable at least one character set.');
    }
  }, [options]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  // Clear password from memory on unmount
  useEffect(() => {
    return () => setPassword('');
  }, []);

  const strength = evaluatePasswordStrength(options);

  const handleCopy = async () => {
    if (!password) return;
    const ok = await copyToClipboard(password);
    if (ok) {
      showToast('Password copied to clipboard', 'success', 'Never stored in browser storage.');
    }
  };

  const toggleOption = (key: keyof Omit<PasswordOptions, 'length'>) => {
    setOptions((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!next.uppercase && !next.lowercase && !next.numbers && !next.symbols) {
        return prev;
      }
      return next;
    });
  };

  const strengthBarColor =
    strength.level === 4
      ? 'bg-[#22C55E]'
      : strength.level === 3
      ? 'bg-[#635BFF]'
      : strength.level === 2
      ? 'bg-amber-500'
      : 'bg-rose-500';

  return (
    <div className="space-y-6">
      {/* Password Output Box */}
      <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Generated Password
            </p>
            <p
              aria-live="polite"
              className="font-mono text-lg sm:text-2xl font-semibold text-[#111827] dark:text-white break-all select-all"
            >
              {error ? error : password}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={regenerate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-[#111827] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Regenerate
            </button>
            <button
              type="button"
              disabled={!password}
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-50 transition-colors"
            >
              <Copy className="w-4 h-4" aria-hidden="true" />
              Copy
            </button>
          </div>
        </div>

        {/* Strength Meter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Strength: {strength.label}
            </span>
            <span className="font-mono text-slate-500 dark:text-slate-400">
              ~{strength.entropyBits} bits of entropy
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 h-1.5">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`rounded-full transition-colors ${
                  step <= strength.level ? strengthBarColor : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Length & Character Sets */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-5 space-y-3 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C]">
          <div className="flex items-center justify-between">
            <label htmlFor="pw-length" className="text-sm font-medium text-[#111827] dark:text-white">
              Password Length
            </label>
            <span className="font-mono text-base font-semibold text-[#635BFF] dark:text-[#8B5CF6]">
              {options.length}
            </span>
          </div>
          <input
            id="pw-length"
            type="range"
            min={6}
            max={64}
            value={options.length}
            onChange={(e) => setOptions((prev) => ({ ...prev, length: Number(e.target.value) }))}
            className="w-full accent-[#635BFF] cursor-pointer"
          />
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>6</span>
            <span>16</span>
            <span>32</span>
            <span>64</span>
          </div>
        </div>

        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(
            [
              { key: 'uppercase', label: 'Uppercase (A–Z)' },
              { key: 'lowercase', label: 'Lowercase (a–z)' },
              { key: 'numbers', label: 'Numbers (0–9)' },
              { key: 'symbols', label: 'Symbols (!@#$%)' },
              { key: 'excludeSimilar', label: 'Exclude similar (i, l, 1, O, 0)' },
            ] as const
          ).map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C] cursor-pointer hover:border-[#635BFF]/50 transition-colors"
            >
              <input
                type="checkbox"
                checked={options[item.key]}
                onChange={() => toggleOption(item.key)}
                className="w-4 h-4 rounded border-slate-300 text-[#635BFF] focus:ring-[#635BFF]"
              />
              <span className="text-sm text-[#111827] dark:text-slate-200">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <ShieldCheck className="w-4 h-4 text-[#22C55E] shrink-0" aria-hidden="true" />
        <span>
          Generated locally using <code className="font-mono">window.crypto.getRandomValues</code> with unbiased rejection sampling. Passwords are never saved to disk or LocalStorage.
        </span>
      </div>
    </div>
  );
}
