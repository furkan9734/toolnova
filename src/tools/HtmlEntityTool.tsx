import { useState, useMemo } from 'react';
import { Copy, ArrowLeftRight, Trash2, Sparkles } from 'lucide-react';
import { encodeHtmlEntities, decodeHtmlEntities } from '../utils/codeToolsLogic';
import { copyToClipboard } from '../utils/download';
import { useToast } from '../hooks/useToast';

const SAMPLE_ENCODE = `<div class="notice">5 < 10 & "ToolNova" © 2026 — Café</div>`;
const SAMPLE_DECODE = `&lt;div class=&quot;notice&quot;&gt;5 &lt; 10 &amp; &quot;ToolNova&quot; &copy; 2026 &mdash; Caf&#233;&lt;/div&gt;`;

export default function HtmlEntityTool() {
  const { showToast } = useToast();

  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [encodeNonAscii, setEncodeNonAscii] = useState(true);
  const [useNamedCommon, setUseNamedCommon] = useState(false);
  const [input, setInput] = useState('');

  const output = useMemo(() => {
    if (!input) return '';
    return mode === 'encode'
      ? encodeHtmlEntities(input, { encodeNonAscii, useNamedCommon })
      : decodeHtmlEntities(input);
  }, [input, mode, encodeNonAscii, useNamedCommon]);

  const handleSwap = () => {
    const nextMode = mode === 'encode' ? 'decode' : 'encode';
    setMode(nextMode);
    if (output) setInput(output);
  };

  const handleCopy = async () => {
    if (!output) return;
    const ok = await copyToClipboard(output);
    if (ok) showToast(mode === 'encode' ? 'Encoded HTML copied' : 'Decoded text copied', 'success');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 gap-1">
          <button
            type="button"
            onClick={() => setMode('encode')}
            aria-pressed={mode === 'encode'}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mode === 'encode'
                ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Encode (HTML → Entities)
          </button>
          <button
            type="button"
            onClick={() => setMode('decode')}
            aria-pressed={mode === 'decode'}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mode === 'decode'
                ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Decode (Entities → Text)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSwap}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:border-[#635BFF]"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" aria-hidden="true" />
            Swap
          </button>
          <button
            type="button"
            onClick={() => setInput(mode === 'encode' ? SAMPLE_ENCODE : SAMPLE_DECODE)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#635BFF]" aria-hidden="true" />
            Sample
          </button>
          <button
            type="button"
            disabled={!input}
            onClick={() => setInput('')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:text-rose-600 disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            Clear
          </button>
        </div>
      </div>

      {mode === 'encode' && (
        <div className="flex flex-wrap gap-5 p-3.5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 text-xs text-[#111827] dark:text-slate-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={encodeNonAscii}
              onChange={(e) => setEncodeNonAscii(e.target.checked)}
              className="rounded border-slate-300 text-[#635BFF] focus:ring-[#635BFF]"
            />
            Encode non-ASCII characters (e.g. ©, —, é → &#code;)
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useNamedCommon}
              onChange={(e) => setUseNamedCommon(e.target.checked)}
              className="rounded border-slate-300 text-[#635BFF] focus:ring-[#635BFF]"
            />
            Use &amp;apos; instead of &amp;#39; for single quotes
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label htmlFor="ent-input" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
            {mode === 'encode' ? 'Raw HTML / Text Input' : 'HTML Entities Input'}
          </label>
          <textarea
            id="ent-input"
            rows={10}
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'encode'
                ? 'Paste raw HTML tags or special symbols...'
                : 'Paste &lt;div&gt;, &amp;, &#x1F600; entities...'
            }
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] font-mono text-xs sm:text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="ent-output" className="text-sm font-medium text-[#111827] dark:text-slate-200">
              {mode === 'encode' ? 'Encoded Entities' : 'Decoded Plain Text'}
            </label>
            <button
              type="button"
              disabled={!output}
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-40"
            >
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              Copy Output
            </button>
          </div>
          <textarea
            id="ent-output"
            rows={10}
            readOnly
            spellCheck={false}
            value={output}
            placeholder="Converted output appears here..."
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#10131C] font-mono text-xs sm:text-sm text-[#111827] dark:text-white focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
