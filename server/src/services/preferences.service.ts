import { readFile, writeFile, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getDataDir } from './registry.service.js';
import { logger } from '../config/logger.js';

export interface Preferences {
  mockupRatings: Record<string, 'liked' | 'chosen'>;
}

function prefsPath(): string {
  return join(getDataDir(), 'preferences.json');
}

const EMPTY: Preferences = { mockupRatings: {} };

export async function readPreferences(): Promise<Preferences> {
  const path = prefsPath();
  if (!existsSync(path)) return { ...EMPTY };
  try {
    const raw = await readFile(path, 'utf-8');
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch (err) {
    logger.warn({ err }, 'Failed to read preferences.json — returning defaults');
    return { ...EMPTY };
  }
}

export async function writePreferences(prefs: Preferences): Promise<void> {
  const path = prefsPath();
  const tmp = path + '.tmp';
  await writeFile(tmp, JSON.stringify(prefs, null, 2), 'utf-8');
  await rename(tmp, path);
}

export async function setMockupRating(
  mockupKey: string,
  rating: 'liked' | 'chosen' | null
): Promise<Preferences> {
  const prefs = await readPreferences();
  if (rating === null) {
    delete prefs.mockupRatings[mockupKey];
  } else {
    prefs.mockupRatings[mockupKey] = rating;
  }
  await writePreferences(prefs);
  return prefs;
}
