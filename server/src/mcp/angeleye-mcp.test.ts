import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { apiGet, AngelEyeApiError, buildServer } from './angeleye-mcp.js';

/**
 * Drive the server over a real MCP session rather than reaching into SDK
 * internals — this is the surface a client actually sees, and it doesn't break
 * when the SDK reshuffles its private fields.
 */
async function connectClient() {
  const server = buildServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: '0.0.0' });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  return client;
}

interface ToolResult {
  content: { type: string; text: string }[];
  isError?: boolean;
}

async function callTool(name: string, args: Record<string, unknown> = {}): Promise<ToolResult> {
  const client = await connectClient();
  return (await client.callTool({ name, arguments: args })) as unknown as ToolResult;
}

/** Minimal fetch double — records calls and replays queued responses. */
function makeFetch(responses: unknown[], opts: { ok?: boolean; status?: number } = {}) {
  const calls: string[] = [];
  const queue = [...responses];
  const impl = vi.fn(async (url: string) => {
    calls.push(url);
    return {
      ok: opts.ok ?? true,
      status: opts.status ?? 200,
      json: async () => queue.shift(),
    } as unknown as Response;
  });
  return { impl: impl as unknown as typeof fetch, calls };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── apiGet ────────────────────────────────────────────────────────────────────

describe('apiGet', () => {
  it('unwraps the API envelope and returns data', async () => {
    const { impl } = makeFetch([{ status: 'ok', data: { total: 3 } }]);

    const result = await apiGet<{ total: number }>('/api/stats', {}, impl);

    expect(result).toEqual({ total: 3 });
  });

  it('appends only defined, non-empty query params', async () => {
    const { impl, calls } = makeFetch([{ status: 'ok', data: {} }]);

    await apiGet('/api/events', { event: 'tool_failure', project: undefined, tool: '' }, impl);

    expect(calls[0]).toContain('event=tool_failure');
    expect(calls[0]).not.toContain('project=');
    expect(calls[0]).not.toContain('tool=');
  });

  it('raises a recovery-oriented error when the server is unreachable', async () => {
    const impl = vi.fn(async () => {
      throw new Error('fetch failed');
    }) as unknown as typeof fetch;

    await expect(apiGet('/api/stats', {}, impl)).rejects.toThrow(AngelEyeApiError);
    await expect(apiGet('/api/stats', {}, impl)).rejects.toThrow(/Is the server running/);
  });

  it('raises on a non-2xx response', async () => {
    const { impl } = makeFetch([{}], { ok: false, status: 500 });

    await expect(apiGet('/api/stats', {}, impl)).rejects.toThrow(/HTTP 500/);
  });

  it('raises when the envelope reports an error status', async () => {
    const { impl } = makeFetch([{ status: 'error', error: 'Session not found' }]);

    await expect(apiGet('/api/sessions/x', {}, impl)).rejects.toThrow('Session not found');
  });
});

// ── tool registration ─────────────────────────────────────────────────────────

describe('tool listing over a real MCP session', () => {
  it('advertises exactly the documented tool surface', async () => {
    const client = await connectClient();

    const { tools } = await client.listTools();

    expect(tools.map((t) => t.name).sort()).toEqual([
      'angeleye_status',
      'events_summary',
      'find_events',
      'get_day_conversations',
      'get_session_events',
      'list_sessions',
    ]);
  });

  it('marks every tool read-only — AngelEye MCP never mutates', async () => {
    const client = await connectClient();

    const { tools } = await client.listTools();

    for (const tool of tools) {
      expect(tool.annotations?.readOnlyHint, `${tool.name} should be read-only`).toBe(true);
    }
  });

  it('gives every tool a description so the model can choose between them', async () => {
    const client = await connectClient();

    const { tools } = await client.listTools();

    for (const tool of tools) {
      expect(tool.description, `${tool.name} needs a description`).toBeTruthy();
      expect((tool.description ?? '').length).toBeGreaterThan(30);
    }
  });

  it('publishes an input schema for each filtering tool', async () => {
    const client = await connectClient();

    const { tools } = await client.listTools();
    const findEvents = tools.find((t) => t.name === 'find_events');

    expect(Object.keys(findEvents?.inputSchema?.properties ?? {})).toEqual(
      expect.arrayContaining(['event', 'since', 'until', 'project', 'tool', 'limit'])
    );
  });

  it('requires session_id on get_session_events', async () => {
    const client = await connectClient();

    const { tools } = await client.listTools();
    const tool = tools.find((t) => t.name === 'get_session_events');

    expect(tool?.inputSchema?.required).toContain('session_id');
  });
});

describe('input validation', () => {
  it('rejects a call missing a required argument', async () => {
    const res = await callTool('get_session_events', {});

    expect(res.isError).toBe(true);
  });

  it('rejects an out-of-range limit rather than silently clamping', async () => {
    const res = await callTool('find_events', { limit: 99999 });

    expect(res.isError).toBe(true);
  });

  it('rejects an unknown enum value for project_match', async () => {
    const res = await callTool('list_sessions', { project_match: 'fuzzy' });

    expect(res.isError).toBe(true);
  });
});

// ── tool behaviour ────────────────────────────────────────────────────────────

describe('tool error mapping', () => {
  it('returns isError with the recovery hint when AngelEye is down', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      })
    );

    const res = await callTool('events_summary');

    expect(res.isError).toBe(true);
    expect(res.content[0].text).toMatch(/Is the server running/);
  });

  it('surfaces an API error message rather than throwing out of the tool', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ status: 'error', error: 'Invalid session id' }),
      }))
    );

    const res = await callTool('get_session_events', { session_id: 'bad id' });

    expect(res.isError).toBe(true);
    expect(res.content[0].text).toBe('Invalid session id');
  });
});

describe('list_sessions', () => {
  it('orders newest-first locally rather than trusting the server page order', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'ok',
          data: {
            sessions: [
              { session_id: 'old', last_active: '2026-07-01T00:00:00.000Z' },
              { session_id: 'newest', last_active: '2026-08-01T00:00:00.000Z' },
              { session_id: 'no-last-active' },
            ],
          },
        }),
      }))
    );

    const res = await callTool('list_sessions', {});
    const parsed = JSON.parse(res.content[0].text) as {
      total: number;
      sessions: { session_id: string }[];
    };

    expect(parsed.total).toBe(3);
    expect(parsed.sessions[0].session_id).toBe('newest');
  });

  it('applies the limit after sorting', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'ok',
          data: {
            sessions: [
              { session_id: 'a', last_active: '2026-07-01T00:00:00.000Z' },
              { session_id: 'b', last_active: '2026-08-01T00:00:00.000Z' },
            ],
          },
        }),
      }))
    );

    const res = await callTool('list_sessions', { limit: 1 });
    const parsed = JSON.parse(res.content[0].text) as {
      returned: number;
      sessions: { session_id: string }[];
    };

    expect(parsed.returned).toBe(1);
    expect(parsed.sessions[0].session_id).toBe('b');
  });
});

describe('find_events', () => {
  it('requests hydrated payloads by default', async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: 'ok',
            data: { events: [{ id: 'e1' }], locators: [{ id: 'e1' }], total: 1, projects: {} },
          }),
        };
      })
    );

    const res = await callTool('find_events', { event: 'tool_failure' });
    const parsed = JSON.parse(res.content[0].text) as { total_matches: number; returned: number };

    expect(calls[0]).toContain('hydrate=true');
    expect(parsed.total_matches).toBe(1);
    expect(parsed.returned).toBe(1);
  });

  it('returns compact locators when include_payloads is false', async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: 'ok',
            data: { events: [], locators: [{ id: 'e1' }, { id: 'e2' }], total: 2, projects: {} },
          }),
        };
      })
    );

    const res = await callTool('find_events', {
      event: 'tool_failure',
      include_payloads: false,
    });
    const parsed = JSON.parse(res.content[0].text) as { returned: number };

    expect(calls[0]).toContain('hydrate=false');
    expect(parsed.returned).toBe(2);
  });
});

describe('get_session_events', () => {
  it('filters to the requested event types', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'ok',
          data: {
            events: [
              { event: 'user_prompt', prompt: 'hello' },
              { event: 'tool_use', tool: 'Bash' },
              { event: 'user_prompt', prompt: 'again' },
            ],
          },
        }),
      }))
    );

    const res = await callTool('get_session_events', {
      session_id: 'ses-1',
      event_types: 'user_prompt',
    });
    const parsed = JSON.parse(res.content[0].text) as { total: number };

    expect(parsed.total).toBe(2);
  });

  it('reports a bad session id as an error instead of an empty session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/enrichments')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ status: 'error', error: 'Session not found' }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: 'ok', data: { events: [] } }),
        };
      })
    );

    const res = await callTool('get_session_events', { session_id: 'nope' });

    expect(res.isError).toBe(true);
    expect(res.content[0].text).toBe('Session not found');
  });

  it('returns an empty list for a real session that simply has no events', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/enrichments')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ status: 'ok', data: { history: [], count: 0 } }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: 'ok', data: { events: [] } }),
        };
      })
    );

    const res = await callTool('get_session_events', { session_id: 'real-but-quiet' });

    expect(res.isError).toBeFalsy();
    expect(JSON.parse(res.content[0].text)).toMatchObject({ total: 0, events: [] });
  });

  it('returns every event when no type filter is given', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'ok',
          data: { events: [{ event: 'user_prompt' }, { event: 'stop' }] },
        }),
      }))
    );

    const res = await callTool('get_session_events', { session_id: 'ses-1' });
    const parsed = JSON.parse(res.content[0].text) as { total: number };

    expect(parsed.total).toBe(2);
  });
});

describe('get_day_conversations', () => {
  it('groups prompts by session for the requested day', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/events')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              status: 'ok',
              data: {
                events: [
                  { event: 'user_prompt', ts: '2026-08-01T01:00:00.000Z', prompt: 'first' },
                  { event: 'tool_use', ts: '2026-08-01T01:01:00.000Z' },
                  { event: 'user_prompt', ts: '2026-08-01T01:02:00.000Z', prompt: 'second' },
                ],
              },
            }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: 'ok',
            data: {
              sessions: [
                {
                  session_id: 'ses-1',
                  project: 'angeleye',
                  started_at: '2026-08-01T01:00:00.000Z',
                  last_active: '2026-08-01T02:00:00.000Z',
                },
              ],
            },
          }),
        };
      })
    );

    const res = await callTool('get_day_conversations', { date: '2026-08-01' });
    const parsed = JSON.parse(res.content[0].text) as {
      prompt_count: number;
      sessions: { prompts: { text: string }[] }[];
    };

    expect(parsed.prompt_count).toBe(2);
    expect(parsed.sessions[0].prompts.map((p) => p.text)).toEqual(['first', 'second']);
  });

  it('notes an unreadable session instead of blanking the whole day', async () => {
    let call = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        call++;
        if (url.includes('/events')) throw new Error('boom');
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: 'ok',
            data: {
              sessions: [
                {
                  session_id: 'ses-1',
                  started_at: '2026-08-01T01:00:00.000Z',
                  last_active: '2026-08-01T01:00:00.000Z',
                },
              ],
            },
          }),
        };
      })
    );

    const res = await callTool('get_day_conversations', { date: '2026-08-01' });
    const parsed = JSON.parse(res.content[0].text) as {
      sessions: { note?: string; prompt_count: number }[];
    };

    expect(call).toBeGreaterThan(1);
    expect(parsed.sessions[0].note).toMatch(/events unavailable/);
    expect(parsed.sessions[0].prompt_count).toBe(0);
  });

  it('filters to a single project', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/events')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ status: 'ok', data: { events: [] } }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: 'ok',
            data: {
              sessions: [
                { session_id: 'a', project: 'angeleye', last_active: '2026-08-01T01:00:00.000Z' },
                {
                  session_id: 'b',
                  project: 'captains-log',
                  last_active: '2026-08-01T01:00:00.000Z',
                },
              ],
            },
          }),
        };
      })
    );

    const res = await callTool('get_day_conversations', {
      date: '2026-08-01',
      project: 'angeleye',
    });
    const parsed = JSON.parse(res.content[0].text) as { session_count: number };

    expect(parsed.session_count).toBe(1);
  });
});

describe('angeleye_status', () => {
  it('reports registry size and index state together', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const data = url.includes('/api/info')
          ? { port: 5051 }
          : url.includes('/api/stats')
            ? { total: 2085 }
            : { meta: { events_indexed: 308236 } };
        return { ok: true, status: 200, json: async () => ({ status: 'ok', data }) };
      })
    );

    const res = await callTool('angeleye_status');
    const parsed = JSON.parse(res.content[0].text) as {
      reachable: boolean;
      sessions_in_registry: number;
      event_index: { events_indexed: number };
    };

    expect(parsed.reachable).toBe(true);
    expect(parsed.sessions_in_registry).toBe(2085);
    expect(parsed.event_index.events_indexed).toBe(308236);
  });
});
