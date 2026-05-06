# AngelEye Self-Learning System

**Status:** in-progress (Layer 1 manual, Layer 2 skill written, Layers 3-4 future)
**Started:** 2026-05-07
**Inspired by:** Anthropic's Dreaming feature (May 2026), Anthropic's multi-agent research system (Opus orchestrator + Sonnet workers, +90.2% gain), Warp's self-improving agents.

## What this is

AngelEye classifies Claude Code sessions. Today the classification is done by a manual loop (`/angeleye-enrichment-loop`) — a human invokes it, the loop classifies, the human reviews the report. This document describes the four-layer architecture for making that loop self-improving over time without sacrificing human oversight at the boundaries that matter.

## The four layers

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: Human feedback loop                                │
│  UI corrections → ground-truth.jsonl → few-shot updates      │
└─────────────────────────────────────────────────────────────┘
                            ↑
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Multi-model routing                                │
│  Sonnet 4.6 first → Opus 4.7 only on low-confidence cases    │
└─────────────────────────────────────────────────────────────┘
                            ↑
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Dreaming (weekly reflection)                       │
│  Reads enrichments + observations → proposes improvements    │
│  → writes/updates requirement docs                           │
└─────────────────────────────────────────────────────────────┘
                            ↑
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Routine (nightly enrichment)                       │
│  Cron-scheduled enrichment loop → Sonnet → eligible queue    │
└─────────────────────────────────────────────────────────────┘
```

## Layer 1 — Routine (nightly enrichment)

**Goal:** burn through the eligible session queue without human intervention.

**Implementation:** the existing `/angeleye-enrichment-loop` skill, scheduled to run nightly. Two scheduling options:

1. **Local cron** — write a small shell script that invokes Claude Code with the enrichment loop prompt, schedule via `launchd` or system cron. Cheap, simple, only runs when machine is on.
2. **Claude Code routine** (cloud-side) — saved configuration that fires on a cron schedule via Anthropic's infrastructure. Survives sleep/closed laptops. Currently in research preview as of April 2026.

**Model:** Claude Sonnet 4.6 (cheap, fast, good enough for routine classification).

**Status:** not yet automated. Run manually for now.

## Layer 2 — Dreaming (weekly reflection)

**Goal:** notice patterns the live loop missed. Find inconsistencies, propose taxonomy improvements, surface drift.

**Implementation:** new skill at `.claude/skills/angeleye-dreaming/`. Reads:

- `~/.claude/angeleye/enrichments.jsonl` — every classification ever made
- `docs/intelligence/observations.jsonl` — interesting patterns logged during loops
- `docs/requirements/*.md` — open code-change proposals

Looks for:

- Heuristic-vs-LLM disagreements (3+ for same heuristic = broken heuristic)
- Heuristic values not in taxonomy (taxonomy gap)
- Tool patterns repeating across sessions (predicate opportunity)
- Project-level shifts (new projects, scale changes)
- Notes contradicting each other within a subtype (subtype too broad)
- Confidence drift over time (subtype quality regression)
- Observations repeated 3+ times (auto-promote to requirement doc)

**Model:** Claude Opus 4.7 (better cross-pattern reasoning). Sonnet acceptable for routine weekly passes.

**Status:** skill written, not yet scheduled. Invoke manually as `/angeleye-dreaming` to test before automating.

## Layer 3 — Multi-model routing

**Goal:** match model capability to task difficulty. Save cost, improve quality on hard cases.

**Implementation:** a wrapper around the enrichment loop:

- Sonnet 4.6 takes the first pass
- If Sonnet's confidence ≤ 0.55 (it's hedging on a fallback like `build.feature`), the same session is queued for an Opus 4.7 second-pass
- Opus refines, often picking a more specific tag

This mirrors Anthropic's internal pattern (Opus orchestrator + Sonnet workers gave +90.2% on research evals). For classification it's simpler: parallel passes, not orchestration, but the principle is the same — keep cheap models on the easy 90% and reserve expensive models for the hard 10%.

**Status:** not yet built. Requires changes to the enrichment loop skill or a wrapper around it.

## Layer 4 — Human feedback loop

**Goal:** capture David's classification corrections so the system improves from real signal, not just inferred patterns.

**Implementation:**

- Add a "✓ correct" / "✗ wrong (with reason)" control in the AngelEye UI on each classification
- Corrections write to `~/.claude/angeleye/ground-truth.jsonl`
- The dreaming pass uses ground-truth entries as few-shot examples for the next routine
- Quality compounds across weeks: every correction makes the next pass better

**Status:** not yet built. Requires UI work + a small server-side endpoint.

## How the layers reinforce each other

- Layer 1 generates work product (enrichments)
- Layer 2 reflects on Layer 1's work product (dreaming)
- Layer 3 makes Layer 1 smarter on hard cases (better quality enrichments → better dreaming inputs)
- Layer 4 grounds the whole stack in real human judgment (corrections → few-shot examples in Layer 1 → richer signal in Layer 2)

The compounding effect: each loop gets more accurate without manual prompt tuning.

## Build order (recommended)

1. **First:** verify dreaming works manually — invoke `/angeleye-dreaming 7` once we have a week of enrichments to reflect on, see what it finds
2. **Then:** automate Layer 1 (nightly enrichment routine) so dreaming has fresh data each week
3. **Then:** schedule Layer 2 as a weekly routine
4. **Later:** Layer 3 (multi-model routing) — not urgent until Sonnet quality plateaus
5. **Later:** Layer 4 (UI feedback) — high-value but bigger build

## Related artifacts

| Artifact                                         | Purpose                                    |
| ------------------------------------------------ | ------------------------------------------ |
| `.claude/skills/angeleye-enrichment-loop/`       | Layer 1 — the live classification loop     |
| `.claude/skills/angeleye-dreaming/`              | Layer 2 — the reflection skill             |
| `docs/intelligence/observations.jsonl`           | Memory between dreaming passes             |
| `docs/requirements/*.md`                         | Output of dreaming — proposed code changes |
| `~/.claude/angeleye/enrichments.jsonl`           | Source data for dreaming                   |
| `~/.claude/angeleye/ground-truth.jsonl` (future) | Layer 4 — human corrections                |

## Reference reading

- Anthropic — [Dreaming feature announcement](https://www.roic.ai/news/anthropic-unveils-dreaming-feature-to-help-ai-agents-self-improve-05-06-2026)
- Anthropic — [Multi-agent research system (Opus + Sonnet, +90.2%)](https://www.anthropic.com/engineering/multi-agent-research-system)
- Anthropic — [Building Effective AI Agents](https://www.anthropic.com/research/building-effective-agents)
- Anthropic — [Warp's self-improving agents on Claude](https://www.anthropic.com/webinars/how-warp-builds-self-improving-agents-on-claude)
- Claude Code Docs — [Routines (cron-based scheduled agents)](https://www.aimagicx.com/blog/claude-code-routines-scheduled-automation-2026)
- [Advisor Strategy: Opus + Sonnet/Haiku](https://www.mindstudio.ai/blog/claude-code-advisor-strategy-opus-sonnet-haiku)
