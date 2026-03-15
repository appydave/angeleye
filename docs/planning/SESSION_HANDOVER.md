# AngelEye — Session Handover (Session 6 → Session 7)

**Date**: 2026-03-15
**Status**: Wave 6 complete (hardening + minor UI). Mochaccino design exploration done. Design direction chosen. Ready for Wave 7.

## Session 7 Start Prompt

> Read the AngelEye handover at ~/dev/ad/apps/angeleye/docs/planning/SESSION_HANDOVER.md.
> Wave 7 has two campaigns: UI redesign (linen design system) and ambient intelligence groundwork.
> Start with UI — use Ralphy extend mode to plan Wave 7a from the v2-linen mochaccino direction.

---

## What Was Done This Session

### Wave 6 Hardening — Complete (11/11)

- H01: Write queue halt fixed (`.catch()` on chain)
- H02: Atomic registry writes (tmp + rename pattern)
- H03: session-helpers.ts extracted from ObserverView + OrganiserView
- H04: `initAngelEyeDirs()` now properly awaited at startup (was fire-and-forget)
- H05: workspace_id validated on PATCH /sessions (returns 404 if workspace doesn't exist)
- T01–T06: 8 new behaviour tests; total now 173 (129 server + 44 client)

### Wave 6 UI — Shipped (minor)

- ContentPanel p-6 removed (edge-to-edge layout)
- CSS variable palette warmed; surface-mid + border-raised added
- Observer focused row: bg-surface-mid; column header: bg-surface
- Organiser: workspaces panel bg-surface

### Mochaccino Design Exploration

- 5 design variants generated for Observer + Organiser
- Gallery at `.mochaccino/index.html` (serve with `python3 -m http.server 7701` from `.mochaccino/`)
- **User chose: v2-linen** — floating cards on warm linen canvas, dark column header, amber accent

---

## Design Direction: v2-linen

The chosen design to implement in Wave 7a. Key characteristics:

- Canvas: `#e8e0d4` (warm linen)
- Session cards: `#f5f1eb` (white-ish floating above canvas), border + box-shadow
- Column header: `#2a2018` (dark — structural weight)
- Sidebar: same linen canvas (light sidebar — NOT dark)
- Header: light, border-bottom
- Primary accent: `#c8841a` (real amber — replaces current `#ccba9d` beige)
- Active session: amber left border 3px on card
- Human session name: italic amber text below project name
- Status: `active` pill (amber bg + dark text) vs `ended` (muted border + muted text)
- Reference: `.mochaccino/designs/v2-linen/observer.html` and `organiser.html`

**What this means for the current app:**

- The entire dark theme (`#0f0d0c` background) needs to change to light
- Sidebar switches from dark to linen (big change)
- Header switches from dark to light
- Primary color `#ccba9d` → `#c8841a`
- Session rows become floating cards with border + shadow
- Font: keep Bebas Neue for logo; body font should move toward `system-ui` or DM Sans (not pure monospace)

---

## Remaining Backlog

| ID   | Item                                            | Priority                    |
| ---- | ----------------------------------------------- | --------------------------- |
| B011 | /angeleye:publish skill (Nano Banana / FliDeck) | Medium                      |
| B012 | Ambient intelligence / skill suggester          | High — the flagship feature |
| B013 | Paperclip/OpenClaw adapter                      | Low                         |
| B014 | Supabase cold archive                           | Low / maybe never           |

**Before B012**: Split `angeleye-data.ts` into:

- `registry.service.ts`
- `workspace.service.ts`
- `backfill.service.ts`
  The write queue is a module-level singleton and B012 adds a 6th responsibility. Do the split first.

---

## Wave 7 Plan

### Wave 7a — UI: Implement v2-linen

Full visual redesign of the app. Component changes, not just CSS variables:

- `index.css`: New linen palette, light sidebar, amber primary
- `Header.tsx`: Light header, border-bottom, amber ANGELEYE branding
- `Sidebar.tsx`: Switch to linen bg, amber active state
- `SidebarGroup.tsx`: Group separator lines (AWB style)
- `ContentPanel.tsx`: Already edge-to-edge from Wave 6
- `ObserverView.tsx`: Session rows → cards (border + shadow), column header dark
- `OrganiserView.tsx`: Inbox/workspace panels in linen

### Wave 7b — Refactor: Split angeleye-data.ts

Prerequisite for B012. Extract into 3 service files.

### Wave 7c — B012: Ambient Intelligence

Prompt frequency pattern miner → skill suggester. The flagship feature.

---

## Key Technical Facts (carry forward)

- Ports: Client 5050, Server 5051
- Test isolation: `_setDataDir(tmpDir)` in beforeEach
- Response helpers: `apiSuccess(res, data)` and `apiFailure(res, msg, code)` — NOT apiError
- Client reads: `response.data.sessions[]`, `response.data.workspaces[]`, `response.data.events[]`
- Data dir: `~/.claude/angeleye/` (registry.json, workspaces.json, sessions/, archive/)
- 173 tests passing (129 server / 44 client) as of Wave 6 completion
- AGENTS.md for Wave 7: inherit from `angeleye-wave6-hardening/AGENTS.md`

---

**Handover written**: 2026-03-15
