# Requirements: PiPi v1.2

**Defined:** 2026-01-18
**Core Value:** Students see only slides; teachers see slides + teleprompter

## v1.2 Requirements

Requirements for Permission Flow Fix milestone.

### Permission Detection

- [x] **PERM-01**: Permission state resolves before UI allows interaction (loading state prevents race condition)

### Button Status

- [x] **PERM-02**: Launch button shows current auto-placement status based on permission state
- [x] **PERM-05**: ~~Display name shown on button when permission granted~~ → Shows "Launch → External Display" (simpler, user-approved)

### Permission Request

- [x] **PERM-03**: User can trigger permission request from visible, non-dismissible UI element

### Feedback

- [x] **PERM-04**: ~~Toast confirms where student window opened~~ → Removed during human verification (blocked UI buttons)
- [x] **PERM-06**: Recovery UI shown when permission previously denied (guidance to browser settings)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Inline permission on button click | Would break popup blocker exception (user gesture consumed by permission dialog) |
| Remember permission choice in localStorage | Browser already remembers; adding our own layer is confusing |
| Support for Firefox/Safari auto-placement | Window Management API is Chromium-only; manual fallback already exists |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PERM-01 | Phase 1 | Complete |
| PERM-02 | Phase 2 | Complete |
| PERM-03 | Phase 2 | Complete |
| PERM-04 | Phase 2 | Removed (blocked UI) |
| PERM-05 | Phase 2 | Modified (simplified label) |
| PERM-06 | Phase 2 | Complete |

**Coverage:**
- v1.2 requirements: 6 total
- Mapped to phases: 6
- Unmapped: 0

---
*Requirements defined: 2026-01-18*
*Last updated: 2026-01-18 — v1.2 milestone complete*
