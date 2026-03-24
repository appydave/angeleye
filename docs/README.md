# AngelEye Documentation

> A session intelligence layer for agentic AI workflows. Watches Claude Code sessions, classifies activity, surfaces patterns.

## Status

**Operational** — v2 schema, 924 sessions indexed across 2 machines (M4 Mini + M4 Pro).

Built on AppyStack (RVETS: React 19 + Vite 7 + Express 5 + TypeScript + Socket.io).

## AngelEye-Specific Docs

| Document                                                                   | What's in it                                                                |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [Requirements](requirements.md)                                            | Architecture, data sources, skills, UI design                               |
| [Intelligence Patterns](intelligence/PATTERNS.md)                          | Classification rules, taxonomy, predicates — validated against 924 sessions |
| [Backlog](planning/BACKLOG.md)                                             | 44 items (31 done, 11 pending, 2 deferred)                                  |
| [Campaign Assessment](planning/angeleye-analysis-1/assessment.md)          | Full 924-session analysis results                                           |
| [Campaign Dashboard](planning/angeleye-analysis-1/campaign-dashboard.html) | Interactive data visualization (Chart.js)                                   |

## What's Built

- **Observer** — live session list with focus panel, filters (All/Starred/Named), workspace badges, session type legend
- **Organizer** — inbox + named workspaces + drag-to-assign
- **Settings** — unified Sync button, delta tracking, classification breakdown
- **Backfill** — scans `~/.claude/projects/`, extracts session shapes, classifies
- **Intelligence** — rule-based session classification (12+ types, 500+ subtypes)
- **Skills** — `/angeleye:install`, `/angeleye:name-session`, `/angeleye:context`
- **Analysis** — 924-session campaign with v3 schema, backward pass, derived metrics

## Brain (Canonical Knowledge)

| Topic                                        | Location                                                             |
| -------------------------------------------- | -------------------------------------------------------------------- |
| JSONL format, entry types, streaming, naming | `~/dev/ad/brains/anthropic-claude/claude-code/observability.md`      |
| Hook events and payloads                     | `~/dev/ad/brains/anthropic-claude/claude-code/hooks-reference.md`    |
| Session lifecycle (/rename, /fork, /rewind)  | `~/dev/ad/brains/anthropic-claude/claude-code/session-management.md` |
| AngelEye domain knowledge                    | `~/dev/ad/brains/angeleye/`                                          |
| Analysis index (924 entries)                 | `~/dev/ad/brains/angeleye/analysis/session-index.jsonl`              |

---

# AppyStack Documentation

Complete reference for building on the RVETS stack (React + Vite + Express + TypeScript + Socket.io).

## Guides

| Guide                                 | What's in it                                     |
| ------------------------------------- | ------------------------------------------------ |
| [Getting Started](getting-started.md) | First steps after scaffolding                    |
| [Testing Guide](testing-guide.md)     | Vitest patterns, MSW, hook testing, socket mocks |
| [Troubleshooting](troubleshooting.md) | Common problems and fixes                        |

## Reference

| Reference                                 | What's in it                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| [Architecture](architecture.md)           | Full stack decisions, pitfalls, npm publishing                           |
| [API Design](api-design.md)               | Route conventions, error handling, Zod validation                        |
| [Socket.io](socket-io.md)                 | Event patterns, auth, rooms, typed events                                |
| [Environment](environment.md)             | Env var setup, Zod schema patterns                                       |
| [Authentication](authentication.md)       | Auth patterns (JWT, sessions)                                            |
| [Extending Configs](extending-configs.md) | How to extend ESLint, TypeScript, Prettier configs                       |
| [Deployment](deployment.md)               | Production build, serving, Docker                                        |
| [Database](database.md)                   | Persistence options (file-based, Prisma, Drizzle)                        |
| [UI Patterns](ui-patterns.md)             | Three-state fields, narrative-first forms, 30-second scan handover sheet |

## Recipes

Recipes are composable patterns that sit on top of the RVETS template. Run `/recipe` in Claude Code to use them.

| Recipe               | What it builds                                                                          |
| -------------------- | --------------------------------------------------------------------------------------- |
| `nav-shell`          | Left-sidebar layout with header, collapsible sidebar, main content area                 |
| `file-crud`          | JSON file-based persistence, chokidar watcher, Socket.io sync, useEntity hook           |
| `entity-socket-crud` | Generic Socket.io CRUD contract for any entity (useEntity hook, handler template)       |
| `local-service`      | Unified startup via Procfile + Overmind, optional Platypus .app launcher                |
| `add-orm`            | Adds Prisma or Drizzle ORM to replace JSON file persistence                             |
| `add-auth`           | JWT authentication + protected routes + optional Socket.io auth                         |
| `add-tanstack-query` | Smart HTTP caching that complements Socket.io                                           |
| `add-state`          | Zustand store replacing multiple React contexts                                         |
| `csv-bulk-import`    | CSV upload modal for bulk entity creation, column validation, partial success reporting |
| `domain-expert-uat`  | Plain-English UAT plan generator for non-developer domain experts                       |

Recipes are composable:

- `nav-shell` + `file-crud` = complete single-entity CRUD app
- `nav-shell` + `file-crud` + `entity-socket-crud` = multi-entity CRUD app with real-time sync
- Any recipe + `local-service` = persistent local service with Spotlight launch
- Any entity recipe + `csv-bulk-import` = bulk data entry via CSV upload
- Any stable feature set + `domain-expert-uat` = UAT plan for non-developer collaborators

## Plans

Historical planning documents for AppyStack development waves are in `plans/`.
