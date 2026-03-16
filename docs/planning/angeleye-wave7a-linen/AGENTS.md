# AGENTS.md — AngelEye Wave 7a: v2-linen

You are a background agent implementing one work unit for AngelEye.
Read this file fully before writing any code.

---

## Project Overview

**App**: AngelEye — session intelligence layer for Claude Code.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript (npm workspaces: client/, server/, shared/)
**Repo**: `/Users/davidcruwys/dev/ad/apps/angeleye/` — ALL work here (no worktree for this wave)
**Wave goal**: Full visual redesign from dark theme to warm linen — floating cards, real amber accent, dark column header, light sidebar and header.

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
- CSS variables: defined in `client/src/styles/index.css` inside `@theme {}` block
- Tailwind v4: custom colours defined via CSS variables in `@theme {}` — Tailwind auto-generates utilities. No separate config file needed.
- 173 tests currently passing (129 server / 44 client)
- No data layer changes in this wave — visual only
- All fetch calls must have `.catch(() => {})`

---

## Design Direction: v2-linen

AngelEye v2-linen is a warm light-theme redesign. The tone shifts from "flight operations monitor" (dark + amber) to "warm operations room" (linen canvas + dark brown + amber accent). Session cards float above the linen canvas. The column header is the single dark structural element.

**Reference designs** (read before implementing):

- `.mochaccino/designs/v2-linen/observer.html`
- `.mochaccino/designs/v2-linen/organiser.html`

These are complete HTML mockups. Read the CSS and HTML structure in those files — they are the source of truth for exact colours, spacing, and element structure.

---

## New Palette (v2-linen)

All values sourced from the mochaccino reference designs.

| CSS Variable                     | New Value | Usage                                      |
| -------------------------------- | --------- | ------------------------------------------ |
| `--color-background`             | `#e8e0d4` | Main canvas (linen)                        |
| `--color-surface`                | `#ede7dc` | Sidebar background                         |
| `--color-surface-mid`            | `#ddd6cc` | Hover states, subtle fill                  |
| `--color-surface-hover`          | `#ddd6cc` | Hover state (same as surface-mid)          |
| `--color-card`                   | `#f5f1eb` | Floating cards, header, focus panels       |
| `--color-border`                 | `#d4cdc4` | Standard borders                           |
| `--color-border-raised`          | `#ccc5bb` | Elevated card borders                      |
| `--color-primary`                | `#c8841a` | Amber accent (replaces `#ccba9d`)          |
| `--color-primary-foreground`     | `#fff`    | Text on amber                              |
| `--color-foreground`             | `#2a2018` | Primary text (dark brown)                  |
| `--color-muted-foreground`       | `#7a6e5e` | Secondary text, labels                     |
| `--color-accent`                 | `#c8841a` | Same as primary                            |
| `--color-destructive`            | `#c0392b` | Errors (warm red — unchanged functionally) |
| `--color-destructive-foreground` | `#fff`    |                                            |

**Body changes:**

- `background-color: #e8e0d4`
- `color: #2a2018`
- `font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

**New variable to add:** `--color-card: #f5f1eb` — floating card surfaces (doesn't exist in current dark theme)

---

## LN01 — CSS Palette Swap

### What to build

Replace every colour value in `client/src/styles/index.css` with the v2-linen palette. Add `--color-card`. Update the `body {}` block to use linen background, dark brown foreground, and system-ui font.

### File to change

`client/src/styles/index.css`

### Exact changes

1. In the `@theme {}` block, update all colour variables per the palette table above. Add `--color-card: #f5f1eb;` after `--color-surface-hover`.
2. In the `body {}` block:
   - `background-color: #e8e0d4`
   - `color: #2a2018`
   - `font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
   - Keep `margin: 0`

Keep the `@import 'tailwindcss'`, `@import url(...)` for Bebas Neue, `@source`, and font variable — these are unchanged.

### Done when

- App still renders (no blank screen)
- Body is linen background (`#e8e0d4`) with dark text
- `npm run typecheck` passes clean
- `npm run lint` passes clean
- `npm test` passes (173 tests — no regressions)
- Screenshot: `node scripts/screenshot.mjs` — check that the overall app background is warm linen, not black

---

## LN02 — Header

### What to build

Switch the Header from dark to light. Use `bg-card` background, `border-b border-border` bottom divider. ANGELEYE logo stays Bebas Neue but should read as warm dark text with amber accent on "EYE". Add a session count pill in amber.

### File to change

`client/src/components/Header.tsx`

### Current state (read file before editing)

```tsx
<header className="h-14 flex items-center justify-between px-4 border-b border-border bg-surface shrink-0">
  <span className="font-bebas text-2xl tracking-wider text-primary">AngelEye</span>
  <div className="flex items-center gap-3 text-muted-foreground text-sm">
    <span className="text-xs">v0.1.0</span>
  </div>
</header>
```

### Target state

```tsx
<header className="h-14 flex items-center gap-4 px-5 border-b border-border bg-card shrink-0">
  <span className="font-bebas text-2xl tracking-[0.15em] text-foreground uppercase">
    Angel<span className="text-primary">Eye</span>
  </span>
  <div className="flex items-center gap-3 ml-auto text-muted-foreground text-sm">
    <span className="text-xs">v0.1.0</span>
  </div>
</header>
```

Reference: `.mochaccino/designs/v2-linen/observer.html` `.app-header` and `.app-name` CSS + HTML.

### Done when

- Header background is light card (`#f5f1eb`) not dark
- "Eye" in ANGELEYE is amber (`text-primary`)
- Border-bottom separates header from content
- `npm run typecheck` passes clean
- `npm run lint` passes clean
- `npm test` passes (173 tests — no regressions)

---

## LN03 — Sidebar + SidebarGroup

### What to build

Switch sidebar from dark surface to linen surface (`bg-surface` = `#ede7dc`). Active nav item gets amber left border instead of primary/15 background tint. Inactive text warms up. The collapse toggle button gets a linen-appropriate style.

### Files to change

1. `client/src/components/Sidebar.tsx`
2. `client/src/components/SidebarGroup.tsx`

### Sidebar.tsx target

```tsx
<aside
  className={[
    'flex flex-col border-r border-border bg-surface shrink-0 transition-all duration-200',
    collapsed ? 'w-12' : 'w-56',
  ].join(' ')}
>
  <nav className="flex-1 overflow-y-auto p-2 pt-4">
    {nav.map((group) => (
      <SidebarGroup key={group.label} group={group} collapsed={collapsed} />
    ))}
  </nav>
  <button
    onClick={toggleCollapsed}
    className="flex items-center justify-center h-10 border-t border-border text-muted-foreground hover:text-foreground text-xs transition-colors"
    title={collapsed ? 'Expand' : 'Collapse'}
  >
    {collapsed ? '▶' : '◀ collapse'}
  </button>
</aside>
```

Note: `bg-surface` is now linen (`#ede7dc`) so this looks correct without changes to the class — but verify it renders as warm linen after LN01.

### SidebarGroup.tsx active state

In SidebarGroup, change the active item from `bg-primary/15 text-primary font-medium` to an amber left-border style:

```tsx
activeView === item.key
  ? 'border-l-2 border-l-primary text-foreground font-semibold bg-surface-mid'
  : 'border-l-2 border-l-transparent text-foreground hover:bg-surface-mid';
```

The group label should be `text-muted-foreground` (already is — verify it stays warm).

Reference: `.mochaccino/designs/v2-linen/observer.html` `.sidebar-item`, `.sidebar-item.active`, `.sidebar-label` CSS.

### Done when

- Sidebar background is warm linen, not dark
- Active nav item has amber left border, not highlight tint
- Text reads dark-on-light (not light-on-dark)
- `npm run typecheck` passes clean
- `npm run lint` passes clean
- `npm test` passes (173 tests — no regressions)

---

## LN04 — ObserverView: Cards + Dark Column Header

### What to build

Two structural changes:

1. **Dark column header**: The SESSION/LAST ACTIVITY/WHEN/IDLE header bar gets a dark background (`bg-foreground`) and light label text, becoming a structural anchor. Reference: `.col-header` in the mochaccino HTML.

2. **Session rows → floating cards**: Each session row becomes a floating card — `bg-card border border-border rounded-md shadow-sm` — with padding, gap between cards, and a left border accent for active sessions. The session list container gets padding and gap.

### File to change

`client/src/views/ObserverView.tsx`

### Column header change

Find the column header div (the one containing SESSION / LAST ACTIVITY / WHEN / IDLE labels). Change its className to use dark background and light text:

```tsx
<div className="flex items-center gap-3 px-4 py-2 shrink-0 bg-foreground">
  <span className="w-4 shrink-0" />
  <span className="font-bebas tracking-wider text-[#d4c9b8] text-xs w-32 shrink-0 opacity-70">
    SESSION
  </span>
  <span className="font-bebas tracking-wider text-[#d4c9b8] text-xs flex-1 opacity-70">
    LAST ACTIVITY
  </span>
  <span className="font-bebas tracking-wider text-[#d4c9b8] text-xs w-16 text-right shrink-0 opacity-70">
    WHEN
  </span>
  <span className="font-bebas tracking-wider text-[#d4c9b8] text-xs w-12 text-right shrink-0 opacity-70">
    IDLE
  </span>
</div>
```

Remove `border-b border-border` from the column header — the dark bg creates the visual separation.

### Session list container

Change the sessions scroll container to add padding and gap between cards:

```tsx
<div className="flex-1 overflow-y-auto min-h-0 p-3 flex flex-col gap-1.5">
```

### Session row → card

Change the individual session row div from a flat border-bottom row to a floating card:

```tsx
<div
  key={s.entry.session_id}
  onClick={() => handleRowClick(s.entry.session_id)}
  className={[
    'flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md border border-border bg-card shadow-sm hover:shadow-md hover:bg-[#faf8f4] transition-all text-sm',
    isFocused ? 'border-l-[3px] border-l-primary' : 'border-l-[3px] border-l-transparent',
  ].join(' ')}
>
```

Remove the `border-b border-border` that was on the row — cards have their own borders.

### View header (Observer title bar)

The Observer title bar also transitions to light:

```tsx
<div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
  <h1 className="font-bebas text-3xl tracking-wider text-foreground">Observer</h1>
  ...
</div>
```

### Focus panel

```tsx
<div className="border-t border-border bg-card shrink-0 max-h-72 flex flex-col">
```

Reference: `.session-card`, `.col-header`, `.sessions-list` in the mochaccino HTML.

### Done when

- Column header is dark bar (`#2a2018` bg, `#d4c9b8` text)
- Session rows are floating cards with border + shadow
- Active card has amber left border (3px)
- Gap between cards visible in screenshot
- `npm run typecheck` passes clean
- `npm run lint` passes clean
- `npm test` passes (173 tests — no regressions)
- Screenshot: `node scripts/screenshot.mjs`

---

## LN05 — OrganiserView

### What to build

Switch OrganiserView to linen theme. Session tiles in inbox stay `bg-card` (float above linen canvas). Workspace column headers get amber accent. The canvas background is linen (`bg-background`).

### File to change

`client/src/views/OrganiserView.tsx`

### DraggableSession tile

The inbox session tile currently:

```tsx
className={`flex flex-col gap-1 px-3 py-2 bg-background border border-border rounded text-sm ...`}
```

Change `bg-background` to `bg-card` so tiles float above the linen canvas (which is now the background colour):

```tsx
className={`flex flex-col gap-1 px-3 py-2 bg-card border border-border rounded shadow-sm text-sm ...`}
```

### DraggableWorkspaceSession tile

Same change — `bg-background` → `bg-card`:

```tsx
className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm bg-card border border-border shadow-sm cursor-grab ...`}
```

### Assign button + dropdown

The Assign dropdown uses `bg-surface` — this is correct after LN01 (surface is warm linen). Verify it looks right; no class change needed unless contrast is off.

### Workspace column headers

Find any workspace name/header elements and add amber accent for active workspace or the workspace title. If workspace headers use `text-foreground`, they'll automatically read as dark brown — verify this looks intentional and warm.

Reference: `.mochaccino/designs/v2-linen/organiser.html` for the workspace column layout and colouring.

### Done when

- Session tiles in inbox and workspace columns are card-coloured (`#f5f1eb`), floating above linen canvas
- Canvas background is linen (`#e8e0d4`)
- No jarring dark elements remain
- Drag-and-drop still functions
- `npm run typecheck` passes clean
- `npm run lint` passes clean
- `npm test` passes (173 tests — no regressions)
- Screenshot: `node scripts/screenshot.mjs`

---

## Quality Gates (all units)

1. `npm run typecheck` passes clean
2. `npm run lint` passes clean
3. `npm test` passes (173 tests — no regressions)
4. `node scripts/screenshot.mjs` run after each unit — check output
5. No `console.log` left in production code
6. LN01 must complete before LN02/LN03/LN04/LN05 (CSS variable dependency)

---

## Learnings from Wave 6

- Tailwind v4 `@theme` block auto-generates utilities from `--color-*` — no separate mapping step needed
- Adding new variables (e.g. `--color-card`) follows the same pattern as existing ones
- `bg-primary/15` style opacity modifiers work with CSS variables in Tailwind v4
- `border-l-[3px]` for arbitrary border-left width — use bracket notation
- ContentPanel is already edge-to-edge (p-6 removed in Wave 6 UI01)
- `apiFailure(res, msg, code)` not `apiError` — though this wave has no server changes
