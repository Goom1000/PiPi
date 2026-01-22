# Phase 19: Rebrand to Cue - Research

**Researched:** 2026-01-22
**Domain:** Application Rebranding, File Extension Migration, Repository Management
**Confidence:** HIGH

## Summary

This phase involves a comprehensive rebrand from "PiPi" to "Cue" across UI elements, file format, and repository infrastructure. The project uses React 19 with Vite 6, deployed to GitHub Pages at a base path (`/PiPi/`). The rebrand requires coordinated updates across:

1. **UI Branding**: HTML title, favicon, header text, and footer attributions
2. **File Format**: Migration from `.pipi` to `.cue` extension with backward compatibility
3. **Repository**: GitHub repository rename with GitHub Pages URL update

The standard approach is a coordinated "flag day" deployment where all changes ship together, maintaining backward compatibility for existing user files. The key technical challenge is the GitHub Pages base path configuration in `vite.config.ts`, which must change from `/PiPi/` to the new repository name.

**Primary recommendation:** Update all UI strings and file extensions in a single commit, maintain backward compatibility for `.pipi` files by accepting both extensions, and coordinate repository rename with GitHub Pages reconfiguration.

## Standard Stack

### Core Infrastructure
| Component | Current State | Purpose | Why It Matters |
|-----------|---------------|---------|----------------|
| Vite 6.2.0 | `base: '/PiPi/'` | Build tool with base path config | Must update base path to new repo name |
| GitHub Pages | `/PiPi/` path | Static hosting | URL changes when repository renamed |
| React 19.2.0 | Component framework | UI updates require component edits | No special tooling needed |
| TypeScript 5.8.2 | Type system | Type names (`PiPiFile`) need renaming | Compile-time safety during refactor |

### File System APIs (Native)
| API | Version | Purpose | When to Use |
|-----|---------|---------|-------------|
| FileReader | Native Web API | Read `.pipi`/`.cue` files | Already in use, no changes needed |
| Blob API | Native Web API | Create downloadable files | File generation, update extension only |
| URL.createObjectURL | Native Web API | Trigger downloads | Standard pattern, no changes needed |

### Installation
No new packages required. This is a refactoring/renaming phase using existing infrastructure.

## Architecture Patterns

### Current Branding Architecture

**Branding locations identified:**
```
UI Elements:
├── index.html                    # <title> tag (line 7), favicon path (line 8)
├── App.tsx                       # Header logo text (line 755), landing page logo (line 855)
└── components/ResourceHub.tsx    # Footer attribution (lines 160, 376)

File System:
├── types.ts                      # PiPiFile, PiPiFileContent interfaces
├── services/saveService.ts       # .pipi extension, function names
├── services/loadService.ts       # .pipi validation, function names
├── hooks/useDragDrop.ts          # .pipi file extension check
└── App.tsx                       # accept=".pipi" attribute (line 806)

Build Configuration:
└── vite.config.ts                # base: '/PiPi/' (line 8)

Assets:
├── public/favicon.png            # Icon asset
└── public/logo.png               # Logo asset (if used)
```

### Pattern 1: Coordinated Flag Day Deployment

**What:** Ship all branding changes in a single atomic commit and deploy.

**When to use:** When you control both the application and deployment infrastructure (true for this project).

**Why:** Avoids mixed branding states where UI says "Cue" but files save as `.pipi`, or vice versa.

**Example workflow:**
```bash
# 1. Update all code references
# 2. Single commit with all changes
git add .
git commit -m "rebrand: PiPi → Cue across UI, files, and types"

# 3. Deploy to GitHub Pages
git push origin main

# 4. Rename repository (triggers GitHub Pages rebuild)
# GitHub Settings → Repository Name → "Cue" or "cue-app"

# 5. Update vite.config.ts base path to match new repo name
# 6. Rebuild and deploy
```

### Pattern 2: Backward-Compatible File Extension Migration

**What:** Accept both `.pipi` and `.cue` extensions during load, but save only as `.cue`.

**When to use:** When users have existing files in old format (true for this project).

**Implementation strategy:**
```typescript
// loadService.ts - Accept both extensions
export function readCueFile(file: File): Promise<CueFile> {
  return new Promise((resolve, reject) => {
    // Accept both old and new extensions
    if (!file.name.endsWith('.cue') && !file.name.endsWith('.pipi')) {
      reject(new Error('Invalid file type. Expected .cue or .pipi file.'));
      return;
    }
    // ... rest of parsing logic unchanged
  });
}

// saveService.ts - Save only as .cue
export function downloadPresentation(file: CueFile, filename: string): void {
  const finalFilename = filename.endsWith('.cue') ? filename : `${filename}.cue`;
  // ... rest of save logic unchanged
}

// useDragDrop.ts - Accept both extensions
if (file.name.endsWith('.cue') || file.name.endsWith('.pipi')) {
  onFile(file);
}

// App.tsx - File input accepts both
<input type="file" accept=".cue,.pipi" ... />
```

**Migration path:** Users can keep their old `.pipi` files indefinitely; they'll continue to work. New saves use `.cue` extension automatically.

### Pattern 3: Type System Renaming

**What:** Rename TypeScript interfaces from `PiPiFile` → `CueFile` using IDE refactoring.

**When to use:** For type-safe renaming across entire codebase.

**Steps:**
1. Use TypeScript language server "Rename Symbol" feature
2. Verify with `npm run typecheck`
3. Update JSDoc comments manually (not caught by rename)

**Files requiring type renames:**
- `types.ts`: `PiPiFile`, `PiPiFileContent`
- `services/saveService.ts`: Function names, JSDoc
- `services/loadService.ts`: Function names, JSDoc
- `App.tsx`: Import statements, function calls

### Pattern 4: GitHub Pages Base Path Update

**What:** Update Vite's `base` configuration to match renamed repository.

**Critical timing:** Must happen AFTER repository rename, deployed WITH the rebrand changes.

**Why it matters:**
- Vite's `base` option prepends to all asset URLs (JS, CSS, images)
- Mismatch between `base` and actual GitHub Pages path = broken assets (404s)
- Source: [Vite Official Docs - Shared Options](https://vite.dev/config/shared-options)

**Implementation:**
```typescript
// vite.config.ts - BEFORE
export default defineConfig(({ mode }) => {
  return {
    base: '/PiPi/',  // Current repo name
    // ...
  };
});

// vite.config.ts - AFTER (example: renamed to "cue-app")
export default defineConfig(({ mode }) => {
  return {
    base: '/cue-app/',  // New repo name
    // ...
  };
});
```

**Deployment sequence:**
1. Rename repository on GitHub
2. Update `vite.config.ts` base path locally
3. Run `npm run build`
4. Commit and push updated config + dist files
5. GitHub Pages automatically rebuilds at new URL

### Anti-Patterns to Avoid

- **Gradual migration**: Shipping UI changes separately from file format changes creates confusion
- **Breaking old files**: Removing `.pipi` support immediately breaks user workflows
- **Forgetting base path**: Deploying rebrand without updating `vite.config.ts` breaks all assets
- **Manual search-replace**: Using global find/replace instead of IDE refactoring misses imports, breaks strings

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Find all "PiPi" strings | Manual grep + text editor | IDE "Find in Files" with case-sensitive search | IDE search handles multi-file context, respects scope |
| Rename TypeScript types | Find/replace text | TypeScript "Rename Symbol" (F2 in VS Code) | Language-aware renaming updates imports, usages safely |
| Update GitHub Pages URL | Manual DNS/routing | GitHub's automatic repository rename redirect | GitHub auto-redirects old URLs (except Pages) |
| File extension validation | Regex parsing | `String.prototype.endsWith()` | Simple, readable, less error-prone than regex |

**Key insight:** Modern IDEs and platforms provide first-class support for renaming operations. Manual approaches are more error-prone and time-consuming.

## Common Pitfalls

### Pitfall 1: GitHub Pages URL Doesn't Auto-Redirect

**What goes wrong:** After renaming the repository, the old GitHub Pages URL (`username.github.io/PiPi/`) stops working. Unlike git operations and web UI links, GitHub does NOT redirect old Pages URLs to the new repository name.

**Why it happens:** GitHub's redirect system works for repository access (clone, fetch, push, web UI) but explicitly excludes GitHub Pages URLs to prevent confusion with custom domains.

**Source:** [GitHub Docs - Renaming a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository) warns: "If your repository is used for GitHub Pages, additional steps may be required after renaming."

**How to avoid:**
1. Update `vite.config.ts` base path immediately after rename
2. Rebuild and redeploy to new GitHub Pages URL
3. Update any external links (documentation, bookmarks) to new URL
4. Consider using a custom domain to avoid future URL changes

**Warning signs:**
- 404 errors on deployed app after rename
- Assets (JS/CSS) loading from old URL
- GitHub Pages settings showing old repository name

### Pitfall 2: Vite Base Path Mismatch Breaks Assets

**What goes wrong:** If `vite.config.ts` has `base: '/PiPi/'` but GitHub Pages serves from `/new-name/`, all assets return 404. App loads blank page, console shows errors like "Failed to load module script: Expected JavaScript module..."

**Why it happens:** Vite prepends the `base` value to all asset URLs during build. HTML contains hardcoded paths like `/PiPi/assets/index-abc123.js`. When served from `/new-name/`, browser requests `/PiPi/assets/...` which doesn't exist.

**Source:** [Vite Official Docs](https://vite.dev/config/shared-options) states: "Base public path when served in development or production. All asset paths will be rewritten accordingly."

**How to avoid:**
1. Update `base` in `vite.config.ts` BEFORE deploying to renamed repository
2. Test locally with `npm run preview` to verify asset paths
3. Verify built HTML contains correct asset paths in `dist/index.html`

**Warning signs:**
- Blank page on deployed site
- Console errors: "Failed to load module script"
- Network tab shows 404s for `/old-name/assets/*`

### Pitfall 3: Mixed Extension Acceptance Breaks File Picker UI

**What goes wrong:** Setting `accept=".cue,.pipi"` in file input works for validation, but the file picker dialog shows confusing text like "Custom Files (.cue, .pipi)" instead of "Cue Presentation (*.cue)".

**Why it happens:** The `accept` attribute's display name comes from the first extension or MIME type. Multiple extensions without MIME types show generic text. There's no standard way to provide custom labels for custom file extensions.

**Source:** [MDN - accept attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/accept) documents syntax but notes browser-specific UI behavior.

**How to avoid:**
Accept the browser's default presentation, or provide user guidance in nearby text: "Select a Cue presentation file (.cue or .pipi)". Don't try to customize the file picker dialog itself.

**Warning signs:**
- User confusion about file type
- Requests to "make file picker prettier"
- Attempting to use custom file picker libraries

### Pitfall 4: Incomplete String Replacement Leaves Mixed Branding

**What goes wrong:** Searching for "PiPi" misses variations like "pipi" (lowercase), "PIPI" (uppercase), or "PiPi's" (possessive), leaving mixed branding in comments, error messages, or localStorage keys.

**Why it happens:** Case-sensitive search misses variations. Regex searches can match too broadly and replace code identifiers that shouldn't change.

**How to avoid:**
1. Use case-insensitive search first to identify all variants
2. Review each match manually to determine if it should change
3. Use IDE "Rename Symbol" for code identifiers (types, functions)
4. Manually update comments, strings, and JSDoc
5. Grep for remaining instances: `grep -ri "pipi" . --exclude-dir=node_modules --exclude-dir=dist`

**Warning signs:**
- Error messages mentioning "PiPi" after rebrand
- localStorage keys still using old name (consider migration)
- Mixed branding in user-visible text

### Pitfall 5: BroadcastChannel Name Creates Cross-Version Conflicts

**What goes wrong:** The `BROADCAST_CHANNEL_NAME` constant is set to `'pipi-presentation'` in `types.ts` (line 18). If one window runs old code and another runs new code (e.g., during deployment), they can't communicate because channel names don't match.

**Why it happens:** BroadcastChannel uses exact string matching for channel names. Teacher view and student view must use identical channel names to sync presentation state.

**How to avoid:**
Keep the channel name unchanged (`'pipi-presentation'`) OR ensure both windows are running the same code version (close and reopen). For a rebrand, keeping the old internal name is acceptable since it's not user-visible.

**Warning signs:**
- Presentation sync stops working intermittently
- Student view shows "Not connected to teacher"
- Console warnings about channel mismatches

## Code Examples

Verified patterns from current codebase:

### Current File Extension Validation
```typescript
// services/loadService.ts (current implementation)
export function readPiPiFile(file: File): Promise<PiPiFile> {
  return new Promise((resolve, reject) => {
    // Validate file extension
    if (!file.name.endsWith('.pipi')) {
      reject(new Error('Invalid file type. Expected .pipi file.'));
      return;
    }
    // ... rest of implementation
  });
}
```

### Backward-Compatible Extension Validation (Recommended)
```typescript
// services/loadService.ts (after rebrand)
export function readCueFile(file: File): Promise<CueFile> {
  return new Promise((resolve, reject) => {
    // Accept both .cue and legacy .pipi files
    const isValidExtension = file.name.endsWith('.cue') || file.name.endsWith('.pipi');
    if (!isValidExtension) {
      reject(new Error('Invalid file type. Expected .cue or .pipi file.'));
      return;
    }
    // ... rest of implementation unchanged
  });
}
```

### File Input Accept Attribute (Current)
```tsx
// App.tsx line 806 (current)
<input
  type="file"
  accept=".pipi"
  onChange={handleLoadInputChange}
  style={{ display: 'none' }}
  ref={loadFileInputRef}
/>
```

### File Input Accept Attribute (After Rebrand)
```tsx
// App.tsx (after rebrand)
<input
  type="file"
  accept=".cue,.pipi"
  onChange={handleLoadInputChange}
  style={{ display: 'none' }}
  ref={loadFileInputRef}
/>
```

**Source:** [MDN - accept attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/accept) confirms comma-separated extension syntax.

### Drag-and-Drop Extension Check (Current)
```typescript
// hooks/useDragDrop.ts line 39 (current)
if (file.name.endsWith('.pipi')) {
  onFile(file);
} else if (onInvalidFile) {
  onInvalidFile(file);
}
```

### Drag-and-Drop Extension Check (After Rebrand)
```typescript
// hooks/useDragDrop.ts (after rebrand)
const isValidFile = file.name.endsWith('.cue') || file.name.endsWith('.pipi');
if (isValidFile) {
  onFile(file);
} else if (onInvalidFile) {
  onInvalidFile(file);
}
```

### Vite Base Path Configuration (Current)
```typescript
// vite.config.ts line 8 (current)
export default defineConfig(({ mode }) => {
  return {
    base: '/PiPi/',  // Must match GitHub repository name
    server: { port: 3000, host: '0.0.0.0' },
    plugins: [react()],
    // ...
  };
});
```

**Source:** [Vite Shared Options Documentation](https://vite.dev/config/shared-options)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual find/replace for refactoring | IDE "Rename Symbol" feature | TypeScript era (2012+) | Type-safe, automatic import updates |
| Break old file formats on rebrand | Backward-compatible multi-extension support | Modern SaaS era (2015+) | User trust, data preservation |
| Hardcoded branding strings | Configuration/constants file | Always best practice | Easier auditing, single source of truth |
| Custom file pickers for branding | Native `<input type="file">` with guidance text | HTML5 era (2014+) | Accessibility, platform consistency |

**Deprecated/outdated:**
- Breaking old file formats: Modern apps maintain backward compatibility indefinitely
- Manual text replacement: IDEs provide language-aware refactoring
- Custom domain for every rebrand: GitHub Pages auto-redirect works for most URLs (except Pages itself)

## Open Questions

### Question 1: Should BroadcastChannel name change?

**What we know:** `BROADCAST_CHANNEL_NAME = 'pipi-presentation'` is internal, not user-visible. Teacher and student windows must use identical names to communicate.

**What's unclear:** Is there value in changing internal identifiers to match new branding?

**Recommendation:** Keep the old name to avoid sync issues during deployment. Internal names don't affect UX. If changed, must deploy atomically (all windows closed/reopened).

### Question 2: Should localStorage keys migrate?

**What we know:** Settings and class bank use localStorage (confirmed by grep results). Keys likely contain "pipi" in names (not verified in this research).

**What's unclear:** Whether localStorage keys should migrate to new branding, and if so, how to handle keys across old/new versions.

**Recommendation:** Audit localStorage keys in a separate task. If keys are generic (e.g., "settings", "classBank"), no action needed. If branded (e.g., "pipi_settings"), consider migration function that reads old key, writes new key, optionally deletes old key.

### Question 3: Repository rename - what's the new name?

**What we know:** Requirements say "GitHub repository renamed to professional name" but don't specify the new name.

**What's unclear:** Is it "Cue", "cue", "cue-app", "cue-presentation", or something else? GitHub Pages URL will be `username.github.io/<new-name>/`, so this affects `vite.config.ts` base path.

**Recommendation:** Decide on repository name before starting implementation. Prefer lowercase-with-dashes (e.g., "cue-app") per GitHub conventions. Update requirement FILE-03 to specify exact repository name.

### Question 4: What about the logo asset?

**What we know:** `public/logo.png` exists (confirmed by glob). Not clear if it's currently used in the UI or if it needs visual updating.

**What's unclear:** Whether logo.png displays "PiPi" text that needs redesigning, or if it's a generic icon.

**Recommendation:** Inspect `public/logo.png` visually. If it contains "PiPi" text, requirements state "Use text-based or simple icon" so a quick text-based logo is acceptable (no custom design needed). If it's already generic, no action required.

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [Vite Configuration - Shared Options](https://vite.dev/config/shared-options) - Base path configuration
- [GitHub Docs - Renaming a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository) - Repository rename process and warnings
- [MDN - accept attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/accept) - File input validation syntax

**Codebase Analysis:**
- `vite.config.ts` line 8 - Current base path: `/PiPi/`
- `types.ts` line 18 - BroadcastChannel name: `'pipi-presentation'`
- `types.ts` lines 82-98 - File format type definitions
- `services/saveService.ts` - File save implementation
- `services/loadService.ts` - File load and validation implementation
- `hooks/useDragDrop.ts` - Drag-and-drop file handling
- `App.tsx` lines 755, 855 - UI branding locations
- `components/ResourceHub.tsx` lines 160, 376 - Footer attributions

### Secondary (MEDIUM confidence)

**Best Practices Articles:**
- [Understanding Vite's base Configuration](https://levelup.gitconnected.com/understanding-vites-base-configuration-a-guide-to-subdomain-deployment-and-static-asset-7d4c1af4b131) - Subdomain deployment guidance
- [Straight North - Title Tags & Meta Descriptions 2026](https://www.straightnorth.com/blog/title-tags-and-meta-descriptions-how-to-write-and-optimize-them-in-2026/) - HTML metadata best practices
- [Evil Martians - How to Favicon in 2025](https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs) - Favicon implementation standards

**Community Discussions:**
- [GitHub Community - Github Page url change](https://github.com/orgs/community/discussions/23212) - Pages URL behavior after rename
- [Shoehorm With Teeth - Redirecting GitHub Pages after renaming](https://shoehornwithteeth.com/ramblings/2016/12/redirecting-github-pages-after-renaming-a-repository/) - Redirect strategies

### Tertiary (LOW confidence)

**Web Search Results:**
- React Native rebrand guides - Analogous patterns but different platform
- White label app development - Related to rebranding but enterprise-focused
- Visual Studio 2026 extension compatibility - Different domain but similar versioning challenges

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Current stack verified by direct codebase inspection
- Architecture: HIGH - All patterns verified against existing implementation
- Pitfalls: HIGH - Based on official documentation warnings and known platform behaviors
- File format migration: HIGH - Existing pattern in loadService.ts shows version migration support
- GitHub Pages impact: HIGH - Explicitly documented in GitHub official docs

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - stable domain, GitHub and Vite APIs unlikely to change)

**Coverage notes:**
- All file locations verified by grep/glob
- Official documentation consulted for critical paths (Vite base, GitHub rename)
- No Context7 queries needed (no third-party libraries being added)
- WebSearch used for best practices, verified against official sources
