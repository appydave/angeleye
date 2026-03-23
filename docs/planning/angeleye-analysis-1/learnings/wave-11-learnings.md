# Wave 11 Learnings

**Date**: 2026-03-23
**Sessions analysed**: 80 (bringing total to 586/799 = 73.3%)
**Agents**: 9 parallel (W11-01 through W11-09)
**Duration**: ~8-10 minutes to complete all 9 agents
**Second wave using campaign-status.py** for batch selection

## Application Learnings

### BUILD accuracy drops sharply back to ~12% — confirmed scale dependency

- **Wave 11 BUILD accuracy: ~12% aggregate** (8-10/81). Sharp drop from wave 10's 43% — this batch was entirely light/micro/trivial sessions.
- Per-agent range: W11-03 and W11-06 at 0% (lowest), W11-09 at 25% (highest).
- The accuracy-by-scale curve is now conclusive: micro 0-5%, light 10-15%, moderate 30-45%, heavy 50-70%, marathon 60-70%.
- **Root cause confirmed across 11 waves**: the classifier fires BUILD for any session with tool calls, with no CWD guard — brains/ or prompt.supportsignal/ CWDs are almost never BUILD.

### Three classifier rules ready to ship

1. **`*run NNN` as first prompt = `operations.poem_execution`** — confirmed independently by 7 of 9 agents. Iron-clad rule, zero exceptions.
2. **brains/ CWD + light scale = never BUILD** — confirmed W11-03, W11-06, W11-07. Would fix ~80% of misclassifications in this wave.
3. **Prompt:tool ratio >0.5:1 = almost never BUILD** — proposed by W11-05. Conversational sessions are advisory, not build.

### POEM executor is the dominant operations pattern

- `*run NNN` opener + Task/TaskOutput parallel workers = OPERATIONS, not BUILD.
- Autonomy ratios: 1:20 (W11-04), 1:58 (W11-07, new record), 1:64 (W11-06).
- Zero Edit calls in all POEM executor sessions — observation, not modification.
- Confirmed by 7/9 agents independently.

### Playwright semantic roles now at 8-9

- **Role 8**: `product_onboarding` (W11-01) — user learns a third-party product with Claude navigating the UI. Zero test assertions.
- **Role 9**: `visual_comparison` (W11-09) — screenshots of slide decks from two systems for styling comparison.
- Full catalog: ui_audit, external_research, documentation_verification, web_scraping_for_knowledge, form_filling, design_extraction, feature_discovery_audit, product_onboarding, visual_comparison.

### CLAUDE.md auto-load anti-pattern worsening

- W11-07 session 41b69014: 13 unauthorized pre-prompt tool calls (brain reads and edits) — worst instance ever.
- Also confirmed in W11-01 (8efb371e: 38 tool calls including 11 Edits), W11-08 (c3b01cb4).
- Pattern is escalating. Needs a dedicated hook or mitigation.

### P13+P14 co-occurrence is the dominant friction pattern

- P13 (misunderstood_request): ~14 firings across wave. P14 (wrong_approach): ~12 firings.
- Always co-occur — if P13 fires, check for P14.
- W11-07 is the only batch with zero friction across all predicates (all-knowledge/operations sessions).
- P16 (excessive_changes): **zero firings** across all 81 sessions. Rarest predicate.

### "Context poisoning" explicitly named by user

- W11-08 (f3f48d9f): "if I save stuff into the memory without really thinking it through, we're just going to create context poisoning."
- Stale/aspirational documentation misleads Claude. Distinct from P13 (misunderstood request).

### Provenance chain genesis found

- W11-07 session ce158a14: user articulates "The canonical truth is not operations. Operations is a reflection of something else."
- This is the conceptual origin of the provenance methodology now used across all brains.

### Mochaccino gap analysis origin

- W11-07 session aedc4c79: all 5 existing mockups are session-list views; none show conversation content inside a session.
- Claude identifies 5 missing concepts (conversation view, subagent panel, compaction marker, session detail header, workspace view).
- Direct origin of v6-reader mockup.

### Form-filling copilot as distinct pattern

- W11-06 session 689892a5: Claude reads form screenshots field-by-field and advises in real time on TDAC form.
- Self-correcting brain: Claude discovered its own brain had wrong TDAC timing, searched Brave, corrected brain docs.

### New parent type: DEBUG.process_correction

- W11-08 (c3b01cb4): not debugging code — debugging Claude's own process.
- NotebookLM skill not loading caused Claude to fall back to default behaviour violating conventions.
- Distinct from code debugging — requires different detection rules.

### Hardware emergency session type

- W11-04 (8bf22f75): lost iTerm sessions → screen died → emergency SSH data transfer to M4 Mini.
- New subtype: `operations.emergency_recovery`.

### Three-session chains detected

- W11-04: 5fb45f56 (design) → 9d04778f (implement) → 5e18711f (execute `*run 105`).
- Connective tissue: 7,306-char structured handover paste — largest cross-session context transfer in the batch.

### Race condition in parallel agents

- W11-09 (e05f8858): 2 parallel agents edited WizardShell.jsx simultaneously; last writer won.
- Agent-introduced syntax bug: `\!` instead of `!` in LlmStep.jsx (3 places), causing esbuild failure.

### ~55 new subtypes proposed (~0.80/session)

Discovery rate rebounded from 0.75 (wave 10) to 0.80 — light sessions still productive. Notable new subtypes:

- `operations.poem_execution` — confirmed by 7/9 agents
- `knowledge.livestream_ingestion` — watch livestream → voice-dictate → Claude structures
- `knowledge.orchestration_design` — multi-session coordination documentation
- `debug.process_correction` — debugging Claude's process, not code
- `operations.emergency_recovery` — hardware failure data rescue
- `operations.personal_document_management` — file drops → brain folders; multimodal passport reading
- `sysops.hotkey_troubleshooting` — Hammerspoon/Karabiner debugging
- `planning.workflow_architecture` — designing workflow pipelines
- `planning.domain_design` — SME-driven domain modelling
- `research.product_onboarding_via_playwright` — learning third-party products
- `brand.presentation_creation` — slide deck content creation
- `build.content_production` — video/content production workflow
- `research.api_reverse_engineering` — reverse-engineering external APIs
- `setup.mcp_integration` — MCP server setup and configuration

### Voice dictation artifact catalog growing

80-90 new artifacts this wave — highest single-wave count:

- "Ralphie Wooy" / "Raffi" = "Ralphy"
- "Crisp" = "Krisp"
- "Hemispin" / "Hammerspin" = "Hammerspoon"
- "Talescale" = "Tailscale"
- "Gocling" = "Docling"
- "air spool playback" = "Ansible playbook"
- "Mapbook Pro" = "MacBook Pro"
- "succession rename" = "session rename"
- "22 books" = "22 hooks"
- "mockachine" = "Mochaccino"
- "Providence" = "provenance"

### PII detection incidents

- W11-03 (ef02ac0f): passport, CPAP medical, travel dates, booking IDs, credit card — highest density
- W11-05 (aebac8d2): Brave Search API key pasted directly in prompt
- W11-06 (689892a5): full name, DOB, passport, phone (AU + TH), address
- W11-09 (c15e692a): full name, DOB, passport, MRZ, address, phone, visa details

4 PII incidents across 81 sessions (4.9%). PII correlates with `davidcruwys/` or `dtv/` brain path access — actionable detection rule.

## Loop Meta-Learnings

### 9 parallel agents, zero conflicts (wave 11 of 11)

586 entries, 0 duplicates. Append-only pattern continues bulletproof.

### Light sessions produce similar discovery rates to moderate

- Discovery rate 0.80/session (up from 0.75 in wave 10). Not declining despite lighter sessions.
- Light sessions are individually less rich but more numerous — volume compensates.

### P16 (excessive_changes) may not fire in lighter sessions

- Zero instances across all 81 sessions. May only be relevant at moderate+ scale where Claude has room to over-generate.

### 52-hour idle gaps are valid continuations

- W11-08 session d22cbb1c: 3108 minutes between phases but context preserved and meaningful.
- Multi-phase detection should not split on idle duration alone.

### Total subtypes: ~360+ across 22+ parent types from 586 sessions
