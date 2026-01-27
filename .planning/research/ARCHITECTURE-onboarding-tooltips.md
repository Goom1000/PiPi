# Architecture: Onboarding Tours & Tooltips Integration

**Project:** Cue v3.6
**Domain:** Onboarding/Tooltip systems for existing React 19 SPA
**Researched:** 2026-01-27
**Confidence:** HIGH

## Executive Summary

Integrating tooltips and onboarding tours into Cue's existing ~20k LOC React 19 architecture requires minimal structural changes. The recommended approach uses **react-joyride** for per-screen walkthrough tours and a lightweight **custom tooltip component** (or react-tooltip) for info icon tooltips. Both integrate cleanly with Cue's existing patterns: localStorage persistence, createPortal rendering, and z-index layering.

**Key architectural decision:** Tours and tooltips should be **per-screen components** that live alongside existing screen logic (App.tsx, PresentationView.tsx) rather than a global tour orchestrator. This matches Cue's screen-based routing architecture and allows manual triggers per screen.

## Recommended Architecture

### High-Level Structure

```
┌─────────────────────────────────────────────────────────┐
│ App.tsx (Landing/Editor Screen)                         │
│  ├─ <TourProvider> (react-joyride)                     │
│  │   ├─ localStorage: tourCompleted.landing            │
│  │   └─ Manual trigger: "?" button in header           │
│  ├─ <InfoTooltip> components (inline with features)    │
│  └─ Existing UI (upload, settings, slide thumbnails)   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ PresentationView.tsx (Presentation Screen)              │
│  ├─ <TourProvider> (react-joyride)                     │
│  │   ├─ localStorage: tourCompleted.presentation       │
│  │   └─ Manual trigger: "?" button in teleprompter     │
│  ├─ <InfoTooltip> components (inline with controls)    │
│  └─ Existing UI (slides, teleprompter, game controls)  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Shared Components                                       │
│  ├─ <InfoTooltip> (reusable tooltip wrapper)          │
│  ├─ <TourProvider> (optional: wrapper for react-joyride)│
│  └─ hooks/useTourState.ts (localStorage persistence)   │
└─────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Integration Point |
|-----------|---------------|-------------------|
| **TourProvider** (per screen) | Wraps screen content, manages tour state (running/stopped), persists completion to localStorage | Wraps App.tsx screen logic and PresentationView content |
| **InfoTooltip** | Renders info icon (ⓘ) + tooltip on hover/focus, manages aria-describedby | Inline next to features (buttons, controls, labels) |
| **useTourState** (hook) | Checks localStorage for tour completion, returns {hasSeenTour, markTourComplete, resetTour} | Called by TourProvider to determine auto-start vs manual trigger |
| **Tour Step Definitions** | Array of {target: CSS selector, content: string} for each screen | Defined in same file as screen component (co-located) |

## Integration Points with Existing Architecture

### 1. Landing/Editor Screen (App.tsx)

**Current structure:**
- Single monolithic App.tsx component (~27k tokens)
- State managed with useState hooks
- Screens switched via `appState` enum (INPUT, EDITOR, PRESENTATION)
- Modal pattern: conditional rendering with z-index layers

**Integration approach:**

```tsx
// In App.tsx (existing structure)
function App() {
  const [appState, setAppState] = useState<AppState>(AppState.INPUT);

  // NEW: Tour state
  const [showLandingTour, setShowLandingTour] = useState(false);
  const { hasSeenTour: hasSeenLandingTour, markTourComplete } = useTourState('landing');

  // Landing screen tour steps (co-located with screen)
  const landingTourSteps = [
    { target: '[data-tour="upload"]', content: 'Upload a PDF lesson plan here...' },
    { target: '[data-tour="settings"]', content: 'Configure AI provider...' },
    // ...
  ];

  // Render tour only in EDITOR state (landing + editor combined in App.tsx)
  if (appState === AppState.EDITOR) {
    return (
      <>
        <Joyride
          steps={landingTourSteps}
          run={showLandingTour}
          continuous
          showSkipButton
          callback={handleTourCallback}
          styles={{ options: { zIndex: 10000 } }} // Above modals (z-50)
        />
        {/* Existing editor UI */}
        <div className="header">
          <Button onClick={() => setShowLandingTour(true)}>
            <HelpCircle /> Tour
          </Button>
          {/* Existing buttons */}
        </div>
        {/* Slide thumbnails with InfoTooltip components */}
        <div data-tour="slide-thumbnails">
          <InfoTooltip content="Select slides with Shift+Click for range selection">
            <HelpCircle />
          </InfoTooltip>
        </div>
      </>
    );
  }
}
```

**Key integration points:**
- **Manual trigger button:** Add "?" button to existing header (next to settings/dark mode)
- **Tour target attributes:** Add `data-tour="..."` to existing elements (upload zones, settings button, Insert menu, thumbnail sidebar)
- **InfoTooltips:** Inline next to feature labels (no structural changes needed)
- **localStorage key:** `tourCompleted.landing` (matches existing localStorage pattern: `pipi-settings`, `pipi-autosave`)

### 2. Presentation Screen (PresentationView.tsx)

**Current structure:**
- PresentationView.tsx is large component (119k LOC) with:
  - Slide navigation controls
  - Teleprompter panel
  - Game controls
  - Ask AI panel
  - Connection status
- Uses createPortal for overlays (FloatingWindow.tsx pattern)
- Z-index layers: Toast (z-50), Modals (z-40), Preview window (z-9999)

**Integration approach:**

```tsx
// In PresentationView.tsx
const PresentationView: React.FC<Props> = ({ slides, onExit, ... }) => {
  // NEW: Tour state
  const [showPresentationTour, setShowPresentationTour] = useState(false);
  const { hasSeenTour, markTourComplete } = useTourState('presentation');

  const presentationTourSteps = [
    { target: '[data-tour="teleprompter"]', content: 'Your speaker notes appear here...' },
    { target: '[data-tour="student-window"]', content: 'Launch student view to projector...' },
    { target: '[data-tour="game-button"]', content: 'Start interactive quizzes...' },
    // ...
  ];

  return (
    <div className="presentation-view">
      <Joyride
        steps={presentationTourSteps}
        run={showPresentationTour}
        continuous
        showSkipButton
        callback={handleTourCallback}
        styles={{ options: { zIndex: 10000 } }} // Above floating preview (z-9999)
      />

      {/* Add tour trigger to teleprompter header */}
      <div className="teleprompter-header">
        <Button onClick={() => setShowPresentationTour(true)}>
          <HelpCircle size={16} /> Tour
        </Button>
        {/* Existing Ask AI dropdown, verbosity controls */}
      </div>

      {/* Add InfoTooltips to complex controls */}
      <div data-tour="targeted-mode" className="flex items-center gap-2">
        <label>Targeted Mode</label>
        <InfoTooltip content="AI selects students based on grade level">
          <HelpCircle size={14} />
        </InfoTooltip>
      </div>
    </div>
  );
};
```

**Key integration points:**
- **Manual trigger button:** Add to teleprompter panel header (next to Ask AI dropdown)
- **Tour target attributes:** Add to teleprompter, student window button, game controls, navigation controls
- **Z-index management:** Set Joyride z-index to 10000 (above floating preview at z-9999, above modals at z-40)
- **InfoTooltips:** Inline with complex controls (Targeted Mode toggle, Grade Level buttons, Verbosity selector)

### 3. Z-Index Hierarchy

Cue's existing z-index layers (from Toast.tsx, FloatingWindow.tsx):

```
z-9999: FloatingWindow (NextSlidePreview draggable window)
z-50:   Toast notifications
z-40:   Modals (SettingsModal, ExportModal)
z-10:   Dropdowns (ClassBankDropdown)

NEW layers:
z-10000: Joyride tour overlay (above all existing UI)
z-100:   InfoTooltip popups (below Joyride, above normal content)
```

**Anti-pattern to avoid:** Don't use lower z-index for tour overlay. React tour libraries need to render above modals, otherwise tour highlights won't work if user opens settings during tour.

## New Components Needed

### 1. InfoTooltip.tsx (NEW component)

**Purpose:** Reusable info icon (ⓘ) with accessible tooltip on hover/focus

**Interface:**
```tsx
interface InfoTooltipProps {
  content: string;              // Tooltip text (max 50 words)
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;   // Custom icon (defaults to HelpCircle)
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content, placement = 'top', children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();

  return (
    <span className="inline-flex items-center">
      <button
        type="button"
        aria-describedby={tooltipId}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      >
        {children || <HelpCircle size={16} />}
      </button>
      {isVisible && createPortal(
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute bg-slate-900 text-white text-sm px-3 py-2 rounded shadow-lg z-100"
          style={{ /* position calculated based on trigger bounds */ }}
        >
          {content}
          <div className="tooltip-arrow" /> {/* CSS triangle */}
        </div>,
        document.body
      )}
    </span>
  );
};
```

**Implementation notes:**
- Use createPortal for tooltip popup (matches FloatingWindow.tsx pattern)
- Calculate position dynamically using trigger element's getBoundingClientRect()
- Use aria-describedby (not aria-labelledby) per WCAG 2.1 guidelines
- Support Escape key to dismiss (matches existing modal pattern)
- Keep content under 50 words (UX best practice)

**Alternative:** Use react-tooltip library (5.30.0, 1979 projects using it) if positioning logic becomes complex. Trade-off: +3kB bundle size for robust positioning.

### 2. useTourState.ts (NEW hook)

**Purpose:** Persist tour completion state in localStorage

**Interface:**
```tsx
interface TourState {
  hasSeenTour: boolean;
  markTourComplete: () => void;
  resetTour: () => void;  // For testing
}

export function useTourState(screenName: 'landing' | 'presentation'): TourState {
  const storageKey = `pipi-tour-${screenName}`;
  const [hasSeenTour, setHasSeenTour] = useState(() => {
    return localStorage.getItem(storageKey) === 'true';
  });

  const markTourComplete = useCallback(() => {
    localStorage.setItem(storageKey, 'true');
    setHasSeenTour(true);
  }, [storageKey]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasSeenTour(false);
  }, [storageKey]);

  return { hasSeenTour, markTourComplete, resetTour };
}
```

**localStorage keys:**
- `pipi-tour-landing` (boolean)
- `pipi-tour-presentation` (boolean)

Matches existing pattern: `pipi-settings`, `pipi-autosave`, `pipi-class-bank`.

### 3. Tour Step Definitions (co-located, NOT separate components)

**Anti-pattern:** Don't create a separate TourSteps.tsx file with all tour definitions.

**Recommended pattern:** Define steps in same file as screen component for maintainability.

```tsx
// In App.tsx (landing/editor tour)
const LANDING_TOUR_STEPS: Step[] = [
  {
    target: '[data-tour="upload-lesson"]',
    content: 'Upload a PDF lesson plan to generate slides with AI',
    disableBeacon: true, // No pulsing beacon (auto-start only on first visit)
  },
  {
    target: '[data-tour="settings-button"]',
    content: 'Configure your AI provider (Gemini or Claude) and API key',
  },
  {
    target: '[data-tour="verbosity-selector"]',
    content: 'Choose speaker note detail level: Concise, Standard, or Detailed',
  },
  {
    target: '[data-tour="insert-menu"]',
    content: 'Insert custom slides: Blank, Exemplar, Elaborate, Work Together, or Class Challenge',
  },
  {
    target: '[data-tour="slide-thumbnails"]',
    content: 'Select slides with Shift+Click for range selection. Export selected slides as Working Wall posters.',
  },
];

// In PresentationView.tsx (presentation tour)
const PRESENTATION_TOUR_STEPS: Step[] = [
  {
    target: '[data-tour="teleprompter"]',
    content: 'Your speaker notes appear here. Only you see these—students see slides only.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="student-window-button"]',
    content: 'Launch student view to projector or external display. Chromium browsers auto-detect projectors.',
  },
  {
    target: '[data-tour="targeted-mode"]',
    content: 'Targeted Mode cycles through students by grade level. Manual mode lets you pick anyone.',
  },
  {
    target: '[data-tour="game-menu"]',
    content: 'Start interactive quiz games: Quick Quiz, Millionaire, or Beat the Chaser',
  },
  {
    target: '[data-tour="ask-ai"]',
    content: 'Ask AI questions during presentation. Only you see responses—not synced to students.',
  },
];
```

**Why co-locate:** When UI changes (e.g., button moves to new location), developer sees tour step in same file and updates target selector. Reduces stale tour steps.

## State Management Approach

### Tour State (per screen)

**Pattern:** Component-local state with localStorage persistence

```tsx
// In App.tsx
const [isTourRunning, setIsTourRunning] = useState(false);
const { hasSeenTour, markTourComplete } = useTourState('landing');

// Manual trigger
const handleStartTour = () => setIsTourRunning(true);

// Joyride callback
const handleTourCallback = (data: CallbackProps) => {
  const { status } = data;
  if (status === 'finished' || status === 'skipped') {
    setIsTourRunning(false);
    markTourComplete(); // Persist to localStorage
  }
};
```

**Why not global context:** Each screen has independent tour state. No need for shared context since tours don't span multiple screens (user goes landing → editor → presentation linearly, not back and forth during tour).

### Tooltip State (per instance)

**Pattern:** Component-local state (no persistence needed)

```tsx
// In InfoTooltip.tsx
const [isVisible, setIsVisible] = useState(false);

// Show on hover/focus
onMouseEnter={() => setIsVisible(true)}
onFocus={() => setIsVisible(true)}

// Hide on leave/blur/Escape
onMouseLeave={() => setIsVisible(false)}
onBlur={() => setIsVisible(false)}
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsVisible(false);
  };
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, []);
```

**Why not global state:** Tooltips are ephemeral UI. No need to track "which tooltip is open" globally. Only one tooltip visible at a time (browser hover behavior).

## Data Flow

### Tour Initialization Flow

```
1. Screen component mounts (App.tsx or PresentationView.tsx)
   └─> useTourState() hook checks localStorage
       ├─> hasSeenTour === true → Don't auto-start, wait for manual trigger
       └─> hasSeenTour === false → Auto-start tour on mount (optional)

2. User clicks "Tour" button
   └─> setIsTourRunning(true)
       └─> Joyride component run={true} → Tour starts

3. User completes or skips tour
   └─> Joyride callback fires with status 'finished' or 'skipped'
       ├─> setIsTourRunning(false)
       └─> markTourComplete() → localStorage.setItem('pipi-tour-{screen}', 'true')
```

### Tooltip Interaction Flow

```
1. User hovers over info icon (ⓘ)
   └─> onMouseEnter → setIsVisible(true)
       └─> createPortal renders tooltip at calculated position
           └─> Tooltip visible in document.body (z-100)

2. User moves mouse away
   └─> onMouseLeave → setIsVisible(false)
       └─> Tooltip unmounts

3. Keyboard user tabs to info icon
   └─> onFocus → setIsVisible(true) (same as hover)

4. User presses Escape or tabs away
   └─> onBlur or keydown Escape → setIsVisible(false)
```

## Build Order (Suggested Phases)

### Phase 1: Foundation (Day 1)

**Goal:** Tooltip infrastructure without tours

1. Install dependencies: `npm install react-joyride` (for later), no tooltip library yet (custom InfoTooltip)
2. Create `components/InfoTooltip.tsx` (basic hover tooltip, no portal yet)
3. Create `hooks/useTourState.ts` (localStorage persistence hook)
4. Add 2-3 InfoTooltips to App.tsx (test rendering, positioning)

**Validation:** Tooltips render on hover, accessible via keyboard focus, Escape dismisses.

### Phase 2: Landing/Editor Tour (Days 2-3)

**Goal:** Working tour on landing/editor screen

1. Add `data-tour="..."` attributes to 5-8 key elements in App.tsx:
   - Upload zones (`data-tour="upload-lesson"`, `data-tour="upload-ppt"`)
   - Settings button (`data-tour="settings-button"`)
   - Insert menu (`data-tour="insert-menu"`)
   - Slide thumbnail area (`data-tour="slide-thumbnails"`)
   - Export button (`data-tour="export-button"`)

2. Define LANDING_TOUR_STEPS array in App.tsx (co-located with component)

3. Add Joyride component to App.tsx editor view:
   ```tsx
   <Joyride
     steps={LANDING_TOUR_STEPS}
     run={isTourRunning}
     continuous
     showSkipButton
     showProgress
     callback={handleTourCallback}
     styles={{ options: { zIndex: 10000 } }}
   />
   ```

4. Add "Tour" button to editor header (next to settings)

5. Test tour flow: manual trigger → step through → completion → localStorage persists

**Validation:** Tour highlights correct elements, localStorage prevents auto-restart, manual trigger works.

### Phase 3: Presentation Tour (Days 4-5)

**Goal:** Working tour on presentation screen

1. Add `data-tour="..."` attributes to PresentationView.tsx:
   - Teleprompter panel (`data-tour="teleprompter"`)
   - Student window button (`data-tour="student-window-button"`)
   - Game menu button (`data-tour="game-menu"`)
   - Targeted mode toggle (`data-tour="targeted-mode"`)
   - Ask AI dropdown (`data-tour="ask-ai"`)
   - Navigation controls (`data-tour="navigation"`)

2. Define PRESENTATION_TOUR_STEPS array in PresentationView.tsx

3. Add Joyride component to PresentationView.tsx (same pattern as Phase 2)

4. Add "Tour" button to teleprompter header

5. Test tour with existing presentation features (don't break game state, Ask AI, etc.)

**Validation:** Tour works alongside existing features (games, Ask AI, verbosity changes).

### Phase 4: Refinement (Days 6-7)

**Goal:** Polish UX and add remaining tooltips

1. Add InfoTooltips to 10-15 features across both screens:
   - Verbosity selector (what each level means)
   - Targeted mode (how it works)
   - Grade level buttons (what A/B/C/D/E represent)
   - Insert menu options (when to use each)
   - Export modal modes (Quick vs AI Poster)

2. Refine tour step content (under 50 words each, focus on "why" not "what")

3. Test accessibility:
   - Keyboard navigation (Tab to info icons, Space/Enter to focus)
   - Screen reader announcements (aria-describedby reads tooltip content)
   - Escape key dismisses tooltips

4. Test z-index conflicts:
   - Open modal during tour (tour should still be visible)
   - Open tooltip with floating preview visible (tooltip should be below preview)

5. Test localStorage edge cases:
   - Clear localStorage → tour auto-starts (if enabled)
   - Complete tour → refresh page → manual trigger only

**Validation:** All tooltips accessible, tours don't conflict with existing modals/overlays.

## Patterns to Follow

### Pattern 1: Co-located Tour Steps

**What:** Define tour steps in same file as screen component
**When:** Always (for maintainability)
**Example:**
```tsx
// In PresentationView.tsx (NOT in separate TourSteps.tsx)
const PRESENTATION_TOUR_STEPS: Step[] = [
  { target: '[data-tour="teleprompter"]', content: '...' },
];

const PresentationView: React.FC = () => {
  // Component logic with tour steps in same file
};
```
**Why:** When UI changes (e.g., teleprompter moves), developer updates tour step in same file. Reduces stale selectors.

### Pattern 2: data-tour Attributes

**What:** Use semantic data-tour attributes instead of CSS classes for tour targets
**When:** Always (for stability)
**Example:**
```tsx
// GOOD: Semantic attribute, won't break if styling changes
<button data-tour="settings-button" className="btn-primary">Settings</button>

// BAD: Tour breaks if class renamed for styling
<button className="settings-btn">Settings</button> // tour targets '.settings-btn'
```
**Why:** Decouples tour selectors from styling classes. If button changes from `btn-primary` to `btn-secondary`, tour still works.

### Pattern 3: createPortal for Tooltips

**What:** Render tooltip popup in document.body using createPortal (not inline)
**When:** Always (for z-index control)
**Example:**
```tsx
// In InfoTooltip.tsx
return (
  <>
    <button onMouseEnter={...}>{icon}</button>
    {isVisible && createPortal(
      <div className="tooltip">{content}</div>,
      document.body
    )}
  </>
);
```
**Why:** Inline tooltips inherit parent's overflow:hidden or z-index stacking context. Portal renders at document root, avoiding clipping issues. Matches FloatingWindow.tsx pattern.

### Pattern 4: Per-Screen Tour State

**What:** Each screen manages its own tour state (not global context)
**When:** Tours don't span multiple screens
**Example:**
```tsx
// In App.tsx
const [isLandingTourRunning, setIsLandingTourRunning] = useState(false);

// In PresentationView.tsx (separate state)
const [isPresentationTourRunning, setIsPresentationTourRunning] = useState(false);
```
**Why:** Simpler than global context. User goes landing → editor → presentation linearly, not back and forth during tour.

### Pattern 5: Manual Trigger by Default

**What:** Don't auto-start tours, require manual click on "Tour" button
**When:** Most use cases (to avoid annoying users)
**Exception:** First-time users could auto-start on landing page (check hasSeenTour)
**Example:**
```tsx
const { hasSeenTour } = useTourState('landing');

// Option A: Manual only (recommended)
<Button onClick={() => setIsTourRunning(true)}>Tour</Button>

// Option B: Auto-start first time, manual after
useEffect(() => {
  if (!hasSeenTour) setIsTourRunning(true);
}, [hasSeenTour]);
```
**Why:** Users prefer to explore on their own terms. Auto-start tours are often skipped immediately. Manual trigger respects user agency.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Global Tour Orchestrator

**What goes wrong:** Creating a single TourOrchestrator component that manages all tours globally
**Why it's bad:**
- Tight coupling between screens
- Hard to test tours independently
- Tour state logic far from screen UI logic
**Prevention:** Keep tour state local to each screen component
**Detection:** If you see `<TourOrchestrator currentScreen={appState}>`, refactor to per-screen tours

### Anti-Pattern 2: CSS Class Selectors for Tour Targets

**What goes wrong:** Tour targets elements by CSS class: `target: '.btn-primary'`
**Why it's bad:**
- Tour breaks when styling changes (class renamed for design)
- Ambiguous targets (multiple buttons with same class)
**Prevention:** Always use semantic data-tour attributes
**Detection:** If tour steps have `target: '.className'` or `target: '#id'`, add data-tour attributes instead

### Anti-Pattern 3: Long Tour Steps (>50 words)

**What goes wrong:** Tour step content explains every detail of a feature
**Why it's bad:**
- Users skip long text
- Feels like a lecture, not guidance
- Slows down onboarding flow
**Prevention:** Keep steps under 50 words, focus on "why" not "what"
**Detection:** If tooltip content has 3+ sentences or explains implementation details, simplify

### Anti-Pattern 4: Interactive Content in Tooltips

**What goes wrong:** Tooltip contains links, buttons, or input fields
**Why it's bad:**
- Tooltips never receive focus (WCAG violation)
- Keyboard users can't access interactive elements
- Tooltips should be simple descriptions, not mini-modals
**Prevention:** Use a modal or popover for interactive content
**Detection:** If tooltip JSX contains `<button>`, `<input>`, or `<a>`, refactor to modal

### Anti-Pattern 5: Ignoring Z-Index Hierarchy

**What goes wrong:** Tour overlay has lower z-index than modals (z-40)
**Why it's bad:**
- Tour highlights don't appear above modal content
- User opens settings during tour → tour disappears
**Prevention:** Set Joyride z-index to 10000 (above all existing UI)
**Detection:** Open a modal during tour. If tour overlay disappears, increase z-index.

### Anti-Pattern 6: Not Supporting Keyboard Navigation

**What goes wrong:** Tooltips only appear on mouse hover (no focus support)
**Why it's bad:**
- Keyboard users (accessibility) can't access tooltips
- WCAG 2.1 violation (Content on Hover or Focus)
**Prevention:** Add onFocus/onBlur handlers to tooltip triggers
**Detection:** Tab through UI with keyboard. If tooltips don't appear on focus, add keyboard support.

### Anti-Pattern 7: Tooltip Disappears Too Quickly

**What goes wrong:** Tooltip dismisses when mouse moves slightly (no hover tolerance)
**Why it's bad:**
- Users can't read content before it vanishes
- WCAG 2.1 violation (1.4.13: content must be persistent)
**Prevention:** Allow hovering over tooltip content without dismissing
**Detection:** Hover tooltip, move mouse toward tooltip. If it vanishes before reaching content, add hover tolerance.

## Scalability Considerations

| Concern | Current (v3.6) | Future Growth | Notes |
|---------|----------------|---------------|-------|
| **Number of tours** | 2 screens (landing, presentation) | Could add 3rd screen (setup wizard) | Per-screen pattern scales linearly. No refactor needed for 3rd tour. |
| **Number of tooltips** | ~15 total (5-8 per screen) | Could grow to 30+ as features added | InfoTooltip is lightweight (<100 LOC). No perf concerns up to 50+ instances. |
| **Tour step updates** | Manual (edit step content in code) | Could externalize to JSON if non-devs edit | Co-located steps in code preferred for v3.6. JSON file adds complexity without clear benefit. |
| **Localization** | English only | Multi-language support | Tour steps and tooltip content would need i18n wrapper. React-i18next pattern. Not a concern for v3.6. |
| **Analytics** | None (localStorage only) | Track tour completion rate, skip rate | Joyride callback can send events to analytics service. Add in future milestone if needed. |

## Testing Strategy

### Unit Tests (if time permits)

**InfoTooltip.tsx:**
- Renders tooltip on hover
- Renders tooltip on focus (keyboard)
- Dismisses on Escape key
- Uses aria-describedby for association

**useTourState.ts:**
- Reads localStorage on mount
- Writes to localStorage on markTourComplete()
- Clears localStorage on resetTour()

### Integration Tests (manual, priority)

**Landing Tour:**
1. First visit → Manual trigger only (no auto-start)
2. Click "Tour" button → Tour starts at first step
3. Click through all steps → Tour completes
4. Refresh page → Tour doesn't auto-start (localStorage persists)
5. Clear localStorage → (Optional) Tour auto-starts

**Presentation Tour:**
1. Enter presentation mode → Manual trigger only
2. Click "Tour" button in teleprompter → Tour starts
3. Open modal during tour → Tour overlay remains visible (z-index correct)
4. Complete tour → Refresh → Tour doesn't auto-start

**Tooltips:**
1. Hover info icon → Tooltip appears after brief delay
2. Move mouse away → Tooltip dismisses
3. Tab to info icon → Tooltip appears (keyboard accessible)
4. Press Escape → Tooltip dismisses
5. Multiple tooltips → Only one visible at a time (browser hover behavior)

### Accessibility Tests (manual)

**Keyboard navigation:**
- Tab through UI → Info icons focusable
- Space/Enter on info icon → Tooltip appears
- Escape key → Tooltip dismisses

**Screen reader:**
- Focus info icon → Screen reader announces button + aria-describedby content
- Tour running → Screen reader announces tour step content

## Dependencies

### New npm Packages

| Package | Version | Size (minified) | Purpose | License |
|---------|---------|-----------------|---------|---------|
| **react-joyride** | ^2.9.2 | ~15 kB | Tour overlay, step management, callbacks | MIT |

**Decision:** No tooltip library needed initially. Custom InfoTooltip component is ~100 LOC and avoids 3kB bundle increase from react-tooltip. Can add react-tooltip later if positioning logic becomes complex.

### Existing Dependencies (no changes)

Cue already has:
- React 19 (createPortal, useId)
- Tailwind CSS (tooltip styling)
- TypeScript (type safety for tour steps)

## Implementation Checklist

### Phase 1: Foundation
- [ ] Install react-joyride: `npm install react-joyride`
- [ ] Create `components/InfoTooltip.tsx` (basic hover tooltip)
- [ ] Create `hooks/useTourState.ts` (localStorage persistence)
- [ ] Add 2-3 InfoTooltips to App.tsx (test rendering)
- [ ] Test keyboard accessibility (Tab, Escape)

### Phase 2: Landing/Editor Tour
- [ ] Add data-tour attributes to 5-8 elements in App.tsx
- [ ] Define LANDING_TOUR_STEPS array in App.tsx
- [ ] Add Joyride component to editor view
- [ ] Add "Tour" button to editor header
- [ ] Test tour flow (start → complete → persist)

### Phase 3: Presentation Tour
- [ ] Add data-tour attributes to PresentationView.tsx (6+ elements)
- [ ] Define PRESENTATION_TOUR_STEPS array in PresentationView.tsx
- [ ] Add Joyride component to presentation view
- [ ] Add "Tour" button to teleprompter header
- [ ] Test tour with existing features (games, Ask AI)

### Phase 4: Refinement
- [ ] Add InfoTooltips to 10-15 features across both screens
- [ ] Refine tour step content (under 50 words per step)
- [ ] Test accessibility (keyboard, screen reader)
- [ ] Test z-index conflicts (modals during tour)
- [ ] Test localStorage edge cases (clear → auto-start)

## Sources

### HIGH Confidence (Official Documentation)
- [React Joyride Official Docs](https://docs.react-joyride.com) - Integration steps, API reference
- [React Joyride GitHub](https://github.com/gilbarbara/react-joyride) - 340k+ weekly downloads, 4.3k stars
- [W3C ARIA Tooltip Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) - Accessibility guidelines
- [MDN ARIA Tooltip Role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/tooltip_role) - aria-describedby usage
- [WCAG 2.1 Success Criterion 1.4.13](https://sarahmhigley.com/writing/tooltips-in-wcag-21/) - Content on Hover or Focus requirements

### MEDIUM Confidence (Industry Best Practices, 2026)
- [React Product Tour Libraries Comparison 2026](https://whatfix.com/blog/react-onboarding-tour/) - Library comparison, feature matrix
- [React Onboarding Best Practices 2026](https://onboardjs.com/blog/5-best-react-onboarding-libraries-in-2025-compared) - UX patterns, anti-patterns
- [React Tooltip Libraries 2026](https://userguiding.com/blog/react-tooltip) - Lightweight options, bundle sizes
- [React Portals for Z-Index Management](https://tiwarivikas.medium.com/understanding-portal-rendering-in-react-447d2b24fcb7) - Portal pattern for overlays
- [Accessible Tooltips Revisited](https://medium.com/ecovadis-engineering/accessible-tooltips-revisited-e55e1d9214b0) - WCAG compliance patterns

### LOW Confidence (Community Insights, Needing Validation)
- [React Onboarding Anti-Patterns](https://userguiding.com/blog/react-onboarding-tour) - Common mistakes (WebSearch only)
- [Z-Index Conflicts in React](https://coder-coder.com/z-index-isnt-working/) - Stacking context issues (general, not React-specific)

---

**End of Architecture Research**
**Next Step:** Use this document to create roadmap phases with specific tasks and integration points.
