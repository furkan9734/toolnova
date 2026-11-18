import { useState, useCallback } from 'react';
import { RefreshCw, Copy, Download, Lock, Unlock } from 'lucide-react';
import {
  generateColorPalette,
  type PaletteColor,
  type PaletteHarmony,
} from '../utils/codeToolsLogic';
import { copyToClipboard, downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

const HARMONIES: { id: PaletteHarmony; label: string }[] = [
  { id: 'analogous', label: 'Analogous' },
  { id: 'monochromatic', label: 'Monochromatic' },
  { id: 'complementary', label: 'Complementary' },
  { id: 'triadic', label: 'Triadic' },
  { id: 'split-complementary', label: 'Split Comp.' },
  { id: 'random', label: 'Random' },
];

export default function ColorPaletteGeneratorTool() {
  const { showToast } = useToast();

  const [baseHex, setBaseHex] = useState('#635BFF');
  const [harmony, setHarmony] = useState<PaletteHarmony>('analogous');
  const [locked, setLocked] = useState<boolean[]>([false, false, false, false, false]);
  const [colors, setColors] = useState<PaletteColor[]>(() =>
    generateColorPalette('#635BFF', 'analogous', 5)
  );

  const regenerate = useCallback(
    (nextHex = baseHex, nextHarmony = harmony, nextLocked = locked) => {
      setColors((prev) => generateColorPalette(nextHex, nextHarmony, 5, prev, nextLocked));
    },
    [baseHex, harmony, locked]
  );

  const handleHarmonyChange = (next: PaletteHarmony) => {
    setHarmony(next);
    regenerate(baseHex, next, locked);
  };

  const handleBaseColorChange = (hex: string) => {
    setBaseHex(hex);
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      regenerate(hex, harmony, locked);
    }
  };

  const toggleLock = (index: number) => {
    setLocked((prev) => prev.map((val, i) => (i === index ? !val : val)));
  };

  const copyValue = async (text: string, label: string) => {
    const ok = await copyToClipboard(text);
    if (ok) showToast(`Copied ${label}`, 'success', text);
  };

  const handleExportCss = async () => {
    const cssVars = `:root {\n${colors
      .map((c, i) => `  --color-palette-${i + 1}: ${c.hex}; /* ${c.rgb} */`)
      .join('\n')}\n}`;
    const ok = await copyToClipboard(cssVars);
    if (ok) showToast('CSS variables copied', 'success');
  };

  const handleExportJson = () => {
    const json = JSON.stringify(colors, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, `toolnova-palette-${Date.now()}.json`);
    showToast('Palette JSON downloaded', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="pal-base" className="text-xs font-medium text-[#111827] dark:text-slate-200">
              Base Color
            </label>
            <input
              id="pal-base"
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(baseHex) ? baseHex : '#635BFF'}
              onChange={(e) => handleBaseColorChange(e.target.value)}
              className="w-9 h-8 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
            />
            <input
              type="text"
              aria-label="Base HEX code"
              value={baseHex}
              onChange={(e) => handleBaseColorChange(e.target.value)}
              className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-xs text-[#111827] dark:text-white"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {HARMONIES.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => handleHarmonyChange(h.id)}
                aria-pressed={harmony === h.id}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  harmony === h.id
                    ? 'border-[#635BFF] bg-[#635BFF] text-white'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200'
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => regenerate()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#635BFF] hover:bg-[#534AE8]"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            Generate
          </button>
          <button
            type="button"
            onClick={handleExportCss}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 hover:border-[#635BFF]"
          >
            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            Copy CSS
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 hover:border-[#635BFF]"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Swatches */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {colors.map((color, idx) => (
          <div
            key={`${idx}-${color.hex}`}
            className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C] flex flex-col"
          >
            <div
              style={{ backgroundColor: color.hex }}
              className="h-36 sm:h-44 p-3 flex items-start justify-end"
            >
              <button
                type="button"
                onClick={() => toggleLock(idx)}
                aria-label={locked[idx] ? `Unlock swatch ${idx + 1}` : `Lock swatch ${idx + 1}`}
                aria-pressed={locked[idx]}
                style={{ color: color.contrastText }}
                className="p-2 rounded-lg bg-black/15 backdrop-blur-xs hover:bg-black/25 transition-colors"
              >
                {locked[idx] ? (
                  <Lock className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Unlock className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>

            <div className="p-3.5 space-y-2">
              <button
                type="button"
                onClick={() => copyValue(color.hex, 'HEX')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#171B26] hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
              >
                <span className="font-mono text-sm font-bold text-[#111827] dark:text-white">
                  {color.hex}
                </span>
                <Copy className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => copyValue(color.rgb, 'RGB')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#171B26] hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
              >
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  {color.rgb}
                </span>
                <Copy className="w-3 h-3 text-slate-400" aria-hidden="true" />
              </button>

              <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 px-1">
                {color.hsl}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
