export interface TextAnalysis {
  words: number;
  characters: number;
  charactersWithoutSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingTimeLabel: string;
  speakingTimeLabel: string;
}

export type CaseTransformMode = 'uppercase' | 'lowercase' | 'titlecase' | 'sentencecase';

export interface TextCleanOptions {
  trimText: boolean;
  trimEachLine: boolean;
  removeDuplicateSpaces: boolean;
  removeBlankLines: boolean;
  convertTabsToSpaces: boolean;
}

export interface TextCleanResult {
  cleaned: string;
  originalLength: number;
  cleanedLength: number;
  removedChars: number;
}

export interface DuplicateLineOptions {
  caseSensitive: boolean;
  trimBeforeCompare: boolean;
  ignoreBlankLines: boolean;
}

export interface DuplicateLineResult {
  output: string;
  originalLineCount: number;
  keptLineCount: number;
  removedCount: number;
}

function formatDurationFromWords(wordCount: number, wordsPerMinute: number): string {
  if (wordCount === 0) return '0 sec';
  const totalSeconds = Math.ceil((wordCount / wordsPerMinute) * 60);
  if (totalSeconds < 60) {
    return `${totalSeconds} sec`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds > 0 ? `${minutes} min ${seconds} sec` : `${minutes} min`;
}

export function analyzeText(input: string): TextAnalysis {
  const trimmed = input.trim();
  const characters = input.length;
  const charactersWithoutSpaces = input.replace(/\s/g, '').length;

  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;

  const sentences = trimmed
    ? trimmed
        .split(/[.!?]+(?=\s|$)/)
        .map((s) => s.trim())
        .filter(Boolean).length
    : 0;

  const paragraphs = trimmed
    ? trimmed
        .split(/\n\s*\n+/)
        .map((p) => p.trim())
        .filter(Boolean).length
    : 0;

  const lines = input === '' ? 0 : input.split(/\r\n|\r|\n/).length;

  return {
    words,
    characters,
    charactersWithoutSpaces,
    sentences,
    paragraphs,
    lines,
    readingTimeLabel: formatDurationFromWords(words, 200),
    speakingTimeLabel: formatDurationFromWords(words, 130),
  };
}

const MINOR_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'but',
  'by',
  'for',
  'if',
  'in',
  'nor',
  'of',
  'on',
  'or',
  'per',
  'so',
  'the',
  'to',
  'up',
  'via',
  'yet',
]);

export function convertTextCase(input: string, mode: CaseTransformMode): string {
  if (!input) return '';

  switch (mode) {
    case 'uppercase':
      return input.toUpperCase();

    case 'lowercase':
      return input.toLowerCase();

    case 'titlecase': {
      const tokens = input.toLowerCase().split(/(\s+)/);
      const wordIndices = tokens
        .map((t, i) => (/\S/.test(t) ? i : -1))
        .filter((i) => i !== -1);
      const firstIdx = wordIndices[0];
      const lastIdx = wordIndices[wordIndices.length - 1];

      return tokens
        .map((token, idx) => {
          if (!/\S/.test(token)) return token;
          const clean = token.replace(/[^a-z0-9]/gi, '');
          const isEdge = idx === firstIdx || idx === lastIdx;
          if (!isEdge && MINOR_WORDS.has(clean)) {
            return token;
          }
          return token.replace(/^([^a-zA-Z0-9]*)([a-zA-Z])/, (_, prefix, firstChar) => {
            return prefix + firstChar.toUpperCase();
          });
        })
        .join('');
    }

    case 'sentencecase': {
      const lower = input.toLowerCase();
      return lower.replace(/(^\s*|[.!?]\s+|\n+\s*)([a-z])/g, (_, prefix, letter) => {
        return prefix + letter.toUpperCase();
      });
    }

    default:
      return input;
  }
}

export function cleanText(input: string, options: TextCleanOptions): TextCleanResult {
  let working = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  if (options.convertTabsToSpaces) {
    working = working.replace(/\t+/g, ' ');
  }

  let lines = working.split('\n');

  if (options.removeDuplicateSpaces) {
    lines = lines.map((line) => line.replace(/[ ]{2,}/g, ' '));
  }

  if (options.trimEachLine) {
    lines = lines.map((line) => line.trim());
  }

  if (options.removeBlankLines) {
    lines = lines.filter((line) => line.trim().length > 0);
  }

  working = lines.join('\n');

  if (options.trimText) {
    working = working.trim();
  }

  return {
    cleaned: working,
    originalLength: input.length,
    cleanedLength: working.length,
    removedChars: Math.max(0, input.length - working.length),
  };
}

export function removeDuplicateLines(
  input: string,
  options: DuplicateLineOptions
): DuplicateLineResult {
  if (input === '') {
    return {
      output: '',
      originalLineCount: 0,
      keptLineCount: 0,
      removedCount: 0,
    };
  }

  const normalized = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const seen = new Set<string>();
  const kept: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (options.ignoreBlankLines && trimmed === '') {
      continue;
    }

    const base = options.trimBeforeCompare ? trimmed : line;
    const key = options.caseSensitive ? base : base.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      kept.push(options.trimBeforeCompare ? base : line);
    }
  }

  return {
    output: kept.join('\n'),
    originalLineCount: lines.length,
    keptLineCount: kept.length,
    removedCount: Math.max(0, lines.length - kept.length),
  };
}
