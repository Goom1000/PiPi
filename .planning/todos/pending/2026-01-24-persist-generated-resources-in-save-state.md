---
created: 2026-01-24T11:06
title: Persist generated resources in save state
area: api
files:
  - src/types/presentation.ts (PresentationState type)
  - TBD (save/load logic)
---

## Problem

When users generate resources during a session (worksheets, working wall posters, Class Challenge content, etc.), these generated items are not currently persisted in the .cue save file. If a teacher closes the app and reopens the presentation later, they would need to regenerate all resources.

This creates friction:
- Wasted time regenerating content
- Potential inconsistency (AI might generate different content)
- Teachers lose any manual edits they made to generated resources

## Solution

Extend the save state to include:
1. **Generated worksheets** - store the worksheet content/data
2. **Working wall items** - store exported poster data and any AI-transformed versions
3. **Class Challenge responses** - student contributions captured during live sessions

When loading a .cue file:
- All previously generated resources should be immediately available for download/export
- No regeneration needed
- Any teacher edits preserved

Consider storage format (embedded vs. referenced files) based on file size implications.
