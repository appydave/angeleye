/**
 * Detects headless skill-subprocess sessions — single-shot Haiku/sub-LLM
 * invocations spawned by skills like omi-extract-haiku that ingest as
 * primary user sessions because they don't carry a `<teammate-message>`
 * wrapper (Mechanism B detection misses them).
 *
 * Heuristic:
 *   1. event_count <= 5 (effectively a one-shot invocation)
 *   2. First user_prompt matches a known subprocess template pattern
 *      (starts with `-\n`, "You are executing", or specific extraction prefixes)
 *
 * Background: surfaced 2026-05-04 enriching orientation.quick_check —
 * 185+ k-lars omi-extract-haiku rows polluting LLM-enrichment queues.
 *
 * See: docs/architecture/known-issues.md#subprocess-session-mechanism-3
 */

import type { AngelEyeEvent } from '@appystack/shared';

/**
 * Template prefixes used by skill subprocess invocations. Each is a single-shot
 * task wrapped as a separate session. The leading `-\n` is the omi-extract-haiku
 * convention; "You are executing" is used by /skill-execution wrappers.
 *
 * Add a new prefix when a new headless-skill family surfaces in the queue.
 */
const SUBPROCESS_PROMPT_PREFIXES = ['-\n', 'You are executing', 'Pre-compaction memory flush'];

/**
 * Bare extraction templates — same omi-extract-haiku family but without the
 * leading dash separator (rare — most carry the `-\n` prefix).
 */
const SUBPROCESS_PROMPT_PATTERNS: RegExp[] = [
  /^Extract entities and relationships/i,
  /^Extract \d+-\d+ concrete facts/i,
  /^Extract key facts from this conversation/i,
  /^Generate \d+-\d+ relevant tags/i,
  /^Summarize this content for a personal knowledge system/i,
  /^Given a NEW fact and a list of EXISTING facts/i,
  /^You are an entity graph deduplication assistant/i,
  /^You are executing a heartbeat task/i,
  /^Given these observations about/i,
  /^Write a concise \d-sentence profile/i,
];

const MAX_EVENTS_FOR_SUBPROCESS = 5;

/**
 * Decide whether a prompt body matches a subprocess template.
 */
function isSubprocessPrompt(prompt: string): boolean {
  if (!prompt) return false;
  const trimmed = prompt.trimStart();
  for (const prefix of SUBPROCESS_PROMPT_PREFIXES) {
    if (trimmed.startsWith(prefix)) return true;
  }
  // After stripping a leading `-\n` separator (some have it, some don't),
  // check the remaining text against known templates.
  const body = trimmed.startsWith('-\n') ? trimmed.slice(2) : trimmed;
  for (const pattern of SUBPROCESS_PROMPT_PATTERNS) {
    if (pattern.test(body)) return true;
  }
  return false;
}

export interface SubprocessDetectionResult {
  is_subprocess: boolean;
}

/**
 * Detect whether a session is a headless skill subprocess invocation.
 * Operates on the AngelEye event stream — does not need raw Claude Code JSONL.
 */
export function detectSubprocess(events: AngelEyeEvent[]): SubprocessDetectionResult {
  if (events.length > MAX_EVENTS_FOR_SUBPROCESS) {
    return { is_subprocess: false };
  }
  const firstPrompt = events.find((e) => e.event === 'user_prompt');
  if (!firstPrompt || typeof firstPrompt.prompt !== 'string') {
    return { is_subprocess: false };
  }
  if (isSubprocessPrompt(firstPrompt.prompt)) {
    return { is_subprocess: true };
  }
  return { is_subprocess: false };
}
