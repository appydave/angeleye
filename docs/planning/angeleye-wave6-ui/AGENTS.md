# AGENTS.md — AngelEye Wave 6: UI Polish

You are a background agent implementing one work unit for AngelEye.
Read this file fully before writing any code.

---

## Project Overview

**App**: AngelEye — session intelligence layer for Claude Code.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript (npm workspaces: client/, server/, shared/)
**Repo**: `/Users/davidcruwys/dev/ad/apps/angeleye/` — ALL work here (no worktree for this wave)
**Wave goal**: UI Polish — close the visual gap between AngelEye and the AWB mock design language.

---

## Build & Run Commands

```bash
# From repo root
npm run typecheck
npm test
npm run lint
npm test --workspace server
npm test --workspace client
node scripts/screenshot.mjs   # capture screenshots after changes — run after every unit
```

---

## Key Facts (do not re-derive)

- Ports: Client 5050, Server 5051
- Response helpers: `apiSuccess(res, data)` and `apiFailure(res, msg, code)` — NOT apiError
- Response shape: `{ status: 'ok', data: { ... } }` — client reads `response.data.xxx`
- Test isolation: `_setDataDir(tmpDir)` in beforeEach, `rm(testDir)` in afterEach
- CSS variables: defined in `client/src/styles/index.css`
- Tailwind config: custom colours mapped via CSS variables — follow the existing pattern in the file
- 165 tests currently passing (121 server / 44 client)
- No polling in client views

---

## Design Direction

AngelEye should feel like the screen at the back of a flight operations room: warm amber-on-dark, ambient information disappears until it changes, the chrome compresses to near-nothing so the session list fills the eye. Not a dashboard — a monitor.

The layering system follows AWB mock conventions:

- `background` — the darkest layer, base canvas
- `surface` — cards, panels, slightly lifted areas
- `surface-mid` — active/focused rows, card inners
- `border` and `border-raised` — structural separation and hover escalation

---

## UI01 — Remove ContentPanel p-6

### What to build

The `ContentPanel` component wraps all views with `p-6` padding, pushing content away from the edges. This fights the views' own internal layout and makes the session list feel cramped. Remove the outer padding to make views edge-to-edge.

### File to change

Search for `ContentPanel` in `client/src/components/` (or wherever it lives). Find the main wrapper div.

Change from:

```tsx
<div className="overflow-y-auto p-6 bg-background ...">
```

To:

```tsx
<div className="overflow-hidden bg-background flex flex-col ...">
```

The exact class string may differ — read the file before editing. The goal is: remove `p-6`, change `overflow-y-auto` to `overflow-hidden`, add `flex flex-col` so child views fill the space.

Views already manage their own internal layout and padding — the outer wrapper should not add any.

### Done when

- `node scripts/screenshot.mjs` output shows views flush edge-to-edge (no outer margin gap)
- `npm run typecheck` passes clean
- `npm run lint` passes clean
- `npm test` passes (165 tests — no regressions)

---

## UI02 — CSS Variable Corrections

### What to build

Update existing CSS variables to shift the palette warmer and add two new variables needed by UI03/UI04/UI05. Do this unit before the others — they depend on the new variables.

### File to change

`client/src/styles/index.css`

### Changes to existing variables

| Variable                   | Current value | New value | Reason                                                                         |
| -------------------------- | ------------- | --------- | ------------------------------------------------------------------------------ |
| `--color-surface`          | `#1a1614`     | `#181412` | Darker base, more contrast range                                               |
| `--color-surface-hover`    | `#231f1c`     | `#271f1b` | Warmer hover state                                                             |
| `--color-border`           | `#342d2d`     | `#2d2622` | Remove slight purple cast                                                      |
| `--color-muted-foreground` | `#879294`     | `#7a6e62` | Warm the muted tone — current value reads blue-grey against warm beige palette |

### New variables to add

```css
--color-surface-mid: #201b18; /* active row backgrounds, card inners */
--color-border-raised: #3d3430; /* card/hover border escalation */
```

Add them next to the existing surface/border variables. Also add Tailwind theme mappings for both new variables, following the exact pattern used for existing variables in the file (e.g., if existing variables use `theme('colors.surface-mid')` or similar, match the pattern).

### Done when

- All four existing variables updated
- Two new variables added with Tailwind mappings
- App still renders (no blank screen)
- `npm run typecheck` passes clean
- `npm run lint` passes clean

---

## UI03 — Observer Focused Row

### What to build

The focused row in `ObserverView` uses `bg-primary/10` for its background highlight. This resolves to ~rgba(204,186,157,0.10) which is nearly invisible against the dark background — you can barely see which row is focused. Replace it with `bg-surface-mid` which provides 17 luminance units of separation: visible without being loud. Keep the left border accent.

### File to change

`client/src/views/ObserverView.tsx`

### Change

Find the focused row conditional class:

```tsx
isFocused ? 'bg-primary/10 border-l-2 border-l-primary' : '';
```

Change to:

```tsx
isFocused ? 'bg-surface-mid border-l-2 border-l-primary' : '';
```

If `bg-surface-mid` is not yet available as a Tailwind utility (depends on UI02 being done first), use `bg-[#201b18]` as a fallback. Do UI02 first.

### Done when

- Focused row has a clearly visible background distinction in screenshots
- Left border accent (`border-l-2 border-l-primary`) is preserved
- `npm run typecheck` passes clean
- `npm run lint` passes clean
- `npm test` passes (165 tests — no regressions)

---

## UI04 — Observer Column Header Surface

### What to build

The Observer column header row (SESSION / LAST ACTIVITY / WHEN / IDLE) currently has no background, so it visually merges with the data rows below it. Add `bg-surface` to create a two-surface system: header on surface, data rows on background.

### File to change

`client/src/views/ObserverView.tsx`

### Change

Find the column header div — it contains the SESSION / LAST ACTIVITY / WHEN / IDLE labels. Add `bg-surface` to its className.

Example (read the actual file before editing — match the exact structure):

```tsx
<div className="flex items-center ... bg-surface">
  {/* SESSION | LAST ACTIVITY | WHEN | IDLE labels */}
</div>
```

### Done when

- Screenshot shows header row has a visually distinct surface above the data rows
- Matches the two-surface layering pattern in AWB mocks
- `npm run typecheck` passes clean
- `npm run lint` passes clean
- `npm test` passes (165 tests — no regressions)

---

## UI05 — Organiser Inbox/Workspace Visual Split

### What to build

The Organiser view has two panels side-by-side: inbox (unsorted sessions, left) and workspaces (organised sessions, right). Both currently have the same background. Add directional visual coding: inbox stays on `bg-background` (darkest, unsorted), workspaces get `bg-surface` (slightly lifted, organised). This creates a spatial metaphor: things move from dark to light as they become organised.

### File to change

`client/src/views/OrganiserView.tsx`

### Change

Find the inbox scroll area container — it should stay on `bg-background` (or no bg class, since background is the default dark layer).

Find the workspaces scroll area container — add `bg-surface` to it.

Read the file before editing to identify the exact div structure. The inbox is the left panel containing unsorted/unassigned sessions. The workspaces area is the right panel containing workspace cards.

### Done when

- Screenshot shows visible background distinction between inbox (left/dark) and workspaces (right/slightly lighter)
- The transition left-to-right reads as: unsorted → organised
- `npm run typecheck` passes clean
- `npm run lint` passes clean
- `npm test` passes (165 tests — no regressions)

---

## Quality Gates (all units)

1. `npm run typecheck` passes clean
2. `npm run lint` passes clean
3. `npm test` passes (165 tests — no regressions)
4. `node scripts/screenshot.mjs` run after each unit — check `/tmp/angeleye-screenshots/`
5. No `console.log` left in production code
6. UI02 must be completed before UI03, UI04, UI05 (CSS variable dependency)
