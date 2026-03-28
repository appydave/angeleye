import path from 'node:path';
import type {
  AngelEyeEvent,
  SessionScale,
  SessionSubtype,
  SessionType,
  ToolPattern,
} from '@appystack/shared';
import { resolveOverlay } from './overlay.service.js';

export interface ClassificationResult {
  is_junk: boolean;
  session_type?: SessionType;
  session_subtype?: SessionSubtype;
  tool_pattern?: ToolPattern;
  session_scale?: SessionScale;
  first_edited_dir?: string;
  first_real_prompt?: string;
  pii_flags?: string[];
  has_playwright_calls?: boolean;
  is_compaction_resume?: boolean;
  is_machine_initiated?: boolean;
  has_web_research?: boolean;
  has_parallel_subagent_bursts?: boolean;
  has_task_orchestration?: boolean;
  has_git_outcome?: boolean;
  trigger_command?: string | null;
  trigger_arguments?: string | null;
  has_skill_created?: boolean;
  has_skill_modified?: boolean;
  // Tier 2 predicates (regex/heuristic)
  has_brain_file_writes?: boolean;
  has_cross_session_refs?: boolean;
  has_unauthorized_edits?: boolean;
  has_voice_dictation_artifacts?: boolean;
  has_handover_context?: boolean;
  has_cross_project_reads?: boolean;
  has_closing_ceremony?: boolean;
  // Domain overlay classifiers (C14-C16)
  workflow_role?: string | null;
  workflow_identity?: string | null;
  workflow_action?: string | null;
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

// ── session scale detection ──────────────────────────────────────────────────
// Scale thresholds validated across 924-session campaign (angeleye-analysis-1)

export function detectSessionScale(events: AngelEyeEvent[]): SessionScale {
  const toolCount = events.filter((e) => e.event === 'tool_use').length;

  if (toolCount <= 3) return 'micro';
  if (toolCount <= 10) return 'light';
  if (toolCount <= 50) return 'moderate';
  if (toolCount <= 200) return 'heavy';
  return 'marathon';
}

// ── paperclip / autonomous agent detection (B041) ───────────────────────────

const PAPERCLIP_PATTERN = /^You are agent\s+[0-9a-f-]{36}/i;
const POEM_RUN_PATTERN = /^\*?run\s+\d+/i;

export function detectIsPaperclipAgent(events: AngelEyeEvent[]): boolean {
  const firstPrompt = events.find((e) => e.event === 'user_prompt');
  if (!firstPrompt?.prompt) return false;
  return PAPERCLIP_PATTERN.test(firstPrompt.prompt.trim());
}

// ── session_type detection ────────────────────────────────────────────────────

export function detectSessionType(
  toolPattern: ToolPattern,
  projectDir: string,
  events: AngelEyeEvent[]
): SessionType {
  const dirBase = projectDir.toLowerCase();
  const scale = detectSessionScale(events);
  const firstPrompt = events.find((e) => e.event === 'user_prompt');
  const prompt = firstPrompt?.prompt?.trim() ?? '';

  // ── Iron-clad rules (B039 + B041) — override everything ─────────────────

  // B041: Paperclip agent → OPS
  if (detectIsPaperclipAgent(events)) return 'OPS';

  // B039-a: "*run NNN" first prompt → OPS (poem execution)
  if (POEM_RUN_PATTERN.test(prompt)) return 'OPS';

  // B039-c: Zero tool calls → ORIENTATION (never BUILD)
  const toolCount = events.filter((e) => e.event === 'tool_use').length;
  if (toolCount === 0) return 'ORIENTATION';

  // B039-b: brains/ CWD + light/micro scale → KNOWLEDGE (never BUILD)
  if (dirBase.includes('brain') && (scale === 'micro' || scale === 'light')) {
    return 'KNOWLEDGE';
  }

  // ── B038: Scale-aware BUILD guard ───────────────────────────────────────
  // micro sessions: 0% BUILD accuracy, light sessions: <15% accuracy
  // Demote to ORIENTATION instead of BUILD for tiny sessions
  const wouldBeBuild = (pattern: ToolPattern): boolean =>
    pattern === 'bash-heavy' ||
    pattern === 'task-heavy' ||
    pattern === 'agent-heavy' ||
    pattern === 'edit-heavy' ||
    pattern === 'mixed';

  if (scale === 'micro' && wouldBeBuild(toolPattern)) return 'ORIENTATION';
  if (scale === 'light' && wouldBeBuild(toolPattern)) {
    // Light sessions in brains → KNOWLEDGE, otherwise ORIENTATION
    if (dirBase.includes('brain')) return 'KNOWLEDGE';
    return 'ORIENTATION';
  }

  // ── Standard rules (unchanged) ─────────────────────────────────────────

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

  // mixed (moderate+ scale only — micro/light already handled above)
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

// ── PII detection (B040) ──────────────────────────────────────────────────────

const PII_PATTERNS: [string, RegExp][] = [
  ['email', /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/],
  ['ipv4', /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/],
  ['npm_token', /\bnpm_[a-zA-Z0-9]{20,}\b/],
  ['openai_key', /\bsk-[a-zA-Z0-9]{20,}\b/],
  ['bsa_key', /\bBSA[a-zA-Z0-9]{20,}\b/],
  ['github_token', /\bghp_[a-zA-Z0-9]{20,}\b/],
  ['slack_token', /\bxoxb-[a-zA-Z0-9-]{20,}\b/],
  ['aws_key', /\bAKIA[A-Z0-9]{12,}\b/],
  [
    'birthdate',
    /\b(?:born|dob|birthday)\b.*?\b(?:\d{2}[/.-]\d{2}[/.-]\d{4}|\d{4}[/.-]\d{2}[/.-]\d{2})\b/i,
  ],
  ['generic_secret', /\b[a-fA-F0-9]{40,}\b/],
  ['generic_base64_secret', /\b[A-Za-z0-9+/]{40,}={0,2}\b/],
];

export function detectPiiFlags(events: AngelEyeEvent[]): string[] {
  const found = new Set<string>();

  for (const e of events) {
    if (e.event !== 'user_prompt' || !e.prompt) continue;

    for (const [label, pattern] of PII_PATTERNS) {
      if (found.has(label)) continue;
      if (pattern.test(e.prompt)) {
        found.add(label);
      }
    }

    // Early exit if all patterns matched
    if (found.size === PII_PATTERNS.length) break;
  }

  return Array.from(found).sort();
}

// ── P05: has_playwright_calls ────────────────────────────────────────────────

export function detectHasPlaywrightCalls(events: AngelEyeEvent[]): boolean {
  return events.some(
    (e) =>
      e.event === 'tool_use' && typeof e.tool === 'string' && e.tool.startsWith('mcp__playwright__')
  );
}

// ── P09: is_compaction_resume ───────────────────────────────────────────────

export function detectIsCompactionResume(events: AngelEyeEvent[]): boolean {
  return events.some((e) => e.event === 'pre_compact' || e.event === 'post_compact');
}

// ── P12: is_machine_initiated ───────────────────────────────────────────────

export function detectIsMachineInitiated(events: AngelEyeEvent[]): boolean {
  if (events.length === 0) return false;
  return events[0]!.event !== 'user_prompt';
}

// ── P19: has_web_research ───────────────────────────────────────────────────

export function detectHasWebResearch(events: AngelEyeEvent[]): boolean {
  return events.some((e) => {
    if (e.event !== 'tool_use') return false;
    const tool = e.tool ?? '';
    return tool === 'WebFetch' || tool === 'WebSearch' || tool.startsWith('mcp__brave-search__');
  });
}

// ── P20: has_parallel_subagent_bursts ───────────────────────────────────────

export function detectHasParallelSubagentBursts(events: AngelEyeEvent[]): boolean {
  const agentEvents = events.filter((e) => e.event === 'tool_use' && e.tool === 'Agent');
  if (agentEvents.length < 3) return false;

  for (let i = 0; i <= agentEvents.length - 3; i++) {
    const windowStart = new Date(agentEvents[i]!.ts).getTime();
    const windowEnd = new Date(agentEvents[i + 2]!.ts).getTime();
    if (windowEnd - windowStart <= 60_000) return true;
  }

  return false;
}

// ── P21: has_task_orchestration ─────────────────────────────────────────────

export function detectHasTaskOrchestration(events: AngelEyeEvent[]): boolean {
  const taskTools = new Set(['TaskCreate', 'TaskUpdate', 'TaskOutput', 'TaskList']);
  return events.some((e) => e.event === 'tool_use' && taskTools.has(e.tool ?? ''));
}

// ── P22: has_git_outcome ────────────────────────────────────────────────────

const GIT_OUTCOME_PATTERNS = [/git\s+commit/, /git\s+push/, /git\s+merge/, /gh\s+pr\s+create/];

export function detectHasGitOutcome(events: AngelEyeEvent[]): boolean {
  return events.some((e) => {
    if (e.event !== 'tool_use' || e.tool !== 'Bash') return false;
    const command =
      typeof e.tool_summary?.['command'] === 'string' ? e.tool_summary['command'] : '';
    return GIT_OUTCOME_PATTERNS.some((p) => p.test(command));
  });
}

// ── E01: trigger_command ────────────────────────────────────────────────────

const SLASH_COMMAND_PATTERN = /^\/([\w:-]+)/;

export function extractTriggerCommand(events: AngelEyeEvent[]): string | null {
  const firstPrompt = events.find((e) => e.event === 'user_prompt');
  if (!firstPrompt?.prompt) return null;

  const trimmed = firstPrompt.prompt.trim();
  const match = trimmed.match(SLASH_COMMAND_PATTERN);
  if (match) return match[1]!;

  return null;
}

// ── E02: trigger_arguments ──────────────────────────────────────────────────

export function extractTriggerArguments(events: AngelEyeEvent[]): string | null {
  const firstPrompt = events.find((e) => e.event === 'user_prompt');
  if (!firstPrompt?.prompt) return null;

  const trimmed = firstPrompt.prompt.trim();
  const match = trimmed.match(SLASH_COMMAND_PATTERN);
  if (!match) return null;

  const afterCommand = trimmed.replace(/^\/[\w:-]+\s*/, '').trim();
  if (afterCommand.length === 0) return null;

  // Only capture the first line — multi-line content after the command is
  // handover context, not trigger arguments. The arguments are compact tokens
  // like "CS 0.1", "DS 2.4", "wn", "ER", not paragraphs of paste-back text.
  const firstLine = afterCommand.split('\n')[0]!.trim();
  if (firstLine.length === 0) return null;

  // Cap at a reasonable length — true trigger args are short (e.g., "VS 2.4")
  return firstLine.length <= 50 ? firstLine : firstLine.slice(0, 50);
}

// ── P34: has_skill_created ──────────────────────────────────────────────────

export function detectHasSkillCreated(events: AngelEyeEvent[]): boolean {
  return events.some((e) => {
    if (e.event !== 'tool_use' || e.tool !== 'Write') return false;
    const file = typeof e.tool_summary?.['file'] === 'string' ? e.tool_summary['file'] : '';
    return file.includes('/.claude/skills/');
  });
}

// ── P35: has_skill_modified ─────────────────────────────────────────────────

export function detectHasSkillModified(events: AngelEyeEvent[]): boolean {
  return events.some((e) => {
    if (e.event !== 'tool_use' || (e.tool !== 'Edit' && e.tool !== 'MultiEdit')) return false;
    const file = typeof e.tool_summary?.['file'] === 'string' ? e.tool_summary['file'] : '';
    return file.includes('/.claude/skills/');
  });
}

// ── P04: has_brain_file_writes ───────────────────────────────────────────────

export function detectHasBrainFileWrites(events: AngelEyeEvent[]): boolean {
  return events.some((e) => {
    if (
      e.event !== 'tool_use' ||
      (e.tool !== 'Edit' && e.tool !== 'Write' && e.tool !== 'MultiEdit')
    )
      return false;
    const file = typeof e.tool_summary?.['file'] === 'string' ? e.tool_summary['file'] : '';
    return file.includes('/brains/');
  });
}

// ── P06: has_cross_session_refs ─────────────────────────────────────────────

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const CROSS_SESSION_PHRASES =
  /\b(?:previous session|last time|earlier conversation|last session|prior session)\b/i;

export function detectHasCrossSessionRefs(events: AngelEyeEvent[]): boolean {
  for (const e of events) {
    if (e.event !== 'user_prompt' || !e.prompt) continue;
    if (UUID_PATTERN.test(e.prompt)) return true;
    if (CROSS_SESSION_PHRASES.test(e.prompt)) return true;
  }
  return false;
}

// ── P08: has_unauthorized_edits ─────────────────────────────────────────────

export function detectHasUnauthorizedEdits(events: AngelEyeEvent[], projectDir: string): boolean {
  const normalizedDir = projectDir.endsWith('/') ? projectDir : projectDir + '/';

  return events.some((e) => {
    if (
      e.event !== 'tool_use' ||
      (e.tool !== 'Edit' && e.tool !== 'Write' && e.tool !== 'MultiEdit')
    )
      return false;
    const file = typeof e.tool_summary?.['file'] === 'string' ? e.tool_summary['file'] : '';
    if (!file) return false;
    return !file.startsWith(normalizedDir) && !file.startsWith(projectDir);
  });
}

// ── P11: has_voice_dictation_artifacts ───────────────────────────────────────

const STT_ERRORS = /\b(?:cloud|claw)\b/i;
export function detectHasVoiceDictationArtifacts(events: AngelEyeEvent[]): boolean {
  for (const e of events) {
    if (e.event !== 'user_prompt' || !e.prompt) continue;
    const prompt = e.prompt;

    // Check for run-on sentences: >100 words without punctuation breaks
    // Split by sentence-ending punctuation and check each segment
    const segments = prompt.split(/[.!?]+/);
    for (const seg of segments) {
      const words = seg
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0);
      if (words.length > 100) return true;
    }

    // Check for common STT errors in context suggesting Claude was intended
    // "cloud" near coding/AI context, "claw" as misrecognition of "Claude"
    if (STT_ERRORS.test(prompt)) {
      // Only flag if prompt is long enough to be dictation (not just mentioning weather)
      const wordCount = prompt.trim().split(/\s+/).length;
      if (wordCount >= 20) return true;
    }

    // Missing markdown formatting in technical prompts (long prompt, no code fences, no headers)
    const wordCount = prompt.trim().split(/\s+/).length;
    if (
      wordCount >= 50 &&
      !prompt.includes('```') &&
      !prompt.includes('##') &&
      !prompt.includes('- ') &&
      !prompt.includes('\n\n')
    ) {
      return true;
    }
  }
  return false;
}

// ── P17: has_handover_context ───────────────────────────────────────────────

export function detectHasHandoverContext(events: AngelEyeEvent[]): boolean {
  const firstPrompt = events.find((e) => e.event === 'user_prompt');
  if (!firstPrompt?.prompt) return false;

  const prompt = firstPrompt.prompt.trim();

  if (prompt.startsWith('This session is being continued')) return true;
  if (prompt.includes('<task-notification')) return true;
  if (prompt.startsWith('Session Context:')) return true;
  if (firstPrompt.prompt.length > 2000) return true;

  return false;
}

// ── P18: has_cross_project_reads ────────────────────────────────────────────

export function detectHasCrossProjectReads(events: AngelEyeEvent[], projectDir: string): boolean {
  const normalizedDir = projectDir.endsWith('/') ? projectDir : projectDir + '/';
  const readTools = new Set(['Read', 'Glob', 'Grep']);

  return events.some((e) => {
    if (e.event !== 'tool_use' || !readTools.has(e.tool ?? '')) return false;
    const file = typeof e.tool_summary?.['file'] === 'string' ? e.tool_summary['file'] : '';
    if (!file) return false;
    return !file.startsWith(normalizedDir) && !file.startsWith(projectDir);
  });
}

// ── P25: has_closing_ceremony ───────────────────────────────────────────────

const GIT_COMMIT_PUSH_PATTERN = /git\s+(commit|push)/;
const CLOSING_SUMMARY_PATTERN =
  /\b(?:committed|pushed|merged|shipped|deployed|all done|that's it)\b/i;

export function detectHasClosingCeremony(events: AngelEyeEvent[]): boolean {
  // Examine last 10 events
  const tail = events.slice(-10);

  // Check for git commit + git push in Bash tool events within the tail
  const tailToolEvents = tail.filter((e) => e.event === 'tool_use' && e.tool === 'Bash');
  const hasGitCommitPush = tailToolEvents.some((e) => {
    const command =
      typeof e.tool_summary?.['command'] === 'string' ? e.tool_summary['command'] : '';
    return GIT_COMMIT_PUSH_PATTERN.test(command);
  });

  if (hasGitCommitPush) return true;

  // Check final assistant message (last_message on stop events) for summary language
  const lastStop = [...tail].reverse().find((e) => e.event === 'stop');
  if (lastStop?.last_message && CLOSING_SUMMARY_PATTERN.test(lastStop.last_message)) {
    return true;
  }

  return false;
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
  const session_scale = detectSessionScale(events);
  const session_type = detectSessionType(tool_pattern, projectDir, events);
  const first_edited_dir = findFirstEditedDir(events);
  const first_real_prompt = findFirstRealPrompt(events);
  const pii_flags = detectPiiFlags(events);
  const has_playwright_calls = detectHasPlaywrightCalls(events);
  const is_compaction_resume = detectIsCompactionResume(events);
  const is_machine_initiated = detectIsMachineInitiated(events);
  const has_web_research = detectHasWebResearch(events);
  const has_parallel_subagent_bursts = detectHasParallelSubagentBursts(events);
  const has_task_orchestration = detectHasTaskOrchestration(events);
  const has_git_outcome = detectHasGitOutcome(events);
  const trigger_command = extractTriggerCommand(events);
  const trigger_arguments = extractTriggerArguments(events);
  const has_skill_created = detectHasSkillCreated(events);
  const has_skill_modified = detectHasSkillModified(events);
  // Tier 2 predicates
  const has_brain_file_writes = detectHasBrainFileWrites(events);
  const has_cross_session_refs = detectHasCrossSessionRefs(events);
  const has_unauthorized_edits = detectHasUnauthorizedEdits(events, projectDir);
  const has_voice_dictation_artifacts = detectHasVoiceDictationArtifacts(events);
  const has_handover_context = detectHasHandoverContext(events);
  const has_cross_project_reads = detectHasCrossProjectReads(events, projectDir);
  const has_closing_ceremony = detectHasClosingCeremony(events);

  // Domain overlay resolution (C14-C16)
  const overlayResult = resolveOverlay(trigger_command, trigger_arguments);
  const workflow_role = overlayResult?.role ?? null;
  const workflow_identity = overlayResult?.identity ?? null;
  const workflow_action = overlayResult?.action ?? null;

  return {
    is_junk: false,
    tool_pattern,
    session_scale,
    session_type,
    ...(first_edited_dir !== undefined && { first_edited_dir }),
    ...(first_real_prompt !== undefined && { first_real_prompt }),
    ...(pii_flags.length > 0 && { pii_flags }),
    has_playwright_calls,
    is_compaction_resume,
    is_machine_initiated,
    has_web_research,
    has_parallel_subagent_bursts,
    has_task_orchestration,
    has_git_outcome,
    trigger_command,
    trigger_arguments,
    has_skill_created,
    has_skill_modified,
    has_brain_file_writes,
    has_cross_session_refs,
    has_unauthorized_edits,
    has_voice_dictation_artifacts,
    has_handover_context,
    has_cross_project_reads,
    has_closing_ceremony,
    workflow_role,
    workflow_identity,
    workflow_action,
  };
}
