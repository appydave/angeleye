# Findings: W4-11 — brains / KNOWLEDGE / ansible-brain-build (6a2cef50)

## Classification

- **Registry**: KNOWLEDGE / read-heavy
- **Analysed type**: knowledge.brain_synthesis
- **Confidence**: high
- **Reclassification**: partial — KNOWLEDGE is broadly correct but the subtype is wrong
- **Reasoning**: The registry's KNOWLEDGE label is defensible but the session is not passive knowledge consumption. David's primary goal is to prepare a NotebookLM dataset for a video on Ansible and the agentic OS. The session involves reading existing brain files, gathering content from multiple sources, assembling a consolidated Markdown document, and opening it in Finder so David can drag it into NotebookLM. The Write tool appears 4 times and Bash 8 times (including `open` calls to reveal files in Finder), which is higher output than pure knowledge retrieval. The correct subtype is `knowledge.brain_synthesis`: brain content is read, combined, and written into a new deliverable. The tool pattern is "read-heavy" in that 17 of 44 tool events are Read (38.6%), but Write and Bash together account for 27.3% — this is synthesis work, not just lookup.

## Session Shape

- **Events**: 58 total (14 user_prompt, 44 tool_use, 0 progress skipped)
- **Total tool invocations**: 44
- **File reading tools**: Read x17 (38.6% of all events)
- **File discovery tools**: Glob x11 (25.0%), Grep x1 (2.3%)
- **Execution tools**: Bash x8 (18.2%)
- **File writing tools**: Write x4 (9.1%)
- **Skill lookup tools**: ToolSearch x3 (6.8%)
- **Duration**: ~2h 48m wall clock (2026-03-05T05:54 to 2026-03-05T08:42), with a ~48m gap between prompt 9 (06:11) and prompt 10 (07:01), and a further ~32m gap between prompt 12 (07:08) and prompt 13 (07:14)
- **Real user prompts**: 14
- **Context continuations**: 0
- **Opening style**: context-oriented — David asks agent to first check for a "Gather" skill before describing the actual task
- **cwd**: `/Users/davidcruwys/dev/ad/brains` throughout — no cwd shift

### Tools Breakdown

| Tool       | Count | %     |
| ---------- | ----- | ----- |
| Read       | 17    | 38.6% |
| Glob       | 11    | 25.0% |
| Bash       | 8     | 18.2% |
| Write      | 4     | 9.1%  |
| ToolSearch | 3     | 6.8%  |
| Grep       | 1     | 2.3%  |

### Skills

- ToolSearch invoked 3 times — likely looking for a `gather` or `dataset` skill. No confirmed skill invocation via `/skill` mechanism in the event data.

### Phase Structure

**Phase 1 — skill lookup and orientation (05:54–05:55)**
Before David's first prompt, agent runs ToolSearch x1 and Read x2 — orientation reads of CLAUDE.md / skills. David then asks about a "Gather" skill related to data aggregation for NotebookLM.

**Phase 2 — task framing: Ansible + agentic OS (05:55–05:58)**
Agent runs ToolSearch x1, Glob x4, Grep x1, Read x2 — discovering the brain structure and reading relevant files. David clarifies that the goal is to produce a video on Ansible from the angle of the agentic operating system, not a pure tutorial. References two concepts: vertical stack (personal agent) and horizontal state (agentic OS).

**Phase 3 — dataset assembly for NotebookLM (06:04–06:11)**
David asks for a Markdown document that can be dragged into NotebookLM. Agent runs Glob x4 to find brain files, ToolSearch x1 to check for a dataset skill, then Bash x1 (likely `find` or `cat`), Write x1 (creates the Markdown document), Bash x2 (opens Finder). David then questions why multiple files were listed when he only wants one video's worth of content, and requests a single packaged file.

**Phase 4 — second document: machine-specific provisioning angle (07:01–07:08)**
After a ~48m gap, David returns. He is happy with the first presentation but wants a supplementary document from the point of view of the specific machines (5 machines configured in Ansible). Agent runs Glob x1, Read x6, Write x1, Bash x1 (open in Finder). David then asks for a third supplementary document covering Ansible terminal commands (how to run playbooks, check/diff mode).

**Phase 5 — concepts and live demo (07:14–08:41)**
David asks conversational questions: what does "idempotent" mean? How to explain vertical vs horizontal stack in one prompt? Can Ansible run on Windows? What are Windows/Linux alternatives? What Ansible commands could he demonstrate live? A ~32m gap follows, then David pastes a terminal snippet showing an ansible-playbook dry-run (`--check --diff`) that succeeded. He asks which flag made it a dry run.

**Phase 6 — ansible issue diagnosis (08:40–08:42)**
Final exchange: David pastes a `ansible-playbook site.yml --limit mac-mini-m4 --check --diff` terminal run, agent runs Glob x1, Bash x1, Read x4, Write x1. Ends with David confirming the `--check` flag explanation.

## Observations

1. **KNOWLEDGE is broadly right but masks the synthesis work**: This session produces new files (3–4 Write calls) and uses Bash to open them in Finder for delivery. It is not read-only knowledge retrieval. The more precise label is `knowledge.brain_synthesis`: David gathers content from the brains corpus, assembles it, and produces a deliverable (NotebookLM datasets). AngelEye should distinguish read-only KNOWLEDGE sessions from synthesis sessions that produce a written output.

2. **NotebookLM as a recurring output target**: This is the second or third session in this analysis corpus where NotebookLM is the named output target. The pattern is consistent: David wants to consolidate brain files into a single Markdown document that he physically drags into NotebookLM. This suggests a reusable workflow that should have a dedicated skill. The absence of such a skill (evidenced by ToolSearch calls looking for "Gather") is a friction point David explicitly mentions.

3. **Ansible brain subfolder confirmed active**: The brains directory at `~/dev/ad/brains/ansible/` contains at least 6 files: `ansible-fundamentals.md`, `ansible-practical-examples.md`, `ansible-technical-patterns.md`, `ansible-safety-patterns.md`, `macos-provisioning-lessons.md`, `vscode-settings.md`, plus an `INDEX.md` and `sources/` directory. This session is a companion to W3-13 and W3-14 (the OPERATIONS ansible sessions) — the knowledge captured there was likely written into this brain subfolder and is now being re-read here for video preparation.

4. **Vertical vs horizontal stack — key concept pair**: David repeatedly references two concepts: "vertical stack / personal agent" and "horizontal state / agentic operating system." He asks for a single prompt that explains the difference. This is a recurring conceptual axis in the angeleye/brains corpus and is worth surfacing as a knowledge entity for AngelEye.

5. **Long session with natural gaps**: The 2h 48m total wall clock has substantial gaps (~48m and ~32m). The active work bursts are shorter: ~17 minutes (05:54–06:11), ~7 minutes (07:01–07:08), ~7 minutes (07:14–07:25 approx), and ~35 minutes (07:57–08:42). This is a characteristic pattern for brain synthesis sessions — David consumes the output (reads the document, watches the notebook, prepares for the video), then returns with a new question.

6. **Three deliverables in one session**: The session produces at least three distinct Markdown files: (a) the primary consolidated NotebookLM dataset for the Ansible/agentic OS video, (b) a second document focused on the 5-machine provisioning setup, (c) a third document covering Ansible terminal commands and live demo ideas. This is a high output-density session for KNOWLEDGE work.

7. **Idempotent — concept explanation mid-session**: David asks "What does idempotent mean?" in a standalone prompt (07:14). This is a micro-KNOWLEDGE event embedded in a synthesis session. It does not change the session type but is a signal that the session audience (the video) includes people who are not yet familiar with Ansible terminology.

8. **Tool pattern confirms read-heavy but not read-only**: Glob x11 is high — the agent is doing substantial discovery work, likely because the brains directory has many files and the agent needs to find the relevant ones. This is consistent with a corpus-traversal task. The 11 Glob calls followed by 17 Reads suggest the agent globbed multiple subdirectories to find files, then read the candidates. This is a standard brain synthesis pattern.

## Patterns Found

- **NotebookLM dataset assembly fingerprint**: Glob-heavy discovery + Read-heavy retrieval + Write (Markdown) + Bash (`open` to reveal in Finder) = NotebookLM dataset session. The Bash calls are not code execution — they are file system operations to surface the output to David for manual drag-and-drop. AngelEye should treat this pattern as `knowledge.brain_synthesis` with a `notebooklm` delivery tag.
- **Skill gap as session friction**: ToolSearch appearing early (3 times before the first real work begins) signals the agent is looking for a skill that doesn't exist. David explicitly says "I thought we had this in the skill already" (06:11). This is a skill-gap signal — a recurring workflow that has not yet been codified. AngelEye can use early ToolSearch clusters as a friction indicator.
- **High Glob count as corpus-traversal signal**: When Glob count exceeds 8 in a session with cwd in `brains/`, the agent is doing multi-directory corpus traversal — a hallmark of synthesis work. This is distinct from targeted lookups (1–3 Globs) in BUILD or DEBUGGING sessions.
- **Write + Bash(open) as delivery pattern**: Bash calls following Write calls in a brains session are almost always `open` commands revealing the written file in Finder. This is a delivery gesture, not code execution. AngelEye should disambiguate Bash semantics by looking at adjacent Write events.
- **Conceptual Q&A tail**: The final phase of this session (07:14 onwards) consists of short conceptual questions with no tool calls — pure chat. This is a teaching/exploration tail that follows synthesis work. Sessions with a synthesis phase followed by a conversational tail should keep the synthesis classification; the tail does not change the type.

## New Types or Subtypes Proposed

- **knowledge.brain_synthesis (new candidate)**: Sessions where the agent reads multiple brain files, assembles them into a new document, and delivers it to the user (typically via Write + Bash open). Distinguishing signals: (a) cwd in `brains/`, (b) Glob count > 6, (c) Read count > 8, (d) Write count 1–5, (e) Bash calls following Write events, (f) user references "NotebookLM," "dataset," "drag in," or "package up." Distinct from `knowledge.retrieval` (read-only, no Write), `knowledge.curation` (editing existing brain files rather than synthesising new ones), and BUILD (where the output is executable code, not a Markdown document).
- **knowledge.retrieval (existing candidate refined)**: Pure KNOWLEDGE sessions where Read + Glob dominate with zero or near-zero Write/Bash. The tool pattern for current "read-heavy" sessions should be split: read-heavy + Write > 0 = `knowledge.brain_synthesis`; read-heavy + Write == 0 = `knowledge.retrieval`.

## Subtype Candidates Confirmed

- **knowledge.brain_synthesis**: Confirmed viable. The session maps to this subtype: 17 Reads + 11 Globs (retrieval), 4 Writes (synthesis), 8 Bashes (delivery + execution). The user's explicit goal is to produce a document for NotebookLM, not to learn something or debug a problem.
- **KNOWLEDGE reclassification confidence**: Medium-high. The registry's KNOWLEDGE label is not wrong — the session is knowledge-domain work. The challenge is that "KNOWLEDGE" as a top-level type covers both passive retrieval and active synthesis. The subtype distinction is what matters for AngelEye's classification granularity.

## Brain Subfolder

`~/dev/ad/brains/ansible/` — confirmed as the primary brain target. Files referenced in the session likely include `ansible-fundamentals.md`, `ansible-practical-examples.md`, `ansible-technical-patterns.md`, `macos-provisioning-lessons.md`. The `sources/` subdirectory likely contains raw reference material.

## Interest Level

high — This session is a clean, well-structured example of `knowledge.brain_synthesis` that the registry misses by not distinguishing synthesis from retrieval. The NotebookLM delivery pattern recurs across the corpus and deserves a dedicated fingerprint. The skill-gap signal (ToolSearch for a non-existent "Gather" skill, confirmed by David's own comment) is actionable. The three-deliverable output structure and the conceptual Q&A tail are generalizable patterns. The Ansible brain subfolder link to the W3-13/W3-14 OPERATIONS sessions creates a cross-session knowledge chain worth tracking.
