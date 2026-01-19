# Phase 6: Landing Page - Research

**Researched:** 2026-01-19
**Domain:** Landing page enhancement, file loading UX, React state transitions
**Confidence:** HIGH

## Summary

This phase adds the ability to load existing `.pipi` presentations directly from the landing page (AppState.INPUT), without requiring the user to create a new presentation first. The codebase already has complete file loading infrastructure from Phase 4 (Save/Load System), so this phase is primarily a **UI integration task**.

The existing `handleLoadFile` function in `App.tsx` handles all the heavy lifting: file parsing, validation, state restoration, auto-save clearing, and toast notifications. The landing page just needs a button to trigger the file picker and should also accept drag-drop (which is already wired up at the window level).

**Primary recommendation:** Add a "Load Presentation" button next to the PDF upload area on the landing page, styled consistently with existing UI. The drag-drop already works (window-level via `useDragDrop` hook) - just ensure it's enabled in INPUT state.

## Standard Stack

The established libraries/tools for this domain:

### Core (No New Dependencies)
| Technology | Purpose | Why Standard |
|------------|---------|--------------|
| React useState/useCallback | State management | Already in use throughout App.tsx |
| Native File input | File selection | Already implemented for load (loadFileInputRef) |
| useDragDrop hook | Drag-drop handling | Already implemented in hooks/useDragDrop.ts |
| readPiPiFile service | File parsing/validation | Already implemented in services/loadService.ts |
| Toast notifications | User feedback | Already implemented in components/Toast.tsx |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | CDN | Styling | All UI components |
| Button component | N/A | Consistent button styling | Load button |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hidden file input + button | Native `<input type="file">` visible | Visible input is ugly; hidden input + styled button is established pattern |
| Window-level drop | Visible drop zone | Already decided in Phase 4: "No visible drop zone - drop anywhere" |

**Installation:**
```bash
# No new dependencies required
```

## Architecture Patterns

### Recommended Project Structure
No new files needed. All changes in:
```
App.tsx                    # Add Load button to INPUT state UI
```

### Pattern 1: Reuse Existing Load Handler
**What:** The `handleLoadFile` callback already exists and handles everything
**When to use:** Always - don't duplicate logic
**Example:**
```typescript
// EXISTING in App.tsx (lines 427-449)
const handleLoadFile = useCallback(async (file: File) => {
  // Warns about unsaved changes
  // Calls readPiPiFile(file) for parsing/validation
  // Sets slides, studentNames, lessonText, lessonTitle
  // Transitions to AppState.EDITING
  // Clears auto-save
  // Shows success/error toast
}, [hasUnsavedChanges, addToast]);
```

### Pattern 2: Trigger File Picker Programmatically
**What:** Hidden file input triggered by styled button click
**When to use:** File selection UI
**Example:**
```typescript
// EXISTING pattern in App.tsx (line 451-453)
const handleLoadClick = useCallback(() => {
  loadFileInputRef.current?.click();
}, []);

// The hidden input is already in the header (line 574-580)
<input
  type="file"
  accept=".pipi"
  onChange={handleLoadInputChange}
  style={{ display: 'none' }}
  ref={loadFileInputRef}
/>
```

### Pattern 3: Drag-Drop Already Enabled
**What:** `useDragDrop` hook is already active in INPUT state
**When to use:** Automatically - already configured
**Example:**
```typescript
// EXISTING in App.tsx (lines 468-472)
useDragDrop(
  handleLoadFile,
  !showSettings && !showResourceHub && appState !== AppState.PRESENTING && !showFilenamePrompt && !showRecoveryModal,
  (file) => addToast(`"${file.name}" is not a .pipi file...`, 5000, 'error')
);

// Note: appState === AppState.INPUT is NOT excluded, so drag-drop already works!
```

### Anti-Patterns to Avoid
- **Duplicating file load logic:** All logic already in `handleLoadFile` - just call it
- **Creating new file input element:** The `loadFileInputRef` already exists and can be reused
- **Building separate drop zone:** Window-level drop already works via `useDragDrop`
- **Checking for `.pipi` extension manually:** `useDragDrop` already filters by extension

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File loading logic | New load handler | `handleLoadFile` callback | Already handles all edge cases |
| File picker trigger | New ref + input | `loadFileInputRef` + `handleLoadClick` | Already wired up |
| Drag-drop handling | New drag handlers | `useDragDrop` hook | Already active globally |
| File validation | Extension check | `readPiPiFile` service | Has full validation + migration |
| User feedback | Alert/console | `addToast` hook | Consistent with rest of app |

**Key insight:** This phase requires ~20 lines of UI code. All infrastructure exists.

## Common Pitfalls

### Pitfall 1: Forgetting Drag-Drop Already Works
**What goes wrong:** Building a visible drop zone when window-level drop already works
**Why it happens:** Not realizing `useDragDrop` is enabled for INPUT state
**How to avoid:** Test drag-drop first - it should already work
**Warning signs:** Duplicate drop handlers in the codebase

### Pitfall 2: Not Showing Visual Hint for Drag-Drop
**What goes wrong:** Users don't know they can drag files onto the landing page
**Why it happens:** Window-level drop is invisible by design
**How to avoid:** Add subtle hint text like "or drag a .pipi file anywhere"
**Warning signs:** User confusion about loading presentations

### Pitfall 3: Inconsistent Button Styling
**What goes wrong:** Load button looks different from "Generate Slideshow" button
**Why it happens:** Not using the Button component or matching variant
**How to avoid:** Use `<Button variant="secondary">` to match existing patterns
**Warning signs:** Visual inconsistency in landing page

### Pitfall 4: Breaking the File Input Reference
**What goes wrong:** Load button works in header but not on landing page
**Why it happens:** Creating separate file input instead of reusing `loadFileInputRef`
**How to avoid:** Call `handleLoadClick()` which triggers existing ref
**Warning signs:** Two different file input elements in DOM

## Code Examples

Verified patterns from existing codebase:

### Adding Load Button to Landing Page
```typescript
// Location: App.tsx, inside the appState === AppState.INPUT block (around line 610-720)
// Place near the "Generate Slideshow" button

<div className="flex justify-center gap-4">
  <Button
    variant="secondary"
    onClick={handleLoadClick}
    className="px-8 py-4 text-lg"
  >
    Load Presentation
  </Button>
  <div className="relative">
    <Button
      onClick={handleGenerate}
      className={`px-16 py-5 text-xl rounded-2xl shadow-indigo-100 dark:shadow-none ${!provider ? 'opacity-50' : ''}`}
      isLoading={isGenerating}
      disabled={(!lessonText.trim() && pageImages.length === 0) || isGenerating}
    >
      Generate Slideshow
    </Button>
    {/* existing lock icon for disabled AI */}
  </div>
</div>
```

### Adding Drag-Drop Hint Text
```typescript
// Location: Inside the landing page card, below the textarea or near buttons
<p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-4">
  or drag a <span className="font-mono text-indigo-500 dark:text-amber-400">.pipi</span> file anywhere to open
</p>
```

### State Transition Flow (Already Implemented)
```typescript
// When handleLoadFile succeeds (from loadService.ts):
const pipiFile = await readPiPiFile(file);
setSlides(pipiFile.content.slides);
setStudentNames(pipiFile.content.studentNames || []);
setLessonText(pipiFile.content.lessonText || '');
setLessonTitle(pipiFile.title);
setAppState(AppState.EDITING);  // <-- Transition to editor
clearAutoSave();
addToast('Presentation loaded successfully!', 3000, 'success');
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| File dialog API | Hidden input + programmatic click | Always | Works across all browsers |
| Visible drop zone | Window-level drop | Phase 4 decision | Cleaner UX, no visual clutter |

**Deprecated/outdated:**
- **`window.showOpenFilePicker()`:** Not supported in Firefox/Safari - stick with hidden input pattern

## Open Questions

Things that couldn't be fully resolved:

1. **Button placement on landing page**
   - What we know: Need to add near "Generate Slideshow" button
   - What's unclear: Should it be side-by-side, above, or in a separate section?
   - Recommendation: Side-by-side with smaller styling than Generate (secondary variant)

2. **Drag-drop visual feedback**
   - What we know: Window-level drop works but provides no visual feedback
   - What's unclear: Should we add drag-over styling to landing page?
   - Recommendation: Start with hint text only; add drag-over feedback in future if users are confused

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis:
  - `App.tsx` - handleLoadFile (lines 427-449), useDragDrop usage (lines 468-472)
  - `hooks/useDragDrop.ts` - window-level drag-drop implementation
  - `services/loadService.ts` - file parsing and validation
  - `components/Button.tsx` - button variants (primary, secondary)
  - `components/Toast.tsx` - notification system

### Secondary (MEDIUM confidence)
- Phase 4 Save/Load Research (`04-RESEARCH.md`) - established patterns and decisions

### Tertiary (LOW confidence)
- N/A - all findings verified against existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, all patterns from existing code
- Architecture: HIGH - Minimal changes, reusing existing infrastructure
- Pitfalls: HIGH - Based on existing codebase patterns

**Research date:** 2026-01-19
**Valid until:** 2026-03-19 (60 days - stable patterns, internal to codebase)

---

## Implementation Checklist

For the planner's reference, the key code locations:

| Requirement | What Exists | What's Needed |
|-------------|-------------|---------------|
| LAND-01: Load button | `handleLoadClick`, `loadFileInputRef` | Add button to INPUT state UI |
| LAND-02: Drag-drop | `useDragDrop` already enabled for INPUT | Add hint text for discoverability |
| LAND-03: Transition to editor | `handleLoadFile` sets `AppState.EDITING` | Already works, no change needed |

**Estimated scope:** ~30 lines of JSX/styling changes in `App.tsx`
