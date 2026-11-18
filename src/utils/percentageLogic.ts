export interface PercentageResult {
  value: number;
  formula: string;
  summary: string;
}

export function calcPercentOf(percent: number, total: number): PercentageResult {
  const value = (percent / 100) * total;
  return {
    value,
    formula: `(${percent} ÷ 100) × ${total} = ${Number(value.toFixed(6))}`,
    summary: `${percent}% of ${total} is ${Number(value.toFixed(6))}`,
  };
}

export function calcPercentIncrease(base: number, percent: number): PercentageResult {
  const delta = (percent / 100) * base;
  const value = base + delta;
  return {
    value,
    formula: `${base} + (${base} × ${percent}%) = ${base} + ${Number(delta.toFixed(6))} = ${Number(value.toFixed(6))}`,
    summary: `Increasing ${base} by ${percent}% gives ${Number(value.toFixed(6))}`,
  };
}

export function calcPercentDecrease(base: number, percent: number): PercentageResult {
  const delta = (percent / 100) * base;
  const value = base - delta;
  return {
    value,
    formula: `${base} − (${base} × ${percent}%) = ${base} − ${Number(delta.toFixed(6))} = ${Number(value.toFixed(6))}`,
    summary: `Decreasing ${base} by ${percent}% gives ${Number(value.toFixed(6))}`,
  };
}

export function calcPercentDifference(first: number, second: number): PercentageResult {
  const avg = (Math.abs(first) + Math.abs(second)) / 2;
  if (avg === 0) {
    return {
      value: 0,
      formula: '|0 − 0| ÷ 0 = 0%',
      summary: 'Both values are 0, so the percentage difference is 0%',
    };
  }
  const diff = Math.abs(first - second);
  const value = (diff / avg) * 100;
  return {
    value,
    formula: `(|${first} − ${second}| ÷ ((|${first}| + |${second}|) ÷ 2)) × 100 = ${Number(value.toFixed(4))}%`,
    summary: `The percentage difference between ${first} and ${second} is ${Number(value.toFixed(4))}%`,
  };
}
