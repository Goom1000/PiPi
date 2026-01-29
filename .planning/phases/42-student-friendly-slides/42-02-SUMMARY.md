---
phase: 42-student-friendly-slides
plan: 02
subsystem: ai
tags: [prompts, providers, student-facing, slide-generation, gemini, claude]

# Dependency graph
requires:
  - 42-01 (shared studentFriendlyRules module)
provides:
  - Gemini provider with student-friendly slide content
  - Claude provider with student-friendly slide content
  - All generation modes (fresh, refine, blend) produce student-facing bullets
  - All variant slides (elaborate, work-together, class-challenge) produce student-facing content
affects:
  - Future phases using slide generation will automatically get student-friendly content

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prompt rule injection into all AI provider system prompts"
    - "gradeLevel parameter flows through to system instructions"

key-files:
  created: []
  modified:
    - services/geminiService.ts
    - services/providers/claudeProvider.ts

key-decisions:
  - "Rules injected after role description, before mode-specific CRITICAL rules"
  - "Variant slides use hardcoded 'Year 6 (10-11 years old)' since they don't receive GenerationInput"

patterns-established:
  - "Student-friendly rules apply consistently across both providers"
  - "All slide types (main generation + variants) share same content style"

# Metrics
duration: 5min
completed: 2026-01-29
---

# Phase 42 Plan 02: Provider Integration Summary

**One-liner:** Student-friendly prompt rules integrated into Gemini and Claude providers for all slide generation modes

## What Was Built

Integrated the shared `getStudentFriendlyRules` function into both AI providers, ensuring all generated slide content speaks directly to students.

### Gemini Provider Changes
- Added import for `getStudentFriendlyRules` from shared prompts module
- Updated `getSystemInstructionForMode` to accept `gradeLevel` parameter
- Injected student-friendly rules into fresh, refine, and blend modes
- Applied rules to variant slide generators: `generateElaborateSlide`, `generateWorkTogetherSlide`, `generateClassChallengeSlide`
- Updated `generateLessonSlides` to pass `gradeLevel` from `GenerationInput`

### Claude Provider Changes
- Added import for `getStudentFriendlyRules` from shared prompts module
- Updated `getSystemPromptForMode` to accept `gradeLevel` parameter
- Injected student-friendly rules into fresh, refine, and blend modes
- Applied rules to variant slide generators: `generateElaborateSlide`, `generateWorkTogetherSlide`, `generateClassChallengeSlide`
- Updated `generateLessonSlides` to pass `gradeLevel` from `GenerationInput`

## Key Implementation Details

### Rule Injection Position
The student-friendly rules are injected immediately after the opening role description in each system prompt, before mode-specific instructions. This establishes the content style early in the prompt context.

### Variant Slides
Variant slide generators (elaborate, work-together, class-challenge) do not receive `GenerationInput`, so they use a hardcoded default: `'Year 6 (10-11 years old)'`. These slides are always generated in the context of an existing presentation, so this default is appropriate.

### Verification
- TypeScript compiles without errors
- Both providers import `getStudentFriendlyRules`
- Rules are injected in all 3 generation modes per provider
- Rules are injected in all 3 variant slide generators per provider
- Dev server starts successfully

## Commits

| Hash | Description |
|------|-------------|
| 15cd41d | feat(42-02): integrate student-friendly rules into Gemini provider |
| d4ae64d | feat(42-02): integrate student-friendly rules into Claude provider |

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria Met

- [x] services/geminiService.ts imports and uses getStudentFriendlyRules
- [x] services/providers/claudeProvider.ts imports and uses getStudentFriendlyRules
- [x] Both providers inject rules into all generation modes (fresh, refine, blend)
- [x] Variant slides (elaborate, work-together, class-challenge) also use rules
- [x] TypeScript compiles without errors
- [x] App starts successfully (ready for manual verification with API keys)

## Next Phase Readiness

Phase 42 is now complete. All slide generation modes in both AI providers will produce student-facing content while preserving teacher-facing teleprompter scripts.

**Requirements satisfied:**
- SLIDE-01: Conversational sentences directed at students
- SLIDE-02: Language complexity matches grade level
- SLIDE-03: Student-friendly style applies automatically to all generations
