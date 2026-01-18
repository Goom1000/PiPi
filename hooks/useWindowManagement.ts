import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Target coordinates for opening a window on a specific screen.
 * These values are cached when permission is granted.
 */
export interface ScreenTarget {
  left: number;
  top: number;
  width: number;
  height: number;
  label: string;
}

/**
 * Return type for the useWindowManagement hook.
 */
export interface UseWindowManagementResult {
  /** True if Window Management API exists in this browser (Chromium only) */
  isSupported: boolean;
  /** True if screen.isExtended === true (detectable without permission) */
  hasMultipleScreens: boolean;
  /** Current permission state for window-management */
  permissionState: 'prompt' | 'granted' | 'denied' | 'unavailable';
  /** Cached coordinates for secondary screen, null if not available */
  secondaryScreen: ScreenTarget | null;
  /** Request window-management permission, returns true if granted */
  requestPermission: () => Promise<boolean>;
  /** True until initial permission check completes */
  isLoading: boolean;
}

/**
 * Hook that encapsulates Window Management API logic.
 */
function useWindowManagement(): UseWindowManagementResult {
  // API support check (cached at mount - doesn't change during session)
  const [isSupported] = useState(() => 'getScreenDetails' in window);

  // Multi-screen detection (no permission needed)
  const [hasMultipleScreens, setHasMultipleScreens] = useState(false);

  // Permission state tracking
  const [permissionState, setPermissionState] =
    useState<'prompt' | 'granted' | 'denied' | 'unavailable'>('unavailable');

  // Cached screen coordinates
  const [secondaryScreen, setSecondaryScreen] = useState<ScreenTarget | null>(null);

  // Loading state - true until initial permission check completes
  const [isLoading, setIsLoading] = useState(true);

  // Store ScreenDetails reference for event listener cleanup
  const screenDetailsRef = useRef<ScreenDetails | null>(null);

  // Initial detection: check screen.isExtended (no permission needed)
  useEffect(() => {
    if (!isSupported) {
      setPermissionState('unavailable');
      setIsLoading(false);
      return;
    }

    const extended = (window.screen as Screen).isExtended === true;
    setHasMultipleScreens(extended);

    if (!extended) {
      setPermissionState('unavailable');
      setSecondaryScreen(null);
      setIsLoading(false);
    }

    // Fallback timeout: ensure isLoading becomes false within 5 seconds
    const fallbackTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    // Listen for screen configuration changes (monitor plug/unplug)
    const screenChangeHandler = () => {
      const nowExtended = (window.screen as Screen).isExtended === true;
      setHasMultipleScreens(nowExtended);
      if (!nowExtended) {
        setPermissionState('unavailable');
        setSecondaryScreen(null);
      }
    };
    const screenWithEvents = window.screen as unknown as EventTarget;
    screenWithEvents.addEventListener('change', screenChangeHandler);

    return () => {
      clearTimeout(fallbackTimeout);
      screenWithEvents.removeEventListener('change', screenChangeHandler);
    };
  }, [isSupported]);

  // Check existing permission state via navigator.permissions.query
  useEffect(() => {
    if (!isSupported || !hasMultipleScreens) return;

    let cancelled = false;

    const checkPermission = async () => {
      try {
        // Race permission query against timeout - some browsers hang on this query
        const timeoutPromise = new Promise<'timeout'>((resolve) => {
          setTimeout(() => resolve('timeout'), 3000);
        });

        const result = await Promise.race([
          navigator.permissions.query({
            name: 'window-management' as PermissionName
          }),
          timeoutPromise
        ]);

        if (cancelled) return;

        if (result === 'timeout') {
          setPermissionState('prompt');
          setIsLoading(false);
          return;
        }

        setPermissionState(result.state as 'prompt' | 'granted' | 'denied');
        setIsLoading(false);

        // Listen for permission changes
        result.addEventListener('change', () => {
          if (!cancelled) {
            setPermissionState(result.state as 'prompt' | 'granted' | 'denied');
          }
        });
      } catch {
        if (!cancelled) {
          setPermissionState('prompt');
          setIsLoading(false);
        }
      }
    };

    checkPermission();

    return () => {
      cancelled = true;
    };
  }, [isSupported, hasMultipleScreens]);

  // Fetch screen details when permission is granted
  useEffect(() => {
    if (permissionState !== 'granted') {
      setSecondaryScreen(null);
      return;
    }

    let cancelled = false;

    const fetchScreenDetails = async () => {
      try {
        const details = await window.getScreenDetails!();

        if (cancelled) return;

        screenDetailsRef.current = details;

        // Find secondary screen (non-primary)
        const secondary = details.screens.find(s => !s.isPrimary);
        if (secondary) {
          setSecondaryScreen({
            left: secondary.availLeft,
            top: secondary.availTop,
            width: secondary.availWidth,
            height: secondary.availHeight,
            label: secondary.label || 'External Display'
          });
        } else {
          setSecondaryScreen(null);
        }

        // Listen for screen changes
        details.addEventListener('screenschange', async () => {
          if (cancelled) return;
          try {
            const updated = await window.getScreenDetails!();
            if (cancelled) return;

            const newSecondary = updated.screens.find(s => !s.isPrimary);
            if (newSecondary) {
              setSecondaryScreen({
                left: newSecondary.availLeft,
                top: newSecondary.availTop,
                width: newSecondary.availWidth,
                height: newSecondary.availHeight,
                label: newSecondary.label || 'External Display'
              });
            } else {
              setSecondaryScreen(null);
            }
          } catch {
            setPermissionState('denied');
          }
        });
      } catch {
        setPermissionState('denied');
      }
    };

    fetchScreenDetails();

    return () => {
      cancelled = true;
      screenDetailsRef.current = null;
    };
  }, [permissionState]);

  // Request permission function
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !hasMultipleScreens) {
      return false;
    }

    try {
      const details = await window.getScreenDetails!();
      screenDetailsRef.current = details;

      const secondary = details.screens.find(s => !s.isPrimary);
      if (secondary) {
        setSecondaryScreen({
          left: secondary.availLeft,
          top: secondary.availTop,
          width: secondary.availWidth,
          height: secondary.availHeight,
          label: secondary.label || 'External Display'
        });
      }

      setPermissionState('granted');
      return true;
    } catch {
      setPermissionState('denied');
      return false;
    }
  }, [isSupported, hasMultipleScreens]);

  return {
    isSupported,
    hasMultipleScreens,
    permissionState,
    secondaryScreen,
    requestPermission,
    isLoading
  };
}

export default useWindowManagement;
