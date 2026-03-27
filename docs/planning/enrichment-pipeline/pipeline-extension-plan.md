# Pipeline Extension Plan — Extractors, Domain Overlays, Affinity Groups, Agent Genesis

**Purpose**: Formalise four new capability layers for the AngelEye enrichment pipeline, designed from analysis of ~85 BMAD workflow sessions across the SupportSignal v2 epic.

**Created**: 2026-03-27

**Status**: Planning — not yet implemented

**Related docs**:

- Predicate tier reference: `predicate-tier-reference.md`
- Data architecture: `data-architecture.md`
- Execution paths: `execution-paths.md`
- BMAD session inventory: `../workflow-orchestration/bmad-session-inventory.md`
- Intelligence patterns: `../../intelligence/PATTERNS.md`

---

## 1. Executive Summary

The current enrichment pipeline has 25 predicates (P01-P25), 13 classifiers (C01-C13), and 7 observations (O02-O08) across three detection tiers. These answer "what happened in this session?" but cannot answer:

- **What was produced?** (no structured extraction of artifacts, commands, or deliverables)
- **Who did this?** (no workflow role or agent identity detection)
- **Which sessions belong together?** (no cross-session correlation)
- **Did this session change the tools?** (no infrastructure impact detection)

This plan adds four extensions to answer those questions:

| Extension           | New IDs          | What it adds                                                            |
| ------------------- | ---------------- | ----------------------------------------------------------------------- |
| **Extractors**      | E01-E04          | Structured value extraction from session openings and closings          |
| **Domain Overlays** | C14-C16          | Generic workflow role detection with pluggable domain-specific mappings |
| **Affinity Groups** | (new collection) | Cross-folder session correlation into logical work units                |
| **Agent Genesis**   | P31-P35, C22     | Detection of sessions that create or modify agent/skill infrastructure  |

After implementation, totals rise from 45 to 56 enrichment items, plus a new affinity group collection.

---

## 2. New Concepts

### 2.1 Extractors — A Third Signal Type

Predicates produce booleans. Classifiers produce categorical values. **Extractors produce structured values** — a string, a file path, a list of arguments, a summary. They are a distinct concept because the output is not constrained to a fixed set of values.

```
Predicate:   P22_has_git_outcome  →  true / false
Classifier:  C01_session_type    →  "BUILD" | "TEST" | "RESEARCH" | ...
Extractor:   E01_trigger_command  →  "/bmad-dev DS 2.1"  (free-form string)
```

Extractors use the same tier system (deterministic, heuristic, LLM-required) and the same pipeline infrastructure. They are stored alongside predicates and classifiers in the session index.

### 2.2 Positional Windows

Every predicate, classifier, and extractor operates on a window of the session transcript:

| Window      | Scope                            | Performance implication                         |
| ----------- | -------------------------------- | ----------------------------------------------- |
| **opening** | First N entries (typically 5-10) | Only read the head of the JSONL — skip the rest |
| **closing** | Last N entries (typically 5-10)  | Only read the tail of the JSONL — skip the rest |
| **full**    | All entries                      | Must scan the entire transcript                 |

Positional windows are a schema attribute, not a runtime concept. Declaring a window lets the pipeline skip irrelevant entries, which matters at scale (some sessions have 2,000+ entries).

#### Existing Items by Window

| Window      | Predicates                                                                       | Classifiers                                                            |
| ----------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **opening** | P12 (is_machine_initiated), P17 (has_handover_context), P23 (is_paperclip_agent) | C03 (opening_style), C09 (session_continuity), C11 (initiation_source) |
| **closing** | P25 (has_closing_ceremony)                                                       | C04 (closing_style), C13 (session_lifecycle)                           |
| **full**    | P01-P11, P13-P16, P18-P22, P24                                                   | C01, C02, C05-C08, C10, C12                                            |

Most items today are full-session because they were designed before positional optimisation was considered. Some could be narrowed in future (e.g., P22 `has_git_outcome` is almost always closing-phase in practice, but may appear mid-session for multi-phase sessions).

### 2.3 Domain Overlays

AngelEye core detects generic workflow roles (builder, reviewer, planner). **Domain overlays** are JSON config files that map specific command patterns to those generic roles, adding domain-specific identity (agent names) and action codes.

This separation means:

- AngelEye ships with zero domain assumptions
- Any structured workflow (BMAD, Kanban, CI/CD, custom) adds its own overlay
- Overlays are config, not code — no PRs needed to support a new workflow

### 2.4 Affinity Groups

A session today is an island. An affinity group is a collection of sessions that form a logical unit of work. The group exists as a separate entity in the data model, with sessions referencing it by ID.

Affinity groups are the most valuable extension because they unlock questions like "how many sessions did Story 2.1 take?" and "what was the total cost of Epic 1?" — questions that require cross-session correlation.

---

## 3. Extension 1: Extractors (E01-E04)

### Extractor Definitions

| ID      | Name              | Tier                   | Window                    | Output type | What it extracts                                                                             |
| ------- | ----------------- | ---------------------- | ------------------------- | ----------- | -------------------------------------------------------------------------------------------- |
| **E01** | trigger_command   | Tier 1 (deterministic) | opening (first 5 entries) | string      | The skill/command that launched the session (e.g., `/bmad-dev DS 2.1`, `/ralphy`, `/commit`) |
| **E02** | trigger_arguments | Tier 1 (deterministic) | opening (first 5 entries) | string[]    | Arguments passed to the trigger command (e.g., `["DS", "2.1"]`, `["--batch", "20"]`)         |
| **E03** | final_artifact    | Tier 2 (heuristic)     | closing (last 10 entries) | string      | What was produced — file path written, commit hash, verdict text, paste-back content         |
| **E04** | final_state       | Tier 3 (LLM)           | closing (last 10 entries) | string      | How the work ended — a 1-2 sentence deliverable summary                                      |

### Detection Logic

**E01 — trigger_command (Tier 1)**

Parse the first `user_prompt` entry. If it matches a known pattern, extract the command:

```typescript
// Skill invocation: first Skill tool event
const skillEvent = firstNEvents(5).find((e) => e.tool === 'Skill');
if (skillEvent) return skillEvent.tool_input.skill; // e.g., "bmad-dev"

// Slash command in first prompt
const slashMatch = firstPrompt.match(/^\/([\w:-]+)/);
if (slashMatch) return slashMatch[1]; // e.g., "commit"

// No recognisable command
return null;
```

**E02 — trigger_arguments (Tier 1)**

After extracting E01, parse the remaining text of the first prompt for arguments:

```typescript
// If E01 found a slash command, everything after it is arguments
const afterCommand = firstPrompt.replace(/^\/[\w:-]+\s*/, '');
return parseArguments(afterCommand); // split on spaces, respect quotes

// If Skill tool, use tool_input.args
if (skillEvent) return parseArguments(skillEvent.tool_input.args);
```

**E03 — final_artifact (Tier 2)**

Scan the last 10 entries for evidence of produced artifacts:

1. `Write` or `Edit` tool events — extract the `file_path`
2. `Bash` tool events containing `git commit` — extract the commit message
3. `Bash` tool events containing `gh pr create` — extract the PR URL
4. Final `assistant` message containing "PASS", "REJECT", "CONDITIONAL PASS" — extract the verdict
5. If multiple artifacts found, return the last one (most likely the final deliverable)

**E04 — final_state (Tier 3)**

Send the last 10 entries to an LLM with the prompt: "Summarise what this session produced in 1-2 sentences. Focus on the deliverable, not the process."

### Schema Addition

```typescript
interface SessionIndexEntry {
  // ... existing fields ...

  extractors: {
    E01_trigger_command: { value: string | null; source: string };
    E02_trigger_arguments: { value: string[] | null; source: string };
    E03_final_artifact: { value: string | null; confidence: string };
    E04_final_state: { value: string | null };
  };
}
```

The `source` field records where the value was found (e.g., "skill_tool_event", "first_prompt_slash", "bash_git_commit") for auditability.

---

## 4. Extension 2: Domain Overlays (C14-C16)

### Generic Classifiers (AngelEye Core)

| ID      | Name              | Values                                                                       | Tier   | Window  |
| ------- | ----------------- | ---------------------------------------------------------------------------- | ------ | ------- |
| **C14** | workflow_role     | builder, reviewer, tester, planner, observer, orchestrator, advisor, shipper | Tier 2 | opening |
| **C15** | workflow_identity | string (agent name or null)                                                  | Tier 1 | opening |
| **C16** | workflow_action   | string (action code or null)                                                 | Tier 1 | opening |

### Detection Logic

**C15 and C16 (Tier 1)** — derived directly from E01 and E02:

```typescript
// If a domain overlay is loaded, look up E01 in role_mappings
const overlay = loadOverlay(session.project_dir);
if (overlay && overlay.role_mappings[E01.value]) {
  const mapping = overlay.role_mappings[E01.value];
  C15 = mapping.identity; // "Amelia", "Bob", null
  C16 = E02.value?.[0]; // "DS", "WN", "DR"
}
```

**C14 (Tier 2)** — workflow role requires heuristic mapping when no overlay matches:

1. If overlay matches E01 → use `mapping.role` directly (deterministic via config)
2. If no overlay but E01 contains "review" or "dr" → `reviewer`
3. If no overlay but session has heavy Edit/Write tool usage → `builder`
4. If no overlay but session is read-only with no tool calls → `observer`
5. If no overlay but session has `git push` + `gh pr create` → `shipper`
6. Default: null (cannot determine)

### Domain Overlay Format

Overlays live in a configurable directory (default: `data/overlays/`).

```json
{
  "domain": "bmad-v6",
  "version": "1.0",
  "description": "BMAD Method v6 workflow — 9 agents, 12 action codes",
  "match_patterns": {
    "project_dir_contains": ["supportsignal"],
    "trigger_command_prefix": "/bmad-"
  },
  "role_mappings": {
    "/bmad-sm": {
      "role": "planner",
      "identity": "Bob",
      "actions": ["WN", "CS", "VS", "ER"]
    },
    "/bmad-dev": {
      "role": "builder",
      "identity": "Amelia",
      "actions": ["DS"]
    },
    "/bmad-dr": {
      "role": "reviewer",
      "identity": "Nate",
      "actions": ["DR"]
    },
    "/bmad-sat": {
      "role": "tester",
      "identity": "Taylor",
      "actions": ["CS", "RA", "CU"]
    },
    "/bmad-lib": {
      "role": "advisor",
      "identity": "Lisa",
      "actions": ["CU"]
    },
    "/bmad-ship": {
      "role": "shipper",
      "identity": null,
      "actions": ["commit", "push", "ci"]
    },
    "/bmad-oversight": {
      "role": "observer",
      "identity": null,
      "actions": ["review", "correct"]
    },
    "/bmad-architect": {
      "role": "planner",
      "identity": "Winston",
      "actions": ["CA", "IR"]
    },
    "/bmad-ux-designer": {
      "role": "planner",
      "identity": "Sally",
      "actions": ["CU"]
    }
  }
}
```

### Overlay Resolution

When classifying a session:

1. Load all overlays from `data/overlays/*.json`
2. For each overlay, check `match_patterns` against the session's `project_dir` and `E01_trigger_command`
3. If exactly one overlay matches, use it
4. If multiple overlays match, prefer the one with the most specific `trigger_command_prefix`
5. If no overlay matches, fall back to generic heuristic detection (C14 Tier 2 logic)

### Generalisation

Any structured workflow can define an overlay without changing AngelEye core code:

- **Kanban workflow**: map `/kanban-assign` to builder, `/kanban-review` to reviewer
- **CI/CD pipeline**: map `/ci-lint` to tester, `/ci-deploy` to shipper
- **Custom workflow**: any command prefix pattern works

The overlay format is intentionally simple — a flat map from command string to role/identity/actions. Complex multi-step detection (e.g., inferring role from conversation content when no command is present) stays in C14's Tier 2 heuristic logic, not in overlay config.

---

## 5. Extension 3: Affinity Groups

### The Problem

AngelEye currently groups sessions by project directory. But real work spans multiple directories and multiple sessions. Story 2.1 in SupportSignal involved 7 lifecycle sessions (in the app dir) + oversight sessions (in a different dir or the same dir at different times) + advisor sessions (in the brains dir). These are invisible as a group today.

### Data Model

```typescript
interface AffinityGroup {
  group_id: string; // UUID
  group_type: 'story_unit' | 'epic_sprint' | 'project_phase' | 'ad_hoc';
  label: string; // "Story 2.1 — Pagination"
  session_ids: string[]; // ordered by time
  confidence: 'deterministic' | 'heuristic' | 'inferred';
  domain_overlay?: string; // "bmad-v6"
  created_at: string; // ISO
  metadata?: Record<string, unknown>; // domain-specific fields
}
```

Sessions reference groups via a new field:

```typescript
interface SessionIndexEntry {
  // ... existing fields ...
  group_ids: string[]; // a session can belong to multiple groups
}
```

Affinity groups live as a new collection alongside the session registry:

```
~/.claude/angeleye/registry.json         — session registry (existing)
~/.claude/angeleye/affinity-groups.json  — affinity group collection (new)
```

### Grouping Hierarchy

From the BMAD analysis, three nesting levels emerged naturally:

```
Project Phase (Planning / Build / Ship)
  └── Epic Sprint (Epic 1, Epic 2)
       └── Story Unit (2.1, 2.2, 0.1)
            ├── Lifecycle Sessions (WN, CS, VS, DS, DR, SAT, CU, Ship)
            ├── Oversight Interactions (paste-backs, corrections)
            └── Backtracks (DR retry, CI fix, bug fix)
```

A session can belong to groups at multiple levels simultaneously. Story 2.1's DS session belongs to:

- Story Unit "2.1" (`story_unit`)
- Epic Sprint "Epic 2" (`epic_sprint`)
- Project Phase "Build" (`project_phase`)

### Signal Sources (Ranked by Reliability)

| Rank | Signal                                                               | Confidence    | Detection                                                                                          |
| ---- | -------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| 1    | Same story/task ID in E02 across sessions within 24h                 | deterministic | Parse E02 for story IDs (e.g., "2.1"), group all sessions with the same ID in the same time window |
| 2    | Session A's handover paste contains Session B's ID                   | deterministic | Scan first prompt for UUID patterns matching known session IDs                                     |
| 3    | Oversight session reads files from another session's project dir     | deterministic | P18 (has_cross_project_reads) + matching the read paths to another session's write paths           |
| 4    | Temporal clustering within 2-hour window across related project dirs | heuristic     | Sessions in related directories (same overlay domain) starting within 2 hours of each other        |
| 5    | Shared file mutations — A writes file, B reads it within 4h          | heuristic     | Cross-reference Write tool paths from session A with Read tool paths from session B                |
| 6    | Command chain detection (CS, VS, DS, DR sequence)                    | heuristic     | When E01 values form a known lifecycle sequence within a time window                               |
| 7    | Semantic similarity of session content                               | inferred      | LLM compares session summaries (E04) for thematic overlap                                          |

### Correlator Pipeline

The affinity correlator runs as a **post-classification step**, after all predicates, classifiers, and extractors have been computed for a batch of sessions.

```
Session sync / enrichment
    → Tier 1+2 classification (existing)
    → Extractor pass (E01-E04)
    → Domain overlay resolution (C14-C16)
    → Affinity correlator (new — runs after above)
        → Signal 1: Group by E02 story IDs
        → Signal 2: Group by handover references
        → Signal 3: Group by cross-project file access
        → Signal 4: Temporal clustering
        → Signal 5: Shared file mutations
        → Signal 6: Command chain detection
        → Merge overlapping groups
        → Write to affinity-groups.json
```

Each signal produces candidate groups independently. The merge step combines candidates that share 2+ sessions into a single group, using the highest-confidence signal as the group's confidence level.

### Example Output

For Story 2.2 (the cleanest BMAD run at 54 minutes):

```json
{
  "group_id": "ag-2026-0326-story-2.2",
  "group_type": "story_unit",
  "label": "Story 2.2 — Named Columns Support",
  "session_ids": [
    "f2d9a...",
    "a81c3...",
    "7e4b1...",
    "c92d0...",
    "3f8a2...",
    "b15e7...",
    "d47c9..."
  ],
  "confidence": "deterministic",
  "domain_overlay": "bmad-v6",
  "created_at": "2026-03-27T10:00:00Z",
  "metadata": {
    "story_id": "2.2",
    "epic_id": "2",
    "chain_steps": ["WN", "CS", "VS", "DS", "DR", "CU", "Ship"],
    "duration_minutes": 54,
    "backtracks": 0
  }
}
```

---

## 6. Extension 4: Agent Genesis Predicates (P31-P35, C22)

### The Concept

Most sessions consume tools — they use skills, follow workflows, read brain files. A small number of sessions **create or modify** the tools themselves. These "genesis" sessions are rare but foundational: they change the operating environment for all future sessions.

Detecting genesis sessions is important for:

- Understanding when agent definitions changed (and whether downstream sessions used the old or new version)
- Tracking skill evolution over time
- Identifying sessions that had outsized impact on the ecosystem

### Predicate Definitions

| ID      | Name                            | Tier   | Window | Detection                                                                                                                                 |
| ------- | ------------------------------- | ------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **P31** | has_agent_definition_created    | Tier 2 | full   | `Write` tool event with `file_path` matching: `**/agents/*.md`, `**/.claude/skills/**`, `**/BMAD/**agent**`                               |
| **P32** | has_agent_definition_modified   | Tier 2 | full   | `Edit` tool event with `file_path` matching the same patterns as P31                                                                      |
| **P33** | has_workflow_definition_changed | Tier 2 | full   | `Write` or `Edit` tool event targeting workflow configs: `**/overlays/*.json`, `**/*workflow*`, `**/*chain*`, `**/IMPLEMENTATION_PLAN.md` |
| **P34** | has_skill_created               | Tier 1 | full   | `Write` tool event with `file_path` matching: `~/.claude/skills/*/SKILL.md`, `**/.claude/skills/*/SKILL.md`                               |
| **P35** | has_skill_modified              | Tier 1 | full   | `Edit` tool event with `file_path` matching the same patterns as P34                                                                      |

**P34 and P35 are Tier 1** because skill file paths follow an exact, deterministic pattern (`SKILL.md` inside a `skills/` directory). No ambiguity.

**P31, P32, P33 are Tier 2** because agent definitions and workflow configs use varied naming conventions. The glob patterns catch most cases but may false-positive on files that happen to contain "agent" in their path.

### Meta-Classifier

| ID      | Name                  | Values                                                                                               | Tier   | Window |
| ------- | --------------------- | ---------------------------------------------------------------------------------------------------- | ------ | ------ |
| **C22** | infrastructure_impact | none, skill_created, skill_modified, agent_created, agent_modified, workflow_changed, config_changed | Tier 2 | full   |

C22 is a rollup of P31-P35 into a single categorical value. It reports the highest-impact change detected:

```
skill_created > agent_created > workflow_changed > skill_modified > agent_modified > config_changed > none
```

If multiple types of changes occurred in the same session, C22 reports the highest-impact one. The individual predicates (P31-P35) still record all changes.

### Configurable Path Patterns

The file path patterns for P31-P35 are configurable per domain overlay. The BMAD overlay might extend them:

```json
{
  "genesis_patterns": {
    "agent_definition": [
      "**/agents/*.md",
      "**/.claude/skills/**",
      "**/BMAD/**agent**",
      "**/_bmad-output/agent-definitions/**"
    ],
    "workflow_definition": [
      "**/overlays/*.json",
      "**/*workflow*",
      "**/IMPLEMENTATION_PLAN.md",
      "**/_bmad-output/story-chain/**"
    ]
  }
}
```

### Why These Matter

In the SupportSignal v2 analysis, session `00befc58` (bmad-relay-design-docs) was the **genesis moment** — it created Nate, Lisa, Taylor, Ship, and WN as formal agents. Every subsequent story lifecycle session used those definitions. Without genesis detection, this session looks like just another BUILD session. With it, AngelEye can flag "this session changed the rules for 60+ sessions that followed."

---

## 7. Schema Evolution

### New Fields on SessionIndexEntry

```typescript
interface SessionIndexEntry {
  // ... all existing v3 fields unchanged ...

  // NEW: Extractors
  extractors?: {
    E01_trigger_command: { value: string | null; source: string };
    E02_trigger_arguments: { value: string[] | null; source: string };
    E03_final_artifact: { value: string | null; confidence: string };
    E04_final_state: { value: string | null };
  };

  // NEW: Workflow classifiers (alongside existing classifiers block)
  // C14_workflow_role, C15_workflow_identity, C16_workflow_action
  // added to the classifiers object following the existing pattern

  // NEW: Genesis predicates (alongside existing predicates block)
  // P31-P35 added to the predicates object following the existing pattern

  // NEW: Infrastructure classifier
  // C22_infrastructure_impact added to the classifiers object

  // NEW: Affinity group references
  group_ids?: string[];

  // NEW: Positional window metadata (optional, for pipeline optimisation)
  _window_hints?: {
    opening_entries_read: number;
    closing_entries_read: number;
    full_scan: boolean;
  };
}
```

### Schema Version

This constitutes a **v4 schema**. Migration from v3:

- All new fields are optional (nullable) — v3 entries remain valid
- No destructive changes to existing fields
- Migration script sets new fields to null on existing entries
- Pipeline fills them on next enrichment pass

### New Collection

```
~/.claude/angeleye/affinity-groups.json
```

Format: JSON object keyed by `group_id`, same pattern as `registry.json`.

---

## 8. Implementation Priority

### Recommended Order

| Phase | Extension                    | Effort                                                                                                     | Dependencies                                      | Value                                                           |
| ----- | ---------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------- |
| **1** | Extractors (E01-E04)         | Small — E01/E02 are ~50 lines of parsing; E03 is pattern matching on last 10 entries; E04 is an LLM prompt | None — standalone                                 | High — unlocks E02 for affinity groups, E01 for domain overlays |
| **2** | Agent Genesis (P31-P35, C22) | Small — file path glob matching on tool events                                                             | None — standalone                                 | Medium — rare but foundational signal                           |
| **3** | Domain Overlays (C14-C16)    | Medium — overlay loader, matcher, fallback heuristics                                                      | Depends on E01/E02 for trigger command extraction | High — transforms raw sessions into named workflow steps        |
| **4** | Affinity Groups              | Large — correlator pipeline, new data collection, UI for group browsing                                    | Depends on E01/E02 and C14-C16 for signal sources | Very high — but most complex, build last                        |

### Phase 1: Extractors (E01-E04)

1. Add extractor fields to the session index schema (v4 migration)
2. Implement E01 and E02 in `classifier.service.ts` (Tier 1, runs on sync)
3. Implement E03 as a Tier 2 heuristic in the same service
4. Add E04 as a Tier 3 LLM prompt template for the enrichment pipeline
5. Backfill E01-E03 across existing 894 registry sessions (deterministic, instant)

### Phase 2: Agent Genesis (P31-P35, C22)

1. Add P31-P35 and C22 to the predicates/classifiers schema
2. Implement P34/P35 (Tier 1 — exact skill path matching)
3. Implement P31/P32/P33 (Tier 2 — glob pattern matching on tool events)
4. Implement C22 as a rollup classifier
5. Backfill across existing sessions

### Phase 3: Domain Overlays (C14-C16)

1. Define the overlay JSON schema and loader
2. Create the `bmad-v6` overlay as the first concrete example
3. Implement C15/C16 (Tier 1 — direct lookup from overlay)
4. Implement C14 (Tier 2 — heuristic fallback when no overlay matches)
5. Add overlay management to the Settings UI (list overlays, enable/disable, preview matches)

### Phase 4: Affinity Groups

1. Create the `affinity-groups.json` collection and data model
2. Implement Signal 1 (story ID grouping from E02) — highest value, lowest complexity
3. Implement Signal 6 (command chain detection) — works well with domain overlays
4. Implement Signals 2-5 (handover refs, cross-project reads, temporal clustering, shared mutations)
5. Build the correlator merge logic
6. Add group browsing to the Organiser UI (group timeline, session list per group)
7. Implement Signal 7 (LLM semantic similarity) last — only needed for sessions that escape deterministic/heuristic grouping

---

## 9. Updated Totals

### After Full Implementation

| Category                      | Current (v3) | Added            | New Total |
| ----------------------------- | ------------ | ---------------- | --------- |
| Predicates (P)                | 25 (P01-P25) | 5 (P31-P35)      | **30**    |
| Classifiers (C)               | 13 (C01-C13) | 4 (C14-C16, C22) | **17**    |
| Observations (O)              | 7 (O02-O08)  | 0                | **7**     |
| **Extractors (E)**            | **0**        | **4 (E01-E04)**  | **4**     |
| **Subtotal enrichment items** | **45**       | **13**           | **58**    |

| Collection          | Current                 | Added                        |
| ------------------- | ----------------------- | ---------------------------- |
| Session registry    | 1 (registry.json)       | 0                            |
| Session index       | 1 (session-index.jsonl) | 0 (extended with new fields) |
| **Affinity groups** | **0**                   | **1 (affinity-groups.json)** |

### By Tier

| Tier                             | Current | Added                            | New Total |
| -------------------------------- | ------- | -------------------------------- | --------- |
| Deterministic (Tier 1)           | 11      | 6 (E01, E02, C15, C16, P34, P35) | **17**    |
| Partially Deterministic (Tier 2) | 12      | 6 (E03, C14, C22, P31, P32, P33) | **18**    |
| LLM-Required (Tier 3)            | 22      | 1 (E04)                          | **23**    |
| **Total**                        | **45**  | **13**                           | **58**    |

### ID Allocation Note

Predicate IDs P26-P30 are reserved for the BMAD-specific predicates proposed in `bmad-session-inventory.md` (has_bmad_skill_invocation, has_paste_back_correction, has_dr_verdict, has_ci_outcome, has_story_file_writes). Those are domain-specific and may be implemented as overlay-driven detections rather than core predicates. The agent genesis predicates start at P31 to avoid collision.

Classifier IDs C17-C21 are similarly reserved for the BMAD-specific classifiers (bmad_story_id, bmad_chain_position, bmad_is_backtrack, bmad_ceremony_level, bmad_epic_id). These would be overlay-driven rather than core classifiers.

---

**Next steps**: Review this plan, then begin Phase 1 (Extractors) by extending `classifier.service.ts` with E01-E03 parsing logic.
