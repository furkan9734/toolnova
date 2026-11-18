import { useState, useMemo } from 'react';
import { Copy, Trash2, Sparkles } from 'lucide-react';
import { analyzeText } from '../utils/textLogic';
import { copyToClipboard } from '../utils/download';
import { useToast } from '../hooks/useToast';

const SAMPLE_TEXT = `ToolNova helps writers, developers, and designers handle everyday file and text tasks directly inside the browser.

By keeping processing local, documents never leave your device. Fast typography metrics allow editors to verify article length, sentence flow, and estimated reading time in seconds.`;

export default function WordCounterTool() {
  const { showToast } = useToast();
  const [text, setText] = useState('');

  const stats = useMemo(() => analyzeText(text), [text]);

  const handleCopy = async () => {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) showToast('Text copied to clipboard', 'success');
  };

  const metrics = [
    { label: 'Words', value: stats.words.toLocaleString() },
    { label: 'Characters', value: stats.characters.toLocaleString() },
    { label: 'No Spaces', value: stats.charactersWithoutSpaces.toLocaleString() },
    { label: 'Sentences', value: stats.sentences.toLocaleString() },
    { label: 'Paragraphs', value: stats.paragraphs.toLocaleString() },
    { label: 'Reading Time', value: stats.readingTimeLabel },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">{metric.label}</p>
            <p className="mt-1 font-mono text-xl font-semibold text-[#111827] dark:text-white tabular-nums">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Textarea Editor */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="word-counter-textarea"
            className="text-sm font-medium text-[#111827] dark:text-slate-200"
          >
            Paste or type your text
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setText(SAMPLE_TEXT)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#635BFF]" aria-hidden="true" />
              Insert Sample
            </button>
            <button
              type="button"
              disabled={!text}
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              Copy
            </button>
            <button
              type="button"
              disabled={!text}
              onClick={() => setText('')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:text-rose-600 disabled:opacity-40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              Clear
            </button>
          </div>
        </div>

        <textarea
          id="word-counter-textarea"
          rows={11}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing or paste an article, essay, or product copy here..."
          className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-sm sm:text-base text-[#111827] dark:text-white leading-relaxed placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span>{stats.lines} {stats.lines === 1 ? 'line' : 'lines'}</span>
          <span>Estimated speaking time (130 WPM): {stats.speakingTimeLabel}</span>
        </div>
      </div>
    </div>
  );
}
