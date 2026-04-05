import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { RegistryEntry, WorkflowType } from '@appystack/shared';

// Mock dependencies — must be before importing the module under test
vi.mock('./registry.service.js', () => ({
  readRegistry: vi.fn(),
  getDataDir: vi.fn(() => '/tmp/angeleye-test'),
}));
vi.mock('./workflow-type.service.js', () => ({
  getWorkflowType: vi.fn(),
}));

import { readRegistry } from './registry.service.js';
import { getWorkflowType } from './workflow-type.service.js';
import { _setWorkflowDir, readWorkflows } from './workflow.service.js';
import { seedWorkflowsFromRegistry } from './workflow-router.service.js';

const mockReadRegistry = vi.mocked(readRegistry);
const mockGetWorkflowType = vi.mocked(getWorkflowType);

// ── Test fixtures ─────────────────────────────────────────────────────────────

const regularStoryType: WorkflowType = {
  id: 'regular_story',
  name: 'BMAD Story',
  domain: 'bmad-v6',
  ceremony_level: 'full',
  stations: [
    {
      position: 0,
      action_code: 'WN',
      role: 'planner',
      identity: 'Bob',
      requires_fresh_session: true,
      can_spawn_subagents: false,
      backtrack_target: false,
    },
    {
      position: 1,
      action_code: 'CS',
      role: 'planner',
      identity: 'Bob',
      requires_fresh_session: true,
      can_spawn_subagents: false,
      backtrack_target: true,
    },
    {
      position: 2,
      action_code: 'VS',
      role: 'planner',
      identity: 'Bob',
      requires_fresh_session: true,
      can_spawn_subagents: false,
      backtrack_target: false,
    },
    {
      position: 3,
      action_code: 'DS',
      role: 'builder',
      identity: 'Amelia',
      requires_fresh_session: true,
      can_spawn_subagents: true,
      backtrack_target: true,
    },
    {
      position: 4,
      action_code: 'DR',
      role: 'reviewer',
      identity: 'Nate',
      requires_fresh_session: true,
      can_spawn_subagents: true,
      backtrack_target: false,
    },
    {
      position: 5,
      action_code: 'SAT-CS',
      role: 'tester',
      identity: 'Taylor',
      requires_fresh_session: false,
      can_spawn_subagents: false,
      backtrack_target: false,
    },
    {
      position: 6,
      action_code: 'SAT-RA',
      role: 'tester',
      identity: 'Taylor',
      requires_fresh_session: false,
      can_spawn_subagents: false,
      backtrack_target: false,
    },
    {
      position: 7,
      action_code: 'CU',
      role: 'advisor',
      identity: 'Lisa',
      requires_fresh_session: true,
      can_spawn_subagents: false,
      backtrack_target: false,
    },
    {
      position: 8,
      action_code: 'SHIP',
      role: 'shipper',
      identity: null,
      requires_fresh_session: true,
      can_spawn_subagents: false,
      backtrack_target: false,
    },
  ],
  skip_rules: [],
};

function makeEntry(overrides: Partial<RegistryEntry> & { session_id: string }): RegistryEntry {
  return {
    project: 'angeleye',
    project_dir: '/dev/test',
    started_at: '2026-03-28T10:00:00.000Z',
    last_active: '2026-03-28T11:00:00.000Z',
    name: null,
    tags: [],
    workspace_id: null,
    status: 'active',
    source: 'hook',
    ...overrides,
  };
}

// ── Test setup ────────────────────────────────────────────────────────────────

let testDir: string;

beforeEach(async () => {
  vi.clearAllMocks();
  testDir = await mkdtemp(join(tmpdir(), 'angeleye-router-test-'));
  _setWorkflowDir(testDir);
  mockGetWorkflowType.mockResolvedValue(regularStoryType);
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

// ── parseAction tests (tested indirectly via seedWorkflowsFromRegistry) ───────

describe('parseAction — indirect via seed', () => {
  it('routes "DS 2.2" → builder DS station for story 2.2', async () => {
    mockReadRegistry.mockResolvedValueOnce({
      s1: makeEntry({
        session_id: 's1',
        trigger_command: 'bmad-dev',
        workflow_role: 'builder',
        workflow_action: 'DS 2.2',
      }),
    });

    const result = await seedWorkflowsFromRegistry();

    expect(result.sessions_routed).toBe(1);
    expect(result.workflows_created).toBe(1);

    const workflows = await readWorkflows();
    expect(workflows).toHaveLength(1);
    expect(workflows[0]!.work_item_id).toBe('2.2');
    expect(workflows[0]!.work_item_label).toBe('Story 2.2');

    // Session should be in DS station (position 3)
    const dsStation = workflows[0]!.stations.find((s) => s.position === 3);
    expect(dsStation!.session_ids).toContain('s1');
    expect(dsStation!.state).toBe('in_progress');
  });

  it('treats "wn" as gatekeeper with no story — unroutable with gatekeeper reason', async () => {
    mockReadRegistry.mockResolvedValueOnce({
      s1: makeEntry({
        session_id: 's1',
        trigger_command: 'bmad-sm',
        workflow_role: 'planner',
        workflow_action: 'wn',
      }),
    });

    const result = await seedWorkflowsFromRegistry();

    expect(result.sessions_routed).toBe(0);
    expect(result.sessions_unroutable).toBe(1);
    expect(result.unroutable_reasons[0]!.reason).toBe(
      'gatekeeper session (WN) — pending workflow association'
    );
  });

  it('treats "2.3" (digits only) as unparseable — unroutable', async () => {
    mockReadRegistry.mockResolvedValueOnce({
      s1: makeEntry({
        session_id: 's1',
        trigger_command: 'bmad-sm',
        workflow_role: 'planner',
        workflow_action: '2.3',
      }),
    });

    const result = await seedWorkflowsFromRegistry();

    expect(result.sessions_unroutable).toBe(1);
    expect(result.unroutable_reasons[0]!.reason).toContain('action code missing');
  });

  it('treats null workflow_action as unroutable', async () => {
    mockReadRegistry.mockResolvedValueOnce({
      s1: makeEntry({
        session_id: 's1',
        trigger_command: 'bmad-sm',
        workflow_role: 'planner',
        workflow_action: null,
      }),
    });

    const result = await seedWorkflowsFromRegistry();

    expect(result.sessions_unroutable).toBe(1);
    expect(result.unroutable_reasons[0]!.reason).toContain('null workflow_action');
  });

  it('routes "CS 0.2" → planner CS station for story 0.2', async () => {
    mockReadRegistry.mockResolvedValueOnce({
      s1: makeEntry({
        session_id: 's1',
        trigger_command: 'bmad-sm',
        workflow_role: 'planner',
        workflow_action: 'CS 0.2',
      }),
    });

    const result = await seedWorkflowsFromRegistry();

    expect(result.sessions_routed).toBe(1);

    const workflows = await readWorkflows();
    expect(workflows).toHaveLength(1);
    expect(workflows[0]!.work_item_id).toBe('0.2');

    // Planner CS is position 1
    const csStation = workflows[0]!.stations.find((s) => s.position === 1);
    expect(csStation!.session_ids).toContain('s1');
  });
});

// ── Station map disambiguation ────────────────────────────────────────────────

describe('station map — role+action disambiguation', () => {
  it('maps tester+CS to SAT-CS (position 5), not planner CS (position 1)', async () => {
    mockReadRegistry.mockResolvedValueOnce({
      's-tester': makeEntry({
        session_id: 's-tester',
        trigger_command: 'bmad-sat',
        workflow_role: 'tester',
        workflow_action: 'CS 2.2',
      }),
      's-planner': makeEntry({
        session_id: 's-planner',
        trigger_command: 'bmad-sm',
        workflow_role: 'planner',
        workflow_action: 'CS 2.2',
      }),
    });

    const result = await seedWorkflowsFromRegistry();

    expect(result.sessions_routed).toBe(2);
    expect(result.workflows_created).toBe(1);

    const workflows = await readWorkflows();
    const wf = workflows[0]!;

    // Tester CS → SAT-CS position 5
    const satCs = wf.stations.find((s) => s.position === 5);
    expect(satCs!.session_ids).toContain('s-tester');

    // Planner CS → CS position 1
    const plannerCs = wf.stations.find((s) => s.position === 1);
    expect(plannerCs!.session_ids).toContain('s-planner');
  });
});

// ── Full seed with mock registry ──────────────────────────────────────────────

describe('seedWorkflowsFromRegistry — full seed', () => {
  it('creates workflows and associates sessions correctly across multiple stories', async () => {
    mockReadRegistry.mockResolvedValueOnce({
      s1: makeEntry({
        session_id: 's1',
        trigger_command: 'bmad-dev',
        workflow_role: 'builder',
        workflow_action: 'DS 2.2',
      }),
      s2: makeEntry({
        session_id: 's2',
        trigger_command: 'bmad-sm',
        workflow_role: 'reviewer',
        workflow_action: 'DR 2.2',
      }),
      s3: makeEntry({
        session_id: 's3',
        trigger_command: 'bmad-dev',
        workflow_role: 'builder',
        workflow_action: 'DS 0.2',
      }),
      s4: makeEntry({
        session_id: 's4',
        trigger_command: 'bmad-sat',
        workflow_role: 'tester',
        workflow_action: 'CS 0.2',
      }),
      // Unroutable: oversight with null action
      s5: makeEntry({
        session_id: 's5',
        trigger_command: 'bmad-oversight',
        workflow_role: 'observer',
        workflow_action: null,
      }),
      // Non-BMAD session — should be ignored entirely
      s6: makeEntry({
        session_id: 's6',
        trigger_command: null,
      }),
    });

    const result = await seedWorkflowsFromRegistry();

    expect(result.workflows_created).toBe(2); // story 2.2 + story 0.2
    expect(result.sessions_routed).toBe(4);
    expect(result.sessions_unroutable).toBe(1); // oversight
    expect(result.unroutable_reasons).toHaveLength(1);
    expect(result.unroutable_reasons[0]!.session_id).toBe('s5');

    const workflows = await readWorkflows();
    expect(workflows).toHaveLength(2);

    // Verify story 2.2 workflow
    const wf22 = workflows.find((w) => w.work_item_id === '2.2');
    expect(wf22).toBeDefined();
    expect(wf22!.status).toBe('in_progress');

    // DS station (3) has s1, DR station (4) has s2
    expect(wf22!.stations.find((s) => s.position === 3)!.session_ids).toContain('s1');
    expect(wf22!.stations.find((s) => s.position === 4)!.session_ids).toContain('s2');

    // current_station should be the highest in-progress
    expect(wf22!.current_station).toBe(4);

    // Verify story 0.2 workflow
    const wf02 = workflows.find((w) => w.work_item_id === '0.2');
    expect(wf02).toBeDefined();
    expect(wf02!.stations.find((s) => s.position === 3)!.session_ids).toContain('s3');
    expect(wf02!.stations.find((s) => s.position === 5)!.session_ids).toContain('s4');
  });
});

// ── Idempotency ───────────────────────────────────────────────────────────────

describe('seed idempotency', () => {
  it('running seed twice produces same result — no duplicate workflows or sessions', async () => {
    const registryData = {
      s1: makeEntry({
        session_id: 's1',
        trigger_command: 'bmad-dev',
        workflow_role: 'builder',
        workflow_action: 'DS 2.5',
      }),
      s2: makeEntry({
        session_id: 's2',
        trigger_command: 'bmad-sat',
        workflow_role: 'tester',
        workflow_action: 'CS 2.5',
      }),
    };

    // First seed
    mockReadRegistry.mockResolvedValueOnce(registryData);
    const result1 = await seedWorkflowsFromRegistry();
    expect(result1.workflows_created).toBe(1);
    expect(result1.sessions_routed).toBe(2);

    // Second seed — same data
    mockReadRegistry.mockResolvedValueOnce(registryData);
    const result2 = await seedWorkflowsFromRegistry();
    expect(result2.workflows_created).toBe(0); // no new workflows
    expect(result2.workflows_updated).toBe(0); // no updates — sessions already present
    expect(result2.sessions_routed).toBe(0); // no new sessions routed

    // Still only one workflow on disk
    const workflows = await readWorkflows();
    expect(workflows).toHaveLength(1);

    // No duplicate session_ids
    const dsStation = workflows[0]!.stations.find((s) => s.position === 3);
    expect(dsStation!.session_ids).toEqual(['s1']);
    const satCsStation = workflows[0]!.stations.find((s) => s.position === 5);
    expect(satCsStation!.session_ids).toEqual(['s2']);
  });
});

// ── Unroutable reasons ────────────────────────────────────────────────────────

describe('unroutable sessions logged with reasons', () => {
  it('logs oversight, relay, retrospective, and null-action sessions as unroutable', async () => {
    mockReadRegistry.mockResolvedValueOnce({
      'oversight-1': makeEntry({
        session_id: 'oversight-1',
        trigger_command: 'bmad-oversight',
        workflow_role: 'observer',
        workflow_action: null,
      }),
      'relay-1': makeEntry({
        session_id: 'relay-1',
        trigger_command: 'bmad-relay',
        workflow_role: null,
        workflow_action: null,
      }),
      'retro-1': makeEntry({
        session_id: 'retro-1',
        trigger_command: 'bmad-retrospective',
        workflow_action: null,
      }),
      'ship-1': makeEntry({
        session_id: 'ship-1',
        trigger_command: 'bmad-ship',
        workflow_role: 'shipper',
        workflow_action: null,
      }),
    });

    const result = await seedWorkflowsFromRegistry();

    expect(result.sessions_unroutable).toBe(4);
    expect(result.sessions_routed).toBe(0);
    expect(result.workflows_created).toBe(0);

    // All have reasons containing the command context
    const ids = result.unroutable_reasons.map((r) => r.session_id);
    expect(ids).toContain('oversight-1');
    expect(ids).toContain('relay-1');
    expect(ids).toContain('retro-1');
    expect(ids).toContain('ship-1');

    // Verify reasons mention null workflow_action
    for (const entry of result.unroutable_reasons) {
      expect(entry.reason).toContain('null workflow_action');
    }
  });

  it('logs session with no workflow_role as unroutable', async () => {
    mockReadRegistry.mockResolvedValueOnce({
      'no-role': makeEntry({
        session_id: 'no-role',
        trigger_command: 'bmad-dev',
        workflow_action: 'DS 2.2',
        workflow_role: null,
      }),
    });

    const result = await seedWorkflowsFromRegistry();

    expect(result.sessions_unroutable).toBe(1);
    expect(result.unroutable_reasons[0]!.reason).toContain('no workflow_role');
  });
});

// ── Dry run mode ──────────────────────────────────────────────────────────────

describe('dry run mode', () => {
  it('returns results without writing workflows to disk', async () => {
    mockReadRegistry.mockResolvedValueOnce({
      s1: makeEntry({
        session_id: 's1',
        trigger_command: 'bmad-dev',
        workflow_role: 'builder',
        workflow_action: 'DS 2.6',
      }),
      s2: makeEntry({
        session_id: 's2',
        trigger_command: 'bmad-sm',
        workflow_role: 'reviewer',
        workflow_action: 'DR 2.6',
      }),
      unr: makeEntry({
        session_id: 'unr',
        trigger_command: 'bmad-oversight',
        workflow_action: null,
      }),
    });

    const result = await seedWorkflowsFromRegistry({ dryRun: true });

    expect(result.workflows_created).toBe(1);
    expect(result.sessions_routed).toBe(2);
    expect(result.sessions_unroutable).toBe(1);

    // Nothing written to disk
    const workflows = await readWorkflows();
    expect(workflows).toHaveLength(0);
  });
});

// ── Multi-session per station ─────────────────────────────────────────────────

describe('multi-session per station', () => {
  it('appends both session_ids when two sessions route to the same station', async () => {
    mockReadRegistry.mockResolvedValueOnce({
      's1-ds': makeEntry({
        session_id: 's1-ds',
        trigger_command: 'bmad-dev',
        workflow_role: 'builder',
        workflow_action: 'DS 2.2',
      }),
      's2-ds': makeEntry({
        session_id: 's2-ds',
        trigger_command: 'bmad-dev',
        workflow_role: 'builder',
        workflow_action: 'DS 2.2',
      }),
    });

    const result = await seedWorkflowsFromRegistry();

    expect(result.workflows_created).toBe(1);
    expect(result.sessions_routed).toBe(2);

    const workflows = await readWorkflows();
    const dsStation = workflows[0]!.stations.find((s) => s.position === 3);
    expect(dsStation!.session_ids).toContain('s1-ds');
    expect(dsStation!.session_ids).toContain('s2-ds');
    expect(dsStation!.session_ids).toHaveLength(2);
  });
});

// ── Incremental seed ─────────────────────────────────────────────────────────

describe('incremental seed — new sessions added to existing workflow', () => {
  it('routes new sessions to existing workflow and increments workflows_updated', async () => {
    // First seed: one session
    mockReadRegistry.mockResolvedValueOnce({
      s1: makeEntry({
        session_id: 's1',
        trigger_command: 'bmad-dev',
        workflow_role: 'builder',
        workflow_action: 'DS 2.2',
      }),
    });
    await seedWorkflowsFromRegistry();

    // Second seed: original session + a new one for a different station
    mockReadRegistry.mockResolvedValueOnce({
      s1: makeEntry({
        session_id: 's1',
        trigger_command: 'bmad-dev',
        workflow_role: 'builder',
        workflow_action: 'DS 2.2',
      }),
      s2: makeEntry({
        session_id: 's2',
        trigger_command: 'bmad-sm',
        workflow_role: 'reviewer',
        workflow_action: 'DR 2.2',
      }),
    });

    const result = await seedWorkflowsFromRegistry();

    expect(result.workflows_created).toBe(0);
    expect(result.workflows_updated).toBe(1);
    expect(result.sessions_routed).toBe(1); // only s2 is new

    const workflows = await readWorkflows();
    expect(workflows).toHaveLength(1);
    const wf = workflows[0]!;

    // DS station has s1, DR station has s2
    expect(wf.stations.find((s) => s.position === 3)!.session_ids).toEqual(['s1']);
    expect(wf.stations.find((s) => s.position === 4)!.session_ids).toEqual(['s2']);
  });
});

// ── updated_at derived from session last_active ─────────────────────────────

describe('updated_at derived from session last_active', () => {
  it('sets updated_at to max last_active across all routed sessions, not seed execution time', async () => {
    const beforeSeed = new Date().toISOString();

    mockReadRegistry.mockResolvedValueOnce({
      s1: makeEntry({
        session_id: 's1',
        trigger_command: 'bmad-dev',
        workflow_role: 'builder',
        workflow_action: 'DS 2.2',
        last_active: '2026-03-20T09:00:00.000Z',
      }),
      s2: makeEntry({
        session_id: 's2',
        trigger_command: 'bmad-sm',
        workflow_role: 'reviewer',
        workflow_action: 'DR 2.2',
        last_active: '2026-03-22T15:30:00.000Z',
      }),
    });

    await seedWorkflowsFromRegistry();

    const workflows = await readWorkflows();
    expect(workflows).toHaveLength(1);
    const wf = workflows[0]!;

    // updated_at should be the latest last_active (s2), not the seed execution time
    expect(wf.updated_at).toBe('2026-03-22T15:30:00.000Z');
    // Sanity: it should be earlier than the seed execution time
    expect(wf.updated_at < beforeSeed).toBe(true);
  });

  it('uses latest last_active when incremental seed adds new sessions', async () => {
    // First seed
    mockReadRegistry.mockResolvedValueOnce({
      s1: makeEntry({
        session_id: 's1',
        trigger_command: 'bmad-dev',
        workflow_role: 'builder',
        workflow_action: 'DS 2.2',
        last_active: '2026-03-20T09:00:00.000Z',
      }),
    });
    await seedWorkflowsFromRegistry();

    // Second seed adds a newer session
    mockReadRegistry.mockResolvedValueOnce({
      s1: makeEntry({
        session_id: 's1',
        trigger_command: 'bmad-dev',
        workflow_role: 'builder',
        workflow_action: 'DS 2.2',
        last_active: '2026-03-20T09:00:00.000Z',
      }),
      s2: makeEntry({
        session_id: 's2',
        trigger_command: 'bmad-sm',
        workflow_role: 'reviewer',
        workflow_action: 'DR 2.2',
        last_active: '2026-03-25T18:00:00.000Z',
      }),
    });
    await seedWorkflowsFromRegistry();

    const workflows = await readWorkflows();
    const wf = workflows[0]!;
    expect(wf.updated_at).toBe('2026-03-25T18:00:00.000Z');
  });
});

// ── Station completion enrichment ────────────────────────────────────────────

describe('station completion enrichment', () => {
  it('marks station as completed when all sessions have ended', async () => {
    mockReadRegistry.mockResolvedValueOnce({
      s1: makeEntry({
        session_id: 's1',
        trigger_command: 'bmad-dev',
        workflow_role: 'builder',
        workflow_action: 'DS 2.2',
        status: 'ended',
        last_active: '2026-03-28T12:00:00.000Z',
      }),
    });

    await seedWorkflowsFromRegistry();

    const workflows = await readWorkflows();
    const dsStation = workflows[0]!.stations.find((s) => s.position === 3);
    expect(dsStation!.state).toBe('completed');
    expect(dsStation!.completed_at).toBeTruthy();
  });

  it('keeps station in_progress when sessions are a mix of ended and active', async () => {
    mockReadRegistry.mockResolvedValueOnce({
      's1-ds': makeEntry({
        session_id: 's1-ds',
        trigger_command: 'bmad-dev',
        workflow_role: 'builder',
        workflow_action: 'DS 2.2',
        status: 'ended',
        last_active: '2026-03-28T12:00:00.000Z',
      }),
      's2-ds': makeEntry({
        session_id: 's2-ds',
        trigger_command: 'bmad-dev',
        workflow_role: 'builder',
        workflow_action: 'DS 2.2',
        status: 'active',
        last_active: '2026-03-28T13:00:00.000Z',
      }),
    });

    await seedWorkflowsFromRegistry();

    const workflows = await readWorkflows();
    const dsStation = workflows[0]!.stations.find((s) => s.position === 3);
    expect(dsStation!.state).toBe('in_progress');
    expect(dsStation!.completed_at).toBeNull();
  });

  it('sets workflow status to closed when all populated stations are completed with substantial coverage', async () => {
    // Populate 5 of 9 stations (>= half) with ended sessions to trigger closure
    mockReadRegistry.mockResolvedValueOnce({
      s1: makeEntry({
        session_id: 's1',
        trigger_command: 'bmad-pm',
        workflow_role: 'planner',
        workflow_action: 'WN 2.2',
        status: 'ended',
        last_active: '2026-03-28T10:00:00.000Z',
      }),
      s2: makeEntry({
        session_id: 's2',
        trigger_command: 'bmad-pm',
        workflow_role: 'planner',
        workflow_action: 'CS 2.2',
        status: 'ended',
        last_active: '2026-03-28T10:30:00.000Z',
      }),
      s3: makeEntry({
        session_id: 's3',
        trigger_command: 'bmad-dev',
        workflow_role: 'builder',
        workflow_action: 'DS 2.2',
        status: 'ended',
        last_active: '2026-03-28T12:00:00.000Z',
      }),
      s4: makeEntry({
        session_id: 's4',
        trigger_command: 'bmad-sm',
        workflow_role: 'reviewer',
        workflow_action: 'DR 2.2',
        status: 'ended',
        last_active: '2026-03-28T13:00:00.000Z',
      }),
      s5: makeEntry({
        session_id: 's5',
        trigger_command: 'bmad-qa',
        workflow_role: 'tester',
        workflow_action: 'SAT-CS 2.2',
        status: 'ended',
        last_active: '2026-03-28T14:00:00.000Z',
      }),
    });

    await seedWorkflowsFromRegistry();

    const workflows = await readWorkflows();
    const wf = workflows[0]!;
    expect(wf.status).toBe('closed');

    // All 5 populated stations should be completed
    expect(wf.stations.find((s) => s.position === 0)!.state).toBe('completed');
    expect(wf.stations.find((s) => s.position === 1)!.state).toBe('completed');
    expect(wf.stations.find((s) => s.position === 3)!.state).toBe('completed');
    expect(wf.stations.find((s) => s.position === 4)!.state).toBe('completed');
    expect(wf.stations.find((s) => s.position === 5)!.state).toBe('completed');

    // Unpopulated stations remain not_started
    expect(wf.stations.find((s) => s.position === 2)!.state).toBe('not_started');
  });

  it('does not close workflow when only a few stations are populated', async () => {
    // Only 2 of 9 stations populated — should NOT close even if all ended
    mockReadRegistry.mockResolvedValueOnce({
      s1: makeEntry({
        session_id: 's1',
        trigger_command: 'bmad-dev',
        workflow_role: 'builder',
        workflow_action: 'DS 2.2',
        status: 'ended',
        last_active: '2026-03-28T12:00:00.000Z',
      }),
      s2: makeEntry({
        session_id: 's2',
        trigger_command: 'bmad-sm',
        workflow_role: 'reviewer',
        workflow_action: 'DR 2.2',
        status: 'ended',
        last_active: '2026-03-28T13:00:00.000Z',
      }),
    });

    await seedWorkflowsFromRegistry();

    const workflows = await readWorkflows();
    const wf = workflows[0]!;
    // Only 2/9 stations — not substantial coverage, should stay in_progress
    expect(wf.status).toBe('in_progress');
    // But the stations themselves should still be marked completed
    expect(wf.stations.find((s) => s.position === 3)!.state).toBe('completed');
    expect(wf.stations.find((s) => s.position === 4)!.state).toBe('completed');
  });

  it('computes duration_ms from started_at to last_active', async () => {
    // Fix time so station.started_at is predictable
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-28T10:00:00.000Z'));

    mockReadRegistry.mockResolvedValueOnce({
      s1: makeEntry({
        session_id: 's1',
        trigger_command: 'bmad-dev',
        workflow_role: 'builder',
        workflow_action: 'DS 2.2',
        status: 'ended',
        started_at: '2026-03-28T10:00:00.000Z',
        last_active: '2026-03-28T11:30:00.000Z',
      }),
    });

    await seedWorkflowsFromRegistry();

    vi.useRealTimers();

    const workflows = await readWorkflows();
    const dsStation = workflows[0]!.stations.find((s) => s.position === 3);
    expect(dsStation!.state).toBe('completed');
    // station.started_at was set to 2026-03-28T10:00:00.000Z (mocked now)
    // last_active is 2026-03-28T11:30:00.000Z → duration = 90 minutes = 5400000ms
    expect(dsStation!.duration_ms).toBe(5_400_000);
  });

  it('picks latest last_active across multiple sessions for duration', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-28T10:00:00.000Z'));

    mockReadRegistry.mockResolvedValueOnce({
      's1-ds': makeEntry({
        session_id: 's1-ds',
        trigger_command: 'bmad-dev',
        workflow_role: 'builder',
        workflow_action: 'DS 2.2',
        status: 'ended',
        last_active: '2026-03-28T11:00:00.000Z',
      }),
      's2-ds': makeEntry({
        session_id: 's2-ds',
        trigger_command: 'bmad-dev',
        workflow_role: 'builder',
        workflow_action: 'DS 2.2',
        status: 'ended',
        last_active: '2026-03-28T14:00:00.000Z',
      }),
    });

    await seedWorkflowsFromRegistry();

    vi.useRealTimers();

    const workflows = await readWorkflows();
    const dsStation = workflows[0]!.stations.find((s) => s.position === 3);
    expect(dsStation!.state).toBe('completed');
    // station.started_at = 2026-03-28T10:00:00.000Z, latest last_active = 14:00
    // duration = 4 hours = 14400000ms
    expect(dsStation!.duration_ms).toBe(14_400_000);
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('returns empty result when registry has no BMAD sessions', async () => {
    mockReadRegistry.mockResolvedValueOnce({
      s1: makeEntry({
        session_id: 's1',
        trigger_command: null,
      }),
      s2: makeEntry({
        session_id: 's2',
        trigger_command: 'some-other-tool',
      }),
    });

    const result = await seedWorkflowsFromRegistry();

    expect(result.workflows_created).toBe(0);
    expect(result.sessions_routed).toBe(0);
    expect(result.sessions_unroutable).toBe(0);
  });

  it('throws when workflow type is not found', async () => {
    mockGetWorkflowType.mockResolvedValueOnce(null);
    mockReadRegistry.mockResolvedValueOnce({
      s1: makeEntry({
        session_id: 's1',
        trigger_command: 'bmad-dev',
        workflow_role: 'builder',
        workflow_action: 'DS 2.2',
      }),
    });

    await expect(seedWorkflowsFromRegistry()).rejects.toThrow(
      'Workflow type "regular_story" not found'
    );
  });

  it('handles unknown role+action combination as unroutable', async () => {
    mockReadRegistry.mockResolvedValueOnce({
      s1: makeEntry({
        session_id: 's1',
        trigger_command: 'bmad-dev',
        workflow_role: 'unknown-role',
        workflow_action: 'ZZ 2.2',
      }),
    });

    const result = await seedWorkflowsFromRegistry();

    expect(result.sessions_unroutable).toBe(1);
    expect(result.unroutable_reasons[0]!.reason).toContain('no station found');
    expect(result.unroutable_reasons[0]!.reason).toContain('unknown-role');
  });
});

// ── Action-code fallback in lookupStation ───────────────────────────────────

describe('lookupStation — action-code fallback', () => {
  it('routes CU session with role=tester to CU station (position 7) via action-code fallback', async () => {
    mockReadRegistry.mockResolvedValueOnce({
      'cu-from-sat': makeEntry({
        session_id: 'cu-from-sat',
        trigger_command: 'bmad-sat',
        workflow_role: 'tester',
        workflow_action: 'CU 2.6',
      }),
    });

    const result = await seedWorkflowsFromRegistry();

    expect(result.sessions_routed).toBe(1);
    expect(result.sessions_unroutable).toBe(0);

    const workflows = await readWorkflows();
    expect(workflows).toHaveLength(1);

    // CU station is position 7 (advisor:CU) — reached via action-code fallback
    const cuStation = workflows[0]!.stations.find((s) => s.position === 7);
    expect(cuStation!.session_ids).toContain('cu-from-sat');
    expect(cuStation!.state).toBe('in_progress');
  });
});

// ── WN gatekeeper logging ───────────────────────────────────────────────────

describe('WN gatekeeper logging', () => {
  it('logs WN session without story ID as gatekeeper with specific reason text', async () => {
    mockReadRegistry.mockResolvedValueOnce({
      'wn-1': makeEntry({
        session_id: 'wn-1',
        trigger_command: 'bmad-sm',
        workflow_role: 'planner',
        workflow_action: 'WN',
      }),
    });

    const result = await seedWorkflowsFromRegistry();

    expect(result.sessions_unroutable).toBe(1);
    expect(result.unroutable_reasons).toHaveLength(1);
    expect(result.unroutable_reasons[0]!.session_id).toBe('wn-1');
    expect(result.unroutable_reasons[0]!.reason).toBe(
      'gatekeeper session (WN) — pending workflow association'
    );
  });

  it('logs non-WN sessions without story ID with generic reason', async () => {
    mockReadRegistry.mockResolvedValueOnce({
      'cs-no-story': makeEntry({
        session_id: 'cs-no-story',
        trigger_command: 'bmad-sm',
        workflow_role: 'planner',
        workflow_action: 'CS',
      }),
    });

    const result = await seedWorkflowsFromRegistry();

    expect(result.sessions_unroutable).toBe(1);
    expect(result.unroutable_reasons[0]!.reason).toBe('no story id (actionCode: CS)');
  });
});

// ── Overlay config ──────────────────────────────────────────────────────────

describe('overlay config — bmad-v6', () => {
  it('/bmad-sat actions do not include CU', async () => {
    const { readFile } = await import('node:fs/promises');
    const { resolve } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = resolve(fileURLToPath(import.meta.url), '..');
    const overlayPath = resolve(__dirname, '..', 'config', 'overlays', 'bmad-v6.json');
    const raw = await readFile(overlayPath, 'utf-8');
    const overlay = JSON.parse(raw) as {
      role_mappings: Record<string, { actions: string[] }>;
    };

    const satActions = overlay.role_mappings['/bmad-sat']!.actions;
    expect(satActions).toEqual(['CS', 'RA']);
    expect(satActions).not.toContain('CU');
  });

  it('/bmad-lib actions include CU (advisor/Lisa owns CU)', async () => {
    const { readFile } = await import('node:fs/promises');
    const { resolve } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = resolve(fileURLToPath(import.meta.url), '..');
    const overlayPath = resolve(__dirname, '..', 'config', 'overlays', 'bmad-v6.json');
    const raw = await readFile(overlayPath, 'utf-8');
    const overlay = JSON.parse(raw) as {
      role_mappings: Record<string, { actions: string[] }>;
    };

    const libActions = overlay.role_mappings['/bmad-lib']!.actions;
    expect(libActions).toContain('CU');
  });

  it('/bmad-sm actions include WN (planner/Bob owns gatekeeper)', async () => {
    const { readFile } = await import('node:fs/promises');
    const { resolve } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = resolve(fileURLToPath(import.meta.url), '..');
    const overlayPath = resolve(__dirname, '..', 'config', 'overlays', 'bmad-v6.json');
    const raw = await readFile(overlayPath, 'utf-8');
    const overlay = JSON.parse(raw) as {
      role_mappings: Record<string, { actions: string[] }>;
    };

    const smActions = overlay.role_mappings['/bmad-sm']!.actions;
    expect(smActions).toContain('WN');
  });
});
