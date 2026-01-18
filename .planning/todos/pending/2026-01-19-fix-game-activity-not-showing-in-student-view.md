---
created: 2026-01-19T00:00
title: Fix game activity not showing in student view
area: ui
files: []
---

## Problem

**Bug:** When the Kahoot-style game activity is opened in presentation mode, it only displays in the teacher view — it does NOT appear in the student view window.

This defeats the purpose of the game activity, since students need to see the questions/options on the projected student view to participate.

**Expected behavior:** When teacher opens a game activity, students should see the game UI on their display (the student view window).

**Current behavior:** Game only appears on teacher's screen.

## Solution

TBD — likely need to:
- Check how game state is being broadcast to the student view
- Ensure game component is included in student view rendering
- May need to sync game state via the existing BroadcastChannel or window communication
