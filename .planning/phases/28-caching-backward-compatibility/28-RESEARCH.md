# Phase 28: Caching & Backward Compatibility - Research

**Researched:** 2026-01-24
**Domain:** State persistence, file format versioning, slide-level caching
**Confidence:** HIGH

## Summary

Phase 28 adds per-slide caching of verbosity scripts so teachers can switch between Concise, Standard, and Detailed levels instantly without re-generating. This research documents the existing state management patterns, file format versioning system, and provides specific patterns for implementing the cache.

The implementation is straightforward because:
1. The project already has a `CURRENT_FILE_VERSION` and `migrateFile` pattern ready for schema changes
2. TypeScript optional properties with `?` are used consistently for backward compatibility (e.g., `studentGrades?: StudentWithGrade[]`)
3. Phase 27 already stores `regeneratedScript` in state - Phase 28 extends this to per-slide persistence
4. The `Slide` interface is the natural location for caching (each slide owns its verbosity cache)

**Primary recommendation:** Add optional `verbosityCache?: { concise?: string; detailed?: string }` to the Slide interface. Standard is already stored in `speakerNotes`, so only cache concise and detailed. Increment `CURRENT_FILE_VERSION` to 2 with a no-op migration (optional fields default to undefined).

## Existing Architecture Analysis

### Current Slide Interface

**File:** `/types.ts`
**Lines:** 3-15

```typescript
export interface Slide {
  id: string;
  title: string;
  content: string[]; // Bullet points
  speakerNotes: string;  // <-- Standard verbosity lives here
  imagePrompt: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
  layout?: 'split' | 'full-image' | 'center-text' | 'flowchart' | 'grid' | 'tile-overlap';
  theme?: 'default' | 'purple' | 'blue' | 'green' | 'warm';
  backgroundColor?: string;
  hasQuestionFlag?: boolean;
}
```

**Key insight:** Standard verbosity is already persisted in `speakerNotes`. We only need to cache `concise` and `detailed` since they are the on-demand regenerated versions.

### Current Phase 27 State Management

**File:** `/components/PresentationView.tsx`
**Lines:** 143-145

```typescript
const [verbosityLevel, setVerbosityLevel] = useState<VerbosityLevel>('standard');
const [isRegenerating, setIsRegenerating] = useState(false);
const [regeneratedScript, setRegeneratedScript] = useState<string | null>(null);
```

**Current behavior:**
- `verbosityLevel` tracks the current selection (session-only, resets on slide change)
- `regeneratedScript` holds the non-standard script (null for standard)
- On slide change, both reset to standard/null (lines 254-257)

**Phase 28 change:** Instead of resetting `regeneratedScript` to null, look up the cache for the current slide and verbosity level.

### File Format Versioning System

**File:** `/services/loadService.ts`
**Lines:** 44-58

```typescript
function migrateFile(data: CueFile): CueFile {
  const fromVersion = data.version;

  if (fromVersion < CURRENT_FILE_VERSION) {
    console.log(`Migrating file from version ${fromVersion} to ${CURRENT_FILE_VERSION}`);
    // Version 1 is current - no migration needed yet
    // Future: Add migration logic here as schema evolves
    // e.g., if (fromVersion === 1) { return migrateV1toV2(data); }
  }

  return {
    ...data,
    version: CURRENT_FILE_VERSION,
  };
}
```

**Key insight:** The migration system is designed for additive changes. Since `verbosityCache` is optional, no actual migration logic is needed - the field simply won't exist in v1 files and will be undefined.

### CueFile Content Structure

**File:** `/types.ts`
**Lines:** 232-238

```typescript
export interface CueFileContent {
  slides: Slide[];
  studentNames: string[];
  lessonText: string;
  studentGrades?: StudentWithGrade[];  // Optional for backward compatibility
}
```

**Key insight:** The slides array is already in CueFileContent. Adding `verbosityCache` to Slide automatically persists it in saved files.

### Existing Backward Compatibility Pattern

**File:** `/types.ts`
**Lines:** 253-257

```typescript
export interface SavedClass {
  id: string;
  name: string;
  students: string[];   // Array of student names (kept for backward compatibility)
  studentData?: StudentWithGrade[]; // Grade assignments (optional for migration)
  savedAt: string;
}
```

**Pattern:** Optional properties with `?` allow old files to load without errors. The app handles undefined gracefully.

## Architecture Patterns

### Recommended Cache Structure

Add to Slide interface:

```typescript
export interface Slide {
  // ... existing fields ...

  // Verbosity cache - stores regenerated scripts per level
  // Standard is always in speakerNotes, so only cache concise/detailed
  verbosityCache?: {
    concise?: string;
    detailed?: string;
  };
}
```

**Why this structure:**
- Optional top-level (`verbosityCache?`) - v1 files load without errors
- Nested optional properties - each level cached independently
- Standard excluded - already in `speakerNotes`, no duplication
- Per-slide - each slide can have different cached versions

### Cache Invalidation Strategy

When slide content changes (bullets edited, title changed), the cache should be cleared:

```typescript
const handleUpdateSlide = useCallback((id: string, updates: Partial<Slide>) => {
  setSlides(prev => prev.map(s => {
    if (s.id !== id) return s;

    // If content or title changed, invalidate verbosity cache
    const contentChanged = updates.content !== undefined || updates.title !== undefined;

    return {
      ...s,
      ...updates,
      // Clear cache if content changed
      verbosityCache: contentChanged ? undefined : s.verbosityCache,
    };
  }));
}, []);
```

**Trigger conditions for cache invalidation:**
- Slide content (bullets) modified
- Slide title modified
- Slide deleted (implicit)

**Not triggers for invalidation:**
- Image changes
- Layout/theme changes
- Verbosity selection changes

### Verbosity Selection Persistence During Navigation

**User decision:** Verbosity selection "sticks" during navigation (from CONTEXT.md)

```typescript
// Remove the current reset behavior (lines 254-257)
// useEffect(() => {
//   setVerbosityLevel('standard');  // DON'T reset verbosity
//   setRegeneratedScript(null);     // DO update displayed script from cache
// }, [currentIndex]);

// New behavior: Keep verbosityLevel, update displayed script from cache
useEffect(() => {
  const cache = currentSlide.verbosityCache;
  if (verbosityLevel === 'standard') {
    setRegeneratedScript(null);  // Use speakerNotes
  } else if (verbosityLevel === 'concise') {
    setRegeneratedScript(cache?.concise || null);  // Use cache or null (needs regen)
  } else if (verbosityLevel === 'detailed') {
    setRegeneratedScript(cache?.detailed || null);
  }
}, [currentIndex, verbosityLevel]);
```

### Recommended Cache Update Flow

When verbosity is changed and regeneration completes:

```typescript
const handleVerbosityChange = async (newLevel: VerbosityLevel) => {
  if (newLevel === verbosityLevel) return;
  setVerbosityLevel(newLevel);

  if (newLevel === 'standard') {
    setRegeneratedScript(null);
    return;
  }

  // Check cache first
  const cached = currentSlide.verbosityCache?.[newLevel];
  if (cached) {
    setRegeneratedScript(cached);
    return;  // Instant switch!
  }

  // No cache - regenerate
  setIsRegenerating(true);
  try {
    const script = await provider.regenerateTeleprompter(currentSlide, newLevel);
    setRegeneratedScript(script);

    // Update slide cache (triggers auto-save)
    handleUpdateSlide(currentSlide.id, {
      verbosityCache: {
        ...currentSlide.verbosityCache,
        [newLevel]: script,
      }
    });
  } finally {
    setIsRegenerating(false);
  }
};
```

### Default for Existing Presentations

**User decision:** Always start at Standard when opening (from CONTEXT.md)

No special handling needed - `useState<VerbosityLevel>('standard')` already defaults to standard. Existing presentations have no `verbosityCache` (undefined), which is handled by optional chaining.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File migration | Complex version handlers | Optional properties with `?` | TypeScript handles undefined gracefully |
| Session-only cache | localStorage or sessionStorage | Slide.verbosityCache | Already persists through existing save system |
| Cache key generation | Custom key string like `slide-${id}-${level}` | Nested object on Slide | Type-safe, co-located with slide data |
| State synchronization | Custom context/reducer | Existing handleUpdateSlide | Already used for all slide updates |

**Key insight:** The existing architecture (Slide interface + handleUpdateSlide + auto-save) already handles persistence. Phase 28 just adds a new optional field.

## Common Pitfalls

### Pitfall 1: Caching Standard Verbosity

**What goes wrong:** Storing standard scripts in cache creates duplication with speakerNotes
**Why it happens:** Treating all three levels symmetrically
**How to avoid:** Only cache concise and detailed. Standard IS speakerNotes.
**Warning signs:** `verbosityCache: { standard?: string; concise?: string; detailed?: string }`

### Pitfall 2: Resetting Verbosity on Slide Change

**What goes wrong:** Verbosity resets to standard when navigating (Phase 27 behavior)
**Why it happens:** Existing useEffect clears state on currentIndex change
**How to avoid:** Remove the verbosity reset; only update regeneratedScript from cache
**Warning signs:** User decision says "keep current verbosity selection" but it resets

### Pitfall 3: Version Bump Without Migration Logic

**What goes wrong:** Version changed to 2 but migrateFile has no v1->v2 handler
**Why it happens:** Thinking migration requires code
**How to avoid:** Optional fields need no migration. Just increment version for tracking.
**Warning signs:** None - this is actually correct for additive optional fields

### Pitfall 4: Not Invalidating Cache on Content Edit

**What goes wrong:** Editing slide bullets shows stale cached scripts
**Why it happens:** Cache not cleared when slide content changes
**How to avoid:** Clear verbosityCache when content or title updated
**Warning signs:** Cached script refers to old bullet points

### Pitfall 5: Regenerating When Cache Exists

**What goes wrong:** Switching to cached level still calls API
**Why it happens:** Not checking cache before regenerating
**How to avoid:** Check cache?.level first, only regenerate if undefined
**Warning signs:** API calls when switching back to previously-generated level

## Code Examples

### Slide Interface Extension

```typescript
// In types.ts - add to Slide interface

export interface Slide {
  id: string;
  title: string;
  content: string[];
  speakerNotes: string;  // Standard verbosity (original)
  imagePrompt: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
  layout?: 'split' | 'full-image' | 'center-text' | 'flowchart' | 'grid' | 'tile-overlap';
  theme?: 'default' | 'purple' | 'blue' | 'green' | 'warm';
  backgroundColor?: string;
  hasQuestionFlag?: boolean;

  // NEW: Verbosity cache for on-demand regenerated scripts
  // Standard is speakerNotes; only cache concise/detailed
  verbosityCache?: {
    concise?: string;
    detailed?: string;
  };
}
```

### Version Increment

```typescript
// In types.ts
export const CURRENT_FILE_VERSION = 2;  // Was 1
```

### Migration Handler (No-Op)

```typescript
// In loadService.ts migrateFile function
function migrateFile(data: CueFile): CueFile {
  const fromVersion = data.version;

  if (fromVersion < CURRENT_FILE_VERSION) {
    console.log(`Migrating file from version ${fromVersion} to ${CURRENT_FILE_VERSION}`);

    // v1 -> v2: Added verbosityCache to Slide
    // No action needed - optional field defaults to undefined
    if (fromVersion === 1) {
      // Slides without verbosityCache will have it as undefined
      // This is correct behavior - cache is populated on-demand
    }
  }

  return {
    ...data,
    version: CURRENT_FILE_VERSION,
  };
}
```

### Cache-Aware Verbosity Handler

```typescript
// In PresentationView.tsx - updated handleVerbosityChange

const handleVerbosityChange = async (newLevel: VerbosityLevel) => {
  if (newLevel === verbosityLevel) return;
  setVerbosityLevel(newLevel);

  // Standard uses speakerNotes directly
  if (newLevel === 'standard') {
    setRegeneratedScript(null);
    return;
  }

  // Check cache for instant switch
  const cached = currentSlide.verbosityCache?.[newLevel];
  if (cached) {
    setRegeneratedScript(cached);
    return;
  }

  // No cache - need to regenerate
  if (!provider || !isAIAvailable) {
    setRegeneratedScript(null);
    return;
  }

  setIsRegenerating(true);
  try {
    const script = await provider.regenerateTeleprompter(currentSlide, newLevel);
    setRegeneratedScript(script);

    // Persist to slide cache
    handleUpdateSlide(currentSlide.id, {
      verbosityCache: {
        ...currentSlide.verbosityCache,
        [newLevel]: script,
      },
    });
  } catch (error) {
    console.error('Failed to regenerate teleprompter:', error);
    setRegeneratedScript(null);
  } finally {
    setIsRegenerating(false);
  }
};
```

### Slide Navigation with Persistent Verbosity

```typescript
// In PresentationView.tsx - replace current useEffect (lines 254-257)

// OLD behavior to remove:
// useEffect(() => {
//   setVerbosityLevel('standard');
//   setRegeneratedScript(null);
// }, [currentIndex]);

// NEW behavior: Maintain verbosity, update displayed script
useEffect(() => {
  if (verbosityLevel === 'standard') {
    setRegeneratedScript(null);
  } else {
    // Use cache if available, null otherwise (will need regeneration)
    const cached = currentSlide.verbosityCache?.[verbosityLevel];
    setRegeneratedScript(cached || null);
  }
}, [currentIndex, currentSlide.verbosityCache, verbosityLevel]);
```

### Cache Invalidation in handleUpdateSlide

```typescript
// In App.tsx - modify handleUpdateSlide

const handleUpdateSlide = useCallback((id: string, updates: Partial<Slide>) => {
  setSlides(prev => prev.map(s => {
    if (s.id !== id) return s;

    // Detect if content changed (invalidates verbosity cache)
    const contentChanged = updates.content !== undefined || updates.title !== undefined;

    // Special case: if only updating verbosityCache, preserve it
    const isOnlyCacheUpdate = Object.keys(updates).length === 1 && updates.verbosityCache !== undefined;

    return {
      ...s,
      ...updates,
      // Clear cache if content changed, unless this IS a cache update
      verbosityCache: contentChanged && !isOnlyCacheUpdate ? undefined : (updates.verbosityCache ?? s.verbosityCache),
    };
  }));
}, []);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Session-only verbosity state | Per-slide persistent cache | Phase 28 | Instant switching, survives refresh |
| Reset to standard on slide change | Maintain verbosity selection | Phase 28 | Consistent experience during teaching |
| No file version migration | Optional fields with version tracking | Existing | Backward compatible file loading |

## Integration Points

### Files to Modify

1. **`/types.ts`**
   - Add `verbosityCache?: { concise?: string; detailed?: string }` to Slide interface
   - Increment `CURRENT_FILE_VERSION` to 2

2. **`/services/loadService.ts`**
   - Add v1->v2 migration case (no-op comment for documentation)
   - No actual migration code needed

3. **`/components/PresentationView.tsx`**
   - Modify handleVerbosityChange to check cache before regenerating
   - Modify handleVerbosityChange to update slide cache after regeneration
   - Modify slide-change useEffect to maintain verbosity and update regeneratedScript from cache
   - Need access to handleUpdateSlide (passed as prop or lifted)

4. **`/App.tsx`**
   - Modify handleUpdateSlide to invalidate verbosityCache when content/title changes
   - Ensure handleUpdateSlide is passed to PresentationView

### Files NOT to Modify

- `/services/saveService.ts` - Slide serialization automatic
- `/services/geminiService.ts` - Regeneration logic unchanged
- `/services/aiProvider.ts` - Interface unchanged
- `/hooks/useAutoSave.ts` - Slides already auto-saved

## Open Questions

None - all requirements are well-defined:

1. **Cache structure:** Nested optional object on Slide (Claude's discretion)
2. **File format changes:** Increment version, optional field (Claude's discretion)
3. **Cache invalidation:** Clear on content/title change (Claude's discretion)
4. **Existing presentations:** Load normally, verbosityCache undefined (VERB-11)

## Sources

### Primary (HIGH confidence)
- `/types.ts` - Direct code analysis of Slide interface and versioning
- `/services/loadService.ts` - Direct code analysis of migration pattern
- `/services/saveService.ts` - Direct code analysis of save serialization
- `/components/PresentationView.tsx` - Direct code analysis of Phase 27 implementation
- `/App.tsx` - Direct code analysis of handleUpdateSlide and state management
- `/.planning/phases/28-caching-backward-compatibility/28-CONTEXT.md` - User decisions

### Secondary (MEDIUM confidence)
- `/.planning/phases/27-verbosity-ui-generation/27-RESEARCH.md` - Phase 27 patterns
- `/.planning/phases/27-verbosity-ui-generation/27-VERIFICATION.md` - Implementation verification
- `/.planning/phases/15-student-grades/15-*` - Prior backward compatibility patterns

### Tertiary (LOW confidence)
- [TypeScript Optional Properties Guide](https://betterstack.com/community/guides/scaling-nodejs/typescript-optional-properties/) - General patterns
- [React State Management 2026 Patterns](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns) - Caching approaches

## Metadata

**Confidence breakdown:**
- Cache structure: HIGH - Follows established Slide interface pattern
- File format versioning: HIGH - Existing migrateFile pattern documented
- State management: HIGH - Phase 27 implementation provides clear base
- Cache invalidation: HIGH - handleUpdateSlide pattern exists

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (stable codebase, additive changes only)
