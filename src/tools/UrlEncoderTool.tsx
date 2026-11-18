import { useState, useMemo } from 'react';
import { Copy, ArrowLeftRight, Trash2, AlertCircle } from 'lucide-react';
import { encodeUrlText, decodeUrlText } from '../utils/devToolsLogic';
import { copyToClipboard } from '../utils/download';
import { useToast } from '../hooks/useToast';

export default function UrlEncoderTool() {
  const { showToast } = useToast();

  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [scope, setScope] = useState<'component' | 'full'>('component');
  const [input, setInput] = useState('');

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      const converted =
        mode === 'encode' ? encodeUrlText(input, scope) : decodeUrlText(input, scope);
      return { output: converted, error: null };
    } catch (err: unknown) {
      return {
        output: '',
        error: err instanceof Error ? err.message : 'Unable to process URL text.',
      };
    }
  }, [input, mode, scope]);

  const handleSwap = () => {
    if (!error && output) {
      setInput(output);
    }
    setMode((prev) => (prev === 'encode' ? 'decode' : 'encode'));
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
          aria-label="URL operation mode"
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
            Encode
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
            Decode
          </button>
        </div>

        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setScope('component')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              scope === 'component'
                ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Component (Query Values)
          </button>
          <button
            type="button"
            onClick={() => setScope('full')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              scope === 'full'
                ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Full URL (Keep : / ? &)
          </button>
        </div>
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
          <label htmlFor="url-input" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
            {mode === 'encode' ? 'Unencoded Input' : 'Encoded URL Input'}
          </label>
          <textarea
            id="url-input"
            rows={8}
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'encode'
                ? 'https://example.com/search?q=hello world & more'
                : 'https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world'
            }
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] font-mono text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="url-output" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
            {mode === 'encode' ? 'Encoded Result' : 'Decoded Result'}
          </label>
          <textarea
            id="url-output"
            rows={8}
            readOnly
            spellCheck={false}
            value={output}
            placeholder="Converted output appears here..."
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#10131C] font-mono text-sm text-[#111827] dark:text-white focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2.5">
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
