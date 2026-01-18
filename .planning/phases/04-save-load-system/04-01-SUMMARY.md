---
phase: 04-save-load-system
plan: 01
subsystem: file-io
tags: [save, load, file-format, serialization, browser-download]
dependency-graph:
  requires: [types.ts, useSettings pattern]
  provides: [PiPiFile type, save service, load service]
  affects: [04-02 auto-save, 04-03 UI integration]
tech-stack:
  added: []
  patterns: [type guards, Blob download with cleanup, FileReader Promise wrapper]
key-files:
  created:
    - services/saveService.ts
    - services/loadService.ts
  modified:
    - types.ts
decisions:
  - decision: "Version number in file format"
    rationale: "Enables forward compatibility and migration path"
  - decision: "JSON pretty-print for saved files"
    rationale: "Human-readable, debuggable, minimal size impact"
  - decision: "100ms delay before URL.revokeObjectURL"
    rationale: "Firefox needs delay for download to complete"
metrics:
  duration: ~3 minutes
  completed: 2026-01-19
---

# Phase 04 Plan 01: Core Save/Load Services Summary

Core file I/O services for .pipi format with versioned serialization and validated deserialization.

## Changes Made

### types.ts
- Added `CURRENT_FILE_VERSION` constant (= 1) for version tracking
- Added `PiPiFileContent` interface for slides, studentNames, lessonText
- Added `PiPiFile` interface with version, createdAt, modifiedAt, title, author, content

### services/saveService.ts (new)
- `createPiPiFile()`: Creates file object with timestamps, preserves createdAt on update
- `checkFileSize()`: Returns sizeBytes, sizeMB, exceeds50MB for 50MB warning
- `downloadPresentation()`: Blob download with proper memory cleanup (Firefox-safe)

### services/loadService.ts (new)
- `isValidPiPiFile()`: Type guard following existing useSettings pattern
- `readPiPiFile()`: Promise-based FileReader with validation pipeline
- `migrateFile()`: Internal function for future version migration

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Version number starts at 1 | Standard practice, increment on breaking changes |
| Pretty-print JSON (null, 2) | Human-readable for debugging, minimal size impact |
| 100ms cleanup delay | Firefox needs delay before URL.revokeObjectURL |
| User-friendly error messages | Will be displayed in toast notifications |
| Type guard validation | Follows established isValidSettings pattern |

## Verification Results

- [x] TypeScript compiles without errors
- [x] PiPiFile interface in types.ts with all required fields
- [x] saveService.ts exports: createPiPiFile, checkFileSize, downloadPresentation
- [x] loadService.ts exports: isValidPiPiFile, readPiPiFile
- [x] Both services import PiPiFile from types.ts

## Commits

| Hash | Description |
|------|-------------|
| e6b9cfa | feat(04-01): define PiPiFile interface for save/load system |
| 8e03a30 | feat(04-01): create saveService for .pipi file downloads |
| 9b1d3ff | feat(04-01): create loadService for .pipi file reading |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for 04-02:** Auto-save system
- PiPiFile type available for serialization
- isValidPiPiFile available for recovery validation
- Services provide all primitives needed for auto-save implementation
