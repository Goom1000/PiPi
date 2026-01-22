# Phase 18: Student Display - Research

**Researched:** 2026-01-22
**Domain:** BroadcastChannel sync, CSS animations, responsive text sizing
**Confidence:** HIGH

## Summary

Phase 18 adds a student name banner overlay to the student view when Targeted mode selects a student. The implementation requires:

1. **New BroadcastChannel message type** - `STUDENT_SELECT` to transmit the selected student name from teacher to student view
2. **Banner component in StudentView** - Absolute-positioned overlay that shows "Question for [Name]" format
3. **CSS animations** - Slide-down entrance (existing `animate-fade-in` pattern can be extended), fade-out exit after 3 seconds
4. **Auto-sizing text** - Handle long names by shrinking font size to fit within container width

The codebase already has established patterns for BroadcastChannel messaging (types.ts discriminated union), CSS animations (index.html @keyframes), and overlay positioning (StudentGameView). This phase extends existing infrastructure rather than building new patterns.

**Primary recommendation:** Add `STUDENT_SELECT` message type to PresentationMessage union, create a StudentNameBanner component with CSS-only animations, and use a simple JavaScript-based font-size calculation for long names (avoid external libraries for a simple use case).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.x | UI framework | Already in use |
| Tailwind CSS | 3.x (CDN) | Styling & animations | Already in use, custom keyframes in index.html |
| BroadcastChannel API | Native | Cross-window sync | Already in use for slide/game sync |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| setTimeout | Native | Auto-dismiss timer | 3-second banner timeout |
| useEffect cleanup | React | Cancel timers on unmount | Prevent stale state updates |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS-only text sizing | auto-text-size npm | Adds dependency for simple use case; project uses CDN-loaded Tailwind |
| Custom @keyframes | tailwindcss-animate plugin | Plugin not compatible with CDN Tailwind setup |
| Inline styles | Tailwind arbitrary values | Tailwind arbitrary values work better for one-off animations |

**Installation:**
```bash
# No new dependencies required
# Animation keyframes added to index.html <style> block
```

## Architecture Patterns

### Recommended Message Type Addition
```typescript
// types.ts - Add to PresentationMessage union
export type PresentationMessage =
  | { type: 'STATE_UPDATE'; payload: PresentationState }
  | { type: 'STATE_REQUEST' }
  | { type: 'HEARTBEAT'; timestamp: number }
  | { type: 'HEARTBEAT_ACK'; timestamp: number }
  | { type: 'CLOSE_STUDENT' }
  | { type: 'GAME_STATE_UPDATE'; payload: GameSyncState }
  | { type: 'GAME_CLOSE' }
  | { type: 'STUDENT_SELECT'; payload: { studentName: string } }  // NEW
  | { type: 'STUDENT_CLEAR' };  // NEW - explicit clear on slide change
```

### Pattern 1: Banner State Management
**What:** Local state in StudentView with timeout-based auto-dismiss
**When to use:** Transient UI elements with timed visibility
**Example:**
```tsx
// StudentView.tsx
const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
const [isExiting, setIsExiting] = useState(false);
const timerRef = useRef<number | null>(null);

// Handle incoming messages
useEffect(() => {
  if (!lastMessage) return;

  if (lastMessage.type === 'STUDENT_SELECT') {
    // Clear any existing timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Show banner immediately (cancels exit animation if in progress)
    setIsExiting(false);
    setSelectedStudent(lastMessage.payload.studentName);

    // Start 3-second auto-dismiss timer
    timerRef.current = window.setTimeout(() => {
      setIsExiting(true);
      // Wait for exit animation to complete before clearing
      setTimeout(() => setSelectedStudent(null), 500);
    }, 3000);
  }

  if (lastMessage.type === 'STUDENT_CLEAR') {
    // Immediate clear (no exit animation) on slide change
    if (timerRef.current) clearTimeout(timerRef.current);
    setSelectedStudent(null);
    setIsExiting(false);
  }
}, [lastMessage]);

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };
}, []);
```

### Pattern 2: CSS Animation Keyframes
**What:** Slide-down entrance + fade-out exit using @keyframes
**When to use:** Banner enter/exit animations
**Example:**
```css
/* Add to index.html <style> block */
.animate-slide-down {
  animation: slideDown 0.4s ease-out forwards;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-out {
  animation: fadeOut 0.5s ease-in forwards;
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
```

### Pattern 3: Overlay Positioning
**What:** Absolute positioning at top of student view
**When to use:** Banner overlay that doesn't affect slide layout
**Example:**
```tsx
// Banner positioned at top center, above slide content
<div className="h-screen w-screen bg-black flex items-center justify-center overflow-hidden relative">
  {/* Student Name Banner - positioned absolutely above slide */}
  {selectedStudent && (
    <div className={`absolute top-0 left-0 right-0 z-50 flex justify-center pt-8 ${isExiting ? 'animate-fade-out' : 'animate-slide-down'}`}>
      <StudentNameBanner studentName={selectedStudent} />
    </div>
  )}

  {/* Existing slide content */}
  <div className="w-full h-full max-w-[1920px] max-h-[1080px] aspect-video bg-white">
    <SlideContentRenderer slide={currentSlide} visibleBullets={visibleBullets} />
  </div>
</div>
```

### Pattern 4: Auto-Sizing Text (Simple Approach)
**What:** Calculate font size based on name length
**When to use:** Ensure long names remain readable
**Example:**
```tsx
// Simple length-based font sizing (no external library)
function getNameFontSize(name: string): string {
  const length = name.length;
  if (length <= 10) return 'text-6xl';      // Default large
  if (length <= 15) return 'text-5xl';      // Slightly smaller
  if (length <= 20) return 'text-4xl';      // Medium
  if (length <= 30) return 'text-3xl';      // Smaller
  return 'text-2xl';                        // Minimum readable size
}

// Usage in banner
<span className={`font-bold ${getNameFontSize(studentName)}`}>
  {studentName}
</span>
```

### Anti-Patterns to Avoid
- **Storing banner state in parent:** Banner state is view-specific, keep in StudentView
- **Using transform scale for text:** Makes text blurry on some browsers; use font-size instead
- **Forgetting timer cleanup:** Always clear timeouts on unmount or when new selection arrives
- **Blocking animations on rapid selection:** New selection should interrupt exit animation and restart

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-window messaging | Custom postMessage | BroadcastChannel (existing) | Already proven in codebase |
| Animation timing | JavaScript animations | CSS @keyframes | GPU-accelerated, smoother |
| Z-index management | Arbitrary high numbers | z-50 (Tailwind scale) | Consistent with codebase (uses z-50, z-[100]) |
| Discriminated union types | Manual type checking | TypeScript exhaustive switch | Existing pattern in message handling |

**Key insight:** The codebase has established patterns for everything needed. StudentGameView shows how to overlay content in student view, PresentationMessage union shows message type pattern, index.html shows animation keyframe pattern.

## Common Pitfalls

### Pitfall 1: Timer Not Cleared on Rapid Selection
**What goes wrong:** Multiple timers accumulate, causing unexpected banner dismissals
**Why it happens:** Teacher clicks question button rapidly, each selection starts a new timer
**How to avoid:** Clear existing timer before setting new one (see Pattern 1)
**Warning signs:** Banner disappears too early or flickers

### Pitfall 2: Exit Animation Interrupted
**What goes wrong:** Exit animation starts, then new selection arrives, causing visual glitch
**Why it happens:** isExiting state not reset when new student selected
**How to avoid:** Reset isExiting to false immediately on new STUDENT_SELECT
**Warning signs:** Banner slides down while simultaneously fading out

### Pitfall 3: Banner Persists After Slide Change
**What goes wrong:** Banner from previous slide still visible on new slide
**Why it happens:** Only STUDENT_SELECT messages handled, no explicit clear on slide change
**How to avoid:** Send STUDENT_CLEAR from PresentationView in the useEffect that clears quickQuestion on currentIndex change
**Warning signs:** Wrong student name shown on different slide

### Pitfall 4: Long Name Overflow
**What goes wrong:** Very long names overflow banner container
**Why it happens:** Fixed font size doesn't account for name length
**How to avoid:** Use length-based font sizing (see Pattern 4)
**Warning signs:** Name text clips or extends beyond screen edges

### Pitfall 5: Banner Blocks Slide Content
**What goes wrong:** Banner covers important slide content
**Why it happens:** Banner positioned without considering slide layout
**How to avoid:** Use absolute positioning with z-index, positioned above slide area with padding
**Warning signs:** Slide title obscured by banner

## Code Examples

Verified patterns from existing codebase:

### StudentNameBanner Component
```tsx
// components/StudentNameBanner.tsx
import React from 'react';

interface StudentNameBannerProps {
  studentName: string;
}

// Simple length-based font sizing
function getNameFontSize(name: string): string {
  const length = name.length;
  if (length <= 10) return 'text-6xl';
  if (length <= 15) return 'text-5xl';
  if (length <= 20) return 'text-4xl';
  if (length <= 30) return 'text-3xl';
  return 'text-2xl';  // Minimum readable from back of classroom
}

const StudentNameBanner: React.FC<StudentNameBannerProps> = ({ studentName }) => {
  return (
    <div className="bg-indigo-600 dark:bg-amber-500 px-12 py-6 rounded-2xl shadow-2xl">
      <p className="text-white dark:text-slate-900 text-xl font-medium mb-1">
        Question for
      </p>
      <p className={`text-white dark:text-slate-900 font-bold ${getNameFontSize(studentName)}`}>
        {studentName}
      </p>
    </div>
  );
};

export default StudentNameBanner;
```

### Sending STUDENT_SELECT from PresentationView
```tsx
// In PresentationView.tsx, modify handleGenerateQuestion
const handleGenerateQuestion = async (level: 'A' | 'B' | 'C' | 'D' | 'E', studentName?: string) => {
  // ... existing code ...

  // If in Targeted mode with a student, broadcast to student view
  if (studentName && isTargetedMode) {
    postMessage({ type: 'STUDENT_SELECT', payload: { studentName } });
  }

  // ... rest of existing code ...
};

// Clear banner on slide change
useEffect(() => {
  setQuickQuestion(null);
  // Also clear student banner on student view
  if (isTargetedMode) {
    postMessage({ type: 'STUDENT_CLEAR' });
  }
}, [currentIndex, postMessage, isTargetedMode]);
```

### Handling Messages in StudentView
```tsx
// In StudentView.tsx, add to existing useEffect
if (lastMessage.type === 'STUDENT_SELECT') {
  // Clear any existing timer
  if (timerRef.current) clearTimeout(timerRef.current);

  // Reset exit state and show new student
  setIsExiting(false);
  setSelectedStudent(lastMessage.payload.studentName);

  // Auto-dismiss after 3 seconds
  timerRef.current = window.setTimeout(() => {
    setIsExiting(true);
    setTimeout(() => setSelectedStudent(null), 500);
  }, 3000);
}

if (lastMessage.type === 'STUDENT_CLEAR') {
  if (timerRef.current) clearTimeout(timerRef.current);
  setSelectedStudent(null);
  setIsExiting(false);
}
```

### Animation Keyframes Addition
```html
<!-- Add to index.html <style> block, after existing animate-fade-in -->
.animate-slide-down {
  animation: slideDown 0.4s ease-out forwards;
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-100%); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-out {
  animation: fadeOut 0.5s ease-in forwards;
}
@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JavaScript-driven animations | CSS @keyframes | Years ago | GPU acceleration, smoother |
| setTimeout without cleanup | useEffect cleanup returns | React hooks | No memory leaks |
| Arbitrary font sizes | Tailwind scale classes | Tailwind adoption | Consistent sizing scale |

**Deprecated/outdated:**
- None identified - all patterns used are current React 19 / Tailwind 3 best practices

## Open Questions

Things that couldn't be fully resolved:

1. **Exact padding/margin values for banner positioning**
   - What we know: Top center positioning, pt-8 provides reasonable spacing
   - What's unclear: May need adjustment based on actual classroom projector testing
   - Recommendation: Start with pt-8, adjustable via Tailwind classes

2. **Dark mode colors for banner**
   - What we know: PiPi uses indigo-600 (light) and amber-500 (dark) as brand colors
   - What's unclear: Exact contrast requirements for classroom visibility
   - Recommendation: Follow existing brand pattern (indigo light, amber dark)

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis:
  - `types.ts` - PresentationMessage discriminated union pattern
  - `StudentView.tsx` - BroadcastChannel message handling
  - `StudentGameView.tsx` - Overlay component pattern in student view
  - `PresentationView.tsx` - Teacher-side state management and messaging
  - `index.html` - CSS @keyframes animation pattern
  - `useBroadcastSync.ts` - BroadcastChannel hook implementation

### Secondary (MEDIUM confidence)
- [MDN Web Docs - Using CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Animations/Using) - Animation keyframes reference
- [Tailwind CSS Animation Docs](https://tailwindcss.com/docs/animation) - Custom animation utilities

### Tertiary (LOW confidence)
- [auto-text-size npm](https://www.npmjs.com/package/auto-text-size) - Considered but rejected (adds dependency for simple use case)
- [Sentry Engineering - Fitting Text to Container](https://sentry.engineering/blog/perfectly-fitting-text-to-container-in-react) - Algorithm reference (implemented simpler length-based approach)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, uses existing patterns
- Architecture: HIGH - Extends proven BroadcastChannel messaging pattern
- Animations: HIGH - Follows existing @keyframes pattern in index.html
- Text sizing: MEDIUM - Simple length-based approach; may need refinement for edge cases

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (stable patterns, no external API changes expected)
