---
phase: 27-verbosity-ui-generation
plan: 01
subsystem: ai
tags: [gemini, claude, ai-provider, teleprompter, verbosity]

# Dependency graph
requires:
  - phase: 26-game-variety
    provides: AI service layer with provider abstraction
provides:
  - VerbosityLevel type ('concise' | 'standard' | 'detailed')
  - regenerateTeleprompter method on AIProviderInterface
  - Verbosity-specific teleprompter generation rules
affects: [28-verbosity-ui, ui-teleprompter]

# Tech tracking
tech-stack:
  added: []
  patterns: [verbosity-aware content generation, provider method pattern]

key-files:
  created: []
  modified:
    - services/geminiService.ts
    - services/aiProvider.ts
    - services/providers/geminiProvider.ts
    - services/providers/claudeProvider.ts

key-decisions:
  - "Verbosity levels: concise (bullet-point prompts), standard (existing), detailed (full script)"
  - "Standard verbosity uses existing TELEPROMPTER_RULES for backward compatibility"
  - "Both Gemini and Claude providers implement regeneration with verbosity-specific rules"

patterns-established:
  - "Verbosity-specific rule constants for consistent AI prompting across providers"
  - "Provider interface extension pattern for new AI capabilities"

# Metrics
duration: 3min
completed: 2026-01-24
---

# Phase 27 Plan 01: AI Service Layer Verbosity Support Summary

**AI providers can now regenerate teleprompter scripts at three verbosity levels: concise bullet prompts, standard narrative, and detailed full scripts**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-24T06:12:39Z
- **Completed:** 2026-01-24T06:16:29Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- VerbosityLevel type exported from aiProvider for UI consumption
- regenerateTeleprompter method added to AIProviderInterface
- Gemini implementation delegates to new geminiService function
- Claude implementation with verbosity-specific rules using unicode emoji pattern
- All three verbosity levels working with provider-specific prompts

## Task Commits

Each task was committed atomically:

1. **Task 1: Add verbosity rules and regeneration function to geminiService.ts** - `619942c` (feat)
2. **Task 2: Update AIProviderInterface and implement in both providers** - `6daa8c2` (feat)

## Files Created/Modified
- `services/geminiService.ts` - Added TELEPROMPTER_RULES_CONCISE, TELEPROMPTER_RULES_DETAILED, VerbosityLevel type, regenerateTeleprompter function
- `services/aiProvider.ts` - Re-exported VerbosityLevel type, added regenerateTeleprompter to interface
- `services/providers/geminiProvider.ts` - Implemented regenerateTeleprompter delegating to geminiService
- `services/providers/claudeProvider.ts` - Added concise/detailed rule constants, implemented regenerateTeleprompter with Claude API

## Decisions Made

1. **Verbosity Level Design:**
   - Concise: 2-3 comma-separated prompts per segment (bullet-point style)
   - Standard: Existing TELEPROMPTER_RULES (narrative style, unchanged)
   - Detailed: 3-5 sentence full script with transitions and interaction prompts

2. **Provider Implementation Strategy:**
   - GeminiProvider delegates to geminiService (follows existing pattern)
   - ClaudeProvider implements inline with unicode emoji replacement pattern
   - Both use verbosity-specific rule constants for consistency

3. **Backward Compatibility:**
   - Standard verbosity uses existing TELEPROMPTER_RULES exactly
   - No changes to existing teleprompter generation behavior
   - New functionality is purely additive

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**TypeScript isolatedModules error:**
- Initial re-export used `export { VerbosityLevel }`
- Fixed to `export type { VerbosityLevel }` for isolatedModules compatibility
- VerbosityLevel imports added to both provider files

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- AI service layer ready for UI integration
- VerbosityLevel type available for UI components
- Both Gemini and Claude providers support regeneration
- Next: Build UI controls for verbosity selection and regeneration trigger

---
*Phase: 27-verbosity-ui-generation*
*Completed: 2026-01-24*
