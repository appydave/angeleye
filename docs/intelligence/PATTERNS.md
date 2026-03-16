# AngelEye Intelligence Patterns

**Purpose**: A living, self-improving knowledge base for B012 (ambient intelligence). Log observations, patterns, field ideas, tag taxonomy, Claude Code feature notes, and anything that should eventually make AngelEye smarter. Nothing here is implemented yet unless marked `[IMPLEMENTED]`.

**Confidence tags used throughout:**

- `[VALIDATED-100]` — confirmed across all 100-session analysis
- `[VALIDATED-20]` — confirmed in earlier 20-session pass, not yet contradicted
- `[HYPOTHESIS]` — plausible but not yet confirmed
- `[NEEDS-DATA]` — cannot be determined from event data alone

**Last major update:** 2026-03-15 (100-session synthesis)

---

## Table of Contents

1. [Session Labeling Signals](#1-session-labeling-signals)
2. [Schema Evolution](#2-schema-evolution)
3. [Tag Taxonomy and Session Taxonomy](#3-tag-taxonomy-and-session-taxonomy)
4. [Tool Use Patterns](#4-tool-use-patterns)
5. [Prompt Patterns](#5-prompt-patterns)
6. [Junk and Exclusion Rules](#6-junk-and-exclusion-rules)
7. [Marathon Session Handling](#7-marathon-session-handling)
8. [Claude Code Feature Watch](#8-claude-code-feature-watch)
9. [Observations Log](#9-observations-log)
10. [Known Gaps and Hard Limits](#10-known-gaps-and-hard-limits)

---

## 1. Session Labeling Signals

### Signal Reliability — Revised After 100 Sessions `[VALIDATED-100]`

| Signal                                            | Reliability                                            | Caveat                                                            |
| ------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| `project_dir` (full path)                         | 95% for most projects                                  | 0% discrimination within brains (239 sessions, same path)         |
| `(project_dir, tool_pattern)` combined            | ~87%                                                   | Best single composite signal                                      |
| First real user prompt (not paste, not injection) | 85%                                                    | ~40% of first prompts are not real user prompts — must skip these |
| First file path edited/read                       | 82%                                                    | Sub-label signal for brains (shows which brain name)              |
| Tool sequence pattern (first 10 events)           | 70–95%                                                 | Highly variable by session type — see Section 4                   |
| Session type via tool classifier                  | ~80% on focused sessions, ~62% on exploratory sessions | See accuracy scorecard                                            |

### The 4-Prompt Rule — Revised `[VALIDATED-100]`

- By prompt 1 (if it's a real user question): ~70% confidence
- By prompt 3 (real user prompts only): ~85% confidence
- By prompt 4: ~88% confidence

**Critical caveat `[VALIDATED-100]`:** Approximately 40% of first prompts are NOT real user intents. They are one of:

- Large paste (handover doc, prior session output, raw data)
- Claude Code context injection ("This session is being continued...")
- Ultra-short approval ("yes", "2", "ok")
- Accidental send ("jb", "x", double-paste)

**Revised rule:** Skip to the first prompt that is: (a) > 20 chars, (b) not starting with "This session is being continued", (c) not a single word or character. That is the first signal-bearing prompt.

### Brains Sub-label Signal `[VALIDATED-100]`

All 239+ brains sessions share `project_dir = /brains`. The brain name appears in the first 1–2 file paths in tool_use events. This is the most reliable sub-label signal for the brains project.

Pattern: first Read/Edit/Write path contains `brains/<brain-name>/` → `brain-name` is the sub-label.

Known brain names to map against: `brand-dave`, `kiros`, `lars`, `anthropic-claude`, `agentic-os`, `dynamous`, `dent`, `prompt-patterns`, `beauty-and-joy`, etc.

### Wave/Ralphy Signals `[VALIDATED-100]`

- "Wave N" keyword in prompt → NOT itself the label. It signals: a Ralphy campaign loop was used.
- If Ralphy → look for `/ralphy` skill invocation (Skill tool event) or TaskCreate burst
- If Ralphy → likely an IMPLEMENTATION_PLAN.md exists at `docs/planning/*/IMPLEMENTATION_PLAN.md`
- The wave number is a **context tag**, not a label. The label is what the wave is DOING.

### Project Field Disambiguation `[VALIDATED-100]`

`project` = `cwd.split('/').pop()` (last segment). Fails for:

- `brains` — 239 sessions, all same project
- `apps` — sessions started in the `/apps` parent dir
- `dev`, `clients`, `ad`, `src`, `lib` — generic parent dirs

**Rule:** When `project` is in `["apps", "dev", "clients", "ad", "src", "lib"]`, use two path segments for display. Example: `clients/supportsignal` not just `clients`.

---

## 2. Schema Evolution

### Current RegistryEntry (as of Wave 6) `[IMPLEMENTED]`

```typescript
interface RegistryEntry {
  session_id: string; // UUID
  project: string; // cwd last segment — "brains", "angeleye"
  project_dir: string; // full path
  started_at: string; // ISO
  last_active: string; // ISO, updated every event
  name: string | null; // human override — always wins in display
  tags: string[]; // human-set
  workspace_id: string | null; // Organiser assignment
  status: 'active' | 'ended';
  source: 'hook' | 'transcript';
}
```

### Proposed New Fields (B012 Phase 1) `[HYPOTHESIS]`

```typescript
// Candidate fields — not yet implemented
session_type?:        string | null   // validated taxonomy type, e.g. "build.campaign"
auto_label?:          string | null   // LLM-generated label — requires prompt reading
auto_tags?:           string[]        // system-assigned tags
label_confidence?:    number          // 0–100, updates incrementally
first_real_prompt?:   string | null   // first 100 chars of first non-injection user prompt
first_edited_dir?:    string | null   // brain/project sub-label from first file path
tool_pattern?:        string          // detected arc type (see Tool Use Patterns)
prompt_count?:        number          // real user prompts only (injections excluded)
tool_count?:          number          // total tool invocations
has_voice?:           boolean | null  // voice transcription detected in prompts
```

**Critical design decisions from 100-session data:**

1. `auto_label` can only be LLM-generated, not rule-based. Rules can produce `session_type`. Labels require reading prompts.
2. `first_real_prompt` must skip injections, pastes, and ultra-short approvals — not just `first_prompt`.
3. `prompt_count` must exclude context injection prompts (which start with "This session is being continued").
4. `file_size` should NOT be a stored metric for session weight — it is unreliable as a complexity signal.

**Design principle**: `name` + `tags` remain human-controlled and always override. `session_type` + `auto_tags` are system suggestions shown when human fields are null.

---

## 3. Tag Taxonomy and Session Taxonomy

### Canonical Session Taxonomy (validated against 100 sessions) `[VALIDATED-100]`

**6 top-level types, 21 subtypes.** Assign exactly one type per session.

| Type          | Subtype                      | Key signal                                       |
| ------------- | ---------------------------- | ------------------------------------------------ |
| `build`       | `build.campaign`             | TaskCreate burst + Edit/Bash cycle               |
| `build`       | `build.surgical`             | Edit dominant > 40%, few Reads                   |
| `build`       | `build.agent_delegated`      | Agent >= 10 cluster + Edit aftermath             |
| `build`       | `build.infrastructure`       | Bash dominant, no Playwright, server dirs        |
| `test`        | `test.uat_execution`         | playwright_click > 50 + fill_form > 0            |
| `test`        | `test.uat_observational`     | playwright_screenshot > 20 + navigate > 15       |
| `test`        | `test.debug_loop`            | Bash > 50 + Read/Edit cycling, no Playwright     |
| `test`        | `test.integration_run`       | Bash burst + Write (test results) + Agent        |
| `research`    | `research.web_scraping`      | browser_evaluate > 30 + navigate > 30            |
| `research`    | `research.codebase`          | Grep > 10 + Read-heavy opening                   |
| `research`    | `research.external`          | brave_web_search or WebFetch dominant            |
| `research`    | `research.knowledge_audit`   | Pasted Claude-window responses + brains dir      |
| `knowledge`   | `knowledge.brain_update`     | Edit/Write + Read in brains dir, no Bash         |
| `knowledge`   | `knowledge.brain_ingestion`  | Write-first after Glob, brains dir               |
| `knowledge`   | `knowledge.skill_authoring`  | Write→Edit in skills dir                         |
| `knowledge`   | `knowledge.skill_update`     | Edit-only in skills dir, small session           |
| `knowledge`   | `knowledge.pattern_design`   | Edit/Write in brains, multi-prompt, long gaps    |
| `ops`         | `ops.machine_provision`      | Ansible playbooks, Bash-heavy, SSH               |
| `ops`         | `ops.repo_maintenance`       | git-focused Bash, gitignore, large file handling |
| `ops`         | `ops.cross_machine_sync`     | Bash + SSH patterns                              |
| `ops`         | `ops.tool_install`           | Skill invocation + Bash install commands         |
| `orientation` | `orientation.cold_start`     | "What were we working on?" opener, minimal tools |
| `orientation` | `orientation.requirements`   | AskUserQuestion burst OR very long voice prompt  |
| `orientation` | `orientation.ideation`       | 0–5 tools, no file writes, pure conversation     |
| `orientation` | `orientation.handover_check` | Glob + Read only, no Edit, "handover" in prompt  |

### Tag Taxonomy v2 (updated from 20-session v1) `[VALIDATED-100]`

**Activity type** — now aligned with session taxonomy, assign one:

```
build        — creating, implementing, coding (maps to build.*)
test         — QA, UAT, debugging (maps to test.*)
research     — investigation, discovery, external lookup (maps to research.*)
knowledge    — brain/skill work, knowledge capture (maps to knowledge.*)
ops          — infrastructure, machine management, git ops (maps to ops.*)
orientation  — figuring out what to do, context recovery (maps to orientation.*)
```

**Domain** (assign 1–2 that apply):

```
brains       — second brain work (any subtype)
skills       — skill creation, modification, planning
testing      — test writing, QA strategy, CI/CD
client-work  — work for an external client
infrastructure — ansible, sysops, deployment
ui           — frontend components, design systems
content      — client communications, Loom processing, email templates
```

**Context** (optional, assign if applicable):

```
wave         — Ralphy campaign in progress (include wave number: wave-6, wave-7a)
appydave     — AppyDave brand/product work
voice        — session shows strong voice transcription patterns
marathon     — session spans > 3 hours or has > 5 context injections
```

**Open questions — no longer open `[VALIDATED-100]`:**

- `content` as a domain? YES — add it. Seen in voz, lars, beauty-and-joy client communication sessions.
- `architecture` as distinct activity? MERGE into `build.campaign` or `orientation.requirements`. Architecture discussions always lead to one of these.

---

## 4. Tool Use Patterns

### Validated Composite Classifier Rules `[VALIDATED-100]`

Applied in order. First match wins.

```
IF playwright_click > 50 AND fill_form > 0     → test.uat_execution      (confidence: 0.95)
IF playwright_screenshot > 20 AND navigate > 15 → test.uat_observational  (confidence: 0.90)
IF AskUserQuestion >= 5                         → orientation.requirements (confidence: 0.98)
IF TaskCreate >= 7 in first 20 events          → build.campaign           (confidence: 0.88)
IF browser_evaluate > 30 AND navigate > 30     → research.web_scraping    (confidence: 0.92)
IF CronCreate > 0                               → test.uat_execution       (confidence: 0.88)
IF Bash >= 50% AND project_dir contains brains  → knowledge or ops        (needs prompt)
IF Bash >= 50% AND NO playwright AND NO brains  → build.infrastructure     (confidence: 0.75)
IF Edit >= 40% AND Read <= 20%                  → build.surgical           (confidence: 0.85)
IF Write appears before any Read                → knowledge.skill_authoring or knowledge.brain_ingestion
IF total_tools == 0                             → orientation.ideation     (confidence: 0.95)
IF Agent >= 10 cluster                          → build.agent_delegated    (confidence: 0.80)
IF Skill in first 5 events                      → signals loaded context; check other rules
IF Grep > 10 opening burst AND no Playwright    → research.codebase        (confidence: 0.78)
```

**Where tool-only fails `[VALIDATED-100]`:**

- Knowledge/brain sessions vs code scaffolding (project_dir is the discriminator)
- Sessions opening with conceptual discussion before tools fire
- Account/credential forensics (Bash-heavy looks like testing)
- Architecture discussions leading to implementation
- Loom transcript processing (looks like documentation update)

### Distinctive Rare-Tool Signals `[VALIDATED-100]`

| Tool                                   | Reliability | Meaning                                                    |
| -------------------------------------- | ----------- | ---------------------------------------------------------- |
| `AskUserQuestion >= 5`                 | 98%         | Structured Q&A / requirements elicitation                  |
| `CronCreate > 0`                       | 92%         | UAT monitoring loop setup requested                        |
| `browser_evaluate > 50`                | 92%         | Automated web platform interaction                         |
| `playwright_fill_form > 10`            | 90%         | UAT data-entry execution                                   |
| `TaskCreate >= 7` first 20 events      | 88%         | Pre-planned campaign decomposition                         |
| `Skill` at session END (last 5 events) | 85%         | Session closing ritual (handover/summary skill)            |
| `ToolSearch >= 8`                      | 82%         | Claude at boundary of known tool set; capability discovery |
| `TaskOutput >= 3`                      | 80%         | Claude polling a background process — waiting              |
| `subagent_start >= 5`                  | 78%         | Parallel delegation in progress                            |

### 5 Canonical Session Arcs `[VALIDATED-20]` — still valid at 100

1. **Review → Decide → Build** — wave work, hardening, polish
2. **Research → Plan → Act** — skill builds, strategy sessions
3. **Discovery → Refine → Test** — exploration, naming, investigation
4. **Setup → Configure → Validate** — infra, brain init, env config
5. **Audit → Clean → Iterate** — inventory, Bash-heavy, commit-focused

### Tool Ratio Metrics `[VALIDATED-100]`

Better activity signals than file size or clock duration:

- `tool_count > 20 AND (edit_count + write_count) > 3` → real work was done
- `tool_count / prompt_count > 15` → high-delegation session (user is mostly steering)
- `tool_count / prompt_count < 5` → conversational session (user is driving, AI is responding)
- `edit_count / tool_count > 0.35` → build-focused session
- `bash_count / tool_count > 0.40` → execution/ops-focused session

---

## 5. Prompt Patterns

### Voice Transcription Prevalence `[VALIDATED-100]`

| Project type                         | Voice transcription rate |
| ------------------------------------ | ------------------------ |
| brains project                       | ~84%                     |
| prompt.supportsignal                 | ~67%                     |
| appystack, angeleye                  | ~67–71%                  |
| appydave-plugins                     | ~57%                     |
| minor projects (voz, klueless, etc.) | ~50%                     |
| signal-studio                        | ~25%                     |
| **Overall estimate**                 | **~60–65%**              |

**Key finding `[VALIDATED-100]`:** Voice use correlates inversely with project certainty. David speaks when figuring things out; types when he knows exactly what he wants. Typed prompts indicate high-certainty execution; voice prompts indicate exploration.

### Voice Artifact Signatures `[VALIDATED-100]`

1. Phonetic substitutions: "vercel" for "Playwright," "wispr" for "whisper," "broweer" for "browser," "contorl" for "control," "struction fure" for "structure"
2. Repeated-start restarts: "If I give you access to If I give you access to"
3. Truncated prompt endings (voice cut off mid-sentence)
4. Verbal hedging: "or something like that," "I don't know," "I think," "I mean"
5. Filler words: "Okay so," "Right so," "Yeah look," "basically"
6. Dropped subjects/articles from sentence fragments
7. Self-address to Claude by name ("Why is it taking so long... Dave?")

### High-Signal Keywords (first real prompt) `[VALIDATED-20]`

| Keyword                               | Label hint                       | Activity tag      |
| ------------------------------------- | -------------------------------- | ----------------- |
| "Wave N", "wave-N"                    | context tag only (not the label) | `build` or `ops`  |
| "build it", "let's build"             | `[thing]-build`                  | `build`           |
| "test", "CI/CD", "pipeline"           | `[project]-testing`              | `test`            |
| "research", "deep research"           | `[topic]-research`               | `research`        |
| "audit", "inventory"                  | `[scope]-audit`                  | `ops`             |
| "plan", "strategy", "approach"        | `[topic]-planning`               | `orientation`     |
| "fix", "broken", "issue", "why is it" | `[component]-debug`              | `test.debug_loop` |
| "handover", "session continuation"    | `orientation.handover_check`     | `orientation`     |
| "/ralphy"                             | campaign mode                    | `build.campaign`  |
| brain name in prompt                  | `brain-[name]`                   | `knowledge`       |
| "what were we" / "what is this about" | `orientation.cold_start`         | `orientation`     |

### The Paste-as-Prompt Pattern `[VALIDATED-100]`

Approximately 30–35% of sessions open with a large paste (not a question). The user is handing Claude raw data expecting interpretation. Paste types:

- Prior session terminal output
- Claude's own prior responses (from another window)
- Ansible/build logs
- Loom video transcripts
- Structured handover documents
- Email threads
- JSON/YAML schemas
- Git status / git log output

**This is a primary mechanism for cross-session continuity**, not a fallback. AngelEye should treat large-paste P1 differently from question P1 — it signals a session bootstrapped from prior work.

### Context Handover Injections — Identification `[VALIDATED-100]`

"This session is being continued from a previous conversation that ran out of context..." is Claude Code-generated, NOT a user prompt.

- Present in ~40% of sessions
- Some sessions have 8–10 injections
- Always starts with "This session is being continued"
- Always > 200 chars

**Must be excluded from:** prompt count, intent analysis, first-prompt signals.

### Ultra-Short Approval Pattern `[VALIDATED-100]`

When 3+ consecutive prompts are < 5 chars ("yes", "2", "ok", "contineu"), the session is in **execution mode**. This is high-trust delegation, NOT disengagement. Surrounding prompts are always substantive.

### Frustration Baseline `[VALIDATED-100]`

Frustration language appears in ~70–80% of multi-hour product sessions where AI deviated from constraints. It is NOT an anomaly signal — it is a baseline. Only the "crisis prompt" pattern (profanity + "what's the point?") is a genuine session-at-risk signal, and it appears in ~5% of sessions. AngelEye should NOT surface frustration as an unusual event.

### Session Closure Signals `[VALIDATED-100]`

Sessions with a closing ceremony (below) are likely complete. Sessions without are abandoned, context-exhausted, or pending.

Closing ceremony vocabulary:

- "Can I close it off now?" + "commit and push" + "yes"
- "Was there anything else outstanding in this conversation?"
- "Can you just list all the decisions and topics we discussed before I close?"
- "Give me a handover message" / "handover conversation for another window"
- "push it" / "commit and push please"

"Commit and push" appears mid-session in ~40% of cases — it marks a PHASE boundary, not necessarily a session boundary.

### The Knowledge Audit Loop `[VALIDATED-100]`

Unique to the brains project. David opens a fresh Claude window, asks a question about his knowledge system, then pastes the response back into the working session to evaluate if the brain answered correctly.

Signature: prompt contains pasted Claude Code banner + Claude response from another window, OR text like "I gave this to another Claude window."

---

## 6. Junk and Exclusion Rules

### Definitive Auto-Discard Rules (any single condition sufficient) `[VALIDATED-100]`

```
Rule 1: total_events == 1 AND prompt.length <= 2
Rule 2: cwd in ["/tmp", "/private/tmp"] AND total_events <= 3
Rule 3: session_id starts with "agent-" AND total_events == 1  → classify as agent_warmup
Rule 4: Single prompt that is a model greeting (starts "Hello" + "how can I help")
Rule 5: last_active - started_at < 5 seconds AND total_events == 1
```

### High-Confidence Auto-Discard `[VALIDATED-100]`

```
Rule 6: total_events == 1 AND prompt matches /^[a-z]{1,3}$/
Rule 7: registry.project == "tmp"
Rule 8: Multiple agent-prefixed sessions with identical prompts within 100ms → agent_warmup_pair
```

### Human Review Required (do NOT auto-discard) `[VALIDATED-100]`

```
Rule 9: total_events == 1 AND prompt.length >= 20
Rule 10: file_size > 500 bytes BUT total_events == 1
```

### Special Non-Junk Classifications `[VALIDATED-100]`

- `agent_warmup`: `agent-` prefixed session ID with "Warmup" prompt — scaffolding for parent session; no intelligence value but keep for lineage
- `agent_warmup_pair`: Two warmup sessions within 100ms, same CWD — parallel agent launch
- `accidental_keystroke`: Single-character prompt in real project directory

---

## 7. Marathon Session Handling

### Four Causes of Marathon Sessions `[VALIDATED-100]`

1. **Genuine long work** — single coherent task taking many hours; consistent CWD, no large gaps
2. **Domain drift** — session accumulates an unrelated second task via user-initiated pivot
3. **Sleep/wake continuity** — user didn't close Claude; session ID persists across sleep periods
4. **Context compaction sprawl** — 5+ context injections as Claude fights context limits

### Phase-Split Indicators (ranked) `[VALIDATED-100]`

| Indicator                                   | Strength                                        |
| ------------------------------------------- | ----------------------------------------------- |
| Time gap > 6 hours                          | Very strong — almost certainly a sleep break    |
| Time gap > 3 hours                          | Strong                                          |
| Time gap > 1 hour                           | Moderate                                        |
| 5+ context handover injections in session   | Strong — each = natural restart point           |
| User asks "what are we trying to solve?"    | Strong — user recognising domain drift          |
| CWD change to unrelated project             | Moderate                                        |
| Frustration cluster → calm re-specification | Strong — crisis/reset boundary                  |
| "commit and push"                           | Moderate — phase boundary, not session boundary |
| Duplicate prompt (same text re-sent)        | Moderate — user lost context                    |

### Recommended Approach `[HYPOTHESIS]`

Do NOT auto-split marathon sessions. The session ID is the only persistent identifier. Instead:

- Flag sessions with time gap > 3 hours as `has_phases: true`
- Show phase boundaries in Observer timeline view
- Let the human confirm splits if desired

---

## 8. Claude Code Feature Watch

### Active Features to Watch `[VALIDATED-20]`

- **Worktree sessions** (`claude --worktree`) — CWD will be a `/tmp/` path or worktree path. Tag `worktree` automatically. Appear in signal-studio UAT sessions.
- **Background agents** (`background: true`) — `subagent_start` + `subagent_stop` events. Session with many subagent events = agentic/autonomous work. Note: `subagent_start` without matching `subagent_stop` means agent still in flight.
- **`--from-pr` sessions** — first prompt likely contains PR number or branch name.
- **Scheduled tasks** (`~/.claude/scheduled-tasks/`) — headless sessions. First prompt = SKILL.md content. Detectable by no interactive prompts + regular timing pattern.
- **CronCreate/CronDelete** — new tools observed in signal-studio UAT sessions. Monitoring loop pattern: CronCreate:7 + CronDelete:7 = iterative loop refinement (creating, testing, destroying monitoring crons).

### Feature Ideas Triggered by New Capabilities `[HYPOTHESIS]`

- When Claude Code adds session naming natively → AngelEye should sync `name` field from hook payload
- When worktrees are used → tag automatically, show worktree path in Observer
- Stop events (now confirmed present in newer sessions) → can calculate true session end time, compute active duration

---

## 9. Observations Log

### 2026-03-15 — 100-session synthesis findings

**File size is NOT a reliable session complexity signal.** 64 KB session with 0 tools; 271 KB session with 19 tools. File size reflects Claude's response verbosity + pasted context payloads. Use `tool_count` and `(edit_count + write_count)` for work done.

**Session duration is NOT a reliable activity measure.** Sessions of 20h–60h are not 20–60 hours of work. They contain multi-hour dormancy gaps. True "active time" = time spans with events within 5-minute windows of each other.

**Tool-only accuracy is bimodal.** Not a stable ~80%. Focused product sessions: 89–95%. Exploratory/peripheral sessions: 55–70%. Never report a single accuracy number.

**auto_label requires an LLM.** Rule-based classifiers can produce `session_type` (6 taxonomy types) with reasonable confidence. Human-readable labels like "wave-7a-linen" require reading the first 2–3 prompts via LLM. This changes the architecture of the labeling system.

**~40% of first prompts are not user intent signals.** Pastes, injections, approvals, and accidents inflate the first-prompt count. The labeling system must identify the "first real user prompt" before using it as a signal.

**"Commit and push" is a phase marker, not a session end.** Appears mid-session in ~40% of cases where it appears. Useful for detecting work-unit boundaries within marathon sessions.

**Voice is the dominant input mode (~60–65% of sessions).** Not a secondary concern. Voice-transcribed prompts have systematic errors that all classifiers must tolerate. Phonetic substitution, dropped words, and truncation are the norm.

**The brains project has 50+ sub-entities, not 1.** `project = "brains"` is a 239-session bucket. First file path in tool_use events is the sub-label discriminator.

**Frustration is baseline, not anomaly.** ~70–80% of multi-hour product sessions contain frustration language. Only "crisis prompts" (rare, ~5%) indicate a session at risk.

### 2026-03-15 — Earlier observations (still valid)

**Wave keyword is a proxy signal:** "Wave N" describes the PROCESS, not the work. Real label = what the wave is doing. Wave number = context tag.

**Ralphy → impl plan inference:** If `/ralphy` or "ralphy" in prompts → likely an IMPLEMENTATION_PLAN.md is active. Future agentic AngelEye could read that file to get richer label.

**Coding vs research as primary split:** Sessions modifying files (Bash/Edit/Write heavy) vs reading to understand (Glob/Read/Grep heavy). Maps to `build` vs `research` primary types.

**Tool use as session fingerprint:** First 10 tool calls form a reliable fingerprint. Pure Bash = diagnostic. Pure Glob+Read = exploration. Bash+Edit+Bash = iterative modification.

---

## 10. Known Gaps and Hard Limits

### Things We Cannot Infer from Data Alone `[VALIDATED-100]`

These require either an LLM reading the content or human tagging:

1. **The actual topic/label** of a session — "what was built" requires reading prompts
2. **Session success or failure** — no "success" event exists; output quality is not encoded
3. **Emotional arc** — frustration level and resolution require reading prompt text
4. **Cross-session relationships** — that Session A fed Session B is only detectable by reading content
5. **Whether a handover document was created** and if it was acted on
6. **Intentional session closure** — closing ceremony is in prompt text, no tool event for it
7. **Session quality/usefulness** — no objective signal exists

These require a lookup table or external knowledge:

8. **Which brain** from 50+ (file path parsing against brain registry)
9. **Whether work was client-facing or internal** (project_dir → client lookup table)
10. **The Ralphy wave number** (appears only in prompt text)
11. **Whether session was executing a pre-planned campaign** (requires reading IMPLEMENTATION_PLAN.md)

### Things We Now Capture / Could Capture `[NEEDS-DATA or HYPOTHESIS]`

- **first_edited_dir**: Deepest non-generic dir from first 3 tool_uses — sub-label signal for brains and multi-project sessions. High value, feasible.
- **Skill invocation name**: When the Skill tool fires, what was it called? Feasible from event data.
- **Subagent count**: How many background agents spawned? Indicator of session complexity.
- **Session active duration**: Compute from event timestamps, not start/end wall clock.
- **Prompt count (real)**: Exclude context injections from count.
- **Phase count**: Number of "commit and push" events = minimum phase count.

### Agentic Future `[HYPOTHESIS]`

When AngelEye becomes agentic (able to read files, call Claude):

- Read `IMPLEMENTATION_PLAN.md` to get current wave label in real-time
- Read first brain file path to identify which brain
- Ask Claude to suggest a label given first 3 real prompts (10-token job)
- Periodic re-labeling: sessions at 60% confidence get re-evaluated at session end
- Detect knowledge audit loop by recognising pasted Claude-response + Claude Code banner patterns
