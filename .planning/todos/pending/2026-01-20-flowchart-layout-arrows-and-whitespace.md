---
created: 2026-01-20T15:22
title: Flowchart layout - center arrows and fill whitespace
area: ui
files:
  - src/components/SlideContent.tsx
---

## Problem

In flowchart mode, the AI-generated slides have layout issues:

1. **Arrow alignment:** Arrows connecting boxes are aligned at the bottom of boxes instead of being centered vertically. Arrows should start from the vertical center of one box and lead to the vertical center of the next box for a polished look.

2. **Whitespace distribution:** Boxes don't intelligently fill the available vertical space. There's a large gap of white space below the boxes (as seen in the attached example). Boxes should expand/distribute to fill the slide area without overlapping.

**Example observed:** Three boxes ("Subject", "Verb", "A single, complete thought") with connecting arrows. The arrows appear at the bottom edge of boxes rather than mid-height, and significant empty space exists below the row of boxes.

## Solution

TBD - Investigate how flowchart slides are rendered:
- Find the CSS/component responsible for flowchart box layout
- Center arrows vertically on boxes (likely flexbox align-items or explicit positioning)
- Implement better vertical space distribution (possibly flex-grow or calculated heights)
- Ensure boxes expand to fill available height while maintaining visual balance
