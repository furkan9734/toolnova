import { useState } from 'react';
import { Copy, RotateCcw, Trash2, Download } from 'lucide-react';
import { convertTextCase, type CaseTransformMode } from '../utils/textLogic';
import { copyToClipboard, downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

export default function CaseConverterTool() {
  const { showToast } = useToast();
  const [text, setText] = useState('');
  const [previousText, setPreviousText] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<CaseTransformMode | null>(null);

  const applyTransform = (mode: CaseTransformMode) => {
    if (!text.trim()) {
      showToast('Enter some text first', 'info');
      return;
    }
    setPreviousText(text);
    const converted = convertTextCase(text, mode);
    setText(converted);
    setActiveMode(mode);
  };

  const handleUndo = () => {
    if (previousText === null) return;
    setText(previousText);
    setPreviousText(null);
    setActiveMode(null);
  };

  const handleCopy = async () => {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) showToast('Converted text copied', 'success');
  };

  const handleDownloadTxt = () => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `toolnova-converted-${Date.now()}.txt`);
    showToast('Text file downloaded', 'success');
  };

  const modes: { id: CaseTransformMode; label: string; example: string }[] = [
    { id: 'uppercase', label: 'UPPERCASE', example: 'HELLO WORLD' },
    { id: 'lowercase', label: 'lowercase', example: 'hello world' },
    { id: 'titlecase', label: 'Title Case', example: 'Hello World' },
    { id: 'sentencecase', label: 'Sentence case', example: 'Hello world.' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => applyTransform(m.id)}
            className={`text-left px-4 py-3 rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635BFF] ${
              activeMode === m.id
                ? 'border-[#635BFF] bg-[#635BFF]/10 text-[#635BFF] dark:text-[#8B5CF6]'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#10131C] text-[#111827] dark:text-white hover:border-[#635BFF]/50'
            }`}
          >
            <span className="block font-display text-sm font-semibold">{m.label}</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {m.example}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <label htmlFor="case-converter-input" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
          Text Workspace
        </label>
        <textarea
          id="case-converter-input"
          rows={10}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setActiveMode(null);
          }}
          placeholder="Paste or type text here, then click a case style above..."
          className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-sm sm:text-base text-[#111827] dark:text-white leading-relaxed placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {text.length.toLocaleString()} characters
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          {previousText !== null && (
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Undo
            </button>
          )}
          <button
            type="button"
            disabled={!text}
            onClick={handleDownloadTxt}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Save .txt
          </button>
          <button
            type="button"
            disabled={!text}
            onClick={() => {
              setText('');
              setPreviousText(null);
              setActiveMode(null);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:text-rose-600 disabled:opacity-40 transition-colors"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Clear
          </button>
          <button
            type="button"
            disabled={!text}
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-40 transition-colors"
          >
            <Copy className="w-4 h-4" aria-hidden="true" />
            Copy Output
          </button>
        </div>
      </div>
    </div>
  );
}
