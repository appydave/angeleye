import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  _setWorkflowDir,
  readWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
} from './workflow.service.js';
import type { CreateWorkflowParams } from './workflow.service.js';

let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'angeleye-workflow-test-'));
  _setWorkflowDir(testDir);
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

const sampleParams: CreateWorkflowParams = {
  workflow_type_id: 'bmad-regular-story',
  work_item_id: 'item-001',
  work_item_label: 'Build login page',
  stations: [
    { position: 1, action_code: 'gather' },
    { position: 2, action_code: 'analyse' },
    { position: 3, action_code: 'implement' },
  ],
};

describe('workflow.service', () => {
  // 1. readWorkflows — empty
  it('returns empty array when no file exists', async () => {
    const result = await readWorkflows();
    expect(result).toEqual([]);
  });

  // 2. createWorkflow — creates instance with correct fields
  it('creates a workflow instance with correct fields', async () => {
    const instance = await createWorkflow(sampleParams);

    expect(instance.instance_id).toBeDefined();
    expect(instance.instance_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(instance.workflow_type_id).toBe('bmad-regular-story');
    expect(instance.work_item_id).toBe('item-001');
    expect(instance.work_item_label).toBe('Build login page');
    expect(instance.status).toBe('not_started');
    expect(instance.current_station).toBe(0);
    expect(instance.created_at).toBeDefined();
    expect(instance.updated_at).toBeDefined();
    expect(instance.backtracks).toEqual([]);
    expect(instance.metadata).toEqual({});

    // Verify written to disk
    const raw = await readFile(join(testDir, 'workflows.json'), 'utf-8');
    const parsed = JSON.parse(raw) as { workflows: unknown[] };
    expect(parsed.workflows).toHaveLength(1);
  });

  // 3. createWorkflow — station instances initialized correctly
  it('initializes all station instances as not_started with empty session_ids', async () => {
    const instance = await createWorkflow(sampleParams);

    expect(instance.stations).toHaveLength(3);
    for (const station of instance.stations) {
      expect(station.state).toBe('not_started');
      expect(station.session_ids).toEqual([]);
      expect(station.started_at).toBeNull();
      expect(station.completed_at).toBeNull();
      expect(station.duration_ms).toBeNull();
      expect(station.context_used_pct).toBeNull();
      expect(station.subagent_count).toBe(0);
      expect(station.verdict).toBeNull();
    }

    expect(instance.stations[0]!.position).toBe(1);
    expect(instance.stations[0]!.action_code).toBe('gather');
    expect(instance.stations[1]!.position).toBe(2);
    expect(instance.stations[1]!.action_code).toBe('analyse');
    expect(instance.stations[2]!.position).toBe(3);
    expect(instance.stations[2]!.action_code).toBe('implement');
  });

  // 4. getWorkflow — found
  it('returns matching workflow by instance_id', async () => {
    const created = await createWorkflow(sampleParams);
    const found = await getWorkflow(created.instance_id);

    expect(found).not.toBeNull();
    expect(found!.instance_id).toBe(created.instance_id);
    expect(found!.workflow_type_id).toBe('bmad-regular-story');
  });

  // 5. getWorkflow — not found
  it('returns null for non-existent instance_id', async () => {
    const result = await getWorkflow('does-not-exist');
    expect(result).toBeNull();
  });

  // 6. updateWorkflow — success
  it('merges updates into existing workflow', async () => {
    const created = await createWorkflow(sampleParams);
    const updated = await updateWorkflow(created.instance_id, {
      status: 'in_progress',
      current_station: 1,
    });

    expect(updated.status).toBe('in_progress');
    expect(updated.current_station).toBe(1);
    expect(updated.instance_id).toBe(created.instance_id);
    expect(updated.work_item_label).toBe('Build login page');
    // updated_at should be refreshed
    expect(new Date(updated.updated_at).getTime()).toBeGreaterThanOrEqual(
      new Date(created.updated_at).getTime()
    );
  });

  // 7. updateWorkflow — not found
  it('throws error when updating non-existent workflow', async () => {
    await expect(updateWorkflow('does-not-exist', { status: 'closed' })).rejects.toThrow(
      'Workflow not found: does-not-exist'
    );
  });

  // 8. Multiple workflows
  it('creates and reads multiple workflows', async () => {
    await createWorkflow(sampleParams);
    await createWorkflow({
      ...sampleParams,
      work_item_id: 'item-002',
      work_item_label: 'Build signup page',
    });

    const all = await readWorkflows();
    expect(all).toHaveLength(2);
    expect(all[0]!.work_item_id).toBe('item-001');
    expect(all[1]!.work_item_id).toBe('item-002');
  });

  // 9. Concurrent writes — all persist without data loss
  it('persists all workflows when created concurrently', async () => {
    const promises = Array.from({ length: 5 }, (_, i) =>
      createWorkflow({
        ...sampleParams,
        work_item_id: `concurrent-${i}`,
        work_item_label: `Concurrent item ${i}`,
      })
    );

    const results = await Promise.all(promises);
    expect(results).toHaveLength(5);

    const all = await readWorkflows();
    expect(all).toHaveLength(5);

    const ids = new Set(all.map((w) => w.work_item_id));
    for (let i = 0; i < 5; i++) {
      expect(ids.has(`concurrent-${i}`)).toBe(true);
    }
  });

  // 10. Atomic write — verify file is valid JSON after write
  it('writes valid JSON via atomic .tmp pattern', async () => {
    await createWorkflow(sampleParams);

    const filePath = join(testDir, 'workflows.json');
    const raw = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);

    expect(parsed).toHaveProperty('workflows');
    expect(Array.isArray(parsed.workflows)).toBe(true);
    expect(parsed.workflows).toHaveLength(1);
  });
});
