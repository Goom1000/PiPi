# Research Summary: Ask AI Assistant

**Project:** Cue v3.4 — Ask AI (In-Presentation AI Assistant)
**Domain:** Live AI chat assistant for presentation/teaching tools
**Researched:** 2026-01-26
**Confidence:** HIGH

## Executive Summary

This research examines adding an "Ask AI" assistant to Cue's teleprompter panel. Teachers can ask any question during a presentation — student questions needing answers, fact lookups, quick explanations — and get AI-generated responses without leaving the app.

**Key finding:** The feature integrates cleanly with existing architecture. No new dependencies needed. Extends `AIProviderInterface` with one new method, adds ~230 lines across 5 files.

**Critical requirement:** Response streaming is mandatory. Without it, 5-15 second waits break teaching flow entirely.

## Key Findings

### Recommended Stack

**Zero new dependencies required.**

- Extend `AIProviderInterface` with `askQuestion(lessonContext, userQuery)` method
- Implement in both Claude and Gemini providers
- Render inline in teleprompter panel (not modal)
- Session-only history (not persisted to .cue files)

### Expected Features

**Table Stakes (must have):**
- Text input field with keyboard shortcut
- Streaming responses (character-by-character, 5ms/char)
- Loading/thinking indicator
- Copy to clipboard button
- Error handling with retry

**Differentiators (competitive advantage):**
- Lesson context injection — AI knows current slide, topic, grade level
- Quick action buttons — "Get 3 facts", "Explain simply", "Answer student question"
- Inline panel design — lives in teleprompter, never covers slides
- Teacher-only visibility — never synced to student view
- Verbosity control — leverage existing Concise/Standard/Detailed

**Anti-Features (do NOT build):**
- Voice input (classroom noise, complexity)
- Auto-suggest interruptions (breaks teaching flow)
- Modal dialog (steals focus, blocks content)
- AI editing teleprompter directly (too risky)
- Full conversation persistence (scope creep)

### Architecture Approach

**Integration points:**
1. `AIProviderInterface` — Add `askQuestion()` method
2. `claudeProvider.ts` — Implement with lesson context prompt
3. `geminiProvider.ts` — Implement via geminiService
4. `PresentationView.tsx` — Add state, handler, UI (~100 lines)
5. `aiProvider.ts` — Add types and `buildLessonContext()` helper

**Data flow:**
```
User types query → handleAskAI() → buildLessonContext() → provider.askQuestion() → Stream response → Display in panel
```

**State management:**
- `assistantQuery` — current input text
- `assistantResponse` — latest answer + original query
- `isAssistantLoading` — loading state
- `assistantHistory` — session-only Q&A log (optional)

### Critical Pitfalls

1. **Response latency** — Streaming mandatory. Target <500ms time-to-first-token. Use Flash-tier models.

2. **Accidental visibility** — Add "Not visible to students" indicator. Keep panel in teleprompter area only.

3. **Context quality** — Include current slide + cumulative content. Don't overload context window.

4. **Modal interruption** — NEVER use modal. Inline panel that doesn't steal focus.

5. **Keyboard conflicts** — Arrow keys always navigate slides. Chat input requires explicit focus (click or shortcut).

6. **API costs** — Use smaller models (Flash/Haiku). Cap conversation context at ~4000 tokens.

## Implications for Roadmap

### Phase 1: Core Integration (MVP)
- Add types and interface to `aiProvider.ts`
- Implement in both providers (Claude, Gemini)
- Add state and handler to `PresentationView.tsx`
- Render input UI with streaming response display
- Quick action buttons (3-4 preset prompts)
- Copy to clipboard

### Phase 2: Polish (Optional)
- Session history dropdown
- Clear history button
- Keyboard shortcut (Cmd+K)
- Style refinements

**Estimated effort:** ~230 lines, 1 phase for MVP

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new dependencies, extends existing patterns |
| Features | HIGH | Cross-verified with NN/g, Cloudscape, Khanmigo, Microsoft Copilot |
| Architecture | HIGH | Direct codebase analysis, follows existing patterns |
| Pitfalls | HIGH | Multiple authoritative sources, clear prevention strategies |

**Overall confidence:** HIGH

## Sources

### Primary (HIGH confidence)
- Cue codebase: aiProvider.ts, PresentationView.tsx, claudeProvider.ts
- NN/g: AI copilot UX patterns, modal design guidelines
- Cloudscape Design System: Generative AI loading states
- Upstash: Smooth text streaming patterns

### Secondary (MEDIUM confidence)
- Khanmigo, SchoolAI: Education AI assistant patterns
- Microsoft Copilot: Presentation AI integration
- Chroma Research: Context quality and "lost in the middle" problem

---

**Research completed:** 2026-01-26
**Ready for requirements:** Yes
**Next step:** Define requirements for v3.4 milestone
