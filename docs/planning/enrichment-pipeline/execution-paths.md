# Enrichment Pipeline — Execution Paths

**Purpose**: Three ways to run session analysis at scale — Ralphy (Claude Code), Codex (OpenAI), and Claude Code SDK. Each path can process new sessions or reprocess existing ones.

**Created**: 2026-03-25

---

## What All Three Paths Do

Same job, different engines:

1. Read a session's JSONL transcript (or the registry entry + events)
2. Extract the signals needed for each predicate/classifier
3. For Tier 3 (LLM-required): send a structured prompt and parse the response
4. Write results back to the session index / registry

---

## Path 1: Ralphy (Claude Code)

**What it is**: `/ralphy` skill launches autonomous batch loops inside Claude Code. This is what ran the 924-session campaign.

**Cost**: Uses your Max subscription context window. Heavy usage contributed to hitting weekly limits.

**Best for**: Discovery work — finding new predicates, expanding the schema, handling sessions that need deep interpretation.

### How It Ran Before (the painful way)

1. Manually pick session IDs (or use `campaign-status.py` from wave 10 onward)
2. Write agent prompts with the schema and batch assignments
3. Launch Ralphy with wave definitions in the implementation plan
4. Monitor, fix failures, merge learnings back into the schema
5. Run migration scripts when schema changes

**Script that helps**:

```
~/dev/ad/apps/angeleye/docs/planning/angeleye-analysis-1/scripts/campaign-status.py
```

This joins registry + session-index to show what's done, pending, and next.

### How to Make It Easier

**Option A — A dedicated skill** (e.g., `/angeleye-enrich`):

```
User says: /angeleye-enrich --batch 20 --tier 3
```

The skill would:

1. Call `campaign-status.py --next-batch 20` to get unprocessed session IDs
2. Load the v3 schema from PATTERNS.md as the analysis template
3. For each session: read events, build the LLM prompt, extract predicates/classifiers
4. Write results to session-index.jsonl (or a staging file for review)
5. Report summary: "20 sessions enriched, 3 new subtypes discovered, 0 errors"

**Option B — An HTML guide page in the app**:

A page at `/enrichment` in the AngelEye UI that:

- Shows pipeline status (how many sessions at each tier, how many unprocessed)
- Has a "Generate Ralphy Batch" button that produces the wave definition
- Links to the skill or provides copy-paste commands
- Tracks enrichment history

### Steps to Build

1. Create `/angeleye-enrich` skill at `~/.claude/skills/angeleye-enrich/SKILL.md`
2. Skill reads the v3 schema from PATTERNS.md
3. Skill uses `campaign-status.py` for batch selection (or replicates its logic)
4. Skill loops through sessions, applying Tier 1+2 deterministically, then prompting for Tier 3
5. Results append to session-index.jsonl

---

## Path 2: Codex (OpenAI)

**What it is**: OpenAI's Codex environment. You've used it before via a Claude skill (the consultant pattern). It's a separate compute/token budget — doesn't eat your Anthropic Max quota.

**Cost**: OpenAI API tokens. Cheaper than burning Claude Code context on batch processing.

**Best for**: Bulk reprocessing of known patterns. You already know the 25 predicates — just need an LLM to apply them. Offloads work from your Max subscription.

### How It Would Work

The consultant skill pattern (`consultants:architect`, etc.) already shows how:

1. **Prepare context**: Extract session events + first N prompts into a compact payload
2. **Send to Codex**: Structured prompt with the v3 schema, asking for each Tier 3 predicate/classifier
3. **Parse response**: Codex returns JSON with predicate results
4. **Write back**: Append to session-index.jsonl

### What You'd Build

A skill or script that:

```python
for session_id in unprocessed_sessions:
    events = load_session_events(session_id)
    context = extract_analysis_context(events)  # first 5 prompts, tool sequence, shape

    prompt = f"""
    Given this Claude Code session context, evaluate these predicates:
    {TIER_3_PREDICATES}

    Session context:
    {context}

    Return JSON with predicate results.
    """

    result = codex_call(prompt)
    write_to_session_index(session_id, result)
```

### Considerations

- Codex may not have the same depth of understanding as Claude for interpreting Claude Code sessions
- You'd want to validate a sample batch (10-20 sessions) against the campaign's human-verified results before trusting it at scale
- The consultant skill pattern (`consultants:delegation-router`) already handles the "send context to external LLM" flow

---

## Path 3: Claude Code SDK (Anthropic)

**What it is**: The `claude_agent_sdk` (Python) or `@anthropic-ai/sdk` (TypeScript). Runs Claude programmatically. You can pass your Max subscription auth token, so it uses your existing plan — no separate API bill.

**Cost**: Uses your Max subscription, but more efficiently than interactive Claude Code sessions — no tool overhead, no system prompt bloat, no context window waste on conversation history.

**Best for**: Production pipeline. Most token-efficient way to use Claude for Tier 3 analysis. Runs headless — no terminal session needed.

### How It Would Work

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic(); // uses ANTHROPIC_API_KEY or Max auth

for (const sessionId of unprocessedSessions) {
  const events = await loadSessionEvents(sessionId);
  const context = extractAnalysisContext(events);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6', // cheaper than Opus for known patterns
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: buildAnalysisPrompt(context, TIER_3_SCHEMA),
      },
    ],
  });

  const predicates = parsePredicateResponse(response);
  await writeToSessionIndex(sessionId, predicates);
}
```

### Key Advantage: Max Auth Token

You can authenticate the SDK with your Max subscription credentials:

```bash
export ANTHROPIC_AUTH_TOKEN=$(claude auth token)
```

This means API calls against your Max plan — no separate billing. More efficient than running full Claude Code sessions because:

- No system prompt overhead (~4K tokens saved per call)
- No tool definitions loaded (~2K tokens saved)
- No conversation history accumulation
- Can use Sonnet 4.6 for known-pattern analysis (faster, cheaper on quota)
- Can batch 5-10 sessions per API call if context allows

### What You'd Build

A service in the AngelEye server (or a standalone script) that:

1. Reads unprocessed sessions from registry
2. Applies Tier 1+2 deterministically (no API call)
3. For Tier 3: batches sessions, sends to Claude API, parses structured JSON response
4. Writes back to session-index.jsonl and/or registry
5. Exposes a `/api/enrich` endpoint or CLI command

---

## Comparison

| Dimension             | Ralphy (Claude Code)                         | Codex (OpenAI)                          | Claude Code SDK                       |
| --------------------- | -------------------------------------------- | --------------------------------------- | ------------------------------------- |
| **Token budget**      | Max subscription (shared with all your work) | OpenAI tokens (separate budget)         | Max subscription (but more efficient) |
| **Cost to David**     | Context window burn                          | API cost ($)                            | Efficient Max usage                   |
| **Discovery ability** | Excellent — can find new patterns            | Moderate — follows instructions         | Good — structured prompts             |
| **Schema expansion**  | Best — interactive, can iterate              | Weak — batch only                       | Moderate — can iterate in code        |
| **Setup effort**      | Skill creation (~1 session)                  | Skill + Codex integration (~2 sessions) | New service in AngelEye (~2 sessions) |
| **Execution model**   | Interactive terminal                         | API call loop                           | API call loop or server endpoint      |
| **Batch size**        | 5-20 sessions per wave                       | Unlimited                               | Unlimited                             |
| **Human oversight**   | During execution                             | Before/after only                       | Before/after only                     |
| **Best for**          | Finding new predicates (v4 schema)           | Cheap bulk reprocessing                 | Production pipeline                   |

---

## Recommended Approach

### Phase 1 — Immediate (no LLM, no cost)

Extend `classifier.service.ts` with Tier 1+2 predicates. Every session gets 23 new data points on next sync. This is pure code — maybe one session of work.

**File to modify**: `/Users/davidcruwys/dev/ad/apps/angeleye/server/src/services/classifier.service.ts`

### Phase 2 — Ralphy Skill (your Max subscription)

Build `/angeleye-enrich` skill for interactive enrichment. Good for:

- Processing the ~418 sessions that never got wave-analysed
- Discovery passes to find v4 predicates
- Quality-checking Tier 2 heuristics against LLM judgment

### Phase 3 — SDK Pipeline (your Max subscription, efficient)

Build the Claude Code SDK service inside AngelEye for automated Tier 3 enrichment. Runs headless, uses Sonnet for known patterns, Opus for discovery. This becomes the production path.

### Phase 4 — Codex Fallback (if Max limits are a problem)

If weekly usage limits remain an issue, add Codex as an alternative engine for bulk Tier 3 processing. Uses the consultant skill pattern you already have.

---

## Reprocessing vs New Sessions

Same pipeline handles both:

```
New session arrives (hook/sync)
    → Tier 1+2 applied automatically (classifier.service.ts)
    → Tier 3 queued for next enrichment run

Reprocessing existing sessions
    → Same pipeline, pointed at sessions missing Tier 3 data
    → campaign-status.py identifies what's pending
    → Ralphy/SDK/Codex processes the batch
```

The key is that `campaign-status.py` (or its replacement) always knows what's done and what's pending by joining the registry with the session index.

**Script location**: `/Users/davidcruwys/dev/ad/apps/angeleye/docs/planning/angeleye-analysis-1/scripts/campaign-status.py`

---

**Related docs**:

- Data architecture: `/Users/davidcruwys/dev/ad/apps/angeleye/docs/planning/enrichment-pipeline/data-architecture.md`
- Predicate tiers: `/Users/davidcruwys/dev/ad/apps/angeleye/docs/planning/enrichment-pipeline/predicate-tier-reference.md`
- Mockup brief: `/Users/davidcruwys/dev/ad/apps/angeleye/docs/planning/enrichment-pipeline/mochaccino-brief.md`
