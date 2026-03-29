import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { RegistryEntry } from '@appystack/shared';
import {
  correlateAffinityGroups,
  extractStoryId,
  loadAffinityGroups,
  saveAffinityGroups,
} from './correlator.service.js';
import { _setDataDir, initAngelEyeDirs } from './registry.service.js';

let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'angeleye-correlator-test-'));
  _setDataDir(testDir);
  await initAngelEyeDirs();
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

// ── extractStoryId ──────────────────────────────────────────────────────────

describe('extractStoryId', () => {
  it('extracts "2.4" from "DS 2.4"', () => {
    expect(extractStoryId('DS 2.4')).toBe('2.4');
  });

  it('extracts "2.4" from "Story 2.4"', () => {
    expect(extractStoryId('Story 2.4')).toBe('2.4');
  });

  it('extracts "0.1" from "0.1"', () => {
    expect(extractStoryId('0.1')).toBe('0.1');
  });

  it('returns null for null input', () => {
    expect(extractStoryId(null)).toBeNull();
  });

  it('returns null for text without story IDs', () => {
    expect(extractStoryId('just some text')).toBeNull();
  });

  it('extracts first story ID from "DR 2.4 retry"', () => {
    expect(extractStoryId('DR 2.4 retry')).toBe('2.4');
  });
});

// ── correlateAffinityGroups ─────────────────────────────────────────────────

function makeEntry(overrides: Partial<RegistryEntry> & { session_id: string }): RegistryEntry {
  return {
    project: 'test',
    project_dir: '/projects/test',
    started_at: '2026-03-01T10:00:00.000Z',
    last_active: '2026-03-01T11:00:00.000Z',
    name: null,
    tags: [],
    workspace_id: null,
    status: 'ended',
    source: 'hook',
    ...overrides,
  };
}

describe('correlateAffinityGroups', () => {
  it('returns empty when no entries have workflow data', () => {
    const entries: RegistryEntry[] = [
      makeEntry({ session_id: 'a' }),
      makeEntry({ session_id: 'b' }),
    ];

    const result = correlateAffinityGroups(entries);
    expect(result.groups).toHaveLength(0);
    expect(result.session_group_map).toEqual({});
  });

  it('returns empty for a single session with a story ID (needs 2+ to group)', () => {
    const entries: RegistryEntry[] = [
      makeEntry({
        session_id: 'a',
        trigger_command: 'bmad-dev',
        trigger_arguments: 'DS 2.4',
      }),
    ];

    const result = correlateAffinityGroups(entries);
    expect(result.groups).toHaveLength(0);
  });

  describe('Signal 1 — story ID grouping', () => {
    it('groups sessions sharing the same story ID', () => {
      const entries: RegistryEntry[] = [
        makeEntry({
          session_id: 'ds-session',
          trigger_command: 'bmad-dev',
          trigger_arguments: 'DS 2.4',
          started_at: '2026-03-01T10:00:00.000Z',
          workflow_role: 'builder',
          workflow_identity: 'Amelia',
        }),
        makeEntry({
          session_id: 'dr-session',
          trigger_command: 'bmad-dr',
          trigger_arguments: 'DR 2.4',
          started_at: '2026-03-01T12:00:00.000Z',
          workflow_role: 'reviewer',
          workflow_identity: 'Nate',
        }),
        makeEntry({
          session_id: 'other-session',
          trigger_command: 'bmad-dev',
          trigger_arguments: 'DS 3.1',
          started_at: '2026-03-01T14:00:00.000Z',
        }),
      ];

      const result = correlateAffinityGroups(entries);
      expect(result.groups).toHaveLength(1);

      const group = result.groups[0]!;
      expect(group.group_type).toBe('story_unit');
      expect(group.label).toBe('Story 2.4');
      expect(group.confidence).toBe('deterministic');
      expect(group.session_ids).toContain('ds-session');
      expect(group.session_ids).toContain('dr-session');
      expect(group.session_ids).not.toContain('other-session');
      expect(group.metadata?.story_id).toBe('2.4');
      expect(group.metadata?.epic_id).toBe('2');
      expect(group.metadata?.agents).toContain('Amelia');
      expect(group.metadata?.agents).toContain('Nate');
    });

    it('does not group sessions more than 7 days apart', () => {
      const entries: RegistryEntry[] = [
        makeEntry({
          session_id: 'early',
          trigger_command: 'bmad-dev',
          trigger_arguments: 'DS 2.4',
          started_at: '2026-03-01T10:00:00.000Z',
        }),
        makeEntry({
          session_id: 'late',
          trigger_command: 'bmad-dr',
          trigger_arguments: 'DR 2.4',
          started_at: '2026-03-15T10:00:00.000Z',
        }),
      ];

      const result = correlateAffinityGroups(entries);
      expect(result.groups).toHaveLength(0);
    });

    it('adds chain ordering metadata', () => {
      const entries: RegistryEntry[] = [
        makeEntry({
          session_id: 'wn-session',
          trigger_command: 'bmad-sm',
          trigger_arguments: 'WN 2.4',
          started_at: '2026-03-01T08:00:00.000Z',
          workflow_role: 'planner',
        }),
        makeEntry({
          session_id: 'ds-session',
          trigger_command: 'bmad-dev',
          trigger_arguments: 'DS 2.4',
          started_at: '2026-03-01T10:00:00.000Z',
          workflow_role: 'builder',
        }),
        makeEntry({
          session_id: 'dr-session',
          trigger_command: 'bmad-dr',
          trigger_arguments: 'DR 2.4',
          started_at: '2026-03-01T12:00:00.000Z',
          workflow_role: 'reviewer',
        }),
      ];

      const result = correlateAffinityGroups(entries);
      expect(result.groups).toHaveLength(1);

      const group = result.groups[0]!;
      expect(group.session_ids).toEqual(['wn-session', 'ds-session', 'dr-session']);
      expect(group.metadata?.chain_steps).toEqual(['planner', 'builder', 'reviewer']);
      expect(group.metadata?.backtracks).toBe(0);
    });

    it('detects backtracks when same role appears twice', () => {
      const entries: RegistryEntry[] = [
        makeEntry({
          session_id: 'dr-1',
          trigger_command: 'bmad-dr',
          trigger_arguments: 'DR 2.4',
          started_at: '2026-03-01T10:00:00.000Z',
          workflow_role: 'reviewer',
        }),
        makeEntry({
          session_id: 'ds-fix',
          trigger_command: 'bmad-dev',
          trigger_arguments: 'DS 2.4',
          started_at: '2026-03-01T12:00:00.000Z',
          workflow_role: 'builder',
        }),
        makeEntry({
          session_id: 'dr-2',
          trigger_command: 'bmad-dr',
          trigger_arguments: 'DR 2.4',
          started_at: '2026-03-01T14:00:00.000Z',
          workflow_role: 'reviewer',
        }),
      ];

      const result = correlateAffinityGroups(entries);
      expect(result.groups).toHaveLength(1);

      const group = result.groups[0]!;
      expect(group.metadata?.backtracks).toBe(1);
      expect(group.metadata?.backtrack_details).toEqual(['reviewer:DR@3']);
    });
  });

  describe('Signal 2 — temporal proximity with overlay', () => {
    it('groups overlay sessions within 4 hours when no story ID', () => {
      const entries: RegistryEntry[] = [
        makeEntry({
          session_id: 'a',
          trigger_command: 'bmad-dev',
          started_at: '2026-03-01T10:00:00.000Z',
          workflow_role: 'builder',
          workflow_identity: 'Amelia',
        }),
        makeEntry({
          session_id: 'b',
          trigger_command: 'bmad-sm',
          started_at: '2026-03-01T12:00:00.000Z',
          workflow_role: 'planner',
          workflow_identity: 'Bob',
        }),
      ];

      const result = correlateAffinityGroups(entries);
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0]!.group_type).toBe('ad_hoc');
      expect(result.groups[0]!.confidence).toBe('heuristic');
    });

    it('does not group overlay sessions more than 4 hours apart', () => {
      const entries: RegistryEntry[] = [
        makeEntry({
          session_id: 'a',
          trigger_command: 'bmad-dev',
          started_at: '2026-03-01T08:00:00.000Z',
          workflow_role: 'builder',
        }),
        makeEntry({
          session_id: 'b',
          trigger_command: 'bmad-sm',
          started_at: '2026-03-01T16:00:00.000Z',
          workflow_role: 'planner',
        }),
      ];

      const result = correlateAffinityGroups(entries);
      expect(result.groups).toHaveLength(0);
    });
  });

  describe('session_group_map', () => {
    it('maps session IDs to their group IDs', () => {
      const entries: RegistryEntry[] = [
        makeEntry({
          session_id: 'a',
          trigger_command: 'bmad-dev',
          trigger_arguments: 'DS 2.4',
          started_at: '2026-03-01T10:00:00.000Z',
        }),
        makeEntry({
          session_id: 'b',
          trigger_command: 'bmad-dr',
          trigger_arguments: 'DR 2.4',
          started_at: '2026-03-01T12:00:00.000Z',
        }),
      ];

      const result = correlateAffinityGroups(entries);
      expect(result.session_group_map['a']).toHaveLength(1);
      expect(result.session_group_map['b']).toHaveLength(1);
      expect(result.session_group_map['a']![0]).toBe(result.groups[0]!.group_id);
    });
  });

  it('skips junk sessions', () => {
    const entries: RegistryEntry[] = [
      makeEntry({
        session_id: 'a',
        trigger_command: 'bmad-dev',
        trigger_arguments: 'DS 2.4',
        started_at: '2026-03-01T10:00:00.000Z',
        is_junk: true,
      }),
      makeEntry({
        session_id: 'b',
        trigger_command: 'bmad-dr',
        trigger_arguments: 'DR 2.4',
        started_at: '2026-03-01T12:00:00.000Z',
        is_junk: true,
      }),
    ];

    const result = correlateAffinityGroups(entries);
    expect(result.groups).toHaveLength(0);
  });
});

// ── Storage tests ───────────────────────────────────────────────────────────

describe('affinity group storage', () => {
  it('loadAffinityGroups returns empty array when file does not exist', async () => {
    const groups = await loadAffinityGroups();
    expect(groups).toEqual([]);
  });

  it('saveAffinityGroups + loadAffinityGroups round-trips', async () => {
    const groups = [
      {
        group_id: 'test-1',
        group_type: 'story_unit' as const,
        label: 'Story 2.4',
        session_ids: ['a', 'b'],
        confidence: 'deterministic' as const,
        created_at: '2026-03-01T10:00:00.000Z',
      },
    ];

    await saveAffinityGroups(groups);
    const loaded = await loadAffinityGroups();

    expect(loaded).toHaveLength(1);
    expect(loaded[0]!.group_id).toBe('test-1');
    expect(loaded[0]!.label).toBe('Story 2.4');
    expect(loaded[0]!.session_ids).toEqual(['a', 'b']);
  });
});
