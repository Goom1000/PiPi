# Phase 2: Multi-Provider AI - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

AI slide generation works with Gemini, Claude, or OpenAI based on user's configured provider. This phase implements unified request handling, provider-specific API integration, and graceful error handling. Disabling AI features when no key is configured is Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Provider Abstraction
- Gemini is the reference implementation — other providers match its behavior
- Claude has discretion on architecture (unified interface vs separate services)
- Claude has discretion on prompt strategy (shared vs per-provider)
- Claude has discretion on output normalization approach

### Error Messaging
- Generic friendly error messages — no provider-specific technical details
- Rate limit and quota errors get same treatment as other errors (generic message)
- Errors displayed in modal dialog that requires dismissal
- Claude's discretion on whether error modal includes "Open Settings" action

### Response Handling
- Claude's discretion on parsing strictness (balance reliability vs flexibility)
- Incomplete responses: warn and accept — "Generated 3 of 5 requested slides"
- Loading indicator: keep current animation/look, update wording to show provider name
- Basic validation: reject empty/garbage slides, don't accept invalid content

### Provider Switching
- Show compatibility warning when user changes provider
- One API key stored at a time — switching clears the previous key
- Validate new API key immediately when switching (not on first use)
- No confirmation dialog needed when switching — the compatibility warning suffices

### Claude's Discretion
- Overall code architecture (unified vs separate provider services)
- Prompt strategy (shared vs per-provider prompts)
- Output normalization approach
- Response parsing strictness level
- Error modal action buttons (OK only vs OK + Settings)

</decisions>

<specifics>
## Specific Ideas

- Loading screen should say "Generating slides with Gemini..." (or Claude/OpenAI)
- Current Gemini implementation is the reference — others should produce equivalent results

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-multi-provider-ai*
*Context gathered: 2026-01-19*
