# Phase 15: Student Grades - Research

**Researched:** 2026-01-21
**Domain:** Student data management, grade level assignment UI, localStorage schema extension
**Confidence:** HIGH

## Summary

This phase extends the existing Class Bank feature (Phases 10-11) to support grade level assignments (A/B/C/D/E) for each student. The technical domain is well-understood: extending the existing `SavedClass` interface to include grade data, migrating existing localStorage data, and adding a UI component to manage grade assignments within the existing `ClassManagementModal`.

The project already has excellent patterns for:
- Class Bank persistence in `useClassBank.ts` hook
- Class management UI in `ClassManagementModal.tsx` with inline editing
- Modal patterns throughout the codebase
- .pipi file export/import with version management

The main challenges are: (1) extending the data model without breaking existing saved classes, (2) designing an intuitive grade assignment UI, and (3) ensuring grade data is included in .pipi file exports.

**Primary recommendation:** Extend the `SavedClass` interface with optional grade data, add migration logic to handle existing classes without grades, and integrate grade assignment UI into the existing `ClassManagementModal` using inline dropdown/select elements per student.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | Component framework | Already in use |
| TypeScript | 5.8.2 | Type safety | Already in use - excellent for grade type safety |
| localStorage | browser API | Data persistence | Project-established pattern |
| Tailwind CSS | (via Vite) | Styling | Already in use - established patterns |

### Supporting (No Additional Dependencies Needed)
| Pattern | Purpose | When to Use |
|---------|---------|-------------|
| React useState | Component state | Grade selection state |
| React useMemo | Memoized filtering | Filter students by grade |
| TypeScript union types | Grade level enum | `type GradeLevel = 'A' \| 'B' \| 'C' \| 'D' \| 'E' \| null` |
| HTML `<select>` | Grade picker | Native accessibility, no library needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `<select>` | Custom dropdown library | External dependency not needed; native select is accessible |
| String grade values | Numeric grades (1-5) | A-E is clearer for teachers; matches UK/international systems |
| Separate grades table | Extend SavedClass | Adds complexity; keeping grades with students is simpler |

**Installation:** No new dependencies required - all patterns exist in codebase.

## Current State

### Existing Data Structure

**SavedClass Interface (types.ts lines 98-103):**
```typescript
export interface SavedClass {
  id: string;           // crypto.randomUUID()
  name: string;         // User-provided name (trimmed)
  students: string[];   // Array of student names
  savedAt: string;      // ISO 8601 timestamp
}
```

**Storage Location:**
- localStorage key: `'pipi-class-bank'` (defined in `hooks/useClassBank.ts` line 4)
- Storage format: JSON array of SavedClass objects
- Validation: Type guard function `isValidSavedClass()` (lines 10-21)

**Current Hook Operations:**
- `saveClass(name, students)` - Save or update a class
- `deleteClass(classId)` - Remove a class
- `renameClass(classId, newName)` - Rename a class
- `updateClassStudents(classId, students)` - Update student list
- `getClassByName(name)` - Find class by name
- `refreshClasses()` - Re-read from localStorage

### Existing Management UI

**ClassManagementModal.tsx:**
- Modal with search/filter capability
- Alphabetically sorted class list
- Inline rename (click class name to edit)
- Expand-in-place student editing with add/remove chips
- Delete with confirmation
- Active class indicator

**Integration Point:**
- Invoked from App.tsx via "Manage Classes" button
- Uses `useClassBank()` hook for CRUD operations
- Callbacks: `onRename`, `onUpdateStudents`, `onDelete`

### Export/Import System

**.pipi File Format (types.ts lines 81-95):**
```typescript
export interface PiPiFileContent {
  slides: Slide[];
  studentNames: string[];  // Current student list
  lessonText: string;
}

export interface PiPiFile {
  version: number;
  createdAt: string;
  modifiedAt: string;
  title: string;
  author?: string;
  content: PiPiFileContent;
}
```

**Key Points:**
- `studentNames` array is saved in .pipi files (line 83)
- No grade data currently saved in .pipi exports
- Version management exists (`CURRENT_FILE_VERSION = 1`)
- Migration pattern ready (`migrateFile()` in `loadService.ts`)

## Integration Points

### 1. Data Model Extension

**Required Changes:**

**types.ts** - Extend SavedClass:
```typescript
export type GradeLevel = 'A' | 'B' | 'C' | 'D' | 'E';

export interface StudentWithGrade {
  name: string;
  grade: GradeLevel | null;  // null = not assigned
}

export interface SavedClass {
  id: string;
  name: string;
  students: string[];  // DEPRECATED - keep for migration
  studentData?: StudentWithGrade[];  // NEW - optional for backward compatibility
  savedAt: string;
}
```

**Migration Strategy:**
- New `studentData` field is optional
- Old classes with `students: string[]` still valid
- On first edit, migrate to `studentData` format
- Type guard `isValidSavedClass()` accepts both formats

### 2. localStorage Hook Extension

**hooks/useClassBank.ts** - Add grade operations:

New functions needed:
```typescript
const updateStudentGrade = useCallback((
  classId: string,
  studentName: string,
  grade: GradeLevel | null
) => {
  // Update specific student's grade
}, []);

const assignGradesToClass = useCallback((
  classId: string,
  grades: Map<string, GradeLevel | null>
) => {
  // Bulk update all student grades
}, []);
```

Migration logic in `readClassesFromStorage()`:
```typescript
function readClassesFromStorage(): SavedClass[] {
  // ... existing parsing ...

  // Migrate old format to new format
  return parsed.map(cls => {
    if (!cls.studentData && cls.students) {
      return {
        ...cls,
        studentData: cls.students.map(name => ({
          name,
          grade: null
        }))
      };
    }
    return cls;
  });
}
```

### 3. UI Component Extension

**ClassManagementModal.tsx** - Add grade column:

Expanded student editor section needs:
- Grade dropdown per student chip
- Visual indicator of assigned grades
- Bulk grade assignment option (optional enhancement)
- Filter by grade level (optional enhancement)

**Recommended UI Pattern:**
```typescript
// In expanded student editor section (lines 349-400)
{classData.studentData?.map((student) => (
  <div key={student.name} className="flex items-center gap-2">
    <span className="text-xs">{student.name}</span>
    <select
      value={student.grade || ''}
      onChange={(e) => handleGradeChange(
        classData.id,
        student.name,
        e.target.value as GradeLevel
      )}
      className="text-xs px-2 py-1 rounded border..."
    >
      <option value="">-</option>
      <option value="A">A</option>
      <option value="B">B</option>
      <option value="C">C</option>
      <option value="D">D</option>
      <option value="E">E</option>
    </select>
    <button onClick={...}>Remove</button>
  </div>
))}
```

### 4. Export/Import Extension

**types.ts** - Extend PiPiFileContent:
```typescript
export interface PiPiFileContent {
  slides: Slide[];
  studentNames: string[];  // Keep for backward compatibility
  studentData?: StudentWithGrade[];  // NEW - include grades
  lessonText: string;
}
```

**App.tsx** - Update createPiPiFile calls:
```typescript
// Line 573, 586 - when creating .pipi file
const file = createPiPiFile(
  lessonTitle,
  slides,
  studentNames,
  studentDataWithGrades,  // NEW parameter
  lessonText
);
```

**services/saveService.ts** - Accept grade data:
```typescript
export function createPiPiFile(
  title: string,
  slides: Slide[],
  studentNames: string[],
  studentData: StudentWithGrade[] | undefined,  // NEW
  lessonText: string,
  existingFile?: PiPiFile
): PiPiFile {
  return {
    // ... existing fields ...
    content: {
      slides,
      studentNames,  // Keep for v1 compatibility
      studentData,   // NEW
      lessonText,
    },
  };
}
```

## Patterns to Follow

### Pattern 1: Optional Field Migration (from Phase 10 Research)

**What:** Add new optional field to interface, migrate on read
**When to use:** Extending existing localStorage data without breaking changes
**Example:**
```typescript
// Phase 10 established this pattern - use same approach
function readClassesFromStorage(): SavedClass[] {
  try {
    const stored = window.localStorage.getItem(CLASS_BANK_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.map(migrateToCurrentFormat);
      }
    }
  } catch (e) {
    console.warn('Failed to parse class bank:', e);
  }
  return [];
}

function migrateToCurrentFormat(cls: any): SavedClass {
  // Migrate students[] to studentData[]
  if (!cls.studentData && cls.students) {
    return {
      ...cls,
      studentData: cls.students.map((name: string) => ({
        name,
        grade: null
      }))
    };
  }
  return cls;
}
```

### Pattern 2: Native Select Element (Web Best Practice)

**What:** Use HTML `<select>` with TypeScript event typing
**When to use:** Grade level selection (A/B/C/D/E dropdown)
**Example:**
```typescript
// Source: React TypeScript best practices (verified 2026)
const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const newGrade = e.target.value as GradeLevel | '';
  updateStudentGrade(
    classId,
    studentName,
    newGrade === '' ? null : newGrade
  );
};

<select
  value={student.grade || ''}
  onChange={handleGradeChange}
  className="..."
>
  <option value="">Not assigned</option>
  <option value="A">A</option>
  <option value="B">B</option>
  <option value="C">C</option>
  <option value="D">D</option>
  <option value="E">E</option>
</select>
```

**Why native select:**
- Built-in keyboard accessibility (arrow keys, type-ahead)
- Screen reader support out of the box
- No external dependencies
- Works on all devices (mobile-friendly)
- Consistent with existing codebase patterns

### Pattern 3: Inline Data Display (from ClassManagementModal)

**What:** Display grade level as badge/chip next to student name
**When to use:** Showing assigned grades in student list
**Example:**
```typescript
// Based on existing student chip pattern (lines 360-374)
<div className="flex items-center gap-1.5">
  <span className="text-xs">{student.name}</span>
  {student.grade && (
    <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-medium">
      {student.grade}
    </span>
  )}
</div>
```

### Pattern 4: Type-Safe Grade Handling

**What:** Use TypeScript union type for grade levels
**When to use:** Any grade assignment or display
**Example:**
```typescript
// In types.ts
export type GradeLevel = 'A' | 'B' | 'C' | 'D' | 'E';

// Type guard for runtime validation
export function isValidGradeLevel(value: unknown): value is GradeLevel {
  return typeof value === 'string' &&
    ['A', 'B', 'C', 'D', 'E'].includes(value);
}

// Usage in validation
if (isValidGradeLevel(input)) {
  updateGrade(input);  // TypeScript knows it's GradeLevel
}
```

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Grade dropdown UI | Custom dropdown component | Native `<select>` element | Accessibility built-in, mobile-friendly, no dependencies |
| Data migration | Manual migration logic | Follow Phase 10 pattern | Already established in `readClassesFromStorage()` |
| Grade validation | String comparison | TypeScript union type + type guard | Type safety at compile time and runtime |
| Student list display | Custom list component | Extend existing chip pattern | Already styled, dark mode support |
| Grade storage format | Custom serialization | JSON with optional field | localStorage standard, backward compatible |

**Key insight:** The Class Bank infrastructure (Phases 10-11) provides all the patterns needed. This is a straightforward data model extension, not a new feature from scratch.

## Common Pitfalls

### Pitfall 1: Breaking Existing Saved Classes
**What goes wrong:** Existing classes in localStorage fail to load after adding grade field
**Why it happens:** Type guard `isValidSavedClass()` rejects classes without `studentData`
**How to avoid:** Make `studentData` optional in interface, migrate on read
**Warning signs:** Classes disappear after update, validation errors in console

### Pitfall 2: Losing Grade Data on Student Name Change
**What goes wrong:** Teacher renames student, grade assignment is lost
**Why it happens:** Grade stored by student name as key, rename breaks association
**How to avoid:** Store as `{ name, grade }` object, update both together
**Warning signs:** Grades reset to null after renaming students

### Pitfall 3: Not Including Grades in .pipi Export
**What goes wrong:** Teacher exports presentation, grades not saved in file
**Why it happens:** `createPiPiFile()` only receives `studentNames` string array
**How to avoid:** Pass full `studentData` array to `createPiPiFile()`
**Warning signs:** Grades missing when loading saved .pipi files

### Pitfall 4: Type Coercion Issues with Select Element
**What goes wrong:** Grade value becomes `string` instead of `GradeLevel`
**Why it happens:** HTML select `e.target.value` is always type `string`
**How to avoid:** Use type assertion with validation: `e.target.value as GradeLevel`
**Warning signs:** TypeScript errors, grade values not matching type

### Pitfall 5: Grade UI Cluttering Student Chips
**What goes wrong:** Adding grade dropdowns makes student chip area too crowded
**Why it happens:** Trying to fit too much UI into limited space
**How to avoid:** Use compact select styling, or show grades only in expanded view
**Warning signs:** Horizontal scrolling, text overflow, cramped layout

### Pitfall 6: Not Handling Grade Data in All Hook Operations
**What goes wrong:** `updateClassStudents()` wipes out grade data
**Why it happens:** Function only updates `students[]` array, ignores `studentData`
**How to avoid:** Update all hook operations to work with `studentData` format
**Warning signs:** Grades disappear after adding/removing students

## Code Examples

Verified patterns from existing codebase and web standards:

### Type-Safe Select onChange Handler
```typescript
// Source: React TypeScript best practices (2026)
// Event type: React.ChangeEvent<HTMLSelectElement>
const handleGradeChange = (
  classId: string,
  studentName: string,
  e: React.ChangeEvent<HTMLSelectElement>
) => {
  const value = e.target.value;
  const grade: GradeLevel | null = value === '' ? null : value as GradeLevel;

  updateStudentGrade(classId, studentName, grade);
};
```

### Migration Function for Backward Compatibility
```typescript
// Source: Existing Phase 10 pattern (useClassBank.ts)
function migrateClassToGradeFormat(cls: SavedClass): SavedClass {
  // If class already has studentData, no migration needed
  if (cls.studentData) {
    return cls;
  }

  // Migrate students[] to studentData[]
  if (cls.students) {
    return {
      ...cls,
      studentData: cls.students.map(name => ({
        name,
        grade: null
      })),
      // Keep students[] for backward compatibility during transition
      students: cls.students
    };
  }

  return cls;
}
```

### Type Guard for SavedClass with Optional studentData
```typescript
// Source: Existing isValidSavedClass pattern (useClassBank.ts lines 10-21)
function isValidSavedClass(data: unknown): data is SavedClass {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;

  if (typeof obj.id !== 'string') return false;
  if (typeof obj.name !== 'string') return false;
  if (typeof obj.savedAt !== 'string') return false;

  // Accept either old format (students[]) or new format (studentData[])
  const hasOldFormat = Array.isArray(obj.students) &&
    obj.students.every((s: unknown) => typeof s === 'string');

  const hasNewFormat = !obj.studentData || (
    Array.isArray(obj.studentData) &&
    obj.studentData.every((s: any) =>
      typeof s === 'object' &&
      typeof s.name === 'string' &&
      (s.grade === null || typeof s.grade === 'string')
    )
  );

  return hasOldFormat || hasNewFormat;
}
```

### Compact Grade Select Styling
```typescript
// Source: Tailwind CSS patterns from existing codebase
<select
  value={student.grade || ''}
  onChange={(e) => handleGradeChange(classId, student.name, e)}
  className="text-[10px] px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-amber-500"
>
  <option value="">-</option>
  <option value="A">A</option>
  <option value="B">B</option>
  <option value="C">C</option>
  <option value="D">D</option>
  <option value="E">E</option>
</select>
```

## Risks/Considerations

### Data Migration Risk: MEDIUM
**Issue:** Existing saved classes in production may have edge cases not considered
**Mitigation:**
- Make `studentData` optional in interface
- Keep `students[]` field during transition period
- Add comprehensive validation in type guard
- Test migration with real localStorage data

### UI Space Constraint: LOW
**Issue:** Grade dropdowns may clutter student chip area
**Mitigation:**
- Use compact select styling (text-[10px])
- Show grades only in expanded student editor view
- Consider showing grade as badge instead of editable dropdown in collapsed view

### Export/Import Compatibility: LOW
**Issue:** Old .pipi files won't have grade data
**Mitigation:**
- Make `studentData` optional in `PiPiFileContent`
- Migration happens automatically when loading old files
- Version number already tracks schema changes

### Performance: NEGLIGIBLE
**Issue:** Filtering/sorting by grade could be slow with many students
**Mitigation:**
- Use React.useMemo for filtered lists
- Typical class size (20-30 students) is trivial for JS
- No pagination needed

### Accessibility: LOW
**Issue:** Custom grade UI might not be keyboard-accessible
**Mitigation:**
- Use native `<select>` element (built-in accessibility)
- Ensure proper ARIA labels if needed
- Test with keyboard navigation and screen readers

## Recommendations

### Implementation Approach

1. **Phase 1: Data Model** (Minimal Breaking Changes)
   - Add `GradeLevel` type to types.ts
   - Add `StudentWithGrade` interface
   - Add optional `studentData` field to `SavedClass`
   - Keep `students[]` field for backward compatibility

2. **Phase 2: Hook Extension** (Backward Compatible)
   - Update `readClassesFromStorage()` with migration logic
   - Add `updateStudentGrade()` function
   - Update existing functions to maintain both `students[]` and `studentData[]`
   - Update type guard to accept both formats

3. **Phase 3: UI Integration** (Minimal UI Changes)
   - Add grade select to student chips in expanded view
   - Show grade badge in collapsed view (read-only)
   - Update `ClassManagementModal` to use new grade operations
   - Add grade column header if needed

4. **Phase 4: Export/Import** (Ensure Data Portability)
   - Update `PiPiFileContent` interface
   - Update `createPiPiFile()` signature
   - Update App.tsx to pass grade data
   - Test round-trip export/import with grades

### UI Design Recommendation

**Option A: Inline Grade Select (Recommended)**
- Show grade dropdown next to each student name in expanded view
- Compact styling to fit alongside student chips
- Quick to implement, intuitive for teachers

**Option B: Separate Grade Column**
- Table layout with columns: Name | Grade | Actions
- More space for each element
- Requires more significant UI refactoring

**Recommendation:** Option A (Inline) - matches existing expand-in-place pattern from Phase 11

### Grade Level Values

**Use A/B/C/D/E (Recommended):**
- Matches international grading systems (UK, Australia, etc.)
- Clear hierarchy
- Compact single-character display
- Easy to type and select

**Alternative considered:**
- Numeric (1-5): Less clear hierarchy
- Descriptive (High/Medium/Low): Too long for compact display

### Validation Strategy

**Required validations:**
1. Grade value must be 'A' | 'B' | 'C' | 'D' | 'E' | null
2. Student name must still be unique within class
3. localStorage data must validate before use
4. .pipi file must validate on import

**Use TypeScript union types + runtime type guards for safety**

## Sources

### Primary (HIGH confidence)
- Existing codebase patterns:
  - `/hooks/useClassBank.ts` - localStorage persistence
  - `/components/ClassManagementModal.tsx` - UI patterns
  - `/types.ts` - data model patterns
  - Phase 10 & 11 RESEARCH.md - established patterns
- Browser APIs:
  - localStorage API (MDN Web Docs)
  - HTML `<select>` element (MDN Web Docs)

### Secondary (MEDIUM confidence)
- [React TypeScript Select OnChange Guide](https://www.xjavascript.com/blog/react-typescript-select-onchange/) - Event typing patterns
- [KindaCode React TypeScript Select](https://www.kindacode.com/article/react-typescript-handling-select-onchange-event) - Best practices
- [UXPin Dropdown Patterns](https://www.uxpin.com/studio/blog/dropdown-interaction-patterns-a-complete-guide/) - UI/UX guidance

### Tertiary (LOW confidence)
- [LocalStorage Migration Patterns](https://github.com/ragnarstolsmark/localstorage-migrator) - Migration strategies
- [TypeScript LocalStorage](https://www.compilenrun.com/docs/language/typescript/typescript-web-development/typescript-local-storage/) - Type-safe patterns

## Metadata

**Confidence breakdown:**
- Data model extension: HIGH - straightforward TypeScript interface extension
- localStorage migration: HIGH - existing patterns from Phase 10 to follow
- UI implementation: HIGH - native select element, existing modal patterns
- Export/import: HIGH - existing version management system in place

**Research date:** 2026-01-21
**Valid until:** 30 days (stable domain, established patterns unlikely to change)
