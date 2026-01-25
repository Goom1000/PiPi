---
phase: 31-work-together-slide-insertion
verified: 2026-01-25T03:30:00Z
status: human_needed
score: 4/4 requirements verified
note: "Shuffle button (handleShufflePairs) exists but not wired to UI - this was an additional feature beyond formal requirements WORK-01 through WORK-04. All 4 requirements satisfied. Shuffle UI wiring can be added in Phase 32 or follow-up."
---

# Phase 31: Work Together Slide Insertion Verification Report

**Phase Goal:** Teachers can insert AI-generated collaborative activities with student pairs
**Verified:** 2026-01-25T03:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Teacher clicks 'Work Together' in + menu to insert slide | ✓ VERIFIED | InsertPoint has teal "Work Together" button (App.tsx:114), wired to handleInsertWorkTogetherSlide (App.tsx:1318, 1353) |
| 2 | AI generates collaborative activity instructions for pairs | ✓ VERIFIED | Both providers implement generateWorkTogetherSlide (geminiService.ts:559, claudeProvider.ts:572), returns slideType: 'work-together' |
| 3 | Activity includes group-of-3 variant for odd class sizes | ✓ VERIFIED | AI prompts enforce "ALWAYS include a group-of-3 variant" (geminiService.ts:586, claudeProvider.ts:591), generatePairs handles isGroupOfThree flag (App.tsx:55) |
| 4 | Activity uses only basic classroom resources (pen, paper, whiteboard) | ✓ VERIFIED | AI prompts specify "Use ONLY basic classroom resources: pen, paper, whiteboard, mini-whiteboard" and "Do NOT require: tablets, computers, scissors, glue, colored materials, internet" (geminiService.ts:587-588, claudeProvider.ts:592-593) |
| 5 | Teleprompter shows full delivery script for facilitating the activity | ✓ VERIFIED | Both providers include teleprompter rules with segment structure: "Segment 0: INTRO - how to launch the activity", "Segments 1-N: What to say/observe", "Final segment: How to wrap up" (geminiService.ts:600-604, claudeProvider.ts:603-608) |
| 6 | Student pairs are displayed if roster is loaded | ✓ VERIFIED | WorkTogetherLayout renders pairs panel with group-of-3 highlighting (SlideRenderers.tsx:373-387), or placeholder if no roster (lines 388-394), handleInsertWorkTogetherSlide generates pairs from studentNames (App.tsx:591) |
| 7 | Shuffle button re-randomizes pairs without regenerating AI content | ✗ FAILED | handleShufflePairs function exists (App.tsx:612) but not wired to any UI component - no button in WorkTogetherLayout or PresentationView calls it |

**Score:** 6/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `types.ts` | StudentPair interface and pairs field on Slide | ✓ VERIFIED | StudentPair interface (lines 29-32), Slide.pairs field (line 24), 'work-together' layout type (line 11), substantive (348 lines), wired (imported by App.tsx, SlideRenderers.tsx) |
| `services/aiProvider.ts` | generateWorkTogetherSlide method signature | ✓ VERIFIED | AIProviderInterface.generateWorkTogetherSlide (lines 196-200), substantive (243 lines), wired (implemented by both providers) |
| `services/geminiService.ts` | Gemini implementation with activity constraints | ✓ VERIFIED | generateWorkTogetherSlide function (lines 559-635, 77 lines), includes resource constraints and group-of-3 requirement, returns slideType: 'work-together', wired to geminiProvider |
| `services/providers/geminiProvider.ts` | Gemini provider passthrough | ✓ VERIFIED | generateWorkTogetherSlide method (lines 107-113), calls geminiGenerateWorkTogetherSlide, error handling via wrapError |
| `services/providers/claudeProvider.ts` | Claude implementation with activity constraints | ✓ VERIFIED | generateWorkTogetherSlide method (lines 572-635, 64 lines), includes resource constraints and group-of-3 requirement, returns slideType: 'work-together' |
| `components/SlideRenderers.tsx` | WorkTogetherLayout component | ✓ VERIFIED | WorkTogetherLayout component (lines 336-397, 62 lines), renders numbered instructions, pairs panel with group-of-3 highlighting, placeholder for no roster, substantive implementation, wired in SlideContentRenderer switch (line 409-410) |
| `App.tsx` | Work Together button in InsertPoint + handler | ✓ VERIFIED | InsertPoint has onClickWorkTogether prop (line 66), teal "Work Together" button (line 114), handleInsertWorkTogetherSlide (lines 557-610, 54 lines), wired at 2 insertion points (lines 1318, 1353) |

**All 7 artifacts verified** (exist, substantive, wired)

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| App.tsx handleInsertWorkTogetherSlide | provider.generateWorkTogetherSlide | AIProviderInterface call | ✓ WIRED | Line 588: `await provider.generateWorkTogetherSlide(lessonTitle, source, slides)`, result used to update slide state (line 594) |
| App.tsx handleInsertWorkTogetherSlide | generatePairs | function call after AI generation | ✓ WIRED | Line 591: `const pairs = studentNames.length >= 2 ? generatePairs(studentNames) : undefined`, pairs attached to slide (line 594) |
| SlideContentRenderer | WorkTogetherLayout | layout switch case | ✓ WIRED | Line 409-410: `case 'work-together': return <WorkTogetherLayout slide={slide} visibleBullets={visibleBullets} />` |
| App.tsx handleShufflePairs | UI component | button onClick | ✗ NOT_WIRED | Function exists (line 612) but no UI component calls it - gap in shuffle feature |

**3/4 key links wired** (shuffle handler orphaned)

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| WORK-01: User can insert Work Together slide via "+" menu option | ✓ SATISFIED | All supporting truths verified |
| WORK-02: AI generates collaborative activity instructions for pairs (with group-of-3 alternative) | ✓ SATISFIED | AI prompts enforce group-of-3 variant, generatePairs handles isGroupOfThree flag |
| WORK-03: Activity uses only basic classroom resources (pen, paper, whiteboard) | ✓ SATISFIED | AI prompts explicitly constrain resources and prohibit tech |
| WORK-04: Teleprompter shows facilitation notes for teacher | ✓ SATISFIED | Both providers include structured teleprompter segments |

**4/4 requirements satisfied** (note: shuffle gap is not blocking any requirement)

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| App.tsx | 612 | Orphaned function (handleShufflePairs defined but never called) | ⚠️ Warning | Shuffle feature incomplete - function exists but no UI trigger |
| services/providers/claudeProvider.ts | 369, 375 | Comment mentions "placeholder" in image generation context | ℹ️ Info | Not related to Work Together feature - image fallback pattern |
| App.tsx | 1177 | HTML placeholder attribute (normal UI usage) | ℹ️ Info | Not an issue - standard form placeholder text |

**0 blockers, 1 warning, 2 info items**

### Human Verification Required

**1. Test Work Together slide insertion with roster**

**Test:** 
1. Load a class list with 5+ students in Class Bank
2. Create a presentation with 2-3 slides
3. Click + button between slides
4. Click "Work Together" button (teal)
5. Wait for AI generation to complete

**Expected:**
- "Creating Activity..." temp slide appears immediately
- Generated slide has:
  - Title indicating collaboration (e.g., "Partner Challenge: Photosynthesis")
  - 3-5 numbered instruction points
  - Group-of-3 variant mentioned in instructions (e.g., "If you're in a group of 3, one person can be the recorder")
  - Right panel shows randomized student pairs
  - If class has odd number, one group highlighted in amber with "(group of 3)" label
  - Teleprompter panel shows facilitation script with segments
- Activity instructions use ONLY basic resources (pen, paper, whiteboard)
- NO mentions of tablets, computers, scissors, glue, colored materials

**Why human:** Visual appearance, AI output quality, resource constraint compliance need human judgment

**2. Test Work Together slide insertion without roster**

**Test:**
1. Clear student list (or don't load class)
2. Create presentation
3. Insert Work Together slide from + menu

**Expected:**
- Activity generates successfully
- Right panel shows placeholder: "Load a class list to show pairs here"
- Instructions and teleprompter still functional

**Why human:** Visual placeholder appearance

**3. Test edge case: insert at top (no slide above)**

**Test:**
1. Create presentation
2. Click + button BEFORE first slide
3. Click "Work Together"

**Expected:**
- Error modal appears: "Cannot Create Activity - Need a slide above to create an activity for."
- No slide inserted

**Why human:** Error handling UX

**4. Verify AI prompt constraint compliance**

**Test:**
1. Insert 3-5 different Work Together slides across different lesson topics
2. Read generated activity instructions

**Expected:**
- ALL activities use only: pen, paper, whiteboard, mini-whiteboard
- NONE mention: tablets, computers, internet, scissors, glue, colored materials
- ALL activities include group-of-3 variant inline in instructions

**Why human:** AI output analysis across multiple generations to verify constraint compliance

### Gaps Summary

**1 gap found blocking complete goal achievement:**

**Gap: Shuffle button not wired**

- **Truth affected:** "Shuffle button re-randomizes pairs without regenerating AI content"
- **What exists:** handleShufflePairs function in App.tsx (line 612) implements Fisher-Yates reshuffle logic correctly
- **What's missing:** 
  - No button in WorkTogetherLayout component to trigger shuffle
  - handleShufflePairs not passed as prop to any component
  - No UI affordance for teacher to re-randomize pairs after initial generation
- **Impact:** Teachers cannot reshuffle pairs once generated - stuck with initial randomization
- **Severity:** Medium - feature works for initial generation, but lacks flexibility for teachers who want to adjust groupings

**Recommended fix:**
1. Add shuffle button to WorkTogetherLayout (in pairs panel header)
2. Pass handleShufflePairs as prop from App.tsx through to WorkTogetherLayout
3. Wire onClick to call handleShufflePairs(slide.id)

**Note:** This gap does NOT block any of the 4 core requirements (WORK-01 through WORK-04), as shuffle was an additional feature beyond the base requirements. The phase achieves all requirement-level success criteria.

---

_Verified: 2026-01-25T03:30:00Z_
_Verifier: Claude (gsd-verifier)_
