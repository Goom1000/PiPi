# Technology Stack: Tooltips & Onboarding Tours

**Project:** Cue — Tooltips and onboarding walkthrough features
**Researched:** 2026-01-27
**Confidence:** HIGH

## Executive Summary

**Two lightweight libraries recommended:**

1. **Driver.js** (~5kb) for onboarding tours — lightweight, framework-agnostic, direct React integration
2. **Floating UI** (~3kb) for tooltips — modern, Tailwind-friendly, React 19 compatible

These libraries integrate seamlessly with existing React 19 + Tailwind CSS stack without introducing heavy dependencies or UI library lock-in.

**Total bundle impact:** ~8kb gzipped (combined)

## Recommended Stack

### Onboarding Tours

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| driver.js | 1.4.0 | Guided tours for per-screen walkthroughs | Lightest option (~5kb), zero dependencies, works with custom components, manual trigger support |

**Installation:**
```bash
npm install driver.js
```

**Why Driver.js:**
- **Lightest bundle:** ~5kb gzipped vs 37kb+ for react-joyride
- **Zero dependencies:** Pure TypeScript, no transitive deps
- **Manual trigger:** Perfect for per-screen walkthrough buttons
- **Framework-agnostic:** Works with custom components without React wrapper complexity
- **Active maintenance:** v1.4.0 published December 2025
- **Tailwind-friendly:** Unstyled by default, easy to apply Tailwind classes

**React integration pattern:**
```typescript
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const driverObj = driver({
  steps: [
    { element: '#some-element', popover: { title: 'Title', description: 'Description' } }
  ]
});

// Trigger via button click
<button onClick={() => driverObj.drive()}>Start Tour</button>
```

**Source confidence:** HIGH
- [Official npm package](https://www.npmjs.com/package/driver.js) — v1.4.0 current
- [Driver.js official docs](https://driverjs.com/) — React integration examples
- [Bundle size verified](https://bundlephobia.com/package/driver.js) — 5kb gzipped
- Multiple 2026 tutorials confirm direct React usage without wrappers

---

### Tooltips

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @floating-ui/react | 0.27.16 | Info icon tooltips for feature explanations | Modern Popper.js successor, ~3kb, React 19 compatible, complete styling control |

**Installation:**
```bash
npm install @floating-ui/react
```

**Why Floating UI:**
- **Lightest modern option:** ~3kb for positioning primitives
- **React 19 compatible:** Official support, actively maintained
- **Headless architecture:** Complete styling control with Tailwind CSS
- **Positioning engine:** Smart collision detection, auto-adjustment
- **Accessibility built-in:** Hooks for proper ARIA attributes
- **No UI library lock-in:** Style with existing Tailwind patterns

**React integration pattern:**
```typescript
import { useFloating, useHover, useInteractions } from '@floating-ui/react';

const { refs, floatingStyles, context } = useFloating({
  placement: 'top',
});

const hover = useHover(context);
const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

return (
  <>
    <button ref={refs.setReference} {...getReferenceProps()}>
      <InfoIcon />
    </button>
    <div ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
      Tooltip content
    </div>
  </>
);
```

**Source confidence:** HIGH
- [Official npm package](https://www.npmjs.com/package/@floating-ui/react) — v0.27.16 current (5 months ago)
- [Floating UI official docs](https://floating-ui.com/docs/react) — React 19 examples
- [Bundle size verified](https://bundlephobia.com/package/@floating-ui/react) — ~3kb for core positioning
- Industry standard (powers Radix UI, Headless UI tooltip primitives)

---

## Alternatives Considered

### Onboarding Tour Alternatives

| Library | Why Not Recommended |
|---------|-------------------|
| **react-joyride** | Bundle size concern: adds ~37kb to bundle. React 19 compatibility issues (peer dependency warnings, community fork required for full support). Maintenance concerns (unresolved bugs from 2020). Official v3.0 still in pre-release with React 19 bugs. |
| **Intro.js** | Commercial license required for business use (AGPL, $9.99-$299). Not React-first (requires manual DOM refs). Framework-agnostic means less idiomatic React integration. |
| **Shepherd.js** | Smaller ecosystem (643 stars vs driver.js alternatives). AGPL license (commercial restrictions). Not React-specific, requires wrapper management. |
| **OnboardJS** | State machine approach requires bringing your own UI. More complex for simple per-screen tours. Adds abstraction layer without clear benefit for manual-trigger use case. |
| **React wrappers (driverjs-react, driver.jsx, use-driver)** | Community trend (2025-2026) favors direct driver.js integration. Wrappers add maintenance burden without significant DX improvement. Direct integration provides more control. |

**Decision rationale:**
- Bundle size matters for client-side app (driver.js: 5kb vs react-joyride: 37kb)
- React 19 compatibility proven for driver.js, problematic for react-joyride
- Manual trigger pattern works better with direct driver.js API
- Framework-agnostic = works with custom components without React-specific constraints

---

### Tooltip Alternatives

| Library | Why Not Recommended |
|---------|-------------------|
| **Radix UI Tooltip** | Larger bundle (~135kb package size). Brings full Radix component architecture when only tooltips needed. Excellent option if using Radix elsewhere, but overkill for isolated tooltip use. |
| **Tippy.js** | Legacy library (pre-Floating UI era). Heavier than Floating UI. Community recommends migrating to Floating UI for new projects in 2026. |
| **react-tooltip** | Bundle size concerns raised in GitHub issues. Less flexible than Floating UI for custom styling. Floating UI is the modern standard. |
| **Flowbite React / Material Tailwind** | Pulls in full component library for one component. Defeats purpose of custom component architecture. Increases bundle size unnecessarily. |
| **react-tippy** | Outdated (last update ~2022-2023). Based on legacy Tippy.js. Not maintained for React 19. |

**Decision rationale:**
- Headless architecture preserves existing custom component patterns
- Floating UI is the modern industry standard (Popper.js successor)
- Tailwind CSS compatibility without UI library dependencies
- Smallest bundle for production-grade positioning logic

---

## Anti-Recommendations

### What NOT to Add

| Category | Library | Why Avoid |
|----------|---------|-----------|
| **Full UI libraries** | shadcn/ui, Chakra UI, Ant Design | Defeats existing custom component architecture. Adds 100kb+ for two features. |
| **Rich tour builders** | Appcues, UserGuiding, Pendo | SaaS products ($19-$99/month). Overkill for per-screen manual tours. Requires external account management. |
| **Heavy abstractions** | React Tour, reactour, @reactour/tour | More abstraction than driver.js without meaningful DX improvement. Larger bundles. |
| **Outdated libraries** | react-contenteditable, Draft.js | Not relevant for tooltips/tours, but in same UI enhancement category. React 19 has better native solutions. |

**Principle:** Lightweight, framework-agnostic libraries preserve existing architecture while adding specific capabilities.

---

## Integration Points with Existing Stack

### Driver.js + React 19

**Direct integration pattern (no wrapper):**

```typescript
// components/WalkthroughButton.tsx
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export function WalkthroughButton({ screenId }: { screenId: string }) {
  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      steps: getStepsForScreen(screenId), // Dynamic per-screen
    });
    driverObj.drive();
  };

  return (
    <button onClick={startTour} className="...tailwind classes">
      <span>?</span> Show Guide
    </button>
  );
}
```

**Per-screen step configuration:**

```typescript
// config/walkthroughs.ts
export const walkthroughs: Record<string, Step[]> = {
  'slide-builder': [
    {
      element: '#add-slide-button',
      popover: {
        title: 'Add Slides',
        description: 'Click here to insert new slides',
        side: 'bottom',
        align: 'start'
      }
    },
    // ... more steps
  ],
  'teleprompter-view': [ /* ... */ ],
};
```

**Tailwind CSS styling:**

```typescript
const driverObj = driver({
  popoverClass: 'bg-white shadow-lg rounded-lg border border-gray-200',
  // Override default styles with Tailwind classes
});
```

---

### Floating UI + Tailwind CSS

**Tooltip component pattern:**

```typescript
// components/InfoTooltip.tsx
import { useState } from 'react';
import {
  useFloating,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  offset,
  flip,
  shift,
  arrow,
} from '@floating-ui/react';

export function InfoTooltip({ content, children }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'top',
    middleware: [offset(10), flip(), shift()],
  });

  const hover = useHover(context);
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  return (
    <>
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        className="inline-flex items-center text-blue-500 hover:text-blue-600"
      >
        {children || <InfoIcon />}
      </button>
      {isOpen && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
          className="z-50 max-w-xs px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg"
        >
          {content}
        </div>
      )}
    </>
  );
}
```

**Usage in existing components:**

```typescript
// In any React component
<InfoTooltip content="This generates a new slide with AI">
  <button className="...">Generate Slide</button>
</InfoTooltip>
```

---

## Bundle Size Impact

| Library | Minified | Gzipped | Impact |
|---------|----------|---------|--------|
| driver.js | ~20kb | ~5kb | Minimal — equivalent to small utility library |
| @floating-ui/react | ~15kb | ~3kb | Negligible — less than one image |
| **Total** | **~35kb** | **~8kb** | **Low impact** for client-side app |

**For context:**
- Current largest dependency: react-rnd (~50kb gzipped)
- Both libraries combined: 8kb (16% of react-rnd)
- Industry standard: <50kb for feature additions is acceptable
- These libraries: Well below threshold

**Tree-shaking:**
- Floating UI: Full tree-shaking support (import only what you use)
- Driver.js: Single entry point, but entire library is <5kb (not worth code-splitting)

---

## React 19 Compatibility

### Driver.js
**Status:** ✓ Compatible
- Framework-agnostic (vanilla TypeScript)
- No React peer dependencies
- Works with any React version (16+)
- Confirmed working in React 19 projects (2026 tutorials)

### Floating UI
**Status:** ✓ Compatible
- Official React 19 support added 2024
- Peer dependency: `react@>=16.8.0` (includes React 19)
- Active maintenance (last update 5 months ago)
- Powers React 19-compatible libraries (Radix UI Themes v3.x)

**Source:** [Radix Themes React 19 support](https://www.radix-ui.com/themes/docs/overview/releases) — Radix uses Floating UI primitives, verified React 19 compatible

---

## Implementation Confidence

| Feature | Confidence | Rationale |
|---------|------------|-----------|
| Driver.js tours | HIGH | Framework-agnostic, proven in React 19, direct integration pattern documented in 2026 guides |
| Floating UI tooltips | HIGH | Official React 19 support, actively maintained, industry standard (powers Radix/Headless UI) |
| Tailwind integration | HIGH | Both libraries headless/unstyled by design, complete Tailwind control |
| Bundle size impact | HIGH | Combined 8kb gzipped, negligible for client-side app |
| Custom component compatibility | HIGH | Neither library imposes component structure, works with existing architecture |

---

## Installation

```bash
# Install both libraries
npm install driver.js @floating-ui/react

# No additional dependencies required
# Both libraries are zero-dependency at their core
```

**Current package.json after installation:**
```json
{
  "dependencies": {
    "@google/genai": "^1.30.0",
    "@floating-ui/react": "^0.27.16",
    "driver.js": "^1.4.0",
    "html2canvas": "^1.4.1",
    "jspdf": "^4.0.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-rnd": "^10.5.2"
  }
}
```

---

## Validation Sources

### Official Documentation

**Driver.js:**
- [Official website](https://driverjs.com/) — React examples, configuration options
- [npm package](https://www.npmjs.com/package/driver.js) — v1.4.0, 5kb bundle, zero dependencies
- [GitHub repository](https://github.com/kamranahmedse/driver.js) — Active maintenance, 23k+ stars

**Floating UI:**
- [Official React docs](https://floating-ui.com/docs/react) — React 19 examples, hooks API
- [Tooltip component guide](https://floating-ui.com/docs/tooltip) — Complete tooltip implementation
- [npm package](https://www.npmjs.com/package/@floating-ui/react) — v0.27.16, React 19 peer dependency

### Ecosystem Research

**2026 Onboarding Library Comparisons:**
- [5 Best React Onboarding Libraries (2026)](https://onboardjs.com/blog/5-best-react-onboarding-libraries-in-2025-compared) — Driver.js recommended for lightweight, manual-trigger tours
- [React Product Tour Libraries (2026)](https://whatfix.com/blog/react-onboarding-tour/) — Driver.js: 340k+ weekly downloads, React-first approach
- [Top 8 React Product Tour Libraries](https://www.chameleon.io/blog/react-product-tour) — Driver.js ideal for "lightweight, framework-agnostic, visually polished solution"

**2026 Tooltip Library Comparisons:**
- [Top 6 React Tooltip Libraries (2026)](https://themeselection.com/react-tooltip-libraries/) — Floating UI recommended for headless approach
- [Lightweight React Tooltips](https://blog.openreplay.com/lightweight-tooltips-react/) — Floating UI: ~3kb, modern Popper.js successor
- [15 Best React UI Libraries (2026)](https://www.builder.io/blog/react-component-libraries-2026) — Floating UI/Radix UI for headless components

**Bundle Size Verification:**
- [driver.js Bundlephobia](https://bundlephobia.com/package/driver.js) — 5kb gzipped confirmed
- [react-joyride Bundlephobia](https://bundlephobia.com/package/react-joyride) — 37kb gzipped (comparison)
- [Floating UI Bundlephobia](https://bundlephobia.com/package/@floating-ui/react) — 3kb core positioning

**React 19 Compatibility:**
- [react-joyride React 19 issues](https://github.com/gilbarbara/react-joyride/issues/1151) — Peer dependency warnings, community fork required
- [Radix UI React 19 support](https://www.radix-ui.com/themes/docs/overview/releases) — June 2024 update, Floating UI verified compatible
- Multiple 2026 tutorials show driver.js + React 19 direct integration without compatibility issues

### Community Patterns (2026)

**Driver.js with React:**
- Community trend: Direct integration preferred over wrappers (driverjs-react, driver.jsx, use-driver)
- [Medium: Creating Interactive User Guides with Driver.js](https://medium.com/@mefengl/creating-interactive-user-guides-in-react-with-driver-js-1-x-a-light-hearted-approach-297de5d99cb3) — React 19 example
- [DEV: Streamline User Onboarding with driver.js](https://dev.to/fadilnatakusumah/streamline-user-onboarding-with-driverjs-222e) — React integration pattern

**Floating UI adoption:**
- Powers major libraries: Radix UI, Headless UI, shadcn/ui tooltips
- Industry standard for positioning engines in 2026
- Replaced Popper.js in most modern React projects

---

## Decision Summary

**Add two lightweight libraries:**

1. **driver.js (1.4.0)** for onboarding tours
   - 5kb gzipped, zero dependencies
   - Manual trigger perfect for per-screen walkthrough buttons
   - Works with custom components without React wrapper complexity

2. **@floating-ui/react (0.27.16)** for tooltips
   - 3kb gzipped for core positioning
   - Headless architecture preserves Tailwind CSS styling patterns
   - React 19 compatible, actively maintained

**Combined bundle impact:** 8kb gzipped (acceptable for client-side app)

**Architectural principle:** Choose lightweight, framework-agnostic libraries that preserve existing custom component architecture while adding specific capabilities. Avoid heavy UI libraries that would conflict with established Tailwind CSS patterns.
