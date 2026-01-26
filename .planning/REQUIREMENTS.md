# Requirements: Cue v3.4 Ask AI

**Defined:** 2026-01-26
**Core Value:** Teachers can ask AI anything during a presentation without leaving the app

## v3.4 Requirements

Requirements for the Ask AI in-presentation assistant. Teachers ask questions, get AI answers using lesson context.

### Core Input/Output

- [ ] **CHAT-01**: Teacher can type a question in a text input field in the teleprompter panel
- [ ] **CHAT-02**: AI response streams character-by-character as it generates (not chunky blocks)
- [ ] **CHAT-03**: Loading indicator shows "Thinking..." while waiting for AI response
- [ ] **CHAT-04**: Teacher can copy AI response to clipboard with one click
- [ ] **CHAT-05**: Errors display friendly messages with retry option

### Context & Intelligence

- [ ] **CTXT-01**: AI receives current slide content, title, and cumulative lesson context
- [ ] **CTXT-02**: AI response uses age-appropriate language matching the lesson's grade level
- [ ] **CTXT-03**: Quick action buttons provide preset prompts ("Get 3 facts", "Explain simply", "Answer student question")

### UX & Safety

- [ ] **UX-01**: Assistant panel is inline in teleprompter (not modal, never steals focus)
- [ ] **UX-02**: Assistant is teacher-only (not synced to student view via BroadcastChannel)
- [ ] **UX-03**: Privacy indicator shows "Not visible to students" in the panel

### Session History

- [ ] **HIST-01**: Q&A history persists during the presentation session
- [ ] **HIST-02**: Teacher can view previous questions and answers in scrollable list
- [ ] **HIST-03**: Teacher can clear session history

### Keyboard Access

- [ ] **KEY-01**: Keyboard shortcut (Cmd/Ctrl+K) focuses the chat input
- [ ] **KEY-02**: Escape key returns focus to presentation navigation
- [ ] **KEY-03**: Arrow keys always navigate slides (never captured by chat input)

## Deferred (v3.5+)

- Voice input via microphone
- Suggested queries based on slide content
- Cross-session conversation persistence
- Token/cost counter in settings

## Out of Scope

| Feature | Reason |
|---------|--------|
| Voice input | Classroom noise, complexity — defer to future |
| Auto-suggest interruptions | Breaks teaching flow; teacher controls when to ask |
| AI editing teleprompter directly | Too risky during live presentation |
| Student-visible AI | Undermines teacher authority |
| Full conversation persistence | Scope creep, session-only is sufficient |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CHAT-01 | Phase 36 | Complete |
| CHAT-02 | Phase 36 | Complete |
| CHAT-03 | Phase 36 | Complete |
| CHAT-04 | Phase 36 | Complete |
| CHAT-05 | Phase 36 | Complete |
| CTXT-01 | Phase 36 | Complete |
| CTXT-02 | Phase 36 | Complete |
| CTXT-03 | Phase 36 | Complete |
| UX-01 | Phase 36 | Complete |
| UX-02 | Phase 36 | Complete |
| UX-03 | Phase 36 | Complete |
| HIST-01 | Phase 37 | Pending |
| HIST-02 | Phase 37 | Pending |
| HIST-03 | Phase 37 | Pending |
| KEY-01 | Phase 37 | Pending |
| KEY-02 | Phase 37 | Pending |
| KEY-03 | Phase 37 | Pending |

**Coverage:**
- v3.4 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-26*
*Last updated: 2026-01-26 — Phase 36 requirements complete (11/17)*
