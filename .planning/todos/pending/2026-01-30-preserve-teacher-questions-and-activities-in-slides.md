---
created: 2026-01-30T06:16
title: Preserve teacher questions and activities in generated slides
area: api
files: []
---

## Problem

The AI does an excellent job of interpreting lesson plans and creating coherent slide sequences. However, it often **omits or reimagines** specific content that teachers deliberately included:

1. **Specific questions** — Teachers write exact questions they want students to answer. The AI tends to paraphrase or drop these entirely.

2. **Specific activity ideas** — When the plan describes a particular task or activity, the AI often creates its own version instead of using what the teacher specified.

3. **Resource/worksheet references** — If the plan mentions specific worksheets or resources that need to be completed, these references should appear in the slides (these resources will be generated in the resource section and need to be printable/usable).

**Key constraint:** The current system works very well and shouldn't be broken. This is an enhancement to preserve teacher intent, not a rewrite.

## Solution

TBD — Approach considerations:
- Prompt engineering: Add instructions to the AI to identify and preserve verbatim questions, specific activities, and resource references from the input
- Detection: Could use markers or patterns to identify "must preserve" content (e.g., questions ending with ?, numbered activities, resource names)
- Integration: Preserved content should flow naturally into the generated slide sequence, not feel bolted on
- Balance: The AI should still structure the lesson well — just ensure teacher-specified elements are included at appropriate points
