import {
  UploadedResource,
  DocumentAnalysis,
  EnhancementResult,
  EnhancementOptions,
  Slide
} from '../../types';
import { AIProviderInterface, buildSlideContextForEnhancement } from '../aiProvider';

/**
 * Enhancement state for UI progress tracking.
 * Covers all possible states during the enhancement workflow.
 */
export type EnhancementState =
  | { status: 'idle' }
  | { status: 'analyzing'; progress: number }
  | { status: 'enhancing'; progress: number }
  | { status: 'complete'; result: EnhancementResult }
  | { status: 'error'; error: string }
  | { status: 'cancelled' };

/**
 * Enhance an uploaded document with differentiated versions and answer keys.
 *
 * Orchestrates the enhancement pipeline:
 * 1. Builds slide context for alignment detection (limited to 15 slides)
 * 2. Calls AI provider to generate three differentiated versions
 * 3. Reports progress throughout for UI updates
 *
 * @param resource - The uploaded resource being enhanced
 * @param analysis - Pre-computed document analysis (from Phase 44)
 * @param slides - Lesson slides for alignment detection
 * @param provider - AI provider (Gemini or Claude)
 * @param options - Enhancement options (preserveMode, generateAnswerKey, gradeLevel)
 * @param signal - Optional AbortSignal for cancellation (ENHANCE-05)
 * @param onProgress - Callback for UI state updates
 * @returns EnhancementResult with three versions, slide matches, and answer keys
 */
export async function enhanceUploadedDocument(
  resource: UploadedResource,
  analysis: DocumentAnalysis,
  slides: Slide[],
  provider: AIProviderInterface,
  options: EnhancementOptions,
  signal?: AbortSignal,
  onProgress?: (state: EnhancementState) => void
): Promise<EnhancementResult> {
  try {
    // Report enhancing state (analysis already complete)
    onProgress?.({ status: 'enhancing', progress: 0 });

    // Build slide context (limited to 15 slides per research decision)
    const slideContext = buildSlideContextForEnhancement(slides);

    // Progress update before AI call
    onProgress?.({ status: 'enhancing', progress: 50 });

    // Call AI provider for enhancement
    const result = await provider.enhanceDocument(analysis, slideContext, options, signal);

    // Report completion
    onProgress?.({ status: 'complete', result });
    return result;
  } catch (error) {
    // Handle cancellation specifically
    if ((error as Error).name === 'AbortError') {
      onProgress?.({ status: 'cancelled' });
      throw error;  // Re-throw for caller to handle
    }

    // Report error state
    const errorMessage = error instanceof Error ? error.message : 'Enhancement failed';
    onProgress?.({ status: 'error', error: errorMessage });
    throw error;
  }
}

/**
 * Get default enhancement options.
 * Used when initializing enhancement UI or creating default configurations.
 *
 * @returns Default EnhancementOptions with preserve mode enabled
 */
export function getDefaultEnhancementOptions(): EnhancementOptions {
  return {
    preserveMode: true,       // ENHANCE-01: preserve original content by default
    generateAnswerKey: true,  // ENHANCE-04: generate answer key by default
    gradeLevel: 'Year 6 (10-11 years old)'
  };
}
