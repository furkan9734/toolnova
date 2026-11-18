import { useState, useEffect } from 'react';
import { Download, Trash2, Type, Image as ImageIcon } from 'lucide-react';
import { FileDropzone } from '../components/FileDropzone';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { validateImageFile } from '../utils/fileValidation';
import {
  loadImageFromFile,
  getMimeFromFile,
  getExtensionForMime,
  type ExportImageFormat,
  type LoadedImageMeta,
} from '../utils/imageLogic';
import {
  applyImageWatermark,
  type WatermarkAnchor,
  type AdvancedImageResult,
} from '../utils/imageAdvancedLogic';
import { formatBytes, stripExtension, sanitizeFilename } from '../utils/formatters';
import { downloadBlob } from '../utils/download';
import { useToast } from '../hooks/useToast';

const POSITION_OPTIONS: { id: WatermarkAnchor; label: string }[] = [
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-center', label: 'Top Center' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'center-left', label: 'Mid Left' },
  { id: 'center', label: 'Center' },
  { id: 'center-right', label: 'Mid Right' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-center', label: 'Bottom Center' },
  { id: 'bottom-right', label: 'Bottom Right' },
  { id: 'tile', label: 'Tiled Grid' },
];

export default function ImageWatermarkTool() {
  const { showToast } = useToast();

  const [baseFile, setBaseFile] = useState<File | null>(null);
  const [baseMeta, setBaseMeta] = useState<LoadedImageMeta | null>(null);

  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('© ToolNova');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [fontSizePct, setFontSizePct] = useState(6);
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>('bold');

  const [wmFile, setWmFile] = useState<File | null>(null);
  const [wmMeta, setWmMeta] = useState<LoadedImageMeta | null>(null);
  const [imageScalePct, setImageScalePct] = useState(25);

  const [opacity, setOpacity] = useState(65);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [position, setPosition] = useState<WatermarkAnchor>('bottom-right');
  const [marginPct, setMarginPct] = useState(4);
  const [outputFormat, setOutputFormat] = useState<ExportImageFormat>('image/png');

  const [result, setResult] = useState<AdvancedImageResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (baseMeta?.previewUrl) URL.revokeObjectURL(baseMeta.previewUrl);
    };
  }, [baseMeta]);

  useEffect(() => {
    return () => {
      if (wmMeta?.previewUrl) URL.revokeObjectURL(wmMeta.previewUrl);
    };
  }, [wmMeta]);

  useEffect(() => {
    return () => {
      if (result?.previewUrl) URL.revokeObjectURL(result.previewUrl);
    };
  }, [result]);

  const handleBaseSelected = async (files: File[]) => {
    const file = files[0];
    const check = validateImageFile(file);
    if (!check.valid) {
      setError(check.error || 'Invalid image file.');
      return;
    }
    setError(null);
    try {
      const meta = await loadImageFromFile(file);
      setBaseFile(file);
      setBaseMeta(meta);
      setOutputFormat(getMimeFromFile(file));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to decode base image.');
    }
  };

  const handleWatermarkImageSelected = async (files: File[]) => {
    const file = files[0];
    const check = validateImageFile(file);
    if (!check.valid) {
      setError(check.error || 'Invalid watermark image.');
      return;
    }
    setError(null);
    try {
      const meta = await loadImageFromFile(file);
      setWmFile(file);
      setWmMeta(meta);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to decode watermark image.');
    }
  };

  useEffect(() => {
    if (!baseMeta) return;
    if (mode === 'text' && !text.trim()) {
      setResult(null);
      return;
    }
    if (mode === 'image' && !wmMeta) {
      setResult(null);
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      setIsProcessing(true);
      applyImageWatermark(baseMeta.element, {
        mode,
        text,
        textColor,
        fontSizePct,
        fontWeight,
        watermarkImage: wmMeta?.element ?? null,
        imageScalePct,
        opacity: opacity / 100,
        rotationDeg,
        position,
        marginPct,
        mimeType: outputFormat,
        quality: 0.92,
      })
        .then((res) => {
          if (active) {
            setResult(res);
            setIsProcessing(false);
          } else {
            URL.revokeObjectURL(res.previewUrl);
          }
        })
        .catch((err: unknown) => {
          if (active) {
            setError(err instanceof Error ? err.message : 'Watermark rendering failed.');
            setIsProcessing(false);
          }
        });
    }, 100);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [
    baseMeta,
    mode,
    text,
    textColor,
    fontSizePct,
    fontWeight,
    wmMeta,
    imageScalePct,
    opacity,
    rotationDeg,
    position,
    marginPct,
    outputFormat,
  ]);

  const handleDownload = () => {
    if (!result || !baseFile) return;
    const ext = getExtensionForMime(result.mimeType as ExportImageFormat);
    const base = sanitizeFilename(stripExtension(baseFile.name));
    downloadBlob(result.blob, `${base}-watermarked.${ext}`);
    showToast('Watermarked image downloaded', 'success', `${result.width} × ${result.height} px`);
  };

  const handleReset = () => {
    setBaseFile(null);
    setBaseMeta(null);
    setWmFile(null);
    setWmMeta(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {!baseFile || !baseMeta ? (
        <FileDropzone
          accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
          label="Drop a photo or graphic to add a watermark"
          hint="Supports JPG, PNG, WebP, GIF, and BMP up to 25 MB. Add custom text or overlay your logo locally."
          error={error}
          onFilesSelected={handleBaseSelected}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-5">
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 gap-1">
              <button
                type="button"
                onClick={() => setMode('text')}
                aria-pressed={mode === 'text'}
                className={`inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  mode === 'text'
                    ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Type className="w-3.5 h-3.5" aria-hidden="true" />
                Text Watermark
              </button>
              <button
                type="button"
                onClick={() => setMode('image')}
                aria-pressed={mode === 'image'}
                className={`inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  mode === 'image'
                    ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
                Logo / Image
              </button>
            </div>

            {mode === 'text' ? (
              <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
                <div className="space-y-1.5">
                  <label htmlFor="wm-text" className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                    Watermark Text
                  </label>
                  <input
                    id="wm-text"
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="© Your Brand"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="wm-color" className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                      Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="wm-color"
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-10 h-9 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                      />
                      <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                        {textColor.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                      Weight
                    </span>
                    <div className="grid grid-cols-2 gap-1">
                      {(['normal', 'bold'] as const).map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setFontWeight(w)}
                          className={`py-2 rounded-lg text-xs font-medium border capitalize ${
                            fontWeight === w
                              ? 'border-[#635BFF] bg-[#635BFF] text-white'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <label htmlFor="wm-font-size" className="font-medium text-[#111827] dark:text-slate-200">
                      Text Size
                    </label>
                    <span className="font-mono text-slate-500">{fontSizePct}%</span>
                  </div>
                  <input
                    id="wm-font-size"
                    type="range"
                    min={2}
                    max={22}
                    value={fontSizePct}
                    onChange={(e) => setFontSizePct(Number(e.target.value))}
                    className="w-full accent-[#635BFF]"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
                <FileDropzone
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  label={wmFile ? `Logo: ${wmFile.name}` : 'Upload watermark logo (PNG recommended)'}
                  hint="Transparent PNG logos give the cleanest overlay."
                  onFilesSelected={handleWatermarkImageSelected}
                />

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <label htmlFor="wm-img-scale" className="font-medium text-[#111827] dark:text-slate-200">
                      Logo Width (% of base image)
                    </label>
                    <span className="font-mono text-slate-500">{imageScalePct}%</span>
                  </div>
                  <input
                    id="wm-img-scale"
                    type="range"
                    min={5}
                    max={75}
                    value={imageScalePct}
                    onChange={(e) => setImageScalePct(Number(e.target.value))}
                    className="w-full accent-[#635BFF]"
                  />
                </div>
              </div>
            )}

            {/* Shared Opacity, Rotation, Position */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <label htmlFor="wm-opacity" className="font-medium text-[#111827] dark:text-slate-200">
                    Opacity
                  </label>
                  <span className="font-mono text-slate-500">{opacity}%</span>
                </div>
                <input
                  id="wm-opacity"
                  type="range"
                  min={5}
                  max={100}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full accent-[#635BFF]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <label htmlFor="wm-rot" className="font-medium text-[#111827] dark:text-slate-200">
                    Rotation
                  </label>
                  <span className="font-mono text-slate-500">{rotationDeg}°</span>
                </div>
                <input
                  id="wm-rot"
                  type="range"
                  min={-180}
                  max={180}
                  value={rotationDeg}
                  onChange={(e) => setRotationDeg(Number(e.target.value))}
                  className="w-full accent-[#635BFF]"
                />
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                  Position
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {POSITION_OPTIONS.map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setPosition(pos.id)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border transition-colors ${
                        pos.id === 'tile' ? 'col-span-3' : ''
                      } ${
                        position === pos.id
                          ? 'border-[#635BFF] bg-[#635BFF] text-white'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {position !== 'tile' && position !== 'center' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <label htmlFor="wm-margin" className="font-medium text-[#111827] dark:text-slate-200">
                      Edge Margin
                    </label>
                    <span className="font-mono text-slate-500">{marginPct}%</span>
                  </div>
                  <input
                    id="wm-margin"
                    type="range"
                    min={0}
                    max={15}
                    value={marginPct}
                    onChange={(e) => setMarginPct(Number(e.target.value))}
                    className="w-full accent-[#635BFF]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Live Preview & Download */}
          <div className="lg:col-span-7 flex flex-col justify-between p-5 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Live Watermark Preview</span>
                <span className="font-mono">
                  {result
                    ? `${result.width} × ${result.height} · ${formatBytes(result.size)}`
                    : `${baseMeta.width} × ${baseMeta.height} px`}
                </span>
              </div>

              {error && (
                <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
                  {error}
                </p>
              )}

              <div className="min-h-[300px] max-h-[460px] rounded-xl bg-white dark:bg-[#171B26] border border-slate-200 dark:border-slate-800 p-3 flex items-center justify-center overflow-hidden">
                {isProcessing && !result ? (
                  <LoadingSpinner label="Rendering watermark..." />
                ) : result ? (
                  <img
                    src={result.previewUrl}
                    alt="Watermarked image preview"
                    className="max-h-[420px] w-auto object-contain"
                  />
                ) : (
                  <img
                    src={baseMeta.previewUrl}
                    alt="Base image awaiting watermark settings"
                    className="max-h-[420px] w-auto object-contain opacity-80"
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
              <div className="sm:w-44 space-y-1.5">
                <label htmlFor="wm-fmt" className="block text-xs font-medium text-[#111827] dark:text-slate-200">
                  Export Format
                </label>
                <select
                  id="wm-fmt"
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as ExportImageFormat)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-sm text-[#111827] dark:text-white"
                >
                  <option value="image/png">PNG</option>
                  <option value="image/jpeg">JPG</option>
                  <option value="image/webp">WebP</option>
                </select>
              </div>

              <div className="flex-1 flex gap-2.5">
                <button
                  type="button"
                  disabled={!result || isProcessing}
                  onClick={handleDownload}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-50 transition-colors"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Download Image
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
