import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { WorkflowInstance, StationInstance, WorkflowStatus } from '@appystack/shared';
import { logger } from '../config/logger.js';
import { getDataDir } from './registry.service.js';

// ── Module state ────────────────────────────────────────────────────────────

let _overrideDir: string | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function _baseDir(): string {
  return _overrideDir ?? getDataDir();
}

function _workflowsPath(): string {
  return join(_baseDir(), 'workflows.json');
}

/**
 * Override the storage directory. Intended for tests only.
 * Also resets the write queue so tests start clean.
 */
export function _setWorkflowDir(dir: string): void {
  _overrideDir = dir;
  writeQueue = Promise.resolve();
}

// ── Params ──────────────────────────────────────────────────────────────────

export interface CreateWorkflowParams {
  workflow_type_id: string;
  work_item_id: string;
  work_item_label: string;
  project_dir?: string;
  stations: Array<{ position: number; action_code: string }>;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function readWorkflowsFile(): Promise<WorkflowInstance[]> {
  try {
    const raw = await readFile(_workflowsPath(), 'utf-8');
    const parsed = JSON.parse(raw) as { workflows: WorkflowInstance[] };
    return Array.isArray(parsed.workflows) ? parsed.workflows : [];
  } catch (err) {
    logger.warn({ err }, 'Could not read workflows.json, returning empty array');
    return [];
  }
}

async function writeWorkflowsFile(workflows: WorkflowInstance[]): Promise<void> {
  const dir = _baseDir();
  await mkdir(dir, { recursive: true });
  const filePath = _workflowsPath();
  const tmp = filePath + '.tmp';
  await writeFile(tmp, JSON.stringify({ workflows }, null, 2), 'utf-8');
  await rename(tmp, filePath);
}

async function enqueueWrite(fn: () => Promise<void>): Promise<void> {
  const result = writeQueue.then(fn);
  // Keep the queue alive even if this write fails — but re-throw for the caller
  writeQueue = result.catch((err) => {
    logger.error({ err }, 'Workflow write failed — queue continues');
  });
  return result;
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function readWorkflows(): Promise<WorkflowInstance[]> {
  return readWorkflowsFile();
}

export async function getWorkflow(instanceId: string): Promise<WorkflowInstance | null> {
  const workflows = await readWorkflowsFile();
  return workflows.find((w) => w.instance_id === instanceId) ?? null;
}

export async function createWorkflow(params: CreateWorkflowParams): Promise<WorkflowInstance> {
  const now = new Date().toISOString();

  const stations: StationInstance[] = params.stations.map((s) => ({
    position: s.position,
    action_code: s.action_code,
    state: 'not_started' as const,
    session_ids: [],
    started_at: null,
    completed_at: null,
    duration_ms: null,
    context_used_pct: null,
    subagent_count: 0,
    verdict: null,
  }));

  const instance: WorkflowInstance = {
    instance_id: crypto.randomUUID(),
    workflow_type_id: params.workflow_type_id,
    work_item_id: params.work_item_id,
    work_item_label: params.work_item_label,
    ...(params.project_dir ? { project_dir: params.project_dir } : {}),
    status: 'not_started' as WorkflowStatus,
    current_station: 0,
    created_at: now,
    updated_at: now,
    stations,
    backtracks: [],
    metadata: {},
  };

  await enqueueWrite(async () => {
    const workflows = await readWorkflowsFile();
    workflows.push(instance);
    await writeWorkflowsFile(workflows);
  });

  return instance;
}

export async function updateWorkflow(
  instanceId: string,
  updates: Partial<WorkflowInstance>
): Promise<WorkflowInstance> {
  let updated: WorkflowInstance | null = null;

  await enqueueWrite(async () => {
    const workflows = await readWorkflowsFile();
    const index = workflows.findIndex((w) => w.instance_id === instanceId);
    if (index === -1) {
      throw new Error(`Workflow not found: ${instanceId}`);
    }
    updated = {
      ...workflows[index]!,
      ...updates,
      instance_id: workflows[index]!.instance_id, // prevent id overwrite
      updated_at: updates.updated_at ?? new Date().toISOString(),
    };
    workflows[index] = updated;
    await writeWorkflowsFile(workflows);
  });

  if (!updated) {
    throw new Error(`Workflow not found: ${instanceId}`);
  }

  return updated;
}
