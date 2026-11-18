import { useState, useMemo } from 'react';
import { Copy, Download, Trash2, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { minifyCode, type CodeLanguage } from '../utils/codeToolsLogic';
import { formatBytes } from '../utils/formatters';
import { copyToClipboard, downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

const SAMPLES: Record<CodeLanguage, string> = {
  html: `<!doctype html>
<html lang="en">
  <head>
    <title>ToolNova Sample</title>
  </head>
  <body>
    <!-- Main hero section -->
    <main class="container">
      <h1>Every Tool You Need.</h1>
      <p>Fast client-side processing.</p>
    </main>
  </body>
</html>`,
  css: `/* Primary button styling */
.btn-primary {
  background-color: #635BFF;
  color: #FFFFFF;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
}

.btn-primary:hover {
  background-color: #534AE8;
}`,
  javascript: `// Pure static example (never executed)
function calculateDiscount(price, percent) {
  if (price < 0 || percent < 0) {
    return 0;
  }
  const savings = (price * percent) / 100;
  return Number((price - savings).toFixed(2));
}`,
};

export default function CodeMinifierTool() {
  const { showToast } = useToast();

  const [language, setLanguage] = useState<CodeLanguage>('javascript');
  const [input, setInput] = useState('');

  const outcome = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { ok: true as const, data: minifyCode(input, language) };
    } catch (err: unknown) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : 'Minification failed.',
      };
    }
  }, [input, language]);

  const handleCopy = async () => {
    if (!outcome?.ok) return;
    const copied = await copyToClipboard(outcome.data.minified);
    if (copied) showToast('Minified code copied', 'success');
  };

  const handleDownload = () => {
    if (!outcome?.ok) return;
    const ext = language === 'javascript' ? 'js' : language;
    const blob = new Blob([outcome.data.minified], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `code.min.${ext}`);
    showToast(`Downloaded code.min.${ext}`, 'success');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Code language"
          className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 gap-1"
        >
          {(
            [
              { id: 'html', label: 'HTML' },
              { id: 'css', label: 'CSS' },
              { id: 'javascript', label: 'JavaScript' },
            ] as const
          ).map((lang) => (
            <button
              key={lang.id}
              type="button"
              onClick={() => setLanguage(lang.id)}
              aria-pressed={language === lang.id}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                language === lang.id
                  ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setInput(SAMPLES[language])}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#635BFF]" aria-hidden="true" />
            Sample {language.toUpperCase()}
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

      {outcome?.ok && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Original Size</p>
              <p className="font-mono text-sm font-semibold text-[#111827] dark:text-white tabular-nums">
                {formatBytes(outcome.data.originalBytes)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Minified Size</p>
              <p className="font-mono text-sm font-semibold text-[#635BFF] dark:text-[#8B5CF6] tabular-nums">
                {formatBytes(outcome.data.minifiedBytes)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Space Saved</p>
              <p className="font-mono text-sm font-semibold text-[#22C55E] tabular-nums">
                -{outcome.data.savedPercent}% ({formatBytes(outcome.data.savedBytes)})
              </p>
            </div>
          </div>

          {outcome.data.warning ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{outcome.data.warning}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Static token check passed. Code is processed strictly as text and never executed.</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label htmlFor="min-input" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
            Source {language.toUpperCase()}
          </label>
          <textarea
            id="min-input"
            rows={12}
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Paste your ${language.toUpperCase()} code here...`}
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] font-mono text-xs sm:text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="min-output" className="text-sm font-medium text-[#111827] dark:text-slate-200">
              Minified Output
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!outcome?.ok}
                onClick={handleDownload}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Save File
              </button>
              <button
                type="button"
                disabled={!outcome?.ok}
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-40"
              >
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                Copy
              </button>
            </div>
          </div>
          <textarea
            id="min-output"
            rows={12}
            readOnly
            spellCheck={false}
            value={outcome?.ok ? outcome.data.minified : ''}
            placeholder="Minified code appears here..."
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#10131C] font-mono text-xs sm:text-sm text-[#111827] dark:text-white focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
