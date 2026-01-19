---
created: 2026-01-20T04:34
title: Multi-select slides to merge into one
area: ui
files:
  - src/components/SlidePreview.tsx
  - src/services/ClaudeProvider.ts
---

## Problem

When recreating slideshows from existing PDFs, content can be repetitive or spread across multiple slides inefficiently. There's no way to consolidate related slides into a single, clearer slide. Teachers need to manually identify redundant content and can't easily combine concepts.

## Solution

**Multi-select UI:**
- Add checkbox/selection indicator to each slide in the preview list
- Selected slides highlight in a theme-appropriate color (dark/light mode aware)
- When 2+ slides selected, show "Merge Slides" action button

**Merge logic:**
- AI analyzes content from all selected slides
- Identifies redundant/overlapping information
- Creates one cohesive slide combining the key concepts more intelligently
- Deletes the original selected slides
- Places merged slide at the most logical sequence position

**Cascade regeneration:**
- If surrounding slides need adjustment for flow/continuity, auto-regenerate them
- Maintain narrative coherence across the presentation

**Key considerations:**
- Preserve the "single concept per slide" philosophy where possible
- Show preview of merged result before confirming deletion
- Undo capability (or confirmation dialog)
