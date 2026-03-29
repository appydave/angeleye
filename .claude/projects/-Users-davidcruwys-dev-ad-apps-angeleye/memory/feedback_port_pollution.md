---
name: Port pollution from diagnostic bash commands
description: Running npm dev commands from Claude's bash tool can leak PORT env vars into the user's terminal via Overmind/tmux, breaking the server on wrong port
type: feedback
---

NEVER run `npm run dev`, `nodemon`, or `npx tsx server/...` from the Bash tool to diagnose server issues. These commands can pollute the terminal's environment variables (especially PORT) through Overmind's tmux session sharing. The pollution persists for the entire terminal session and causes the server to bind to the wrong port.

**Why:** Happened during Phase 3 campaign (2026-03-29). Agents made rapid commits, Overmind's server died, Claude ran diagnostic server starts from Bash tool, PORT=5151 leaked into the tmux environment. User spent 20+ minutes debugging. Extremely frustrating — user explicitly asked "did you mess with my ports?" and was told no.

**How to apply:**

- To check if the server is running: `lsof -i :PORT | grep LISTEN` only
- To check server errors: read log files, don't start the server yourself
- If the server won't start: tell the user to try a new terminal first, then check `echo $PORT` in their shell
- The `override: true` fix in env.ts is now a permanent safety net
- NEVER start dev servers from Claude's Bash tool when Overmind is managing them
