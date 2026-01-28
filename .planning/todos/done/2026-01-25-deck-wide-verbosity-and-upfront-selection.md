---
created: 2026-01-25T02:44
title: Deck-wide verbosity regeneration and upfront selection
area: ui
files:
  - src/components/TeleprompterPanel.tsx (verbosity selector)
  - src/components/LandingPage.tsx (initial upload flow)
---

## Problem

Two issues with current verbosity implementation (v3.1):

### Issue 1: Per-slide verbosity doesn't persist or propagate
- User selects "Detailed" on slide 3 → script regenerates for that slide
- User navigates to slide 4 → verbosity reverts to "Standard"
- User returns to slide 3 → it has also reverted to "Standard"
- **Expected behavior**: Selecting a verbosity level should apply to the ENTIRE deck, not just the current slide
- **Benefit**: AI generates with full deck context, so scripts flow progressively slide-to-slide (currently generates in isolation without knowing what comes before/after)

### Issue 2: No upfront verbosity selection
- Users must upload content, generate in Standard mode, then pay to regenerate in Detailed
- If user knows they want Detailed from the start, they waste API costs on the Standard generation
- **Expected behavior**: Verbosity selection on landing page during initial upload
- **Benefit**: One-time generation at desired verbosity level, no wasted regeneration costs

## Solution

**Part 1: Deck-wide verbosity toggle**
- When user changes verbosity level, regenerate ALL slides at that level
- AI sees full deck context for coherent narrative flow
- Persist the deck's verbosity level in save state
- Consider: confirmation dialog before full regeneration (cost/time warning)

**Part 2: Upfront verbosity selection**
- Add verbosity selector to landing page upload flow
- Options: Concise / Standard (default) / Detailed
- Selected level used for initial generation
- Can still be changed later (triggers full regeneration per Part 1)
