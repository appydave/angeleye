# AngelEye Intelligence Patterns

**Purpose**: A living, self-improving knowledge base for B012 (ambient intelligence). Log observations, patterns, field ideas, tag taxonomy, Claude Code feature notes, and anything that should eventually make AngelEye smarter. Nothing here is implemented yet unless marked `[IMPLEMENTED]`.

**Confidence tags used throughout:**

- `[VALIDATED-924]` — confirmed across full 924-session campaign (2 machines, 14 waves)
- `[VALIDATED-924-NEW]` — new finding from full campaign, not present in earlier passes
- `[VALIDATED-100]` — confirmed in earlier 100-session pass, not yet re-evaluated at 924
- `[VALIDATED-20]` — confirmed in earlier 20-session pass, not yet contradicted
- `[HYPOTHESIS]` — plausible but not yet confirmed
- `[NEEDS-DATA]` — cannot be determined from event data alone

**Last major update:** 2026-03-23 (924-session campaign synthesis — angeleye-analysis-1)

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
11. [Multi-Machine Analysis](#11-multi-machine-analysis)

---

## 1. Session Labeling Signals

### Signal Reliability — Revised After 924 Sessions `[VALIDATED-924]`

| Signal                                            | Reliability                                            | Caveat                                                            |
| ------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| `project_dir` (full path)                         | 95% for most projects                                  | 0% discrimination within brains (239 sessions, same path)         |
| `(project_dir, tool_pattern)` combined            | ~87%                                                   | Best single composite signal                                      |
| First real user prompt (not paste, not injection) | 85%                                                    | ~40% of first prompts are not real user prompts — must skip these |
| First file path edited/read                       | 82%                                                    | Sub-label signal for brains (shows which brain name)              |
| Tool sequence pattern (first 10 events)           | 70–95%                                                 | Highly variable by session type — see Section 4                   |
| Session type via tool classifier                  | ~80% on focused sessions, ~62% on exploratory sessions | See accuracy scorecard                                            |
| CWD (current working directory)                   | Unreliable below moderate scale                        | 40–100% incidental rate at micro scale `[VALIDATED-924-NEW]`      |

### The 4-Prompt Rule — Revised `[VALIDATED-924]`

- By prompt 1 (if it's a real user question): ~70% confidence
- By prompt 3 (real user prompts only): ~85% confidence
- By prompt 4: ~88% confidence

**Critical caveat `[VALIDATED-924]`:** Approximately 40% of first prompts are NOT real user intents. They are one of:

- Large paste (handover doc, prior session output, raw data)
- Claude Code context injection ("This session is being continued...")
- Ultra-short approval ("yes", "2", "ok")
- Accidental send ("jb", "x", double-paste)

**Revised rule:** Skip to the first prompt that is: (a) > 20 chars, (b) not starting with "This session is being continued", (c) not a single word or character. That is the first signal-bearing prompt.

### Brains Sub-label Signal `[VALIDATED-924]`

All 239+ brains sessions share `project_dir = /brains`. The brain name appears in the first 1–2 file paths in tool_use events. This is the most reliable sub-label signal for the brains project.

Pattern: first Read/Edit/Write path contains `brains/<brain-name>/` → `brain-name` is the sub-label.

Known brain names to map against: `brand-dave`, `kiros`, `lars`, `anthropic-claude`, `agentic-os`, `dynamous`, `dent`, `prompt-patterns`, `beauty-and-joy`, etc.

### Wave/Ralphy Signals `[VALIDATED-924]`

- "Wave N" keyword in prompt → NOT itself the label. It signals: a Ralphy campaign loop was used.
- If Ralphy → look for `/ralphy` skill invocation (Skill tool event) or TaskCreate burst
- If Ralphy → likely an IMPLEMENTATION_PLAN.md exists at `docs/planning/*/IMPLEMENTATION_PLAN.md`
- The wave number is a **context tag**, not a label. The label is what the wave is DOING.

### Project Field Disambiguation `[VALIDATED-924]`

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

### Session Index Schema v2 (as written to session-index.jsonl) `[IMPLEMENTED]`

The 924-session campaign produced a comprehensive schema for session analysis entries. Each entry in `session-index.jsonl` contains:

```typescript
interface SessionIndexEntry {
  // Identity
  session_id: string;
  machine: string; // "m4-mini" | "m4-pro"
  project: string;
  project_dir: string;
  schema_version: number; // 2

  // Human overrides
  disposition: string; // "keep" | "discard" | "review"
  interest_level: string; // "high" | "medium" | "low" | "none"
  notes: string;

  // Tool & skill summary
  tools: Record<string, number>; // tool name → invocation count
  skills_invoked: string[];

  // Shape metrics
  shape: {
    event_count: number;
    tool_use_count: number;
    user_prompt_count: number;
    duration_minutes: number;
    active_minutes: number;
    context_compactions: number;
  };

  // Predicates (boolean signals)
  predicates: {
    // Original (P01–P16)
    P01_has_tool_use: boolean;
    P02_has_file_edits: boolean;
    P03_has_bash_commands: boolean;
    P04_has_playwright: boolean;
    P05_has_subagent: boolean;
    P06_has_skill_invocation: boolean;
    P07_has_context_handover: boolean;
    P08_has_voice_transcription: boolean;
    P09_has_frustration_language: boolean;
    P10_has_closing_ceremony: boolean;
    P11_has_commit_push: boolean;
    P12_has_large_paste_opener: boolean;
    P13_has_error_recovery: boolean;
    P14_has_repeated_tool_failure: boolean;
    P15_has_ask_user_question: boolean;
    P16_has_claude_md_autoload: boolean;
    // Backward pass additions (P17–P22)
    P17_has_handover_context: boolean;
    P18_has_cross_project_reads: boolean;
    P19_has_web_research: boolean;
    P20_has_parallel_subagent_bursts: boolean;
    P21_has_task_orchestration: boolean;
    P22_has_git_outcome: boolean;
  };

  // Classifiers (categorical labels)
  classifiers: {
    session_type: string; // BUILD, KNOWLEDGE, RESEARCH, etc.
    session_scale: string; // micro, light, moderate, heavy, marathon
    session_subtype: string; // 500+ subtypes discovered
    tool_profile: string;
    opening_style: string;
    closing_style: string;
    project_attribution: string;
    session_chain_role: string;
    // Backward pass additions (C08–C11)
    C08_delegation_style: string; // conversational | directive | orchestrated | autonomous
    C09_session_continuity: string; // fresh | handover_paste | compaction | skill_launcher | recall
    C10_output_type: string; // conversation_only | code_changes | knowledge_synthesis | mixed | new_artifacts
    C11_initiation_source: string; // user_typed | voice_dictated | handover_paste | skill_invoked | agent_dispatched
  };

  // Observations (structured analysis)
  observations: {
    frustration_analysis: object;
    phase_breakdown: object;
    session_chain: object;
    skill_gap: object;
    cwd_mismatch: object;
    O06_autonomy_profile: object;
    O07_machine_character: object;
  };

  // Derived metrics
  derived: {
    autonomy_ratio: number; // tool_use_count / user_prompt_count
    session_liveness: number; // active_minutes / duration_minutes
  };

  // Metadata
  analysis_metadata: object;
  backward_pass_metadata: object;
  proposed_subtypes: string[];
}
```

**Autonomy ratio buckets** `[VALIDATED-924-NEW]`:

| Bucket           | Ratio range | Count (924) |
| ---------------- | ----------- | ----------- |
| `conversational` | < 3         | 223         |
| `guided`         | 3–8         | 127         |
| `delegated`      | 8–20        | 86          |
| `autonomous`     | > 20        | 47          |

**Session liveness buckets** `[VALIDATED-924-NEW]`:

| Bucket         | active/duration | Count (924) |
| -------------- | --------------- | ----------- |
| `focused`      | > 0.6           | 204         |
| `intermittent` | 0.3–0.6         | 38          |
| `parked`       | 0.1–0.3         | 84          |
| `zombie`       | < 0.1           | 65          |

**Design principles** (unchanged):

1. `name` + `tags` remain human-controlled and always override. `session_type` + `auto_tags` are system suggestions shown when human fields are null.
2. `auto_label` can only be LLM-generated, not rule-based. Rules can produce `session_type`. Labels require reading prompts.
3. `first_real_prompt` must skip injections, pastes, and ultra-short approvals — not just `first_prompt`.
4. `prompt_count` must exclude context injection prompts (which start with "This session is being continued").
5. `file_size` should NOT be a stored metric for session weight — it is unreliable as a complexity signal.

---

## 3. Tag Taxonomy and Session Taxonomy

### Canonical Session Taxonomy (validated against 924 sessions) `[VALIDATED-924]`

**12+ top-level types, 500+ subtypes.** Assign exactly one type per session. The taxonomy expanded significantly from the original 6 types / 21 subtypes.

| Type          | Count (924) | Description                                          |
| ------------- | ----------- | ---------------------------------------------------- |
| `BUILD`       | 77          | Creating, implementing, coding                       |
| `KNOWLEDGE`   | 80          | Brain/skill work, knowledge capture                  |
| `RESEARCH`    | 79          | Investigation, discovery, external lookup            |
| `ORIENTATION` | 56          | Context recovery, figuring out what to do            |
| `OPERATIONS`  | 53          | Infrastructure, machine management, git ops          |
| `META`        | 37          | Work about the work system itself (AngelEye, tools)  |
| `SYSOPS`      | 24          | System administration, machine provisioning          |
| `PLANNING`    | 23          | Strategy, roadmapping, architecture design           |
| `MIXED`       | 19          | Multi-domain sessions that resist single-type labels |
| `SKILL`       | 10          | Skill authoring, skill debugging                     |
| `SETUP`       | 9           | Environment setup, project bootstrapping             |
| `unknown`     | 418         | Mostly micro/trivial sessions too small to classify  |

**Note on `unknown`:** 418 sessions (45%) could not be confidently typed. These are overwhelmingly micro-scale (0–2 tool calls) or trivial sessions. This is expected — the classifier correctly abstains rather than guessing.

### BUILD Accuracy by Scale `[VALIDATED-924-NEW]`

The BUILD classifier has a proven accuracy curve that varies dramatically by session scale:

| Scale    | BUILD accuracy | Notes                                      |
| -------- | -------------- | ------------------------------------------ |
| micro    | 0%             | Never BUILD — too little signal            |
| light    | 0–15%          | Rarely BUILD — usually orientation/trivial |
| moderate | 30–45%         | BUILD starts appearing reliably            |
| heavy    | 50–70%         | BUILD is the majority type                 |
| marathon | 60–70%         | BUILD dominant, some drift to MIXED        |

### Three Iron-Clad Classifier Rules `[VALIDATED-924-NEW]`

These rules have zero known exceptions across 924 sessions:

1. **`*run NNN` first prompt = `operations.poem_execution`** — when the first prompt matches this pattern, it is always a POEM execution run.
2. **`brains/` CWD + light scale = never BUILD** — a session in the brains directory at light scale is always KNOWLEDGE or RESEARCH, never BUILD.
3. **Zero tool calls = never BUILD** — a session with no tool invocations cannot be BUILD. Always ORIENTATION or conversation-only.

### Subtypes — 500+ Discovered `[VALIDATED-924-NEW]`

The 924-session campaign discovered 500+ subtypes across the 12 top-level types. These are too numerous to list exhaustively. Key examples per type:

| Type          | Example subtypes                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `BUILD`       | `build.campaign`, `build.surgical`, `build.agent_delegated`, `build.infrastructure`, `build.feature_implementation` |
| `KNOWLEDGE`   | `knowledge.brain_update`, `knowledge.brain_ingestion`, `knowledge.skill_authoring`, `knowledge.pattern_design`      |
| `RESEARCH`    | `research.web_scraping`, `research.codebase`, `research.external`, `research.knowledge_audit`                       |
| `ORIENTATION` | `orientation.cold_start`, `orientation.requirements`, `orientation.ideation`, `orientation.handover_check`          |
| `OPERATIONS`  | `operations.repo_maintenance`, `operations.poem_execution`, `operations.cross_machine_sync`                         |
| `META`        | `meta.angeleye_analysis`, `meta.tool_development`, `meta.campaign_management`                                       |
| `SYSOPS`      | `sysops.machine_provision`, `sysops.tool_install`, `sysops.ansible_playbook`                                        |
| `PLANNING`    | `planning.architecture`, `planning.roadmap`, `planning.sprint_planning`                                             |

The subtype list is a living artifact — new subtypes are proposed via `proposed_subtypes` in each session analysis entry.

### Tag Taxonomy v2 (updated from 20-session v1) `[VALIDATED-924]`

**Activity type** — now aligned with session taxonomy, assign one:

```
build        — creating, implementing, coding (maps to BUILD)
knowledge    — brain/skill work, knowledge capture (maps to KNOWLEDGE)
research     — investigation, discovery, external lookup (maps to RESEARCH)
orientation  — figuring out what to do, context recovery (maps to ORIENTATION)
operations   — infrastructure, machine management, git ops (maps to OPERATIONS)
meta         — work about the work system itself (maps to META)
sysops       — system administration (maps to SYSOPS)
planning     — strategy, roadmapping (maps to PLANNING)
skill        — skill authoring, skill debugging (maps to SKILL)
setup        — environment setup, bootstrapping (maps to SETUP)
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

**Open questions — no longer open `[VALIDATED-924]`:**

- `content` as a domain? YES — add it. Seen in voz, lars, beauty-and-joy client communication sessions.
- `architecture` as distinct activity? MERGE into `build.campaign` or `orientation.requirements`. Architecture discussions always lead to one of these.
- `META` as a top-level type? YES — confirmed across 37 sessions. Work about the work system (AngelEye, campaign tooling) is distinct enough to warrant its own type.

---

## 4. Tool Use Patterns

### Validated Composite Classifier Rules `[VALIDATED-924]`

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

**Where tool-only fails `[VALIDATED-924]`:**

- Knowledge/brain sessions vs code scaffolding (project_dir is the discriminator)
- Sessions opening with conceptual discussion before tools fire
- Account/credential forensics (Bash-heavy looks like testing)
- Architecture discussions leading to implementation
- Loom transcript processing (looks like documentation update)

### Delegation Style (C08) `[VALIDATED-924-NEW]`

How the user delegates work to Claude, derived from tool-to-prompt ratio and interaction patterns:

| Style            | Count (924) | Description                                       |
| ---------------- | ----------- | ------------------------------------------------- |
| `conversational` | 417         | User drives, Claude responds — low tool use       |
| `directive`      | 335         | User gives specific instructions, Claude executes |
| `orchestrated`   | 91          | User coordinates multi-step workflows             |
| `autonomous`     | 58          | Claude works independently with minimal steering  |

### Initiation Source (C11) `[VALIDATED-924-NEW]`

How the session was started:

| Source             | Count (924) | Description                                    |
| ------------------ | ----------- | ---------------------------------------------- |
| `user_typed`       | 538         | Standard keyboard-typed prompt                 |
| `voice_dictated`   | 168         | Voice transcription (Wispr Flow or similar)    |
| `handover_paste`   | 131         | Large paste from prior session/external source |
| `skill_invoked`    | 69          | Session started via skill invocation           |
| `agent_dispatched` | 12          | Background agent or subagent launch            |

### Distinctive Rare-Tool Signals `[VALIDATED-924]`

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

### 5 Canonical Session Arcs `[VALIDATED-20]` — still valid at 924

1. **Review → Decide → Build** — wave work, hardening, polish
2. **Research → Plan → Act** — skill builds, strategy sessions
3. **Discovery → Refine → Test** — exploration, naming, investigation
4. **Setup → Configure → Validate** — infra, brain init, env config
5. **Audit → Clean → Iterate** — inventory, Bash-heavy, commit-focused

### Tool Ratio Metrics `[VALIDATED-924]`

Better activity signals than file size or clock duration:

- `tool_count > 20 AND (edit_count + write_count) > 3` → real work was done
- `tool_count / prompt_count > 15` → high-delegation session (user is mostly steering)
- `tool_count / prompt_count < 5` → conversational session (user is driving, AI is responding)
- `edit_count / tool_count > 0.35` → build-focused session
- `bash_count / tool_count > 0.40` → execution/ops-focused session

### CLAUDE.md Auto-Load Anti-Pattern (P16) `[VALIDATED-924-NEW]`

P16 (CLAUDE.md auto-load) is an escalating pattern. In sessions where it triggers, the tool-to-prompt ratio can reach **32:1** — Claude reads dozens of files before the user types anything. This inflates tool counts and distorts classification if not accounted for. Sessions with P16=true should have their tool counts adjusted by subtracting the auto-load burst.

---

## 5. Prompt Patterns

### Voice Transcription Prevalence `[VALIDATED-924]`

| Project type                         | Voice transcription rate |
| ------------------------------------ | ------------------------ |
| brains project                       | ~84%                     |
| prompt.supportsignal                 | ~67%                     |
| appystack, angeleye                  | ~67–71%                  |
| appydave-plugins                     | ~57%                     |
| minor projects (voz, klueless, etc.) | ~50%                     |
| signal-studio                        | ~25%                     |
| **Overall estimate**                 | **~60–65%**              |

**Key finding `[VALIDATED-924]`:** Voice use correlates inversely with project certainty. David speaks when figuring things out; types when he knows exactly what he wants. Typed prompts indicate high-certainty execution; voice prompts indicate exploration.

**Machine character difference `[VALIDATED-924-NEW]`:** M4 Pro has a significantly higher voice rate — 7–9 out of 12 sessions per batch are voice-dictated, compared to 4–6 on M4 Mini. This correlates with M4 Pro's evening/mobile usage pattern (see Section 11).

### Voice Artifact Signatures `[VALIDATED-924]`

1. Phonetic substitutions: "vercel" for "Playwright," "wispr" for "whisper," "broweer" for "browser," "contorl" for "control," "struction fure" for "structure"
2. Repeated-start restarts: "If I give you access to If I give you access to"
3. Truncated prompt endings (voice cut off mid-sentence)
4. Verbal hedging: "or something like that," "I don't know," "I think," "I mean"
5. Filler words: "Okay so," "Right so," "Yeah look," "basically"
6. Dropped subjects/articles from sentence fragments
7. Self-address to Claude by name ("Why is it taking so long... Dave?")

### Voice Dictation Entity Dictionary `[VALIDATED-924-NEW]`

220+ misheard artifacts cataloged across the campaign. Key entity dictionary candidates for a correction layer:

| Misheard          | Correct         |
| ----------------- | --------------- |
| "AngelLie"        | AngelEye        |
| "nvideo nemoclaw" | NVIDIA NemoClaw |
| "Angel I"         | AngelEye        |
| "Whisper Flow"    | Wispr Flow      |
| "Play right"      | Playwright      |
| "Appie Dave"      | AppyDave        |
| "super signal"    | SupportSignal   |
| "poem oh s"       | POEM OS         |

This dictionary is a candidate for a voice-correction preprocessing step before classification.

### High-Signal Keywords (first real prompt) `[VALIDATED-20]`

| Keyword                               | Label hint                       | Activity tag                       |
| ------------------------------------- | -------------------------------- | ---------------------------------- |
| "Wave N", "wave-N"                    | context tag only (not the label) | `build` or `ops`                   |
| "build it", "let's build"             | `[thing]-build`                  | `build`                            |
| "test", "CI/CD", "pipeline"           | `[project]-testing`              | `test`                             |
| "research", "deep research"           | `[topic]-research`               | `research`                         |
| "audit", "inventory"                  | `[scope]-audit`                  | `ops`                              |
| "plan", "strategy", "approach"        | `[topic]-planning`               | `orientation`                      |
| "fix", "broken", "issue", "why is it" | `[component]-debug`              | `test.debug_loop`                  |
| "handover", "session continuation"    | `orientation.handover_check`     | `orientation`                      |
| "/ralphy"                             | campaign mode                    | `build.campaign`                   |
| brain name in prompt                  | `brain-[name]`                   | `knowledge`                        |
| "what were we" / "what is this about" | `orientation.cold_start`         | `orientation`                      |
| "\*run NNN"                           | `operations.poem_execution`      | `operations` `[VALIDATED-924-NEW]` |

### The Paste-as-Prompt Pattern `[VALIDATED-924]`

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

### Context Handover Injections — Identification `[VALIDATED-924]`

"This session is being continued from a previous conversation that ran out of context..." is Claude Code-generated, NOT a user prompt.

- Present in ~40% of sessions
- Some sessions have 8–10 injections
- Always starts with "This session is being continued"
- Always > 200 chars

**Must be excluded from:** prompt count, intent analysis, first-prompt signals.

### Ultra-Short Approval Pattern `[VALIDATED-924]`

When 3+ consecutive prompts are < 5 chars ("yes", "2", "ok", "contineu"), the session is in **execution mode**. This is high-trust delegation, NOT disengagement. Surrounding prompts are always substantive.

### Frustration Baseline `[VALIDATED-924]`

Frustration language appears in ~70–80% of multi-hour product sessions where AI deviated from constraints. It is NOT an anomaly signal — it is a baseline. Only the "crisis prompt" pattern (profanity + "what's the point?") is a genuine session-at-risk signal, and it appears in ~5% of sessions. AngelEye should NOT surface frustration as an unusual event.

### Session Closure Signals `[VALIDATED-924]`

Sessions with a closing ceremony (below) are likely complete. Sessions without are abandoned, context-exhausted, or pending.

Closing ceremony vocabulary:

- "Can I close it off now?" + "commit and push" + "yes"
- "Was there anything else outstanding in this conversation?"
- "Can you just list all the decisions and topics we discussed before I close?"
- "Give me a handover message" / "handover conversation for another window"
- "push it" / "commit and push please"

"Commit and push" appears mid-session in ~40% of cases — it marks a PHASE boundary, not necessarily a session boundary.

### The Knowledge Audit Loop `[VALIDATED-924]`

Unique to the brains project. David opens a fresh Claude window, asks a question about his knowledge system, then pastes the response back into the working session to evaluate if the brain answered correctly.

Signature: prompt contains pasted Claude Code banner + Claude response from another window, OR text like "I gave this to another Claude window."

---

## 6. Junk and Exclusion Rules

### Definitive Auto-Discard Rules (any single condition sufficient) `[VALIDATED-924]`

```
Rule 1: total_events == 1 AND prompt.length <= 2
Rule 2: cwd in ["/tmp", "/private/tmp"] AND total_events <= 3
Rule 3: session_id starts with "agent-" AND total_events == 1  → classify as agent_warmup
Rule 4: Single prompt that is a model greeting (starts "Hello" + "how can I help")
Rule 5: last_active - started_at < 5 seconds AND total_events == 1
```

### High-Confidence Auto-Discard `[VALIDATED-924]`

```
Rule 6: total_events == 1 AND prompt matches /^[a-z]{1,3}$/
Rule 7: registry.project == "tmp"
Rule 8: Multiple agent-prefixed sessions with identical prompts within 100ms → agent_warmup_pair
```

### Human Review Required (do NOT auto-discard) `[VALIDATED-924]`

```
Rule 9: total_events == 1 AND prompt.length >= 20
Rule 10: file_size > 500 bytes BUT total_events == 1
```

### Special Non-Junk Classifications `[VALIDATED-924]`

- `agent_warmup`: `agent-` prefixed session ID with "Warmup" prompt — scaffolding for parent session; no intelligence value but keep for lineage
- `agent_warmup_pair`: Two warmup sessions within 100ms, same CWD — parallel agent launch
- `accidental_keystroke`: Single-character prompt in real project directory

---

## 7. Marathon Session Handling

### Four Causes of Marathon Sessions `[VALIDATED-924]`

1. **Genuine long work** — single coherent task taking many hours; consistent CWD, no large gaps
2. **Domain drift** — session accumulates an unrelated second task via user-initiated pivot
3. **Sleep/wake continuity** — user didn't close Claude; session ID persists across sleep periods
4. **Context compaction sprawl** — 5+ context injections as Claude fights context limits

### Session Liveness — Derived Metric `[VALIDATED-924-NEW]`

Session liveness (`active_minutes / duration_minutes`) separates genuine marathon work from zombie sessions:

| Bucket         | active/duration | Count (924) | What it means                     |
| -------------- | --------------- | ----------- | --------------------------------- |
| `focused`      | > 0.6           | 204         | Sustained engagement, real work   |
| `intermittent` | 0.3–0.6         | 38          | Bursty — work/pause/work pattern  |
| `parked`       | 0.1–0.3         | 84          | Mostly idle, occasional check-in  |
| `zombie`       | < 0.1           | 65          | Left open, no meaningful activity |

### Autonomy Ratio — Derived Metric `[VALIDATED-924-NEW]`

Autonomy ratio (`tool_use_count / user_prompt_count`) reveals session character:

| Bucket           | Ratio range | Count (924) | What it means                    |
| ---------------- | ----------- | ----------- | -------------------------------- |
| `conversational` | < 3         | 223         | Discussion-heavy, low automation |
| `guided`         | 3–8         | 127         | User steering, Claude executing  |
| `delegated`      | 8–20        | 86          | User gives high-level direction  |
| `autonomous`     | > 20        | 47          | Claude working independently     |

### Phase-Split Indicators (ranked) `[VALIDATED-924]`

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

### Paperclip/JJ Agent `[VALIDATED-924-NEW]`

Confirmed as a production autonomous system. Sessions attributed to this agent show:

- Agent-dispatched initiation (C11 = `agent_dispatched`)
- High autonomy ratio (typically > 20)
- Minimal user prompts (often 0–1)
- Consistent tool patterns matching pre-programmed workflows

### Feature Ideas Triggered by New Capabilities `[HYPOTHESIS]`

- When Claude Code adds session naming natively → AngelEye should sync `name` field from hook payload
- When worktrees are used → tag automatically, show worktree path in Observer
- Stop events (now confirmed present in newer sessions) → can calculate true session end time, compute active duration

---

## 9. Observations Log

### 2026-03-23 — 924-session campaign synthesis findings

**BUILD accuracy-by-scale curve is definitive `[VALIDATED-924-NEW]`.** The BUILD classifier accuracy scales with session weight: 0% at micro, 0–15% at light, 30–45% at moderate, 50–70% at heavy, 60–70% at marathon. This is not a bug — micro sessions genuinely lack the signal density for BUILD classification. Classifier should abstain at micro/light scale.

**P13+P14 co-occurrence is the dominant friction pattern `[VALIDATED-924-NEW]`.** Error recovery (P13) combined with repeated tool failure (P14) is the most common frustration signal. When both fire, the session almost always contains frustration language (P09) as well. This triple is a reliable "session-under-stress" indicator.

**CLAUDE.md auto-load anti-pattern (P16) is escalating `[VALIDATED-924-NEW]`.** Sessions with P16=true show a 32:1 tool-to-prompt ratio from auto-loaded CLAUDE.md reads alone. This distorts tool_count, tool_profile, and autonomy_ratio. Classification must account for this inflation.

**Paperclip/JJ Agent is a production autonomous system `[VALIDATED-924-NEW]`.** Not a test artifact. Sessions from this agent have distinct characteristics: agent_dispatched initiation, high autonomy, minimal user interaction. Classification should handle these as a separate category.

**Machine character matters for classification `[VALIDATED-924-NEW]`.** M4 Mini and M4 Pro produce different session profiles even for similar work. Voice rate, session timing, delegation style, and session scale all differ by machine. See Section 11.

**CWD is unreliable below moderate scale `[VALIDATED-924-NEW]`.** At micro scale, 40–100% of sessions have incidental CWD (the directory where `claude` was launched, not the project being worked on). CWD-based classification should be suppressed for micro/light sessions unless confirmed by tool paths.

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

### Things We Cannot Infer from Data Alone `[VALIDATED-924]`

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

### Things We Now Capture `[VALIDATED-924-NEW]`

These were previously gaps, now addressed in the v2 schema:

- **Session scale** — `session_scale` classifier (micro/light/moderate/heavy/marathon)
- **Delegation style** — C08 (conversational/directive/orchestrated/autonomous)
- **Session continuity** — C09 (fresh/handover_paste/compaction/skill_launcher/recall)
- **Output type** — C10 (conversation_only/code_changes/knowledge_synthesis/mixed/new_artifacts)
- **Initiation source** — C11 (user_typed/voice_dictated/handover_paste/skill_invoked/agent_dispatched)
- **Autonomy ratio** — derived metric with bucketed ranges
- **Session liveness** — derived metric separating focused from zombie sessions
- **Machine attribution** — `machine` field on every entry
- **Backward-pass predicates** — P17–P22 covering handover context, cross-project reads, web research, parallel subagents, task orchestration, git outcomes

### Still Missing `[NEEDS-DATA]`

- **PII detection** — 14 waves of evidence show PII appears in session transcripts. No automated detection or redaction yet. This is the most critical remaining gap.
- **Multi-machine registry sync** — session-index.jsonl is per-machine. No merge/dedup across machines for the 299 overlapping sessions.
- **Predicate format inconsistency** — backward pass batches used slightly different predicate formats across waves. Needs normalization pass.
- **first_edited_dir** — deepest non-generic dir from first 3 tool_uses — sub-label signal for brains and multi-project sessions. Defined but not consistently populated.
- **Skill invocation name** — when the Skill tool fires, what was it called? Feasible from event data but not yet extracted systematically.
- **Subagent count** — how many background agents spawned? Indicator of session complexity. Available but not standardized.

### Agentic Future `[HYPOTHESIS]`

When AngelEye becomes agentic (able to read files, call Claude):

- Read `IMPLEMENTATION_PLAN.md` to get current wave label in real-time
- Read first brain file path to identify which brain
- Ask Claude to suggest a label given first 3 real prompts (10-token job)
- Periodic re-labeling: sessions at 60% confidence get re-evaluated at session end
- Detect knowledge audit loop by recognising pasted Claude-response + Claude Code banner patterns

---

## 11. Multi-Machine Analysis

### Machine Profiles `[VALIDATED-924-NEW]`

The 924-session campaign spans two machines with distinct usage characters:

| Attribute            | M4 Mini                         | M4 Pro                             |
| -------------------- | ------------------------------- | ---------------------------------- |
| Sessions             | 807                             | 116                                |
| Waves                | 1–13                            | 14                                 |
| Role                 | Desktop / server / focused work | Laptop / mobile / evening sessions |
| Voice rate           | ~60% (4–6 per batch of 12)      | ~75% (7–9 per batch of 12)         |
| Typical session time | Business hours                  | Evening mega-sprints               |
| Delegation style     | More directive/orchestrated     | More conversational/voice-driven   |
| Session scale        | Full range (micro to marathon)  | Skews toward light and moderate    |

### Overlapping Sessions `[VALIDATED-924-NEW]`

299 sessions share the same session IDs across both machines but have different event UUIDs. This happens because:

- Claude Code session files sync via cloud/dotfile sync
- The same `.claude/projects/` directory appears on both machines
- Each machine appends its own events to the same session file

**Impact on classification:** Overlapping sessions may have split activity — some events from Mini, some from Pro. The `machine` field on each session-index entry indicates which machine's perspective was analyzed. A future merge step is needed to unify these.

### Machine Character and Classification `[VALIDATED-924-NEW]`

Machine character affects classification accuracy:

- **M4 Pro evening sessions** tend to be more exploratory, voice-heavy, and conversational. Classifiers trained on M4 Mini data may under-classify these.
- **M4 Mini sessions** have more predictable patterns: business-hours timing, keyboard input, directive delegation.
- **O07_machine_character** observation field captures per-session machine behavioral notes.

The recommendation is to include `machine` as a feature in classifiers, not just metadata. A session's machine context provides signal about expected voice rate, delegation style, and session scale distribution.
