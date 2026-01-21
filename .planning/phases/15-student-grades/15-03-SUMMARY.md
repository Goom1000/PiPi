---
phase: 15
plan: 03
subsystem: export-import
tags: [grades, persistence, file-format]
dependency-graph:
  requires: [15-02]
  provides: [grade-export-import]
  affects: []
tech-stack:
  added: []
  patterns: [optional-parameter-extension, class-grade-restoration]
key-files:
  created: []
  modified: [App.tsx, hooks/useClassBank.ts]
decisions:
  - "Use lesson title as class name when restoring grades from import"
  - "Prioritize provided studentData over existing grades during import"
metrics:
  duration: 8 minutes
  completed: 2026-01-21
---

# Phase 15 Plan 03: Export/Import Grade Wiring Summary

**One-liner:** Wired grade data through export/import flows - save passes active class grades to file, load restores them to class bank.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Pass studentGrades when saving .pipi files | a4b45f7 | App.tsx |
| 2 | Extend saveClass to accept optional studentData | dde0020 | hooks/useClassBank.ts |
| 3 | Restore studentGrades when loading .pipi files | 84e00de | App.tsx |

## What Was Built

### Export Wiring (Task 1)

Both `handleSaveClick` and `handleSaveConfirm` in App.tsx now:
1. Look up the active class by name from the classes array
2. Extract the class's studentData (array of StudentWithGrade)
3. Pass studentGrades to `createPiPiFile(...)` as the optional parameter

This ensures that when a user saves a .pipi file, any grade assignments in the active class are included in the file.

### Hook Extension (Task 2)

Extended `saveClass` in useClassBank.ts to accept an optional third parameter:
```typescript
saveClass(name: string, students: string[], studentData?: StudentWithGrade[])
```

When `studentData` is provided (e.g., from file import):
- Provided grades take priority over existing class grades
- Handles both new class creation and existing class updates
- Falls back to existing grades only for students not in provided data

### Import Wiring (Task 3)

`handleLoadFile` now reads and restores grade data:
1. Reads `pipiFile.content.studentGrades` after loading the file
2. If grades exist and students are present, calls `saveClass(title, students, grades)`
3. Sets `activeClassName` to the file title so the restored class is immediately active

This completes the round-trip: grades assigned in UI -> saved to file -> loaded back -> restored in class bank.

## Deviations from Plan

None - plan executed exactly as written.

## Technical Notes

**Dependency arrays updated:** Both save callbacks now include `classes` and `activeClassName` in their useCallback dependency arrays to ensure correct grade data lookup.

**Class naming on import:** Uses the presentation title as the class name when restoring grades. If a class with that name exists, it updates it (preserving the ID); otherwise creates new.

**Backward compatibility preserved:** Files without studentGrades load normally - the `loadedGrades && loadedGrades.length > 0` check skips grade restoration for legacy files.

## Verification Results

| Check | Status |
|-------|--------|
| TypeScript compiles | PASS |
| Build succeeds | PASS |
| studentGrades used in save functions | PASS (lines 574, 577, 592, 594) |
| loadedGrades passed to saveClass | PASS (line 635) |
| saveClass accepts optional studentData | PASS (line 102) |

## Gap Closure Confirmation

This plan closes verification gap #5 from 15-VERIFICATION.md:
> "Saved classes include grade data when exported/imported"

- **Export:** handleSaveClick/handleSaveConfirm pass studentGrades to createPiPiFile
- **Import:** handleLoadFile reads content.studentGrades and restores via saveClass

Phase 15 Student Grades is now complete.
