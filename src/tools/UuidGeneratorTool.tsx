import { useState, useEffect, useCallback } from 'react';
import { Copy, RefreshCw, Download, RotateCcw } from 'lucide-react';
import { generateUuidBatch } from '../utils/devToolsLogic';
import { copyToClipboard, downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

export default function UuidGeneratorTool() {
  const { showToast } = useToast();

  const [count, setCount] = useState<number>(5);
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [hyphens, setHyphens] = useState<boolean>(true);
  const [uuids, setUuids] = useState<string[]>([]);

  const regenerate = useCallback(() => {
    setUuids(generateUuidBatch(count, { uppercase, hyphens }));
  }, [count, uppercase, hyphens]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  const handleCopySingle = async (uuid: string) => {
    const ok = await copyToClipboard(uuid);
    if (ok) showToast('UUID copied', 'success', uuid);
  };

  const handleCopyAll = async () => {
    if (uuids.length === 0) return;
    const ok = await copyToClipboard(uuids.join('\n'));
    if (ok) showToast(`Copied ${uuids.length} UUIDs`, 'success');
  };

  const handleDownloadTxt = () => {
    if (uuids.length === 0) return;
    const blob = new Blob([uuids.join('\n')], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `toolnova-uuids-${Date.now()}.txt`);
    showToast('UUID list downloaded', 'success');
  };

  const handleReset = () => {
    setCount(5);
    setUppercase(false);
    setHyphens(true);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 items-end">
        <div className="md:col-span-3 space-y-1.5">
          <label htmlFor="uuid-count" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
            Quantity (1–100)
          </label>
          <input
            id="uuid-count"
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => {
              const val = Math.min(100, Math.max(1, Number(e.target.value) || 1));
              setCount(val);
            }}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        <div className="md:col-span-5 flex flex-wrap gap-3 pb-1">
          <label className="inline-flex items-center gap-2 text-sm text-[#111827] dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#635BFF] focus:ring-[#635BFF]"
            />
            Uppercase
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-[#111827] dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={hyphens}
              onChange={(e) => setHyphens(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#635BFF] focus:ring-[#635BFF]"
            />
            Include Hyphens
          </label>
        </div>

        <div className="md:col-span-4 flex flex-wrap sm:flex-nowrap gap-2">
          <button
            type="button"
            onClick={regenerate}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] transition-colors whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Generate
          </button>
          <button
            type="button"
            onClick={handleReset}
            aria-label="Reset UUID options"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>

      {/* Bulk actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
          RFC 4122 Version 4 · {uuids.length} {uuids.length === 1 ? 'UUID' : 'UUIDs'}
        </p>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadTxt}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Download .txt
          </button>
          <button
            type="button"
            onClick={handleCopyAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] transition-colors"
          >
            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            Copy All
          </button>
        </div>
      </div>

      {/* UUID List */}
      <ul className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C] max-h-[420px] overflow-y-auto">
        {uuids.map((uuid, idx) => (
          <li
            key={`${uuid}-${idx}`}
            className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono text-xs text-slate-400 w-6 shrink-0">
                {idx + 1}.
              </span>
              <span className="font-mono text-xs sm:text-sm text-[#111827] dark:text-white truncate select-all">
                {uuid}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopySingle(uuid)}
              aria-label={`Copy UUID ${idx + 1}`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-[#635BFF] hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            >
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              Copy
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
