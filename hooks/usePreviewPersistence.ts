import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * State persisted for the preview window.
 * Position, size, and snap toggle are saved per-presentation.
 */
export interface PreviewState {
  x: number;
  y: number;
  width: number;
  height: number;
  snapEnabled: boolean;
}

const STORAGE_KEY_PREFIX = 'pipi-preview-';

/**
 * Validate and clamp saved state to fit within current viewport.
 * Ensures the preview window is visible even if browser was resized.
 */
function validateAndAdjustToViewport(saved: PreviewState): PreviewState {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let { x, y, width, height, snapEnabled } = saved;

  // Clamp size first - cannot exceed viewport
  if (width > vw) {
    width = vw;
  }
  if (height > vh) {
    height = vh;
  }

  // Then adjust position to keep visible
  // "stay as close to original position as possible"
  if (x + width > vw) {
    x = Math.max(0, vw - width);
  }
  if (y + height > vh) {
    y = Math.max(0, vh - height);
  }

  // Also clamp if position is negative (unlikely but safe)
  if (x < 0) x = 0;
  if (y < 0) y = 0;

  return { x, y, width, height, snapEnabled };
}

/**
 * Validate that parsed data has the expected PreviewState shape.
 */
function isValidPreviewState(data: unknown): data is PreviewState {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.x === 'number' &&
    typeof obj.y === 'number' &&
    typeof obj.width === 'number' &&
    typeof obj.height === 'number' &&
    typeof obj.snapEnabled === 'boolean'
  );
}

/**
 * Hook to persist preview window state (position, size, snap toggle) to localStorage.
 *
 * - Loads from localStorage on mount with viewport bounds validation
 * - Saves on visibilitychange (tab hidden), beforeunload (backup), and unmount
 * - Uses ref to track latest state and avoid stale closures in event handlers
 * - Per-presentation storage using presentationId (first slide ID)
 *
 * @param presentationId Unique identifier for the presentation (slides[0].id)
 * @param defaultState Default state to use if no saved state exists
 * @returns Tuple of [state, updateState function]
 */
export function usePreviewPersistence(
  presentationId: string,
  defaultState: PreviewState
): [PreviewState, (updates: Partial<PreviewState>) => void] {
  const storageKey = `${STORAGE_KEY_PREFIX}${presentationId}`;

  // Lazy initialization from localStorage
  const [state, setState] = useState<PreviewState>(() => {
    if (typeof window === 'undefined') return defaultState;

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate parsed data has expected shape
        if (isValidPreviewState(parsed)) {
          // Merge with defaults (in case schema evolved) and validate viewport
          const merged = { ...defaultState, ...parsed };
          return validateAndAdjustToViewport(merged);
        }
      }
    } catch (e) {
      console.warn('Failed to parse preview state from localStorage:', e);
    }
    return defaultState;
  });

  // Ref to track latest state for save handlers (avoid stale closures)
  const stateRef = useRef(state);
  stateRef.current = state;

  // Save to localStorage function
  const saveToStorage = useCallback(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(stateRef.current));
    } catch (e) {
      console.warn('Failed to save preview state to localStorage:', e);
    }
  }, [storageKey]);

  // Set up save event listeners
  useEffect(() => {
    // Save when tab becomes hidden (most reliable, especially mobile)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveToStorage();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also save on beforeunload as backup (desktop browsers)
    window.addEventListener('beforeunload', saveToStorage);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', saveToStorage);
      // Save on unmount as well
      saveToStorage();
    };
  }, [saveToStorage]);

  // Update state function (partial updates supported)
  const updateState = useCallback((updates: Partial<PreviewState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  return [state, updateState];
}

export default usePreviewPersistence;
