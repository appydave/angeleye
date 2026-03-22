# Findings: W4-13 — brains (9476dfb9)

## Classification

- **Registry**: KNOWLEDGE / read-heavy
- **Analysed type**: knowledge.personal_advisory
- **Confidence**: medium-high
- **Reasoning**: The session runs in `/Users/davidcruwys/dev/ad/brains` (cwd throughout) and opens with a genuine knowledge-retrieval intent — David asks where existing brain research on Philippines monitors is stored. The first phase (Grep ×6, Glob ×2, Bash ×2, Read ×3) is a search-and-locate pattern consistent with KNOWLEDGE retrieval. However, the session pivots sharply in the second phase: David pastes a live Lazada product URL and asks Claude to verify whether the store is official and scam-safe. Claude responds by invoking ToolSearch and then mcp**playwright**browser_navigate to browse the live product page. The third and fourth prompts are follow-up product questions (pivot capability, VESA mount rotation). This is not passive knowledge consumption — it is active web research and personal purchasing advisory. KNOWLEDGE is defensible for the opening phase, but the session as a whole is better described as a personal advisory consultation backed by live web research. The `read-heavy` tool_pattern label comes from the Grep/Read-dominant first phase; the Playwright call in the second phase is the session's most distinctive tool use and is underweighted by the label.

## Reclassification

- **From**: KNOWLEDGE / read-heavy
- **To**: KNOWLEDGE / knowledge.personal_advisory
- **Why**: The registry KNOWLEDGE classification is partially correct — the session begins in the brains project directory with a genuine search for prior research. But a session that browses a live e-commerce URL via Playwright and advises on scam risk is not KNOWLEDGE work in the sense of studying or ingesting documentation. It is closer to RESEARCH (external web lookup) or DECISION (answering a specific purchase question). The `knowledge.personal_advisory` subtype captures the hybrid: the Claude Code brains project is being used as a personal assistant context rather than a software development workspace. The session is not junk — it has real intent and produced real value for David — but it is a personal-life advisory session, not a brains project work session.

## Session Shape

- Events: 21 total (18 tool_use, 3 user_prompt)
- Tools used: Grep (6), Read (3), Glob (2), Bash (2), mcp**playwright**browser_navigate (1), ToolSearch (1)
- Duration: ~63 minutes total (07:20:35 to 08:23:18 UTC, 2026-03-10) — but most of that gap is between prompts 1 and 2 (about 62 minutes idle). Active engagement was brief.
- User prompts: 3 (monitor research query; Lazada URL + scam verification; pivot/VESA followups)
- Opening style: freeform knowledge request
- Context compactions: 0
- Closing ceremony: none — session ends after David's VESA question; no response event captured

### Prompt Timeline

| #   | Time (UTC)        | Prompt summary                                                                                                              | Gap                             |
| --- | ----------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 1   | 07:20:35          | "Where's our research on monitors in the Philippines for Jan and Mary? Lazada LG store."                                    | —                               |
| —   | 07:20:40–07:21:14 | [Grep ×6, Glob ×2, Bash ×2, Read ×3 — brain search phase]                                                                   | —                               |
| 2   | 07:22:46          | [Lazada URL paste] "Can you tell me whether this truly is an official LG store? Worried about scam."                        | ~62 min gap since session start |
| —   | 07:22:50–07:22:52 | [ToolSearch ×1, mcp__playwright__browser_navigate ×1]                                                                       | —                               |
| 3   | 07:25:00          | "Can you just tell me about that monitor I just sent you? Does it have a vertical display? Can it pivot?"                   | ~2 min                          |
| 4   | 07:25:47          | "Question about what you just said about the VESA wall mount. Will it rotate even though it doesn't have the rotation arm?" | ~47s                            |

## Observations

1. **No prior brain research found**: The extensive first-phase search (Grep ×6, Glob ×2, Bash ×2, Read ×3) located no dedicated monitor research file. The session's first real prompt assumed existing brain content existed ("Where's our research...") — but the search came up empty. This means the session's opening premise was not fulfilled; Claude pivoted to real-time research instead of retrieving stored knowledge. The KNOWLEDGE classification was triggered by the search intent, not by finding and reading knowledge.

2. **62-minute gap between session start and Lazada prompt**: The session started at 07:20:35 and David's second prompt arrived at 07:22:46 — only about 2 minutes later. But the `last_active` time is 08:23:18, suggesting the session stayed open for over an hour after the last captured event. The session was likely idle/waiting while David looked up the Lazada link. The wall-clock duration is misleading; actual active engagement spans about 5 minutes across the three prompts.

3. **Playwright used for scam verification**: The use of `mcp__playwright__browser_navigate` to visit a live Lazada product URL is the most distinctive tool use in this session. This is not a development or documentation task — Claude is browsing an e-commerce site to verify store legitimacy. This is an unusual tool use pattern for a brains session and is a strong signal that the session has left the scope of software/knowledge work entirely.

4. **Personal context — Jan and Mary in Philippines**: The session is explicitly about purchasing a monitor for family members (Jan and Mary) living in the Philippines. The brains project is being used as the context for a personal family advisory conversation, not for work on the brains knowledge base. This is a recurring pattern in personal-use sessions launched from the brains cwd.

5. **VESA and pivot questions are product research, not knowledge work**: The third and fourth prompts are standard consumer product questions — does the monitor tilt/rotate, what does VESA compatibility mean for rotation without a dedicated arm. These are advisory responses drawing on Claude's general knowledge, not on any brain file content.

6. **No writes, no edits, no brain file updates**: Despite the session running in the brains project, no brain file was created or edited. The research conducted in this session (Lazada LG store legitimacy, monitor specifications) was not persisted into the brain. This is a missed documentation opportunity — a `brains/davidcruwys/personal/philippines-monitor-research.md` file would capture the findings for future reference.

7. **First real prompt reveals false-positive KNOWLEDGE signal**: The classifier rule `IF project_dir contains brains AND tool_pattern is read-heavy → KNOWLEDGE` fires correctly on the tool pattern but misses the subject matter. The Grep calls search for "Philippines", "monitors", "Lazada", "LG" — topics that are outside the brains knowledge base's primary scope (software, AI, brand, content strategy). A subject-matter filter on the first real prompt could catch this: personal/family purchase queries should not classify as KNOWLEDGE work.

## Patterns Found

- **Personal advisory session in brains cwd**: David uses the brains project as his default Claude context, including for personal family questions unrelated to the brains knowledge base. This creates false KNOWLEDGE classifications. The session's intent (buy a safe monitor for family in Philippines) is entirely personal; the project_dir signal is noise.
- **Search-then-pivot pattern**: The session starts with a knowledge retrieval intent (search existing brain files) and pivots to live web research when the search finds nothing. The tool pattern (Grep/Glob/Bash/Read followed by Playwright) captures this two-phase structure, but the registry only records the aggregate `read-heavy` label, losing the pivot signal.
- **No documentation of findings**: The session produced real research value (Lazada store verification, monitor specs) but created no brain file to preserve it. Personal research sessions in the brains project tend to be ephemeral — the insight lives in the conversation but is never written back to the knowledge base.
- **Playwright as live research tool**: mcp**playwright**browser_navigate appearing in a session is a strong signal that the session crossed from internal knowledge work into external web research. It is a clean classification feature: sessions with Playwright calls should be tagged as having an external-research component regardless of project_dir.

## Brain Subfolder Identification

- **Expected brain location**: `brains/davidcruwys/personal/` — this is the natural home for personal family purchase research
- **Recommended file**: `brains/davidcruwys/personal/philippines-monitor-research.md`
- **Content that should be captured**: LG Philippines Lazada store legitimacy, product ID `4596983902`, pivot/VESA rotation details for the specific SKU `30288778583`, price at time of research (PHP 15,135)
- **Current state**: No file exists — the research is session-ephemeral

## New Types or Subtypes Proposed

- **knowledge.personal_advisory**: Sessions where the brains project directory provides context for personal (non-work) advisory conversations. The session involves knowledge-retrieval intent but the subject matter is personal life (family purchases, personal decisions) rather than software or brand work. Key signals: first prompt references named individuals (Jan, Mary), subject is a consumer product or personal decision, no brain files are written after the session.

## Subtype Candidates Confirmed

- **knowledge.personal_advisory**: Confirmed for this session. The two-phase structure (brain search → live web research) and personal subject matter (family monitor purchase, Philippines) are the diagnostic signals. The lack of any brain file write-back confirms the session produced no knowledge artifact — only conversational advice.

## Classifier Learning

- **Playwright call = external research flag**: Any session containing `mcp__playwright__browser_navigate` should receive an `external_research` tag regardless of other signals. Playwright is never used for internal codebase work; its presence always indicates live web consultation.
- **First real prompt subject-matter check**: The first prompt "Where's our research on monitors in the Philippines for Jan and Mary?" contains personal names and a consumer purchase topic. A classifier that checks whether the first prompt references named individuals + consumer products should suppress the KNOWLEDGE classification or flag it as `personal_advisory`.
- **Empty search result = knowledge gap, not knowledge session**: The session's opening search found nothing. A session that searches the brain and finds nothing is not a KNOWLEDGE session — it is a discovery of a knowledge gap. The classifier should consider whether the search phase produced any reads of brain content files (not just searches). If the Read calls found nothing relevant, the KNOWLEDGE classification should be downgraded.

## Interest Level

medium — The session content itself is low-complexity (consumer product purchase advisory). The classification interest is higher: this is a clean example of a personal-advisory false positive in the KNOWLEDGE classifier. The Playwright signal, the empty brain search, the personal names in the first prompt, and the zero write-back are all useful classifier training signals. The brain subfolder identification (where this research should have been saved) adds a documentation gap finding.
