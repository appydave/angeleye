import { readFile, writeFile, rename } from 'node:fs/promises';
import type { WorkspaceEntry } from '@appystack/shared';
import { logger } from '../config/logger.js';
import { _workspacesPath } from './registry.service.js';

export async function readWorkspaces(): Promise<WorkspaceEntry[]> {
  try {
    const raw = await readFile(_workspacesPath(), 'utf-8');
    const parsed = JSON.parse(raw) as { workspaces: WorkspaceEntry[] };
    return Array.isArray(parsed.workspaces) ? parsed.workspaces : [];
  } catch (err) {
    logger.warn({ err }, 'Could not read workspaces.json, returning empty array');
    return [];
  }
}

async function writeWorkspaces(workspaces: WorkspaceEntry[]): Promise<void> {
  try {
    const tmp = _workspacesPath() + '.tmp';
    await writeFile(tmp, JSON.stringify({ workspaces }, null, 2), 'utf-8');
    await rename(tmp, _workspacesPath());
  } catch (err) {
    logger.error({ err }, 'Failed to write workspaces.json');
    throw err;
  }
}

export async function createWorkspace(name: string): Promise<WorkspaceEntry> {
  const entry: WorkspaceEntry = {
    id: crypto.randomUUID(),
    name,
    tags: [],
    created_at: new Date().toISOString(),
  };
  const workspaces = await readWorkspaces();
  workspaces.push(entry);
  await writeWorkspaces(workspaces);
  return entry;
}

export async function updateWorkspace(
  id: string,
  updates: Partial<Pick<WorkspaceEntry, 'name' | 'tags'>>
): Promise<WorkspaceEntry> {
  const workspaces = await readWorkspaces();
  const index = workspaces.findIndex((ws) => ws.id === id);
  if (index === -1) {
    throw new Error(`Workspace not found: ${id}`);
  }
  const updated: WorkspaceEntry = { ...workspaces[index]!, ...updates };
  workspaces[index] = updated;
  await writeWorkspaces(workspaces);
  return updated;
}

export async function deleteWorkspace(id: string): Promise<void> {
  const workspaces = await readWorkspaces();
  const index = workspaces.findIndex((ws) => ws.id === id);
  if (index === -1) {
    throw new Error(`Workspace not found: ${id}`);
  }
  const filtered = workspaces.filter((ws) => ws.id !== id);
  await writeWorkspaces(filtered);
}
