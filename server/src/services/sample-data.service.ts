/**
 * Sample data loader for Mochaccino mock-views.
 *
 * Reads curated JSON files from .mochaccino/samples/ and serves them
 * as fallback when real data is thin or missing. Sample files contain
 * the exact shape returned by mock-views service functions.
 */

import { readFile } from 'fs/promises';
import path from 'path';
import { logger } from '../config/logger.js';

const SAMPLES_ROOT = path.resolve(process.cwd(), '..', '.mochaccino', 'samples');

function stripMeta(data: Record<string, unknown>): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _sampleMeta, ...rest } = data;
  return rest;
}

/**
 * Load a sample JSON file for a non-parameterized endpoint.
 * Returns null if no sample file exists.
 */
export async function loadSample(viewName: string): Promise<unknown | null> {
  const filePath = path.join(SAMPLES_ROOT, `${viewName}.json`);
  try {
    const raw = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return stripMeta(parsed);
  } catch {
    logger.debug({ viewName, filePath }, 'sample-data: no sample file found');
    return null;
  }
}

/**
 * Load a sample JSON file for a parameterized endpoint.
 * Falls back to _default.json in the subdirectory.
 */
export async function loadParamSample(
  viewName: string,
  _paramValue: string
): Promise<unknown | null> {
  const dir = path.join(SAMPLES_ROOT, viewName);

  // Always use _default.json for now — can add matchIds lookup later
  const defaultPath = path.join(dir, '_default.json');
  try {
    const raw = await readFile(defaultPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return stripMeta(parsed);
  } catch {
    logger.debug({ viewName, dir }, 'sample-data: no param sample found');
    return null;
  }
}
