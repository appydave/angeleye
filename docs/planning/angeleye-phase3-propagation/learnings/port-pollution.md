## Learning: Bash tool dev server starts pollute Overmind/tmux PORT env

- **hard_won**: true
- **impact**: critical
- **campaign_origin**: angeleye-phase3-propagation
- **saved_time**: 30+ minutes debugging per incident
- **detail**: Running `npm run dev -w server`, `nodemon`, or `npx tsx` from Claude's Bash tool leaks PORT environment variables into the Overmind tmux session. The server then binds to the wrong port (e.g. 5151 instead of 5051). The user sees ECONNREFUSED errors. The fix is `override: true` in dotenv.config() as a safety net, and never starting dev servers from the Bash tool. To diagnose: use `lsof` only, or tell the user to open a new terminal.
