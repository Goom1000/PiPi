# Phase 10: Class Bank Core - Research

**Researched:** 2026-01-20
**Domain:** localStorage persistence, React UI patterns (modals, dropdowns)
**Confidence:** HIGH

## Summary

This phase implements a "Class Bank" feature where teachers can save and load named student lists that persist across browser sessions and are available to any presentation. The technical domain is well-understood: localStorage persistence (same pattern as existing `useSettings` and `useAutoSave` hooks) combined with modal/dropdown UI patterns already established in the codebase.

The project already has excellent localStorage patterns to follow (`useSettings.ts`, `useAutoSave.ts`) and established modal patterns (`RecoveryModal.tsx`, `SettingsModal.tsx`). The main challenge is UI placement and interaction flow, not technology. No new dependencies are needed.

**Primary recommendation:** Create a `useClassBank` hook following the exact patterns of `useSettings.ts`, with a Save modal similar to the existing filename prompt modal and a Load dropdown using the same styling patterns as the app's existing UI components.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React useState/useEffect | 18.x | State management & effects | Already in use, sufficient for this feature |
| localStorage | browser API | Data persistence | Project-established pattern (useSettings, useAutoSave) |
| Tailwind CSS | 3.x | Styling | Project standard, no additional CSS needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| crypto.randomUUID() | browser API | Unique IDs | Already used in Toast.tsx for unique keys |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| localStorage | IndexedDB | Overkill for simple key-value data; localStorage is sufficient for student lists |
| Custom dropdown | Headless UI | Adds dependency; existing patterns work fine for this simple use case |
| External modal library | Radix UI | Adds dependency; inline modal pattern already established in App.tsx |

**Installation:**
```bash
# No new dependencies needed - all patterns already in codebase
```

## Architecture Patterns

### Recommended Project Structure
```
hooks/
  useClassBank.ts       # NEW: localStorage hook for class bank
components/
  ClassBankSaveModal.tsx  # NEW: Modal for naming and saving classes
  ClassBankDropdown.tsx   # NEW: Dropdown for loading saved classes
App.tsx                   # Integrate into TOP CLASS MANAGEMENT BAR
types.ts                  # Add SavedClass interface
```

### Pattern 1: localStorage Hook Pattern
**What:** Custom hook that manages localStorage read/write with validation
**When to use:** Any feature that needs cross-session persistence
**Example:**
```typescript
// Source: Existing useSettings.ts pattern (lines 58-83)
export function useClassBank(): [
  SavedClass[],
  (name: string, students: string[]) => void,
  (classId: string) => void,
  () => void
] {
  const [classes, setClasses] = useState<SavedClass[]>(readClassesFromStorage);

  // Persist on change
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
    } catch (e) {
      console.warn('Failed to save classes to localStorage:', e);
    }
  }, [classes]);

  const saveClass = useCallback((name: string, students: string[]) => {
    // Implementation
  }, []);

  const loadClass = useCallback((classId: string) => {
    // Implementation
  }, []);

  const refreshClasses = useCallback(() => {
    setClasses(readClassesFromStorage());
  }, []);

  return [classes, saveClass, loadClass, refreshClasses];
}
```

### Pattern 2: Inline Modal Pattern
**What:** Modal rendered conditionally within component, not in separate file
**When to use:** Simple, single-purpose modals like confirmations or name prompts
**Example:**
```typescript
// Source: Existing filename prompt modal pattern (App.tsx lines 1115-1155)
{showSaveClassModal && (
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
      {/* Modal content */}
    </div>
  </div>
)}
```

### Pattern 3: Dropdown Menu Pattern
**What:** Click-to-open menu positioned relative to trigger button
**When to use:** Selection lists, load menus, action menus
**Example:**
```typescript
// Custom dropdown using existing Tailwind patterns
const [isOpen, setIsOpen] = useState(false);
const dropdownRef = useRef<HTMLDivElement>(null);

// Close on outside click
useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };
  if (isOpen) document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [isOpen]);
```

### Anti-Patterns to Avoid
- **Separate Save/Load hooks:** Keep class bank operations in a single hook for consistency
- **Complex state management:** No need for context or Redux; local state + localStorage is sufficient
- **Inline styles:** Use existing Tailwind class patterns from SettingsModal, RecoveryModal
- **External libraries for simple dropdowns:** The existing codebase handles this without dependencies

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unique IDs | Custom ID generator | `crypto.randomUUID()` | Already used in Toast.tsx, browser-native |
| Modal backdrop | Custom click handler | Existing modal pattern | Already handles escape, backdrop clicks |
| localStorage validation | Ad-hoc checks | Type guard function | Pattern from useSettings.ts, useAutoSave.ts |
| Toast notifications | Custom notifications | Existing useToast hook | Already integrated with ToastContainer |
| Confirmation dialogs | Custom modal | window.confirm() | Simple and sufficient for "replace class?" prompt |

**Key insight:** The codebase has established patterns for every component needed. Copy patterns from useSettings.ts, RecoveryModal.tsx, and the filename prompt modal in App.tsx.

## Common Pitfalls

### Pitfall 1: Not Handling Empty/Whitespace Class Names
**What goes wrong:** User enters "   " (spaces only) and it gets saved
**Why it happens:** String validation only checks for empty string, not whitespace
**How to avoid:** Use `name.trim()` before validation and storage
**Warning signs:** Classes with blank-looking names in the dropdown

### Pitfall 2: Forgetting to Handle localStorage Quota
**What goes wrong:** Error thrown when localStorage is full (5MB limit)
**Why it happens:** Large class lists or many classes accumulated
**How to avoid:** Wrap setItem in try/catch, warn user on failure
**Warning signs:** `QuotaExceededError` in console

### Pitfall 3: Race Condition on Save After Modal Close
**What goes wrong:** Settings saved to hook state but modal unmounts before useEffect persists
**Why it happens:** React useEffect runs after render, modal may unmount first
**How to avoid:** Write directly to localStorage before calling onClose (see SettingsModal.tsx line 139-143)
**Warning signs:** Saved class disappears on reload

### Pitfall 4: Dropdown Staying Open After Selection
**What goes wrong:** User clicks a class to load, dropdown stays visible
**Why it happens:** Only item click handler runs, setIsOpen not called
**How to avoid:** Call `setIsOpen(false)` in the same handler as the load action
**Warning signs:** User has to click outside to dismiss dropdown

### Pitfall 5: Not Disabling Load Button When No Classes Exist
**What goes wrong:** User clicks Load and sees empty dropdown
**Why it happens:** Button enabled regardless of classes.length
**How to avoid:** Disable button and add tooltip when `classes.length === 0`
**Warning signs:** Confusing UX with empty dropdown

## Code Examples

Verified patterns from existing codebase:

### localStorage Read with Validation
```typescript
// Source: hooks/useSettings.ts lines 28-46
function isValidSavedClass(data: unknown): data is SavedClass {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.id !== 'string') return false;
  if (typeof obj.name !== 'string') return false;
  if (!Array.isArray(obj.students)) return false;
  if (typeof obj.savedAt !== 'string') return false;
  return true;
}

function readClassesFromStorage(): SavedClass[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.every(isValidSavedClass)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse class bank from localStorage:', e);
  }
  return [];
}
```

### Modal Component Structure
```typescript
// Source: components/RecoveryModal.tsx lines 66-135
<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
  <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
    {/* Header */}
    <div className="p-6 pb-0">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white font-fredoka">
        Save Class
      </h2>
    </div>
    {/* Content */}
    <div className="p-6">
      {/* Form inputs */}
    </div>
    {/* Actions */}
    <div className="p-6 pt-0 flex flex-col gap-3">
      {/* Buttons */}
    </div>
  </div>
</div>
```

### Toast Notification
```typescript
// Source: App.tsx usage pattern
const { toasts, addToast, removeToast } = useToast();

// On save success
addToast('Class saved!', 3000, 'success');

// On load success
addToast(`Loaded ${className}`, 3000, 'success');
```

### Button with Disabled State and Tooltip
```typescript
// Source: App.tsx pattern for disabled buttons
<button
  onClick={handleLoadClick}
  disabled={classes.length === 0}
  title={classes.length === 0 ? 'No saved classes' : undefined}
  className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
>
  Load
</button>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom localStorage handling | Custom hook pattern | Project standard | Consistent, testable, reusable |
| Alert/prompt dialogs | Custom modal components | Project standard | Better UX, dark mode support |
| External dropdown libraries | Native React + Tailwind | Project standard | Zero dependencies, full control |

**Deprecated/outdated:**
- Using `window.alert()` or `window.prompt()` for confirmations - use modals instead (per project patterns)
- Storing complex nested data in localStorage - keep data flat and simple

## Open Questions

Things that couldn't be fully resolved:

1. **Exact placement of Save/Load buttons**
   - What we know: They go "next to student list input area" per CONTEXT.md
   - What's unclear: Before or after the input? Separate buttons or a single dropdown?
   - Recommendation: Place as grouped buttons after the "Add Student" button, following the existing `h-8 w-px bg-slate-100` divider pattern

2. **Active class indicator location**
   - What we know: Shows near student list after loading
   - What's unclear: As a badge? As text? With dismiss button?
   - Recommendation: Use a subtle pill badge similar to existing student name chips, positioned after the Students: label

## Sources

### Primary (HIGH confidence)
- `/Users/ricky/Documents/App_Projects/Education Apps/DEV - PiPi/hooks/useSettings.ts` - localStorage hook pattern
- `/Users/ricky/Documents/App_Projects/Education Apps/DEV - PiPi/hooks/useAutoSave.ts` - localStorage persistence with validation
- `/Users/ricky/Documents/App_Projects/Education Apps/DEV - PiPi/components/RecoveryModal.tsx` - Modal component pattern
- `/Users/ricky/Documents/App_Projects/Education Apps/DEV - PiPi/components/SettingsModal.tsx` - Complex modal with form inputs
- `/Users/ricky/Documents/App_Projects/Education Apps/DEV - PiPi/App.tsx` - Inline modal pattern (filename prompt), student bar UI
- `/Users/ricky/Documents/App_Projects/Education Apps/DEV - PiPi/components/Toast.tsx` - Toast notification system

### Secondary (MEDIUM confidence)
- [MDN Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) - localStorage ~5MB limit, QuotaExceededError handling
- [usehooks-ts useLocalStorage](https://usehooks-ts.com/react-hook/use-local-storage) - Custom hook patterns (verified against codebase patterns)

### Tertiary (LOW confidence)
- None - all patterns verified from existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries needed, existing patterns sufficient
- Architecture: HIGH - Direct patterns from useSettings.ts, RecoveryModal.tsx
- Pitfalls: HIGH - Based on existing codebase patterns and standard localStorage caveats

**Research date:** 2026-01-20
**Valid until:** 60 days (localStorage API is stable, codebase patterns established)

---

## Implementation Notes for Planner

### Data Structure
```typescript
interface SavedClass {
  id: string;           // crypto.randomUUID()
  name: string;         // User-provided name (trimmed)
  students: string[];   // Array of student names
  savedAt: string;      // ISO 8601 timestamp
}
```

### localStorage Key
```typescript
const CLASS_BANK_KEY = 'pipi-class-bank';
```

### UI Location (App.tsx line ~927)
The TOP CLASS MANAGEMENT BAR currently contains:
1. "Students:" label
2. Name input + Add button
3. Divider
4. Student name chips

Save/Load buttons should be added after the divider, before or alongside the student chips area.

### Confirmation Flow
Per CONTEXT.md:
- Duplicate name: `window.confirm("A class with this name exists. Replace it?")`
- Unsaved students exist: `window.confirm("You have students not saved. Load anyway?")`

Using `window.confirm()` is acceptable here as it's simple and the project doesn't require custom confirmation modals.
