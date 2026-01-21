---
phase: 16-question-enhancement
plan: 01
subsystem: ai
tags: [gemini, claude, bloom-taxonomy, question-generation, teleprompter]

# Dependency graph
requires:
  - phase: existing-ai-service-layer
    provides: AIProviderInterface, geminiService, provider pattern
provides:
  - generateQuestionWithAnswer function with Bloom's taxonomy mapping
  - QuestionWithAnswer interface with bolded key points
  - Five difficulty levels (A-E) mapped to cognitive depth
affects: [17-targeting-mode, teleprompter-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [structured-json-output, bloom-taxonomy-mapping]

key-files:
  created: []
  modified:
    - services/geminiService.ts
    - services/aiProvider.ts
    - services/providers/geminiProvider.ts
    - services/providers/claudeProvider.ts

key-decisions:
  - "Use difficulty levels A-E instead of Grade C/B/A for finer granularity"
  - "Map difficulty to Bloom's taxonomy: A=Analysis/Synthesis, B=Application, C=Understanding, D=Comprehension, E=Recall"
  - "Answer format uses **bold** markers for key points teachers should listen for"
  - "Variable answer length based on difficulty: 1-2 sentences for E/D, 2-3 sentences for C/B/A"

patterns-established:
  - "Structured JSON output with responseSchema for Gemini API"
  - "Fallback error handling returning safe default responses"
  - "Provider interface method wrapping service layer calls"

# Metrics
duration: 3min
completed: 2026-01-21
---

# Phase 16 Plan 01: Question Enhancement Summary

**AI service generates questions with expected answers using Bloom's taxonomy mapping and bolded key points for teleprompter guidance**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-21T21:03:07Z
- **Completed:** 2026-01-21T21:05:40Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added `QuestionWithAnswer` interface with question and markdown-formatted answer fields
- Implemented `generateQuestionWithAnswer` in geminiService with structured JSON output
- Extended AIProviderInterface with new method signature
- Implemented method in both GeminiProvider and ClaudeProvider with equivalent functionality
- Mapped five difficulty levels (A-E) to Bloom's taxonomy cognitive levels

## Task Commits

Each task was committed atomically:

1. **Task 1: Create generateQuestionWithAnswer in geminiService.ts** - `0f9ee8d` (feat)
2. **Task 2: Update AIProviderInterface and implement in both providers** - `3b95ac9` (feat)

## Files Created/Modified
- `services/geminiService.ts` - Added QuestionWithAnswer interface and generateQuestionWithAnswer function with Bloom's taxonomy mapping
- `services/aiProvider.ts` - Added generateQuestionWithAnswer method to AIProviderInterface
- `services/providers/geminiProvider.ts` - Implemented generateQuestionWithAnswer wrapping geminiService call
- `services/providers/claudeProvider.ts` - Implemented generateQuestionWithAnswer with Claude API equivalent

## Decisions Made

**Difficulty level granularity:** Used A-E scale instead of "Grade C/B/A" to provide five distinct cognitive levels rather than three. This enables finer-grained targeting in Phase 17.

**Bloom's taxonomy mapping:**
- Grade E (Recall): "What is...", "Name the..." - Pure factual recall
- Grade D (Comprehension): "Give an example of..." - Basic understanding
- Grade C (Understanding): "Describe in your own words" - Deeper understanding
- Grade B (Application): "How would you use..." - Apply concepts
- Grade A (Analysis/Synthesis): "Why does X affect Y?" - Critical thinking

**Answer format:** Sample answer with **bold** markers around 2-4 key terms. Teachers use these to recognize correct student responses during oral questioning.

**Variable answer length:** E/D get 1-2 sentences (simple recall), C/B/A get 2-3 sentences (require deeper reasoning).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation straightforward with existing patterns.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for Phase 16 Plan 02 (UI Integration). The AI service layer now supports:
- Generating questions with expected answers
- Five difficulty levels mapped to cognitive depth
- Bolded key points for teleprompter display

Next plan can integrate this into the teleprompter UI to show teachers what to listen for in student responses.

---
*Phase: 16-question-enhancement*
*Completed: 2026-01-21*
