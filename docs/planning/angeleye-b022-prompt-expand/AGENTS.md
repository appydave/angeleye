# AGENTS.md — AngelEye B022: Prompt Expand

You are a background agent implementing one work unit for AngelEye.
Read this file fully before writing any code.

---

## Project Overview

**App**: AngelEye — session intelligence layer for Claude Code.
**Stack**: AppyStack — React 19 + Vite 7 + Express 5 + TypeScript (npm workspaces: client/, server/, shared/)
**Repo**: `/Users/davidcruwys/dev/ad/apps/angeleye/` — ALL work here
**Campaign goal**: Show full `user_prompt` content in the focus panel via click-to-expand. Add hover tooltip on session list row's first_real_prompt snippet.

---

## Build & Run Commands

```bash
# From repo root
npm run typecheck
npm test
npm run lint
npm test --workspace client
```

---

## Key Facts (do not re-derive)

- Ports: Client 5050, Server 5051
- **Baseline**: 177 server tests passing, 44 client tests passing (6 pre-existing failures in `env.test.ts` — ignore)
- Shared types live in `shared/src/angeleye.ts` — exported via `shared/src/index.ts`
- All imports use `.js` extension (ESM — do not use `.ts`)
- No `console.log` in server files — use `logger.info` / `logger.warn` / `logger.error`
- `AngelEyeEvent` has an `id: string` field — use this as the key for expandedPrompts

---

## WP01 — Prompt Expand in Focus Panel + Session Row Tooltip (B022)

### Only file to touch: `client/src/views/ObserverView.tsx`

No server changes. No new routes. No shared type changes.

---

### Part A — `expandedPrompts` state

Add state near the other Set-based state (`expandedGroups`):

```typescript
const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());
```

---

### Part B — Reset on session change

The existing `useEffect` that syncs the note field when `focusedId` changes (around line 394) should also reset `expandedPrompts`:

```typescript
useEffect(() => {
  if (!focusedId) {
    setNoteValue('');
    setNoteSaved(false);
    setExpandedPrompts(new Set());
    return;
  }
  const entry = sessions.find((s) => s.entry.session_id === focusedId)?.entry;
  setNoteValue(entry?.note ?? '');
  setNoteSaved(false);
  setExpandedPrompts(new Set());
}, [focusedId]); // eslint-disable-line react-hooks/exhaustive-deps
```

---

### Part C — Focus panel prompt row

In the focus panel event rendering, locate the prompt row. It currently looks like:

```tsx
<span className="text-foreground flex-1 break-all">{eventSummary(ev)}</span>
```

Replace this span with expand-aware rendering **only for `user_prompt` events**. The full prompt is available as `ev.prompt`.

The threshold for showing expand: only when `(ev.prompt ?? '').length > 80` — i.e. when `eventSummary` is actually truncating.

```tsx
{
  ev.event === 'user_prompt' && (ev.prompt ?? '').length > 80 ? (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setExpandedPrompts((prev) => {
          const next = new Set(prev);
          if (next.has(ev.id)) next.delete(ev.id);
          else next.add(ev.id);
          return next;
        });
      }}
      className="flex-1 text-left bg-transparent border-none cursor-pointer p-0 group"
      title={expandedPrompts.has(ev.id) ? 'Collapse' : 'Expand full prompt'}
    >
      {expandedPrompts.has(ev.id) ? (
        <span className="text-foreground whitespace-pre-wrap break-words leading-relaxed">
          {ev.prompt}
        </span>
      ) : (
        <span className="text-foreground break-all">
          {eventSummary(ev)}
          <span className="text-muted-foreground/50 ml-1 group-hover:text-muted-foreground">›</span>
        </span>
      )}
    </button>
  ) : (
    <span className="text-foreground flex-1 break-all">{eventSummary(ev)}</span>
  );
}
```

Place this where the original `<span className="text-foreground flex-1 break-all">` was — keep the `flex-1` on the button so it fills the remaining row width.

---

### Part D — Session list row tooltip

In the session list, the bottom row shows `first_real_prompt`. Currently:

```tsx
<span className="text-xs text-muted-foreground/70 truncate">
  {s.entry.first_real_prompt ? (
    <span className="italic">{s.entry.first_real_prompt}</span>
  ) : lastEvent ? (
    eventSummary(lastEvent)
  ) : null}
</span>
```

Add a `title` attribute to the outer span:

```tsx
<span
  className="text-xs text-muted-foreground/70 truncate"
  title={s.entry.first_real_prompt ?? undefined}
>
  {s.entry.first_real_prompt ? (
    <span className="italic">{s.entry.first_real_prompt}</span>
  ) : lastEvent ? (
    eventSummary(lastEvent)
  ) : null}
</span>
```

That's the entire Part D change — one attribute.

---

### Done when

- `expandedPrompts: Set<string>` state exists in `ObserverView`
- `expandedPrompts` resets when `focusedId` changes
- Focus panel `user_prompt` rows with prompt > 80 chars show truncated text + `›` indicator
- Clicking the prompt text toggles full display (`whitespace-pre-wrap`) / collapsed
- Short prompts (≤80 chars) render unchanged — no button, no chevron
- Session list row bottom-row span has `title={s.entry.first_real_prompt ?? undefined}`
- `npm run typecheck` clean
- `npm run lint` clean
- Client baseline: 44 tests still passing (no new tests required)
- Server baseline: 177 tests still passing (untouched)

---

## Quality Gates

1. `npm run typecheck` clean
2. `npm run lint` clean
3. `npm test --workspace client` — 44 passing
4. No server files touched — server test count unchanged
5. No new dependencies added
6. `expandedPrompts` resets on session change — do not forget this

---

## Learnings from Prior Waves

- `expandedGroups` (Set<string>) is already in `ObserverView` — `expandedPrompts` follows the exact same pattern
- `AngelEyeEvent.id` is the stable unique key — use it, not `ev.ts` or array index
- `e.stopPropagation()` is required on interactive elements inside session rows — the outer div has an `onClick` for `handleRowClick`
- Sequential units forced when they share `ObserverView.tsx` — do all changes in one pass
- No client tests cover `ObserverView` interactions — typecheck + lint are the verification gates here
