import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DomainOverlay, OverlayResult } from '@appystack/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Overlay cache (loaded once, synchronously) ────────────────────────────────

let overlays: DomainOverlay[] | null = null;

function getOverlaysDir(): string {
  return join(__dirname, '../config/overlays');
}

function loadOverlays(): DomainOverlay[] {
  if (overlays !== null) return overlays;

  const dir = getOverlaysDir();
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  } catch {
    // No overlays directory — return empty list
    overlays = [];
    return overlays;
  }

  overlays = [];
  for (const file of files) {
    try {
      const raw = readFileSync(join(dir, file), 'utf-8');
      const parsed = JSON.parse(raw) as DomainOverlay;
      if (parsed.domain && parsed.role_mappings) {
        overlays.push(parsed);
      }
    } catch {
      // Skip malformed overlay files
    }
  }

  return overlays;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Resolve a trigger command (from E01) against all loaded domain overlays.
 *
 * The trigger command from E01 is the command name without the leading "/",
 * e.g., "bmad-dev". We match against overlay keys with or without the "/".
 *
 * @param triggerCommand - The trigger command extracted from E01 (e.g., "bmad-dev"), or null
 * @param triggerArguments - The trigger arguments from E02 (e.g., "DS 2.1"), or null
 * @returns OverlayResult if a match is found, null otherwise
 */
export function resolveOverlay(
  triggerCommand: string | null,
  triggerArguments?: string | null
): OverlayResult | null {
  if (!triggerCommand) return null;

  const allOverlays = loadOverlays();

  // Normalise: ensure we have both forms for matching
  const withSlash = triggerCommand.startsWith('/') ? triggerCommand : `/${triggerCommand}`;
  const withoutSlash = triggerCommand.startsWith('/') ? triggerCommand.slice(1) : triggerCommand;

  for (const overlay of allOverlays) {
    const mappings = overlay.role_mappings;

    // Try matching with slash first, then without
    const mapping = mappings[withSlash] ?? mappings[withoutSlash];

    if (mapping) {
      return {
        domain: overlay.domain,
        role: mapping.role,
        identity: mapping.identity,
        action: triggerArguments ?? null,
      };
    }
  }

  return null;
}

/** Reset the overlay cache — useful for testing. */
export function resetOverlayCache(): void {
  overlays = null;
}
