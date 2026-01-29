---
phase: 45-enhancement-with-lesson-context
plan: 01
subsystem: ai-services
tags: [document-enhancement, differentiation, structured-output, answer-key, slide-alignment]

dependency-graph:
  requires:
    - phase: 44-ai-document-analysis
      provides: DocumentAnalysis type, analyzeDocument method
  provides:
    - Enhancement type definitions (EnhancementResult, DifferentiatedVersion, etc.)
    - Enhancement system prompt with preservation and differentiation rules
    - AIProviderInterface.enhanceDocument method signature
    - buildSlideContextForEnhancement helper function
  affects: [45-02-provider-implementations, 45-03-enhancement-service, 46-preview-ui]

tech-stack:
  added: []
  patterns: [preserve-first-enhancement, single-call-multi-level, abort-signal-cancellation]

key-files:
  created:
    - services/documentEnhancement/enhancementPrompts.ts
  modified:
    - types.ts
    - services/aiProvider.ts
    - services/providers/geminiProvider.ts
    - services/providers/claudeProvider.ts

key-decisions:
  - "Placeholder implementations added to providers for TypeScript compliance"
  - "buildSlideContextForEnhancement limits to 15 slides to avoid token overflow"
  - "Enhancement prompts include explicit preservation rules marked CRITICAL"

patterns-established:
  - "Preserve-first enhancement: All original content must be kept"
  - "Three-level differentiation: simple (Year 4), standard (Year 6), detailed (Year 7-8)"
  - "AbortSignal parameter on enhanceDocument for user cancellation support"

duration: ~4 minutes
completed: 2026-01-30
---

# Phase 45 Plan 01: Enhancement Types, Prompts, and Interface Summary

**Enhancement type system with SlideMatch, DifferentiatedVersion (simple/standard/detailed), and AnswerKey types plus ENHANCEMENT_SYSTEM_PROMPT with preservation rules**

## Performance

- **Duration:** ~4 minutes
- **Started:** 2026-01-29T21:17:52Z
- **Completed:** 2026-01-29T21:21:09Z
- **Tasks:** 3/3
- **Files modified:** 5

## Accomplishments

- Defined 8 enhancement-related types supporting three differentiation levels, slide matching, and answer keys
- Created comprehensive system prompt with preservation rules (marked CRITICAL) and differentiation guidelines per level
- Extended AIProviderInterface with enhanceDocument method signature including AbortSignal for cancellation
- Added buildSlideContextForEnhancement helper limiting to 15 slides to prevent token overflow

## Task Commits

Each task was committed atomically:

1. **Task 1: Add enhancement types to types.ts** - `2645161` (feat)
2. **Task 2: Create enhancement prompts** - `3199737` (feat)
3. **Task 3: Extend AIProviderInterface with enhanceDocument** - `a0dca2f` (feat)

## Files Created/Modified

- `types.ts` - Added SlideMatch, EnhancedElement, DifferentiatedVersion, AnswerKeyItem, AnswerKey, AnswerKeyResult, EnhancementResult, EnhancementOptions types
- `services/documentEnhancement/enhancementPrompts.ts` - Created with ENHANCEMENT_SYSTEM_PROMPT and buildEnhancementUserPrompt function
- `services/aiProvider.ts` - Added enhanceDocument method to AIProviderInterface, added buildSlideContextForEnhancement helper, imported new types
- `services/providers/geminiProvider.ts` - Added placeholder enhanceDocument implementation
- `services/providers/claudeProvider.ts` - Added placeholder enhanceDocument implementation

## Decisions Made

1. **Placeholder implementations for providers** - Added "not implemented" stubs to GeminiProvider and ClaudeProvider so TypeScript compiles. Full implementations come in Plan 02.

2. **15-slide limit in buildSlideContextForEnhancement** - Truncates to first 15 slides with a note if truncated. This prevents token overflow when slides are sent to AI for alignment detection.

3. **CRITICAL markers in preservation rules** - The system prompt uses CRITICAL markers for preservation rules to emphasize that AI must never remove original content.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript compilation required adding placeholder implementations to providers, which was expected per the plan note ("The actual provider implementations will be added in Plan 02").

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Plan 02 (Provider Implementations)** can now:
- Import enhancement types from types.ts
- Use ENHANCEMENT_SYSTEM_PROMPT and buildEnhancementUserPrompt from enhancementPrompts.ts
- Implement the enhanceDocument method signature in both providers
- Use buildSlideContextForEnhancement to format slides for AI calls

**Dependencies satisfied:**
- [x] EnhancementResult, EnhancementOptions, SlideMatch types defined
- [x] DifferentiatedVersion with simple/standard/detailed levels
- [x] AnswerKey types with rubric support for open-ended questions
- [x] System prompt with preservation and differentiation rules
- [x] User prompt builder accepting DocumentAnalysis and slide context
- [x] enhanceDocument signature with AbortSignal parameter

---
*Phase: 45-enhancement-with-lesson-context*
*Completed: 2026-01-30*
