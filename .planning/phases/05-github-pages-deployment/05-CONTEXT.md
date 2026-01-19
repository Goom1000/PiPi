# Phase 5: GitHub Pages Deployment - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy PiPi to GitHub Pages so colleagues can access the app via a public URL. The app must load correctly, auto-deploy on push to main, and work identically to local development.

</domain>

<decisions>
## Implementation Decisions

### Repository Setup
- Make the source repository public (enables free GitHub Pages)
- Single repo approach — source and deployment in same repository
- Repo name: `pipi` — URL will be `username.github.io/pipi`

### URL Structure
- Standard GitHub Pages URL: `username.github.io/pipi`
- No custom domain — use default GitHub Pages subdomain
- Vite base path must be configured for `/pipi/` subdirectory

### Deployment Workflow
- Automatic deployment on push to main branch
- GitHub Actions workflow for build and deploy
- Standard GitHub notifications (no custom notification setup)

### Pre-deploy Validation
- TypeScript check (`tsc --noEmit`) must pass
- Vite build must succeed
- Deploy blocked if either check fails

### Claude's Discretion
- GitHub Actions workflow file structure
- Exact deployment method (gh-pages branch vs GitHub Pages action)
- Cache configuration for faster builds
- Node version selection

</decisions>

<specifics>
## Specific Ideas

- User wants simple, standard setup — no complex infrastructure
- Colleagues should be able to access via URL without any technical setup on their end
- Source code being public is acceptable since no secrets are in the codebase

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-github-pages-deployment*
*Context gathered: 2026-01-19*
