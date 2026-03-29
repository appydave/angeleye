---
paths:
  - server/src/config/workflows/**
  - docs/planning/workflow-*.md
  - docs/planning/workflow-automation-harness.md
  - shared/src/angeleye.ts
---

# Workflow Automation — Harness Integration Context

When working on workflow configs, workflow types, or the session-to-station router, you are touching AngelEye's **factory automation layer**. This layer maps Claude Code harness events to workflow state transitions.

## Canonical References

Before implementing anything involving agent orchestration or hook-driven automation, read:

| Topic                             | Location                                                                    |
| --------------------------------- | --------------------------------------------------------------------------- |
| All 25 hook events + input format | `~/dev/ad/brains/anthropic-claude/claude-code/hooks-reference.md`           |
| Background agent patterns         | `~/dev/ad/brains/anthropic-claude/claude-code/background-agents.md`         |
| Swarm teams + SendMessage         | `~/dev/ad/brains/anthropic-claude/claude-code/claude-code-swarm-teams.md`   |
| Task management (persistent)      | `~/dev/ad/brains/anthropic-claude/claude-code/task-management-system-v2.md` |
| Full brain index                  | `~/dev/ad/brains/anthropic-claude/INDEX.md`                                 |
| Workflow domain model             | `~/dev/ad/brains/angeleye/workflow-model.md`                                |
| Architecture doc                  | `docs/planning/workflow-automation-harness.md`                              |

## Key Harness Capabilities for Workflows

1. **Hook-driven station transitions** — `TaskCompleted`, `FileChanged`, `TeammateIdle` can trigger station state changes automatically
2. **Agent `initialPrompt`** — stations can self-start analysis agents without coordinator interaction
3. **Swarm teams** — Librarian/Sentinel as separate teammates using SendMessage for inter-agent coordination
4. **Background agents** — stations run as `run_in_background=true` for parallel pipeline execution
5. **`--bare` flag** — use for deterministic helper scripts (no hooks/LSP overhead)
6. **Persistent plugin state** — `${CLAUDE_PLUGIN_DATA}` survives updates, stores campaign progress
7. **Conditional rules** — this file! Path-scoped rules that only load in workflow contexts

## Design Principles

- **Station configs are pure data** — JSON in `server/src/config/workflows/`. Automation hints live alongside station definitions.
- **Hooks are triggers, not logic** — hooks fire events into AngelEye's event pipeline. The router/correlator makes decisions.
- **Stations own their harness config** — each station declares which hooks it listens to, whether it runs in background, and its initialPrompt template.
- **"Inbox is always the safe default"** — when automation can't determine the right action, surface it for human decision.
