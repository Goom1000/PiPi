---
phase: 09-ai-adaptation-logic
plan: 01
subsystem: ai-generation
tags: [claude, prompts, generation-modes, backward-compatible]

dependency_graph:
  requires:
    - 08-01 (dual upload zones with upload mode derivation)
  provides:
    - GenerationMode type (fresh/refine/blend)
    - GenerationInput interface for structured AI input
    - Mode-specific system prompts in ClaudeProvider
  affects:
    - 09-02 (will connect upload mode to provider)

tech_stack:
  added: []
  patterns:
    - Discriminated input normalization (string | object)
    - Shared prompt constants (TELEPROMPTER_RULES, JSON_OUTPUT_FORMAT)
    - Mode-specific prompt selection via switch statement

key_files:
  created: []
  modified:
    - services/aiProvider.ts
    - services/providers/claudeProvider.ts

decisions:
  - decision: Backward compatible signature (string | GenerationInput)
    rationale: Existing callers work without changes
    alternatives: [Breaking change requiring all callers update]

metrics:
  duration: ~2 min
  completed: 2026-01-19
---

# Phase 9 Plan 1: AI Adaptation Logic - Types and Prompts Summary

Mode-specific slide generation types and ClaudeProvider prompts for fresh/refine/blend modes with backward compatibility.

## What Was Built

### Task 1: GenerationMode Types and Interface Update
- Added `GenerationMode` type: `'fresh' | 'refine' | 'blend'`
- Added `GenerationInput` interface with lessonText, lessonImages, presentationText, presentationImages, and mode
- Updated `AIProviderInterface.generateLessonSlides` to accept either:
  - Old signature: `(string, string[])` for backward compatibility
  - New signature: `(GenerationInput)` for structured input

### Task 2: Mode-Specific Generation in ClaudeProvider
- Extracted `TELEPROMPTER_RULES` as shared constant (used in all modes)
- Extracted `JSON_OUTPUT_FORMAT` as shared constant
- Created `getSystemPromptForMode(mode)` function with three distinct prompts:
  - **Fresh**: Transform lesson plan, preserve pedagogical structure (Hook/I Do/We Do/You Do), include Success Criteria and Differentiation slides
  - **Refine**: Extract and rebuild from presentation, AI decides slide count, may reorder, note visuals with `[Visual: description]`
  - **Blend**: Analyze both sources, determine overlap, add missing topics, flag conflicts with `[Note: Sources differ on...]`
- Updated `generateLessonSlides` to normalize input and build content parts based on mode:
  - Fresh: lesson text + lesson images (up to 10)
  - Refine: presentation text + presentation images (up to 10)
  - Blend: both texts + both image sets (5 each, total 10 max)

## Key Implementation Details

### Backward Compatibility
```typescript
async generateLessonSlides(
  inputOrText: GenerationInput | string,
  pageImages?: string[]
): Promise<Slide[]> {
  // Normalize to GenerationInput
  const input: GenerationInput = typeof inputOrText === 'string'
    ? { lessonText: inputOrText, lessonImages: pageImages, mode: 'fresh' }
    : inputOrText;
  // ... rest uses input.mode
}
```

### Prompt Structure
All mode prompts include:
1. Role and goal (mode-specific)
2. Mode-specific rules (what to extract, how to handle content)
3. `TELEPROMPTER_RULES` constant (Progressive Disclosure system)
4. `JSON_OUTPUT_FORMAT` constant (slide schema)

### Token Limit Protection
Blend mode limits images to 5 per source (10 total) to stay within API token limits.

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Use input normalization pattern | Cleaner than function overloading, maintains single code path |
| Share prompt constants | DRY principle, ensures consistent teleprompter format across modes |
| Limit blend images to 5+5 | Token safety margin while preserving visual context from both sources |

## Commits

| Hash | Description |
|------|-------------|
| 764e7a4 | feat(09-01): add GenerationMode types and update interface |
| 8e44fd4 | feat(09-01): implement mode-specific generation in ClaudeProvider |

## Next Phase Readiness

### Blockers
None - types and prompts ready for integration.

### Ready For
- Plan 09-02: Connect App.tsx upload mode to ClaudeProvider via GenerationInput
- GeminiProvider can be updated separately (currently works via backward compatibility)

---

*Plan: 09-01*
*Completed: 2026-01-19*
