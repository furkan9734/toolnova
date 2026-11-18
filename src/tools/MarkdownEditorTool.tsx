import { useState, useMemo, useRef } from 'react';
import { Copy, Download, Trash2, Sparkles } from 'lucide-react';
import { renderSafeMarkdown, buildStandaloneHtmlDocument } from '../utils/productivityLogic';
import { copyToClipboard, downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

const SAMPLE_MARKDOWN = `# ToolNova Release Notes

Write **bold**, *italic*, ~~strikethrough~~, or \`inline code\` with live sanitized preview.

## Key Highlights
- Browser-native processing with zero server uploads
- Works seamlessly on desktop and mobile browsers

> Tip: Use the toolbar above to insert Markdown syntax quickly.

\`\`\`ts
export function greet(name: string) {
  return \`Hello, \${name}!\`;
}
\`\`\`

| Feature | Format | Status |
| :--- | :--- | :--- |
| Live Preview | Sanitized HTML | Ready |
| Export | .md / .html | Ready |
`;

export default function MarkdownEditorTool() {
  const { showToast } = useToast();

  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sanitizedHtml = useMemo(() => renderSafeMarkdown(markdown), [markdown]);

  const insertSnippet = (before: string, after = '', placeholder = 'text') => {
    const el = textareaRef.current;
    if (!el) {
      setMarkdown((prev) => `${prev}${before}${placeholder}${after}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = markdown.slice(start, end) || placeholder;
    const next = markdown.slice(0, start) + before + selected + after + markdown.slice(end);
    setMarkdown(next);
    window.requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const handleCopyMarkdown = async () => {
    if (!markdown) return;
    const ok = await copyToClipboard(markdown);
    if (ok) showToast('Markdown copied', 'success');
  };

  const handleCopyHtml = async () => {
    if (!sanitizedHtml) return;
    const ok = await copyToClipboard(sanitizedHtml);
    if (ok) showToast('Sanitized HTML copied', 'success');
  };

  const handleDownloadMd = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, `document-${Date.now()}.md`);
    showToast('Markdown (.md) downloaded', 'success');
  };

  const handleDownloadHtml = () => {
    const fullDoc = buildStandaloneHtmlDocument('ToolNova Markdown Export', sanitizedHtml);
    const blob = new Blob([fullDoc], { type: 'text/html;charset=utf-8' });
    downloadBlob(blob, `document-${Date.now()}.html`);
    showToast('Standalone HTML (.html) downloaded', 'success');
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { label: 'H1', fn: () => insertSnippet('# ', '', 'Heading 1') },
            { label: 'H2', fn: () => insertSnippet('## ', '', 'Heading 2') },
            { label: 'Bold', fn: () => insertSnippet('**', '**', 'bold text') },
            { label: 'Italic', fn: () => insertSnippet('*', '*', 'italic text') },
            { label: 'Code', fn: () => insertSnippet('`', '`', 'code') },
            { label: 'Quote', fn: () => insertSnippet('> ', '', 'Quote') },
            { label: 'List', fn: () => insertSnippet('- ', '', 'List item') },
            { label: 'Link', fn: () => insertSnippet('[', '](https://example.com)', 'Link text') },
          ].map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={btn.fn}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:border-[#635BFF]"
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMarkdown(SAMPLE_MARKDOWN)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#635BFF]" aria-hidden="true" />
            Sample
          </button>
          <button
            type="button"
            disabled={!markdown}
            onClick={() => setMarkdown('')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:text-rose-600 disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            Clear
          </button>
        </div>
      </div>

      {/* Split Editor & Sanitized Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="md-editor-input" className="text-sm font-medium text-[#111827] dark:text-slate-200">
              Markdown Source
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!markdown}
                onClick={handleDownloadMd}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                .md
              </button>
              <button
                type="button"
                disabled={!markdown}
                onClick={handleCopyMarkdown}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-40"
              >
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                Copy MD
              </button>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            id="md-editor-input"
            rows={16}
            spellCheck={false}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="# Start writing Markdown..."
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] font-mono text-xs sm:text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#111827] dark:text-slate-200">
              Sanitized Live Preview
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!markdown}
                onClick={handleDownloadHtml}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                .html
              </button>
              <button
                type="button"
                disabled={!markdown}
                onClick={handleCopyHtml}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 disabled:opacity-40"
              >
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                Copy HTML
              </button>
            </div>
          </div>

          <div
            aria-label="Rendered Markdown preview"
            className="min-h-[380px] max-h-[440px] overflow-y-auto p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#10131C] text-sm text-[#111827] dark:text-slate-200 leading-relaxed space-y-3 [&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-1.5 [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-[#635BFF] [&_blockquote]:pl-3 [&_blockquote]:text-slate-600 [&_blockquote]:dark:text-slate-400 [&_code]:font-mono [&_code]:text-xs [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-slate-200/70 [&_code]:dark:bg-slate-800 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:dark:border-slate-700 [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-left [&_td]:border [&_td]:border-slate-300 [&_td]:dark:border-slate-700 [&_td]:px-3 [&_td]:py-1.5 [&_a]:text-[#635BFF] [&_a]:underline"
            dangerouslySetInnerHTML={{
              __html: sanitizedHtml || '<p class="text-slate-400">Preview appears as you type...</p>',
            }}
          />
        </div>
      </div>
    </div>
  );
}
