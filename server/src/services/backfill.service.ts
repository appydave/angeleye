import { readFile, readdir, access } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { AngelEyeEvent, RegistryEntry } from '@appystack/shared';
import { readRegistry, updateRegistry, _sessionsDir } from './registry.service.js';
import { writeEvent } from './sessions.service.js';

// ── Custom Title Extraction ──────────────────────────────────────────────────────

function extractCustomTitle(lines: string[]): string | null {
  let lastTitle: string | null = null;
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.type === 'custom-title' && typeof entry.customTitle === 'string') {
        lastTitle = entry.customTitle;
      }
    } catch {
      // skip malformed lines
    }
  }
  return lastTitle; // last wins — same as Claude Code behaviour
}

// ── Transcript Backfill ─────────────────────────────────────────────────────────

export interface BackfillResult {
  scanned: number;
  imported: number;
  skipped: number;
  repaired: number;
  errors: number;
}

// ── Skill-Expanded Prompt Extraction ────────────────────────────────────────
// When a user types /bmad-sm VS 2.4, Claude Code expands the skill and the
// JSONL records the expanded content starting with <command-name>/bmad-sm</command-name>.
// Extract the original command + args so E01/E02 extractors can find them.

const COMMAND_NAME_RE = /<command-name>\/?([^<]+)<\/command-name>/;
const COMMAND_ARGS_RE = /<command-args>([^<]*)<\/command-args>/;

function extractSkillPrompt(content: string): string | null {
  const cmdMatch = content.match(COMMAND_NAME_RE);
  if (!cmdMatch) return null;

  const command = cmdMatch[1]!.startsWith('/') ? cmdMatch[1]! : `/${cmdMatch[1]!}`;
  const argsMatch = content.match(COMMAND_ARGS_RE);
  const args = argsMatch?.[1]?.trim();

  return args ? `${command} ${args}` : command;
}

function transcriptToEvents(sessionId: string, entries: unknown[]): AngelEyeEvent[] {
  const events: AngelEyeEvent[] = [];

  for (const e of entries as Record<string, unknown>[]) {
    const ts = (e.timestamp as string) ?? new Date().toISOString();
    const cwd = (e.cwd as string) ?? '';

    if (e.type === 'user' && !e.isMeta) {
      const content = (e.message as Record<string, unknown>)?.content;
      if (typeof content === 'string' && content.length > 0) {
        // Skip system-reminder and other meta XML, but extract skill-expanded prompts
        let prompt: string | null = null;
        if (content.startsWith('<')) {
          // Check for skill-expanded content (<command-name>...</command-name>)
          prompt = extractSkillPrompt(content);
          // Skip other XML content (system-reminder, etc.)
        } else {
          prompt = content;
        }

        if (prompt) {
          events.push({
            id: crypto.randomUUID(),
            session_id: sessionId,
            ts,
            source: 'transcript',
            event: 'user_prompt',
            cwd,
            prompt,
          });
        }
      }
    }

    if (e.type === 'assistant') {
      const content = (e.message as Record<string, unknown>)?.content;
      if (Array.isArray(content)) {
        for (const block of content as Record<string, unknown>[]) {
          if (block.type === 'tool_use' && typeof block.name === 'string') {
            events.push({
              id: crypto.randomUUID(),
              session_id: sessionId,
              ts,
              source: 'transcript',
              event: 'tool_use',
              cwd,
              tool: block.name,
            });
          }
        }
      }
    }
  }

  return events;
}

export async function backfillTranscripts(
  claudeProjectsDir = join(homedir(), '.claude', 'projects')
): Promise<BackfillResult> {
  const result = { scanned: 0, imported: 0, skipped: 0, repaired: 0, errors: 0 };

  // Read existing registry once
  const registry = await readRegistry();

  // Walk project dirs
  let projectDirs: string[];
  try {
    projectDirs = await readdir(claudeProjectsDir);
  } catch {
    return result; // dir doesn't exist — not an error
  }

  for (const projectSlug of projectDirs) {
    const projectPath = join(claudeProjectsDir, projectSlug);
    let sessionFiles: string[];
    try {
      sessionFiles = (await readdir(projectPath)).filter((f) => f.endsWith('.jsonl'));
    } catch {
      continue;
    }

    for (const file of sessionFiles) {
      const sessionId = file.replace('.jsonl', '');
      result.scanned++;

      // Skip already-known sessions — but still backfill name and missing events
      if (registry[sessionId]) {
        let needsWork = false;

        // Backfill name if null
        if (registry[sessionId].name === null || registry[sessionId].name === undefined) {
          needsWork = true;
        }

        // Check if event file exists — re-extract events if missing
        const eventFilePath = join(_sessionsDir(), `session-${sessionId}.jsonl`);
        let hasEventFile = true;
        try {
          await access(eventFilePath);
        } catch {
          hasEventFile = false;
          needsWork = true;
        }

        if (needsWork) {
          try {
            const raw = await readFile(join(projectPath, file), 'utf-8');
            const lines = raw.split('\n').filter((l) => l.trim());

            // Backfill name
            if (registry[sessionId].name === null || registry[sessionId].name === undefined) {
              const customTitle = extractCustomTitle(lines);
              if (customTitle) {
                await updateRegistry(sessionId, { name: customTitle });
              }
            }

            // Re-extract events if event file is missing
            if (!hasEventFile) {
              const entries = lines.map((l) => JSON.parse(l));
              const events = transcriptToEvents(sessionId, entries);
              for (const event of events) {
                await writeEvent(event);
              }
              if (events.length > 0) result.repaired++;
            }
          } catch {
            // non-fatal — skip
          }
        }

        result.skipped++;
        continue;
      }

      try {
        const raw = await readFile(join(projectPath, file), 'utf-8');
        const lines = raw.split('\n').filter((l) => l.trim());
        const entries = lines.map((l) => JSON.parse(l));

        // Extract metadata from entries
        const cwdEntry = entries.find((e) => e.cwd);
        const cwd: string = cwdEntry?.cwd ?? '';
        const timestamps = entries
          .filter((e) => e.timestamp)
          .map((e) => e.timestamp as string)
          .sort();
        const started_at = timestamps[0] ?? new Date().toISOString();
        const last_active = timestamps[timestamps.length - 1] ?? started_at;

        // Count real user prompts (non-meta, non-command)
        const promptCount = entries.filter(
          (e) =>
            e.type === 'user' &&
            !e.isMeta &&
            typeof e.message?.content === 'string' &&
            !e.message.content.startsWith('<')
        ).length;

        if (promptCount === 0) {
          result.skipped++; // empty/meta-only sessions aren't useful
          continue;
        }

        // Derive project from cwd
        const project_dir = cwd;
        const project = cwd.split('/').filter(Boolean).pop() ?? '';

        // Extract /rename custom title if present
        const customTitle = extractCustomTitle(lines);

        // Write to registry
        await updateRegistry(sessionId, {
          session_id: sessionId,
          project,
          project_dir,
          started_at,
          last_active,
          status: 'ended',
          source: 'transcript',
          name: customTitle,
          tags: [],
          workspace_id: null,
        });

        // Write events to sessions dir
        const events = transcriptToEvents(sessionId, entries);
        for (const event of events) {
          await writeEvent(event);
        }

        registry[sessionId] = { session_id: sessionId } as RegistryEntry; // mark known
        result.imported++;
      } catch {
        result.errors++;
      }
    }
  }

  return result;
}
