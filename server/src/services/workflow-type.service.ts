import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { WorkflowType } from '@appystack/shared';
import { logger } from '../config/logger.js';

// Module-level cache
let cache: Map<string, WorkflowType> | null = null;

// Config directory — overridable for tests
let configDir: string = path.resolve(process.cwd(), 'src', 'config', 'workflows');

/**
 * Load all WorkflowType JSON configs from the config directory.
 * Results are cached after the first successful load.
 */
export async function loadWorkflowTypes(): Promise<WorkflowType[]> {
  if (cache) {
    return Array.from(cache.values());
  }

  const loaded = new Map<string, WorkflowType>();

  let files: string[];
  try {
    const entries = await readdir(configDir);
    files = entries.filter((f) => f.endsWith('.json'));
  } catch (err) {
    logger.warn({ err, configDir }, 'workflow-type: could not read config directory');
    cache = loaded;
    return [];
  }

  for (const file of files) {
    const filePath = path.join(configDir, file);
    try {
      const raw = await readFile(filePath, 'utf-8');
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (
        typeof parsed.id !== 'string' ||
        typeof parsed.name !== 'string' ||
        !Array.isArray(parsed.stations)
      ) {
        logger.warn(
          { file },
          'workflow-type: invalid config shape — missing id, name, or stations array'
        );
        continue;
      }
      loaded.set(parsed.id, parsed as unknown as WorkflowType);
    } catch (err) {
      logger.warn({ err, file }, 'workflow-type: failed to parse config file');
    }
  }

  cache = loaded;
  return Array.from(cache.values());
}

/**
 * Returns cached workflow types (loads from disk on first call).
 */
export async function getWorkflowTypes(): Promise<WorkflowType[]> {
  return loadWorkflowTypes();
}

/**
 * Returns a single WorkflowType by id, or null if not found.
 */
export async function getWorkflowType(id: string): Promise<WorkflowType | null> {
  await loadWorkflowTypes();
  return cache!.get(id) ?? null;
}

/**
 * Test-only: clear the in-memory cache so subsequent calls re-read from disk.
 */
export function _resetCache(): void {
  cache = null;
}

/**
 * Test-only: override the config directory path.
 */
export function _setConfigDir(dir: string): void {
  configDir = dir;
}
