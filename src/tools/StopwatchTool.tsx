import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag, Copy } from 'lucide-react';
import { copyToClipboard } from '../utils/download';
import { useToast } from '../hooks/useToast';

interface LapEntry {
  lapNumber: number;
  lapDurationMs: number;
  totalElapsedMs: number;
}

function formatStopwatchTime(ms: number): { main: string; centiseconds: string } {
  const clamped = Math.max(0, Math.floor(ms));
  const hours = Math.floor(clamped / 3_600_000);
  const minutes = Math.floor((clamped % 3_600_000) / 60_000);
  const seconds = Math.floor((clamped % 60_000) / 1000);
  const centis = Math.floor((clamped % 1000) / 10);

  const hh = hours > 0 ? `${String(hours).padStart(2, '0')}:` : '';
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const cc = String(centis).padStart(2, '0');

  return { main: `${hh}${mm}:${ss}`, centiseconds: cc };
}

function formatFullString(ms: number): string {
  const { main, centiseconds } = formatStopwatchTime(ms);
  return `${main}.${centiseconds}`;
}

export default function StopwatchTool() {
  const { showToast } = useToast();

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [laps, setLaps] = useState<LapEntry[]>([]);

  const startPerfRef = useRef<number>(0);
  const accumulatedMsRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRunning) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const tick = () => {
      const current = accumulatedMsRef.current + (performance.now() - startPerfRef.current);
      setElapsedMs(current);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isRunning]);

  const handleStartPause = () => {
    if (isRunning) {
      accumulatedMsRef.current += performance.now() - startPerfRef.current;
      setElapsedMs(accumulatedMsRef.current);
      setIsRunning(false);
    } else {
      startPerfRef.current = performance.now();
      setIsRunning(true);
    }
  };

  const handleLap = () => {
    if (!isRunning && elapsedMs === 0) return;
    const currentTotal = isRunning
      ? accumulatedMsRef.current + (performance.now() - startPerfRef.current)
      : accumulatedMsRef.current;

    setLaps((prev) => {
      const prevTotal = prev.length > 0 ? prev[0].totalElapsedMs : 0;
      const lapDurationMs = Math.max(0, currentTotal - prevTotal);
      return [
        {
          lapNumber: prev.length + 1,
          lapDurationMs,
          totalElapsedMs: currentTotal,
        },
        ...prev,
      ];
    });
  };

  const handleReset = () => {
    setIsRunning(false);
    accumulatedMsRef.current = 0;
    startPerfRef.current = 0;
    setElapsedMs(0);
    setLaps([]);
  };

  const handleCopyLaps = async () => {
    if (laps.length === 0) return;
    const lines = [...laps]
      .reverse()
      .map(
        (l) =>
          `Lap ${l.lapNumber}: Split ${formatFullString(l.lapDurationMs)} | Total ${formatFullString(
            l.totalElapsedMs
          )}`
      );
    const ok = await copyToClipboard(lines.join('\n'));
    if (ok) showToast('Lap times copied', 'success');
  };

  const { main, centiseconds } = formatStopwatchTime(elapsedMs);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Main Monotonic Clock Readout */}
      <div className="p-8 sm:p-10 rounded-2xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 text-center space-y-6">
        <div
          aria-live="off"
          className="font-mono font-bold tracking-tight text-[#111827] dark:text-white tabular-nums select-none"
          style={{ fontSize: 'clamp(2.75rem, 8vw, 4.75rem)' }}
        >
          <span>{main}</span>
          <span className="text-[#635BFF] dark:text-[#8B5CF6]">.{centiseconds}</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleStartPause}
            className="min-w-[130px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#534AE8] transition-colors"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" aria-hidden="true" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" aria-hidden="true" />
                {elapsedMs > 0 ? 'Resume' : 'Start'}
              </>
            )}
          </button>

          <button
            type="button"
            disabled={!isRunning && elapsedMs === 0}
            onClick={handleLap}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-[#111827] dark:text-white hover:border-[#635BFF] disabled:opacity-40"
          >
            <Flag className="w-4 h-4" aria-hidden="true" />
            Lap
          </button>

          <button
            type="button"
            disabled={!isRunning && elapsedMs === 0 && laps.length === 0}
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200 hover:text-rose-600 disabled:opacity-40"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>

      {/* Lap History */}
      {laps.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10131C] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#171B26] flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-[#111827] dark:text-white">
              Recorded Laps ({laps.length})
            </h3>
            <button
              type="button"
              onClick={handleCopyLaps}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#635BFF] dark:text-[#8B5CF6] hover:underline"
            >
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              Copy Laps
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-[#171B26] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-medium text-slate-500 dark:text-slate-400">Lap</th>
                  <th className="py-2.5 px-4 font-medium text-slate-500 dark:text-slate-400">Split Time</th>
                  <th className="py-2.5 px-4 font-medium text-slate-500 dark:text-slate-400 text-right">Total Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono tabular-nums">
                {laps.map((lap) => (
                  <tr key={lap.lapNumber}>
                    <td className="py-2.5 px-4 font-semibold text-[#111827] dark:text-white">
                      #{String(lap.lapNumber).padStart(2, '0')}
                    </td>
                    <td className="py-2.5 px-4 text-[#635BFF] dark:text-[#8B5CF6]">
                      +{formatFullString(lap.lapDurationMs)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-700 dark:text-slate-300">
                      {formatFullString(lap.totalElapsedMs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
