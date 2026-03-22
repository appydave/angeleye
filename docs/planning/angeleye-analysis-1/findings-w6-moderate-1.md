# Findings — W6 Moderate-1 (8 sessions, 61-92 events)

Wave 6 batch: moderate sessions from app.supportsignal (3), prompt.supportsignal (2), flihub (1), appydave-plugins (1), brains (1).

---

## W6-S01 — e3f78527 (app.supportsignal)

**Registry type**: BUILD
**Analysed type**: PLANNING (planning.decision_making)
**Confidence**: high

**Summary**: SupportSignal v2 planning session. Opens with a massive 8,910-char context handover describing the v2 planning state. David then reviews Angela's participant support plan system code, dispatches background tasks to integrate her findings into planning docs, and works through 7 architectural decisions one by one (option A/B/C choices). Edits target planning JSON and markdown documents, not product code. The session spans 31 hours wall-clock but only 65 active minutes, with 4 idle gaps >1h indicating multi-day decision-making over episodic engagement.

**Observations**:

1. This is a textbook PLANNING session — decisions are the primary deliverable, written back into planning documents. No feature code is created. BUILD is wrong.
2. The opening prompt is a prior-session handover context dump (8,910 chars). This is `paste_handover` at an extreme scale — the entire session context was reconstructed from a prior conversation.
3. Multi-phase: Phase 1 (research Angela's code, 30 min), Phase 2 (decisions 1-3, next day), Phase 3 (decisions 4-7, day after). Each phase separated by 2-15h gaps.
4. "Option A, close it, commit all decisions" — David uses a decision protocol: Claude presents options, David picks, Claude writes decision to document, commits. Repeatable pattern.
5. Voice dictation artifacts: "floor" = "flaw", "Hurst" = "her", "Angeles" = "Angela's".

---

## W6-S02 — 8b8e5899 (app.supportsignal)

**Registry type**: BUILD
**Analysed type**: PLANNING (planning.schema_design)
**Confidence**: high

**Summary**: POEM integration schema design for SupportSignal. Opens with a conceptual question about which BMAD agent to use for epic changes, then loads a handover context from a prior session. The session is deeply conceptual — David corrects Claude's relational-database assumptions about the workflow table (it should be a document, not decomposed into columns), adds the execution state concept, and ultimately asks for a detailed requirements document. Heavy on Read (29 tool calls) as it consumes existing docs. Writes a PRD and commits. 158 minutes wall-clock, 103 active.

**Observations**:

1. Classic PLANNING — zero feature code written. All output is planning docs (handoff document, PRD, schema design). The 3 Edit + 2 Write target planning markdown files.
2. Cross-session handover is extremely explicit: David literally pastes the full Claude Code output from a previous session as context. This is `paste_handover` combined with `cross_session_refs`.
3. David corrects Claude's thinking on database design — "I could be wrong... but the workflow is a guide, it's a map, and it's purely in JSON." This is user-as-architect, Claude-as-scribe. Advisory in reverse.
4. The BMAD agent system (/po Sarah, /sm Bob, /analyst) is invoked. Skill invocation `/BMad:agents:po` triggers a structured PO persona.
5. Voice: "epics?" has question mark from speech cadence.

---

## W6-S03 — 0510f9c2 (flihub)

**Registry type**: BUILD
**Analysed type**: BUILD (build.iterative_refinement)
**Confidence**: high

**Summary**: FliHub codebase audit and feature update. Opens with a voice-dictated gap analysis request ("Do we have outstanding tasks? Backlog? Challenges, issues, gap analysis"). Claude does a codebase scan with Read/Grep/Agent (3 Agent calls for subagent analysis). Then David says "Execute" and Claude does a burst of 12 Edit calls updating implementation plan and code. Final phase: chapter JSON format discussion and code update, commit and publish. Product repo, Edit-heavy (21), clear feature construction.

**Observations**:

1. BUILD is correct. Product repo (flihub), Edit-dominant (21/59 = 36% of tools), new feature code written (chapter name export), commit and publish at end.
2. Two phases: Phase 1 = orientation/gap analysis (12 events, Read/Grep heavy), Phase 2 = execution (Edit burst, commit). Phase transition triggered by David saying "Execute."
3. The "Execute" prompt is a clear phase gate — David reviews the plan, then gives a single-word execution command. This mirrors the POEM executor pattern but for BUILD.
4. 77-minute idle gap between phases — David reviewed the gap analysis offline before approving execution.
5. Skill invocation at commit time (likely /commit skill).

---

## W6-S04 — 8eb3a9dc (appydave-plugins)

**Registry type**: BUILD
**Analysed type**: SKILL (skill.creation_batch)
**Confidence**: high

**Summary**: Plugin skill creation session. Opens with a conceptual question about compaction strategies, then researches what problems people want to solve in Claude Code sessions. Discusses brain-bridge vs knowledge-capture distinctions, then builds 3 new skills in sequence: capture-context (patched), knowledge-capture (new), session-checkpoint (new), near-compaction (new). Version bump, commit, push. Clear skill file creation targeting SKILL.md files in the plugins repo.

**Observations**:

1. Not BUILD — this is SKILL. All edits target skill SKILL.md files, not product code. The appydave-plugins repo is a skill library, not a product.
2. Session starts as RESEARCH (conceptual question about compaction + web research via Task), pivots to SKILL construction after 30 min. Multi-phase: Research → Design → Build × 3 → Ship.
3. Voice dictation throughout: "cpature" = "capture", "propblems" = "problems", "orchistrator" = "orchestrator", "rembember" = "remember", "inforamtion" = "information".
4. David's frustration with brain-bridge: "I haven't been using brain-bridge because I don't remember what, when or why to use it." Skill discoverability gap.
5. Batch creation pattern: 3 skills built sequentially in one session. Each follows read-existing → write-new → bash-verify.

---

## W6-S05 — 3722bf8e (app.supportsignal)

**Registry type**: BUILD
**Analysed type**: BUILD (build.story_implementation)
**Confidence**: high

**Summary**: SupportSignal story implementation. Opens asking about linting issues from prior production deployment. Claude searches (Grep heavy initially), then David says "\*draft" to trigger a BMAD command. Story 0-1-0 reviewed, validated, fixes applied (7 Edit calls for linting). Then David asks about CI/CD health, says "develop story 0.11" — Claude reads the story, makes code edits, runs Bash test commands. Clean build-test-fix cycle. 177 minutes wall-clock, 42 active.

**Observations**:

1. BUILD is correct. Product repo, feature code edits (15 Edit), test execution via Bash, story-driven workflow. This is a genuine story implementation session.
2. The "\*draft" command is a BMAD workflow trigger — not a skill invocation but an in-session command to the PO agent persona.
3. Multi-phase: Phase 1 = linting review and fixes (epic 0), Phase 2 = develop story 0.11 (new story). Transition at ~05:48.
4. "What does this mean for me? If I go to my GitHub, am I going to see a fully working system?" — David checking deployment health from voice, expecting a yes/no confidence answer.
5. Final prompt "whats happening" at 07:14 after 1h gap — checking if session is still alive. Orientation bookend ending.

---

## W6-S06 — e40cfecd (prompt.supportsignal)

**Registry type**: BUILD
**Analysed type**: OPERATIONS (operations.workflow_maintenance)
**Confidence**: high

**Summary**: POEM workflow maintenance — step name cleanup and display manifest fixes. Opens with a handover note about step naming conventions for the AWB pipeline bar. Claude reads workflow YAML and display.yaml, makes 23 Edit calls renaming pipeline steps to short verbs. Then a Moment Analysis workflow gets the same treatment. Agent dispatched for background section work. Session spans 2 days but only 68 active minutes. Ends with explicit close: "Is there anything outstanding... or should we close?"

**Observations**:

1. Not BUILD — this is OPERATIONS (workflow_maintenance). No new features. All edits are renaming pipeline step labels, fixing broken display IDs, cleaning dead entries. Maintenance work on existing workflow configuration.
2. The prompt.supportsignal CWD confirms W5 finding: this is universally unreliable for project attribution. Work spans multiple workflow configs (new-incident, moment-analysis, youtube-launch-optimizer) and even references AppyStack recipes in another repo.
3. Explicit session close ceremony: "Is there anything outstanding with this conversation?" → Claude provides a 5-item completion summary with one unresolved thread. This is a `bookend_close` style.
4. The stop event contains Claude's full completion summary — useful metadata for session classification if harvested.
5. Bash-heavy (32 calls) in the Agent subwork section — running git status, directory listing, checking file existence. These are operational commands, not build commands.

---

## W6-S07 — 5abfd4f1 (prompt.supportsignal)

**Registry type**: BUILD
**Analysed type**: MIXED (planning.round_planning + build.wui_development + operations.config_fix)
**Confidence**: medium

**Summary**: Three-phase session. Phase 1: Review Angela's feedback, plan WUI round 9, create planning docs and round-planning markdown (Write × 5). Phase 2: Development — read existing workflow code, make edits to implement round 9 features, dispatch Task subagents. Phase 3: Fix env variable bug where wrong workflow was being selected, clean up config. 289 min wall-clock, 49 active.

**Observations**:

1. Genuinely MIXED — three distinct phases with different session types. Single-label loses information. Phase 1 = PLANNING (round planning from Angela feedback), Phase 2 = BUILD (WUI feature implementation), Phase 3 = OPERATIONS (config fix removing env variable override).
2. David pastes massive incident analysis output (the entire "Analysis Complete" page for James Brown) to ask where "save to disc" fits. This is a ~4000-char paste of a production output used as reference context. Cross-paste injection risk for classifiers.
3. Frustration signal: "But we weren't working on the YouTube Launch Optimizer... why is an environment variable... getting precedence" — Claude used wrong workflow selector. This is a tool-caused frustration, fixable.
4. prompt.supportsignal sessions confirmed multi-repo: edits span poc/wui/, poem/workflows/, and config files across the prompt repo.

---

## W6-S08 — 33f0048e (brains)

**Registry type**: BUILD
**Analysed type**: KNOWLEDGE (knowledge.brain_update_multi)
**Confidence**: high

**Summary**: Multi-brain update session from brains/ CWD. Opens with pasted Ansible provisioning output. 50 user prompts (highest in batch) with short-prompt ratio 0.86, indicating rapid-fire conversational updates. Topics: Ansible provisioning results → machine inventory updates → agentic-os brain (voice cleanup software research) → SSH alias creation → model catalog (KittenTTS) → machine-to-machine-control doc update. Edits target brain files across agentic-os and ansible brain directories. 653 min wall-clock, 156 active, 2 idle gaps.

**Observations**:

1. Not BUILD — CWD is brains/, edits target brain files. KNOWLEDGE with brain_file_writes = true. Multiple brains updated: ansible (provisioning results, machine inventory), agentic-os (voice cleanup software, model catalog).
2. Extremely conversational: 50 prompts in 92 events = 54% prompt ratio. Most prompts are 1-2 sentences. This is a "brain maintenance" session where David is dumping knowledge fragments as he encounters them.
3. Multi-topic: at least 5 distinct topics (Ansible provisioning, machine inventory, voice AI software, SSH aliases, TTS models). Each topic gets 3-10 prompts. No single thread dominates.
4. The form_filling detection triggered (short_prompt_ratio: 0.86) but this is not form-filling — it is rapid conversational knowledge capture with frequent topic switches.
5. CWD=brains/ is incidental — the first prompt is about Ansible provisioning, not any specific brain. The brains/ directory is just the "home terminal" for brain work.
6. "Kitten ML/Kitten TTS" — David captures a model he just heard about in real-time. This is ambient knowledge capture during daily browsing, exactly what AngelEye's ambient intelligence concept describes.

---

## Cross-Session Observations

### BUILD accuracy for this batch: 3/8 (37.5%)

- S01 (app.ss): BUILD → PLANNING. Planning docs, not product code.
- S02 (app.ss): BUILD → PLANNING. Schema design docs, not product code.
- S03 (flihub): BUILD → BUILD. Correct — product repo, feature code, commit.
- S04 (appydave-plugins): BUILD → SKILL. Skill files, not product code.
- S05 (app.ss): BUILD → BUILD. Correct — story implementation, product code.
- S06 (prompt.ss): BUILD → OPERATIONS. Workflow maintenance, not new features.
- S07 (prompt.ss): BUILD → MIXED. Planning + build + config fix.
- S08 (brains): BUILD → KNOWLEDGE. Brain file updates.

### app.supportsignal sessions (3): BUILD accuracy 1/3 (33%)

The app.supportsignal CWD is a real product repo, but sessions there are frequently PLANNING (v2 design, schema design) not BUILD. Only S05 with actual story development was genuine BUILD. The classifier needs to distinguish planning-in-product-repo from building-in-product-repo.

### prompt.supportsignal sessions (2): BUILD accuracy 0/2 (0%)

Both were non-BUILD. S06 is OPERATIONS (workflow maintenance), S07 is MIXED (planning + build + config fix). Wave 5 finding confirmed: prompt.supportsignal CWD is universally unreliable for project attribution.

### New subtypes proposed

- `planning.decision_making` — Working through architectural decisions with explicit option selection and writeback
- `planning.schema_design` — Schema/data model design discussion producing requirements docs
- `skill.creation_batch` — Multiple skills created in one session
- `build.story_implementation` — Story-driven development with BMAD agents
- `operations.workflow_maintenance` — Renaming, fixing, cleaning existing workflow configuration
- `knowledge.brain_update_multi` — Rapid-fire updates across multiple brain directories

### Patterns

1. **Decision protocol** (S01): Claude presents options → David picks via voice ("option A") → Claude writes decision to document → commit. Repeatable, detectable pattern.
2. **"Execute" phase gate** (S03): David reviews plan, says single word "Execute" to trigger implementation. Same pattern as POEM executor but within BUILD.
3. **Batch skill creation** (S04): 3+ skills built sequentially in one session. Each follows read→write→verify pattern.
4. **Explicit session close ceremony** (S06): "Is there anything outstanding?" → Claude provides completion summary. Detectable from stop event last_message.
5. **Ambient knowledge capture** (S08): David dumps knowledge fragments as he encounters them during the day. Short prompts, high topic switching, all targeting brain files.
