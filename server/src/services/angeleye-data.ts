import { readFile, writeFile, mkdir, rename, appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { AngelEyeEvent, Registry, RegistryEntry, WorkspaceEntry } from '@appystack/shared';
import { logger } from '../config/logger.js';

// Module-level base dir — overridable via _setDataDir (test-only)
let _baseDir: string = join(homedir(), '.claude', 'angeleye');

function _sessionsDir(): string {
  return join(_baseDir, 'sessions');
}
function _archiveDir(): string {
  return join(_baseDir, 'archive');
}
function _registryPath(): string {
  return join(_baseDir, 'registry.json');
}
function _workspacesPath(): string {
  return join(_baseDir, 'workspaces.json');
}

/**
 * Override the base data directory. Intended for tests only — prefix signals test-only usage.
 * Also resets the write queue so tests start clean.
 */
export function _setDataDir(dir: string): void {
  _baseDir = dir;
  writeQueue = Promise.resolve();
}

export async function initAngelEyeDirs(): Promise<void> {
  const sessionsDir = _sessionsDir();
  const archiveDir = _archiveDir();
  const registryPath = _registryPath();
  const workspacesPath = _workspacesPath();

  await mkdir(sessionsDir, { recursive: true });
  await mkdir(archiveDir, { recursive: true });

  if (!existsSync(registryPath)) {
    await writeFile(registryPath, JSON.stringify({}), 'utf-8');
    logger.info({ path: registryPath }, 'Created registry.json');
  }

  if (!existsSync(workspacesPath)) {
    await writeFile(workspacesPath, JSON.stringify({ workspaces: [] }), 'utf-8');
    logger.info({ path: workspacesPath }, 'Created workspaces.json');
  }
}

export async function writeEvent(event: AngelEyeEvent): Promise<void> {
  const filePath = join(_sessionsDir(), `session-${event.session_id}.jsonl`);
  try {
    await appendFile(filePath, JSON.stringify(event) + '\n', 'utf-8');
  } catch (err) {
    logger.error({ err, session_id: event.session_id }, 'Failed to write event');
    throw err;
  }
}

export async function readRegistry(): Promise<Registry> {
  try {
    const raw = await readFile(_registryPath(), 'utf-8');
    return JSON.parse(raw) as Registry;
  } catch (err) {
    logger.warn({ err }, 'Could not read registry.json, returning empty registry');
    return {};
  }
}

// Serial write queue — prevents lost-update race when concurrent sessions post hooks simultaneously
let writeQueue: Promise<void> = Promise.resolve();

export function updateRegistry(sessionId: string, updates: Partial<RegistryEntry>): Promise<void> {
  writeQueue = writeQueue.then(() => _doUpdateRegistry(sessionId, updates));
  return writeQueue;
}

async function _doUpdateRegistry(
  sessionId: string,
  updates: Partial<RegistryEntry>
): Promise<void> {
  try {
    const registry = await readRegistry();
    const existing = registry[sessionId] ?? {};

    // Self-heal sparse entries: fill in missing fields from incoming data
    const ts = updates.last_active ?? new Date().toISOString();
    const projectDir =
      updates.project_dir ?? (existing as Partial<RegistryEntry>).project_dir ?? '';
    const derivedProject =
      projectDir.length > 0 ? (projectDir.split('/').filter(Boolean).pop() ?? projectDir) : '';

    const healed: Partial<RegistryEntry> = {
      status: 'active',
      started_at: ts,
      project: derivedProject || undefined,
      project_dir: projectDir || undefined,
      name: null,
      tags: [],
      workspace_id: null,
      source: 'hook',
    };

    registry[sessionId] = {
      ...healed,
      ...(existing as Partial<RegistryEntry>),
      session_id: sessionId,
      ...updates,
    } as RegistryEntry;

    await writeFile(_registryPath(), JSON.stringify(registry, null, 2), 'utf-8');
  } catch (err) {
    logger.error({ err, sessionId }, 'Failed to update registry');
    throw err;
  }
}

export async function getSessionEvents(sessionId: string): Promise<AngelEyeEvent[]> {
  const filePath = join(_sessionsDir(), `session-${sessionId}.jsonl`);
  try {
    const raw = await readFile(filePath, 'utf-8');
    return raw
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => JSON.parse(line) as AngelEyeEvent);
  } catch (err) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === 'ENOENT') {
      return [];
    }
    logger.error({ err, sessionId }, 'Failed to read session events');
    return [];
  }
}

export async function archiveSession(sessionId: string): Promise<void> {
  const src = join(_sessionsDir(), `session-${sessionId}.jsonl`);
  const dest = join(_archiveDir(), `session-${sessionId}.jsonl`);
  try {
    await rename(src, dest);
    logger.info({ sessionId, dest }, 'Session archived');
  } catch (err) {
    logger.error({ err, sessionId }, 'Failed to archive session');
    throw err;
  }
}

// ── Workspace CRUD ─────────────────────────────────────────────────────────────

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

export async function writeWorkspaces(workspaces: WorkspaceEntry[]): Promise<void> {
  try {
    await writeFile(_workspacesPath(), JSON.stringify({ workspaces }, null, 2), 'utf-8');
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
