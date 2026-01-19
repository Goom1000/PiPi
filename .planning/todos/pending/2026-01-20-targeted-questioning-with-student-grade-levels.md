---
created: 2026-01-20T04:32
title: Targeted questioning with student grade levels
area: ui
files:
  - src/components/TeleprompterPanel.tsx
  - src/components/ClassBank.tsx
---

## Problem

The teleprompter questioning feature (A/B/C grade buttons) generates questions but doesn't show the answer. Teachers need to see the answer in the teleprompter to guide classroom discussion without having to think of the answer themselves.

Additionally, there's no way to assign individual students to grade levels or track which students have been asked questions during targeted differentiation.

## Solution

**Part 1: Question + Answer Generation**
- When a question is generated in the teleprompter, also generate and display the expected answer underneath
- Students see nothing (teleprompter only), teacher sees both question and answer

**Part 2: Student Grade Level Assignment**
- Add a button next to the class list that opens a modal
- Modal shows full class list with grade level selector per student (A/B/C/D/E)
- D and E for students working below standard (helps AI context even if not directly used in questions)
- Store grade assignments with student data

**Part 3: Targeted Differentiation Mode**
- Add toggle at bottom of teleprompter: "Manual" vs "Targeted" questioning mode
- Manual mode: existing behavior (click grade, get question)
- Targeted mode: click grade level (e.g., A), AI generates question AND cycles through students tagged at that level
  - Student name appears on main screen visible to class ("Question for Michael")
  - Teleprompter shows question + answer
  - AI tracks who has been asked to ensure fair distribution
  - Continues cycling until all students at that grade have been asked

**Key UX considerations:**
- Toggle should be quick and accessible (bottom of teleprompter panel)
- Track questioning state so repeat clicks don't repeat same student
- Reset tracking when moving to new slide or explicit reset action
