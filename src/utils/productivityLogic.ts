import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({
  gfm: true,
  breaks: true,
});

export function renderSafeMarkdown(markdown: string): string {
  const rawHtml = marked.parse(markdown, { async: false }) as string;
  if (typeof window !== 'undefined' && DOMPurify?.sanitize) {
    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    });
  }
  return rawHtml;
}

export function buildStandaloneHtmlDocument(title: string, bodyHtml: string): string {
  const safeTitle = title.replace(/[<>&"]/g, '');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle || 'Markdown Export'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 780px; margin: 2.5rem auto; padding: 0 1.25rem; line-height: 1.65; color: #111827; }
    h1, h2, h3 { line-height: 1.25; margin-top: 1.6em; }
    code { background: #f1f5f9; padding: 0.15em 0.35em; border-radius: 4px; font-size: 0.9em; }
    pre { background: #0f172a; color: #e2e8f0; padding: 1rem; border-radius: 8px; overflow-x: auto; }
    pre code { background: transparent; padding: 0; color: inherit; }
    blockquote { border-left: 3px solid #635bff; margin-left: 0; padding-left: 1rem; color: #475569; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #cbd5e1; padding: 0.5rem 0.75rem; text-align: left; }
    a { color: #635bff; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'vivamus', 'sagittis',
  'lacus', 'vel', 'augue', 'laoreet', 'rutrum', 'faucibus', 'integer', 'posuere',
  'erat', 'ante', 'venenatis', 'dapibus', 'aliquet', 'maecenas', 'diam', 'eget',
  'risus', 'varius', 'blandit', 'curabitur', 'blandit', 'tempus', 'porttitor',
];

const CLASSIC_OPENING = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

function buildSentence(wordCount: number, seedOffset: number): string {
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const word = LOREM_WORDS[(seedOffset + i * 7) % LOREM_WORDS.length];
    words.push(word);
  }
  if (words.length > 0) {
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  }
  return `${words.join(' ')}.`;
}

export function generateLoremIpsum(
  mode: 'words' | 'sentences' | 'paragraphs',
  count: number,
  startWithClassic = true
): string {
  const safeCount = Math.max(1, Math.min(mode === 'words' ? 500 : mode === 'sentences' ? 60 : 25, Math.round(count)));

  if (mode === 'words') {
    const baseWords = startWithClassic
      ? ['Lorem', 'ipsum', 'dolor', 'sit', 'amet']
      : [];
    const out: string[] = [];
    for (let i = 0; i < safeCount; i++) {
      if (i < baseWords.length) out.push(baseWords[i]);
      else out.push(LOREM_WORDS[(i * 5 + 3) % LOREM_WORDS.length]);
    }
    return out.join(' ');
  }

  if (mode === 'sentences') {
    const sentences: string[] = [];
    for (let i = 0; i < safeCount; i++) {
      if (i === 0 && startWithClassic) {
        sentences.push(CLASSIC_OPENING);
      } else {
        const len = 9 + ((i * 5) % 8);
        sentences.push(buildSentence(len, i * 11 + 4));
      }
    }
    return sentences.join(' ');
  }

  const paragraphs: string[] = [];
  for (let p = 0; p < safeCount; p++) {
    const sentenceCount = 4 + (p % 2);
    const sentences: string[] = [];
    for (let s = 0; s < sentenceCount; s++) {
      if (p === 0 && s === 0 && startWithClassic) {
        sentences.push(CLASSIC_OPENING);
      } else {
        const len = 9 + (((p + s) * 3) % 8);
        sentences.push(buildSentence(len, p * 19 + s * 13 + 7));
      }
    }
    paragraphs.push(sentences.join(' '));
  }
  return paragraphs.join('\n\n');
}

function getCryptoRandomIntInclusive(min: number, max: number): number {
  const range = max - min + 1;
  if (range <= 1) return min;
  if (range > 0xffffffff) {
    throw new Error('Range exceeds 32-bit integer span.');
  }

  const cryptoApi =
    typeof globalThis !== 'undefined' && globalThis.crypto ? globalThis.crypto : undefined;
  if (!cryptoApi?.getRandomValues) {
    throw new Error('Web Crypto API is unavailable in this environment.');
  }

  const maxUnbiased = Math.floor(0x100000000 / range) * range;
  const buf = new Uint32Array(1);
  while (true) {
    cryptoApi.getRandomValues(buf);
    if (buf[0] < maxUnbiased) {
      return min + (buf[0] % range);
    }
  }
}

export function generateRandomNumbers(options: {
  min: number;
  max: number;
  count: number;
  unique: boolean;
  sort: 'none' | 'asc' | 'desc';
}): number[] {
  const { min, max, count, unique, sort } = options;

  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new Error('Minimum and maximum must be whole integers.');
  }
  if (min > max) {
    throw new Error('Minimum value cannot exceed maximum value.');
  }
  if (!Number.isInteger(count) || count < 1 || count > 500) {
    throw new Error('Quantity must be between 1 and 500 numbers.');
  }

  const span = max - min + 1;
  if (span > 1_000_000_000) {
    throw new Error('Keep the range span within 1,000,000,000.');
  }
  if (unique && count > span) {
    throw new Error(
      `Cannot generate ${count} unique numbers from a range containing only ${span} possible values (${min} to ${max}).`
    );
  }

  const numbers: number[] = [];
  if (unique) {
    const used = new Set<number>();
    while (numbers.length < count) {
      const val = getCryptoRandomIntInclusive(min, max);
      if (!used.has(val)) {
        used.add(val);
        numbers.push(val);
      }
    }
  } else {
    for (let i = 0; i < count; i++) {
      numbers.push(getCryptoRandomIntInclusive(min, max));
    }
  }

  if (sort === 'asc') numbers.sort((a, b) => a - b);
  else if (sort === 'desc') numbers.sort((a, b) => b - a);

  return numbers;
}
