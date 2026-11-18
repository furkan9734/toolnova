export type DiffLineType = 'unchanged' | 'added' | 'removed';

export interface DiffLine {
  type: DiffLineType;
  text: string;
  leftLineNumber: number | null;
  rightLineNumber: number | null;
}

export interface DiffResult {
  lines: DiffLine[];
  addedCount: number;
  removedCount: number;
  unchangedCount: number;
}

export function computeLineDiff(
  originalText: string,
  modifiedText: string,
  ignoreWhitespace = false
): DiffResult {
  const leftLines = originalText === '' ? [] : originalText.replace(/\r\n/g, '\n').split('\n');
  const rightLines = modifiedText === '' ? [] : modifiedText.replace(/\r\n/g, '\n').split('\n');

  const normalize = (s: string) => (ignoreWhitespace ? s.trim() : s);

  const m = leftLines.length;
  const n = rightLines.length;

  // Build LCS DP table (flat Int32Array for memory & speed)
  const cols = n + 1;
  const dp = new Int32Array((m + 1) * cols);

  for (let i = m - 1; i >= 0; i--) {
    const leftVal = normalize(leftLines[i]);
    for (let j = n - 1; j >= 0; j--) {
      if (leftVal === normalize(rightLines[j])) {
        dp[i * cols + j] = dp[(i + 1) * cols + (j + 1)] + 1;
      } else {
        const down = dp[(i + 1) * cols + j];
        const right = dp[i * cols + (j + 1)];
        dp[i * cols + j] = down >= right ? down : right;
      }
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  let addedCount = 0;
  let removedCount = 0;
  let unchangedCount = 0;

  while (i < m && j < n) {
    if (normalize(leftLines[i]) === normalize(rightLines[j])) {
      result.push({
        type: 'unchanged',
        text: rightLines[j],
        leftLineNumber: i + 1,
        rightLineNumber: j + 1,
      });
      unchangedCount++;
      i++;
      j++;
    } else if (dp[(i + 1) * cols + j] >= dp[i * cols + (j + 1)]) {
      result.push({
        type: 'removed',
        text: leftLines[i],
        leftLineNumber: i + 1,
        rightLineNumber: null,
      });
      removedCount++;
      i++;
    } else {
      result.push({
        type: 'added',
        text: rightLines[j],
        leftLineNumber: null,
        rightLineNumber: j + 1,
      });
      addedCount++;
      j++;
    }
  }

  while (i < m) {
    result.push({
      type: 'removed',
      text: leftLines[i],
      leftLineNumber: i + 1,
      rightLineNumber: null,
    });
    removedCount++;
    i++;
  }

  while (j < n) {
    result.push({
      type: 'added',
      text: rightLines[j],
      leftLineNumber: null,
      rightLineNumber: j + 1,
    });
    addedCount++;
    j++;
  }

  return {
    lines: result,
    addedCount,
    removedCount,
    unchangedCount,
  };
}
