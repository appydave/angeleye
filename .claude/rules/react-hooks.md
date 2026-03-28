---
paths: ['client/src/**/*.tsx', 'client/src/**/*.ts']
---

# React Hooks — Rules of Hooks

**Never place hooks after an early return.** All `useState`, `useEffect`, `useCallback`, `useRef`, and custom hooks must be called before any conditional `return` statement.

This is a React invariant: hooks must be called in the same order on every render. If a component returns early on render N (skipping some hooks) and then renders past the early return on render N+1, React sees a different hook count and crashes with "Rendered more hooks than during the previous render."

**Common trap in this codebase:** Async hooks like `useGitSync` return `null` on first render while fetching. It's tempting to write:

```tsx
// BAD — hooks after early return
function MyComponent() {
  const { status } = useGitSync();
  const [open, setOpen] = useState(false);

  if (!status) return null;  // early return

  const handleClick = useCallback(() => { ... }, []);  // CRASH: not called when status is null
  // ...
}
```

**Correct pattern:**

```tsx
// GOOD — all hooks before any early return
function MyComponent() {
  const { status } = useGitSync();
  const [open, setOpen] = useState(false);
  const handleClick = useCallback(() => { ... }, []);

  if (!status) return null;  // safe — all hooks already called
  // ...
}
```
