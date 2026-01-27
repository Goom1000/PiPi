# Feature Landscape: Onboarding & Tooltips

**Domain:** Educational presentation tool onboarding system
**Researched:** 2026-01-27
**Target Users:** Teachers (may not be tech-savvy)
**Context:** Adding onboarding/tooltips to existing React 19 app with PDF upload, editor, presentation mode, student view sync

## Table Stakes

Features users expect in modern web app onboarding. Missing these = product feels incomplete or frustrating.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Skip/Dismiss button** | 74% of users prefer adaptive onboarding; forcing tours causes frustration and churn | Low | Must be visible at all stages, not hidden. Allow return to tour later via help menu |
| **Progressive disclosure** | Prevents information overload; teaches features when users need them | Medium | Show features contextually rather than all at once. Critical for non-tech-savvy users |
| **Per-screen tours** | Users expect guidance tailored to current context (landing vs editor vs presentation mode) | Medium | Separate tour state for each major screen. Don't replay completed tours |
| **Tooltips on hover/focus** | Standard UI pattern for explaining icons and controls | Low | Must support keyboard navigation (tabindex="0") and ARIA attributes |
| **Progress indicators** | Users need to know how far through onboarding (reduces anxiety) | Low | Show steps completed vs remaining. Starting partially complete (e.g., "1/5" after signup) motivates completion |
| **Persistent help access** | Users who skip tours need way to access help later | Low | Help icon (?) in header or persistent location. Links back to tours or help center |
| **Mobile responsiveness** | Teachers may access on tablets/phones | Medium | Tooltip text must be shorter on mobile. Tour overlays must not obscure content |
| **Tour state persistence** | Don't replay tours user already completed | Low | localStorage to track completed tours per user. Clear state option for testing |

## Differentiators

Features that set Cue apart from generic presentation tools. Competitive advantages for educational context.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Role-based tours** | Separate teacher vs student onboarding paths | Medium | Teachers need editor/presentation guidance; students only need viewer guidance. 93% retention when onboarding is high-quality |
| **"Quick win" moments** | Show value fast (e.g., generate slides from PDF) before explaining complex features | Medium | Onboarding should reach first "aha" moment within 2 minutes. Critical for busy teachers |
| **Feature discovery hotspots** | Non-intrusive pulsing indicators for new features | Medium | 30% higher click-through vs modal announcements. Use for Class Bank, Ask AI, Games after core onboarding |
| **Contextual help for edu-specific features** | Info tooltips explaining pedagogical benefits (e.g., "Why use verbosity toggle?") | Low | Teachers want to know WHY features help teaching, not just WHAT they do |
| **Interactive walkthrough** | Let users try actions during tour (not just read) | High | Reduces confusion, speeds learning. Could demo "Upload PDF → Generate slides" interactively |
| **Onboarding checklist** | Break down "Get started with Cue" into achievable steps | Medium | Zeigarnik effect: users remember incomplete tasks. Could track: Upload PDF, Edit slide, Start presentation, Invite students |
| **Empty state guidance** | When no PDFs uploaded yet, show clear CTA with tour link | Low | Empty states are prime moment for first-time guidance. Don't just show blank screen |
| **Keyboard shortcuts overlay** | Tooltip showing keyboard shortcuts for power users | Low | Teachers presenting live need fast navigation. Overlay with "/" or "?" key |

## Anti-Features

Features to explicitly NOT build. Common mistakes in onboarding/help systems.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **5+ intro screens before app** | 86% of users abandon apps with too many pre-use onboarding screens | Progressive disclosure: teach features when first encountered, not upfront |
| **Forced registration before value** | Teachers need to see value before committing | Allow guest/demo mode or show generated slides before requiring account |
| **No skip option / hidden skip** | Forcing tours creates frustration; hiding skip feels manipulative | Always visible "Skip tour" or "Maybe later" button. Respect user autonomy |
| **Auto-play video tutorials** | Users ignore videos; doesn't teach muscle memory | Interactive walkthroughs where users perform actions themselves |
| **Tooltips for critical info** | Tooltips are for supplementary info, not mission-critical instructions | Put critical info in visible UI text, not hidden behind hover |
| **Long tooltip text** | Tooltips should be 2-4 words max; paragraphs go unread | Keep concise. Link to docs for details: "AI Poster Mode [Learn more →]" |
| **Onboarding that looks different from app** | Creates confusion when real app doesn't match tutorial | Tour should use actual app UI with spotlights, not separate demo environment |
| **Replay tour every session** | Annoying; disrespects user's time | Persist state. Only offer tour on first visit or via help menu |
| **Information-only onboarding** | Lectures don't create activation | Focus on getting user to complete first meaningful action (upload PDF, create slide) |
| **Onboarding ends after first week** | Assumes users are "done" learning | Feature discovery continues: hotspots for advanced features (Ask AI, Games) after core mastery |
| **Generic tooltips** | "Click here" or "Use this button" doesn't explain WHY | Edu-specific: "Adjust reading level for different student abilities" |
| **Modal announcement spam** | Blocking modals for every feature update frustrates users | Use hotspot tooltips for feature announcements (52% conversion increase vs modals) |

## Feature Dependencies

```
CORE DEPENDENCIES:
LocalStorage state management
  ↓
Tour completion tracking
  ↓
Per-screen tour system
  ├─ Landing page tour
  ├─ Editor tour (depends on: upload completion)
  └─ Presentation mode tour (depends on: slide creation)

TOOLTIP SYSTEM:
React tooltip library (Joyride or custom)
  ├─ Info icon tooltips (standalone)
  └─ Hotspot tooltips (depends on: feature discovery logic)

PROGRESSIVE DISCLOSURE:
Empty state detection
  ↓
Contextual prompts (e.g., "No slides yet" → "Upload PDF" CTA)
  ↓
Feature unlock hints (after first presentation → show Ask AI hotspot)
```

## MVP Recommendation

### Must-Have for MVP (Phase 1)

**Core Tour Infrastructure:**
1. **React Joyride integration** - MIT licensed, 340k+ weekly downloads, mature ecosystem
2. **Skip button on all tours** - Visible, accessible, respects user autonomy
3. **Tour state persistence** - LocalStorage tracking of completed tours
4. **Landing page tour** - 3-5 steps showing: Upload PDF → AI generates slides → Edit → Present

**Basic Tooltips:**
5. **Info icon tooltips** - Hover/focus tooltips on key icons (Insert menu, Class Bank, Verbosity, Ask AI, Games)
6. **ARIA accessibility** - aria-describedby, keyboard focus, ESC to close

**Why this order:** Must establish help system before users encounter complex features. Landing tour shows value proposition fast (critical for teacher adoption).

### Phase 2 (Post-MVP)

**Enhanced Guidance:**
- Editor tour (separate from landing)
- Presentation mode tour (separate from landing)
- Progress indicator/checklist
- Empty state prompts

**Feature Discovery:**
- Hotspot tooltips for advanced features
- "What's new" hotspots for updates
- Keyboard shortcuts overlay

**Why defer:** Core tour + basic tooltips unblock immediate user confusion. Advanced features can be discovered progressively after users master basics.

### Phase 3 (Future Enhancements)

**Personalization:**
- Role-based tours (teacher vs student paths)
- Interactive walkthroughs (user performs actions during tour)
- Onboarding checklist with progress tracking

**Why defer:** Requires more complex state management and role detection. Diminishing returns vs effort for initial launch.

## Implementation Notes

### Recommended Stack
- **React Joyride** (not Intro.js): MIT licensed (free commercial use), 340k+ weekly downloads, extensive customization, works with React 19
- **Intro.js** requires paid license ($9.99-$299) for commercial use, making it unsuitable for open-source educational tool

### Accessibility Requirements
- All tooltips must support keyboard navigation (tabindex="0" on trigger elements)
- ARIA attributes: `aria-describedby` pointing to tooltip ID, `role="tooltip"`
- Tooltips must remain open when hovering over tooltip itself
- ESC key must close tooltips
- Screen reader compatible

### Performance Considerations
- LocalStorage has 5-10MB limit; onboarding state is tiny (~1KB for completion flags)
- Tour overlays can impact rendering; use React.memo for tour components
- Hotspot animations should use CSS transforms (GPU-accelerated), not position changes

### Teacher-Specific UX
- **Why over What:** Explain pedagogical value ("Adjust reading level for different student abilities") vs generic descriptions ("Change verbosity setting")
- **Time-sensitive:** Teachers are busy; onboarding should reach first value in <2 minutes
- **Fear of breaking things:** Emphasize non-destructive actions ("You can always undo this")
- **Vocabulary:** Avoid technical jargon ("AI generates slides" vs "LLM-based content generation")

## Sources

### Web App Onboarding Best Practices
- [VWO: Ultimate Mobile App Onboarding Guide (2026)](https://vwo.com/blog/mobile-app-onboarding-guide/)
- [Userpilot: 12 Web and Mobile App Onboarding Best Practices](https://userpilot.com/blog/app-onboarding-best-practices/)
- [Whatfix: 17 Best Onboarding Flow Examples (2026)](https://whatfix.com/blog/user-onboarding-examples/)
- [Netguru: Mastering Web Onboarding](https://www.netguru.com/blog/web-onboarding)
- [Userflow: Ultimate Guide to In-App Onboarding](https://www.userflow.com/blog/the-ultimate-guide-to-in-app-onboarding-boost-user-retention-and-engagement)

### Tooltip Design Patterns
- [Appcues: Tooltips - How to Create and Use](https://www.appcues.com/blog/tooltips)
- [UserGuiding: 22 Best Tooltips Examples (2026)](https://userguiding.com/blog/tooltip-examples-best-practices)
- [Userpilot: Tooltip Design - Use Cases & Examples](https://userpilot.com/blog/tooltip-ui-design/)
- [LogRocket: Designing Better Tooltips for Improved UX](https://blog.logrocket.com/ux-design/designing-better-tooltips-improved-ux/)
- [Nielsen Norman Group: Tooltip Guidelines](https://www.nngroup.com/articles/tooltip-guidelines/)

### React Product Tour Libraries
- [UserGuiding: React Onboarding Libraries](https://userguiding.com/blog/react-onboarding-tour)
- [Whatfix: 5 Best React Product Tour Libraries (2026)](https://whatfix.com/blog/react-onboarding-tour/)
- [Chameleon: Top 8 React Product Tour Libraries](https://www.chameleon.io/blog/react-product-tour)
- [GitHub: react-joyride](https://github.com/gilbarbara/react-joyride)
- [Smashing Magazine: Guide to Product Tours in React Apps](https://www.smashingmagazine.com/2020/08/guide-product-tours-react-apps/)

### Educational Software Onboarding
- [ProductFruits: Educational Platform Onboarding Best Practices](https://productfruits.com/blog/educational-platform-onboarding-edtech)
- [LeadSquared: Teacher Onboarding Process](https://www.leadsquared.com/industries/edtech/teacher-onboarding/)
- [Frontline: Digital Onboarding System for Teachers](https://www.frontlineeducation.com/solutions/central/digital-onboarding-system/)

### Onboarding Anti-Patterns
- [ProductFruits: Common User Onboarding Mistakes](https://productfruits.com/blog/common-user-onboarding-mistakes/)
- [Teamflect: 5 Onboarding Mistakes That Kill Retention (2026)](https://teamflect.com/blog/performance-management/onboarding-mistakes)
- [Decode: 6 Mistakes to Avoid When Onboarding Mobile App Users](https://decode.agency/article/mobile-app-onboarding-mistakes/)

### Progressive Disclosure
- [Interaction Design Foundation: What is Progressive Disclosure?](https://www.interaction-design.org/literature/topics/progressive-disclosure)
- [Userpilot: Progressive Disclosure Examples](https://userpilot.com/blog/progressive-disclosure-examples/)
- [Pendo: Onboarding, Progressive Disclosure, Memory and Your Brain](https://www.pendo.io/pendo-blog/onboarding-progressive-disclosure/)
- [LoginRadius: Progressive Disclosure For Seamless User Onboarding](https://www.loginradius.com/blog/identity/progressive-disclosure-user-onboarding)

### Skip Button & User Control
- [UserGuiding: Onboarding Screens Explained (2026)](https://userguiding.com/blog/onboarding-screens)
- [NudgeNow: Onboarding Screens Examples](https://www.nudgenow.com/blogs/onboarding-screens-design-examples)
- [GuideJar: 7 User Onboarding Best Practices (2025)](https://www.guidejar.com/blog/7-user-onboarding-best-practices-that-actually-work-in-2025)
- [UserGuiding: 100+ User Onboarding Statistics (2026)](https://userguiding.com/blog/user-onboarding-statistics)

### React Library Comparison
- [npm-compare: react-joyride vs intro.js-react](https://npm-compare.com/intro.js-react,react-joyride)
- [npm trends: intro.js vs react-joyride](https://npmtrends.com/intro.js-vs-react-joyride)
- [UserGuiding: React Joyride Alternatives](https://userguiding.com/blog/react-joyride-alternatives-competitors)

### Tooltip Accessibility
- [MDN: ARIA tooltip role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/tooltip_role)
- [Material UI: React Tooltip Component](https://mui.com/material-ui/react-tooltip/)
- [Medium: Accessible Tooltips Revisited](https://medium.com/ecovadis-engineering/accessible-tooltips-revisited-e55e1d9214b0)
- [The A11Y Collective: Tooltips in Web Accessibility](https://www.a11y-collective.com/blog/tooltips-in-web-accessibility/)
- [W3C: Tooltip Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)

### Progress Indicators & Checklists
- [UserGuiding: Progress Trackers and Indicators](https://userguiding.com/blog/progress-trackers-and-indicators)
- [Appcues: Onboarding UX - UI Patterns](https://www.appcues.com/blog/user-onboarding-ui-ux-patterns)
- [FasterCapital: How Progress Indicators Enhance User Onboarding](https://fastercapital.com/content/How-Progress-Indicators-Can-Enhance-User-Onboarding.html)

### Contextual Help
- [Chameleon: Top 8 UX Patterns for Contextual Help](https://www.chameleon.io/blog/contextual-help-ux)
- [Whatfix: Contextual Help - Make Support Relevant](https://whatfix.com/blog/contextual-help/)
- [GitLab: Contextual Help and Info](https://design.gitlab.com/usability/contextual-help)

### Hotspot Tooltips
- [Appcues: Tooltips & Hotspots Documentation](https://docs.appcues.com/flows/tooltips-hotspots)
- [UserGuiding: 6 Hotspot Examples (2026)](https://userguiding.com/blog/hotspot-ux)
- [Userpilot: 12 Tooltip Examples](https://userpilot.com/blog/tooltip-examples-saas/)
- [Chameleon: In-App Tooltip with Hotspot](https://www.chameleon.io/templates/hotspot-tooltip)
- [Whatfix: In-App Guidance - Hotspots](https://whatfix.com/blog/hotspots/)

### State Management & Persistence
- [PixelFree Studio: Best Practices for Persisting State](https://blog.pixelfreestudio.com/best-practices-for-persisting-state-in-frontend-applications/)
- [useHooks.io: Mastering Persistent State - useLocalStorage Hook](https://www.usehooks.io/blog/mastering-persistent-state-the-uselocalstorage-hook)
- [Medium: State Persistence with Local Storage in React](https://medium.com/@roman_j/mastering-state-persistence-with-local-storage-in-react-a-complete-guide-1cf3f56ab15c)
- [Medium: State Management in Vanilla JS - 2026 Trends](https://medium.com/@chirag.dave/state-management-in-vanilla-js-2026-trends-f9baed7599de)

### In-App Guidance vs Documentation
- [Docsie: In-App Help & Context Sensitive Help Guide (2025)](https://www.docsie.io/blog/articles/10-key-factors-to-consider-when-building-context-sensitive-help-in-app-guidance/)
- [Whatfix: 15 Types of Technical Documentation (2026)](https://whatfix.com/blog/types-of-technical-documentation/)
- [Pendo: Top 8 In-App Guidance Tools (2025)](https://www.pendo.io/pendo-blog/the-top-8-in-app-guidance-tools-in-2025/)
- [Apty: In-App Guidance - Ultimate Guide](https://apty.ai/blog/ultimate-guide-in-app-guidance/)

### Presentation Software Patterns
- [Prezent.ai: Prezi vs Canva vs Prezent (2026)](https://www.prezent.ai/blog/prezi-vs-canva-vs-prezent)
- [Prezi Blog: Best AI Presentation Tools (2026)](https://blog.prezi.com/best-ai-presentation-makers/)
- [Zapier: Best Presentation Software (2025)](https://zapier.com/blog/best-powerpoint-alternatives/)
