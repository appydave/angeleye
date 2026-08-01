---
name: Confirm which machine and URL before changing binds
description: When David says something isn't running but it answers locally, ask which machine and URL — never infer and change bind addresses or client env
type: feedback
---

When David reports a service is down and my own checks show it healthy, the discrepancy is a **question to ask, not a gap to infer across**. Ask which machine he's on and which URL is open. Never change a bind address (`HOST`) or client env (`VITE_*`) on the strength of a guess about where he's standing.

**Why:** 2026-08-01. AngelEye answered 200 on both ports from the M4 Mini; David said "AngelEye is not running." I inferred he'd moved to another machine, flipped `HOST` to `0.0.0.0`, and in the same edit emptied `VITE_SOCKET_URL` — which was hardcoded specifically to dodge Vite's WebSocket proxy upgrade bug. That killed the UI's live refresh, which then looked exactly like the hooks had died. They hadn't: 196 events were landing throughout. He was on the M4 Mini the whole time. Both changes were reverted. The entire detour came from not asking one question, and he named it the costliest of the session.

**How to apply:**

- Both claims true at once is normal — "running" is relative to the caller. Establish the caller first.
- Change **one** variable at a time when diagnosing. The second change hid behind the first here and cost far more than it saved.
- Read a config line's comment before editing it. `VITE_SOCKET_URL` carried a comment explaining exactly why it was set; `ws: true` in the Vite proxy made it _look_ redundant. It wasn't.
- "Ingestion is working" and "the UI is updating" are separate claims — verify them separately. Events piling up server-side while the page sits frozen reads as "hooks are dead".
- Related: [[feedback_host_env_leak]], [[feedback_port_pollution]]
