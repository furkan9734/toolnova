export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeSimilar: boolean;
}

export interface PasswordStrength {
  entropyBits: number;
  label: 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  level: 1 | 2 | 3 | 4;
}

const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?',
};

const SIMILAR_CHARS = /[il1Lo0O]/g;

function getRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) return 0;
  const maxUint32 = 0xffffffff;
  const limit = maxUint32 - ((maxUint32 + 1) % maxExclusive);
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    window.crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value > limit);
  return value % maxExclusive;
}

function filterSet(chars: string, excludeSimilar: boolean): string {
  return excludeSimilar ? chars.replace(SIMILAR_CHARS, '') : chars;
}

export function generateSecurePassword(options: PasswordOptions): string {
  const activePools: string[] = [];
  if (options.uppercase) activePools.push(filterSet(CHARSETS.uppercase, options.excludeSimilar));
  if (options.lowercase) activePools.push(filterSet(CHARSETS.lowercase, options.excludeSimilar));
  if (options.numbers) activePools.push(filterSet(CHARSETS.numbers, options.excludeSimilar));
  if (options.symbols) activePools.push(CHARSETS.symbols);

  if (activePools.length === 0) {
    throw new Error('Select at least one character type.');
  }

  const length = Math.min(128, Math.max(4, Math.floor(options.length)));
  const combinedPool = activePools.join('');
  const resultChars: string[] = [];

  // Guarantee at least one character from each enabled pool when length permits
  for (let i = 0; i < activePools.length && resultChars.length < length; i++) {
    const pool = activePools[i];
    resultChars.push(pool[getRandomInt(pool.length)]);
  }

  while (resultChars.length < length) {
    resultChars.push(combinedPool[getRandomInt(combinedPool.length)]);
  }

  // Cryptographic Fisher-Yates shuffle
  for (let i = resultChars.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    const temp = resultChars[i];
    resultChars[i] = resultChars[j];
    resultChars[j] = temp;
  }

  return resultChars.join('');
}

export function evaluatePasswordStrength(options: PasswordOptions): PasswordStrength {
  let poolSize = 0;
  if (options.uppercase) poolSize += filterSet(CHARSETS.uppercase, options.excludeSimilar).length;
  if (options.lowercase) poolSize += filterSet(CHARSETS.lowercase, options.excludeSimilar).length;
  if (options.numbers) poolSize += filterSet(CHARSETS.numbers, options.excludeSimilar).length;
  if (options.symbols) poolSize += CHARSETS.symbols.length;

  if (poolSize === 0) {
    return { entropyBits: 0, label: 'Weak', level: 1 };
  }

  const entropyBits = Math.round(options.length * Math.log2(poolSize));

  if (entropyBits < 45) {
    return { entropyBits, label: 'Weak', level: 1 };
  }
  if (entropyBits < 65) {
    return { entropyBits, label: 'Fair', level: 2 };
  }
  if (entropyBits < 90) {
    return { entropyBits, label: 'Strong', level: 3 };
  }
  return { entropyBits, label: 'Very Strong', level: 4 };
}
