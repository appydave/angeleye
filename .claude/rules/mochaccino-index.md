---
paths: ['.mochaccino/**', 'client/src/views/MockupsView.tsx']
---

# Mochaccino Design Index — Mandatory Update Rule

**EVERY TIME** you create, rename, move, or delete any design in `.mochaccino/designs/`, you MUST update `client/src/views/MockupsView.tsx` before finishing. This is NON-NEGOTIABLE. The user cannot access mockups that aren't registered here.

## How it works

`MockupsView.tsx` has a `phases` array. Each phase has a `title`, `tag` (count), `dates`, `desc`, `type: 'feature'`, and `items` array. Each item has `name`, `desc`, `path` (using `${MOCKUP_BASE}/design-name/index.html`), and optionally `featured: true`.

## Checklist

1. Place the HTML file at `.mochaccino/designs/{design-name}/index.html`
2. Add the design to the `phases` array in `MockupsView.tsx` — either append to an existing phase or create a new one
3. Update the phase `tag` count (e.g. `'3 designs'` → `'4 designs'`)
4. Verify: every directory in `.mochaccino/designs/` has a matching entry in MockupsView.tsx

## Common mistakes (DO NOT REPEAT)

- Writing standalone HTML to `.mochaccino/samples/` and calling it done — **the user cannot see these**
- Forgetting to register in MockupsView.tsx — **the user cannot see unregistered designs**
- There is NO static index.html — MockupsView.tsx is the ONLY index
