---
name: HOST leaks from the tool environment as the machine hostname
description: HOST arrives in Claude's Bash environment as mac-mini-m4.local; an unset HOST in .env lets it bind the wrong interface silently — now pinned
type: feedback
---

`HOST` arrives in Claude's Bash tool environment set to **`mac-mini-m4.local`**. It is not in David's shell profiles. Since `server/src/config/env.ts` defaults `HOST` to `127.0.0.1` only when the variable is _absent_, an unset `HOST` in `.env` lets the leaked value through and the server binds the hostname instead of loopback — with no error. The process starts, logs look normal, and only connections fail.

**Fixed 2026-08-01** — `HOST=127.0.0.1` is pinned in `.env`, and `.env.example` now _sets_ it rather than commenting it out, so Roamy and fresh clones inherit the fix. `env.ts` loads `.env` with `override: true`, so the explicit value beats the leaked one. Verified by launching with `HOST=mac-mini-m4.local` present in the shell and confirming the bind was still `127.0.0.1`. The `env -u HOST` workaround is no longer needed.

**Why it mattered:** every AngelEye launch this session needed `env -u HOST -u PORT -u NODE_ENV overmind start -D` before the pin existed. Same family as [[feedback_port_pollution]] but the opposite direction — that one leaks _out_ of Claude's commands into the terminal, this one leaks _in_ from the tool environment.

**How to apply:**

- `overmind start -D` from the repo root is now sufficient.
- If AngelEye ever binds oddly again, check `.env` still has an explicit `HOST` — an unset value is what re-opens the hole.
- Verify the bind rather than assuming: `lsof -nP -i :5051 | grep LISTEN` shows the real interface.
- `HOST=0.0.0.0` is correct _only_ to reach the app from another machine over Tailscale — and change nothing else alongside it. See [[feedback_confirm_machine_and_url]].
- Don't run `npm run build` while the dev servers are up; it knocked Overmind over repeatedly on 2026-08-01.
