import { readFile, writeFile, mkdir, rename, appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { AngelEyeEvent, Registry, RegistryEntry } from '@appystack/shared';
import { logger } from '../config/logger.js';

export const ANGELEYE_DIR = join(homedir(), '.claude', 'angeleye');
export const SESSIONS_DIR = join(ANGELEYE_DIR, 'sessions');
export const ARCHIVE_DIR = join(ANGELEYE_DIR, 'archive');
export const REGISTRY_PATH = join(ANGELEYE_DIR, 'registry.json');
export const WORKSPACES_PATH = join(ANGELEYE_DIR, 'workspaces.json');

export async function initAngelEyeDirs(): Promise<void> {
  await mkdir(SESSIONS_DIR, { recursive: true });
  await mkdir(ARCHIVE_DIR, { recursive: true });

  if (!existsSync(REGISTRY_PATH)) {
    await writeFile(REGISTRY_PATH, JSON.stringify({}), 'utf-8');
    logger.info({ path: REGISTRY_PATH }, 'Created registry.json');
  }

  if (!existsSync(WORKSPACES_PATH)) {
    await writeFile(WORKSPACES_PATH, JSON.stringify({ workspaces: [] }), 'utf-8');
    logger.info({ path: WORKSPACES_PATH }, 'Created workspaces.json');
  }
}

export async function writeEvent(event: AngelEyeEvent): Promise<void> {
  const filePath = join(SESSIONS_DIR, `session-${event.session_id}.jsonl`);
  try {
    await appendFile(filePath, JSON.stringify(event) + '\n', 'utf-8');
  } catch (err) {
    logger.error({ err, session_id: event.session_id }, 'Failed to write event');
    throw err;
  }
}

export async function readRegistry(): Promise<Registry> {
  try {
    const raw = await readFile(REGISTRY_PATH, 'utf-8');
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

    await writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf-8');
  } catch (err) {
    logger.error({ err, sessionId }, 'Failed to update registry');
    throw err;
  }
}

export async function getSessionEvents(sessionId: string): Promise<AngelEyeEvent[]> {
  const filePath = join(SESSIONS_DIR, `session-${sessionId}.jsonl`);
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
  const src = join(SESSIONS_DIR, `session-${sessionId}.jsonl`);
  const dest = join(ARCHIVE_DIR, `session-${sessionId}.jsonl`);
  try {
    await rename(src, dest);
    logger.info({ sessionId, dest }, 'Session archived');
  } catch (err) {
    logger.error({ err, sessionId }, 'Failed to archive session');
    throw err;
  }
}
