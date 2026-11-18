import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Bell, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '../hooks/useToast';

const QUICK_PRESETS = [
  { label: '1 min', h: 0, m: 1, s: 0 },
  { label: '5 min', h: 0, m: 5, s: 0 },
  { label: '10 min', h: 0, m: 10, s: 0 },
  { label: '15 min', h: 0, m: 15, s: 0 },
  { label: '25 min', h: 0, m: 25, s: 0 },
  { label: '45 min', h: 0, m: 45, s: 0 },
];

function formatCountdown(ms: number): string {
  const totalSec = Math.ceil(Math.max(0, ms) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function playCompletionChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + idx * 0.14;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.36);
    });
  } catch {
    // Audio playback blocked or unavailable; silent fallback
  }
}

export default function CountdownTimerTool() {
  const { showToast } = useToast();

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);

  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'completed'>('idle');
  const [remainingMs, setRemainingMs] = useState(5 * 60 * 1000);
  const [totalConfiguredMs, setTotalConfiguredMs] = useState(5 * 60 * 1000);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported'
  );

  // Target wall-clock timestamp prevents drift when browser throttles background tabs
  const targetTimestampRef = useRef<number | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const computeConfiguredMs = useCallback(
    (h = hours, m = minutes, s = seconds) =>
      Math.max(0, (Math.max(0, h) * 3600 + Math.max(0, m) * 60 + Math.max(0, s)) * 1000),
    [hours, minutes, seconds]
  );

  const handleCompletion = useCallback(() => {
    targetTimestampRef.current = null;
    setRemainingMs(0);
    setStatus('completed');
    showToast('Countdown complete', 'success', 'Your timer has reached 00:00:00.');

    if (soundEnabledRef.current) {
      playCompletionChime();
    }

    // Only show Notification API alert if permission is already granted
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification('ToolNova Countdown Complete', {
          body: 'Your countdown timer has finished.',
        });
      } catch {
        // Ignore browser notification errors in restricted contexts
      }
    }
  }, [showToast]);

  useEffect(() => {
    if (status !== 'running' || targetTimestampRef.current === null) return;

    const updateRemaining = () => {
      if (targetTimestampRef.current === null) return;
      const diff = targetTimestampRef.current - Date.now();
      if (diff <= 0) {
        handleCompletion();
      } else {
        setRemainingMs(diff);
      }
    };

    updateRemaining();
    const intervalId = window.setInterval(updateRemaining, 200);
    const onVisibility = () => {
      if (!document.hidden) updateRemaining();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [status, handleCompletion]);

  const handleStart = () => {
    const ms = status === 'paused' ? remainingMs : computeConfiguredMs();
    if (ms <= 0) {
      showToast('Set a duration greater than 0 seconds', 'error');
      return;
    }
    if (status !== 'paused') {
      setTotalConfiguredMs(ms);
    }
    setRemainingMs(ms);
    targetTimestampRef.current = Date.now() + ms;
    setStatus('running');
  };

  const handlePause = () => {
    if (targetTimestampRef.current !== null) {
      const diff = Math.max(0, targetTimestampRef.current - Date.now());
      setRemainingMs(diff);
      targetTimestampRef.current = null;
    }
    setStatus('paused');
  };

  const handleReset = () => {
    targetTimestampRef.current = null;
    const ms = computeConfiguredMs();
    setTotalConfiguredMs(ms);
    setRemainingMs(ms);
    setStatus('idle');
  };

  const applyPreset = (h: number, m: number, s: number) => {
    targetTimestampRef.current = null;
    setHours(h);
    setMinutes(m);
    setSeconds(s);
    const ms = (h * 3600 + m * 60 + s) * 1000;
    setTotalConfiguredMs(ms);
    setRemainingMs(ms);
    setStatus('idle');
  };

  const handleDurationEdit = (nextH: number, nextM: number, nextS: number) => {
    const safeH = Math.max(0, Math.min(99, nextH));
    const safeM = Math.max(0, Math.min(59, nextM));
    const safeS = Math.max(0, Math.min(59, nextS));
    setHours(safeH);
    setMinutes(safeM);
    setSeconds(safeS);
    if (status === 'idle' || status === 'completed') {
      const ms = (safeH * 3600 + safeM * 60 + safeS) * 1000;
      setTotalConfiguredMs(ms);
      setRemainingMs(ms);
      setStatus('idle');
    }
  };

  const requestNotificationAccess = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        showToast('Browser notifications enabled', 'success');
      } else {
        showToast('Browser notification permission not granted', 'info');
      }
    } catch {
      showToast('Notifications unavailable in this browser context', 'info');
    }
  };

  const progressPct =
    totalConfiguredMs > 0
      ? Math.max(0, Math.min(100, (remainingMs / totalConfiguredMs) * 100))
      : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Quick Presets */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {QUICK_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={status === 'running'}
            onClick={() => applyPreset(preset.h, preset.m, preset.s)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10131C] text-slate-700 dark:text-slate-200 hover:border-[#635BFF] disabled:opacity-40"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Main Countdown Card */}
      <div className="p-8 sm:p-10 rounded-2xl bg-slate-50 dark:bg-[#10131C] border border-slate-200 dark:border-slate-800 text-center space-y-6">
        <div
          role="timer"
          aria-live="off"
          className={`font-mono font-bold tracking-tight tabular-nums select-none ${
            status === 'completed'
              ? 'text-[#22C55E]'
              : 'text-[#111827] dark:text-white'
          }`}
          style={{ fontSize: 'clamp(2.75rem, 8vw, 4.75rem)' }}
        >
          {formatCountdown(remainingMs)}
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            style={{ width: `${progressPct}%` }}
            className={`h-full transition-all duration-200 ${
              status === 'completed' ? 'bg-[#22C55E]' : 'bg-[#635BFF]'
            }`}
          />
        </div>

        {status === 'completed' && (
          <p role="status" className="text-sm font-semibold text-[#22C55E]">
            Time is up!
          </p>
        )}

        {/* Editable Hours / Minutes / Seconds */}
        <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
          <div className="space-y-1">
            <label htmlFor="cd-hours" className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Hours
            </label>
            <input
              id="cd-hours"
              type="number"
              min={0}
              max={99}
              disabled={status === 'running' || status === 'paused'}
              value={hours}
              onChange={(e) => handleDurationEdit(Number(e.target.value) || 0, minutes, seconds)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-center text-base text-[#111827] dark:text-white disabled:opacity-50 tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="cd-mins" className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Minutes
            </label>
            <input
              id="cd-mins"
              type="number"
              min={0}
              max={59}
              disabled={status === 'running' || status === 'paused'}
              value={minutes}
              onChange={(e) => handleDurationEdit(hours, Number(e.target.value) || 0, seconds)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-center text-base text-[#111827] dark:text-white disabled:opacity-50 tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="cd-secs" className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Seconds
            </label>
            <input
              id="cd-secs"
              type="number"
              min={0}
              max={59}
              disabled={status === 'running' || status === 'paused'}
              value={seconds}
              onChange={(e) => handleDurationEdit(hours, minutes, Number(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] font-mono text-center text-base text-[#111827] dark:text-white disabled:opacity-50 tabular-nums"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {status === 'running' ? (
            <button
              type="button"
              onClick={handlePause}
              className="min-w-[130px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#534AE8]"
            >
              <Pause className="w-4 h-4" aria-hidden="true" />
              Pause
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              className="min-w-[130px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#534AE8]"
            >
              <Play className="w-4 h-4" aria-hidden="true" />
              {status === 'paused' ? 'Resume' : 'Start Timer'}
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B26] text-slate-700 dark:text-slate-200"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Reset
          </button>
        </div>

        {/* Sound & Optional Notification Permission */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-[#111827] dark:hover:text-white"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#635BFF]" aria-hidden="true" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" aria-hidden="true" />
            )}
            Chime: {soundEnabled ? 'On' : 'Muted'}
          </button>

          {notifPermission === 'default' && (
            <button
              type="button"
              onClick={requestNotificationAccess}
              className="inline-flex items-center gap-1.5 text-[#635BFF] dark:text-[#8B5CF6] hover:underline"
            >
              <Bell className="w-3.5 h-3.5" aria-hidden="true" />
              Enable Browser Notification
            </button>
          )}
          {notifPermission === 'granted' && (
            <span className="inline-flex items-center gap-1.5 text-[#22C55E]">
              <Bell className="w-3.5 h-3.5" aria-hidden="true" />
              Browser notification active
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
