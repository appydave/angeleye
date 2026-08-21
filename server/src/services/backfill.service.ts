import { readFile, readdir, access } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { AngelEyeEvent, RegistryEntry } from '@appystack/shared';
import { readRegistry, updateRegistry, _sessionsDir } from './registry.service.js';
import { writeEvent } from './sessions.service.js';

// ── Session Title Extraction ─────────────────────────────────────────────────────
//
// Claude Code writes a session's name in TWO entry types, and AngelEye read only
// one of them:
//
//   custom-title  {"type":"custom-title","customTitle":"…"}  — user, via /rename
//   ai-title      {"type":"ai-title","aiTitle":"…"}          — model-generated
//
// `ai-title` is not a rename of `custom-title`; both are live. A 2026-08-21 census
// of the 455 live JSONLs found 2,783 custom-title and 4,115 ai-title entries, and
// `grep -rn "ai-title\|aiTitle" server/src client/src shared/src` returned nothing
// — so the majority source of session names was invisible while AngelEye's own
// enrichment loop derived the same thing from scratch.
//
// PRECEDENCE IS EXPLICIT AND DELIBERATE: a user-chosen name always beats a
// machine-chosen one, no matter which was written last. Within each kind, last
// wins — that is Claude Code's own behaviour, since /rename appends rather than
// mutating. Letting a single last-wins loop pick across both kinds would mean an
// ai-title regenerated after a /rename silently overwrote the user's choice.

export interface ExtractedTitle {
  title: string;
  source: 'custom-title' | 'ai-title';
}

export function extractSessionTitle(lines: string[]): ExtractedTitle | null {
  let lastCustom: string | null = null;
  let lastAi: string | null = null;

  for (const line of lines) {
    try {
      const entry = JSON.parse(line) as Record<string, unknown>;
      if (entry.type === 'custom-title' && typeof entry.customTitle === 'string') {
        lastCustom = entry.customTitle;
      } else if (entry.type === 'ai-title' && typeof entry.aiTitle === 'string') {
        lastAi = entry.aiTitle;
      }
    } catch {
      // skip malformed lines
    }
  }

  if (lastCustom !== null) return { title: lastCustom, source: 'custom-title' };
  if (lastAi !== null) return { title: lastAi, source: 'ai-title' };
  return null;
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
              const extracted = extractSessionTitle(lines);
              if (extracted) {
                await updateRegistry(sessionId, { name: extracted.title });
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

        // Session name: user-chosen /rename title, else the model-generated ai-title
        const sessionName = extractSessionTitle(lines)?.title ?? null;

        // Write to registry
        await updateRegistry(sessionId, {
          session_id: sessionId,
          project,
          project_dir,
          started_at,
          last_active,
          status: 'ended',
          source: 'transcript',
          name: sessionName,
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
