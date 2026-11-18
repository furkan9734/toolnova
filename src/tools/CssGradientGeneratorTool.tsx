import { useState, useMemo } from 'react';
import { Copy, Plus, Trash2, Shuffle } from 'lucide-react';
import {
  buildCssGradient,
  type GradientType,
  type GradientStop,
} from '../utils/codeToolsLogic';
import { copyToClipboard } from '../utils/download';
import { useToast } from '../hooks/useToast';

const PRESET_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export default function CssGradientGeneratorTool() {
  const { showToast } = useToast();

  const [type, setType] = useState<GradientType>('linear');
  const [angle, setAngle] = useState(135);
  const [radialShape, setRadialShape] = useState<'circle' | 'ellipse'>('circle');
  const [position, setPosition] = useState('center');
  const [stops, setStops] = useState<GradientStop[]>([
    { id: 's1', color: '#635BFF', position: 0 },
    { id: 's2', color: '#8B5CF6', position: 50 },
    { id: 's3', color: '#22C55E', position: 100 },
  ]);

  const gradientValue = useMemo(
    () =>
      buildCssGradient({
        type,
        angle,
        radialShape,
        position,
        stops,
      }),
    [type, angle, radialShape, position, stops]
  );

  const cssSnippet = `background: ${stops[0]?.color.toUpperCase() || '#635BFF'};\nbackground-image: ${gradientValue};`;

  const updateStop = (id: string, patch: Partial<GradientStop>) => {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const addStop = () => {
    if (stops.length >= 8) {
      showToast('Maximum 8 color stops reached', 'info');
      return;
    }
    const palette = ['#0EA5E9', '#EC4899', '#F59E0B', '#10B981', '#6366F1'];
    const color = palette[stops.length % palette.length];
    setStops((prev) => [
      ...prev,
      { id: `stop-${Date.now()}`, color, position: 75 },
    ]);
  };

  const removeStop = (id: string) => {
    if (stops.length <= 2) return;
    setStops((prev) => prev.filter((s) => s.id !== id));
  };

  const handleRandomize = () => {
    const randomHex = () =>
      `#${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, '0')
        .toUpperCase()}`;
    setAngle(Math.floor(Math.random() * 360));
    setStops([
      { id: 'r1', color: randomHex(), position: 0 },
      { id: 'r2', color: randomHex(), position: 100 },
    ]);
  };

  const handleCopyCss = async () => {
    const ok = await copyToClipboard(cssSnippet);
    if (ok) showToast('CSS gradient copied', 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Controls */}
      <div className="lg:col-span-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 gap-1">
            {(['linear', 'radial', 'conic'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setType(g)}
                aria-pressed={type === g}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  type === g
                    ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRandomize}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:border-[#635BFF]"
          >
            <Shuffle className="w-3.5 h-3.5" aria-hidden="true" />
            Randomize
          </button>
        </div>

        {(type === 'linear' || type === 'conic') && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex justify-between text-xs">
              <label htmlFor="grad-angle" className="font-medium text-[#111827] dark:text-slate-200">
                {type === 'conic' ? 'Starting Angle' : 'Gradient Angle'}
              </label>
              <span className="font-mono text-slate-500">{angle}°</span>
            </div>
            <input
              id="grad-angle"
              type="range"
              min={0}
              max={360}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              className="w-full accent-[#635BFF]"
            />
            <div className="flex flex-wrap gap-1.5">
              {PRESET_ANGLES.map((deg) => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => setAngle(deg)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono border ${
                    angle === deg
                      ? 'border-[#635BFF] bg-[#635BFF] text-white'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>
        )}

        {(type === 'radial' || type === 'conic') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
            {type === 'radial' && (
              <div className="space-y-1.5">
                <label htmlFor="grad-shape" className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                  Radial Shape
                </label>
                <select
                  id="grad-shape"
                  value={radialShape}
                  onChange={(e) => setRadialShape(e.target.value as 'circle' | 'ellipse')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white"
                >
                  <option value="circle">Circle</option>
                  <option value="ellipse">Ellipse</option>
                </select>
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="grad-pos" className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                Center Position
              </label>
              <select
                id="grad-pos"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white"
              >
                <option value="center">Center</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="top left">Top Left</option>
                <option value="top right">Top Right</option>
                <option value="bottom left">Bottom Left</option>
                <option value="bottom right">Bottom Right</option>
              </select>
            </div>
          </div>
        )}

        {/* Color Stops */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#111827] dark:text-white">
              Color Stops ({stops.length}/8)
            </span>
            <button
              type="button"
              onClick={addStop}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#635BFF] hover:bg-[#534AE8] text-white"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Add Stop
            </button>
          </div>

          <div className="space-y-2.5">
            {stops.map((stop, idx) => (
              <div
                key={stop.id}
                className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 p-2.5 rounded-lg bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-700"
              >
                <input
                  type="color"
                  aria-label={`Stop ${idx + 1} color`}
                  value={stop.color}
                  onChange={(e) => updateStop(stop.id, { color: e.target.value })}
                  className="w-9 h-8 rounded border border-slate-200 dark:border-slate-700 cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  aria-label={`Stop ${idx + 1} hex`}
                  value={stop.color}
                  onChange={(e) => updateStop(stop.id, { color: e.target.value })}
                  className="w-24 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10131C] font-mono text-xs text-[#111827] dark:text-white"
                />
                <input
                  type="range"
                  aria-label={`Stop ${idx + 1} position`}
                  min={0}
                  max={100}
                  value={stop.position}
                  onChange={(e) => updateStop(stop.id, { position: Number(e.target.value) })}
                  className="flex-1 min-w-[80px] accent-[#635BFF]"
                />
                <span className="font-mono text-xs w-10 text-right text-slate-600 dark:text-slate-300 tabular-nums">
                  {stop.position}%
                </span>
                <button
                  type="button"
                  disabled={stops.length <= 2}
                  onClick={() => removeStop(stop.id)}
                  aria-label={`Remove color stop ${idx + 1}`}
                  className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Preview & CSS Code */}
      <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
        <div
          aria-label="Live CSS gradient preview"
          style={{ backgroundImage: gradientValue }}
          className="min-h-[280px] sm:min-h-[320px] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner"
        />

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#111827] dark:text-white">
              Generated CSS
            </span>
            <button
              type="button"
              onClick={handleCopyCss}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#635BFF] hover:bg-[#534AE8]"
            >
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              Copy CSS
            </button>
          </div>
          <pre className="p-3.5 rounded-lg bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 font-mono text-xs text-[#111827] dark:text-slate-200 overflow-x-auto whitespace-pre-wrap break-all">
            {cssSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
}
