import { useState, useMemo } from 'react';
import { Copy, Download, Trash2, Sparkles, AlertTriangle } from 'lucide-react';
import { beautifyCode, type CodeLanguage, type IndentOption } from '../utils/codeToolsLogic';
import { copyToClipboard, downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

const SAMPLES: Record<CodeLanguage, string> = {
  html: `<div class="card"><header><h2>ToolNova</h2></header><p>Clean formatted HTML markup.</p></div>`,
  css: `.card{display:flex;flex-direction:column;gap:12px;padding:20px;border-radius:12px;background:#ffffff}.card h2{font-size:18px;color:#111827}`,
  javascript: `function greetUser(name,role){if(!name){return "Guest";}const label=role==="pro"?"Premium":"Free";return name+" ("+label+")";}`,
};

export default function CodeBeautifierTool() {
  const { showToast } = useToast();

  const [language, setLanguage] = useState<CodeLanguage>('html');
  const [indent, setIndent] = useState<IndentOption>('2');
  const [input, setInput] = useState('');

  const outcome = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { ok: true as const, data: beautifyCode(input, language, indent) };
    } catch (err: unknown) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : 'Formatting failed.',
      };
    }
  }, [input, language, indent]);

  const handleCopy = async () => {
    if (!outcome?.ok) return;
    const copied = await copyToClipboard(outcome.data.formatted);
    if (copied) showToast('Formatted code copied', 'success');
  };

  const handleDownload = () => {
    if (!outcome?.ok) return;
    const ext = language === 'javascript' ? 'js' : language;
    const blob = new Blob([outcome.data.formatted], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `formatted.${ext}`);
    showToast(`Downloaded formatted.${ext}`, 'success');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  language === lang.id
                    ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <div
            role="group"
            aria-label="Indentation size"
            className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 gap-1"
          >
            {(
              [
                { id: '2', label: '2 Spaces' },
                { id: '4', label: '4 Spaces' },
                { id: 'tab', label: 'Tabs' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
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

      {outcome?.ok && outcome.data.warning && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{outcome.data.warning}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label htmlFor="beau-input" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
            Minified or Raw {language.toUpperCase()}
          </label>
          <textarea
            id="beau-input"
            rows={13}
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Paste your ${language.toUpperCase()} code to indent and format...`}
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] font-mono text-xs sm:text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="beau-output" className="text-sm font-medium text-[#111827] dark:text-slate-200">
              Beautified Output
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
            id="beau-output"
            rows={13}
            readOnly
            spellCheck={false}
            value={outcome?.ok ? outcome.data.formatted : ''}
            placeholder="Formatted output appears here..."
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#10131C] font-mono text-xs sm:text-sm text-[#111827] dark:text-white focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
