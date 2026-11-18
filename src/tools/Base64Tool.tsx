import { useState, useMemo } from 'react';
import { Copy, ArrowLeftRight, Trash2, AlertCircle } from 'lucide-react';
import { encodeBase64Utf8, decodeBase64Utf8 } from '../utils/devToolsLogic';
import { copyToClipboard } from '../utils/download';
import { useToast } from '../hooks/useToast';

export default function Base64Tool() {
  const { showToast } = useToast();

  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [urlSafe, setUrlSafe] = useState(false);
  const [input, setInput] = useState('');

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      const converted =
        mode === 'encode' ? encodeBase64Utf8(input, urlSafe) : decodeBase64Utf8(input);
      return { output: converted, error: null };
    } catch (err: unknown) {
      return {
        output: '',
        error: err instanceof Error ? err.message : 'Invalid input for Base64 conversion.',
      };
    }
  }, [input, mode, urlSafe]);

  const handleSwap = () => {
    if (error || !output) {
      setMode((prev) => (prev === 'encode' ? 'decode' : 'encode'));
      return;
    }
    const nextMode = mode === 'encode' ? 'decode' : 'encode';
    setInput(output);
    setMode(nextMode);
  };

  const handleCopy = async () => {
    if (!output) return;
    const ok = await copyToClipboard(output);
    if (ok) showToast('Copied to clipboard', 'success');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Base64 mode"
          className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'encode'}
            onClick={() => setMode('encode')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              mode === 'encode'
                ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Encode (Text → Base64)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'decode'}
            onClick={() => setMode('decode')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              mode === 'decode'
                ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Decode (Base64 → Text)
          </button>
        </div>

        {mode === 'encode' && (
          <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#111827] dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={urlSafe}
              onChange={(e) => setUrlSafe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#635BFF] focus:ring-[#635BFF]"
            />
            URL-safe Base64 (- and _)
          </label>
        )}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label htmlFor="b64-input" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
            {mode === 'encode' ? 'Plain UTF-8 Text' : 'Base64 String'}
          </label>
          <textarea
            id="b64-input"
            rows={9}
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'encode'
                ? 'Enter text, JSON, or unicode characters to encode...'
                : 'Paste a Base64 string to decode...'
            }
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] font-mono text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="b64-output" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
            {mode === 'encode' ? 'Base64 Output' : 'Decoded Text'}
          </label>
          <textarea
            id="b64-output"
            rows={9}
            readOnly
            spellCheck={false}
            value={output}
            placeholder="Converted output appears here..."
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#10131C] font-mono text-sm text-[#111827] dark:text-white focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={handleSwap}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <ArrowLeftRight className="w-4 h-4" aria-hidden="true" />
          Swap
        </button>
        <button
          type="button"
          disabled={!input}
          onClick={() => setInput('')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:text-rose-600 disabled:opacity-40"
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
          Reset
        </button>
        <button
          type="button"
          disabled={!output}
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-40 transition-colors"
        >
          <Copy className="w-4 h-4" aria-hidden="true" />
          Copy Output
        </button>
      </div>
    </div>
  );
}
