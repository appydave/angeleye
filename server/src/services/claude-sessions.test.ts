import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  readClaudeLiveSessions,
  readClaudeLiveSessionsById,
  sessionsDir,
  _setSessionsDir,
} from './claude-sessions.service.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'angeleye-live-sessions-'));
  _setSessionsDir(dir);
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

// A real row, copied verbatim from ~/.claude/sessions/ on 2026-08-19 with the id changed.
// Kept whole rather than trimmed so a future Claude Code field rename shows up as a test diff.
const REAL_ROW = {
  pid: 15481,
  sessionId: '151c41a7-7942-4c6a-9f49-8e13a2a65feb',
  cwd: '/Users/davidcruwys/dev/ad/apps/appydave-hackerthons/shape-copilot',
  startedAt: 1786708104865,
  procStart: 'Fri Aug 14 11:48:20 2026',
  version: '2.1.229',
  peerProtocol: 1,
  kind: 'interactive',
  entrypoint: 'cli',
  messagingSocketPath: '/tmp/cc-socks/15481.sock',
  name: 'shape-copilot-80',
  nameSource: 'derived',
  status: 'idle',
  updatedAt: 1786756819998,
  statusUpdatedAt: 1786756819998,
  bridgeSessionId: 'session_01Pbem8GJcFsApxpJP5jAoqt',
};

async function write(name: string, body: unknown): Promise<void> {
  await writeFile(join(dir, name), JSON.stringify(body), 'utf-8');
}

describe('readClaudeLiveSessions', () => {
  it('maps a real Claude Code session row onto the AngelEye shape', async () => {
    // process.pid is guaranteed alive, so liveness is deterministic in the test.
    await write('live.json', { ...REAL_ROW, pid: process.pid });

    const [s] = await readClaudeLiveSessions();
    expect(s?.session_id).toBe('151c41a7-7942-4c6a-9f49-8e13a2a65feb');
    expect(s?.pid).toBe(process.pid);
    expect(s?.process_alive).toBe(true);
    expect(s?.name).toBe('shape-copilot-80');
    expect(s?.name_source).toBe('derived');
    expect(s?.status).toBe('idle');
    expect(s?.kind).toBe('interactive');
    expect(s?.entrypoint).toBe('cli');
    expect(s?.version).toBe('2.1.229');
    expect(s?.bridge_session_id).toBe('session_01Pbem8GJcFsApxpJP5jAoqt');
    expect(s?.cwd).toBe('/Users/davidcruwys/dev/ad/apps/appydave-hackerthons/shape-copilot');
    expect(s?.started_at).toBe(new Date(1786708104865).toISOString());
    expect(s?.former_names).toEqual([]);
  });

  it('reports a dead PID as not alive rather than trusting status', async () => {
    // PID 2^22 is above the macOS/Linux default pid_max and cannot exist. `status: "busy"` is
    // deliberately contradictory: the file says busy, the process is gone, and the process wins.
    // Measured on a real machine, a live file can be 8 days stale — status is not a heartbeat.
    await write('dead.json', { ...REAL_ROW, pid: 4_194_304, status: 'busy' });

    const [s] = await readClaudeLiveSessions();
    expect(s?.process_alive).toBe(false);
    expect(s?.status).toBe('busy');
  });

  it('sorts live sessions ahead of dead ones', async () => {
    await write('a-dead.json', { ...REAL_ROW, sessionId: 'dead-1', pid: 4_194_304 });
    await write('b-live.json', { ...REAL_ROW, sessionId: 'live-1', pid: process.pid });

    const sessions = await readClaudeLiveSessions();
    expect(sessions.map((s) => s.session_id)).toEqual(['live-1', 'dead-1']);
  });

  it('captures rename history when present', async () => {
    await write('renamed.json', {
      ...REAL_ROW,
      pid: process.pid,
      formerNames: ['old-name', 'older-name'],
    });

    const [s] = await readClaudeLiveSessions();
    expect(s?.former_names).toEqual(['old-name', 'older-name']);
  });

  it('tolerates missing optional fields without dropping the row', async () => {
    // nameSource, bridgeSessionId and formerNames were all absent on some real rows.
    await write('sparse.json', { pid: process.pid, sessionId: 'sparse-1' });

    const [s] = await readClaudeLiveSessions();
    expect(s?.session_id).toBe('sparse-1');
    expect(s?.name).toBeNull();
    expect(s?.name_source).toBeNull();
    expect(s?.bridge_session_id).toBeNull();
    expect(s?.started_at).toBeNull();
    expect(s?.former_names).toEqual([]);
  });

  it('skips rows with no sessionId or no pid — they cannot be joined or liveness-checked', async () => {
    await write('no-id.json', { pid: process.pid });
    await write('no-pid.json', { sessionId: 'x' });
    await write('good.json', { ...REAL_ROW, sessionId: 'good-1', pid: process.pid });

    const sessions = await readClaudeLiveSessions();
    expect(sessions.map((s) => s.session_id)).toEqual(['good-1']);
  });

  it('skips a malformed file instead of failing the whole batch', async () => {
    // These files are written by a live process; a torn read is expected occasionally and must
    // not take out every other session.
    await writeFile(join(dir, 'torn.json'), '{"pid": 123, "sessi', 'utf-8');
    await write('good.json', { ...REAL_ROW, sessionId: 'good-1', pid: process.pid });

    const sessions = await readClaudeLiveSessions();
    expect(sessions.map((s) => s.session_id)).toEqual(['good-1']);
  });

  it('ignores non-.json files — the dir also holds .key files', async () => {
    await writeFile(join(dir, '15481.de66ae3b.key'), 'not json', 'utf-8');
    await write('good.json', { ...REAL_ROW, sessionId: 'good-1', pid: process.pid });

    const sessions = await readClaudeLiveSessions();
    expect(sessions).toHaveLength(1);
  });

  it('returns [] for a missing directory — indistinguishable from empty, hence sessionsDir()', async () => {
    _setSessionsDir(join(dir, 'does-not-exist'));
    expect(await readClaudeLiveSessions()).toEqual([]);
    // The caller needs the path to tell "never ran here" from "nothing running".
    expect(sessionsDir()).toBe(join(dir, 'does-not-exist'));
  });
});

describe('readClaudeLiveSessionsById', () => {
  it('indexes by session_id for joining against the AngelEye registry', async () => {
    await write('a.json', { ...REAL_ROW, sessionId: 'ses-a', pid: process.pid });
    await write('b.json', { ...REAL_ROW, sessionId: 'ses-b', pid: process.pid });

    const byId = await readClaudeLiveSessionsById();
    expect(Object.keys(byId).sort()).toEqual(['ses-a', 'ses-b']);
    expect(byId['ses-a']?.pid).toBe(process.pid);
  });
});
