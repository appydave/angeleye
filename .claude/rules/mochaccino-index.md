---
paths: ['.mochaccino/**']
---

# Mochaccino Design Index — Mandatory Update Rule

When you create, rename, or delete any design in `.mochaccino/designs/`, you MUST update **both** index files before finishing.

## Two indexes exist

1. **`client/src/views/MockupsView.tsx`** — the React app's gallery with rating/filtering (PRIMARY — this is the one the user interacts with in-app)
2. **`.mochaccino/index.html`** — static HTML gallery (useful for browsing without the server running)

Always update MockupsView.tsx first. It has a `phases` array — add a new phase object or append items to an existing phase.

## Checklist

1. Add the new design(s) to the `phases` array in `MockupsView.tsx`
2. Add the matching card(s) to `.mochaccino/index.html`
3. Update counts and dates in both files
4. Verify: every directory in `.mochaccino/designs/` has entries in both indexes
