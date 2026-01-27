# Project Research Summary: Tooltips & Onboarding

**Project:** Cue v3.6 — Tooltips & Onboarding
**Domain:** Educational presentation tool feature discovery
**Researched:** 2026-01-27
**Confidence:** HIGH

## Executive Summary

Adding tooltips and onboarding tours to Cue is a feature discovery problem, not a documentation problem. Research across UX patterns, technical libraries, and educational software reveals a clear approach: **lightweight, per-screen tours (3-5 steps maximum) with contextual info tooltips**. The recommended stack is driver.js (5kb) for manual-trigger walkthrough tours and Floating UI (3kb) for hover/focus tooltips — total bundle impact 8kb gzipped.

The critical insight from research: **tour fatigue kills adoption**. Teachers who encounter 15-step product tours skip immediately and learn nothing. Instead, Cue should implement focused per-screen tours (Landing/Editor: 3-5 steps, Presentation Mode: 3-5 steps) that show immediate value within 60 seconds. Progressive disclosure through contextual tooltips handles advanced features (AI Poster, Ask AI, Games) after core mastery.

Key risks center on integration with Cue's existing complex architecture (20k+ LOC, portalled modals, z-index layers, BroadcastChannel sync). The seven critical pitfalls identified include: (1) tour fatigue from showing too much, (2) z-index warfare between tours and existing modals (z-9999 preview window), (3) accessibility gaps excluding keyboard users, (4) mobile/touch interaction failures, (5) performance degradation from eager-loading tooltips, (6) workflow interruption during live teaching, and (7) state management conflicts. Each has proven prevention strategies documented in PITFALLS.md.

## Key Findings

### Recommended Stack

Research identified two lightweight, framework-agnostic libraries that integrate cleanly with Cue's React 19 + Tailwind CSS stack without introducing UI library lock-in.

**Core technologies:**
- **driver.js (1.4.0)**: Guided tours for per-screen walkthroughs — lightest option at 5kb gzipped, zero dependencies, manual trigger support perfect for "Take Tour" buttons, Tailwind-friendly styling, React 19 compatible
- **Floating UI (0.27.16)**: Info icon tooltips for feature explanations — modern Popper.js successor at 3kb gzipped, headless architecture preserves custom Tailwind styling, React 19 officially supported, smart positioning with collision detection

**Why not alternatives:**
- react-joyride rejected: 37kb gzipped (7x heavier than driver.js), React 19 peer dependency warnings, community fork required for full support
- Intro.js rejected: Commercial license required for business use (AGPL, $9.99-$299)
- Radix UI Tooltip rejected: 135kb package size, overkill when only tooltips needed
- Full UI libraries (shadcn, Chakra) rejected: Defeats existing custom component architecture, adds 100kb+

**Bundle impact:** 8kb gzipped total (combined) — negligible compared to existing react-rnd dependency (50kb)

**Confidence:** HIGH — verified with official npm packages, bundle size confirmed via Bundlephobia, React 19 compatibility validated through 2026 tutorials and Radix UI's Floating UI adoption.

### Expected Features

Research into modern web app onboarding reveals clear table stakes vs. differentiators for educational context.

**Must have (table stakes):**
- Skip/dismiss button (74% prefer adaptive onboarding; forcing tours causes churn)
- Progressive disclosure (prevents information overload for non-tech-savvy teachers)
- Per-screen tours (landing vs editor vs presentation mode — separate tour state)
- Tooltips on hover/focus (keyboard navigation support)
- Progress indicators (show steps completed vs remaining)
- Persistent help access (help icon to re-access tours after dismissal)
- Mobile responsiveness (teachers access on tablets/phones)
- Tour state persistence (don't replay completed tours)

**Should have (differentiators for education):**
- Role-based tours (teacher vs student onboarding paths — 93% retention when high-quality)
- "Quick win" moments (show value in <2 minutes — critical for busy teachers)
- Feature discovery hotspots (pulsing indicators for new features — 30% higher click-through vs modals)
- Contextual help for edu-specific features (explain pedagogical benefits, e.g., "Why use verbosity toggle?")
- Onboarding checklist (Zeigarnik effect: users remember incomplete tasks)
- Empty state guidance (clear CTA when no PDFs uploaded yet)
- Keyboard shortcuts overlay (for power users presenting live)

**Defer (anti-features to avoid):**
- 5+ intro screens before app (86% abandon apps with too many pre-use onboarding screens)
- Auto-play video tutorials (users ignore videos; doesn't teach muscle memory)
- Long tooltip text (2-4 words max; paragraphs go unread)
- Onboarding that looks different from app (creates confusion)
- Information-only onboarding (lectures don't create activation)
- Generic tooltips ("Click here" — explain WHY not WHAT)

**MVP Recommendation from research:**
Phase 1: React tour infrastructure, skip buttons, tour state persistence, landing page tour (3-5 steps), basic info icon tooltips with ARIA accessibility
Phase 2: Editor tour, presentation mode tour, progress indicators, empty state prompts
Phase 3: Hotspot tooltips for advanced features, onboarding checklist, keyboard shortcuts overlay

**Confidence:** HIGH — cross-verified with VWO, Userpilot, Whatfix, Netguru, Userflow, Appcues (authoritative UX research sources). EdTech-specific patterns from ProductFruits, LeadSquared, Frontline Education.

### Architecture Approach

Integration into Cue's existing 20k+ LOC React 19 architecture requires minimal structural changes. The recommended pattern uses **per-screen tour components** that live alongside existing screen logic (App.tsx, PresentationView.tsx) rather than a global tour orchestrator — matches Cue's screen-based routing architecture (AppState enum: INPUT, EDITOR, PRESENTATION).

**Major components:**
1. **TourProvider (per screen)** — Wraps each screen, manages tour state (running/stopped), persists completion to localStorage, manual trigger via "?" button in header. Joyride z-index set to 10000+ to float above existing UI (modals z-40, floating preview z-9999)
2. **InfoTooltip (reusable)** — Renders info icon + tooltip on hover/focus, uses createPortal for z-index control, manages aria-describedby for accessibility. Positioned with Floating UI primitives
3. **useTourState hook** — Checks localStorage for tour completion (pipi-tour-landing, pipi-tour-presentation keys), returns {hasSeenTour, markTourComplete, resetTour}
4. **Tour Step Definitions (co-located)** — Array of {target: CSS selector, content: string} defined in same file as screen component for maintainability. Uses data-tour attributes (not CSS classes) for stability

**Integration points:**
- **Landing/Editor screen (App.tsx):** Add data-tour attributes to upload zones, settings button, Insert menu, slide thumbnails. Tour triggered via button in header. InfoTooltips inline next to features.
- **Presentation screen (PresentationView.tsx):** Add data-tour attributes to teleprompter, student window button, game controls, Ask AI. Tour triggered via button in teleprompter header. InfoTooltips on complex controls (Targeted Mode, Grade Level, Verbosity).
- **Z-index hierarchy:** Tour overlay z-10000 (above all), InfoTooltip z-100 (below tour, above normal content), existing modals z-40, existing FloatingWindow z-9999
- **State management:** Per-screen component-local state with localStorage persistence. No global context needed (tours don't span screens).

**Build order from research:**
1. Foundation (Day 1): InfoTooltip component + useTourState hook + 2-3 test tooltips
2. Landing/Editor tour (Days 2-3): data-tour attributes + Joyride integration + manual trigger button
3. Presentation tour (Days 4-5): Same pattern for PresentationView.tsx
4. Refinement (Days 6-7): 10-15 InfoTooltips across both screens + accessibility testing + z-index conflict testing

**Confidence:** HIGH — patterns verified with official React Joyride docs, W3C ARIA Tooltip Pattern, WCAG 2.1 spec, Material UI React Tooltip examples. createPortal pattern matches existing FloatingWindow.tsx in Cue codebase.

### Critical Pitfalls

Research identified seven critical pitfall areas with proven prevention strategies.

1. **Tour Fatigue (The Feature Parade)** — Tour tries to show 15+ features in one session, teachers skip immediately and learn nothing. **Prevention:** 3-5 steps maximum per screen tour; progressive disclosure via contextual mini-tours triggered when user activates feature; value-oriented language ("Change verbosity to adjust detail level" not "This is verbosity selector"); per-screen tours not app-wide marathon.

2. **Z-Index Warfare** — Tooltips appear behind modals, tour spotlights miss elements inside portalled overlays, settings modal conflicts with tour backdrop. **Prevention:** Establish global z-index scale (tour layer 10000+, modals 8000, tooltips 1000); choose tour library with configurable z-index (driver.js, React Joyride allow setting); test tours inside every modal/portal/overlay explicitly; use CSS custom properties for consistency.

3. **Accessibility Black Holes** — Keyboard-only users cannot access hover-only tooltips, screen readers announce "button" with no explanation, focus trap inside tour prevents escape. **Prevention:** Trigger tooltips on both hover and focus; proper ARIA labels (aria-describedby for tooltips, role="dialog" for tours); logical tab order with visible focus indicators (3:1 contrast ratio); Escape key dismisses tooltips/tours; test with mouse unplugged and screen reader (NVDA/VoiceOver).

4. **Mobile/Touch Interaction Failure** — Hover-based tooltips don't work on iPad, tour buttons too small to tap (< 44x44px), pinch-to-zoom conflicts. **Prevention:** Click/tap triggers for tooltips on touch devices; 44x44px minimum touch targets per WCAG 2.1; long-press alternative to hover (500ms); responsive tour UI (full-width on mobile <768px); test on actual devices (iPad Safari, Android tablet, iPhone).

5. **Performance Degradation** — Landing page loads 15+ tooltip components immediately, initial bundle increases 50KB, Time to Interactive degrades 400ms. **Prevention:** Lazy load tour library with code-splitting; conditional tooltip rendering (don't mount until hovered); choose lightweight libraries (driver.js 5kb vs react-joyride 37kb); limit tooltip density (not every button needs one); monitor bundle size with webpack-bundle-analyzer.

6. **Workflow Interruption** — Tour auto-triggers while teacher generating slides (blocks workflow), tooltip appears during live presentation (embarrassing), tour triggers every session (state not persisted). **Prevention:** Manual trigger only (no auto-play); context-aware timing (disable tooltips during presentation mode, export, AI generation, game mode); persist dismissal state to localStorage; progressive feature discovery (show tooltips when user first encounters feature); "Don't show again" checkbox.

7. **State Management Conflicts** — Tour library state conflicts with Cue's presentation mode state, keyboard shortcuts (arrow keys) ambiguous between tour navigation and slide navigation, BroadcastChannel messages during tour corrupt student view. **Prevention:** Namespace tour state separately (cue-tours-* keys); disable app keyboard shortcuts during tour (prevent arrow key slide navigation); focus management (restore focus to trigger on dismiss); avoid tours during critical state (active presentation, open modals, BroadcastChannel-synced game); test edge cases (start tour → open modal → continue tour).

**Additional moderate pitfalls:** Design inconsistency (tour looks "third-party" — custom theme to match Tailwind), tooltip verbosity (15-word maximum — focus on benefits not mechanics), disabled element tooltips (wrapper pattern to trigger on disabled buttons), tooltip/modal collision (portal tooltips to document root).

**Confidence:** MEDIUM-HIGH — UX anti-patterns cross-verified with Product Fruits, UserGuiding, Screeb, NN/G (authoritative). Technical pitfalls from Material UI docs, Radix Primitives GitHub issues, Bootstrap z-index docs. Accessibility from official WCAG 2.1 spec, WebAIM. EdTech context from Appcues, ProductFruits. Cue-specific integration inferred from PROJECT.md (no direct codebase testing).

## Implications for Roadmap

Based on research, suggested phase structure prioritizes immediate value delivery while avoiding tour fatigue and integration conflicts.

### Phase 1: Foundation & Basic Tooltips
**Rationale:** Establish infrastructure before users encounter complex features. Landing tour shows value proposition fast (critical for teacher adoption). Basic tooltips unblock immediate confusion without overwhelming users.

**Delivers:**
- driver.js + Floating UI installed
- InfoTooltip component with keyboard accessibility
- useTourState hook with localStorage persistence
- Landing page tour (3-5 steps: Upload PDF → Generate → Edit → Present)
- 5-8 info icon tooltips on landing/editor screen (Insert menu, Class Bank, Verbosity, Export)

**Addresses (from FEATURES.md):**
- Skip/dismiss button (manual trigger, visible dismiss)
- Tour state persistence (localStorage tracking)
- Tooltips on hover/focus (keyboard support)
- Progressive disclosure (landing tour only, not everything at once)

**Avoids (from PITFALLS.md):**
- Tour fatigue: 3-5 step limit enforced
- Accessibility gaps: ARIA labels, keyboard triggers
- Performance: Lazy load tour library, conditional tooltip rendering

**Research needed:** Standard patterns (driver.js, Floating UI well-documented). Skip phase-specific research.

---

### Phase 2: Editor Tour & Contextual Help
**Rationale:** After users understand basic flow (landing tour), add editor-specific guidance. Editor is complex screen (slide editing, multi-select, export options) — needs separate tour from landing.

**Delivers:**
- Editor screen tour (3-5 steps: Edit slide → Preview → Multi-select → Export)
- 5-8 additional info tooltips (Working Wall export, Poster mode, slide types)
- Progress indicators for tours (show steps completed)
- Empty state guidance (clear CTA when no slides uploaded)

**Uses (from STACK.md):**
- driver.js for editor tour (same pattern as Phase 1)
- Floating UI for contextual tooltips on export modal

**Implements (from ARCHITECTURE.md):**
- Per-screen tour pattern (separate from landing tour)
- data-tour attributes on slide thumbnails, export button, Insert menu
- Z-index testing inside Export modal (verify tooltip not hidden)

**Avoids (from PITFALLS.md):**
- Z-index warfare: Test tooltips inside Export modal explicitly
- Workflow interruption: Don't trigger during AI generation or export process

**Research needed:** Standard patterns. Skip phase-specific research.

---

### Phase 3: Presentation Mode Tour
**Rationale:** Presentation mode is highest-stakes context (live teaching with students). Tour must be manual-trigger only (never interrupt live teaching). Separate from landing/editor because context is completely different.

**Delivers:**
- Presentation mode tour (3-5 steps: Teleprompter → Student window → Games → Ask AI)
- "Tour" button in teleprompter header (manual trigger only)
- 5-8 info tooltips on presentation controls (Targeted Mode, Grade Level, Verbosity)
- Context-aware tooltip suppression (disable during active game state)

**Addresses (from FEATURES.md):**
- Role-based tours (teacher presentation tour separate from student view)
- Contextual help for edu-specific features (explain Targeted Mode pedagogical benefit)
- Keyboard shortcuts overlay (show during presentation for power users)

**Avoids (from PITFALLS.md):**
- Workflow interruption: Manual trigger only, context-aware suppression
- BroadcastChannel conflicts: Tour state teacher-only, never sync to students
- Mobile interaction: Test tour on iPad (teachers present from tablets)
- State conflicts: Disable arrow key slide navigation during tour

**Research needed:** Standard patterns, but integration testing critical (verify tours don't corrupt BroadcastChannel state, game state, student view sync).

---

### Phase 4: Advanced Feature Discovery
**Rationale:** After users master core workflows (upload, edit, present), introduce advanced features progressively through hotspot tooltips and contextual prompts.

**Delivers:**
- Feature discovery hotspots (pulsing indicators for Class Bank, Ask AI, Games)
- "What's new" hotspots for feature updates
- Onboarding checklist (track: Upload PDF, Edit slide, Start presentation, Invite students)
- Interactive walkthrough (user performs actions during tour, not just reads)

**Addresses (from FEATURES.md):**
- Feature discovery hotspots (30% higher click-through vs modals)
- Quick win moments (reach first "aha" within 2 minutes)
- Onboarding checklist (Zeigarnik effect: users remember incomplete tasks)

**Avoids (from PITFALLS.md):**
- Tour fatigue: Hotspots only after core mastery, not upfront
- Over-explanation: 15-word maximum for hotspot tooltips
- Workflow interruption: Hotspots dismissible, non-blocking

**Research needed:** Medium — hotspot tooltips less documented than basic tooltips. May need /gsd:research-phase for animation patterns, trigger logic.

---

### Phase Ordering Rationale

- **Foundation first (Phase 1):** Infrastructure must exist before features depend on it. Landing tour shows immediate value (critical for teacher adoption per EdTech research). Basic tooltips unblock confusion without overwhelming.

- **Editor tour second (Phase 2):** Separate from landing because editor context is different (slide editing vs upload). Users need landing mastery before editor complexity. Export modal integration requires z-index testing.

- **Presentation tour third (Phase 3):** Highest-stakes context (live teaching). Must verify BroadcastChannel doesn't conflict. Teachers won't try presentation mode until they have slides (Phase 1-2 completed).

- **Advanced features last (Phase 4):** Progressive disclosure principle — don't show everything upfront. After core workflows mastered (3-4 presentations completed), introduce hotspots for Class Bank, Ask AI, Games. Avoids tour fatigue.

**Dependency chain:**
```
Phase 1 (Foundation)
  └─> Phase 2 (Editor) — depends on: InfoTooltip component, useTourState hook
      └─> Phase 3 (Presentation) — depends on: Per-screen tour pattern established
          └─> Phase 4 (Advanced) — depends on: Core workflows mastered
```

### Research Flags

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** driver.js and Floating UI extensively documented. Official React examples available.
- **Phase 2:** Same pattern as Phase 1, just different screen.
- **Phase 3:** Same pattern, but integration testing critical for BroadcastChannel.

**Phases needing deeper research during planning:**
- **Phase 4:** Hotspot tooltips (pulsing animations, trigger logic) less documented. Feature discovery patterns may need custom implementation. Consider /gsd:research-phase for:
  - Hotspot animation patterns (CSS vs Framer Motion)
  - Trigger logic (when to show "new feature" hotspots)
  - Onboarding checklist state management (localStorage vs backend)

**Integration testing priorities:**
- Phase 1: Accessibility (keyboard-only testing, screen reader audit)
- Phase 2: Z-index conflicts (test tooltips inside Export modal, Settings modal)
- Phase 3: BroadcastChannel state (verify tours don't corrupt student view sync)
- Phase 4: Performance (verify hotspot animations don't degrade rendering)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | driver.js and Floating UI officially documented, bundle sizes verified via Bundlephobia, React 19 compatibility confirmed through Radix UI adoption and 2026 tutorials |
| Features | HIGH | Cross-verified with authoritative UX research (VWO, Userpilot, Whatfix, NN/G). EdTech-specific patterns from ProductFruits, Appcues. Table stakes vs differentiators clear from 20+ sources |
| Architecture | HIGH | Patterns verified with official docs (React Joyride, W3C ARIA, WCAG 2.1). createPortal pattern matches existing Cue FloatingWindow.tsx. Per-screen tour pattern proven in industry |
| Pitfalls | MEDIUM-HIGH | UX anti-patterns authoritative (NN/G, Product Fruits). Technical pitfalls from official docs (Material UI, Radix). Cue-specific integration inferred from PROJECT.md (not tested on actual codebase) |

**Overall confidence:** HIGH

Research sources are authoritative (official docs, W3C specs, established UX research firms). Bundle sizes verified. React 19 compatibility validated. Architecture patterns proven in production apps. Main uncertainty is Cue-specific integration (z-index conflicts, BroadcastChannel state) — requires integration testing during Phase 3.

### Gaps to Address

- **Mobile strategy unclear:** Research shows teachers access tools from tablets, but unclear if Cue supports mobile already. Need to validate: Does Cue work on iPad? If yes, tours must be mobile-responsive. If no, consider "Tours available on desktop" message or defer mobile support.

- **Localization not addressed:** No mention of internationalization in research. If Cue targets non-English schools, tooltip/tour content needs i18n wrapper (React-i18next pattern). Clarify during Phase 1 planning.

- **Tour state in .cue file format:** Tours are 3-5 steps (short enough to restart). Persist dismissal to localStorage, not .cue file. But if user loads .cue file on different device, tours replay. Acceptable for v3.6 or address with account-based persistence later?

- **Analytics/completion tracking:** Research suggests tracking tour completion rate, skip rate, step abandonment to refine content. Not in v3.6 scope but consider for v3.7. Joyride callback can send events to analytics service if needed.

- **Dark mode tooltip contrast:** Cue defaults to dark mode. Verify tooltip contrast ratio (4.5:1 for text per WCAG 2.1). Test with WebAIM Contrast Checker during Phase 1.

- **BroadcastChannel conflict testing:** Critical for Phase 3. Tour state must never sync to student view. Need explicit test: Start tour on teacher view → verify student view unaffected → start game during tour → verify game state not corrupted.

## Sources

### Primary (HIGH confidence)

**Stack research:**
- [driver.js npm package](https://www.npmjs.com/package/driver.js) — v1.4.0, 340k+ weekly downloads, 5kb bundle verified
- [Floating UI official React docs](https://floating-ui.com/docs/react) — React 19 examples, hooks API
- [Bundlephobia: driver.js](https://bundlephobia.com/package/driver.js) — 5kb gzipped confirmed
- [Bundlephobia: react-joyride](https://bundlephobia.com/package/react-joyride) — 37kb gzipped (comparison)
- [Radix UI React 19 support](https://www.radix-ui.com/themes/docs/overview/releases) — Floating UI verified compatible

**Architecture research:**
- [React Joyride Official Docs](https://docs.react-joyride.com) — Integration steps, API reference
- [W3C ARIA Tooltip Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) — Accessibility guidelines
- [MDN ARIA Tooltip Role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/tooltip_role) — aria-describedby usage
- [Material UI React Tooltip](https://mui.com/material-ui/react-tooltip/) — Disabled element pattern

**Accessibility research:**
- [WCAG 2.1 Success Criterion 1.4.13](https://sarahmhigley.com/writing/tooltips-in-wcag-21/) — Content on Hover or Focus requirements
- [WCAG 2.1.1 Keyboard Accessibility](https://www.uxpin.com/studio/blog/wcag-211-keyboard-accessibility-explained/) — Keyboard trap guidelines
- [WebAIM Keyboard Accessibility](https://webaim.org/techniques/keyboard/) — Screen reader interaction

### Secondary (MEDIUM confidence)

**Features research:**
- [VWO Mobile App Onboarding Guide (2026)](https://vwo.com/blog/mobile-app-onboarding-guide/) — 74% prefer adaptive onboarding
- [Userpilot App Onboarding Best Practices](https://userpilot.com/blog/app-onboarding-best-practices/) — Progressive disclosure patterns
- [Whatfix User Onboarding Examples (2026)](https://whatfix.com/blog/user-onboarding-examples/) — Quick win moments
- [Userflow In-App Onboarding Guide](https://www.userflow.com/blog/the-ultimate-guide-to-in-app-onboarding-boost-user-retention-and-engagement) — 93% retention with high-quality onboarding
- [Appcues Tooltips Best Practices](https://www.appcues.com/blog/tooltips) — 30% higher click-through for hotspots vs modals
- [UserGuiding Tooltip Examples (2026)](https://userguiding.com/blog/tooltip-examples-best-practices) — 15-word maximum guideline
- [Userpilot Tooltip Design](https://userpilot.com/blog/tooltip-ui-design/) — Use cases, design patterns
- [LogRocket Tooltip UX](https://blog.logrocket.com/ux-design/designing-better-tooltips-improved-ux/) — User benefit focus
- [Nielsen Norman Group Tooltip Guidelines](https://www.nngroup.com/articles/tooltip-guidelines/) — Industry standard patterns

**Pitfalls research:**
- [Product Fruits Common Onboarding Mistakes](https://productfruits.com/blog/common-user-onboarding-mistakes/) — 80% skip tours >5 steps
- [UserGuiding Onboarding UX](https://userguiding.com/blog/onboarding-ux) — Tour fatigue patterns
- [Screeb Why Product Tours Fail](https://screeb.app/blog/why-most-product-tours-fail-and-what-you-should-do-instead) — Workflow interruption
- [Product Fruits Educational Platform Onboarding](https://productfruits.com/blog/educational-platform-onboarding-edtech) — Teacher-specific patterns
- [Appcues EdTech Onboarding Examples](https://www.appcues.com/blog/edtech-onboarding-examples) — Busy teachers need quick value
- [Cieden Tooltip UX Issues](https://cieden.com/book/atoms/tooltip/tooltip-ux-issues) — Mobile/touch failures
- [Radix Primitives Issue #368](https://github.com/radix-ui/primitives/issues/368) — Portalled tooltip z-index conflicts
- [Bootstrap v5.2 Z-Index Docs](https://getbootstrap.com/docs/5.2/layout/z-index/) — Z-index scale patterns

### Tertiary (LOW confidence, needs validation)

**EdTech context:**
- [Vocal Media React Native Tooltips (2026)](https://vocal.media/journal/react-native-tooltip-implementation-tips-and-best-practices-2026) — Educational users access from tablets
- [LeadSquared Teacher Onboarding](https://www.leadsquared.com/industries/edtech/teacher-onboarding/) — Teacher-specific onboarding process
- [Frontline Digital Onboarding System](https://www.frontlineeducation.com/solutions/central/digital-onboarding-system/) — EdTech onboarding patterns

**Performance:**
- [Vocal Media State Management Conflicts](https://vocal.media/journal/what-happens-when-app-state-management-stops-scaling-enough) — State management at scale
- [Whatfix React Tour Libraries (2026)](https://whatfix.com/blog/react-onboarding-tour/) — React Joyride 498KB unpacked

---
*Research completed: 2026-01-27*
*Ready for roadmap: yes*
