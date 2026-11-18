export type CodeLanguage = 'html' | 'css' | 'javascript';
export type IndentOption = '2' | '4' | 'tab';

export interface MinifyResult {
  minified: string;
  originalBytes: number;
  minifiedBytes: number;
  savedBytes: number;
  savedPercent: number;
  warning: string | null;
}

function getUtf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

/**
 * Deterministic static syntax validator for JS/CSS delimiters and strings (never executes code).
 */
function checkBalancedSyntax(code: string, language: CodeLanguage): string | null {
  if (language === 'html') {
    const openComments = (code.match(/<!--/g) || []).length;
    const closeComments = (code.match(/-->/g) || []).length;
    if (openComments > closeComments) {
      return 'Unclosed HTML comment (<!--) detected. Minification continued safely.';
    }
    return null;
  }

  const stack: string[] = [];
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const next = code[i + 1];

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (inSingle) {
      if (ch === '\\') i++;
      else if (ch === "'") inSingle = false;
      continue;
    }
    if (inDouble) {
      if (ch === '\\') i++;
      else if (ch === '"') inDouble = false;
      continue;
    }
    if (inBacktick) {
      if (ch === '\\') i++;
      else if (ch === '`') inBacktick = false;
      continue;
    }

    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }
    if (language === 'javascript' && ch === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }

    if (ch === "'") inSingle = true;
    else if (ch === '"') inDouble = true;
    else if (language === 'javascript' && ch === '`') inBacktick = true;
    else if (ch === '{' || ch === '(' || ch === '[') stack.push(ch);
    else if (ch === '}' || ch === ')' || ch === ']') {
      const expected = ch === '}' ? '{' : ch === ')' ? '(' : '[';
      const last = stack.pop();
      if (last !== expected) {
        return `Unexpected "${ch}" around character ${i + 1}. Check bracket balance.`;
      }
    }
  }

  if (inSingle || inDouble || inBacktick) {
    return 'Unterminated string literal detected. Check matching quotes.';
  }
  if (inBlockComment) {
    return 'Unterminated /* block comment */ detected.';
  }
  if (stack.length > 0) {
    return `Unclosed "${stack[stack.length - 1]}" bracket detected.`;
  }
  return null;
}

function minifyCss(css: string): string {
  let out = '';
  let inSingle = false;
  let inDouble = false;
  let inComment = false;

  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    const next = css[i + 1];

    if (inComment) {
      if (ch === '*' && next === '/') {
        inComment = false;
        i++;
      }
      continue;
    }
    if (!inSingle && !inDouble && ch === '/' && next === '*') {
      inComment = true;
      i++;
      continue;
    }
    if (ch === "'" && !inDouble && css[i - 1] !== '\\') inSingle = !inSingle;
    else if (ch === '"' && !inSingle && css[i - 1] !== '\\') inDouble = !inDouble;

    out += ch;
  }

  // Collapse whitespace safely outside quoted strings
  const tokens = out.match(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^"']+)/g) || [];
  const collapsed = tokens
    .map((tok) => {
      if (tok.startsWith('"') || tok.startsWith("'")) return tok;
      return tok
        .replace(/\s+/g, ' ')
        .replace(/\s*([{}:;,>~+])\s*/g, '$1')
        .replace(/;}/g, '}');
    })
    .join('')
    .trim();

  return collapsed;
}

function minifyHtml(html: string): string {
  // Preserve <pre>, <textarea>, <script>, <style> whitespace where critical
  const preserved: string[] = [];
  const masked = html.replace(
    /<(pre|textarea|script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,
    (match) => {
      const idx = preserved.length;
      preserved.push(match);
      return `__TOOLNOVA_BLOCK_${idx}__`;
    }
  );

  let minified = masked
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();

  preserved.forEach((block, idx) => {
    minified = minified.replace(`__TOOLNOVA_BLOCK_${idx}__`, block);
  });

  return minified;
}

function minifyJs(js: string): string {
  // Token-aware JS minifier (preserves strings, template literals, and regex literals; never executes code)
  let out = '';
  let i = 0;
  const len = js.length;
  let prevNonSpace = '';

  const isIdentChar = (c: string) => /[a-zA-Z0-9_$]/.test(c);

  while (i < len) {
    const ch = js[i];
    const next = js[i + 1];

    // Line comment
    if (ch === '/' && next === '/') {
      i += 2;
      while (i < len && js[i] !== '\n') i++;
      continue;
    }

    // Block comment
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < len && !(js[i] === '*' && js[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    // String or template literal
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      let lit = quote;
      i++;
      while (i < len) {
        const c = js[i];
        lit += c;
        if (c === '\\' && i + 1 < len) {
          i++;
          lit += js[i];
        } else if (c === quote) {
          i++;
          break;
        }
        i++;
      }
      out += lit;
      prevNonSpace = quote;
      continue;
    }

    // Whitespace
    if (/\s/.test(ch)) {
      let hasNewline = ch === '\n';
      while (i + 1 < len && /\s/.test(js[i + 1])) {
        i++;
        if (js[i] === '\n') hasNewline = true;
      }
      const nextChar = js[i + 1] || '';
      if (isIdentChar(prevNonSpace) && isIdentChar(nextChar)) {
        out += ' ';
      } else if (
        hasNewline &&
        prevNonSpace &&
        /[a-zA-Z0-9_$)\]}"'`]/.test(prevNonSpace) &&
        nextChar &&
        /[a-zA-Z0-9_$([{`'"!]/.test(nextChar) &&
        prevNonSpace !== ';' &&
        prevNonSpace !== '{' &&
        prevNonSpace !== ','
      ) {
        // Keep safe ASI newline boundary if user omitted semicolons
        out += '\n';
      }
      i++;
      continue;
    }

    out += ch;
    prevNonSpace = ch;
    i++;
  }

  return out.trim();
}

export function minifyCode(code: string, language: CodeLanguage): MinifyResult {
  if (!code.trim()) {
    throw new Error('Paste HTML, CSS, or JavaScript code to minify.');
  }

  const warning = checkBalancedSyntax(code, language);
  const originalBytes = getUtf8ByteLength(code);

  let minified = '';
  if (language === 'css') minified = minifyCss(code);
  else if (language === 'html') minified = minifyHtml(code);
  else minified = minifyJs(code);

  const minifiedBytes = getUtf8ByteLength(minified);
  const savedBytes = Math.max(0, originalBytes - minifiedBytes);
  const savedPercent = originalBytes > 0 ? Math.round((savedBytes / originalBytes) * 1000) / 10 : 0;

  return {
    minified,
    originalBytes,
    minifiedBytes,
    savedBytes,
    savedPercent,
    warning,
  };
}

function getIndentUnit(indent: IndentOption): string {
  if (indent === '4') return '    ';
  if (indent === 'tab') return '\t';
  return '  ';
}

function beautifyCss(css: string, indentUnit: string): string {
  const tokens = css.match(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\*[\s\S]*?\*\/|[{}();:,]|[^"'{}();:,\s/]+|\s+|\/)/g) || [];
  let level = 0;
  let result = '';
  let lineStart = true;

  for (let idx = 0; idx < tokens.length; idx++) {
    const tok = tokens[idx];
    if (/^\s+$/.test(tok)) {
      if (!lineStart && !result.endsWith(' ') && !result.endsWith('\n')) {
        const nextTok = tokens[idx + 1] || '';
        if (nextTok && !/^[;,:){}]$/.test(nextTok)) {
          result += ' ';
        }
      }
      continue;
    }

    if (tok === '{') {
      result = result.trimEnd() + ' {\n';
      level++;
      lineStart = true;
    } else if (tok === '}') {
      level = Math.max(0, level - 1);
      if (!lineStart) result = result.trimEnd() + '\n';
      result += `${indentUnit.repeat(level)}}\n`;
      if (level === 0) result += '\n';
      lineStart = true;
    } else if (tok === ';') {
      result = result.trimEnd() + ';\n';
      lineStart = true;
    } else if (tok === ':') {
      result = result.trimEnd() + ': ';
      lineStart = false;
    } else if (tok === ',') {
      result = result.trimEnd() + ', ';
      lineStart = false;
    } else {
      if (lineStart) {
        result += indentUnit.repeat(level);
        lineStart = false;
      }
      result += tok;
    }
  }

  return result.trim();
}

function beautifyHtml(html: string, indentUnit: string): string {
  const voidTags = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr',
  ]);
  const tokens = html
    .replace(/>\s+</g, '>\n<')
    .match(/<!--[\s\S]*?-->|<![^>]+>|<\/?[a-zA-Z0-9-]+(?:\s+[^>]*)?>|[^<]+/g) || [];

  let level = 0;
  const lines: string[] = [];

  for (const rawTok of tokens) {
    const tok = rawTok.trim();
    if (!tok) continue;

    if (tok.startsWith('</')) {
      level = Math.max(0, level - 1);
      lines.push(`${indentUnit.repeat(level)}${tok}`);
    } else if (tok.startsWith('<!--') || tok.startsWith('<!')) {
      lines.push(`${indentUnit.repeat(level)}${tok}`);
    } else if (tok.startsWith('<')) {
      const tagMatch = tok.match(/^<([a-zA-Z0-9-]+)/);
      const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';
      const isSelfClosing = tok.endsWith('/>') || voidTags.has(tagName);
      lines.push(`${indentUnit.repeat(level)}${tok}`);
      if (!isSelfClosing) {
        level++;
      }
    } else {
      lines.push(`${indentUnit.repeat(level)}${tok.replace(/\s+/g, ' ')}`);
    }
  }

  return lines.join('\n').trim();
}

function beautifyJs(js: string, indentUnit: string): string {
  let out = '';
  let level = 0;
  let i = 0;
  const len = js.length;
  let atLineStart = true;

  const appendIndent = () => {
    if (atLineStart) {
      out += indentUnit.repeat(level);
      atLineStart = false;
    }
  };

  while (i < len) {
    const ch = js[i];
    const next = js[i + 1];

    // Comments
    if (ch === '/' && next === '/') {
      appendIndent();
      while (i < len && js[i] !== '\n') {
        out += js[i++];
      }
      out += '\n';
      atLineStart = true;
      i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      appendIndent();
      while (i < len && !(js[i] === '*' && js[i + 1] === '/')) {
        out += js[i++];
      }
      out += '*/\n';
      atLineStart = true;
      i += 2;
      continue;
    }

    // Strings & template literals
    if (ch === '"' || ch === "'" || ch === '`') {
      appendIndent();
      const quote = ch;
      out += quote;
      i++;
      while (i < len) {
        const c = js[i];
        out += c;
        if (c === '\\' && i + 1 < len) {
          i++;
          out += js[i];
        } else if (c === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    if (/\s/.test(ch)) {
      while (i + 1 < len && /\s/.test(js[i + 1])) i++;
      if (!atLineStart && !out.endsWith(' ') && !out.endsWith('(') && !out.endsWith('[')) {
        const nextChar = js[i + 1] || '';
        if (nextChar && !/^[;,\])}]$/.test(nextChar)) {
          out += ' ';
        }
      }
      i++;
      continue;
    }

    if (ch === '{') {
      if (!atLineStart && !out.endsWith(' ')) out += ' ';
      out += '{\n';
      level++;
      atLineStart = true;
      i++;
      continue;
    }

    if (ch === '}') {
      level = Math.max(0, level - 1);
      if (!atLineStart) out = out.trimEnd() + '\n';
      out += `${indentUnit.repeat(level)}}`;
      const peek = js.slice(i + 1).trimStart()[0] || '';
      if (peek === ';' || peek === ',' || peek === ')' || peek === 'e') {
        atLineStart = false;
      } else {
        out += '\n';
        atLineStart = true;
      }
      i++;
      continue;
    }

    if (ch === ';') {
      out = out.trimEnd() + ';\n';
      atLineStart = true;
      i++;
      continue;
    }

    if (ch === ',') {
      out = out.trimEnd() + ', ';
      atLineStart = false;
      i++;
      continue;
    }

    appendIndent();
    out += ch;
    i++;
  }

  return out.replace(/\n{3,}/g, '\n\n').trim();
}

export function beautifyCode(
  code: string,
  language: CodeLanguage,
  indent: IndentOption
): { formatted: string; warning: string | null } {
  if (!code.trim()) {
    throw new Error('Paste HTML, CSS, or JavaScript code to beautify.');
  }
  const warning = checkBalancedSyntax(code, language);
  const indentUnit = getIndentUnit(indent);

  let formatted = '';
  if (language === 'css') formatted = beautifyCss(code, indentUnit);
  else if (language === 'html') formatted = beautifyHtml(code, indentUnit);
  else formatted = beautifyJs(code, indentUnit);

  return { formatted, warning };
}

export type GradientType = 'linear' | 'radial' | 'conic';

export interface GradientStop {
  id: string;
  color: string;
  position: number; // 0..100
}

export interface GradientConfig {
  type: GradientType;
  angle: number; // 0..360
  radialShape: 'circle' | 'ellipse';
  position: string; // e.g. 'center', 'top left'
  stops: GradientStop[];
}

export function buildCssGradient(config: GradientConfig): string {
  const sortedStops = [...config.stops].sort((a, b) => a.position - b.position);
  const stopStr = sortedStops.map((s) => `${s.color.toUpperCase()} ${s.position}%`).join(', ');

  if (config.type === 'radial') {
    return `radial-gradient(${config.radialShape} at ${config.position}, ${stopStr})`;
  }
  if (config.type === 'conic') {
    return `conic-gradient(from ${config.angle}deg at ${config.position}, ${stopStr})`;
  }
  return `linear-gradient(${config.angle}deg, ${stopStr})`;
}

export type PaletteHarmony =
  | 'analogous'
  | 'monochromatic'
  | 'complementary'
  | 'triadic'
  | 'split-complementary'
  | 'random';

export interface PaletteColor {
  hex: string;
  rgb: string;
  hsl: string;
  contrastText: '#111827' | '#FFFFFF';
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToPaletteColor(hDeg: number, sPct: number, lPct: number): PaletteColor {
  const h = ((hDeg % 360) + 360) % 360;
  const s = Math.max(0, Math.min(100, sPct)) / 100;
  const l = Math.max(0, Math.min(100, lPct)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r1 = 0, g1 = 0, b1 = 0;
  if (h < 60) [r1, g1, b1] = [c, x, 0];
  else if (h < 120) [r1, g1, b1] = [x, c, 0];
  else if (h < 180) [r1, g1, b1] = [0, c, x];
  else if (h < 240) [r1, g1, b1] = [0, x, c];
  else if (h < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];

  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);

  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0').toUpperCase();
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return {
    hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl: `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
    contrastText: luminance > 0.58 ? '#111827' : '#FFFFFF',
  };
}

export function generateColorPalette(
  baseHex: string,
  harmony: PaletteHarmony,
  count = 5,
  existingColors?: PaletteColor[],
  lockedIndices?: boolean[]
): PaletteColor[] {
  const validHex = /^#[0-9a-fA-F]{6}$/.test(baseHex) ? baseHex : '#635BFF';
  const base = hexToHsl(validHex);

  const colors: PaletteColor[] = [];
  for (let i = 0; i < count; i++) {
    if (lockedIndices?.[i] && existingColors?.[i]) {
      colors.push(existingColors[i]);
      continue;
    }

    if (harmony === 'monochromatic') {
      const l = Math.max(15, Math.min(90, 22 + i * 16));
      colors.push(hslToPaletteColor(base.h, base.s, l));
    } else if (harmony === 'analogous') {
      const offset = (i - Math.floor(count / 2)) * 24;
      colors.push(hslToPaletteColor(base.h + offset, base.s, Math.max(25, Math.min(78, base.l + (i % 2 === 0 ? 0 : 8)))));
    } else if (harmony === 'complementary') {
      const hue = i < Math.ceil(count / 2) ? base.h : base.h + 180;
      const lightShift = (i % 3) * 14 - 10;
      colors.push(hslToPaletteColor(hue, base.s, Math.max(20, Math.min(82, base.l + lightShift))));
    } else if (harmony === 'triadic') {
      const hue = base.h + (i % 3) * 120;
      const lightShift = i >= 3 ? 16 : 0;
      colors.push(hslToPaletteColor(hue, base.s, Math.max(22, Math.min(82, base.l + lightShift))));
    } else if (harmony === 'split-complementary') {
      const hues = [base.h, base.h + 150, base.h + 210, base.h, base.h + 180];
      const l = i === 3 ? Math.min(88, base.l + 22) : i === 4 ? Math.max(18, base.l - 18) : base.l;
      colors.push(hslToPaletteColor(hues[i % hues.length], base.s, l));
    } else {
      const randH = Math.floor(Math.random() * 360);
      const randS = 50 + Math.floor(Math.random() * 40);
      const randL = 28 + Math.floor(Math.random() * 48);
      colors.push(hslToPaletteColor(randH, randS, randL));
    }
  }

  return colors;
}

const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00A0',
  copy: '©',
  reg: '®',
  trade: '™',
  euro: '€',
  pound: '£',
  yen: '¥',
  cent: '¢',
  deg: '°',
  plusmn: '±',
  times: '×',
  divide: '÷',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  bull: '•',
  larr: '←',
  uarr: '↑',
  rarr: '→',
  darr: '↓',
  hearts: '♥',
  spades: '♠',
  clubs: '♣',
  diams: '♦',
};

const REVERSE_NAMED_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function encodeHtmlEntities(
  input: string,
  options: { encodeNonAscii: boolean; useNamedCommon: boolean }
): string {
  let out = '';
  for (const ch of input) {
    if (REVERSE_NAMED_ENTITIES[ch]) {
      out += ch === "'" && !options.useNamedCommon ? '&#39;' : ch === "'" ? '&apos;' : REVERSE_NAMED_ENTITIES[ch];
    } else {
      const code = ch.codePointAt(0);
      if (options.encodeNonAscii && code !== undefined && code > 127) {
        out += `&#${code};`;
      } else {
        out += ch;
      }
    }
  }
  return out;
}

export function decodeHtmlEntities(input: string): string {
  return input.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (full, entity: string) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const cp = parseInt(entity.slice(2), 16);
      if (Number.isFinite(cp) && cp >= 0 && cp <= 0x10ffff) {
        return String.fromCodePoint(cp);
      }
      return full;
    }
    if (entity.startsWith('#')) {
      const cp = parseInt(entity.slice(1), 10);
      if (Number.isFinite(cp) && cp >= 0 && cp <= 0x10ffff) {
        return String.fromCodePoint(cp);
      }
      return full;
    }
    return NAMED_HTML_ENTITIES[entity] ?? NAMED_HTML_ENTITIES[entity.toLowerCase()] ?? full;
  });
}
