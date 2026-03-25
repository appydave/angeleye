import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { _setDataDir, initAngelEyeDirs } from './registry.service.js';
import { detectSurprises, auditPayload, type SchemaExpectation } from './schema-auditor.service.js';

let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'angeleye-audit-test-'));
  _setDataDir(testDir);
  await initAngelEyeDirs();
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

// ── detectSurprises (pure) ───────────────────────────────────────────────────

describe('detectSurprises', () => {
  const expectations: Record<string, SchemaExpectation> = {
    test_event: {
      fields: {
        name: { type: 'string', required: true },
        count: { type: 'number' },
        tags: { type: 'array' },
      },
    },
  };

  it('returns empty when payload matches expectations', () => {
    const payload = {
      session_id: 'ses-1',
      cwd: '/tmp',
      hook_event_name: 'TestEvent',
      name: 'hello',
      count: 42,
      tags: ['a', 'b'],
    };
    const result = detectSurprises('TestEvent', 'test_event', payload, expectations);
    expect(result).toEqual([]);
  });

  it('reports missing required field', () => {
    const payload = { session_id: 'ses-1', count: 5 };
    const result = detectSurprises('TestEvent', 'test_event', payload, expectations);
    expect(result).toContainEqual({ field: 'name', expected: 'string', got: 'missing' });
  });

  it('does not report missing optional field', () => {
    const payload = { session_id: 'ses-1', name: 'hello' };
    const result = detectSurprises('TestEvent', 'test_event', payload, expectations);
    const countSurprise = result.find((s) => s.field === 'count');
    expect(countSurprise).toBeUndefined();
  });

  it('reports unexpected extra field', () => {
    const payload = { session_id: 'ses-1', name: 'hello', surprise_field: true };
    const result = detectSurprises('TestEvent', 'test_event', payload, expectations);
    expect(result).toContainEqual({ field: 'surprise_field', expected: 'missing', got: 'boolean' });
  });

  it('reports wrong type', () => {
    const payload = { session_id: 'ses-1', name: 123 };
    const result = detectSurprises('TestEvent', 'test_event', payload, expectations);
    expect(result).toContainEqual({ field: 'name', expected: 'string', got: 'number' });
  });

  it('returns empty for unknown event type', () => {
    const payload = { session_id: 'ses-1', anything: 'goes' };
    const result = detectSurprises('Unknown', 'no_such_event', payload, expectations);
    expect(result).toEqual([]);
  });

  it('ignores common fields as surprises', () => {
    const payload = {
      session_id: 'ses-1',
      cwd: '/tmp',
      hook_event_name: 'TestEvent',
      transcript_path: '/path',
      permission_mode: 'ask',
      stop_hook_active: false,
      agent_id: 'agent-1',
      agent_type: 'Explore',
      name: 'hello',
    };
    const result = detectSurprises('TestEvent', 'test_event', payload, expectations);
    expect(result).toEqual([]);
  });
});

// ── auditPayload (I/O) ──────────────────────────────────────────────────────

describe('auditPayload', () => {
  it('writes audit line when surprises exist', async () => {
    // tool_use expects tool_name (required), so omitting it produces a surprise
    await auditPayload('PostToolUse', 'tool_use', {
      session_id: 'ses-1',
      cwd: '/tmp',
    });

    const filePath = join(testDir, 'audit', 'hook-schema-surprises.jsonl');
    const raw = await readFile(filePath, 'utf-8');
    const lines = raw.trim().split('\n');
    expect(lines.length).toBe(1);

    const entry = JSON.parse(lines[0]) as Record<string, unknown>;
    expect(entry.hook).toBe('PostToolUse');
    expect(entry.event_type).toBe('tool_use');
    expect(Array.isArray(entry.surprises)).toBe(true);
    expect((entry.surprises as Array<unknown>).length).toBeGreaterThan(0);
  });

  it('does not write when no surprises', async () => {
    // session_start has no required fields and no expected fields
    await auditPayload('SessionStart', 'session_start', {
      session_id: 'ses-1',
      cwd: '/tmp',
      hook_event_name: 'SessionStart',
    });

    const filePath = join(testDir, 'audit', 'hook-schema-surprises.jsonl');
    await expect(readFile(filePath, 'utf-8')).rejects.toThrow();
  });

  it('never throws on broken directory', async () => {
    // Point to a nonexistent nested path that can't be created
    _setDataDir('/dev/null/impossible/path');
    // Should not throw
    await expect(
      auditPayload('PostToolUse', 'tool_use', { session_id: 'ses-1' })
    ).resolves.toBeUndefined();
  });
});
