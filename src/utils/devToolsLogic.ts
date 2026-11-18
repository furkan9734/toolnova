export interface JsonProcessResult {
  valid: boolean;
  output: string;
  errorMessage?: string;
  errorLine?: number;
  errorColumn?: number;
}

export type JsonIndentOption = 2 | 4 | 'tab' | 'minify';

function getLineAndColFromPosition(text: string, pos: number): { line: number; column: number } {
  const clamped = Math.max(0, Math.min(text.length, pos));
  const slice = text.slice(0, clamped);
  const lines = slice.split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

export function processJsonText(raw: string, indent: JsonIndentOption): JsonProcessResult {
  if (!raw.trim()) {
    return { valid: false, output: '', errorMessage: 'Enter JSON input to validate or format.' };
  }

  try {
    const parsed = JSON.parse(raw);
    let output = '';
    if (indent === 'minify') {
      output = JSON.stringify(parsed);
    } else if (indent === 'tab') {
      output = JSON.stringify(parsed, null, '\t');
    } else {
      output = JSON.stringify(parsed, null, indent);
    }
    return { valid: true, output };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid JSON syntax.';
    let errorLine: number | undefined;
    let errorColumn: number | undefined;

    // Extract line/column if browser provides it directly, or derive from position N
    const lineColMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
    if (lineColMatch) {
      errorLine = Number(lineColMatch[1]);
      errorColumn = Number(lineColMatch[2]);
    } else {
      const posMatch = message.match(/position\s+(\d+)/i);
      if (posMatch) {
        const coords = getLineAndColFromPosition(raw, Number(posMatch[1]));
        errorLine = coords.line;
        errorColumn = coords.column;
      }
    }

    return {
      valid: false,
      output: '',
      errorMessage: message,
      errorLine,
      errorColumn,
    };
  }
}

export function encodeBase64Utf8(input: string, urlSafe = false): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  if (!urlSafe) return base64;
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeBase64Utf8(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, '');
  if (!trimmed) return '';

  // Support both standard and URL-safe Base64
  let normalized = trimmed.replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
    throw new Error('Input contains invalid Base64 characters.');
  }

  const mod = normalized.length % 4;
  if (mod === 1) {
    throw new Error('Malformed Base64 string length.');
  }
  if (mod > 0) {
    normalized = normalized.padEnd(normalized.length + (4 - mod), '=');
  }

  let binary: string;
  try {
    binary = atob(normalized);
  } catch {
    throw new Error('Unable to decode Base64 string. Check padding and characters.');
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('Decoded bytes are not valid UTF-8 text.');
  }
}

export function encodeUrlText(input: string, mode: 'component' | 'full'): string {
  return mode === 'component' ? encodeURIComponent(input) : encodeURI(input);
}

export function decodeUrlText(input: string, mode: 'component' | 'full'): string {
  try {
    return mode === 'component' ? decodeURIComponent(input) : decodeURI(input);
  } catch {
    throw new Error('Malformed URL-encoded sequence (e.g., incomplete "%" escape).');
  }
}

export interface UuidOptions {
  uppercase: boolean;
  hyphens: boolean;
}

export function generateSingleUuidV4(options: UuidOptions): string {
  let raw: string;

  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    raw = window.crypto.randomUUID();
  } else {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant RFC 4122
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    raw = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
      16,
      20
    )}-${hex.slice(20)}`;
  }

  if (!options.hyphens) {
    raw = raw.replace(/-/g, '');
  }
  return options.uppercase ? raw.toUpperCase() : raw.toLowerCase();
}

export function generateUuidBatch(count: number, options: UuidOptions): string[] {
  const safeCount = Math.min(100, Math.max(1, Math.floor(count)));
  return Array.from({ length: safeCount }, () => generateSingleUuidV4(options));
}
