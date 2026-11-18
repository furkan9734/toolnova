import { useState, useEffect, useMemo } from 'react';
import { Download, Copy, RefreshCw, AlertCircle } from 'lucide-react';
import {
  buildWifiPayload,
  buildContactPayload,
  generateQrDataUrl,
  type QrMode,
  type WifiEncryption,
  type QrErrorCorrection,
} from '../utils/qrLogic';
import { downloadDataUrl, copyToClipboard } from '../utils/download';
import { useToast } from '../hooks/useToast';
import { EmptyState } from '../components/EmptyState';

export default function QrCodeGeneratorTool() {
  const { showToast } = useToast();

  const [mode, setMode] = useState<QrMode>('text');
  const [textValue, setTextValue] = useState('https://toolnova.pages.dev');

  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState<WifiEncryption>('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [website, setWebsite] = useState('');

  const [foreground, setForeground] = useState('#111827');
  const [background, setBackground] = useState('#FFFFFF');
  const [size, setSize] = useState<number>(512);
  const [ecl, setEcl] = useState<QrErrorCorrection>('M');

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const payload = useMemo(() => {
    if (mode === 'text') return textValue.trim();
    if (mode === 'wifi') {
      return buildWifiPayload({
        ssid: wifiSsid,
        password: wifiPassword,
        encryption: wifiEncryption,
        hidden: wifiHidden,
      });
    }
    return buildContactPayload({
      firstName,
      lastName,
      phone,
      email,
      organization,
      website,
    });
  }, [
    mode,
    textValue,
    wifiSsid,
    wifiPassword,
    wifiEncryption,
    wifiHidden,
    firstName,
    lastName,
    phone,
    email,
    organization,
    website,
  ]);

  useEffect(() => {
    let active = true;
    if (!payload) {
      setQrDataUrl('');
      setError(null);
      return;
    }

    setIsGenerating(true);
    setError(null);

    generateQrDataUrl(payload, {
      foreground,
      background,
      size,
      errorCorrectionLevel: ecl,
      margin: 2,
    })
      .then((url) => {
        if (active) {
          setQrDataUrl(url);
          setIsGenerating(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setQrDataUrl('');
          setError(err instanceof Error ? err.message : 'Unable to generate QR code.');
          setIsGenerating(false);
        }
      });

    return () => {
      active = false;
    };
  }, [payload, foreground, background, size, ecl]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    downloadDataUrl(qrDataUrl, `toolnova-qr-${mode}-${Date.now()}.png`);
    showToast('QR code downloaded', 'success', `Saved ${size}×${size} PNG file.`);
  };

  const handleCopyPayload = async () => {
    if (!payload) return;
    const ok = await copyToClipboard(payload);
    if (ok) {
      showToast('Payload copied to clipboard', 'success');
    } else {
      showToast('Could not copy to clipboard', 'error');
    }
  };

  const handleResetColors = () => {
    setForeground('#111827');
    setBackground('#FFFFFF');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Configuration */}
      <div className="lg:col-span-7 space-y-6">
        <div
          role="tablist"
          aria-label="QR Code Type"
          className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800"
        >
          {(
            [
              { id: 'text', label: 'Text / URL' },
              { id: 'wifi', label: 'Wi-Fi Network' },
              { id: 'contact', label: 'Contact (vCard)' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={mode === tab.id}
              onClick={() => setMode(tab.id)}
              className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                mode === tab.id
                  ? 'bg-white dark:bg-[#171B26] text-[#111827] dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mode === 'text' && (
          <div className="space-y-2">
            <label
              htmlFor="qr-text-input"
              className="block text-sm font-medium text-[#111827] dark:text-slate-200"
            >
              Website URL or Plain Text
            </label>
            <textarea
              id="qr-text-input"
              rows={4}
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="https://example.com or any text message..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-sm text-[#111827] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            />
          </div>
        )}

        {mode === 'wifi' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="wifi-ssid" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Network Name (SSID)
              </label>
              <input
                id="wifi-ssid"
                type="text"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                placeholder="StudioGuest"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="wifi-enc" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Encryption
              </label>
              <select
                id="wifi-enc"
                value={wifiEncryption}
                onChange={(e) => setWifiEncryption(e.target.value as WifiEncryption)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
              >
                <option value="WPA">WPA / WPA2 / WPA3</option>
                <option value="WEP">WEP</option>
                <option value="nopass">Open (No Password)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="wifi-pass" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Password
              </label>
              <input
                id="wifi-pass"
                type="text"
                disabled={wifiEncryption === 'nopass'}
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                placeholder={wifiEncryption === 'nopass' ? 'No password needed' : 'Enter network password'}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-sm text-[#111827] dark:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
              />
            </div>

            <label className="sm:col-span-2 inline-flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={wifiHidden}
                onChange={(e) => setWifiHidden(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#635BFF] focus:ring-[#635BFF]"
              />
              Hidden SSID network
            </label>
          </div>
        )}

        {mode === 'contact' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="vc-first" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                First Name
              </label>
              <input
                id="vc-first"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Alex"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="vc-last" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Last Name
              </label>
              <input
                id="vc-last"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Rivera"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="vc-phone" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Phone
              </label>
              <input
                id="vc-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 234 5678"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="vc-email" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Email
              </label>
              <input
                id="vc-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="vc-org" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Organization
              </label>
              <input
                id="vc-org"
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="ToolNova Studio"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="vc-web" className="block text-sm font-medium text-[#111827] dark:text-slate-200">
                Website
              </label>
              <input
                id="vc-web"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
              />
            </div>
          </div>
        )}

        {/* Style & Resolution Options */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-[#111827] dark:text-white">
              Appearance & Export Options
            </h2>
            <button
              type="button"
              onClick={handleResetColors}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#635BFF] dark:text-slate-400 dark:hover:text-[#8B5CF6]"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              Reset Colors
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="qr-fg" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Foreground
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="qr-fg"
                  type="color"
                  value={foreground}
                  onChange={(e) => setForeground(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
                />
                <span className="font-mono text-xs text-slate-700 dark:text-slate-300 uppercase">
                  {foreground}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="qr-bg" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Background
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="qr-bg"
                  type="color"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
                />
                <span className="font-mono text-xs text-slate-700 dark:text-slate-300 uppercase">
                  {background}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="qr-size" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                PNG Size
              </label>
              <select
                id="qr-size"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
              >
                <option value={256}>256 × 256 px</option>
                <option value={512}>512 × 512 px</option>
                <option value={1024}>1024 × 1024 px</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="qr-ecl" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Error Correction
              </label>
              <select
                id="qr-ecl"
                value={ecl}
                onChange={(e) => setEcl(e.target.value as QrErrorCorrection)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
              >
                <option value="L">Low (7%)</option>
                <option value="M">Medium (15%)</option>
                <option value="Q">Quartile (25%)</option>
                <option value="H">High (30%)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Right Preview */}
      <div className="lg:col-span-5 flex flex-col justify-between p-6 rounded-xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800">
        <div className="flex-1 flex flex-col items-center justify-center min-h-[260px]">
          {error ? (
            <div className="flex items-start gap-2.5 p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          ) : qrDataUrl ? (
            <div className="text-center space-y-3">
              <div className="inline-block p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                <img
                  src={qrDataUrl}
                  alt="Generated QR code preview"
                  className={`w-56 h-56 sm:w-64 sm:h-64 object-contain transition-opacity ${
                    isGenerating ? 'opacity-60' : 'opacity-100'
                  }`}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {size} × {size} px · PNG
              </p>
            </div>
          ) : (
            <EmptyState
              icon={<RefreshCw className="w-5 h-5" aria-hidden="true" />}
              title="Ready to generate"
              description="Enter a URL, Wi-Fi network, or contact details on the left to build your QR code."
            />
          )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            disabled={!qrDataUrl}
            onClick={handleDownload}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#635BFF] hover:bg-[#534AE8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Download PNG
          </button>
          <button
            type="button"
            disabled={!payload}
            onClick={handleCopyPayload}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-[#111827] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Copy className="w-4 h-4" aria-hidden="true" />
            Copy Data
          </button>
        </div>
      </div>
    </div>
  );
}
