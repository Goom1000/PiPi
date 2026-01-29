---
phase: 45-enhancement-with-lesson-context
plan: 02
subsystem: ai-services
tags: [document-enhancement, gemini-provider, claude-provider, orchestration, abort-signal]

dependency-graph:
  requires:
    - phase: 45-01
      provides: EnhancementResult types, ENHANCEMENT_SYSTEM_PROMPT, AIProviderInterface.enhanceDocument signature
  provides:
    - GeminiProvider.enhanceDocument with responseSchema structured output
    - ClaudeProvider.enhanceDocument with tool_choice structured output
    - enhanceUploadedDocument orchestration function with progress callbacks
    - EnhancementState type for UI status tracking
    - getDefaultEnhancementOptions helper
  affects: [45-03-ui-integration, 46-preview-ui]

tech-stack:
  added: []
  patterns: [abort-signal-cancellation, progress-callback-state, tool-choice-structured-output, response-schema-structured-output]

key-files:
  created:
    - services/documentEnhancement/documentEnhancementService.ts
  modified:
    - services/providers/geminiProvider.ts
    - services/providers/claudeProvider.ts

key-decisions:
  - "Gemini uses responseSchema in config for structured JSON output"
  - "Claude uses tool_choice with input_schema for structured JSON output"
  - "AbortSignal passed via config.abortSignal for Gemini, fetch signal for Claude"
  - "Progress callback reports enhancing state at 0% and 50% (before AI call)"

patterns-established:
  - "ENHANCEMENT_RESULT_SCHEMA for Gemini (uses Type.OBJECT, Type.ARRAY, etc.)"
  - "ENHANCEMENT_RESULT_JSON_SCHEMA for Claude (uses standard JSON Schema)"
  - "Reusable schema building functions (DIFFERENTIATED_VERSION_SCHEMA)"

duration: ~4 minutes
completed: 2026-01-30
---

# Phase 45 Plan 02: Provider Implementations and Enhancement Service Summary

**Gemini and Claude providers now implement enhanceDocument with structured output schemas, plus orchestration service with progress callbacks and cancellation support**

## Performance

- **Duration:** ~4 minutes
- **Started:** 2026-01-29T21:23:47Z
- **Completed:** 2026-01-29T21:27:41Z
- **Tasks:** 3/3
- **Files modified:** 3

## Accomplishments

- Implemented GeminiProvider.enhanceDocument with ENHANCEMENT_RESULT_SCHEMA for structured JSON output
- Implemented ClaudeProvider.enhanceDocument with tool_choice for structured JSON output
- Created documentEnhancementService with enhanceUploadedDocument orchestration function
- Added EnhancementState discriminated union type for UI status tracking
- Added getDefaultEnhancementOptions helper with preserveMode: true and generateAnswerKey: true
- Both providers support AbortSignal for mid-request cancellation (ENHANCE-05)

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement enhanceDocument in Gemini provider** - `d4fe002` (feat)
2. **Task 2: Implement enhanceDocument in Claude provider** - `2ba3ef2` (feat)
3. **Task 3: Create enhancement orchestration service** - `23ebb39` (feat)

## Files Created/Modified

- `services/providers/geminiProvider.ts` - Added ENHANCEMENT_RESULT_SCHEMA, implemented enhanceDocument with responseSchema and abortSignal support
- `services/providers/claudeProvider.ts` - Added ENHANCEMENT_RESULT_JSON_SCHEMA with reusable sub-schemas, implemented enhanceDocument with tool_choice and fetch signal
- `services/documentEnhancement/documentEnhancementService.ts` - Created with EnhancementState type, enhanceUploadedDocument function, and getDefaultEnhancementOptions helper

## Decisions Made

1. **Gemini AbortSignal via config** - The Gemini SDK accepts `abortSignal` as part of the config object (not a separate parameter). Used `config.abortSignal: signal`.

2. **Claude AbortSignal via fetch** - Claude uses standard fetch API, so signal is passed directly to fetch options.

3. **Reusable schema builders for Claude** - Created ENHANCED_ELEMENT_SCHEMA and DIFFERENTIATED_VERSION_SCHEMA function to reduce duplication in the complex nested schema.

4. **Temperature 0.3 for Gemini** - Set temperature to 0.3 for consistent but creative enhancements (not too deterministic, not too random).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

1. **Gemini SDK signature** - Initial implementation passed signal as second argument to generateContent, but SDK expects it in config. Fixed by adding `abortSignal: signal` to config object.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Plan 03 (UI Integration)** can now:
- Import enhanceUploadedDocument and EnhancementState from documentEnhancementService
- Use getDefaultEnhancementOptions for initial UI state
- Subscribe to progress callbacks for real-time status updates
- Handle cancellation via AbortController with signal
- Process EnhancementResult with three versions and answer keys

**Dependencies satisfied:**
- [x] GeminiProvider.enhanceDocument returns EnhancementResult
- [x] ClaudeProvider.enhanceDocument returns EnhancementResult
- [x] Both accept AbortSignal for cancellation
- [x] Enhancement service provides progress callbacks
- [x] EnhancementState covers all UI states (idle, analyzing, enhancing, complete, error, cancelled)
- [x] Default options include preserveMode: true and generateAnswerKey: true

---
*Phase: 45-enhancement-with-lesson-context*
*Completed: 2026-01-30*
