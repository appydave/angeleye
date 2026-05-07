---
title: AppyCtrl Synthesis — Codified System + Corpus Evidence + Gap Analysis
date: 2026-05-07
purpose: Third entry in the harness-archetype synthesis series (after Ralphy and Ruflo). AppyCtrl is unique — it is *not* a Claude Code skill. It is a forked desktop app (T3.code / OpenCode) that David runs continuously and that *spawns Claude on a 5-minute timer*. So it shows up in AngelEye almost entirely as 1,007 silent sessions — sessions that are correctly filtered as junk for enrichment, but that ARE the harness's actual signature. Pairs the codified system (the appyctrl source tree + probeClaudeCapabilities) with what the AngelEye corpus actually shows about it.
sources:
  - /Users/davidcruwys/dev/ad/apps/appyctrl/README.md (T3 Code description)
  - /Users/davidcruwys/dev/ad/apps/appyctrl/AGENTS.md (architecture)
  - /Users/davidcruwys/dev/ad/apps/appyctrl/apps/server/src/provider/Layers/ClaudeProvider.ts:445 (probeClaudeCapabilities)
  - /Users/davidcruwys/dev/ad/apps/appyctrl/apps/server/src/provider/Drivers/ClaudeDriver.ts:40 (SNAPSHOT_REFRESH_INTERVAL = 5 min)
  - http://100.82.235.39:5051/api/sessions (lived experience — 1,007 silent + 11 non-silent in 2,496-session corpus)
  - docs/requirements/2026-05-06-meta-silent-session-taxonomy-and-junk-filter.md
  - docs/intelligence/escapes-ledger.md
spike_validates: .claude/skills/angeleye-retrieve/SKILL.md
---

# AppyCtrl Synthesis — Codified + Corpus + Gap

This is the third use of the synthesis pattern (after Ralphy + Ruflo) and the first one targeting a harness that **isn't a skill**. AppyCtrl is a forked desktop application — `T3 Code` / OpenCode by t3tools — that David runs continuously and has customised. It manages provider sessions, exposes a web GUI for conversational coding, and silently probes Claude every 5 minutes for account + slash-command metadata.

Two purposes:

1. **Cross-validate the synthesis methodology** — does the skill+corpus pattern still produce useful output when the "skill" is actually an app that produces no first-person prompts most of the time?
2. **Make AppyCtrl visible as a harness archetype** — David has 5 orchestrator harnesses (BMAD multi-tmux, Ruflo multi-Task, Ralphy autonomous-batch, Paperclip multi-page hosting, AppyCtrl T3-fork). AppyCtrl's harness-technique is unique: a **persistent host process driving Claude over the SDK**, not a per-invocation skill.

---

## Spike validation — corpus retrieval works for "invisible" harnesses

Running the regex `appyctrl|t3\.code|t3code|opencode|capability.probe|silent.probe|probeClaude` against the live corpus:

- **2,496** total sessions paged
- **1,944** pre-filtered (kind ≠ subagent/subprocess; junk allowed because AppyCtrl probes ARE junk-tagged)
- **669** cheap-match candidates
  - **657** silent appyctrl sessions (`session_subtype === 'meta.silent_session'`, `is_junk: true`)
  - **11** non-silent appyctrl sessions (real dev work on AppyCtrl itself, plus 1 cross-project mention from `brains`)
  - **1** session matched on raw text without classifier subtype
- **1,007** total silent sessions corpus-wide (appyctrl is 651/1,007 ≈ 65% of all silent sessions)

The retrieve skill works fine on a system that mostly produces silence — the silent sessions are themselves the signal. The interesting addition: a count + project distribution of silent sessions is more informative for AppyCtrl than a list of prompts.

---

## Codified AppyCtrl (what the source tree says)

### Identity

> "T3 Code is a minimal web GUI for coding agents (currently Codex and Claude, more coming soon)."
> — `/Users/davidcruwys/dev/ad/apps/appyctrl/README.md`

AppyCtrl is David's local fork of `T3 Code` (also published as `t3` and discord.gg/jn4EGJjrvv). Repo `pingdotgg/t3code` upstream. David's version lives at `/Users/davidcruwys/dev/ad/apps/appyctrl/`. The README says: "We are very very early in this project. Expect bugs. We are not accepting contributions yet." David's fork is a customisation track, not an attempted upstream contribution.

### Architecture (from AGENTS.md + tree)

| Package              | Role                                                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/server`        | Node.js WebSocket server. Wraps `codex app-server` (JSON-RPC over stdio) per provider session; serves the React web app; manages provider sessions. **Where the probe lives.** |
| `apps/web`           | React/Vite UI. Owns session UX, conversation/event rendering, client-side state.                                                                                               |
| `packages/contracts` | effect/Schema schemas, TypeScript contracts (schema-only — no runtime).                                                                                                        |
| `packages/shared`    | Shared runtime utilities. Explicit subpath exports — no barrel index.                                                                                                          |

Four provider drivers exist: `ClaudeDriver`, `CodexDriver`, `CursorDriver`, `OpenCodeDriver`. Each has its own `SNAPSHOT_REFRESH_INTERVAL = Duration.minutes(5)`.

### The probe loop — AppyCtrl's signature behaviour

`apps/server/src/provider/Drivers/ClaudeDriver.ts:40-129`:

```ts
const SNAPSHOT_REFRESH_INTERVAL = Duration.minutes(5);
const CAPABILITIES_PROBE_TTL = Duration.minutes(5);
// ... per-instance Cache wrapping probeClaudeCapabilities ...
const snapshot =
  yield *
  makeManagedServerProvider({
    // ...
    refreshInterval: SNAPSHOT_REFRESH_INTERVAL, // ← every 5 minutes
  });
```

`apps/server/src/provider/Layers/ClaudeProvider.ts:432-498`:

```ts
/**
 * Probe account information by spawning a lightweight Claude Agent SDK
 * session and reading the initialization result.
 *
 * We pass a never-yielding AsyncIterable as the prompt so that no user
 * message is ever written to the subprocess stdin. This means the Claude
 * Code subprocess completes its local initialization IPC (returning
 * account info and slash commands) but never starts an API request to
 * Anthropic. We read the init data and then abort the subprocess.
 */
const probeClaudeCapabilities = (claudeSettings, environment) => {
  // ...
  const q = claudeQuery({
    // Never yield — we only need initialization data, not a conversation.
    prompt: (async function* () {
      await waitForAbortSignal(abort.signal);
    })(),
    options: {
      persistSession: false,
      pathToClaudeCodeExecutable: claudeSettings.binaryPath,
      abortController: abort,
      // ...
    },
  });
  const init = await q.initializationResult();
  // returns email, subscriptionType, tokenSource, slashCommands
  // then aborts the subprocess
};
```

**What this means in AngelEye terms:**

- Every 5 minutes per Claude provider instance, AppyCtrl's server spawns the `claude` CLI as a subprocess
- The Claude CLI fires its hooks (`SessionStart`, `InstructionsLoaded`, `SessionEnd`)
- AngelEye's hook receivers log all three to the registry
- The probe NEVER yields a user prompt to the subprocess (by design — it's reading metadata, not having a conversation)
- The subprocess is aborted as soon as `initializationResult()` resolves
- Result: a session with `session_start` + `instructions_loaded` × N + `session_end` events, **zero `user_prompt` events**

That zero-prompt pattern is exactly what `meta.silent_session` was created to detect (per `docs/requirements/2026-05-06-meta-silent-session-taxonomy-and-junk-filter.md`).

### What AppyCtrl is NOT

- **Not a Claude Code skill** — `find /Users/davidcruwys/dev -path '*appyctrl*' -name 'SKILL.md'` returns nothing. Slash commands like `/t3-upstream-refresh` exist (one was found in the corpus, session `77e7fffc`) but those live in `~/.claude/commands/` not in the appyctrl repo.
- **Not in the brain** — `~/dev/ad/brains/appyctrl/` does not exist. There's no curated knowledge document — the source tree IS the knowledge.
- **Not a CLI invocation** — AppyCtrl is a long-running GUI app the user _runs_, not a command they call.

---

## Lived AppyCtrl (what the corpus shows)

### The dominant signal: silent probe sessions

| Metric                                               | Value                                                    |
| ---------------------------------------------------- | -------------------------------------------------------- |
| Total silent sessions corpus-wide                    | **1,007**                                                |
| Silent sessions tagged to `project: appyctrl`        | **651**                                                  |
| Silent sessions correctly marked `is_junk: true`     | **1,007** (100%)                                         |
| Silent sessions slipped through (`is_junk !== true`) | 0 (E3 escape rate clean)                                 |
| Silent session cadence (recent sample, 2026-05-07)   | ~1 every 5 minutes (matches `SNAPSHOT_REFRESH_INTERVAL`) |

The cadence is checkable from the data. Looking at recent appyctrl silent sessions:

```
03:01:02 → dfc57d59
02:55:54 → 5b4043b4   (Δ = 5m08s)
02:50:48 → faea6349   (Δ = 5m06s)
02:45:41 → 962bfff8   (Δ = 5m07s)
02:40:33 → e1105a45   (Δ = 5m08s)
02:35:26 → e73345b5   (Δ = 5m07s)
02:30:18 → cd82d741   (Δ = 5m08s)
```

Five-minute intervals, dead-on. This IS `SNAPSHOT_REFRESH_INTERVAL = Duration.minutes(5)` running in the wild. The corpus is empirically verifying the source code.

### Silent sessions by project — the 5-minute heartbeat is everywhere

```
appyctrl                      651
app.supportsignal.com.au      320
dev                             9
server                          6
brains                          4
angeleye                        3
awb                             3
poem                            2
appystack                       2
als-workflows                   1
... (smaller)                  ~7
```

**Crucial reading:** the silent sessions tagged to other projects are _also_ AppyCtrl probes — the `project` field reflects the `cwd` at the moment the probe fired, which depends on what tab/workspace the user had open in T3 Code at that moment. So 320 silent sessions in `app.supportsignal.com.au` doesn't mean SupportSignal is also probing — it means AppyCtrl was running while the user had a SupportSignal session open in the GUI.

Net: **virtually all 1,007 silent sessions are AppyCtrl probe artefacts** with the project distribution being a leak of AppyCtrl's per-instance per-cwd Claude provider model. That accidentally tells us _which projects David has had open in AppyCtrl over the corpus window_ — appyctrl itself, SupportSignal heavily, and a long tail of others.

### The non-silent signal: AppyCtrl as a development target

11 non-silent sessions matched the regex. Top recent:

| Date       | Session    | Subtype                          | Trigger             | First prompt summary                                                                                 |
| ---------- | ---------- | -------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------- |
| 2026-05-06 | `c408f239` | build.prompt_engineering         | (none)              | "What can you tell me about the Ruflow agents we have at the moment..." → Rufus skill build          |
| 2026-05-06 | `06ad6e2d` | build.campaign                   | (none)              | "Phase 3.1 handover... AppyCtrl... app launcher rendering" — orchestrated build continuation         |
| 2026-05-06 | `a6fde96f` | build.feature                    | (none)              | "I just really want to get the work done... should we just do a commit?"                             |
| 2026-05-05 | `4d27394b` | orientation.codebase_exploration | (none)              | "Just curious, do you stop working when you reboot..." → ran system-context on appyctrl              |
| 2026-05-05 | `bae35b9c` | meta.accidental                  | (none)              | "login"                                                                                              |
| 2026-05-05 | `63510f39` | orientation.codebase_exploration | (none)              | "test"                                                                                               |
| 2026-05-05 | `0de3f903` | build.feature                    | (none)              | "How do we upgrade this application? I believe we have a skill for it."                              |
| 2026-05-04 | `77e7fffc` | knowledge.methodology_design     | t3-upstream-refresh | `/t3-upstream-refresh` — questions about upstream sync workflow                                      |
| 2026-05-03 | `97ebb4f8` | build.feature                    | (none)              | "Did we have a plan on how to keep api control in sync with T3.code?"                                |
| 2026-05-02 | `c96b8313` | build.feature                    | (none)              | "...I quit the T3 application from the tray on my Mac, and for some reason..."                       |
| 2026-05-01 | `123ca2a2` | knowledge.methodology_design     | (none)              | (project: brains) "I want you to bring up the T3.code folder for me. I want to hear your opinion..." |

Enrichment notes for the top 5 confirm:

- `c408f239`: Started by researching Ruflow swarm setup, then realised a video he'd made got the concept wrong. Built brand-new Rufus companion skill. **AppyCtrl was the workspace; Ruflo was the topic.**
- `06ad6e2d`: Phase 3.1 handover for AppyCtrl app launcher rendering. Multiple agents spawned, reading and editing files. Heuristic said `ruflo_orchestrator` but no Ruflo skill was invoked — orchestrated build continuation. **Confirms David said "I did it all in AppyCtrl" — Ruflo-style work was happening _inside_ AppyCtrl as the host.**
- `4d27394b`: David ran `system-context` against appyctrl to generate CONTEXT.md. **He treats AppyCtrl as a real, audited project.**
- `77e7fffc`: David asking how his dev workflow handles T3.code upstream — why does the app restart during code changes, how do we track our gap vs upstream, what should the upstream-refresh process be. **Confirms the fork-management problem is on his mind.**
- `123ca2a2`: Discussion about T3.code as basis for "AI-native company control surface" with embedded Chrome browser ideas. **AppyCtrl is a strategic exploration, not just a tool.**

### The 1,007 vs 11 ratio

The corpus is **~99% AppyCtrl-as-probe-emitter** and **~1% AppyCtrl-as-development-target**. Without the silent-session filter, AppyCtrl would have _swamped_ the enrichment queue with noise; with the filter, it nearly disappears from view. Both pictures are wrong if read alone.

---

## Gap analysis — Codified vs Lived

### What the source tree says about the probe

The probe code is _honest about itself_ — the comment at line 432 explicitly explains: "We pass a never-yielding AsyncIterable as the prompt so that no user message is ever written to the subprocess stdin." The code knows it's producing a session-shaped artefact with no conversation. From AppyCtrl's perspective this is correct: the Claude SDK's `initializationResult()` IPC is the only data path that returns account info + slash commands, so the probe has to spawn the subprocess to get it.

### What the corpus shows about the cost

The probe was generating ~288 sessions/day (12/hour × 24h) per active Claude provider instance. With the silent-session filter (`docs/requirements/2026-05-06-meta-silent-session-taxonomy-and-junk-filter.md`) shipped on 2026-05-06, those sessions are correctly tagged `meta.silent_session` and `is_junk: true`. They no longer enter the enrichment queue. Cost saved: ~2,000 LLM enrichment calls/week.

### What's still wrong

1. **The probe still fires** — AppyCtrl has no way to know AngelEye is filtering it. Every 5 minutes, AngelEye's hook receivers ingest 5+ events, write them to the registry, classify them, and only THEN throw them away as junk. Junk-filtered ≠ unprocessed. Hook ingestion + classifier work is still spent on each probe. Real cost (per probe): registry write × ~7 events + heuristic classifier pass.
2. **Project field is misleading** — silent sessions inherit the `cwd` of whatever tab the user has open in AppyCtrl at probe time. So `app.supportsignal.com.au` shows 320 silent sessions even though SupportSignal isn't doing anything autonomous — it's just where the user happened to be browsing in AppyCtrl. Anyone doing per-project analytics on `meta.silent_session` rows would draw wrong conclusions.
3. **No `harness_id` field** — there's no way to mark a silent session as "owned by AppyCtrl" vs "from some other source that happens to spawn Claude with no prompt." If David adds another T3-style host tomorrow (he runs Codex too, with the same 5-min probe pattern in `CodexDriver.ts:39`), the silent sessions from both will collapse into the same junk bucket.
4. **The non-silent AppyCtrl dev sessions are _also_ hard to distinguish** — `06ad6e2d` (the Phase 3.1 build campaign) was misclassified as `ruflo_orchestrator` by the heuristic even though no Ruflo skill was invoked. The enrichment LLM corrected this but the heuristic remains noisy.

### What this synthesis CAN'T confirm

1. Are _all_ 1,007 silent sessions actually AppyCtrl probes, or is some subset from a different cause (a human-opened-no-prompt session, a cron job, another T3 fork)? The current `meta.silent_session` taxonomy is a pattern, not a cause — by design — so this is unprovable from the registry alone. Would need to correlate timestamps with AppyCtrl's own provider snapshot logs.
2. Does AppyCtrl's CodexDriver / CursorDriver / OpenCodeDriver also produce silent sessions? They have the same 5-minute interval but spawn different binaries. Codex sessions wouldn't go through Claude Code hooks at all, so probably no — but worth confirming.
3. The 11 non-silent sessions span 6 days (2026-05-01 to 2026-05-06). Earlier corpus would surely have more — when did David start using AppyCtrl? When did he start _building on_ it (vs just running it)? The corpus is recent; longer history is in older JSONLs that may have been pruned.

---

## Reframe — AppyCtrl as a harness archetype

Comparing across the 5 orchestrator harnesses on the **harness-technique axis** — what mechanism each uses to run multiple Claude work-units:

| Harness       | Harness mechanism                                                         | Spawn point                                                      | Visibility in AngelEye                                                                                             | Persistence                                              |
| ------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| **BMAD**      | Multi-tmux panes, each running a `claude` CLI as the user                 | User opens tmux, types `claude`                                  | Each pane = one main session, fully visible, prompts intact                                                        | Session-bounded (close tmux = end)                       |
| **Ruflo**     | Multi-Task subagent orchestration via Claude Agent Teams                  | Inside a parent Claude session, `Task` tool spawns subagents     | Parent + subagents (subagents detected via `<teammate-message teammate_id="...">`)                                 | Bounded by parent session                                |
| **Ralphy**    | Single Claude session running an autonomous coordinator loop              | User runs `/ralphy` or `/appydave:ralphy`                        | One main session, very long (4k+ events), fully visible                                                            | Session-bounded; resumable via handover                  |
| **Paperclip** | Multi-page web UI, each page hosts a Claude subprocess in a workspace dir | Paperclip server forks `claude` per workspace                    | Subprocess sessions; project_dir = `.paperclip/instances/.../workspaces/<uuid>` (E1 escape category)               | App-bounded (app running = workspaces alive)             |
| **AppyCtrl**  | **Persistent host process driving Claude over the SDK on a 5-min timer**  | T3 Code app running, `probeClaudeCapabilities` fires every 5 min | **Silent sessions only** (`meta.silent_session`, `is_junk: true`); 1,007 such sessions, ~99% of AppyCtrl footprint | **App-bounded; runs continuously while T3 Code is open** |

### What's distinct about AppyCtrl's harness

1. **It's the only harness that runs Claude _without intending a conversation_.** Every other harness has a conversational goal — Ralphy's coordinator wants tests to pass, Ruflo's subagents want to deliver findings, BMAD's panes want a story shipped, Paperclip's workspaces want to render UI. AppyCtrl just wants _metadata_ — what's my account, what slash commands exist. The conversation is collateral damage of the SDK API surface.
2. **It's the only harness that runs continuously.** Ralphy ends when the campaign ends. Ruflo ends when the Task tools complete. BMAD ends when you close the tmux. Paperclip workspaces end when pulled. AppyCtrl runs _as long as the desktop app is open_ — which for David is most of the day. It's the only "always-on" harness.
3. **It's the only harness whose normal operation produces what the corpus calls "junk".** Every other harness produces signal — sessions worth enriching. AppyCtrl produces 99% noise (correctly filtered) + 1% real dev work. From the per-session perspective it's almost invisible. From the volume perspective it's the largest single contributor — 651/2,496 ≈ 26% of the corpus is AppyCtrl-tagged silent.
4. **It's a meta-harness.** When David said "I did it all in AppyCtrl" about the Ruflo work, he meant: AppyCtrl was the _host_ in which his Ruflo (and Ralphy, and Mochaccino, and...) sessions ran. The other harnesses are _workflows_; AppyCtrl is the _workbench they run on_. Not pictured in this comparison: AppyCtrl is also a _fork-management problem_ — David is tracking gap vs upstream `pingdotgg/t3code` (per session `77e7fffc` and `97ebb4f8`).

### The reframing question

The 1,007 silent sessions are correctly filtered as junk for enrichment. They have no user content, no conversation, no story. From the enrichment-loop perspective, the filter is right.

But from the **harness-archetype perspective**, those same sessions are evidence: "**AppyCtrl is alive and probing every 5 minutes.**" That's a heartbeat. It's the same kind of signal a monitoring dashboard reads from `kubectl get pods` — the pod isn't doing anything interesting _itself_, but its existence at the right cadence tells you the system is healthy.

Should AngelEye recognise these as `harness_heartbeat` events rather than just filtering them as junk?

Reasons in favour:

- A `harness_heartbeat` taxonomy would let AngelEye answer: "Is AppyCtrl currently running?" "When did it last probe?" "Has the probe rate dropped (= app crashed)?"
- The same pattern would apply if a Codex equivalent or future host adopts the same 5-min probe — `harness_heartbeat` is _causal_ (this came from a host probing for capability metadata), where `meta.silent_session` is _observable_ (no user prompts in this session).
- It would surface AppyCtrl as a harness archetype in the UI without polluting the enrichment queue. UI could show: "AppyCtrl: 651 heartbeats in the last week; last beat 2 minutes ago; 11 dev sessions on AppyCtrl itself."
- Would let `harness_heartbeat` rows be hidden from default views but still queryable for "is the system alive?" diagnostics.

Reasons against:

- Causal classification (`harness_heartbeat`) would require AngelEye to know which host produced the probe — the pattern alone (`zero user_prompt + ~7 events`) doesn't differentiate AppyCtrl from a hypothetical other source. The current `meta.silent_session` taxonomy explicitly avoids this for that reason (per the requirement doc: "The classification describes what is observable; the notes describe what the LLM (or heuristic) suspects caused it.").
- The probe is _external infrastructure_ — the right fix may be at AppyCtrl (don't probe so often, or use a non-Claude IPC to read account metadata) rather than at AngelEye. AngelEye treating the noise as a feature might just normalise the upstream waste.
- Harness heartbeat could also be inferred from the probe cadence + project distribution at _report time_ without changing the schema — a dreaming-pass observation, not an ingestion concern.

This is a research observation, not a recommended code change. The question is logged for David to decide.

---

## Open questions for David

1. **Should silent appyctrl sessions become `harness_heartbeat`?** As above. Possibly with a sub-axis: `harness_heartbeat: appyctrl` vs `harness_heartbeat: codex` vs `harness_heartbeat: unknown`. Or stay with `meta.silent_session` and let `harness_heartbeat` be a derived view in the dreaming pass.
2. **The probe still fires through hooks, just to be filtered later.** Is it worth investigating whether AppyCtrl's `probeClaudeCapabilities` could use a Claude SDK option that _suppresses_ hook firing, or use a non-Claude data path entirely? Real cost is ~288 hook events/day × 7 events each ≈ 2,000 redundant registry writes/day. Owned by AppyCtrl, not AngelEye, but worth a 10-min check on the SDK options.
3. **The `06ad6e2d` Phase 3.1 misclassification (`ruflo_orchestrator` heuristic, no Ruflo skill invoked)** — same pattern that showed up in Ralphy's `build.campaign` vs `build.ralphy_campaign` finding. Heuristic is over-eager on multi-Task patterns and treats them as Ruflo. Worth a single classifier review pass once 3-4 such cases accumulate.
4. **What's the AppyCtrl _upstream-refresh_ workflow?** Sessions `77e7fffc` (`/t3-upstream-refresh`) and `97ebb4f8` ("Did we have a plan on how to keep api control in sync with T3.code?") show this is an open problem. Not for this synthesis to solve, but worth a brain doc — `~/dev/ad/brains/appyctrl/upstream-fork-management.md` would be the natural home.
5. **Should AppyCtrl get a brain folder?** `~/dev/ad/brains/appyctrl/` doesn't exist. The system has enough strategic weight (it's the meta-harness, it's a fork that needs upstream tracking, it's where Ruflo/Ralphy/Mochaccino actually run) to deserve curated knowledge. Mochaccino has a brain, Ruflo has one — AppyCtrl arguably should too.

---

## What this synthesis proves about the methodology

The skill+corpus pattern needed extension for a non-skill harness. Three adjustments worked:

- **The "skill" became the source tree** — `README.md` + `AGENTS.md` + the probe code are the codified intent. Same role as Ralphy's SKILL.md, different file shape.
- **The corpus reading inverted** — instead of "find sessions driven by this skill", it became "find sessions caused by this app + sessions developing this app". Two distinct populations (1,007 silent + 11 non-silent), each meaningful.
- **The gap analysis surfaced a category question** — "should silent sessions be reframed as heartbeats?" — that wouldn't appear from either source alone. The codified probe says "we spawn Claude with no prompt"; the corpus says "we have 1,007 of these"; the gap is "is that signal or noise?".

This generalises. The same pattern should work for any _running system_ (vs invocable workflow). Future candidates: Paperclip-as-system (vs Paperclip-as-workspace-leak), the shell aliases ecosystem, the launchd schedules running periodically. Each is a "system that runs and produces session traces" — the synthesis surfaces what the system _is_ (codified) vs what it _manifests as_ (corpus) vs what's missing (gap).

The retrieve skill made the corpus side cheap. The harness-archetype frame makes the synthesis comparable across all 5 orchestrators. The next two harnesses to synthesise — BMAD and Paperclip — should produce a complete map.
