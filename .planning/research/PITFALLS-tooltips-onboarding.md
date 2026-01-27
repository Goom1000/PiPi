# Pitfalls Research: Onboarding Tours & Tooltips for Existing React App

**Domain:** Adding onboarding/tooltip features to complex presentation software
**Project:** Cue v3.6 - Tooltips & Onboarding
**Researched:** 2026-01-27
**Confidence:** MEDIUM-HIGH (cross-verified with authoritative sources + technical documentation)

## Executive Summary

Adding tooltips and onboarding tours to an existing feature-rich React app (20,000+ LOC) introduces seven critical pitfall areas: (1) Tour fatigue from showing everything at once overwhelms teachers and guarantees skips; (2) Integration conflicts with existing z-index stacks (modals, portals, overlays) break visual hierarchy; (3) Accessibility gaps exclude keyboard-only and screen reader users, violating WCAG 2.1; (4) Mobile/touch interaction failures render hover-based tooltips unusable; (5) Performance degradation from eagerly loading dozens of tooltips; (6) Tour timing disasters interrupt active workflows instead of helping; (7) State management conflicts corrupt existing app state when tours track progress. Each pitfall includes detection warning signs, actionable prevention strategies, and phase-specific recommendations.

---

## Critical Pitfalls

### 1. The Feature Parade (Tour Fatigue)

**What goes wrong:** Onboarding tour tries to show every feature in Cue (PDF upload, AI generation, verbosity levels, game modes, poster export, Ask AI, teleprompter, student sync, etc.) in a single session. Teacher clicks "Take Tour" on landing page, sits through 15+ steps, gets overwhelmed, skips to the end, and never learns anything useful.

**Why it happens:** Product teams conflate "onboarding" with "feature documentation." Developers want to showcase months of work. The impulse is to explain everything the app can do rather than help the user accomplish one meaningful goal.

**Research finding:** "Almost 80% of users skip product tours when there are more than 5 steps." ([Product Fruits Blog](https://productfruits.com/blog/common-user-onboarding-mistakes/)) "A long, boring, irrelevant product tour is a surefire way to turn users off your product, as users won't be able to handle the bombardment of information." ([UserGuiding Blog](https://userguiding.com/blog/onboarding-ux))

**Consequences:**
- Teachers skip tour immediately and explore on their own (tour adds no value)
- Teachers sit through entire tour, forget 90% of it, ask "how do I...?" minutes later
- Tour becomes a mandatory chore ("I have to watch this?") instead of helpful guide
- Feature discovery rate doesn't improve despite tour implementation

**Warning signs:**
- Tour has >5 steps for a single screen
- Tour script includes phrases like "You can also..." or "Another feature is..."
- Tour completion rate <30% in analytics
- User testing shows subjects checking phone or saying "when does this end?"
- Tour tries to explain features the user hasn't asked for yet

**Prevention:**

1. **3-5 steps maximum per screen tour** - Landing page tour: "Upload PDF → Select grade → Generate." Editor tour: "Edit slide → Preview → Present." Presentation tour: "Navigate slides → Use teleprompter → Launch student view."

2. **Focus on immediate value, not comprehensive coverage** - Show the minimum viable path to first success (get slides on screen), not all possible features.

3. **Progressive disclosure via contextual tours** - Don't show Working Wall Export until user has selected slides. Don't show Ask AI until they're in presentation mode. Trigger mini-tours (1-3 steps) when user activates a feature for the first time.

4. **Design for skipping** - Make tours easily dismissible. Add "Skip Tour" button prominently. Save progress if they close mid-tour. Never force completion.

5. **Value-oriented language** - Instead of "This is the verbosity selector," say "Change verbosity to adjust how much detail you speak to students." Focus on outcomes, not UI elements.

6. **Per-screen tours, not app-wide marathon** - Manual trigger button on each major screen (Landing, Editor, Presentation Mode). Each tour is independently useful and completable in <60 seconds.

**Phase recommendation:** Enforce 3-5 step limit during tour design phase. User testing should validate completion rate >60% before shipping.

---

### 2. Z-Index Warfare (Visual Stacking Conflicts)

**What goes wrong:** Tooltips appear behind modals. Tour spotlights fail to highlight elements inside portalled overlays. Onboarding overlay accidentally covers the "Next" button. Settings modal z-index conflicts with tour backdrop. Export modal hides tooltip explaining the AI Poster option.

**Why it happens:** Cue already has complex z-index architecture: Settings modal (portalled), Export modal (portalled), floating preview window (z-index 9999), Ask AI dropdown, game overlays, student sync banners. Adding a third-party tour library introduces another z-index layer. **Portalled tooltips are placed at end of `<body>` and cannot be styled with instance-specific z-index.**

**Research finding:** "Using a portalled tooltip in an overlay or modal that has a z-index means the tooltip gets positioned behind the modal. This is a frequently encountered problem across different UI frameworks." ([Radix Primitives Issue #368](https://github.com/radix-ui/primitives/issues/368)) "We utilize a default z-index scale in Bootstrap that's been designed to properly layer navigation, tooltips and popovers, modals, and more." ([Bootstrap v5.2 Docs](https://getbootstrap.com/docs/5.2/layout/z-index/))

**Consequences:**
- Tour becomes visually broken, users see "phantom" highlights in wrong places
- Tooltips invisible during modal interactions (when users need them most)
- Tour backdrop covers interactive elements, trapping users
- Users report "tour is glitchy" and abandon it

**Warning signs:**
- Tooltip appears but is invisible (rendered behind modal)
- Tour highlight spotlight misses target element by 100+ pixels
- "Next" button in tour UI is unclickable
- Console errors: `z-index: NaN` or positioning warnings
- Tour works on Landing page but breaks in Presentation mode

**Prevention:**

1. **Establish global z-index scale** - Document existing z-index values:
   ```
   Base app: 0
   Dropdowns/tooltips: 1000
   Fixed headers: 5000
   Modals: 8000
   Floating preview: 9999
   Tour/onboarding layer: 10000+
   ```

2. **Choose tour library with configurable z-index** - React Joyride, Driver.js allow setting z-index for spotlight/overlay. Set tour layer to 10000+ to ensure it floats above all existing UI.

3. **Test inside modals explicitly** - Don't just test tours on main screens. Test:
   - Tooltip inside Settings modal
   - Tour that explains Export modal options
   - Tooltip on Ask AI dropdown (header-level portal)
   - Tour during active game state (game overlays active)

4. **Portal-aware tooltip placement** - If using React Tooltip or similar, ensure tooltips render in a portal at document root with explicit z-index matching tour layer.

5. **Avoid tour steps inside portalled content** - Simplify by explaining "Click Settings" rather than highlighting specific settings inside the modal. Reduces z-index complexity.

6. **CSS custom properties for z-index** - Define z-index scale as CSS variables:
   ```css
   :root {
     --z-tooltip: 1000;
     --z-modal: 8000;
     --z-tour: 10000;
   }
   ```
   Ensures consistency across tour library and app components.

**Phase recommendation:** Architecture design phase must map all existing z-index usage. Integration testing phase must verify tours work inside every modal/portal/overlay in the app.

---

### 3. Accessibility Black Holes (WCAG 2.1 Violations)

**What goes wrong:** Keyboard-only users cannot access tooltips (hover-only triggers). Screen reader users hear "button" with no explanation of what it does. Tab order during tour is illogical. Focus trap inside tour modal prevents escape. Teachers with motor disabilities cannot complete tours.

**Why it happens:** Tooltips and tours are often designed for mouse users only. Hover states don't exist on keyboards. Default implementations ignore WCAG 2.1 requirements. Developers test with mouse, ship without keyboard testing.

**Research finding:** "All interactive elements – like buttons, links, and form fields – can be accessed in a logical sequence by pressing the Tab key." "Keyboard traps occur when an element can be navigated to with a keyboard but not navigated away from." ([WCAG 2.1.1 Keyboard Accessibility](https://www.uxpin.com/studio/blog/wcag-211-keyboard-accessibility-explained/)) "All screen reader interaction is keyboard-based, with VoiceOver, JAWS, and NVDA users navigating entirely through keyboard commands." ([WebAIM Keyboard Accessibility](https://webaim.org/techniques/keyboard/))

**Consequences:**
- Features are unusable for keyboard-only users (10-15% of users)
- Screen reader users cannot understand UI (violation of accessibility law in many regions)
- Teachers with disabilities cannot use the onboarding system
- School district procurement may reject app due to accessibility non-compliance
- Legal risk if app is used in government-funded schools

**Warning signs:**
- Tooltip only appears on mouse hover, not on focus
- Tab key skips over tour UI elements
- No visible focus indicator on "Next" button in tour
- Screen reader announces "button" without explaining purpose
- Escape key doesn't close tooltip/tour
- Tour automatically advances without user control

**Prevention:**

1. **Keyboard-accessible tooltips** - Trigger on both hover and focus:
   ```jsx
   <button
     aria-describedby="tooltip-id"
     onMouseEnter={showTooltip}
     onFocus={showTooltip}
     onMouseLeave={hideTooltip}
     onBlur={hideTooltip}
   >
   ```

2. **Proper ARIA labels** - Every tooltip must have meaningful aria-describedby. Every tour step must announce its purpose to screen readers:
   ```jsx
   <div role="dialog" aria-label="Onboarding tour: Step 2 of 5">
   ```

3. **Logical tab order** - Tour overlay must maintain focus management. When tour modal opens, focus moves to modal. Tab cycles through tour controls (Skip, Back, Next). Escape closes tour and returns focus to trigger element.

4. **Visible focus indicators** - High-contrast focus rings on all interactive elements. Minimum 3:1 contrast ratio per WCAG 2.1.

5. **Keyboard navigation for tours** - Support arrow keys or Tab to navigate tour steps. Enter/Space to activate "Next" button. Escape to exit.

6. **No hover-only information** - If tooltip is critical, provide alternative access method (info icon that's clickable/focusable).

7. **Skip link for tours** - Allow keyboard users to skip directly to main content instead of tabbing through entire tour.

**Testing protocol:**
- Unplug mouse, complete full workflow with keyboard only
- Use screen reader (NVDA on Windows, VoiceOver on Mac) to navigate tour
- Verify all tooltips accessible via Tab key
- Check that focus never gets "trapped" in tour UI

**Phase recommendation:** Accessibility requirements must be defined before implementation. Every PR must include keyboard-only testing. Consider hiring accessibility consultant for audit before launch.

---

### 4. Mobile/Touch Interaction Failure

**What goes wrong:** Teacher tries to use Cue on iPad. Hovers don't exist. Tooltips never appear. Tour UI requires mouse precision to click tiny "Next" buttons. Pinch-to-zoom conflicts with tour overlay. Teacher on tablet gives up.

**Why it happens:** "Tooltips are usually designed solely with desktop users in mind, and the same definition when applied to mobile devices does not work well. You need to use a mouse or other pointing device to use a tooltip which excludes keyboard and touch screen users." ([Cieden UX Issues](https://cieden.com/book/atoms/tooltip/tooltip-ux-issues))

**Research finding:** Educational users increasingly access tools from phones or tablets. "Many EdTech users access tools from phones or tablets." ([Vocal Media React Native Tooltips](https://vocal.media/journal/react-native-tooltip-implementation-tips-and-best-practices-2026))

**Consequences:**
- Tooltips completely broken on touch devices (no hover state)
- Tour UI buttons too small to tap accurately (< 44x44px touch target)
- Teachers using iPads in classroom cannot access help
- Gesture conflicts (swipe to close vs. swipe to next slide)

**Warning signs:**
- Tooltip only triggers on hover (no click alternative)
- Tour "Next" button < 44x44 pixels
- Testing only performed on desktop Chrome
- Touch targets overlap (tooltip close X too close to slide content)
- No mobile viewport testing

**Prevention:**

1. **Click/tap triggers for tooltips** - On touch devices, tooltips should trigger on tap (not hover). Tapping outside tooltip should close it:
   ```jsx
   const isTouchDevice = 'ontouchstart' in window;
   const triggerEvent = isTouchDevice ? 'onClick' : 'onMouseEnter';
   ```

2. **44x44px minimum touch targets** - WCAG 2.1 Success Criterion 2.5.5: "The size of the target for pointer inputs is at least 44 by 44 CSS pixels." Apply to all tour buttons (Next, Skip, Close), info icons, tooltip close buttons.

3. **Long-press alternative to hover** - Consider long-press (500ms) to show tooltip on mobile instead of requiring click.

4. **Responsive tour UI** - Tour modal should use full-width layout on mobile (<768px), centered modal on desktop. Button sizing should scale appropriately.

5. **Gesture conflict resolution** - If app uses swipe gestures, ensure tour overlay intercepts touch events to prevent accidental navigation during tour.

6. **Mobile-specific tour content** - Consider abbreviated tour steps on mobile (fewer words, larger visuals).

7. **Test on actual devices** - Simulator testing is insufficient. Test on:
   - iPad (Safari, Chrome)
   - Android tablet
   - iPhone (small screen constraints)

**Phase recommendation:** Mobile testing must be part of acceptance criteria. Consider mobile-first tour design since many teachers use tablets in classroom.

---

### 5. Performance Degradation (Eager Loading)

**What goes wrong:** Landing page loads 15 tooltip components immediately (one per feature). Editor screen loads 30+ tooltips (one per toolbar button). React renders all tooltip content on mount even though 99% never get shown. Initial bundle size increases by 50KB. Time to Interactive degrades by 400ms.

**Why it happens:** "The biggest mistake is eagerly loading dozens of tooltips on a single screen. This can bog down the initial render." ([Vocal Media React Native Implementation](https://vocal.media/journal/react-native-tooltip-implementation-tips-and-best-practices-2026))

**Research finding:** React Joyride is 498 KB unpacked, which "in practice, it's not a dealbreaker unless you are very performance-sensitive." ([Whatfix React Tour Libraries](https://whatfix.com/blog/react-onboarding-tour/)) However, for a 20,000 LOC app already loading PDF.js, PptxGenJS, html2pdf, html2canvas, adding heavyweight tour libraries can push initial load time past 3 seconds (user abandonment threshold).

**Consequences:**
- Slower initial page load (especially on slower connections/older devices)
- Increased memory usage (more React components in tree)
- Users perceive app as "slower" even though tours aren't shown
- Lighthouse performance score drops
- Teachers on school WiFi (notoriously slow) experience delays

**Warning signs:**
- Bundle size increases >100KB after adding tooltip library
- React DevTools shows 50+ Tooltip components mounted on page load
- Initial render time increases by >200ms
- Lighthouse Performance score drops below 90
- Time to Interactive > 3 seconds on 3G connection

**Prevention:**

1. **Lazy load tour library** - Code-split tour library and only load when user clicks "Take Tour":
   ```jsx
   const Tour = lazy(() => import('./components/Tour'));

   function LandingPage() {
     const [showTour, setShowTour] = useState(false);
     return showTour ? <Suspense fallback={null}><Tour /></Suspense> : null;
   }
   ```

2. **Conditional tooltip rendering** - Don't mount tooltip components until their trigger element is hovered/focused:
   ```jsx
   const [isOpen, setIsOpen] = useState(false);
   return (
     <>
       <button onMouseEnter={() => setIsOpen(true)}>Feature</button>
       {isOpen && <Tooltip>Explanation</Tooltip>}
     </>
   );
   ```

3. **Choose lightweight libraries** - Comparison:
   - React Joyride: 498 KB unpacked (feature-rich)
   - Driver.js: Lightweight, framework-agnostic
   - NextStepjs: Minimal bundle, zero dependencies beyond Motion
   - Walktour: Optimized for performance-conscious apps

4. **Limit tooltip density** - Not every button needs a tooltip. Prioritize:
   - Complex/non-obvious features (AI Poster Mode)
   - Infrequently used features (Elaborate Slide insertion)
   - Skip obvious features (Save, Load, Settings)

5. **Use native title attribute for simple cases** - For trivial tooltips ("Save presentation"), use native `title` attribute instead of React component (zero bundle cost).

6. **Monitor bundle size** - Add webpack-bundle-analyzer to CI. Fail build if tooltip additions increase bundle >50KB.

**Phase recommendation:** Performance budget defined in architecture phase. Lazy loading strategy must be implemented before adding first tooltip.

---

### 6. Workflow Interruption (Timing Disasters)

**What goes wrong:** Teacher uploads PDF on landing page. Tour auto-triggers immediately, blocking them from clicking "Generate Slides." Teacher dismisses tour, now they're annoyed. Next session, tour triggers again (state not persisted). Teacher in middle of presenting to class, tour tooltip appears "Did you know you can use Ask AI?" covering the teleprompter script.

**Why it happens:** "Most product tours fail because they focus on showing everything at once instead of guiding users step-by-step." "The app tour doesn't always have to happen immediately after account creation - for products with multiple functionalities, onboarding users to each feature as they progress through your product can be much more effective." ([Screeb Blog Why Tours Fail](https://screeb.app/blog/why-most-product-tours-fail-and-what-you-should-do-instead))

**Research finding:** "Introducing the entire suite of functions up-front, lest you overwhelm users - ask new users to complete a series of prioritized tasks step by step." ([Product Fruits Educational Platform Onboarding](https://productfruits.com/blog/educational-platform-onboarding-edtech)) "Teachers are busy and don't have time to explore - onboarding should focus on showing how your platform makes teaching easier, not just what it can do." ([Appcues EdTech Onboarding](https://www.appcues.com/blog/edtech-onboarding-examples))

**Consequences:**
- User actively trying to accomplish task, tour blocks them → frustration
- User in high-stakes situation (live teaching), tooltip appears → embarrassment
- User dismisses tour without learning, never returns → wasted development effort
- Tour becomes adversarial ("stop interrupting me") instead of helpful

**Warning signs:**
- Tour auto-triggers on every page load (no persistence of "dismissed" state)
- Tooltips appear during presentation mode (active teaching)
- Tour appears while user is mid-workflow (e.g., during slide editing)
- User testing subjects say "can I skip this?" within 5 seconds
- Tour completion rate <20%

**Prevention:**

1. **Manual trigger only (no auto-play)** - Tours should NEVER auto-trigger. Place prominent "Take Tour" button on each screen. Let user decide when they have time.

2. **Context-aware timing** - Don't show tooltips during:
   - Presentation mode (teacher is live with students)
   - Export process (user waiting for PDF)
   - AI generation (user watching slides appear)
   - Game mode (active quiz with students)

3. **Persist dismissal state** - Store in localStorage:
   ```js
   {
     "tours-dismissed": {
       "landing": true,
       "editor": false,
       "presentation": true
     },
     "tooltips-seen": ["ai-poster", "verbosity-selector"]
   }
   ```

4. **Progressive feature discovery** - Show tooltips/tours contextually:
   - First time user selects slides → show "Export for Working Wall" tooltip
   - First time user enters presentation mode → offer tour
   - First time user clicks Ask AI → show keyboard shortcut tooltip

5. **Dismissible and non-blocking** - Every tooltip/tour must have visible close button. Clicking outside should dismiss. Must not block primary actions.

6. **"Don't show again" option** - For recurring tooltips, provide checkbox: "Don't show this tooltip again."

7. **Onboarding checklist approach** - Instead of forced tours, show persistent checklist in header/sidebar:
   ```
   Getting Started:
   ☑ Upload first PDF
   ☑ Generate slides
   ☐ Try presentation mode [Take Tour]
   ☐ Export Working Wall poster
   ```
   User-controlled, shows progress, non-intrusive.

**Phase recommendation:** Tour trigger logic must be user-controlled in v1. Contextual auto-triggers only considered for v2 after observing user behavior analytics.

---

### 7. State Management Conflicts (Corrupted App State)

**What goes wrong:** Tour library introduces its own state management (tour step index, tooltip visibility, element highlighting). This conflicts with Cue's existing state (presentation mode, slide index, modal open state). Edge case: User triggers tour while Export modal is open. Tour highlight targets slide thumbnail. User clicks "Next" in tour, expects slide to advance, but tour advances instead. Keyboard shortcuts (arrow keys, Cmd+K) conflict between tour navigation and app navigation.

**Why it happens:** Tour libraries often manage their own state independently. When app already has complex state (React context, local state, BroadcastChannel sync), adding another state layer creates race conditions. Keyboard event listeners from tour library intercept events meant for app.

**Research finding:** "New contributors struggle to understand flows and onboarding slows when state management doesn't scale properly." "Critical data shared between modules can be maintained as a consistent data resource, reducing application errors and data conflicts." ([Vocal Media State Management Conflicts](https://vocal.media/journal/what-happens-when-app-state-management-stops-scaling-enough))

**Consequences:**
- Tour "current step" conflicts with slide "current index" (both use arrow keys)
- Tour dismissal doesn't restore previous focus (user loses place)
- BroadcastChannel messages during tour corrupt student view state
- LocalStorage keys collide (tour library uses same key as app)
- React re-renders trigger tour to reset unexpectedly

**Warning signs:**
- Console errors during tour: "Cannot read property X of undefined"
- Tour step advances when user presses arrow key meant for slide navigation
- Dismissing tour causes modal to close unexpectedly
- Tour state persists after component unmount
- Multiple tooltip instances render simultaneously (stale state)

**Prevention:**

1. **Namespace tour state separately** - Use distinct localStorage keys:
   ```js
   // App state
   localStorage.getItem('pipi-presentation-state')

   // Tour state (separate namespace)
   localStorage.getItem('cue-tours-state')
   ```

2. **Disable app keyboard shortcuts during tour** - When tour active, prevent arrow key slide navigation:
   ```jsx
   useEffect(() => {
     if (tourActive) {
       const preventNav = (e) => {
         if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
           e.stopPropagation();
         }
       };
       window.addEventListener('keydown', preventNav, { capture: true });
       return () => window.removeEventListener('keydown', preventNav, { capture: true });
     }
   }, [tourActive]);
   ```

3. **Focus management** - Tour library must restore focus to trigger element on dismiss:
   ```jsx
   const triggerRef = useRef<HTMLButtonElement>(null);

   function closeTour() {
     setTourActive(false);
     triggerRef.current?.focus(); // Restore focus
   }
   ```

4. **Avoid tour during critical state** - Disable tour triggers during:
   - Active presentation mode
   - Open modals (Settings, Export)
   - AI generation in progress
   - BroadcastChannel-synced game state

5. **Choose state-aware tour library** - React Joyride integrates with React state. Driver.js is framework-agnostic but requires manual state binding. Ensure library supports controlled mode (app controls state, library is view-only).

6. **Test edge cases explicitly** - QA checklist:
   - Start tour → open modal → close modal → continue tour
   - Start tour → navigate away → return → verify tour state
   - Start tour → refresh page → verify tour dismissed
   - Start tour → press arrow keys → verify app navigation disabled

**Phase recommendation:** State management integration plan required before library selection. Edge case testing must include all modal/navigation scenarios.

---

## Moderate Pitfalls

### 8. Design Inconsistency (Visual Discord)

**What goes wrong:** Tour library uses default styling (bright blue spotlights, white modals) that clashes with Cue's dark mode aesthetic. Tooltip component from react-tooltip library uses different fonts/colors than app's Tailwind design system. Users perceive onboarding as "third-party plugin" instead of integrated feature.

**Research finding:** "Misaligned design - Onboarding that looks/feels nothing like the actual app creates confusion and sets false expectations." ([Product Fruits Common Mistakes](https://productfruits.com/blog/common-user-onboarding-mistakes/))

**Warning signs:**
- Tour modal uses light theme while app is dark mode
- Tooltip font family doesn't match app (app uses Inter, tooltips use Arial)
- Spotlight color is bright blue (app uses green/teal accent)
- Button styles in tour don't match app buttons
- Users comment "this looks like a popup ad"

**Prevention:**

1. **Custom theme for tour library** - Most libraries support theming. React Joyride example:
   ```jsx
   <Joyride
     styles={{
       options: {
         backgroundColor: '#1a1a1a', // Match dark mode
         primaryColor: '#10b981', // Match app accent
         textColor: '#e5e7eb',
         arrowColor: '#1a1a1a',
       }
     }}
   />
   ```

2. **Use Tailwind classes for tooltips** - Choose tooltip library that supports custom classes:
   ```jsx
   <Tooltip className="bg-gray-800 text-gray-100 border border-gray-700">
   ```

3. **Match typography** - Ensure tour/tooltip text uses same font stack as app:
   ```css
   .tour-content {
     font-family: Inter, system-ui, sans-serif; /* Match app */
   }
   ```

4. **Consistent iconography** - Use same icon library (Heroicons?) for tour close buttons, info icons.

5. **Design system integration** - Add tour/tooltip components to design system documentation. Define standard styles.

**Phase recommendation:** Visual design audit after integration. Designer approval required before launch.

---

### 9. Over-Explanation (Tooltip Verbosity)

**What goes wrong:** Info icon tooltip next to "Verbosity" explains: "The verbosity setting controls the level of detail in the teleprompter script. Concise provides brief bullet points for experienced teachers. Standard offers moderate detail with context. Detailed includes comprehensive explanations and teaching suggestions. You can change verbosity per-slide or for the entire deck. Cached responses are preserved when switching levels." User needed 5 words ("Amount of detail in script"), got 50.

**Research finding:** "Users shouldn't have to read a mini-novel just to figure out what a button does. Lengthy tooltips are hard to read and take time to understand, thus contributing to an annoying experience." ([Cieden Tooltip Best Practices](https://cieden.com/book/atoms/tooltip/tooltip-design-best-practices))

**Warning signs:**
- Tooltip exceeds 2 lines of text
- Tooltip contains multiple sentences
- Tooltip explains implementation details instead of user benefit
- User testing shows subjects not reading full tooltip
- Tooltip has scroll bar

**Prevention:**

1. **15-word maximum** - Force brevity. Examples:
   - Bad: "The AI Poster Mode uses Claude's structured outputs to transform your selected slides into printable A4 posters optimized for classroom Working Wall displays with enhanced typography and subject-appropriate color schemes."
   - Good: "Transforms slides into printable classroom posters."

2. **Focus on user benefit, not mechanics** - Answer "why would I use this?" not "how does it work?"

3. **Use tours for complex features** - Tooltip = one-sentence explanation. Tour = multi-step walkthrough. Don't try to explain AI Poster Mode in a tooltip.

4. **Progressive detail** - Tooltip: "Change speech detail level." → Link: "Learn more" → Opens tour/help doc.

**Phase recommendation:** Copy review by UX writer. Enforce word limits in design specs.

---

### 10. Disabled Element Tooltips

**What goes wrong:** Export button is disabled (no slides selected). User hovers, expects tooltip explaining why it's disabled, but nothing appears. React tooltip library doesn't trigger on disabled elements because they don't fire mouse events.

**Research finding:** "By default disabled elements like `<button>` do not trigger user interactions so a Tooltip will not activate on normal events like hover. To accommodate disabled elements, add a simple wrapper element, such as a span." ([Material UI Tooltip](https://mui.com/material-ui/react-tooltip/))

**Warning signs:**
- Disabled buttons have no explanation for why they're disabled
- User testing shows confusion about grayed-out features
- Users click disabled buttons repeatedly

**Prevention:**

1. **Wrapper element pattern** - Wrap disabled buttons:
   ```jsx
   <span data-tooltip="Select slides first to enable export">
     <button disabled={!hasSelection}>Export</button>
   </span>
   ```

2. **Alternative: aria-disabled** - Use aria-disabled instead of disabled attribute:
   ```jsx
   <button
     aria-disabled={!hasSelection}
     onClick={hasSelection ? handleExport : undefined}
     className={!hasSelection ? 'opacity-50 cursor-not-allowed' : ''}
   >
   ```

3. **Contextual messaging** - Instead of tooltip, show inline message: "Select slides to enable export."

**Phase recommendation:** Address during component integration. Test all disabled states.

---

### 11. Tooltip/Modal Collision

**What goes wrong:** User opens Settings modal. Info icon inside modal has tooltip. Clicking icon shows tooltip, but it appears in wrong position (positioned relative to page, not modal). Or tooltip is cut off by modal bounds (overflow: hidden).

**Warning signs:**
- Tooltip appears in top-left corner of screen instead of near icon
- Tooltip text is cut off at modal edge
- Tooltip doesn't scroll with modal content

**Prevention:**

1. **Portal tooltips** - Render tooltips at document root, not inside modal:
   ```jsx
   import { createPortal } from 'react-dom';

   const tooltip = <div className="tooltip">{content}</div>;
   return createPortal(tooltip, document.body);
   ```

2. **Position calculations account for modal offset** - If modal is centered, tooltip positioning must account for modal's transform.

3. **Test inside every modal** - Settings, Export, game overlays, Ask AI dropdown.

**Phase recommendation:** Integration testing phase must cover all modals.

---

## Minor Pitfalls

### 12. Tour Step Numbering Confusion

**What goes wrong:** Tour shows "Step 3 of 5" but user has only seen 2 steps (conditional logic skipped step 2). Or tour shows "Step 5 of 5" but there are 6 steps total (off-by-one error).

**Prevention:**
- Use dynamic step counting based on actual steps shown
- Test with all feature flag combinations
- Avoid conditional tour steps if possible

---

### 13. Tooltip Flicker on Hover

**What goes wrong:** User hovers over info icon. Tooltip appears, covering the icon. Mouse is now over tooltip, not icon, so icon loses hover state, tooltip disappears. User moves mouse back to icon, tooltip reappears. Infinite flicker loop.

**Prevention:**
- Tooltip should not cover trigger element
- Add mouseleave delay (300ms) before hiding tooltip
- Tooltip should not intercept pointer events (pointer-events: none on tooltip container)

---

### 14. Missing Mobile Viewport Tour

**What goes wrong:** Tour designed for 1920x1080 desktop. User on 768px tablet sees tour spotlight highlighting element off-screen. "Next" button is outside viewport.

**Prevention:**
- Responsive tour positioning
- Test tour at mobile breakpoints (375px, 768px, 1024px)
- Consider disabling tour on very small screens (<768px) with message: "Tour available on larger screens"

---

### 15. Tour Progress Not Saved

**What goes wrong:** User starts tour, completes 3 of 5 steps, closes laptop. Returns next day, tour starts from step 1 again.

**Prevention:**
- Save current tour step to localStorage
- Offer "Resume Tour" or "Start Over" when returning
- Or: Tours are so short (3-5 steps) that resume isn't necessary

---

### 16. Tooltip Content Stale

**What goes wrong:** Tooltip explains "Click to export as PDF" but feature was updated to support both PDF and PPTX. Tooltip content becomes incorrect over time.

**Prevention:**
- Centralize tooltip content in JSON file
- Review tooltip accuracy during feature updates
- Add tooltip content review to PR checklist for UI changes

---

### 17. International/Accessibility: Non-Text Content

**What goes wrong:** Tour uses arrows/icons without text labels. Colorblind users cannot distinguish red "warning" tooltip from green "success" tooltip.

**Prevention:**
- Always include text labels, not just icons
- Use icons + text, not icons alone
- Don't rely on color to convey meaning
- Test with color blindness simulator

---

## Integration-Specific Pitfalls (Cue App)

### 18. BroadcastChannel Conflicts During Tour

**What goes wrong:** Tour running in teacher view. Tour script sends event `TOUR_STEP_CHANGE`. Existing BroadcastChannel listeners in student view receive unexpected message, throw error.

**Prevention:**
- Tour state is teacher-only, never sync via BroadcastChannel
- Filter BroadcastChannel messages to ignore tour events
- Test: Start tour on teacher view → verify student view unaffected

---

### 19. Presentation Mode Tour Interrupts Live Teaching

**What goes wrong:** Teacher presenting to class. Tour auto-suggests "Did you know?" tooltip. Students see teacher clicking around while they're supposed to be paying attention.

**Prevention:**
- Disable all auto-triggered tooltips during presentation mode
- Manual tour trigger only, never auto-play
- Context detection: if student view is open → suppress tooltips

---

### 20. Export Modal Tour Breaks Multi-Select

**What goes wrong:** User has 5 slides selected. Tour step highlights "Export" button. Tour spotlight dims entire screen except button. User cannot see which slides are selected anymore (selection UI is dimmed).

**Prevention:**
- Tour spotlight should have cutout for both target element AND context (selected slides)
- Or: Tour for Export feature should be triggered on Editor screen before opening modal, not inside modal

---

### 21. Dark Mode Tooltip Contrast

**What goes wrong:** Cue defaults to dark mode. Tooltip library defaults to light tooltips. White tooltip on dark gray background has low contrast, fails WCAG 2.1 contrast ratio (4.5:1 for text).

**Prevention:**
- Customize tooltip colors to match dark mode: dark background, light text
- Test contrast ratio with tool like WebAIM Contrast Checker
- Support both light/dark mode if app has theme toggle

---

### 22. LocalStorage Key Collisions

**What goes wrong:** Tour library uses localStorage key `tooltip-state`. Cue already uses this key for app state. Loading page overwrites tour state or vice versa.

**Prevention:**
- Namespace all tour keys: `cue-tours-*`, `cue-tooltips-*`
- Audit existing localStorage keys before integration
- Document storage key schema

---

### 23. CDN-Loaded Dependencies Timing

**What goes wrong:** Cue loads PDF.js, PptxGenJS from CDN. Tour library also uses CDN. Race condition: Tour library loads before React, throws error. Or tour library expects DOM element that doesn't exist yet (React not hydrated).

**Prevention:**
- Use npm-installed tour library (not CDN) for predictable load order
- Or: Defer tour library load until app fully mounted
- Add error boundaries around tour components

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Library selection | Choosing heavyweight library (React Joyride 498KB) | Evaluate bundle size impact; consider lazy loading |
| Landing page tour | Tour auto-triggers on every load | Manual trigger only; persist dismissal state |
| Editor tour | Too many steps (30+ tooltips) | Limit to 3-5 key features; progressive disclosure |
| Presentation mode tour | Tour interrupts live teaching | Disable auto-triggers; context-aware suppression |
| Tooltip integration | Z-index conflicts with modals | Map existing z-index; define global scale |
| Accessibility implementation | Keyboard-only users excluded | Test with keyboard-only; screen reader audit |
| Mobile testing | Hover-based tooltips don't work | Click/tap triggers; 44px touch targets |
| Performance optimization | Bundle size bloat | Lazy load; conditional rendering; lightweight library |
| State management | Tour state corrupts app state | Namespace storage keys; disable app shortcuts during tour |
| Visual design | Tour looks "third-party" | Custom theme; match Tailwind styles |

---

## Research Confidence Assessment

| Area | Confidence | Source Quality | Notes |
|------|------------|----------------|-------|
| UX anti-patterns | HIGH | Multiple authoritative blogs + Nielsen Norman Group | Cross-verified with Product Fruits, UserGuiding, Appcues |
| Technical integration (React) | MEDIUM-HIGH | Official docs + Material UI + GitHub issues | Direct technical documentation but some React 19-specific behavior unverified |
| Accessibility (WCAG) | HIGH | Official WCAG 2.1 spec + WebAIM | Authoritative standards |
| Mobile/touch | MEDIUM | Industry blogs + vocal.media | Real-world patterns but some extrapolation |
| Performance | MEDIUM | Library documentation + community reports | Bundle sizes verified but performance impact context-dependent |
| Teacher/education context | MEDIUM | EdTech blogs + Appcues examples | Domain-specific patterns but limited to search results |
| Cue-specific integration | LOW | Inferred from PROJECT.md + search results | No direct testing on actual codebase |

---

## Open Questions for Phase-Specific Research

1. **Which tour library balances features vs. bundle size for Cue's needs?** - React Joyride (full-featured, 498KB) vs. Driver.js (lightweight) vs. NextStepjs (minimal) vs. Walktour (performance-focused)

2. **Should tours be screen-specific or feature-specific?** - "Landing page tour" (shows upload + generate + settings) vs. "First upload tour" (just upload flow) vs. "AI Poster tour" (triggered on first poster export)

3. **How to handle tour state persistence across .cue file saves?** - Should tour progress be saved in .cue file format? Or always localStorage? Or never persist (tours are 3-5 steps, just restart)?

4. **Mobile strategy: Full feature parity or desktop-only tours?** - Should mobile users get full tours, abbreviated tours, or "Tours available on desktop" message?

5. **Localization: Are tooltips English-only or i18n required?** - No mention of internationalization in PROJECT.md but educational tools often need multi-language support

---

## Sources

**Onboarding UX Anti-Patterns:**
- [Common user onboarding mistakes to avoid - Product Fruits Blog](https://productfruits.com/blog/common-user-onboarding-mistakes/)
- [User Onboarding UX: Everything You Need to Know - UserGuiding](https://userguiding.com/blog/onboarding-ux)
- [Why Most Product Tours Fail - Screeb](https://screeb.app/blog/why-most-product-tours-fail-and-what-you-should-do-instead)
- [6 Best Onboarding Strategies for Complex Applications - Touch4IT](https://medium.com/touch4it/6-best-onboarding-strategies-for-complex-applications-99f3ea4ce082)

**Tooltip Design Best Practices:**
- [Tooltip Guidelines - NN/G](https://www.nngroup.com/articles/tooltip-guidelines/)
- [What are the issues with tooltip UX - Cieden](https://cieden.com/book/atoms/tooltip/tooltip-ux-issues)
- [Website Tooltips Guide 2026 - UserGuiding](https://userguiding.com/blog/website-tooltips)
- [The problem with tooltips and what to do instead - Adam Silver](https://adamsilver.io/blog/the-problem-with-tooltips-and-what-to-do-instead/)

**React/Technical Implementation:**
- [React Tooltip component - Material UI](https://mui.com/material-ui/react-tooltip/)
- [Portalled tooltips z-index issue - Radix Primitives](https://github.com/radix-ui/primitives/issues/368)
- [Z-index Bootstrap Docs](https://getbootstrap.com/docs/5.2/layout/z-index/)
- [React Native Tooltip Implementation 2026 - Vocal Media](https://vocal.media/journal/react-native-tooltip-implementation-tips-and-best-practices-2026)

**Accessibility:**
- [WCAG 2.1.1 Keyboard Accessibility - UXPin](https://www.uxpin.com/studio/blog/wcag-211-keyboard-accessibility-explained/)
- [Keyboard Accessibility - WebAIM](https://webaim.org/techniques/keyboard/)
- [Understanding Guideline 2.1: Keyboard Accessible - W3C](https://www.w3.org/WAI/WCAG22/Understanding/keyboard-accessible.html)

**Performance:**
- [Top 6 React Tooltip Libraries - UserGuiding](https://userguiding.com/blog/react-tooltip)
- [5 Best React Product Tour Libraries 2026 - Whatfix](https://whatfix.com/blog/react-onboarding-tour/)
- [Top 8 React Product Tour Libraries - Chameleon](https://www.chameleon.io/blog/react-product-tour)

**EdTech/Teacher Context:**
- [5 EdTech platforms that nailed onboarding - Appcues](https://www.appcues.com/blog/edtech-onboarding-examples)
- [Educational Platform Onboarding Best Practices - Product Fruits](https://productfruits.com/blog/educational-platform-onboarding-edtech)
- [Feature Overwhelm - VisualSP](https://www.visualsp.com/blog/avoid-overwhelm-when-introducing-new-software/)

**Progressive Disclosure:**
- [Progressive Disclosure - NN/G](https://www.nngroup.com/articles/progressive-disclosure/)
- [Product tour UI/UX patterns - Appcues](https://www.appcues.com/blog/product-tours-ui-patterns)
