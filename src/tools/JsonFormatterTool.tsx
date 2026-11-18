import { useState, useMemo } from 'react';
import { Copy, Download, Trash2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { processJsonText, type JsonIndentOption } from '../utils/devToolsLogic';
import { copyToClipboard, downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

const SAMPLE_JSON = `{"platform":"ToolNova","totalTools":25,"categories":["Image","PDF","Text","Developer","Calculators"],"clientSideOnly":true}`;

export default function JsonFormatterTool() {
  const { showToast } = useToast();

  const [input, setInput] = useState('');
  const [indent, setIndent] = useState<JsonIndentOption>(2);

  const result = useMemo(() => {
    if (!input.trim()) return null;
    return processJsonText(input, indent);
  }, [input, indent]);

  const handleCopy = async () => {
    if (!result?.valid) return;
    const ok = await copyToClipboard(result.output);
    if (ok) showToast('Formatted JSON copied', 'success');
  };

  const handleDownload = () => {
    if (!result?.valid) return;
    const blob = new Blob([result.output], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, `toolnova-formatted-${Date.now()}.json`);
    showToast('JSON file downloaded', 'success');
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Formatting indentation"
          className="inline-flex flex-wrap p-1 rounded-xl bg-slate-100 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 gap-1"
        >
          {(
            [
              { id: 2, label: '2 Spaces' },
              { id: 4, label: '4 Spaces' },
              { id: 'tab', label: 'Tabs' },
              { id: 'minify', label: 'Minify' },
            ] as const
          ).map((opt) => (
            <button
              key={String(opt.id)}
              type="button"
              onClick={() => setIndent(opt.id)}
              aria-pressed={indent === opt.id}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                indent === opt.id
                  ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setInput(SAMPLE_JSON)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#635BFF]" aria-hidden="true" />
            Sample JSON
          </button>
          <button
            type="button"
            disabled={!input}
            onClick={() => setInput('')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:text-rose-600 disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>

      {/* Validation Status Banner */}
      {result && (
        <div
          role={result.valid ? 'status' : 'alert'}
          className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-xs sm:text-sm ${
            result.valid
              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          {result.valid ? (
            <>
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>Valid JSON ({result.output.length.toLocaleString()} characters)</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-medium">
                  Invalid JSON
                  {result.errorLine !== undefined
                    ? ` at Line ${result.errorLine}${
                        result.errorColumn !== undefined ? `, Column ${result.errorColumn}` : ''
                      }`
                    : ''}
                </p>
                <p className="font-mono text-xs mt-0.5 opacity-90">{result.errorMessage}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Editor & Formatted Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label htmlFor="json-input" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
            JSON Input
          </label>
          <textarea
            id="json-input"
            rows={12}
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"hello": "world"}'
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] font-mono text-xs sm:text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="json-output" className="text-sm font-medium text-[#111827] dark:text-slate-200">
              {indent === 'minify' ? 'Minified Output' : 'Formatted Output'}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!result?.valid}
                onClick={handleDownload}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Save .json
              </button>
              <button
                type="button"
                disabled={!result?.valid}
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-40"
              >
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                Copy
              </button>
            </div>
          </div>
          <textarea
            id="json-output"
            rows={12}
            readOnly
            spellCheck={false}
            value={result?.valid ? result.output : ''}
            placeholder="Formatted JSON appears here when input is valid..."
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#10131C] font-mono text-xs sm:text-sm text-[#111827] dark:text-white focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
