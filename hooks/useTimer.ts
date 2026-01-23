import { useState, useEffect, useRef, useCallback } from 'react';

interface TimerConfig {
  initialSeconds: number;
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
  autoStart?: boolean;
}

interface TimerResult {
  timeRemaining: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: (seconds?: number) => void;
  formattedTime: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Reusable countdown timer hook for The Chase game modes.
 * Provides pause/resume capability and formatted time display.
 *
 * Used in:
 * - Cash Builder (60s)
 * - Final Chase contestant round (2min)
 * - Final Chase chaser round (2min)
 */
export function useTimer({
  initialSeconds,
  onComplete,
  onTick,
  autoStart = false
}: TimerConfig): TimerResult {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<number | null>(null);

  // Start timer
  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  // Pause timer
  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  // Reset timer with optional new duration
  const reset = useCallback((seconds?: number) => {
    setIsRunning(false);
    setTimeRemaining(seconds ?? initialSeconds);
  }, [initialSeconds]);

  // Timer effect - runs when isRunning changes
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;

        // Call onTick callback
        if (onTick) {
          onTick(next);
        }

        // Timer complete
        if (next <= 0) {
          setIsRunning(false);
          if (onComplete) {
            onComplete();
          }
          return 0;
        }

        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, onComplete, onTick]);

  return {
    timeRemaining,
    isRunning,
    start,
    pause,
    reset,
    formattedTime: formatTime(timeRemaining)
  };
}
