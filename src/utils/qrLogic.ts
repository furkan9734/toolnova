import QRCode from 'qrcode';

export type QrMode = 'text' | 'wifi' | 'contact';
export type WifiEncryption = 'WPA' | 'WEP' | 'nopass';
export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export interface WifiConfig {
  ssid: string;
  password: string;
  encryption: WifiEncryption;
  hidden: boolean;
}

export interface ContactConfig {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  organization: string;
  website: string;
}

export interface QrRenderOptions {
  foreground: string;
  background: string;
  size: number;
  errorCorrectionLevel: QrErrorCorrection;
  margin: number;
}

function escapeWifiField(value: string): string {
  return value.replace(/([\\;,":])/g, '\\$1');
}

export function buildWifiPayload(config: WifiConfig): string {
  const ssid = escapeWifiField(config.ssid.trim());
  if (!ssid) return '';
  const password = config.encryption === 'nopass' ? '' : escapeWifiField(config.password);
  const hiddenFlag = config.hidden ? 'H:true;' : '';
  return `WIFI:T:${config.encryption};S:${ssid};P:${password};${hiddenFlag};`;
}

export function buildContactPayload(config: ContactConfig): string {
  const first = config.firstName.trim();
  const last = config.lastName.trim();
  const fullName = [first, last].filter(Boolean).join(' ');
  if (!fullName && !config.phone.trim() && !config.email.trim()) {
    return '';
  }

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${last};${first};;;`,
    `FN:${fullName || 'Contact'}`,
  ];

  if (config.organization.trim()) {
    lines.push(`ORG:${config.organization.trim()}`);
  }
  if (config.phone.trim()) {
    lines.push(`TEL;TYPE=CELL:${config.phone.trim()}`);
  }
  if (config.email.trim()) {
    lines.push(`EMAIL:${config.email.trim()}`);
  }
  if (config.website.trim()) {
    lines.push(`URL:${config.website.trim()}`);
  }
  lines.push('END:VCARD');
  return lines.join('\n');
}

export async function generateQrDataUrl(
  payload: string,
  options: QrRenderOptions
): Promise<string> {
  if (!payload.trim()) {
    throw new Error('Enter content to generate a QR code.');
  }

  return QRCode.toDataURL(payload, {
    width: options.size,
    margin: options.margin,
    errorCorrectionLevel: options.errorCorrectionLevel,
    color: {
      dark: options.foreground,
      light: options.background,
    },
  });
}
