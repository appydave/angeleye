# Predicate Tier Reference

**Purpose**: Every predicate, classifier, and observation in the v3 schema, categorized by detection method — deterministic (pure code), partially deterministic (regex/heuristic), or LLM-required (needs Claude to read and interpret).

**Created**: 2026-03-25

**Schema source**: `/Users/davidcruwys/dev/ad/apps/angeleye/docs/intelligence/PATTERNS.md`

---

## Three Detection Tiers

| Tier                        | What it means                                                                                                                  | Cost                                   | Speed               | Example                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- | ------------------- | ---------------------------------------------------------------- |
| **Deterministic**           | Pure code. Count events, check tool names, match paths. Always gives the same answer for the same input.                       | Zero (runs in `classifier.service.ts`) | Milliseconds        | "Does this session contain playwright tool calls?"               |
| **Partially Deterministic** | Regex and heuristics on prompt text or file paths. High accuracy but not 100%. May miss edge cases or produce false positives. | Zero (runs in `classifier.service.ts`) | Milliseconds        | "Does the first prompt start with a handover injection pattern?" |
| **LLM-Required**            | Needs Claude to read conversation content and make a judgment call. Cannot be reduced to pattern matching.                     | API tokens or Claude Code context      | Seconds per session | "Did Claude misunderstand what the user was asking?"             |

---

## Predicates (P01–P25)

### Tier 1 — Deterministic (8 predicates)

| ID      | Name                         | Detection Logic                                                                               |
| ------- | ---------------------------- | --------------------------------------------------------------------------------------------- |
| **P05** | has_playwright_calls         | Any tool event with `tool` matching `mcp__playwright__*`                                      |
| **P09** | is_compaction_resume         | Any event with `event === 'compact'` or `event === 'context_compaction'`                      |
| **P12** | is_machine_initiated         | First event is NOT `user_prompt` — session started by agent dispatch, cron, or skill launcher |
| **P19** | has_web_research             | Any tool event matching `WebFetch`, `WebSearch`, or `mcp__brave-search__*`                    |
| **P20** | has_parallel_subagent_bursts | 3+ `Agent` tool calls within a 60-second window                                               |
| **P21** | has_task_orchestration       | Any tool event matching `TaskCreate`, `TaskUpdate`, `TaskOutput`, `TaskList`                  |
| **P22** | has_git_outcome              | Bash tool_input containing `git commit`, `git push`, `git merge`, or `gh pr create`           |
| **P23** | is_paperclip_agent           | **Already implemented** — regex `^You are agent [0-9a-f-]{36}` on first prompt                |

### Tier 2 — Partially Deterministic (8 predicates)

| ID      | Name                          | Detection Logic                                                                                                                                                         | Caveat                                                                            |
| ------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **P04** | has_brain_file_writes         | Edit/Write tool events with `file_path` containing `/brains/`                                                                                                           | Could false-positive on paths that happen to contain "brains"                     |
| **P06** | has_cross_session_refs        | Prompt text contains UUID patterns, "previous session", "last time we", "earlier conversation"                                                                          | Natural language matching — may miss oblique references                           |
| **P08** | has_unauthorized_edits        | Edit/Write file paths outside the session's `project_dir`                                                                                                               | Legitimate cross-project edits exist (e.g., updating a brain from an app session) |
| **P11** | has_voice_dictation_artifacts | Regex for: run-on sentences >100 words without punctuation, common STT errors ("Claude" → "cloud", "comma" literal), lack of markdown formatting in long prompts        | Voice vs sloppy typing is a judgment call at the margin                           |
| **P17** | has_handover_context          | First prompt matches: starts with "This session is being continued", contains `<task-notification`, starts with "Session Context:", or first prompt >2000 chars (paste) | Long first prompts could be genuine user messages                                 |
| **P18** | has_cross_project_reads       | Read/Glob/Grep tool events with paths outside `project_dir`                                                                                                             | Same caveat as P08 — sometimes intentional                                        |
| **P24** | has_pii_content               | **Already implemented** — regex patterns for email, IP, API keys, tokens, secrets                                                                                       | False positives on hex strings, example code                                      |
| **P25** | has_closing_ceremony          | Last 5 tool events include `git commit` + `git push` in Bash, OR final assistant message contains "committed", "pushed", summary language                               | Heuristic — some sessions commit mid-way                                          |

### Tier 3 — LLM-Required (9 predicates)

| ID      | Name                    | Why LLM is needed                                                                               | What to send to LLM                                               |
| ------- | ----------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **P01** | is_feature_construction | Must understand what the session is _building_ vs configuring, fixing, or exploring             | First 3 real prompts + tool sequence summary                      |
| **P02** | has_frustration_signals | Tone and intent: "no that's wrong", repeated corrections, escalating language                   | All user prompts (truncated to first 200 chars each)              |
| **P03** | is_multi_phase          | Must identify narrative phase boundaries — commit-then-pivot, topic shift, explicit "now let's" | Tool sequence + prompt summaries + timing                         |
| **P07** | has_skill_gap_signal    | User does something manually that a skill could automate, but doesn't invoke it                 | Prompts + tool calls, cross-referenced with known skill inventory |
| **P10** | is_cwd_incidental       | Was the work in this directory intentional or did the user just happen to open Claude there?    | Prompts + file paths + whether work matches project purpose       |
| **P13** | misunderstood_request   | Claude did something the user didn't ask for                                                    | Prompt-response pairs showing divergence                          |
| **P14** | wrong_approach          | Claude picked a suboptimal strategy                                                             | Technical judgment on approach quality                            |
| **P15** | buggy_output            | Claude produced code with bugs that needed fixing                                               | Code output + subsequent fix attempts                             |
| **P16** | excessive_changes       | Claude modified more files/lines than the request warranted                                     | Scope of request vs scope of changes                              |

---

## Classifiers (C01–C13)

### Tier 1 — Deterministic (3 classifiers)

| ID      | Name                | Values                                                                                                | Detection Logic                                                                      |
| ------- | ------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **C02** | session_scale       | micro, light, moderate, heavy, marathon                                                               | **Already implemented** — tool_use event count thresholds (≤3, ≤10, ≤50, ≤200, >200) |
| **C05** | tool_profile        | playwright-heavy, bash-heavy, edit-heavy, task-heavy, agent-heavy, websearch-heavy, read-heavy, mixed | **Already implemented** — tool type ratio thresholds                                 |
| **C06** | project_attribution | project name string                                                                                   | **Already implemented** — derived from `project_dir` last path segment(s)            |

### Tier 2 — Partially Deterministic (4 classifiers)

| ID      | Name               | Values                                                                                       | Detection Logic                                                                                                               | Caveat                                                 |
| ------- | ------------------ | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **C01** | session_type       | BUILD, TEST, RESEARCH, KNOWLEDGE, OPS, ORIENTATION                                           | **Already implemented** — composite of tool_pattern + project_dir + scale. Currently the 6-type classifier shown on sync page | Accuracy ~80% on focused sessions, ~62% on exploratory |
| **C03** | opening_style      | slash-command, voice-dictated, paste-handover, typed-question, context-injection, accidental | First prompt analysis: length, formatting, starts-with patterns, punctuation density                                          | Voice vs typed is probabilistic                        |
| **C09** | session_continuity | fresh, handover_paste, compaction, skill_launcher, recall                                    | First event type + first prompt patterns (handover text, compaction event, `/skill` invocation)                               | Overlapping signals possible                           |
| **C11** | initiation_source  | user_typed, voice_dictated, handover_paste, skill_invoked, agent_dispatched                  | Combination of C03 + P12 + first event type                                                                                   | Voice detection is heuristic                           |

### Tier 3 — LLM-Required (6 classifiers)

| ID      | Name              | Values                                                                                            | Why LLM is needed                                                               |
| ------- | ----------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **C04** | closing_style     | clean-commit, abandoned, task-complete-no-commit, mid-conversation, forced-stop, compaction-death | Must read final exchanges to understand whether session ended intentionally     |
| **C07** | session_subtype   | 500+ discovered values                                                                            | Semantic understanding of what the session was _doing_ — not just tool patterns |
| **C08** | delegation_style  | conversational, directive, orchestrated, autonomous                                               | Must interpret interaction pattern between user and Claude                      |
| **C10** | output_type       | conversation_only, code_changes, knowledge_synthesis, mixed, new_artifacts                        | Must understand what was _produced_, not just which tools ran                   |
| **C12** | prompt_verbosity  | terse, normal, verbose, paste                                                                     | Requires reading prompt content to distinguish verbose-human from paste-dump    |
| **C13** | session_lifecycle | complete, abandoned, ghost, interrupted, stub                                                     | Must interpret whether the session achieved its goal                            |

---

## Observations (O02–O08)

All observations are **Tier 3 (LLM-Required)** — they are free-text analysis summaries.

| ID      | Name                 | What it captures                                                                               |
| ------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| **O02** | frustration_analysis | Narrative of what caused frustration, how it was resolved                                      |
| **O03** | phase_breakdown      | Description of distinct phases within the session                                              |
| **O04** | skill_gap            | Which skills were missing or underused                                                         |
| **O05** | session_chain        | How this session relates to previous/subsequent sessions                                       |
| **O06** | autonomy_profile     | How autonomous vs interactive the session was (e.g., "high autonomy — 15:1 tool/prompt ratio") |
| **O07** | machine_character    | Which machine and its behavioral tendencies                                                    |
| **O08** | tool_diversity_index | How many distinct tools used and distribution pattern                                          |

**Note**: O06 and O08 could be partially automated — autonomy ratio is computable from tool_use count / user_prompt count, and tool diversity is a simple count. The _interpretation_ (bucket labels, narrative) is what requires LLM.

---

## Coverage Summary

| Tier                    | Predicates | Classifiers | Observations | Total  |
| ----------------------- | ---------- | ----------- | ------------ | ------ |
| Deterministic           | 8          | 3           | 0            | **11** |
| Partially Deterministic | 8          | 4           | 0            | **12** |
| LLM-Required            | 9          | 6           | 7            | **22** |
| **Total**               | **25**     | **13**      | **7**        | **45** |

**Quick win**: Implementing Tier 1 + Tier 2 adds **23 new data points** per session with zero LLM cost. That's the sync button upgrade.

**Full enrichment**: Adding Tier 3 gives all 45 data points but requires an LLM call per session.

---

## Implementation Priority

1. **Immediate** — Extend `classifier.service.ts` with Tier 1 deterministic predicates (8 new)
2. **Soon** — Add Tier 2 partially deterministic predicates + classifiers (12 new)
3. **Pipeline** — Build LLM enrichment for Tier 3 (22 remaining) via Ralphy, Codex, or Claude Code SDK

---

**Related docs**:

- Data architecture: `/Users/davidcruwys/dev/ad/apps/angeleye/docs/planning/enrichment-pipeline/data-architecture.md`
- Execution paths: `/Users/davidcruwys/dev/ad/apps/angeleye/docs/planning/enrichment-pipeline/execution-paths.md`
- Mockup brief: `/Users/davidcruwys/dev/ad/apps/angeleye/docs/planning/enrichment-pipeline/mochaccino-brief.md`
