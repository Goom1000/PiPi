# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-29)

**Core value:** Students see only the presentation; teachers see the teleprompter script
**Current focus:** v3.7 AI Resource Enhancement — Phase 47 COMPLETE

## Current Position

Phase: 47 of 47 (Export and Persistence)
Plan: 2 of 2 complete
Status: COMPLETE
Last activity: 2026-01-31 — Completed 47-02-PLAN.md (Save/load persistence)

Progress: [██████████] 100%
Pending todos: 9

## Performance Metrics

**Velocity:**
- Milestones shipped: 17 (v1.0 through v3.5)
- Total phases completed: 47
- Total plans completed: 137
- Total LOC: ~22,600 TypeScript

**v3.6 Tooltips & Onboarding (deferred):**
- Phase 41 complete (tour infrastructure)
- Phases 42-44 deferred to future milestone
- Infrastructure preserved for later completion

**Recent Milestones:**
- v3.7: 6 phases, 14 plans (2026-01-31) - AI Resource Enhancement
- v3.5: 3 phases, 4 plans, 1 day (2026-01-27)
- v3.4: 2 phases, 5 plans, 8 days (2026-01-26)
- v3.3: 3 phases, 3 plans, 1 day (2026-01-26)
- v3.2: 4 phases, 4 plans, 1 day (2026-01-25)

## v3.7 Roadmap Summary

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 42 | Student-friendly slide language | SLIDE-01, SLIDE-02, SLIDE-03 | COMPLETE |
| 43 | Resource file upload | UPLOAD-01 to UPLOAD-05 | COMPLETE |
| 44 | AI document analysis | (foundation) | COMPLETE |
| 45 | Enhancement with lesson context | ENHANCE-01 to ENHANCE-06 | COMPLETE |
| 46 | Preview, edit, and trust UI | PREVIEW-01 to PREVIEW-04 | COMPLETE |
| 47 | Export and persistence | EXPORT-01 to EXPORT-03 | COMPLETE |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

Recent decisions for v3.7:
- Use multimodal AI (Gemini/Claude vision) for document analysis, not OCR
- Add mammoth.js for Word support (only new dependency)
- Preserve mode as default to prevent hallucination
- Trust UI (visual diff, edit capability) is critical for teacher adoption
- Default gradeLevel hardcoded to 'Year 6 (10-11 years old)' - UI selector deferred
- Prompt rules apply to slide content only, not speakerNotes (teleprompter remains teacher-facing)
- Rules injected after role description, before mode-specific CRITICAL rules
- Variant slides use hardcoded gradeLevel since they don't receive GenerationInput
- Use existing pdf.js CDN (already loaded) instead of npm installing pdfjs-dist
- DOCX page count estimated from character count (~3000 chars/page)
- Document processors organized in services/documentProcessors/ directory
- UploadPanel always visible in sidebar (not conditional)
- Upload errors routed through existing onError callback
- Gemini uses responseSchema for structured output, Claude uses tool_choice (DEC-44-01)
- buildSlideContextForEnhancement limits to 15 slides to avoid token overflow (DEC-45-01)
- Enhancement prompts include CRITICAL preservation rules to prevent content removal (DEC-45-01)
- Gemini AbortSignal via config.abortSignal, Claude via fetch signal (DEC-45-02)
- Progress callbacks report enhancing state at 0% and 50% (DEC-45-02)
- Analysis cached per resource.id to avoid re-analyzing (DEC-45-03)
- Use contenteditable="plaintext-only" for inline editing security (DEC-46-01)
- Store edits in Map per differentiation level for O(1) lookup (DEC-46-01)
- Lists editable as newline-separated text in edit mode (DEC-46-01)
- Use react-diff-viewer-continued with --legacy-peer-deps for React 19 (DEC-46-02)
- Diff and edit modes mutually exclusive to prevent UI confusion (DEC-46-02)
- Per-element regeneration uses same AI provider with focused prompts (DEC-46-02)
- Use jsPDF text API for vector PDF output (sharper than html2canvas) (DEC-47-01)
- A4 portrait with 25mm left margin for binding/hole-punching (DEC-47-01)
- Bundle all PDFs in single zip download for teacher convenience (DEC-47-01)
- SerializedEditState uses [number, string][] tuples for Map serialization (DEC-47-02)
- EnhancedResourceState stores full originalResource for offline restoration (DEC-47-02)
- v3->v4 migration defaults enhancedResources to empty array (DEC-47-02)

### Pending Todos

See `.planning/todos/pending/` — run `/gsd:check-todos` to review

### Blockers/Concerns

None - v3.7 milestone complete.

## Session Continuity

Last session: 2026-01-31
Stopped at: Completed 47-02-PLAN.md (Save/load persistence) - v3.7 COMPLETE
Resume file: None

**Next step:** v3.7 complete. Ready for next milestone planning.

---
*State initialized: 2026-01-18*
*Last updated: 2026-01-31 — Completed Phase 47 (Export and Persistence) - v3.7 COMPLETE*
