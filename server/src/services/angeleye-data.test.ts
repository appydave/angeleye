import { mkdtemp, rm, readFile, writeFile, stat, mkdir } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { AngelEyeEvent } from '@appystack/shared';
import { _setDataDir, initAngelEyeDirs, readRegistry, updateRegistry } from './registry.service.js';
import {
  writeEvent,
  getSessionEvents,
  archiveSession,
  writeSessionName,
} from './sessions.service.js';

let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'angeleye-test-'));
  _setDataDir(testDir);
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

// Helper to build a minimal valid AngelEyeEvent
function makeEvent(overrides: Partial<AngelEyeEvent> = {}): AngelEyeEvent {
  return {
    id: 'evt-001',
    session_id: 'ses-abc',
    ts: new Date().toISOString(),
    source: 'hook',
    event: 'session_start',
    ...overrides,
  };
}

// ── initAngelEyeDirs ──────────────────────────────────────────────────────────

describe('initAngelEyeDirs', () => {
  it('creates sessions/, archive/, registry.json, and workspaces.json', async () => {
    await initAngelEyeDirs();

    await expect(stat(join(testDir, 'sessions'))).resolves.toBeTruthy();
    await expect(stat(join(testDir, 'archive'))).resolves.toBeTruthy();
    await expect(stat(join(testDir, 'registry.json'))).resolves.toBeTruthy();
    await expect(stat(join(testDir, 'workspaces.json'))).resolves.toBeTruthy();

    const registry = JSON.parse(await readFile(join(testDir, 'registry.json'), 'utf-8')) as unknown;
    expect(registry).toEqual({});

    const workspaces = JSON.parse(
      await readFile(join(testDir, 'workspaces.json'), 'utf-8')
    ) as unknown;
    expect(workspaces).toEqual({ workspaces: [] });
  });

  it('is idempotent — calling twice does not throw or corrupt files', async () => {
    await initAngelEyeDirs();
    await initAngelEyeDirs(); // second call

    const registry = JSON.parse(await readFile(join(testDir, 'registry.json'), 'utf-8')) as unknown;
    expect(registry).toEqual({});

    const workspaces = JSON.parse(
      await readFile(join(testDir, 'workspaces.json'), 'utf-8')
    ) as unknown;
    expect(workspaces).toEqual({ workspaces: [] });
  });
});

// ── writeEvent ────────────────────────────────────────────────────────────────

describe('writeEvent', () => {
  it('appends a JSON line to the session file', async () => {
    await initAngelEyeDirs();
    const event = makeEvent({ session_id: 'ses-write-1' });
    await writeEvent(event);

    const content = await readFile(join(testDir, 'sessions', 'session-ses-write-1.jsonl'), 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim() !== '');
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]) as AngelEyeEvent;
    expect(parsed.id).toBe(event.id);
    expect(parsed.session_id).toBe('ses-write-1');
  });

  it('two writes produce two lines, both parseable', async () => {
    await initAngelEyeDirs();
    const e1 = makeEvent({ id: 'evt-1', session_id: 'ses-write-2', event: 'session_start' });
    const e2 = makeEvent({ id: 'evt-2', session_id: 'ses-write-2', event: 'user_prompt' });
    await writeEvent(e1);
    await writeEvent(e2);

    const content = await readFile(join(testDir, 'sessions', 'session-ses-write-2.jsonl'), 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim() !== '');
    expect(lines).toHaveLength(2);
    expect((JSON.parse(lines[0]) as AngelEyeEvent).id).toBe('evt-1');
    expect((JSON.parse(lines[1]) as AngelEyeEvent).id).toBe('evt-2');
  });
});

// ── readRegistry ──────────────────────────────────────────────────────────────

describe('readRegistry', () => {
  it('returns empty object when registry.json does not exist', async () => {
    // testDir has no registry.json — no initAngelEyeDirs call
    const registry = await readRegistry();
    expect(registry).toEqual({});
  });

  it('returns parsed registry when file exists', async () => {
    await initAngelEyeDirs();
    const data = {
      'ses-xyz': {
        session_id: 'ses-xyz',
        project: 'myapp',
        project_dir: '/projects/myapp',
        started_at: '2026-01-01T00:00:00.000Z',
        last_active: '2026-01-01T01:00:00.000Z',
        name: null,
        tags: [],
        workspace_id: null,
        status: 'active',
        source: 'hook',
      },
    };
    await writeFile(join(testDir, 'registry.json'), JSON.stringify(data), 'utf-8');

    const registry = await readRegistry();
    expect(registry['ses-xyz']?.project).toBe('myapp');
    expect(registry['ses-xyz']?.status).toBe('active');
  });
});

// ── updateRegistry ────────────────────────────────────────────────────────────

describe('updateRegistry', () => {
  it('creates new entry with self-healing defaults', async () => {
    await initAngelEyeDirs();
    const now = new Date().toISOString();

    await updateRegistry('ses-new', {
      session_id: 'ses-new',
      last_active: now,
      project_dir: '/projects/cool-app',
    });

    const registry = await readRegistry();
    const entry = registry['ses-new'];
    expect(entry).toBeDefined();
    expect(entry?.status).toBe('active');
    expect(entry?.started_at).toBe(now);
    // project derived from project_dir basename
    expect(entry?.project).toBe('cool-app');
    expect(entry?.name).toBeNull();
    expect(entry?.tags).toEqual([]);
    expect(entry?.workspace_id).toBeNull();
    expect(entry?.source).toBe('hook');
  });

  it('existing fields are not overwritten by healed defaults', async () => {
    await initAngelEyeDirs();

    // First write — establishes the entry with explicit values
    await updateRegistry('ses-existing', {
      session_id: 'ses-existing',
      project: 'custom-project',
      project_dir: '/projects/custom-project',
      started_at: '2026-01-01T00:00:00.000Z',
      last_active: '2026-01-01T00:00:00.000Z',
      name: 'My Session',
      tags: ['important'],
      workspace_id: 'ws-1',
      status: 'active',
      source: 'hook',
    });

    // Second write — only updates last_active; healed defaults must not overwrite existing fields
    await updateRegistry('ses-existing', {
      last_active: '2026-01-01T02:00:00.000Z',
    });

    const registry = await readRegistry();
    const entry = registry['ses-existing'];
    expect(entry?.name).toBe('My Session');
    expect(entry?.tags).toEqual(['important']);
    expect(entry?.workspace_id).toBe('ws-1');
    expect(entry?.project).toBe('custom-project');
    expect(entry?.started_at).toBe('2026-01-01T00:00:00.000Z');
    expect(entry?.last_active).toBe('2026-01-01T02:00:00.000Z');
  });

  it('serial write queue: 10 concurrent calls all succeed with no data loss', async () => {
    await initAngelEyeDirs();

    const ids = Array.from({ length: 10 }, (_, i) => `ses-concurrent-${i}`);
    // Fire all 10 without awaiting between — they must queue
    await Promise.all(
      ids.map((id) =>
        updateRegistry(id, {
          session_id: id,
          last_active: new Date().toISOString(),
          project_dir: `/projects/${id}`,
        })
      )
    );

    const registry = await readRegistry();
    for (const id of ids) {
      expect(registry[id]).toBeDefined();
      expect(registry[id]?.session_id).toBe(id);
    }
  });
});

// ── getSessionEvents ──────────────────────────────────────────────────────────

describe('getSessionEvents', () => {
  it('returns empty array for unknown session', async () => {
    await initAngelEyeDirs();
    const events = await getSessionEvents('ses-unknown');
    expect(events).toEqual([]);
  });

  it('returns parsed events for existing session file', async () => {
    await initAngelEyeDirs();
    const e1 = makeEvent({ id: 'evt-a', session_id: 'ses-read', event: 'session_start' });
    const e2 = makeEvent({ id: 'evt-b', session_id: 'ses-read', event: 'user_prompt' });
    await writeEvent(e1);
    await writeEvent(e2);

    const events = await getSessionEvents('ses-read');
    expect(events).toHaveLength(2);
    expect(events[0]?.id).toBe('evt-a');
    expect(events[1]?.id).toBe('evt-b');
  });

  it('returns [] without throwing when JSONL contains a malformed line', async () => {
    // Write a JSONL file with: one valid event line + one malformed line ("{bad json")
    await initAngelEyeDirs();
    const validEvent = makeEvent({
      id: 'evt-valid',
      session_id: 'ses-malformed',
      event: 'session_start',
    });
    const validLine = JSON.stringify(validEvent);
    const malformedLine = '{bad json';
    await writeFile(
      join(testDir, 'sessions', 'session-ses-malformed.jsonl'),
      validLine + '\n' + malformedLine + '\n',
      'utf-8'
    );

    // current implementation wraps the full parse; per-line recovery is a future improvement
    let result: Awaited<ReturnType<typeof getSessionEvents>> | undefined;
    await expect(
      (async () => {
        result = await getSessionEvents('ses-malformed');
      })()
    ).resolves.toBeUndefined();

    expect(result).toEqual([]);
  });
});

// ── archiveSession ────────────────────────────────────────────────────────────

describe('archiveSession', () => {
  it('moves file from sessions/ to archive/', async () => {
    await initAngelEyeDirs();
    const event = makeEvent({ session_id: 'ses-archive' });
    await writeEvent(event);

    await archiveSession('ses-archive');

    // Source should no longer exist
    await expect(
      stat(join(testDir, 'sessions', 'session-ses-archive.jsonl'))
    ).rejects.toMatchObject({ code: 'ENOENT' });

    // Destination should exist and contain original data
    const content = await readFile(join(testDir, 'archive', 'session-ses-archive.jsonl'), 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim() !== '');
    expect(lines).toHaveLength(1);
    expect((JSON.parse(lines[0]) as AngelEyeEvent).session_id).toBe('ses-archive');
  });

  it('throws if source file does not exist', async () => {
    await initAngelEyeDirs();
    await expect(archiveSession('ses-nonexistent')).rejects.toThrow();
  });
});

// ── writeSessionName ──────────────────────────────────────────────────────────

describe('writeSessionName', () => {
  // We need a real tmpdir that simulates ~/.claude/projects/<encoded>/<sessionId>.jsonl
  // We use a separate fakeClaude dir that acts as homedir for path construction tests.
  // writeSessionName uses os.homedir() internally, so we create the directory at the
  // real expected location under a tmp root and use an absolute path for projectDir.

  let fakeClaudeDir: string;
  let fakeTmpRoot: string;

  beforeEach(async () => {
    fakeTmpRoot = await mkdtemp(join(tmpdir(), 'angeleye-wb02-'));
    // We'll create a fake projects directory structure inside fakeTmpRoot
    fakeClaudeDir = join(fakeTmpRoot, '.claude', 'projects');
    await mkdir(fakeClaudeDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(fakeTmpRoot, { recursive: true, force: true });
  });

  it('does not throw when JSONL file does not exist (logs warning and returns)', async () => {
    // Use a real absolute project dir; JSONL won't exist under real homedir — that's fine
    // We call writeSessionName with a bogus session id that won't exist
    await expect(
      writeSessionName('ses-nonexistent-12345', 'my-name', '/tmp/nonexistent-project-dir-xyz')
    ).resolves.toBeUndefined();
  });

  it('appends both custom-title and agent-name entries to existing JSONL', async () => {
    // Build the encoded path manually
    const projectDir = '/Users/testuser/dev/myproject';
    const sessionId = 'ses-wb02-append';

    // Create the JSONL file at the real ~/.claude/projects/<encoded>/<sessionId>.jsonl path
    const realEncoded = projectDir.replace(/\//g, '-');
    const sessionDir = join(homedir(), '.claude', 'projects', realEncoded);
    const jsonlPath = join(sessionDir, `${sessionId}.jsonl`);

    await mkdir(sessionDir, { recursive: true });
    await writeFile(jsonlPath, '{"type":"existing","data":"before"}\n', 'utf-8');

    try {
      await writeSessionName(sessionId, 'my-test-session', projectDir);

      const content = await readFile(jsonlPath, 'utf-8');
      const lines = content.split('\n').filter((l) => l.trim() !== '');

      expect(lines).toHaveLength(3); // original + 2 appended
      const second = JSON.parse(lines[1]) as {
        type: string;
        customTitle: string;
        sessionId: string;
      };
      const third = JSON.parse(lines[2]) as { type: string; agentName: string; sessionId: string };

      expect(second.type).toBe('custom-title');
      expect(second.customTitle).toBe('my-test-session');
      expect(second.sessionId).toBe(sessionId);

      expect(third.type).toBe('agent-name');
      expect(third.agentName).toBe('my-test-session');
      expect(third.sessionId).toBe(sessionId);
    } finally {
      // Clean up the real file we created
      await rm(sessionDir, { recursive: true, force: true });
    }
  });

  it('derives the correct encoded path from projectDir (/ replaced with -)', async () => {
    const projectDir = '/Users/davidcruwys/dev/ad/apps/angeleye';
    const sessionId = 'ses-wb02-encode';
    const expectedEncoded = '-Users-davidcruwys-dev-ad-apps-angeleye';
    const sessionDir = join(homedir(), '.claude', 'projects', expectedEncoded);
    const jsonlPath = join(sessionDir, `${sessionId}.jsonl`);

    await mkdir(sessionDir, { recursive: true });
    await writeFile(jsonlPath, '', 'utf-8');

    try {
      await writeSessionName(sessionId, 'encode-test', projectDir);

      const content = await readFile(jsonlPath, 'utf-8');
      const lines = content.split('\n').filter((l) => l.trim() !== '');

      expect(lines).toHaveLength(2);
      const first = JSON.parse(lines[0]) as { type: string };
      expect(first.type).toBe('custom-title');
    } finally {
      await rm(sessionDir, { recursive: true, force: true });
    }
  });

  it('appending twice creates two pairs of entries in the JSONL file', async () => {
    const projectDir = '/Users/testuser/dev/doublecall';
    const sessionId = 'ses-wb02-double';
    const encoded = projectDir.replace(/\//g, '-');
    const sessionDir = join(homedir(), '.claude', 'projects', encoded);
    const jsonlPath = join(sessionDir, `${sessionId}.jsonl`);

    await mkdir(sessionDir, { recursive: true });
    await writeFile(jsonlPath, '', 'utf-8');

    try {
      await writeSessionName(sessionId, 'first-name', projectDir);
      await writeSessionName(sessionId, 'second-name', projectDir);

      const content = await readFile(jsonlPath, 'utf-8');
      const lines = content.split('\n').filter((l) => l.trim() !== '');

      expect(lines).toHaveLength(4); // 2 pairs

      const entries = lines.map(
        (l) => JSON.parse(l) as { type: string; customTitle?: string; agentName?: string }
      );
      expect(entries[0]?.type).toBe('custom-title');
      expect(entries[0]?.customTitle).toBe('first-name');
      expect(entries[1]?.type).toBe('agent-name');
      expect(entries[1]?.agentName).toBe('first-name');
      expect(entries[2]?.type).toBe('custom-title');
      expect(entries[2]?.customTitle).toBe('second-name');
      expect(entries[3]?.type).toBe('agent-name');
      expect(entries[3]?.agentName).toBe('second-name');
    } finally {
      await rm(sessionDir, { recursive: true, force: true });
    }
  });
});
