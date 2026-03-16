import path from 'node:path';
import type { AngelEyeEvent, SessionType, ToolPattern } from '@appystack/shared';

export interface ClassificationResult {
  is_junk: boolean;
  session_type?: SessionType;
  tool_pattern?: ToolPattern;
  first_edited_dir?: string;
  first_real_prompt?: string;
}

// ── is_junk detection ─────────────────────────────────────────────────────────

export function detectIsJunk(events: AngelEyeEvent[], sessionId: string): boolean {
  const totalEvents = events.length;

  // Find the first user_prompt event and its prompt text
  const firstPromptEvent = events.find((e) => e.event === 'user_prompt');
  const prompt = firstPromptEvent?.prompt ?? '';
  const cwd = events[0]?.cwd ?? '';

  // PROTECT: single event AND word count >= 5 → NOT junk (check before rules)
  if (
    totalEvents === 1 &&
    prompt
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length >= 5
  ) {
    return false;
  }

  // Rule 1: total_events === 1 AND prompt.length <= 2
  if (totalEvents === 1 && prompt.length <= 2) {
    return true;
  }

  // Rule 2: total_events === 1 AND cwd includes '/tmp'
  if (totalEvents === 1 && cwd.includes('/tmp')) {
    return true;
  }

  // Rule 3: sessionId starts with 'agent-'
  if (sessionId.startsWith('agent-')) {
    return true;
  }

  // Rule 4: total_events === 1 AND prompt starts with 'Hello how can I'
  if (totalEvents === 1 && prompt.startsWith('Hello how can I')) {
    return true;
  }

  // Rule 5: total_events <= 3 AND no tool_use events AND prompt.length <= 5
  const hasToolUse = events.some((e) => e.event === 'tool_use');
  if (totalEvents <= 3 && !hasToolUse && prompt.length <= 5) {
    return true;
  }

  return false;
}

// ── tool_pattern detection ────────────────────────────────────────────────────

export function detectToolPattern(events: AngelEyeEvent[]): ToolPattern {
  const toolEvents = events.filter((e) => e.event === 'tool_use');
  const total = toolEvents.length;

  if (total < 3) {
    return 'mixed';
  }

  let playwright = 0;
  let bash = 0;
  let edit = 0;
  let task = 0;
  let agent = 0;
  let websearch = 0;
  let read = 0;

  for (const e of toolEvents) {
    const tool = e.tool ?? '';

    if (tool.startsWith('mcp__playwright__')) {
      playwright++;
    } else if (tool === 'Bash') {
      bash++;
    } else if (tool === 'Edit' || tool === 'Write' || tool === 'MultiEdit') {
      edit++;
    } else if (
      tool === 'Task' ||
      tool === 'TaskCreate' ||
      tool === 'TaskUpdate' ||
      tool === 'TaskOutput'
    ) {
      task++;
    } else if (tool === 'Agent') {
      agent++;
    } else if (tool === 'WebFetch' || tool.startsWith('mcp__brave-search')) {
      websearch++;
    } else if (tool === 'Glob' || tool === 'Read' || tool === 'Grep') {
      read++;
    }
  }

  // Apply thresholds in order
  if (playwright / total > 0.4) return 'playwright-heavy';
  if (bash / total > 0.4) return 'bash-heavy';
  if (task / total > 0.4) return 'task-heavy';
  if (agent / total > 0.2) return 'agent-heavy';
  if (websearch / total > 0.3) return 'websearch-heavy';
  if (edit / total > 0.4) return 'edit-heavy';
  if (read / total > 0.6 && edit / total < 0.1) return 'read-heavy';

  return 'mixed';
}

// ── session_type detection ────────────────────────────────────────────────────

export function detectSessionType(toolPattern: ToolPattern, projectDir: string): SessionType {
  const dirBase = projectDir.toLowerCase();

  if (toolPattern === 'playwright-heavy') return 'TEST';

  if (toolPattern === 'bash-heavy') {
    const opsKeywords = ['agent-os', 'ansible', 'ci', 'ops'];
    if (opsKeywords.some((kw) => dirBase.includes(kw))) return 'OPS';
    return 'BUILD';
  }

  if (toolPattern === 'task-heavy') return 'BUILD';
  if (toolPattern === 'agent-heavy') return 'BUILD';
  if (toolPattern === 'edit-heavy') return 'BUILD';
  if (toolPattern === 'websearch-heavy') return 'RESEARCH';

  if (toolPattern === 'read-heavy') {
    if (dirBase.includes('brain')) return 'KNOWLEDGE';
    return 'ORIENTATION';
  }

  // mixed
  return 'BUILD';
}

// ── first_edited_dir detection ────────────────────────────────────────────────

export function findFirstEditedDir(events: AngelEyeEvent[]): string | undefined {
  const fileTools = new Set(['Edit', 'Write', 'Read', 'Glob']);

  for (const e of events) {
    if (e.event === 'tool_use' && e.tool && fileTools.has(e.tool)) {
      const toolSummary = e.tool_summary;
      if (toolSummary && typeof toolSummary['file'] === 'string') {
        return path.dirname(toolSummary['file']);
      }
    }
  }

  return undefined;
}

// ── first_real_prompt detection ───────────────────────────────────────────────

export function findFirstRealPrompt(events: AngelEyeEvent[]): string | undefined {
  for (const e of events) {
    if (e.event !== 'user_prompt') continue;

    const prompt = e.prompt;
    if (prompt === undefined || prompt === null) continue;
    if (prompt.length <= 2) continue;

    const trimmed = prompt.trim();

    // Skip context handover injections
    if (trimmed.startsWith('This session is being continued')) continue;
    if (trimmed.startsWith('<task-notification')) continue;
    if (trimmed.startsWith('Session Context:')) continue;

    // Skip paste-as-prompt (too long to be a natural first prompt)
    if (prompt.length > 2000) continue;

    return prompt.slice(0, 200);
  }

  return undefined;
}

// ── classifySession (main entry point) ───────────────────────────────────────

export function classifySession(
  events: AngelEyeEvent[],
  sessionId: string,
  projectDir: string
): ClassificationResult {
  const is_junk = detectIsJunk(events, sessionId);

  if (is_junk) {
    return { is_junk: true };
  }

  const tool_pattern = detectToolPattern(events);
  const session_type = detectSessionType(tool_pattern, projectDir);
  const first_edited_dir = findFirstEditedDir(events);
  const first_real_prompt = findFirstRealPrompt(events);

  return {
    is_junk: false,
    tool_pattern,
    session_type,
    ...(first_edited_dir !== undefined && { first_edited_dir }),
    ...(first_real_prompt !== undefined && { first_real_prompt }),
  };
}
