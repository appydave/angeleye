---
type: analysis
title: 'Findings W13-05'
description: 'Wave 13 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W13-05

**Wave**: W13-05 (final wave)
**Machine**: m4-mini
**Agent**: W13-05
**Sessions analysed**: 15
**Date**: 2026-03-23

## Batch Profile

All 15 sessions are micro-scale (3-5 events each). 13/15 have brains/ CWD, 1 has prompt.supportsignal CWD, 1 has angeleye CWD. All are from the bottom of the barrel — the smallest, shortest sessions remaining.

## BUILD Accuracy

**0/9 BUILD classifications correct (0%).**

All 9 BUILD-classified sessions are wrong:

- f0b54d9e: Smoke test (META)
- 0260f9cf: SSH check (SYSOPS)
- 0e87940f: Artifact retrieval (ORIENTATION)
- 9c4322ca: Conceptual question (RESEARCH)
- ea80c676: Transcript existence check (ORIENTATION)
- fb07e4d1: Upstream repo knowledge check (RESEARCH)
- 5197c939: ZSH secrets lookup (SYSOPS)
- 4c4de710: Brain inventory question (ORIENTATION)
- cb7b8ffa: /who-am-i skill (ORIENTATION)

BUILD accuracy at micro scale is conclusively 0%. Consistent with waves 9-12.

## Session Type Distribution (reclassified)

| Type        | Count | Sessions                                         |
| ----------- | :---: | ------------------------------------------------ |
| ORIENTATION |   5   | 0e87940f, da55d006, ea80c676, 4c4de710, cb7b8ffa |
| RESEARCH    |   4   | f7c7e6a9, ce4c21a6, 35a7760b, 9c4322ca           |
| META        |   3   | f0b54d9e, 2d110202, f9cb2a69                     |
| SYSOPS      |   2   | 0260f9cf, 5197c939                               |
| KNOWLEDGE   |   1   | fb07e4d1                                         |

## Key Observations

### 1. Numbered-item sessions form a coherent pattern

Sessions 0e87940f (item "2.") and ea80c676 (item "5.") have prompts starting with numbered list items. These are fragments from a single mental checklist the user is working through across multiple sessions. Each item gets its own session — fire, get answer, next session. This is a "checklist spray" pattern: one mental list, N micro sessions.

Both numbered items reference Cole Medin content — likely a single morning checklist about reviewing Cole Medin workshop material.

### 2. brains/ CWD splits reliably vs incidentally at micro scale

Of 13 brains/ CWD sessions:

- **6 incidental**: smoke test, SSH check, voice accident, advisory about client, Kintsugi research, "exity"
- **7 reliable**: actually searching/reading brain content (Cole Medin workshops, plugin info, transcript check, brain inventory, /who-am-i, upstream repos, bridge question)

The discriminator at micro scale is whether the prompt topic matches brain content. If the question is "do we have X in brains?" — CWD is reliable. If the question is about SSH/secrets/external tools — CWD is incidental. This is more nuanced than the blanket "brains/ CWD + light scale = never BUILD" rule.

### 3. Voice artifact catalog additions

- "ZS HRC" = ".zshrc" (session 5197c939)
- "exity" = "exit" (session 2d110202)
- "mechinsm" / "alterntaves" / "futuer" = mechanism / alternatives / future (session 35a7760b)

### 4. Cross-session references in micro sessions

3/15 sessions (20%) reference prior sessions:

- 9c4322ca: Pasted abridge output from another session
- fb07e4d1: Pasted "not found" table from repo audit
- 5197c939: "We recently did" — referencing prior ZSH improvement session

Even micro sessions participate in session chains. The "we recently did X but I forgot where" pattern (5197c939) is a knowledge-loss signal — important enough to open a new session for, but the prior session didn't leave durable breadcrumbs.

### 5. /who-am-i as orientation.identity_check

Session cb7b8ffa shows a single-skill pattern: /who-am-i reads operations.md. This is a distinct subtype from artifact_retrieval — the user isn't looking for specific content, they're establishing Claude's identity context before (presumably) doing real work in a subsequent session.

### 6. Disposition summary

- **Junk**: 3 sessions (f0b54d9e smoke test, 2d110202 "exity" accidental, f9cb2a69 truncated fragment)
- **Active**: 12 sessions (genuine micro interactions)

## New Subtypes Proposed

| Subtype                     | Session  | Evidence                                                 |
| --------------------------- | -------- | -------------------------------------------------------- |
| orientation.inventory_check | 4c4de710 | "What brains do I have? List and group them"             |
| orientation.identity_check  | cb7b8ffa | /who-am-i skill invocation                               |
| sysops.connectivity_check   | 0260f9cf | SSH access question between machines                     |
| research.product_evaluation | 35a7760b | Kintsugi tool research with specific evaluation criteria |
| research.advisory           | ce4c21a6 | Best practices question about client file sharing        |

## Friction Predicates (P13-P16)

No friction predicates fired. All sessions are too short for meaningful friction to develop. This confirms P16 (excessive_changes) is a moderate+ scale phenomenon, and P13-P15 are rare at micro scale.

## Summary Statistics

- Sessions: 15
- Junk: 3 (20%)
- BUILD misclassified: 9/9 (100%)
- CWD incidental: 7/15 (47%)
- Cross-session refs: 3/15 (20%)
- Voice artifacts: 3/15 (20%)
- New subtypes: 5
- Discovery rate: 0.33/session (declining as expected for micro-only batch)
