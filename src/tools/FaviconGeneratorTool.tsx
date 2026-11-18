import { useState, useEffect } from 'react';
import { Download, Copy, Trash2, Check } from 'lucide-react';
import { FileDropzone } from '../components/FileDropzone';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { validateImageFile } from '../utils/fileValidation';
import { loadImageFromFile, type LoadedImageMeta } from '../utils/imageLogic';
import {
  STANDARD_FAVICON_SIZES,
  generateFaviconSizes,
  buildIcoBlobFromPngBlobs,
  type GeneratedFaviconItem,
} from '../utils/imageAdvancedLogic';
import { formatBytes } from '../utils/formatters';
import { copyToClipboard, downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

const HTML_SNIPPET = `<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />`;

export default function FaviconGeneratorTool() {
  const { showToast } = useToast();

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceMeta, setSourceMeta] = useState<LoadedImageMeta | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<number[]>([...STANDARD_FAVICON_SIZES]);
  const [useBackground, setUseBackground] = useState(false);
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [paddingPct, setPaddingPct] = useState(0);
  const [borderRadiusPct, setBorderRadiusPct] = useState(0);

  const [items, setItems] = useState<GeneratedFaviconItem[]>([]);
  const [icoBlob, setIcoBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (sourceMeta?.previewUrl) URL.revokeObjectURL(sourceMeta.previewUrl);
    };
  }, [sourceMeta]);

  useEffect(() => {
    return () => {
      items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [items]);

  const handleFilesSelected = async (files: File[]) => {
    const file = files[0];
    const check = validateImageFile(file);
    if (!check.valid) {
      setError(check.error || 'Invalid image file.');
      return;
    }

    setError(null);
    try {
      const meta = await loadImageFromFile(file);
      setSourceFile(file);
      setSourceMeta(meta);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to decode image.');
    }
  };

  useEffect(() => {
    if (!sourceMeta || selectedSizes.length === 0) {
      setItems([]);
      setIcoBlob(null);
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setIsGenerating(true);
      try {
        const sorted = [...selectedSizes].sort((a, b) => a - b);
        const generated = await generateFaviconSizes(sourceMeta.element, sorted, {
          backgroundColor: useBackground ? bgColor : null,
          paddingPct,
          borderRadiusPct,
        });

        const icoCandidates = generated.filter((g) => g.size <= 48);
        const icoSource = icoCandidates.length > 0 ? icoCandidates : [generated[0]];
        const icoEntries = await Promise.all(
          icoSource.map(async (item) => ({
            size: item.size,
            pngBytes: new Uint8Array(await item.blob.arrayBuffer()),
          }))
        );
        const builtIco = await buildIcoBlobFromPngBlobs(icoEntries);

        if (active) {
          setItems(generated);
          setIcoBlob(builtIco);
        } else {
          generated.forEach((g) => URL.revokeObjectURL(g.previewUrl));
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Favicon generation failed.');
        }
      } finally {
        if (active) setIsGenerating(false);
      }
    }, 120);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [sourceMeta, selectedSizes, useBackground, bgColor, paddingPct, borderRadiusPct]);

  const toggleSize = (size: number) => {
    setSelectedSizes((prev) => {
      if (prev.includes(size)) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== size);
      }
      return [...prev, size];
    });
  };

  const handleDownloadIco = () => {
    if (!icoBlob) return;
    downloadBlob(icoBlob, 'favicon.ico');
    showToast('favicon.ico downloaded', 'success', formatBytes(icoBlob.size));
  };

  const handleDownloadPng = (item: GeneratedFaviconItem) => {
    const filename =
      item.size === 180
        ? 'apple-touch-icon.png'
        : `favicon-${item.size}x${item.size}.png`;
    downloadBlob(item.blob, filename);
    showToast(`${filename} downloaded`, 'success');
  };

  const handleCopySnippet = async () => {
    const ok = await copyToClipboard(HTML_SNIPPET);
    if (ok) showToast('HTML favicon tags copied', 'success');
  };

  const handleReset = () => {
    setSourceFile(null);
    setSourceMeta(null);
    setItems([]);
    setIcoBlob(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {!sourceFile || !sourceMeta ? (
        <FileDropzone
          accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
          label="Drop a logo or square icon to generate favicons"
          hint="Creates 16×16, 32×32, 48×48, 64×64, 180×180 Apple Touch, 192×192, and 512×512 PNGs plus a multi-size .ico file."
          error={error}
          onFilesSelected={handleFilesSelected}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="space-y-2">
                <span className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                  Target Icon Sizes (px)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {STANDARD_FAVICON_SIZES.map((sz) => {
                    const active = selectedSizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleSize(sz)}
                        aria-pressed={active}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                          active
                            ? 'border-[#635BFF] bg-[#635BFF] text-white'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {active && <Check className="w-3 h-3" aria-hidden="true" />}
                        {sz}×{sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-[#111827] dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useBackground}
                    onChange={(e) => setUseBackground(e.target.checked)}
                    className="rounded border-slate-300 text-[#635BFF] focus:ring-[#635BFF]"
                  />
                  Fill solid background color
                </label>
                {useBackground && (
                  <div className="flex items-center gap-2 pl-6">
                    <input
                      type="color"
                      aria-label="Favicon background color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-9 h-8 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                    />
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                      {bgColor.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <label htmlFor="fav-pad" className="font-medium text-[#111827] dark:text-slate-200">
                    Inner Padding
                  </label>
                  <span className="font-mono text-slate-500">{paddingPct}%</span>
                </div>
                <input
                  id="fav-pad"
                  type="range"
                  min={0}
                  max={30}
                  value={paddingPct}
                  onChange={(e) => setPaddingPct(Number(e.target.value))}
                  className="w-full accent-[#635BFF]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <label htmlFor="fav-radius" className="font-medium text-[#111827] dark:text-slate-200">
                    Corner Rounding
                  </label>
                  <span className="font-mono text-slate-500">{borderRadiusPct}%</span>
                </div>
                <input
                  id="fav-radius"
                  type="range"
                  min={0}
                  max={50}
                  value={borderRadiusPct}
                  onChange={(e) => setBorderRadiusPct(Number(e.target.value))}
                  className="w-full accent-[#635BFF]"
                />
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={!icoBlob || isGenerating}
                onClick={handleDownloadIco}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-50 transition-colors"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                Download favicon.ico {icoBlob ? `(${formatBytes(icoBlob.size)})` : ''}
              </button>
              <button
                type="button"
                onClick={handleReset}
                aria-label="Reset favicon generator"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 hover:text-rose-600"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                Reset
              </button>
            </div>

            {/* HTML Head Snippet */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#111827] dark:text-slate-200">
                  HTML Head Tags
                </span>
                <button
                  type="button"
                  onClick={handleCopySnippet}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#635BFF] dark:text-[#8B5CF6] hover:underline"
                >
                  <Copy className="w-3 h-3" aria-hidden="true" />
                  Copy Tags
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 overflow-x-auto">
                {HTML_SNIPPET}
              </pre>
            </div>
          </div>

          {/* Generated Icons Preview Grid */}
          <div className="lg:col-span-7 space-y-4">
            {/* Browser Tab Preview */}
            {items.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                  Browser Tab Simulation
                </span>
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-t-lg bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-700 max-w-xs">
                  <img
                    src={(items.find((i) => i.size === 32) ?? items[0]).previewUrl}
                    alt="Browser tab favicon preview"
                    className="w-4 h-4 object-contain"
                  />
                  <span className="text-xs font-medium text-[#111827] dark:text-white truncate">
                    Your Website Title
                  </span>
                </div>
              </div>
            )}

            {isGenerating && items.length === 0 ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner label="Rendering favicon sizes..." />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {items.map((item) => (
                  <div
                    key={item.size}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-between gap-3 text-center"
                  >
                    <div>
                      <p className="font-mono text-xs font-semibold text-[#111827] dark:text-white">
                        {item.size} × {item.size}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.label}</p>
                    </div>

                    <div className="w-16 h-16 rounded-lg bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 flex items-center justify-center p-2">
                      <img
                        src={item.previewUrl}
                        alt={`${item.size}x${item.size} favicon preview`}
                        style={{
                          width: Math.min(48, Math.max(16, item.size)),
                          height: Math.min(48, Math.max(16, item.size)),
                        }}
                        className="object-contain"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadPng(item)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-[#111827] dark:text-slate-200 hover:border-[#635BFF]"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      PNG ({formatBytes(item.byteSize)})
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
