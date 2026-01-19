# Phase 11: Class Management UI - Research

**Researched:** 2026-01-20
**Domain:** React UI patterns for list management (view, edit, delete operations)
**Confidence:** HIGH

## Summary

This phase implements a modal-based class management UI that allows teachers to view, rename, edit students, and delete saved classes. The research focuses on React patterns for inline editing, toast-with-undo for deletion, search/filter lists, and nested data editing.

The existing codebase already provides strong foundations:
- Modal patterns established in `SettingsModal`, `RecoveryModal`, `ClassBankSaveModal`
- Toast system in `Toast.tsx` (needs extension for action buttons)
- Class bank hook `useClassBank.ts` with existing CRUD operations
- Consistent styling patterns with Tailwind CSS and dark mode support

**Primary recommendation:** Build a `ClassManagementModal` component using existing modal patterns, with inline rename editing (click-to-edit), expand-in-place student editing, and toast-with-undo for deletions. No external libraries needed - all patterns can be implemented with React state and existing Tailwind classes.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | Component framework | Already in use |
| Tailwind CSS | (via Vite) | Styling | Already in use - established patterns |
| TypeScript | 5.8.2 | Type safety | Already in use |

### Supporting (No Additional Dependencies Needed)
| Pattern | Purpose | When to Use |
|---------|---------|-------------|
| React useState | Local component state | Inline edit state, filter state |
| React useMemo | Memoized filtering | Filter/sort computed values |
| React useCallback | Stable callbacks | Event handlers passed to children |
| React useRef | DOM references | Auto-focus on inline edit input |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom toast with undo | react-toastify or sonner | External dependency not needed for single feature |
| Custom inline edit | react-easy-edit library | Overkill for simple text editing |
| nice-modal-react | Context-based modal state | Not needed - modal is local to dropdown access |

**Installation:** No new dependencies required.

## Architecture Patterns

### Recommended Component Structure
```
components/
  ClassManagementModal.tsx    # Main modal with list view
  ClassManagementRow.tsx      # Individual class row with inline edit
  (optional) StudentListEditor.tsx  # Nested student editing if extracted
hooks/
  useClassBank.ts             # Extend with renameClass function
  (optional) useUndoableDelete.ts  # If undo logic becomes complex
```

### Pattern 1: Inline Text Editing (Click-to-Edit)
**What:** Text displays as static label; clicking activates input mode; blur/Enter saves
**When to use:** Renaming class names directly in the list row
**Example:**
```typescript
// Pattern for inline editing
const [isEditing, setIsEditing] = useState(false);
const [editValue, setEditValue] = useState(originalValue);
const inputRef = useRef<HTMLInputElement>(null);

// Focus input when entering edit mode
useEffect(() => {
  if (isEditing) inputRef.current?.focus();
}, [isEditing]);

// Save on blur or Enter
const handleSave = () => {
  if (editValue.trim() && editValue !== originalValue) {
    onRename(editValue.trim());
  }
  setIsEditing(false);
};

return isEditing ? (
  <input
    ref={inputRef}
    value={editValue}
    onChange={(e) => setEditValue(e.target.value)}
    onBlur={handleSave}
    onKeyDown={(e) => {
      if (e.key === 'Enter') handleSave();
      if (e.key === 'Escape') { setEditValue(originalValue); setIsEditing(false); }
    }}
    className="..."
  />
) : (
  <span onClick={() => setIsEditing(true)} className="cursor-pointer hover:...">
    {originalValue}
  </span>
);
```

### Pattern 2: Toast with Undo Action
**What:** Delete shows toast with undo button; actual deletion delayed until toast expires
**When to use:** Reversible destructive actions (delete class)
**Example:**
```typescript
// Extended toast type for actions
interface ToastWithAction {
  id: string;
  message: string;
  duration: number;
  variant?: ToastVariant;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Usage in delete flow
const handleDelete = (classId: string) => {
  if (!window.confirm('Delete this class?')) return;

  // Store for potential undo
  const deletedClass = classes.find(c => c.id === classId);

  // Optimistically remove from UI
  deleteClass(classId);

  // Show toast with undo
  addToastWithAction(
    'Class deleted',
    5000,
    'info',
    {
      label: 'Undo',
      onClick: () => {
        // Restore the class
        restoreClass(deletedClass);
      }
    }
  );
};
```

### Pattern 3: Search/Filter List
**What:** Input at top filters list as user types
**When to use:** Finding classes in long lists
**Example:**
```typescript
const [searchQuery, setSearchQuery] = useState('');

const filteredClasses = useMemo(() => {
  if (!searchQuery.trim()) return classes;
  const query = searchQuery.toLowerCase();
  return classes.filter(c => c.name.toLowerCase().includes(query));
}, [classes, searchQuery]);

// Alphabetical sort per CONTEXT.md decision
const sortedClasses = useMemo(() => {
  return [...filteredClasses].sort((a, b) => a.name.localeCompare(b.name));
}, [filteredClasses]);
```

### Pattern 4: Expand-in-Place for Nested Editing
**What:** Clicking "Edit Students" expands the row to show student list inline
**When to use:** Editing students within a class without opening another modal
**Example:**
```typescript
const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

// In row component
const isExpanded = expandedClassId === classData.id;

return (
  <div className="...">
    {/* Row content */}
    <div className="flex items-center justify-between">
      <span>{classData.name}</span>
      <button onClick={() => setExpandedClassId(isExpanded ? null : classData.id)}>
        {isExpanded ? 'Close' : 'Edit Students'}
      </button>
    </div>

    {/* Expandable student editor */}
    {isExpanded && (
      <div className="mt-2 pl-4 animate-fade-in">
        {/* Student chips with add/remove */}
      </div>
    )}
  </div>
);
```

### Anti-Patterns to Avoid
- **Multiple nested modals:** Opening a modal from within a modal creates confusing UX; use expand-in-place instead
- **Mutating state directly:** Always use setClasses with new array, never push/splice
- **Missing loading states:** Even brief operations should indicate activity
- **No keyboard support:** Inline edit must support Enter (save) and Escape (cancel)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unique IDs | Custom incrementing ID | crypto.randomUUID() | Already used in codebase; globally unique |
| Duplicate name check | Manual array search | Existing getClassByName() | Already implemented in useClassBank |
| Click-outside detection | Complex event listeners | Existing pattern from ClassBankDropdown | Reuse containerRef + mousedown pattern |
| Escape key handling | Global keyboard listener | Existing pattern from ClassBankSaveModal | Consistent with other modals |

**Key insight:** The codebase already has robust patterns for modals, toasts, dropdowns, and localStorage persistence. Reuse these patterns rather than inventing new ones.

## Common Pitfalls

### Pitfall 1: Stale Closure in Undo Handler
**What goes wrong:** Undo callback captures old state, restores wrong data
**Why it happens:** Closure captures classes array at deletion time
**How to avoid:** Store deleted item in ref or pass complete item to undo function
**Warning signs:** Undo restores different class than expected, or restores to wrong position

### Pitfall 2: Sync Issues When Editing Currently-Loaded Class
**What goes wrong:** User renames class that's currently loaded in editor; activeClassName becomes stale
**Why it happens:** App.tsx tracks activeClassName by string, not by ID
**How to avoid:**
1. When renaming a class, if it matches activeClassName, update activeClassName
2. Alternatively: track by ID instead of name (would require App.tsx refactor)
**Warning signs:** Active class indicator shows old name after rename

### Pitfall 3: Deleting Currently-Loaded Class
**What goes wrong:** User deletes class that's currently loaded; stale indicator remains
**Why it happens:** App.tsx doesn't know the class was deleted from management modal
**How to avoid:**
1. Clear activeClassName if deleted class matches
2. Pass a callback from App.tsx to handle this case
**Warning signs:** Active class indicator shows deleted class name

### Pitfall 4: Race Condition in Auto-Save After Rename
**What goes wrong:** Rename triggers localStorage save before UI updates
**Why it happens:** useClassBank's useEffect saves on every state change
**How to avoid:** The existing pattern handles this correctly - just ensure state updates are atomic
**Warning signs:** Browser refresh shows old name

### Pitfall 5: Filter State Not Cleared
**What goes wrong:** User deletes last matching class; empty list shown with stale filter
**Why it happens:** Filter query remains after deletion changes result set
**How to avoid:** Show "no matching classes" message, not just empty list
**Warning signs:** User thinks all classes are deleted when they're just filtered out

## Code Examples

Verified patterns from official sources and existing codebase:

### Modal Container (from existing RecoveryModal.tsx)
```typescript
// Source: /components/RecoveryModal.tsx - existing pattern
<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
  <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
    {/* Modal content */}
  </div>
</div>
```

### Button Styles (from existing ClassBankSaveModal.tsx)
```typescript
// Primary button
<button className="w-full px-5 py-3 bg-indigo-600 dark:bg-amber-500 hover:bg-indigo-700 dark:hover:bg-amber-400 text-white dark:text-slate-900 rounded-xl font-bold text-sm transition-colors">
  Action
</button>

// Secondary/cancel button
<button className="w-full px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm transition-colors">
  Cancel
</button>
```

### Search Input (following existing input patterns)
```typescript
<input
  type="text"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Search classes..."
  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-amber-500 focus:border-transparent transition-all text-sm"
/>
```

### Escape Key Handler (from existing ClassBankSaveModal.tsx)
```typescript
// Source: /components/ClassBankSaveModal.tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [onClose]);
```

### List Item with Actions (styled for consistency)
```typescript
<div className="flex items-center justify-between py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl group">
  <div className="flex-1 min-w-0">
    <p className="text-sm font-bold text-slate-700 dark:text-white truncate">
      {classData.name}
    </p>
    <p className="text-xs text-slate-400 dark:text-slate-500">
      {classData.students.length} student{classData.students.length !== 1 ? 's' : ''}
    </p>
  </div>
  <div className="flex items-center gap-1">
    {/* Edit icon */}
    <button className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-amber-400 transition-colors">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
    {/* Delete icon */}
    <button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  </div>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Confirmation modals for delete | Toast with undo | ~2022 | Better UX - non-blocking, reversible |
| Separate edit pages/modals | Inline editing | ~2020 | Faster workflows - edit in context |
| Complex modal state managers | Local component state | React 18+ | Simpler code for single-use modals |

**Deprecated/outdated:**
- Browser `prompt()` for rename: Use inline edit or modal input instead
- Immediate deletion without undo: Provide recovery path via toast action

## Open Questions

Things that couldn't be fully resolved:

1. **Toast Action Button Implementation**
   - What we know: Need to extend Toast.tsx to support action prop
   - What's unclear: Exact positioning/styling of action button within toast
   - Recommendation: Model after existing button styles, place before auto-dismiss

2. **Student Editor UX When Editing Large Classes**
   - What we know: Current chip display works for ~20-30 students
   - What's unclear: Performance with 50+ students
   - Recommendation: Start with expand-in-place; add virtualization if needed later

## Claude's Discretion Items (from CONTEXT.md)

### Modal Close Behavior
**Recommendation:** Allow backdrop click to close (consistent with other modals in codebase). User can click outside modal to dismiss, similar to ClassBankDropdown's click-outside pattern.

### Student List Editing UX
**Recommendation:** Expand-in-place rather than nested modal. Reasons:
1. Avoids modal-within-modal complexity
2. User can see class context while editing students
3. Simpler implementation using existing expand/collapse pattern

### Sync Behavior When Editing Currently-Loaded Class
**Recommendation:** When renaming a class:
1. Check if renamed class matches activeClassName
2. If yes, update activeClassName to new name
3. Requires callback prop from App.tsx to ClassManagementModal

### What Happens When Deleting Currently-Loaded Class
**Recommendation:**
1. Clear activeClassName when deleted class matches
2. Don't clear studentNames (keep current editing state)
3. Show toast: "Deleted [class name]" with undo option

## Sources

### Primary (HIGH confidence)
- Existing codebase: `/components/ClassBankSaveModal.tsx`, `/components/ClassBankDropdown.tsx`, `/components/Toast.tsx`, `/components/RecoveryModal.tsx`, `/components/SettingsModal.tsx`
- Existing hook: `/hooks/useClassBank.ts`

### Secondary (MEDIUM confidence)
- [How to build an inline edit component in React](https://www.emgoto.com/react-inline-edit/) - Pattern verification
- [React-Toastify: Add undo action to toast](https://fkhadra.github.io/react-toastify/add-an-undo-action-to-a-toast/) - Undo toast pattern
- [How to create a Filter/Search List in React](https://www.kindacode.com/article/how-to-create-a-filter-search-list-in-react) - Filter pattern

### Tertiary (LOW confidence)
- General React best practices for list management from web search

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - using only existing dependencies
- Architecture: HIGH - following established codebase patterns
- UI Patterns: HIGH - inline edit, toast, filter are well-documented
- Edge cases (sync, undo): MEDIUM - requires careful implementation

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (stable patterns, no external dependencies)
