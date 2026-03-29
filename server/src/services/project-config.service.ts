import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ProjectConfig } from '@appystack/shared';
import { logger } from '../config/logger.js';

// Module-level cache
let cache: Map<string, ProjectConfig> | null = null;

// Config directory — overridable for tests
let configDir: string = path.resolve(process.cwd(), 'src', 'config', 'projects');

/**
 * Load all ProjectConfig JSON configs from the config directory.
 * Results are cached after the first successful load.
 */
export async function loadProjectConfigs(): Promise<ProjectConfig[]> {
  if (cache) {
    return Array.from(cache.values());
  }

  const loaded = new Map<string, ProjectConfig>();

  let files: string[];
  try {
    const entries = await readdir(configDir);
    files = entries.filter((f) => f.endsWith('.json'));
  } catch (err) {
    logger.warn({ err, configDir }, 'project-config: could not read config directory');
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
        typeof parsed.path !== 'string' ||
        typeof parsed.description !== 'string'
      ) {
        logger.warn(
          { file },
          'project-config: invalid config shape — missing id, name, path, or description'
        );
        continue;
      }
      loaded.set(parsed.id, parsed as unknown as ProjectConfig);
    } catch (err) {
      logger.warn({ err, file }, 'project-config: failed to parse config file');
    }
  }

  cache = loaded;
  return Array.from(cache.values());
}

/**
 * Returns cached project configs (loads from disk on first call).
 */
export async function getProjectConfigs(): Promise<ProjectConfig[]> {
  return loadProjectConfigs();
}

/**
 * Returns a single ProjectConfig by id, or null if not found.
 */
export async function getProjectConfig(id: string): Promise<ProjectConfig | null> {
  await loadProjectConfigs();
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
