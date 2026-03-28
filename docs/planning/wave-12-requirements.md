# Wave 12 Requirements — Network Sync + Angel Feedback Pipeline

**Created**: 2026-03-27
**Status**: Draft
**Depends on**: All prior waves (1–11) complete
**Reference patterns**: FliHub sync (`~/dev/ad/flivideo/flihub/`), Studio Signal Angela (`~/dev/clients/supportsignal/signal-studio/`)

---

## Overview

Wave 12 adds two capabilities to AngelEye:

1. **Git Sync** — When David pushes a commit, every other AngelEye instance on the network detects the update within 2 minutes and offers one-click pull.
2. **Angel Feedback Pipeline** — A structured path for non-technical users (or David himself wearing a "product owner" hat) to submit feature requests in natural language, have them triaged, and produce versioned requirements documents for implementation.

Both capabilities are designed to become AppyStack recipes. The AngelEye implementation is the first consumer.

---

## Capability 1: Git Sync

### Problem

AngelEye runs on multiple machines (M4 Mini, M4 Pro, potentially others). When David develops on one machine and pushes, the other machines run stale code. Currently there is no way for a non-technical user (or David on a different machine) to know updates are available or to pull them without using the terminal.

### User Stories

**US-1**: As an AngelEye user on any machine, I see a status indicator in the header that tells me whether my copy is up to date, so I never unknowingly run stale code.

**US-2**: As an AngelEye user, when updates are available, I see a flashing indicator and can pull them with one click, without knowing any git commands.

**US-3**: As an AngelEye user, after pulling updates, the server restarts automatically so I get the new version without manual intervention.

### Functional Requirements

#### FR-GS-01: Status Polling

- The client polls `GET /api/git-sync/status` every **120 seconds** (configurable via `GIT_SYNC_POLL_MS` env var).
- The server runs `git fetch --quiet` (15s timeout), then determines state from `rev-parse`, `rev-list --left-right --count`, and `git status --porcelain`.
- Returns a state machine value: `clean`, `behind`, `dirty`, `ahead`, `diverged`, `error`, or `pulling`.
- Includes commit count (behind/ahead), branch name, short SHAs, and last-checked timestamp.
- When `behind > 0`, includes up to 10 commit summaries (SHA, message, author, date).

#### FR-GS-02: One-Click Pull

- `POST /api/git-sync/pull` executes `git pull --rebase` (120s timeout).
- **Refuses** if working tree is dirty (uncommitted changes). Returns clear error message.
- On conflict: runs `git rebase --abort`, returns error. User resolves manually.
- On success: returns previous SHA, new SHA, commits pulled count, and `restartTriggered` flag.

#### FR-GS-03: Header Indicator (GitSyncPill)

- Colour-coded pill in the Header right-side area.
- States and colours:
  - `clean` → green, "Synced"
  - `behind` → orange with pulse animation, "N behind"
  - `dirty` → red, "Dirty"
  - `ahead` → blue, "N ahead"
  - `diverged` → purple, "Diverged"
  - `error` → grey, "Sync error"
  - `pulling` → amber with spinner, "Pulling…"
- Clicking `behind` or `diverged` opens the pull confirmation modal.
- Clicking other states opens a detail tooltip (branch, commit, last checked).

#### FR-GS-04: Pull Confirmation Modal

- Shows commit count and list of commit summaries (max 10).
- "Pull Now" button (primary) + "Cancel".
- During pull: spinner + "Pulling…" on button.
- On success: "Pulled N commits. Server restarting…" — auto-closes after 3s.
- On failure: error message in red, "Close" button.

#### FR-GS-05: Server Restart After Pull

- After successful pull, schedules `process.exit(0)` with 2s delay (HTTP response sent first).
- Overmind detects exit and restarts both client and server.
- If Overmind not detected (`OVERMIND_SOCKET` unset): skip restart, warn user to restart manually.
- Client polls `/health` every 2s after receiving `restartTriggered: true`, refreshes page when server returns.

### Non-Functional Requirements

- **NFR-GS-01**: All git operations use `execFile` (not `exec`) — no shell injection.
- **NFR-GS-02**: `GIT_TERMINAL_PROMPT=0` on all git commands — never hang waiting for credentials.
- **NFR-GS-03**: Promise-chain mutex (`withGitLock`) — concurrent git operations are serialised.
- **NFR-GS-04**: Git fetch failure is non-fatal — status returns `error` state, next poll retries.
- **NFR-GS-05**: No new dependencies. Uses `node:child_process`, plain `fetch`, `useState`/`useEffect`.

### Files

| Action | File                                      | Description                                                                     |
| ------ | ----------------------------------------- | ------------------------------------------------------------------------------- |
| Create | `shared/src/git-sync.ts`                  | Shared types: `GitSyncState`, `GitSyncStatus`, `GitPullResult`, `CommitSummary` |
| Create | `server/src/services/git-sync.service.ts` | Git operations: `checkStatus()`, `pullUpstream()`, mutex, `git()` helper        |
| Create | `server/src/routes/git-sync.ts`           | Express router: `GET /status`, `POST /pull`                                     |
| Create | `client/src/hooks/useGitSync.ts`          | Polling hook (2-min interval)                                                   |
| Create | `client/src/components/GitSyncPill.tsx`   | Header pill indicator                                                           |
| Create | `client/src/components/GitSyncModal.tsx`  | Pull confirmation modal                                                         |
| Modify | `server/src/index.ts`                     | Mount `/api/git-sync` router                                                    |
| Modify | `client/src/components/Header.tsx`        | Add `<GitSyncPill />`                                                           |
| Modify | `client/src/styles/index.css`             | Add `sync-pulse` keyframe                                                       |
| Modify | `shared/src/index.ts`                     | Re-export git-sync types                                                        |

### Backlog Items

- **B045** — Git sync: status polling + pull endpoint + header pill + modal
- **B046** — Git sync: server restart coordination (Overmind-aware)
- **B047** — Git sync: `GIT_SYNC_POLL_MS` env var configuration

### Design Reference

Full technical design: `docs/planning/git-sync-plan.md`
Primary pattern source: FliHub sync (`flihub/server/src/routes/sync.ts`, `flihub/client/src/hooks/useSyncApi.ts`)

---

## Capability 2: Angel Feedback Pipeline

### Problem

AngelEye currently has no structured way to capture feature requests, UX feedback, or workflow observations from users who aren't developers. Even David, when wearing a product-owner hat, has no path from "I notice X" to "implement X" that doesn't require switching context to a development session.

### Background: The Angela Pattern

This capability is modelled on the Angela feedback pipeline built for SupportSignal's Signal Studio. Angela is a non-technical domain expert (NDIS care). The flow:

```
Angela speaks plain language
  → Claude ("Angela Mode") writes to AngelaFeedback.md — capture only, NO implementation
  → David runs /ange-sync evaluate — steps through items, decides: implement / defer / reject / modify
  → Decisions recorded in decision-log.md
  → Approved items become AS-NNN-requirements.md (versioned handoff docs)
  → Ralphy (autonomous agent) consumes requirements for implementation
```

AngelEye's "Angel" variant adapts this for a different domain (session intelligence, not NDIS care) but preserves the four-mode structure.

### User Stories

**US-4**: As a user of AngelEye, I can describe what I want in plain language to Claude (in "Angel mode"), and my request is captured in a structured document without any implementation happening.

**US-5**: As David (developer), I can run `/angel evaluate` to step through pending feedback items one by one, making implement/defer/reject/modify decisions that are logged for traceability.

**US-6**: As David, I can run `/angel handoff` to generate a versioned requirements document (AE-NNN) from approved items, ready for plan-mode or recipe-based implementation.

**US-7**: As David, I can run `/angel summary` to get a plain-language recap of what was captured and decided, suitable for sharing with non-technical stakeholders.

**US-8**: As David, I can run `/angel audit` to log reasoning, rollbacks, or context notes to an audit trail, so future sessions understand not just what was decided but why.

### Functional Requirements

#### FR-AF-01: Angel Mode (Capture)

- Triggered by saying "angel mode", "angel feedback", or "talk to angel" in a Claude Code session within the AngelEye project.
- Claude switches to product feedback scribe role:
  - Writes requests to `AngelFeedback.md` in structured format (numbered, categorised, action-oriented).
  - Does NOT implement anything.
  - Flags conflicts with existing features or pending items.
  - Suggests schema/architecture implications where relevant.
  - Uses conversational, non-technical tone.
- Categories available: Observer UX, Organiser UX, Classification/Intelligence, Sync & Deployment, Skills, Infrastructure, New Views, Data Model, Integration.

#### FR-AF-02: Evaluate Mode

- Triggered by `/angel evaluate` or `/angel eval`.
- Reads `AngelFeedback.md`, identifies pending (unresolved) items.
- Presents each item one at a time in plain language.
- For each: checks for contradictions with prior decisions in `decision-log.md`, states technical implication.
- Asks David: **implement / defer / reject / modify**.
- Records decision + reasoning to `docs/angel-sync/decision-log.md`.
- On "implement": item becomes candidate for handoff.
- On "modify": captures revised requirement, marks original as superseded.

#### FR-AF-03: Summary Mode

- Triggered by `/angel summary`.
- Generates a plain-language recap of:
  - Items captured since last summary
  - Decisions made (approved, deferred, rejected)
  - Outstanding items still pending
- Warm, professional tone. No developer terminology.
- Output to conversation only (not written to file).

#### FR-AF-04: Audit Mode

- Triggered by `/angel audit`.
- Appends an entry to `docs/angel-sync/audit-log.md` with:
  - Timestamp, session context
  - Changes, decisions, rollbacks, or reasoning notes
  - Links to relevant feedback items or decision-log entries
- This is the knowledge transfer trail for downstream developers.

#### FR-AF-05: Handoff Mode

- Triggered by `/angel handoff`.
- Reads decision-log for all "implement" decisions not yet handed off.
- Generates versioned requirements document: `docs/angel-sync/AE-NNN-requirements.md`.
- Document structure:
  - **Goal**: one-sentence summary
  - **Work Units**: discrete implementation tasks with done-when criteria
  - **Constraints**: known limitations, dependencies, or trade-offs
  - **Source Items**: links back to AngelFeedback.md item numbers
- Structured for consumption by plan-mode (`/plan`) or recipe-based implementation.

### Files

| Action    | File                                         | Description                                      |
| --------- | -------------------------------------------- | ------------------------------------------------ |
| Created   | `.claude/skills/angel/SKILL.md`              | Skill definition with 4 modes                    |
| Created   | `.claude/skills/angel/references/formats.md` | Document format templates                        |
| Created   | `AngelFeedback.md`                           | Feedback capture document (project root)         |
| Created   | `docs/angel-sync/decision-log.md`            | Decision tracking                                |
| Created   | `docs/angel-sync/audit-log.md`               | Audit trail                                      |
| Generated | `docs/angel-sync/AE-NNN-requirements.md`     | Versioned handoff docs (created by handoff mode) |

### Backlog Items

- **B048** — Angel skill: evaluate + summary + audit + handoff modes (skill already created, needs field testing)
- **B049** — Angel feedback: first real feedback cycle (capture → evaluate → handoff)

### Design Reference

Skill implementation: `.claude/skills/angel/SKILL.md`
Primary pattern source: Angela skill (`~/.claude/skills/angela/SKILL.md`), Studio Signal Angela (`signal-studio/.claude/skills/angela/`)

---

## Shared: AppyStack Recipe Candidates

Both capabilities are designed for extraction into AppyStack recipes once validated in AngelEye:

| Recipe              | What to extract                                                            | What stays app-specific                          |
| ------------------- | -------------------------------------------------------------------------- | ------------------------------------------------ |
| `git-sync`          | Service, route, types, hook, pill component, modal                         | Restart strategy, pill placement, poll interval  |
| `feedback-pipeline` | 4-mode skill structure, document formats, decision-log/audit-log templates | Domain categories, terminology, handoff consumer |

Recipe extraction is deferred until both capabilities are field-tested in AngelEye. Track as **B050**.

---

## Backlog Summary (New Items)

| ID   | Description                                                        | Priority | Capability |
| ---- | ------------------------------------------------------------------ | -------- | ---------- |
| B045 | Git sync: status polling + pull endpoint + header pill + modal     | High     | Git Sync   |
| B046 | Git sync: server restart coordination (Overmind-aware)             | High     | Git Sync   |
| B047 | Git sync: `GIT_SYNC_POLL_MS` env var configuration                 | Low      | Git Sync   |
| B048 | Angel skill: field-test evaluate + summary + audit + handoff modes | Medium   | Angel      |
| B049 | Angel feedback: first real feedback cycle end-to-end               | Medium   | Angel      |
| B050 | Extract git-sync + feedback-pipeline as AppyStack recipes          | Low      | Both       |

---

## Acceptance Criteria

### Git Sync — Done When

- [ ] `GET /api/git-sync/status` returns correct state for all 7 states
- [ ] `POST /api/git-sync/pull` succeeds on clean tree, refuses on dirty tree
- [ ] GitSyncPill appears in Header with correct colours per state
- [ ] "Behind" state shows pulsing animation
- [ ] Clicking "behind" pill opens modal with commit list
- [ ] "Pull Now" executes pull and shows success/failure
- [ ] Server restarts via Overmind after successful pull
- [ ] Client detects restart and refreshes automatically
- [ ] Entire detect-to-pull cycle works within 2 minutes of David pushing

### Angel Pipeline — Done When

- [ ] `/angel` in capture mode writes structured items to `AngelFeedback.md`
- [ ] `/angel evaluate` presents items one-by-one and records decisions
- [ ] `/angel summary` produces readable plain-language recap
- [ ] `/angel audit` appends timestamped entry to audit log
- [ ] `/angel handoff` generates AE-001-requirements.md from approved items
- [ ] Full cycle tested: capture → evaluate → handoff → implementation via plan-mode
