# Phase 46: Preview, Edit, and Trust UI - Context

## Phase Goal

Teachers can see, understand, and approve AI changes before committing. This builds trust by showing what changed and allowing corrections.

## Requirements

- **PREVIEW-01**: User sees enhanced resource preview before export (partially done in Phase 45)
- **PREVIEW-02**: User can edit enhanced content inline before export
- **PREVIEW-03**: User sees visual diff showing what AI changed from original
- **PREVIEW-04**: User can regenerate individual sections

## Current State (from Phase 45)

EnhancementPanel already provides:
- Preview of enhanced content with three differentiation tabs
- Elements rendered by type (header, paragraph, question, list, table, etc.)
- Answer key display with marking criteria
- Full regeneration via "Regenerate Enhancement" button

What's missing:
- Inline editing of element content
- Visual diff showing original vs enhanced
- Per-element/section regeneration

## Key Decisions

1. **Edit Mode Toggle** - Add "Edit" button to switch between view and edit modes
2. **Diff View Toggle** - Add "Show Changes" toggle to highlight differences from original
3. **Per-Element Regenerate** - Add regenerate icon button on each element for targeted regeneration
4. **Local State for Edits** - Store edits in component state until explicitly saved/exported

## Architecture

### Existing Components to Modify

- `components/EnhancementPanel.tsx` - Add edit mode, diff view, per-element actions

### New Types Needed

- `EditableEnhancementResult` - Tracks edited state alongside original result
- Element edit state tracking

### Key Patterns

1. **Contenteditable** - Use contenteditable for inline text editing
2. **Diff Highlighting** - Use text-diff library or simple string comparison for highlighting
3. **Element-Level Regeneration** - Call AI with single element context for targeted regen

## Success Criteria

1. User can toggle edit mode and modify any text element
2. User can see visual diff highlighting (strikethrough original, highlight new)
3. User can click regenerate on individual elements
4. Edits persist while viewing different tabs
5. Changes can be discarded (revert to AI result)

## Constraints

- Keep UI simple - don't overload with options
- Edits are local until export (no auto-save)
- Diff view is informational, not editable
- Per-element regen uses existing provider infrastructure

## Estimated Scope

2 plans:
1. Plan 01: Edit mode and inline editing
2. Plan 02: Diff view and per-element regeneration
