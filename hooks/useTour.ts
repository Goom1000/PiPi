import { useCallback, useEffect, useRef, useState } from 'react';
import { driver, DriveStep, Config } from 'driver.js';

interface UseTourOptions {
  steps: DriveStep[];
  onComplete?: () => void;  // Called only when user finishes all steps
  onDestroy?: () => void;   // Called on any tour exit (skip, complete, or error)
}

export function useTour({ steps, onComplete, onDestroy }: UseTourOptions) {
  const [isRunning, setIsRunning] = useState(false);
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const currentStepRef = useRef<number>(0);
  const totalStepsRef = useRef<number>(0);

  const startTour = useCallback(() => {
    // Cleanup any existing instance
    if (driverRef.current) {
      driverRef.current.destroy();
    }

    // Track total steps for completion detection
    totalStepsRef.current = steps.length;
    currentStepRef.current = 0;

    const config: Config = {
      showProgress: true,
      allowClose: true,
      allowKeyboardControl: true,
      popoverClass: 'cue-tour-popover',
      overlayColor: 'rgba(0, 0, 0, 0.75)',
      stagePadding: 10,
      stageRadius: 8,
      steps,
      onHighlightStarted: (element, step, options) => {
        // Track current step index for completion detection
        // driver.js provides step index through the options
        if (options.state && typeof options.state.activeIndex === 'number') {
          currentStepRef.current = options.state.activeIndex;
        }
      },
      onDestroyed: () => {
        setIsRunning(false);

        // Check if tour was completed (reached last step)
        // Driver.js advances activeIndex before calling onDestroyed on completion
        const completedAllSteps = currentStepRef.current >= totalStepsRef.current - 1;

        if (completedAllSteps && onComplete) {
          onComplete();
        }

        onDestroy?.();
        driverRef.current = null;
      },
      onCloseClick: () => {
        // User clicked X or pressed Escape - this is a skip
        driverRef.current?.destroy();
      },
    };

    try {
      driverRef.current = driver(config);
      setIsRunning(true);
      driverRef.current.drive();
    } catch (e) {
      console.error('Tour error:', e);
      driverRef.current?.destroy();
      setIsRunning(false);
    }
  }, [steps, onComplete, onDestroy]);

  // Cleanup on unmount using useEffect (not useCallback)
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, []);

  return { startTour, isRunning };
}
