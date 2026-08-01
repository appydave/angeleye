---
name: Settle priority when a request mixes audit with make-it-work
description: A survey wants breadth, a fix wants depth on one path — name which David needs before starting, and never call an API intact on a 200 alone
type: feedback
---

"Audit this" (breadth across many surfaces) and "I need this working" (depth on one path) are opposite shapes of work. When a request contains both, name the priority **before** starting rather than doing the survey and discovering the deadline later.

**Why:** 2026-08-01. David opened with a cursory pass over packages, APIs, MCP and hooks — a survey. Fifteen minutes later he needed to read the day's conversations. That time went on discovering the corpus was hollow instead of getting him a working read path. His retro: naming the priority first ("read today's conversations in 15 minutes; audit second") would have inverted the session order and produced `scripts/day-dump.ts` in the first ten minutes instead of the fortieth.

**How to apply:**

- If a request reads as a survey but mentions using the thing today, ask which comes first. One sentence, up front.
- **Never report an API as "intact" on an HTTP 200.** AngelEye's `/api/search` returned 200 and zero results for every query, because the index held only a 200-char prompt stub and `notes` was empty corpus-wide. "The endpoint responds" and "the endpoint can answer the question" are different claims; only the second is what he means by working.
- When a data-backed capability is the goal, probe the data's health early — row counts and field population, not just status codes.
- Related: [[project_angeleye_corpus_state]]
