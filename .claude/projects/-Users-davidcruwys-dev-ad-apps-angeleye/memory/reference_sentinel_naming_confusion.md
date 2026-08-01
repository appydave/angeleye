---
name: appyradar-sentinel vs appysentinel vs angeleye — which has MCP
description: Three similarly-named projects differ exactly in MCP status; the likely source of tickets assuming AngelEye already had an MCP server
type: reference
---

Three neighbouring projects get conflated, and the difference is precisely "does it have an MCP server":

| Project              | Path                               | MCP status                                                                                                                                                    |
| -------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `appyradar-sentinel` | `~/dev/ad/apps/appyradar-sentinel` | **Registered, working** MCP server (`mcp__appyradar-sentinel__*`)                                                                                             |
| `appysentinel`       | `~/dev/ad/apps/appysentinel`       | Boilerplate scaffold. MCP is **commented-out example code** in `packages/template/src/access/bindings/index.ts` — a documented pattern, not an implementation |
| `angeleye`           | `~/dev/ad/apps/angeleye`           | Had **none** until 2026-08-01, when one was built and registered as `angeleye` at user scope                                                                  |

Also note `appysentinal` → `appysentinel` (spelling fix, 2026-06-11): sessions recorded before the rename stay tagged `appysentinal` in the registry, so historical retrieval must search both spellings.

**Why:** 2026-08-01 an orchestrator task arrived asking to "add a create tool to AngelEye's MCP server, closing the MCP↔REST parity gap." No MCP server existed — no SDK dependency, no `McpServer` symbols in source, no registration in `~/.claude.json`. The parity gap was 100%, not one operation. The task's own instructions said to stop rather than scaffold, so nothing was built from it. The two neighbours above are the plausible source of the assumption. David asked for this to be pinned so the ticket isn't re-cut.

**How to apply:**

- Before accepting any "add tool X to project Y's MCP server" ticket, verify the server exists: grep the manifest for `@modelcontextprotocol/sdk`, grep source for `McpServer`, and check `~/.claude.json`.
- AngelEye's MCP server now exists (6 read-only tools: `find_events`, `events_summary`, `list_sessions`, `get_session_events`, `get_day_conversations`, `angeleye_status`) — but it postdates any ticket written before 2026-08-01, so re-read such tickets against current reality rather than assuming they were valid when filed.
