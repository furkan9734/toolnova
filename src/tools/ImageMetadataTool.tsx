import { useState, useEffect } from 'react';
import exifr from 'exifr';
import { Copy, Trash2, Info, AlertCircle } from 'lucide-react';
import { FileDropzone } from '../components/FileDropzone';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { validateImageFile } from '../utils/fileValidation';
import { loadImageFromFile, type LoadedImageMeta } from '../utils/imageLogic';
import { formatBytes } from '../utils/formatters';
import { copyToClipboard } from '../utils/download';
import { useToast } from '../hooks/useToast';

interface MetadataField {
  label: string;
  value: string | null;
}

interface ParsedImageMetadata {
  fileProperties: MetadataField[];
  cameraAndExposure: MetadataField[];
  gpsLocation: MetadataField[];
  otherTags: { key: string; value: string }[];
  hasAnyExif: boolean;
}

function formatExifScalar(val: unknown): string | null {
  if (val === undefined || val === null || val === '') return null;
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return val.toLocaleString();
  }
  if (typeof val === 'number') {
    return Number.isInteger(val) ? String(val) : String(Math.round(val * 1000) / 1000);
  }
  if (typeof val === 'string') return val.trim() || null;
  if (Array.isArray(val)) return val.map((v) => String(v)).join(', ');
  return String(val);
}

function formatShutterSpeed(exposureTime: unknown): string | null {
  if (typeof exposureTime !== 'number' || exposureTime <= 0) return null;
  if (exposureTime >= 1) return `${Math.round(exposureTime * 100) / 100} s`;
  const denom = Math.round(1 / exposureTime);
  return `1/${denom} s`;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

export default function ImageMetadataTool() {
  const { showToast } = useToast();

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceMeta, setSourceMeta] = useState<LoadedImageMeta | null>(null);
  const [metadata, setMetadata] = useState<ParsedImageMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (sourceMeta?.previewUrl) URL.revokeObjectURL(sourceMeta.previewUrl);
    };
  }, [sourceMeta]);

  const handleFilesSelected = async (files: File[]) => {
    const file = files[0];
    const check = validateImageFile(file);
    if (!check.valid) {
      setError(check.error || 'Invalid image file.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const imgMeta = await loadImageFromFile(file);
      let rawExif: Record<string, unknown> | undefined;
      try {
        rawExif = (await exifr.parse(file, {
          tiff: true,
          exif: true,
          gps: true,
          iptc: true,
          xmp: true,
          jfif: true,
          ihdr: true,
        })) as Record<string, unknown> | undefined;
      } catch {
        rawExif = undefined;
      }

      const d = gcd(imgMeta.width, imgMeta.height);
      const aspectRatio = `${imgMeta.width / d}:${imgMeta.height / d}`;
      const megapixels = ((imgMeta.width * imgMeta.height) / 1_000_000).toFixed(2);

      const fileProperties: MetadataField[] = [
        { label: 'File Name', value: file.name },
        { label: 'Format / MIME Type', value: file.type || 'Unknown (inferred from extension)' },
        { label: 'File Size', value: `${formatBytes(file.size)} (${file.size.toLocaleString()} bytes)` },
        { label: 'Dimensions', value: `${imgMeta.width} × ${imgMeta.height} px` },
        { label: 'Aspect Ratio', value: aspectRatio },
        { label: 'Megapixels', value: `${megapixels} MP` },
        {
          label: 'File Last Modified',
          value: file.lastModified ? new Date(file.lastModified).toLocaleString() : null,
        },
      ];

      const exif = rawExif || {};
      const cameraAndExposure: MetadataField[] = [
        { label: 'Camera Make', value: formatExifScalar(exif.Make) },
        { label: 'Camera Model', value: formatExifScalar(exif.Model) },
        { label: 'Lens Model', value: formatExifScalar(exif.LensModel) },
        {
          label: 'Date Taken (Original)',
          value: formatExifScalar(exif.DateTimeOriginal ?? exif.CreateDate),
        },
        {
          label: 'Exposure / Shutter',
          value: formatShutterSpeed(exif.ExposureTime),
        },
        {
          label: 'Aperture (f-stop)',
          value: typeof exif.FNumber === 'number' ? `f/${exif.FNumber}` : null,
        },
        { label: 'ISO Sensitivity', value: formatExifScalar(exif.ISO) },
        {
          label: 'Focal Length',
          value: typeof exif.FocalLength === 'number' ? `${exif.FocalLength} mm` : null,
        },
        { label: 'Orientation Tag', value: formatExifScalar(exif.Orientation) },
        { label: 'Software', value: formatExifScalar(exif.Software) },
        { label: 'Color Space', value: formatExifScalar(exif.ColorSpace) },
      ];

      const lat = typeof exif.latitude === 'number' ? exif.latitude : null;
      const lon = typeof exif.longitude === 'number' ? exif.longitude : null;
      const gpsLocation: MetadataField[] = [
        {
          label: 'GPS Latitude',
          value: lat !== null ? `${lat.toFixed(6)}°` : null,
        },
        {
          label: 'GPS Longitude',
          value: lon !== null ? `${lon.toFixed(6)}°` : null,
        },
        {
          label: 'GPS Altitude',
          value:
            typeof exif.GPSAltitude === 'number'
              ? `${Math.round(exif.GPSAltitude * 10) / 10} m`
              : null,
        },
      ];

      const knownKeys = new Set([
        'Make',
        'Model',
        'LensModel',
        'DateTimeOriginal',
        'CreateDate',
        'ExposureTime',
        'FNumber',
        'ISO',
        'FocalLength',
        'Orientation',
        'Software',
        'ColorSpace',
        'latitude',
        'longitude',
        'GPSAltitude',
      ]);

      const otherTags: { key: string; value: string }[] = [];
      for (const [k, v] of Object.entries(exif)) {
        if (knownKeys.has(k)) continue;
        if (v instanceof Uint8Array || v instanceof ArrayBuffer) continue;
        if (typeof v === 'object' && v !== null && !(v instanceof Date) && !Array.isArray(v)) continue;
        const formatted = formatExifScalar(v);
        if (formatted) {
          otherTags.push({ key: k, value: formatted });
        }
      }

      const hasAnyExif =
        cameraAndExposure.some((f) => f.value !== null) ||
        gpsLocation.some((f) => f.value !== null) ||
        otherTags.length > 0;

      setSourceFile(file);
      setSourceMeta(imgMeta);
      setMetadata({
        fileProperties,
        cameraAndExposure,
        gpsLocation,
        otherTags: otherTags.slice(0, 60),
        hasAnyExif,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to inspect image metadata.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyJson = async () => {
    if (!metadata) return;
    const payload = {
      fileProperties: Object.fromEntries(metadata.fileProperties.map((f) => [f.label, f.value])),
      cameraAndExposure: Object.fromEntries(
        metadata.cameraAndExposure.map((f) => [f.label, f.value ?? 'Unavailable'])
      ),
      gpsLocation: Object.fromEntries(
        metadata.gpsLocation.map((f) => [f.label, f.value ?? 'Unavailable'])
      ),
      additionalTags: Object.fromEntries(metadata.otherTags.map((t) => [t.key, t.value])),
    };
    const ok = await copyToClipboard(JSON.stringify(payload, null, 2));
    if (ok) showToast('Metadata JSON copied', 'success');
  };

  const handleReset = () => {
    setSourceFile(null);
    setSourceMeta(null);
    setMetadata(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {!sourceFile || !sourceMeta || !metadata ? (
        <div className="space-y-4">
          <FileDropzone
            accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
            label="Drop an image to inspect dimensions and EXIF metadata"
            hint="Reads authentic dimensions, file format, camera/exposure EXIF, and GPS tags locally. Missing metadata is clearly shown as unavailable."
            error={error}
            disabled={isLoading}
            onFilesSelected={handleFilesSelected}
          />
          {isLoading && (
            <div className="flex justify-center py-2">
              <LoadingSpinner label="Inspecting image headers and EXIF tags..." />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={sourceMeta.previewUrl}
                alt="Inspected image thumbnail"
                className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#111827] dark:text-white truncate">
                  {sourceFile.name}
                </p>
                <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  {sourceMeta.width} × {sourceMeta.height} px · {formatBytes(sourceFile.size)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#635BFF] hover:bg-[#534AE8] text-white transition-colors"
              >
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                Copy JSON
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 hover:text-rose-600"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                Inspect Another
              </button>
            </div>
          </div>

          {!metadata.hasAnyExif && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-xs sm:text-sm text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                No embedded EXIF camera or GPS metadata was found in this image. Screenshots, PNG/WebP exports, and photos downloaded from messaging apps typically have EXIF headers stripped.
              </span>
            </div>
          )}

          {/* Core File Properties */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C] overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#171B26]">
                <h3 className="font-display text-sm font-semibold text-[#111827] dark:text-white">
                  File & Image Properties
                </h3>
              </div>
              <dl className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
                {metadata.fileProperties.map((field) => (
                  <div key={field.label} className="px-4 py-2.5 flex justify-between gap-4">
                    <dt className="text-slate-500 dark:text-slate-400">{field.label}</dt>
                    <dd className="font-mono text-right text-[#111827] dark:text-slate-200 break-all">
                      {field.value ?? <span className="text-slate-400 italic">Unavailable</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Camera & Exposure EXIF */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C] overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#171B26]">
                <h3 className="font-display text-sm font-semibold text-[#111827] dark:text-white">
                  EXIF Camera & Exposure
                </h3>
              </div>
              <dl className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
                {metadata.cameraAndExposure.map((field) => (
                  <div key={field.label} className="px-4 py-2.5 flex justify-between gap-4">
                    <dt className="text-slate-500 dark:text-slate-400">{field.label}</dt>
                    <dd className="font-mono text-right text-[#111827] dark:text-slate-200">
                      {field.value ? (
                        field.value
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic">
                          Not available
                        </span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* GPS & Additional Tags */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C] overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#171B26]">
                <h3 className="font-display text-sm font-semibold text-[#111827] dark:text-white">
                  GPS Coordinates
                </h3>
              </div>
              <dl className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
                {metadata.gpsLocation.map((field) => (
                  <div key={field.label} className="px-4 py-2.5 flex justify-between gap-4">
                    <dt className="text-slate-500 dark:text-slate-400">{field.label}</dt>
                    <dd className="font-mono text-right text-[#111827] dark:text-slate-200">
                      {field.value ? (
                        field.value
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic">
                          Not available
                        </span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C] overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#171B26] flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-[#111827] dark:text-white">
                  Additional Embedded Tags
                </h3>
                <span className="font-mono text-xs text-slate-500">
                  {metadata.otherTags.length} tags
                </span>
              </div>
              {metadata.otherTags.length === 0 ? (
                <div className="p-6 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>No additional EXIF, IPTC, or XMP tags were detected in this image.</span>
                </div>
              ) : (
                <dl className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs max-h-64 overflow-y-auto">
                  {metadata.otherTags.map((tag) => (
                    <div key={tag.key} className="px-4 py-2 flex justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400 shrink-0">{tag.key}</dt>
                      <dd className="font-mono text-right text-[#111827] dark:text-slate-200 break-all">
                        {tag.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
