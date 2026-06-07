# WorktreeCreate hook — remove from AngelEye registration

**Status**: Done (2026-05-19)
**Filed**: 2026-05-19 (from Arcana session, KyberBot bg-job adoption work)
**Severity**: Was blocking Claude Code background sessions from creating worktrees in any project with AngelEye's global hooks installed

## Problem

AngelEye's global `WorktreeCreate` hook registration was causing `ENOENT` errors in background-isolated sessions:

```
ENOENT: no such file or directory, chdir '/Users/davidcruwys/dev/kybernesis/arcana/' -> '{"continue":true}'
```

AngelEye registered for `WorktreeCreate` events assuming it could be a pure observer (log the event, pass through). This assumption was wrong.

## Root Cause

`WorktreeCreate` **replaces** the default git worktree behavior entirely — it does not extend it. It was designed for teams not using git (SVN, Mercurial, no VCS). When this hook is registered, Claude Code expects the hook to:

1. Create the worktree itself
2. Print the absolute path to stdout (command hooks) or return `{"hookSpecificOutput": {"worktreePath": "..."}}` (HTTP hooks)

**There is no passthrough/observer-only mode.**

AngelEye's hook used `curl || true` which:

- Always exited 0 (success)
- Printed the HTTP response body (`{"continue":true}`) to stdout
- Claude Code read that string as the worktree path → ENOENT

The original planning doc proposed returning HTTP 204 or `{"passthrough": true}` — neither works. HTTP 204 produces empty stdout (empty path fails creation). No skip/passthrough field exists for this hook type.

## Fix Applied

Removed `WorktreeCreate` from `~/.claude/settings.json`. AngelEye cannot observe this event without becoming a worktree creator, which is outside its scope.

`WorktreeRemove` was left in place — it IS observer-only (failures are logged, no path required, no decision control).

## Observing Worktree Creation Going Forward

AngelEye loses direct `worktree_create` event coverage. Options if this matters:

- `PostToolUse` on `EnterWorktree` — fires after the tool completes, payload includes the tool result with the worktree path. Note: GitHub issue #36205 reported that `EnterWorktree` ignored `WorktreeCreate` hooks at one point; that same version behaviour may affect `PostToolUse` coverage — verify in practice.
- Accept the gap — `WorktreeRemove` still fires, so worktree teardown is still observable.

## What NOT to do

Do not re-add `WorktreeCreate` to the hook registration unless AngelEye implements actual worktree creation logic (running `git worktree add`, deriving the path, returning it). Registering as a pure observer will always break worktree creation for bg-isolated sessions.

## Related

- `server/src/routes/hooks.ts` `EVENT_MAP` still contains `worktree_create` — that's fine, the mapping is harmless and preserves the ability to receive the event if another mechanism sends it.
- Original ENOENT reproduced from `/Users/davidcruwys/dev/kybernesis/arcana` on 2026-05-19, AngelEye PID 43635 on port 5051.
- Claude Code hook docs: `WorktreeCreate` designed for non-git VCS; hook replaces entire worktree workflow.
