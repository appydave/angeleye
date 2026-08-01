#!/usr/bin/env node
/**
 * AngelEye MCP server — read-only access to the session corpus over stdio.
 *
 * A thin adapter, not a second implementation: every tool maps onto an existing
 * HTTP endpoint on the running AngelEye server. Nothing here reads the registry
 * or event files directly, so MCP and REST can never disagree about the data.
 *
 * Requires the AngelEye server to be up (default http://localhost:5051,
 * override with ANGELEYE_URL).
 *
 * Run:  npx tsx server/src/mcp/angeleye-mcp.ts
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const BASE_URL = process.env.ANGELEYE_URL ?? 'http://localhost:5051';

/** Guards against a hung server turning into a hung tool call. */
const REQUEST_TIMEOUT_MS = 30_000;

export interface ApiEnvelope<T> {
  status: string;
  data?: T;
  error?: string;
}

/**
 * Thrown for anything the caller can act on — server down, bad filter, 404.
 * The message is surfaced verbatim as the tool's error text.
 */
export class AngelEyeApiError extends Error {}

export async function apiGet<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  fetchImpl: typeof fetch = fetch
): Promise<T> {
  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }

  let res: Response;
  try {
    res = await fetchImpl(url.toString(), {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    // Connection refused is by far the most common failure, and the fix is
    // always the same — say it plainly rather than leaking a fetch stack.
    throw new AngelEyeApiError(
      `Could not reach AngelEye at ${BASE_URL}. Is the server running? ` +
        `(start it with: cd <angeleye repo> && ./scripts/start.sh)  [${(err as Error).message}]`
    );
  }

  if (!res.ok) {
    throw new AngelEyeApiError(`AngelEye returned HTTP ${res.status} for ${url.pathname}`);
  }

  const body = (await res.json()) as ApiEnvelope<T>;
  if (body.status === 'error') {
    throw new AngelEyeApiError(body.error ?? `AngelEye reported an error for ${url.pathname}`);
  }
  return body.data as T;
}

function textResult(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] };
}

function errorResult(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return { content: [{ type: 'text' as const, text: message }], isError: true };
}

/** Wraps a handler so no failure escapes as an unhandled rejection. */
async function guard(fn: () => Promise<unknown>) {
  try {
    return textResult(await fn());
  } catch (err) {
    return errorResult(err);
  }
}

interface SessionRow {
  session_id: string;
  project?: string | null;
  project_dir?: string | null;
  name?: string | null;
  started_at?: string | null;
  last_active?: string | null;
  status?: string | null;
  session_type?: string | null;
  subtype_heuristic?: string | null;
}

interface EventRow {
  id?: string;
  session_id?: string;
  ts?: string;
  event?: string;
  tool?: string;
  prompt?: string;
  payload?: Record<string, unknown>;
}

/** Local calendar day for an ISO timestamp — days are read in local time. */
function localDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function buildServer(): McpServer {
  const server = new McpServer({ name: 'angeleye', version: '0.1.0' });

  // ── list_sessions ───────────────────────────────────────────────────────────
  server.registerTool(
    'list_sessions',
    {
      title: 'List AngelEye sessions',
      description:
        'List Claude Code sessions AngelEye has recorded, newest first. Filter by project, ' +
        'date range, or session subtype. Use this to find which sessions to inspect; use ' +
        'get_session_events or get_day_conversations to read what happened in them.',
      inputSchema: {
        project: z.string().optional().describe('Project name, e.g. "captains-log"'),
        project_match: z
          .enum(['exact', 'glob', 'regex'])
          .optional()
          .describe('How to match project. Default exact. glob supports * and ?'),
        since: z.string().optional().describe('ISO date lower bound, e.g. "2026-08-01"'),
        until: z.string().optional().describe('ISO date upper bound (inclusive)'),
        subtype_prefix: z.string().optional().describe('Match session_subtype by prefix'),
        limit: z.number().int().min(1).max(200).optional().describe('Default 50'),
      },
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      guard(async () => {
        const data = await apiGet<{ sessions: SessionRow[] }>('/api/sessions', {
          project: args.project,
          project_match: args.project_match,
          since: args.since,
          until: args.until,
          subtype_prefix: args.subtype_prefix,
        });

        // The server's sort comparator yields NaN for rows with no last_active,
        // which makes any limited page an arbitrary slice. Fetch unlimited and
        // order here so results are actually the newest.
        const sorted = [...(data.sessions ?? [])].sort((a, b) =>
          String(b.last_active ?? '').localeCompare(String(a.last_active ?? ''))
        );
        const limit = args.limit ?? 50;

        return {
          total: sorted.length,
          returned: Math.min(limit, sorted.length),
          sessions: sorted.slice(0, limit).map((s) => ({
            session_id: s.session_id,
            name: s.name ?? null,
            project: s.project ?? null,
            started_at: s.started_at ?? null,
            last_active: s.last_active ?? null,
            status: s.status ?? null,
            subtype: s.subtype_heuristic ?? null,
          })),
        };
      })
  );

  // ── find_events ─────────────────────────────────────────────────────────────
  server.registerTool(
    'find_events',
    {
      title: 'Find events across all sessions',
      description:
        'Search events across the WHOLE corpus, not one session — this is how you answer ' +
        '"what failed this week". Filter by event type (e.g. tool_failure, permission_request, ' +
        'notification), date range, project, or tool name. Returns full payloads, so a ' +
        'tool_failure includes the command that failed.',
      inputSchema: {
        event: z
          .string()
          .optional()
          .describe('Comma-separated event types, e.g. "tool_failure,permission_request"'),
        since: z.string().optional().describe('ISO date lower bound'),
        until: z.string().optional().describe('ISO date upper bound (inclusive of that day)'),
        project: z.string().optional(),
        project_match: z.enum(['exact', 'glob', 'regex']).optional(),
        session_id: z.string().optional().describe('Restrict to one session'),
        tool: z.string().optional().describe('Tool name, e.g. "Bash"'),
        limit: z.number().int().min(1).max(500).optional().describe('Default 50'),
        include_payloads: z
          .boolean()
          .optional()
          .describe('Default true. Set false for a compact list of timestamps and types.'),
      },
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      guard(async () => {
        const hydrate = args.include_payloads !== false;
        const data = await apiGet<{
          events: EventRow[];
          locators: EventRow[];
          total: number;
          projects: Record<string, string>;
        }>('/api/events', {
          event: args.event,
          since: args.since,
          until: args.until,
          project: args.project,
          project_match: args.project_match,
          session_id: args.session_id,
          tool: args.tool,
          limit: args.limit ?? 50,
          hydrate: hydrate ? 'true' : 'false',
        });

        return {
          total_matches: data.total,
          returned: hydrate ? data.events.length : data.locators.length,
          projects: data.projects,
          events: hydrate ? data.events : data.locators,
        };
      })
  );

  // ── events_summary ──────────────────────────────────────────────────────────
  server.registerTool(
    'events_summary',
    {
      title: 'Count events by type',
      description:
        'Counts of each event type across the corpus for a given filter — the cheap ' +
        '"what happened" overview before drilling in with find_events.',
      inputSchema: {
        since: z.string().optional(),
        until: z.string().optional(),
        project: z.string().optional(),
        project_match: z.enum(['exact', 'glob', 'regex']).optional(),
        session_id: z.string().optional(),
      },
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      guard(() =>
        apiGet<{ counts: Record<string, number>; total: number }>('/api/events/summary', {
          since: args.since,
          until: args.until,
          project: args.project,
          project_match: args.project_match,
          session_id: args.session_id,
        })
      )
  );

  // ── get_session_events ──────────────────────────────────────────────────────
  server.registerTool(
    'get_session_events',
    {
      title: 'Read one session in full',
      description:
        'Full event stream for a single session, optionally narrowed to some event types. ' +
        'Use event_types="user_prompt" to read just what the user typed.',
      inputSchema: {
        session_id: z.string().describe('Full session UUID'),
        event_types: z
          .string()
          .optional()
          .describe('Comma-separated filter, e.g. "user_prompt" or "tool_failure,stop"'),
        limit: z.number().int().min(1).max(2000).optional().describe('Default 500'),
      },
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      guard(async () => {
        const data = await apiGet<{ events: EventRow[] } | EventRow[]>(
          `/api/sessions/${encodeURIComponent(args.session_id)}/events`,
          { limit: args.limit ?? 500 }
        );
        const all = Array.isArray(data) ? data : (data.events ?? []);

        // The events endpoint returns an empty list for a wrong id just as it
        // does for a genuinely quiet session. Left alone that reads as "nothing
        // happened here", so confirm the session exists before saying so.
        if (all.length === 0) {
          await apiGet(`/api/sessions/${encodeURIComponent(args.session_id)}/enrichments`);
        }

        const wanted = args.event_types
          ? new Set(
              args.event_types
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            )
          : null;
        const events = wanted ? all.filter((e) => e.event && wanted.has(e.event)) : all;
        return { session_id: args.session_id, total: events.length, events };
      })
  );

  // ── get_day_conversations ───────────────────────────────────────────────────
  server.registerTool(
    'get_day_conversations',
    {
      title: "Read a day's prompts",
      description:
        'Every prompt the user typed on a given day, grouped by session — the "what did I ' +
        'work on" view. Prefer this over searching: prompt text is only indexed as a ' +
        '200-character stub, so keyword search misses most conversation content.',
      inputSchema: {
        date: z.string().optional().describe('YYYY-MM-DD. Defaults to today (local).'),
        project: z.string().optional().describe('Restrict to one project'),
      },
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      guard(async () => {
        const date = args.date ?? localDate(new Date().toISOString());

        const data = await apiGet<{ sessions: SessionRow[] }>('/api/sessions', {});
        const matches = (data.sessions ?? [])
          .filter(
            (s) =>
              (s.last_active && localDate(s.last_active) === date) ||
              (s.started_at && localDate(s.started_at) === date)
          )
          .filter((s) => !args.project || (s.project ?? '') === args.project)
          .sort((a, b) => String(a.started_at ?? '').localeCompare(String(b.started_at ?? '')));

        const sessions = [];
        let totalPrompts = 0;

        for (const s of matches) {
          let prompts: { ts: string; text: string }[] = [];
          let note: string | undefined;
          try {
            const evData = await apiGet<{ events: EventRow[] } | EventRow[]>(
              `/api/sessions/${encodeURIComponent(s.session_id)}/events`,
              { limit: 2000 }
            );
            const events = Array.isArray(evData) ? evData : (evData.events ?? []);
            prompts = events
              .filter((e) => e.event === 'user_prompt')
              .map((e) => ({ ts: e.ts ?? '', text: e.prompt ?? '' }));
          } catch (err) {
            // One unreadable session must not blank out the whole day.
            note = `events unavailable: ${(err as Error).message}`;
          }
          totalPrompts += prompts.length;
          sessions.push({
            session_id: s.session_id,
            name: s.name ?? null,
            project: s.project ?? null,
            started_at: s.started_at ?? null,
            prompt_count: prompts.length,
            ...(note ? { note } : {}),
            prompts,
          });
        }

        return { date, session_count: sessions.length, prompt_count: totalPrompts, sessions };
      })
  );

  // ── angeleye_status ─────────────────────────────────────────────────────────
  server.registerTool(
    'angeleye_status',
    {
      title: 'AngelEye health and index state',
      description:
        'Whether the AngelEye server is reachable, how many sessions it holds, and when the ' +
        'cross-session event index was last built. Check this first if other tools return nothing.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () =>
      guard(async () => {
        const [info, stats, index] = await Promise.all([
          apiGet<Record<string, unknown>>('/api/info'),
          apiGet<{ total: number }>('/api/stats'),
          apiGet<{ meta: Record<string, unknown> | null }>('/api/events/index'),
        ]);
        return {
          base_url: BASE_URL,
          reachable: true,
          server: info,
          sessions_in_registry: stats.total,
          event_index: index.meta,
        };
      })
  );

  return server;
}

/** Entry point is skipped under test so importing this module starts nothing. */
export async function main(): Promise<void> {
  const server = buildServer();
  await server.connect(new StdioServerTransport());
  // stdout is the JSON-RPC channel — diagnostics must go to stderr.
  console.error(`AngelEye MCP server ready (upstream: ${BASE_URL})`);
}

if (process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true') {
  main().catch((err: unknown) => {
    console.error('AngelEye MCP server failed to start:', err);
    process.exit(1);
  });
}
