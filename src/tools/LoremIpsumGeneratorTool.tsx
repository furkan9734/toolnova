import { useState, useMemo } from 'react';
import { Copy, Download, RefreshCw } from 'lucide-react';
import { generateLoremIpsum } from '../utils/productivityLogic';
import { copyToClipboard, downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

export default function LoremIpsumGeneratorTool() {
  const { showToast } = useToast();

  const [mode, setMode] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [count, setCount] = useState(3);
  const [startWithClassic, setStartWithClassic] = useState(true);
  const [seedTick, setSeedTick] = useState(0);

  const output = useMemo(() => {
    void seedTick;
    return generateLoremIpsum(mode, count, startWithClassic);
  }, [mode, count, startWithClassic, seedTick]);

  const maxLimit = mode === 'words' ? 500 : mode === 'sentences' ? 60 : 25;

  const handleModeChange = (next: 'paragraphs' | 'sentences' | 'words') => {
    setMode(next);
    if (next === 'words') setCount(60);
    else if (next === 'sentences') setCount(5);
    else setCount(3);
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(output);
    if (ok) showToast('Placeholder text copied', 'success');
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `lorem-ipsum-${mode}-${count}.txt`);
    showToast('Lorem Ipsum .txt downloaded', 'success');
  };

  const wordCount = output.trim() ? output.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex p-1 rounded-xl bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-700 gap-1">
            {(['paragraphs', 'sentences', 'words'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleModeChange(m)}
                aria-pressed={mode === m}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize ${
                  mode === m ? 'bg-[#635BFF] text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="lorem-count" className="text-xs font-medium text-[#111827] dark:text-slate-200">
              Count:
            </label>
            <input
              id="lorem-count"
              type="number"
              min={1}
              max={maxLimit}
              value={count}
              onChange={(e) =>
                setCount(Math.max(1, Math.min(maxLimit, Number(e.target.value) || 1)))
              }
              className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-sm text-[#111827] dark:text-white tabular-nums"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-[#111827] dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={startWithClassic}
              onChange={(e) => setStartWithClassic(e.target.checked)}
              className="rounded border-slate-300 text-[#635BFF] focus:ring-[#635BFF]"
            />
            Start with &ldquo;Lorem ipsum dolor sit amet...&rdquo;
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSeedTick((t) => t + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Save .txt
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#635BFF] hover:bg-[#534AE8]"
          >
            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            Copy Text
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span>Generated Placeholder Text</span>
          <span>
            {wordCount} words · {output.length.toLocaleString()} characters
          </span>
        </div>
        <textarea
          aria-label="Generated Lorem Ipsum output"
          rows={12}
          readOnly
          value={output}
          className="w-full p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#10131C] text-sm text-[#111827] dark:text-slate-200 leading-relaxed focus:outline-none"
        />
      </div>
    </div>
  );
}
