import { useState, useEffect, useCallback } from 'react';
import { TourState, TourId, DEFAULT_TOUR_STATE } from '../types';

const TOUR_STORAGE_KEY = 'pipi-tour-state';

/**
 * Validate that parsed data has the expected TourState shape.
 * Guards against corrupted localStorage data.
 */
function isValidTourState(data: unknown): data is TourState {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.completedTours)) return false;
  if (typeof obj.lastDismissed !== 'object') return false;
  return true;
}

/**
 * Read tour state from localStorage with validation.
 * Exported for use outside the hook if needed.
 */
function readTourState(): TourState {
  if (typeof window === 'undefined') return DEFAULT_TOUR_STATE;
  try {
    const stored = window.localStorage.getItem(TOUR_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (isValidTourState(parsed)) {
        return { ...DEFAULT_TOUR_STATE, ...parsed };
      }
    }
  } catch (e) {
    console.warn('Failed to parse tour state from localStorage:', e);
  }
  return DEFAULT_TOUR_STATE;
}

/**
 * Hook to persist tour completion state to localStorage.
 *
 * Tracks which tours (landing, editor, presentation) have been completed
 * to prevent replaying tours on subsequent visits.
 *
 * @returns Object with tour state methods
 */
export function useTourState() {
  const [state, setState] = useState<TourState>(readTourState);

  // Persist to localStorage on every state change
  useEffect(() => {
    try {
      window.localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save tour state to localStorage:', e);
    }
  }, [state]);

  /**
   * Check if a tour has been completed.
   * @param tourId - The tour to check
   * @returns true if tour is marked as complete
   */
  const isCompleted = useCallback((tourId: TourId) => {
    return state.completedTours.includes(tourId);
  }, [state.completedTours]);

  /**
   * Mark a tour as completed.
   * Uses Set to prevent duplicate entries.
   * @param tourId - The tour to mark complete
   */
  const markCompleted = useCallback((tourId: TourId) => {
    setState(prev => ({
      ...prev,
      completedTours: [...new Set([...prev.completedTours, tourId])],
    }));
  }, []);

  /**
   * Reset a tour to allow re-watching.
   * @param tourId - The tour to reset
   */
  const resetTour = useCallback((tourId: TourId) => {
    setState(prev => ({
      ...prev,
      completedTours: prev.completedTours.filter(id => id !== tourId),
    }));
  }, []);

  /**
   * Reset all tours (for testing or support scenarios).
   */
  const resetAllTours = useCallback(() => {
    setState(DEFAULT_TOUR_STATE);
  }, []);

  return { isCompleted, markCompleted, resetTour, resetAllTours };
}
