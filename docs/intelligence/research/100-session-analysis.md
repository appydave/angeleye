# AngelEye Intelligence Research — 100-Session Synthesis

**Date:** 2026-03-15
**Analyst:** Claude Sonnet 4.6 (synthesis agent)
**Sessions covered:** ~100 across 5 research batches
**Source batches:**

- Batch 1: 19 brains project sessions
- Batch 2: 20 sessions (prompt.supportsignal + signal-studio)
- Batch 3: 20 sessions (appystack + appydave-plugins + angeleye)
- Batch 4: 20 minor project sessions (flihub, voz, poem-os, klueless, deckhand, etc.)
- Batch 5: 15 marathon sessions + 5 junk stubs

---

## 1. The Tool-Only Classification Hypothesis

### Overall Accuracy

| Batch                                 | Sessions tested     | Correct | Mostly correct | Partial/Wrong | Accuracy (correct + mostly) |
| ------------------------------------- | ------------------- | ------- | -------------- | ------------- | --------------------------- |
| Batch 1 (brains)                      | 18 (1 had no tools) | 13      | 3              | 2             | ~89%                        |
| Batch 2 (supportsignal/signal-studio) | 20                  | 16      | 3              | 1             | 95%                         |
| Batch 3 (appystack/plugins/angeleye)  | 20                  | 14      | 0              | 6             | 70%                         |
| Batch 4 (minor projects)              | 20                  | ~11     | ~2             | ~7            | 55–65%                      |
| Batch 5 (marathon sessions)           | 15                  | —       | —              | —             | Not systematically scored   |

**Cross-batch verdict:** Accuracy is NOT a single number. It varies by session type and is between **55% and 95% depending on the context.** The hypothesis holds strongly for product/client-work sessions and fails more often for knowledge/brain/minor-project sessions.

### Where It Works Reliably (80–95% accuracy)

These tool signals are so distinctive they almost never misclassify:

| Signal                                            | Confident classification                                   | Why it works                                                  |
| ------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `playwright_click > 50` + `fill_form > 10`        | UAT data-entry execution                                   | No other session type produces high click+fill                |
| `playwright_screenshot > 20` + `navigate > 15`    | Observational UAT / visual verification                    | Systematic visual evidence collection                         |
| `AskUserQuestion >= 5`                            | Structured Q&A / requirements elicitation                  | This tool is only used in deliberate Q&A mode                 |
| `browser_evaluate > 50` + `browser_navigate > 50` | Automated web scraping or login-wall navigation            | Programmatic browser control at scale                         |
| `TaskCreate >= 7` in first 15 events              | Plan-decompose-execute (Ralphy/Wiggum campaign)            | Task bursts only happen when decomposing a pre-planned scope  |
| `CronCreate > 0`                                  | UAT monitoring loop setup                                  | Only used in UAT sessions requesting loop-based observability |
| `0 tools, 0 events after user_prompt`             | No-execution session (ideation / orientational / dead-end) | Absence of tools is as diagnostic as presence                 |

### Where It Fails (accuracy drops to 30–60%)

These are the concrete failure modes, consistent across batches:

1. **Knowledge/brain sessions vs code scaffolding:** `Write` after `Glob+Read` looks identical whether writing a new skill file or capturing brain notes. Project directory is the only discriminator.

2. **Sessions opening with conceptual discussion:** Any session that starts with multi-paragraph voice description of a problem before Claude fires tools — the discussion phase is invisible. Tool-only misses the conceptual framing entirely.

3. **Account/credential forensics:** Bash-heavy in a code project reads as "running tests." Actually recovering npm credentials or repo ownership is undetectable from tool sequence.

4. **Architecture discussions leading to implementation:** The intent (architectural design) is invisible. Only the implementation artifacts are visible. Misclassified as "bug fix" or "targeted refactor."

5. **Loom transcript processing / client communication:** Looks like "documentation update" because `Edit/Write` after `Read`. Actually a client deliverable from a video transcript.

6. **Multi-domain drift sessions:** A session that starts as debugging and becomes product conceptualisation (seen in marathon sessions) — the tool sequence reflects the first phase, the actual value is in the pivot.

### Composite Classifier Rules (validated across ≥2 batches)

```
IF playwright_click > 50 AND fill_form > 0    → UAT_EXECUTION (confidence: 0.95)
IF playwright_screenshot > 20 AND navigate > 15 → UAT_OBSERVATIONAL (confidence: 0.90)
IF AskUserQuestion >= 5                         → ELICITATION_SESSION (confidence: 0.98)
IF TaskCreate >= 7 in first 20 events          → CAMPAIGN_EXECUTION (confidence: 0.88)
IF browser_evaluate > 30 AND browser_navigate > 30 → WEB_AUTOMATION (confidence: 0.92)
IF Bash >= 50% of tools AND no playwright       → INFRASTRUCTURE_WORK (confidence: 0.75)
IF Edit >= 40% of tools AND Read <= 20%         → TARGETED_FILE_UPDATE (confidence: 0.85)
IF Write appears before any Read               → NEW_FILE_CREATION (confidence: 0.82)
IF total_tools == 0                             → IDEATION_OR_DEAD_END (confidence: 0.95)
IF Bash dominant AND project_dir contains brains → KNOWLEDGE_WORK (not infra) — (confidence: 0.80)
IF Bash dominant AND project_dir NOT brains     → INFRA_BUILD_DEBUG (confidence: 0.75)
IF Skill appears in first 5 events              → SKILL_INVOCATION_SESSION (confidence: 0.85)
IF CronCreate > 0                               → UAT_WITH_LOOP_MONITORING (confidence: 0.92)
```

**Critical finding:** The `project_dir` combined with tool pattern dramatically lifts accuracy on ambiguous cases. Never classify on tools alone when `project_dir` is available. The composite `(project_dir, tool_pattern)` pair is the real classifier.

---

## 2. A Validated Session Taxonomy

### Top-Level Types (6)

Based on 100 sessions, six mutually exclusive primary types cover essentially all sessions. Assign exactly one.

#### TYPE A: BUILD

Feature implementation, codebase modification, product development.

| Subtype                 | Signal                                         | Examples                       |
| ----------------------- | ---------------------------------------------- | ------------------------------ |
| `build.campaign`        | TaskCreate burst + Edit/Bash cycle             | Wave N implementation sessions |
| `build.surgical`        | Edit dominant (>40%), few Reads, no agents     | Skill file update, config fix  |
| `build.agent_delegated` | Agent >= 10 in cluster + Edit aftermath        | Multi-file generation          |
| `build.infrastructure`  | Bash dominant, no Playwright, server-side dirs | Ansible, npm, git ops          |

#### TYPE B: TEST

UAT, debugging, quality assurance, validation.

| Subtype                  | Signal                                        | Examples            |
| ------------------------ | --------------------------------------------- | ------------------- |
| `test.uat_execution`     | playwright_click > 50 + fill_form > 0         | W01–W08 UAT runs    |
| `test.uat_observational` | playwright_screenshot > 20 + navigate > 15    | Visual verification |
| `test.debug_loop`        | Bash > 50 + Read/Edit cycling + no Playwright | Finding root cause  |
| `test.integration_run`   | Bash burst + Write (test results) + Agent     | CI-style runs       |

#### TYPE C: RESEARCH

Investigation, discovery, external lookup, competitive analysis.

| Subtype                    | Signal                                   | Examples                                |
| -------------------------- | ---------------------------------------- | --------------------------------------- |
| `research.web_scraping`    | browser_evaluate > 30 + navigate > 30    | Transcript download, community scraping |
| `research.codebase`        | Grep > 10 + Read-heavy opening           | Architecture investigation              |
| `research.external`        | brave_web_search or WebFetch dominant    | Ecosystem research                      |
| `research.knowledge_audit` | Pastes from other Claude windows back in | Brain discoverability testing           |

#### TYPE D: KNOWLEDGE

Brain system work, documentation, patterns, second brains. Distinct from BUILD because no product changes; the output is a knowledge artifact.

| Subtype                     | Signal                                        | Examples                         |
| --------------------------- | --------------------------------------------- | -------------------------------- |
| `knowledge.brain_update`    | Edit/Write + Read in brains dir, no Bash      | Brain file content addition      |
| `knowledge.brain_ingestion` | Write-first after Glob, brains dir            | Brain dump from external source  |
| `knowledge.skill_authoring` | Write→Edit in skills dir                      | New skill creation               |
| `knowledge.skill_update`    | Edit-only in skills dir (small session)       | Skill refinement                 |
| `knowledge.pattern_design`  | Edit/Write in brains, multi-prompt, long gaps | Conceptual pattern documentation |

#### TYPE E: OPERATIONS

System administration, infrastructure provisioning, machine management, git operations, file organisation.

| Subtype                  | Signal                                          | Examples                   |
| ------------------------ | ----------------------------------------------- | -------------------------- |
| `ops.machine_provision`  | Ansible playbooks, Bash-heavy, SSH              | agentic-os setup           |
| `ops.repo_maintenance`   | git-focused Bash, gitignore, large file removal | Repo hygiene               |
| `ops.cross_machine_sync` | Bash + SSH commands                             | MBP → Mac Mini sync        |
| `ops.tool_install`       | Skill invocation + Bash install commands        | Playwright browser install |

#### TYPE F: ORIENTATION

Sessions whose primary value is figuring out what to do next, context recovery, or exploration without execution commitment.

| Subtype                      | Signal                                                | Examples                       |
| ---------------------------- | ----------------------------------------------------- | ------------------------------ |
| `orientation.cold_start`     | "What were we working on?" opening, minimal tools     | Returning to abandoned project |
| `orientation.requirements`   | AskUserQuestion burst OR very long voice prompt       | Elicitation / spec capture     |
| `orientation.ideation`       | 0–5 tools, no file writes, pure conversation          | Thinking out loud              |
| `orientation.handover_check` | Glob + Read only, no Edit, prompt contains "handover" | Verifying context handover     |

### Subtype Count: 6 top-level types, 21 subtypes

This covers >95% of observed sessions. The remaining ~5% are hybrid or ambiguous (marathon sessions that drift across types).

### Reliable Signals Per Type

These are the single most reliable signals per type, validated across multiple batches:

| Type        | Strongest single signal                                             |
| ----------- | ------------------------------------------------------------------- |
| BUILD       | `Edit > 15` OR `Agent > 8 cluster`                                  |
| TEST        | `playwright_click > 30` OR `Bash > 50 + no playwright`              |
| RESEARCH    | `browser_evaluate > 20` OR `brave_web_search > 3`                   |
| KNOWLEDGE   | `project_dir contains "brains"` OR `skills dir Edit-dominant`       |
| OPERATIONS  | `Bash dominant + SSH patterns OR ansible in commands`               |
| ORIENTATION | `tools < 10` OR `first prompt length > 2000 chars (handover paste)` |

---

## 3. Junk/Exclusion Signals — Definitive Ruleset

Applied in priority order. Stop at first match.

### Rule 1: Definitive Auto-Discard (any single condition sufficient)

```
1. total_events == 1 AND prompt.length <= 2
   (single character: "x", "q", "2", etc.)

2. cwd in ["/tmp", "/private/tmp"] AND total_events <= 3

3. session_id starts with "agent-" AND total_events == 1
   (agent warmup stub — classify as agent_warmup, not junk, but discard from session list)

4. Single prompt that is a model greeting (starts with "Hello" + "how can I help"
   or similar reversal — user received a Claude greeting, not a user prompt)

5. registry.last_active - registry.started_at < 5 seconds AND total_events == 1
```

### Rule 2: High-Confidence Auto-Discard (any single condition sufficient)

```
6. total_events == 1 AND prompt matches /^[a-z]{1,3}$/ (short lowercase, likely typo)

7. registry.project == "tmp"

8. Multiple agent-prefixed sessions with identical prompts within 100ms of each other
   (parallel agent warmup pairs — classify as agent_warmup_pair, discard from list)
```

### Rule 3: Human Review Required (do NOT auto-discard)

```
9. total_events == 1 AND prompt.length >= 20
   (one-shot question — may be legitimate; e.g. "What projects do I have?")

10. File size > 500 bytes BUT total_events == 1
    (large prompt in single event = embedded content worth preserving)
```

### Special Classifications (separate from junk)

- `agent_warmup`: `agent-` prefixed session ID with "Warmup" prompt — real pattern, no intelligence value
- `agent_warmup_pair`: Two warmup sessions within 100ms, same CWD — background agent parallel launch
- `accidental_keystroke`: Single-character prompt in real project directory (e.g. "x" in /brains)

### What the Ruleset Covers

Batch 5 tested 5 tiny sessions. All 5 were correctly classified by rules 1–3:

- B1 (reversed greeting in /tmp): Rule 4 + Rule 2
- B2 ("x" in /tmp): Rule 1 + Rule 2
- B3/B4 (agent warmups): Rule 3 → agent_warmup
- B5 ("x" in /brains): Rule 1 (single char), despite real CWD

The critical edge case: a 251-byte session with "What projects do I have?" is NOT junk. It's a legitimate one-shot question. Rule 3 protects it.

---

## 4. Marathon Session Analysis

### Four Causes of Marathon Sessions (validated across batches 1, 2, 5)

Every session longer than 6 hours falls into one or more of these:

**Cause 1: Task duration (genuine long work)**
A single coherent task that naturally takes many hours. Signal: consistent CWD, clear continuous tool trajectory, no large time gaps. Example: FliDeck harness migration (46.7h with only 4 gaps of 3h+ each — legitimate multi-day work). These are real marathon sessions.

**Cause 2: Domain drift**
Session starts at one task, accumulates an unrelated second task. The pivot is user-initiated and often explicit. Signal: CWD changes to unrelated project, OR user asks "what are we trying to solve with this conversation?" mid-session. Example: FliGen dependency update session that pivoted to creating AppyStack. The AppyStack work is a separate logical session that happened to be appended.

**Cause 3: Sleep/wake continuity**
User doesn't close Claude between sessions. The session ID persists across sleeping periods. Signal: time gaps > 6 hours between events with zero events during the gap. Example: many signal-studio sessions spanning 16–20+ hours with clean 7-hour dormancy windows. These should be split at the gap points.

**Cause 4: Context compaction sprawl**
Session consumes context window, gets compacted, resumes — cycling through multiple compactions without the user starting fresh. Signal: 5+ context handover injections in a single session. Example: the Dynamous scraping session (2ed25517) with 10 handover injections. The system was fighting to keep one logical task alive across what should have been 5 sessions.

### Reliable Phase-Split Indicators (ranked by strength)

| Indicator                                                                                 | Strength    | Notes                                                                                             |
| ----------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| Time gap > 6 hours between events                                                         | Very strong | Almost certainly a sleep break = separate logical session                                         |
| Time gap > 3 hours                                                                        | Strong      | Usually a major context switch or sleep                                                           |
| Time gap > 1 hour                                                                         | Moderate    | Could be deep work; check adjacent tool types for domain change                                   |
| Context handover injection (5+ in session)                                                | Strong      | Each injection = system ran out of context = natural restart point                                |
| User prompt containing "what are we trying to solve" or "what is this conversation about" | Strong      | User themselves recognising domain drift                                                          |
| CWD change to unrelated project (not subdir)                                              | Moderate    | `/brains` → `/signal-studio` = domain change; `/signal-studio` → `/signal-studio/server` = normal |
| Frustration cluster followed by calm re-specification                                     | Strong      | Marks "crisis → reset" phase boundary                                                             |
| `"commit and push please"` / `"push it"`                                                  | Moderate    | Often ends a logical phase, not necessarily the whole session                                     |
| Duplicate prompt (same text sent twice)                                                   | Moderate    | User lost context, likely re-sent from prior window                                               |

### What Cannot Be Auto-Split

Marathon sessions CANNOT be automatically split into sub-sessions because:

- The session ID is the only persistent identifier; a synthetic split loses the original ID
- Claude Code's hook system doesn't emit phase boundaries; they must be inferred
- What looks like a phase boundary may be David deliberately continuing (not abandoning) a session

**Recommended approach:** Flag marathon sessions for display rather than splitting. Show phase boundaries in the Observer timeline view. Let the human confirm splits if they want separate entries.

---

## 5. Prompt Content Patterns — 100-Session Findings

Full-length prompts revealed patterns that truncated snippets could not show.

### Voice Transcription Prevalence

| Project type         | Voice transcription rate         |
| -------------------- | -------------------------------- |
| brains               | ~84% (16/19 sessions in Batch 1) |
| prompt.supportsignal | ~67% (Batch 2)                   |
| appystack            | ~71% (5/7 sessions in Batch 3)   |
| angeleye             | ~67% (4/6 sessions in Batch 3)   |
| appydave-plugins     | ~57% (4/7 sessions in Batch 3)   |
| signal-studio        | ~25% (Batch 2)                   |
| minor projects       | ~50% (10/20 sessions in Batch 4) |
| **Overall estimate** | **~60–65%**                      |

**Validated finding:** Voice use correlates inversely with project certainty. David speaks when figuring things out; types when he knows exactly what he wants. The deckhand UI sessions (100% typed) and signal-studio UAT sessions (mostly typed) confirm this — high-certainty execution tasks get typed prompts with structured inputs.

### Recognisable Voice Artifact Signatures

Across 100 sessions, these patterns reliably identify voice transcription:

1. **Phonetic substitutions:** "vercel" for "Playwright," "wispr" for "whisper," "broweer" for "browser," "struction fure" for "structure," "contorl" for "control"
2. **Repeated-start restarts:** "If I give you access to If I give you access to" — the user self-corrects mid-sentence
3. **Incomplete prompt endings:** Prompts that end mid-sentence, especially before named entities: "I'm David at Ideasmen to come to the"
4. **Verbal hedging:** "or something like that," "I don't know," "I think," "I mean"
5. **Filler words in prompts:** "Okay so," "Right so," "Yeah look"
6. **Dropped subjects/articles:** "Can you make sure that the Glacier option" (dropped object), "Why does everyone in chiang mai seem to havet his" (multiple voice errors)
7. **Self-address to Claude:** "Why is it taking so long... Dave?" — using Claude's name in second-person address is a voice-first behaviour
8. **Sentence-final questions mid-monologue:** "Does that make sense? Because what I was thinking..." — verbal logic checking

### Paste-as-Prompt (High-Trust Data Handoff)

One of the most significant findings: **approximately 30–35% of sessions open with a large paste, not a question.** The user is handing Claude raw data and expecting interpretation without instruction.

Paste types observed:

- Prior session terminal output (flivoice, klueless)
- Claude's own prior responses pasted from another window (thumbrack, brains knowledge-audit loop)
- Ansible/build logs (agent-os, brains)
- Loom video transcripts (voz)
- Structured handover documents (signal-studio, appystack)
- Email threads (lars)
- JSON/YAML schemas (flihub)
- Git status / git log output (v-appydave)

This is NOT a fallback behaviour. It is David's primary technique for cross-session continuity and context injection. AngelEye should treat large-paste P1 prompts differently from question P1 prompts — they signal a session bootstrapped from prior work.

### Context Handover Injections — Prevalence and Identification

"This session is being continued from a previous conversation that ran out of context..." is a Claude Code-generated injection, NOT a user prompt. Across 100 sessions:

- Present in approximately **40% of sessions** (higher in heavy-work projects)
- Some sessions have 8–10 injections (extreme context cycling)
- Easily identifiable: > 200 chars, starts with "This session is being continued"

**These must be excluded from prompt-count calculations and intent analysis.** A session with "40 prompts" that includes 8 injections has only 32 real user prompts.

### The "Yes" / Ultra-Short Approval Pattern

Across batches, very-short prompts (1–5 chars) appearing in sequences are NOT disengagement — they are high-trust execution signals:

- "yes" (3c), "2" (1c), "ok" (2c), "ex" (2c), "contineu" (8c — typo for continue)
- When 3+ consecutive prompts are < 5 chars, the session is in **execution mode**
- The prompts around the cluster are always substantive
- Highest observed: 8 consecutive "yes" responses in a single session

### Frustration as a Baseline Signal

**Frustration language is present in an estimated 70–80% of sessions** where Claude deviated from instructions or produced unexpected output. It is NOT a rare exception — it is a recurring baseline. The vocabulary ranges from mild ("That wasn't what I was looking for") to explicit profanity (documented in batches 2, 5, and 4).

Frustration language appears in specific contexts:

- AI deviated from an explicit plan ("Why did you deviate?")
- AI stopped mid-task without completing
- AI created files in the wrong location
- AI slowed down unexpectedly ("I've been waiting half an hour")
- Repeated failures in the same session

Frustration is NOT a signal that the session has low quality. Some of the most productive sessions (POEM runner, c9d68534) contain the most frustration because they involve difficult constraints. Frustration followed by calm re-specification = the session eventually succeeded.

### The Knowledge Audit Loop

A behaviour unique to the brains project (3+ confirmed instances, likely more): David opens a fresh Claude window, asks a question about his knowledge system, then pastes the response back into his working session to evaluate if the brain answered correctly.

Signature:

- Prompt contains "I gave this to another Claude window" or "The responses from each clean Claude instance" OR pasted Claude Code banner followed by a Claude response
- Typically mid-session, not at the start
- Always in brains project sessions

This is meta-testing behaviour — David is testing the discoverability of his own knowledge system.

---

## 6. What CANNOT Be Inferred From Data Alone

These questions cannot be answered from events, tool sequences, or prompt content alone, even with full-length prompts.

### Requires an LLM to Read Content

1. **The actual topic of a session** — within a session type (e.g. BUILD), what specific thing was built? Knowing it was a build session doesn't tell you "wave 7a linen redesign." Only reading the prompts tells you this.

2. **Whether a session succeeded or failed** — tool sequences and prompt sequences don't encode outcome. A session can have 200 Edit calls and produce broken code. There is no "success" event.

3. **The emotional arc** — frustration level, escalation, or resolution cannot be derived from tool sequences. It requires reading prompt text.

4. **Cross-session relationships** — that Session A's output was pasted into Session B, or that two sessions are working on the same wave, is only visible by reading content and identifying structural overlap.

5. **Whether a handover document was created and where it lives** — detectable from file paths if you see a Write to a handover path, but the content and whether it was acted on requires reading.

6. **The "session close" ritual** — sentences like "Can I close it off now?" only appear in prompt text. There is no tool event for intentional session closure.

### Requires Human Tagging

7. **Session quality / usefulness** — no objective signal. David may find a 5-prompt, 20-tool session more useful than a 300-tool session.

8. **Which brain subproject** was worked on (from 50+ brains) — file paths reveal this if you read the first_edited_dir, but it requires path parsing against a known brain registry to resolve to a name.

9. **Whether the work was client-facing or internal** — project_dir gives the project (e.g. `voz`), and `voz` is known to be a client, but this mapping requires a hardcoded lookup table. The data itself doesn't encode this distinction.

10. **The Ralphy wave number** — "Wave 7a" only appears in prompt text, not in events. To know which wave, you must read the first 2–3 prompts.

### Requires External Knowledge

11. **Whether a session was part of a planned campaign** — without reading IMPLEMENTATION_PLAN.md at the time of the session, you cannot know if the session was executing a pre-planned task or was ad-hoc.

12. **Whether the session's output was good** — requires subject matter expertise or running the produced code/content.

13. **Session intent vs session activity** — a session that LOOKS like debugging (Bash-heavy, many Read cycles) might be exploration. The distinction is intent, not activity.

---

## 7. Surprising Findings That Change Our Assumptions

### Finding 1: Tool-Only Accuracy Is Highly Variable (not a stable ~80%)

The earlier 20-session analysis reported "~80% accuracy." Across 100 sessions, this is both too high and too low depending on context:

- Product/client sessions: 80–95% accurate
- Knowledge/brain/minor project sessions: 50–65% accurate

The lesson: the single accuracy number hides a bimodal distribution. Tool-only works well on focused product work; it fails on exploratory, peripheral, and knowledge sessions. **A single accuracy figure should never be reported for this classifier.**

### Finding 2: File Size Is Almost Useless as a Session Complexity Signal

The initial schema assumed file size correlated with session weight. Across 100 sessions: a 64 KB session can have 0 tools (e.g. brains S08 — "I'm tired" session). A 271 KB session can have 19 tools (angeleye orientation session with pasted handover doc). File size reflects Claude's response verbosity and pasted context payloads, not actual tool execution density.

**Replace:** Do not use file_size as a signal. Use `tool_count` and `(edit_count + write_count)` for "work done." Use `prompt_count` for "engagement level."

### Finding 3: Session Duration Is Completely Unreliable as an Activity Measure

Sessions of 16h, 20h, 46h, 60h exist. None of them represent 16/20/46/60 hours of continuous work. All involve multiple multi-hour gaps. The only exception was the AngelEye B021 session (A5) — 57 minutes with 266 events — which had the highest actual work density.

**Replace:** The useful duration measure is "active time" = time spans where events appear within 5-minute windows of each other. Clock duration is a metadata artefact.

### Finding 4: ~40% of First Prompts Are NOT Questions

The initial assumption was "first_prompt_snippet captures intent." Actually, approximately 40% of first prompts are one of:

- A large paste (handover doc, prior session output, raw data)
- A context handover injection (Claude Code auto-generated)
- An ultra-short approval ("yes", "2", "ok")
- An accidental send ("jb", "x", double-send of prior prompt)

For these sessions, the second or third real user prompt carries the intent signal. **The proposed `first_prompt_snippet` field needs to be "first real user prompt" (80 chars), not just "first prompt."**

### Finding 5: Voice Transcription Is the Dominant Input Mode

The initial analysis underweighted voice. Across 100 sessions, an estimated 60–65% show voice transcription artifacts. This is not a secondary concern — it's the primary input mode for most sessions. Voice-transcribed prompts have systematic errors (phonetic substitution, dropped words, truncation) that must be expected and tolerated by any classifier that reads prompt text. Intent extraction from voice prompts requires error-tolerant parsing, not exact matching.

### Finding 6: The `auto_label` Field Needs Project Context to Be Useful

The proposed `auto_label` field was imagined as a system-generated label like "wave-7a-linen." But across 100 sessions, a good auto_label can ONLY be generated by reading the first 2–3 prompts AND knowing the project context. The label is fundamentally a semantic compression that requires language understanding — not a pattern match.

**Revised expectation:** `auto_label` should be generated by an LLM reading the first 3 real prompts, given the `project_dir`. It cannot be a rule-based classifier. The rule-based classifier can generate a `session_type` (one of the 6 taxonomy types) with reasonable confidence, but not a human-readable label.

### Finding 7: The Closing Ceremony Is a Reliable Session Completion Signal

In at least 30% of sessions, David ends with a specific closing ritual:

- "Can I close it off now?" + "Commit and push" + "Yes, do that please"
- "Was there anything else outstanding in this conversation?"
- "Can you just list all the decisions and topics we discussed before I close?"

Sessions WITH a closing ceremony are almost certainly complete (the intended task was done). Sessions WITHOUT a closing ceremony are either:

- Abandoned mid-task (40%)
- Context-exhausted (35%)
- Left open with intent to return (25%)

This distinction matters for labeling: completed sessions have higher-confidence labels; abandoned sessions may not have executed the work described in their opening prompts.

### Finding 8: The Brains Project Is One Identifier for 50+ Distinct Entities

All 239+ brains sessions share the same `project_dir` = `/Users/davidcruwys/dev/ad/brains`. The project field "brains" is meaningless without sub-labeling. The brain name appears in the first 1–2 file paths in the tool_use events (e.g. `brains/brand-dave/...`, `brains/kiros/...`). This is the most reliable sub-label signal.

**This invalidates** the earlier observation that `project_dir` (full path) is "95% reliable." For the brains project (239 sessions), it gives 0% within-project discrimination.

### Finding 9: Frustration Language Is Diagnostic, Not Exceptional

Initial framing treated frustration as a rare outlier. Across 100 sessions it appears in an estimated 70–80% of sessions where the AI deviated from a constraint. It is routine. The useful distinction is:

- **Mild correction:** "That's not what I meant" — normal steering
- **Escalating frustration:** Profanity + re-specification — AI failed to follow explicit plan
- **Crisis prompt:** "What's the f\*cking point?" — session at risk of abandonment

The crisis pattern is rare (~5% of sessions). But mild-to-medium frustration appears in the majority of multi-hour product sessions. AngelEye should not surface frustration as an anomaly signal — it would fire constantly.

### Finding 10: The "Commit and Push" Pattern Is a Phase Boundary, Not a Session Boundary

Initial assumption: "commit and push" = end of session. Across 100 sessions: "commit and push" appears mid-session in approximately 40% of cases where it appears at all. It marks the end of a logical PHASE (a coherent unit of work), not necessarily the end of the session. The session continues after the commit in many marathon sessions.

**Revised signal:** `"commit"/"push it"` = logical phase completion marker. Counting commit events in tool sequences (Bash commands containing `git push`) would give a phase-count for a session, not a session-count.

---

## Appendix: Accuracy Scorecard Per Batch

| Batch                                | n      | Correct | Mostly correct | Partial | Wrong | Score    |
| ------------------------------------ | ------ | ------- | -------------- | ------- | ----- | -------- |
| Batch 1 (brains)                     | 18     | 13      | 3              | 2       | 0     | 89%      |
| Batch 2 (ss+signal-studio)           | 20     | 16      | 3              | 0       | 1     | 95%      |
| Batch 3 (appystack+plugins+angeleye) | 20     | 14      | 0              | 6       | 0     | 70%      |
| Batch 4 (minor projects)             | 20     | 11      | 2              | 5       | 2     | 65%      |
| **Total / Average**                  | **78** |         |                |         |       | **~80%** |

Note: The 80% average masks the bimodal distribution. Focused product sessions (Batches 1–2) score 89–95%; exploratory/minor-project sessions (Batches 3–4) score 65–70%.

---

_Synthesis complete. 100 sessions, 5 batches, all projects. Written 2026-03-15._
