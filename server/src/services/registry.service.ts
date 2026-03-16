import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Registry, RegistryEntry } from '@appystack/shared';
import { logger } from '../config/logger.js';

// Module-level base dir — overridable via _setDataDir (test-only)
let _baseDir: string = join(homedir(), '.claude', 'angeleye');

export function _sessionsDir(): string {
  return join(_baseDir, 'sessions');
}
export function _archiveDir(): string {
  return join(_baseDir, 'archive');
}
export function _registryPath(): string {
  return join(_baseDir, 'registry.json');
}
export function _workspacesPath(): string {
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
  writeQueue = writeQueue
    .then(() => _doUpdateRegistry(sessionId, updates))
    .catch((err) => {
      logger.error({ err, sessionId }, 'Registry write failed — queue continues');
    });
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

    const tmp = _registryPath() + '.tmp';
    await writeFile(tmp, JSON.stringify(registry, null, 2), 'utf-8');
    await rename(tmp, _registryPath());
  } catch (err) {
    logger.error({ err, sessionId }, 'Failed to update registry');
    throw err;
  }
}
