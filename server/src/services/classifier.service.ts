import path from 'node:path';
import type {
  AngelEyeEvent,
  ClosingStyle,
  DelegationStyle,
  InitiationSource,
  OpeningStyle,
  OutputType,
  SessionContinuity,
  SessionLiveness,
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
  // Phase 2c classifiers (B060)
  delegation_style?: DelegationStyle;
  initiation_source?: InitiationSource;
  session_continuity?: SessionContinuity;
  opening_style?: OpeningStyle;
  closing_style?: ClosingStyle;
  autonomy_ratio?: number;
  session_liveness?: SessionLiveness;
  output_type?: OutputType;
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

// ── C08: delegation_style ──────────────────────────────────────────────────

export function detectDelegationStyle(events: AngelEyeEvent[]): DelegationStyle {
  const hasTaskOrch = detectHasTaskOrchestration(events);
  const hasSubagentBursts = detectHasParallelSubagentBursts(events);

  // Check for agent-heavy tool pattern
  const toolEvents = events.filter((e) => e.event === 'tool_use');
  const agentCount = toolEvents.filter((e) => e.tool === 'Agent').length;
  const isAgentHeavy = toolEvents.length >= 3 && agentCount / toolEvents.length > 0.2;

  if (hasTaskOrch || hasSubagentBursts || isAgentHeavy) return 'orchestrated';

  const isMachine = detectIsMachineInitiated(events);
  const scale = detectSessionScale(events);
  if (isMachine && scale !== 'micro' && scale !== 'light') return 'autonomous';

  // Directive: first prompt is short imperative (<50 chars, no question mark)
  const firstPrompt = events.find((e) => e.event === 'user_prompt');
  if (firstPrompt?.prompt) {
    const p = firstPrompt.prompt.trim();
    if (p.length < 50 && !p.includes('?')) return 'directive';
  }

  return 'conversational';
}

// ── C09: initiation_source ────────────────────────────────────────────────

export function detectInitiationSource(events: AngelEyeEvent[]): InitiationSource {
  if (detectIsMachineInitiated(events)) return 'agent_dispatched';

  const triggerCmd = extractTriggerCommand(events);
  if (triggerCmd) return 'skill_invoked';

  if (detectHasVoiceDictationArtifacts(events)) return 'voice_dictated';
  if (detectHasHandoverContext(events)) return 'handover_paste';

  return 'user_typed';
}

// ── C10: session_continuity ───────────────────────────────────────────────

export function detectSessionContinuity(events: AngelEyeEvent[]): SessionContinuity {
  if (detectIsCompactionResume(events)) return 'compaction';
  if (detectHasHandoverContext(events)) return 'handover_paste';

  const triggerCmd = extractTriggerCommand(events);
  if (triggerCmd) {
    // skill_launcher: trigger_command is non-null AND first prompt is the skill invocation only
    const firstPrompt = events.find((e) => e.event === 'user_prompt');
    if (firstPrompt?.prompt) {
      const trimmed = firstPrompt.prompt.trim();
      // If the prompt is just the slash command (possibly with short args), it's a launcher
      if (trimmed.startsWith('/') && trimmed.split('\n').length <= 1) return 'skill_launcher';
    }
  }

  if (detectHasCrossSessionRefs(events)) return 'recall';

  return 'fresh';
}

// ── C11: output_type ──────────────────────────────────────────────────────

export function detectOutputType(events: AngelEyeEvent[]): OutputType {
  const writeTools = new Set(['Edit', 'Write', 'MultiEdit']);
  const writeEvents = events.filter((e) => e.event === 'tool_use' && writeTools.has(e.tool ?? ''));

  if (writeEvents.length === 0) return 'conversation_only';

  let hasCodeChanges = false;
  let hasKnowledge = false;
  let hasNewArtifactsOnly = true;

  for (const e of writeEvents) {
    const file = typeof e.tool_summary?.['file'] === 'string' ? e.tool_summary['file'] : '';
    if (!file) continue;
    const isMarkdown = file.endsWith('.md');
    const isBrains = file.includes('/brains/');

    if (isMarkdown || isBrains) {
      hasKnowledge = true;
    } else {
      hasCodeChanges = true;
    }

    if (e.tool === 'Edit' || e.tool === 'MultiEdit') {
      hasNewArtifactsOnly = false;
    }
  }

  if (hasCodeChanges && hasKnowledge) return 'mixed';
  if (hasCodeChanges) return 'code_changes';
  if (hasKnowledge) return 'knowledge_synthesis';
  if (hasNewArtifactsOnly) return 'new_artifacts';

  return 'conversation_only';
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

  // Phase 2c classifiers (B060)
  const delegation_style = detectDelegationStyle(events);
  const initiation_source = detectInitiationSource(events);
  const session_continuity = detectSessionContinuity(events);
  const opening_style = detectOpeningStyle(events);
  const closing_style = detectClosingStyle(events);
  const autonomy_ratio = detectAutonomyRatio(events);
  const session_liveness = detectSessionLiveness(events);
  const output_type = detectOutputType(events);

  // Session subtype (B061) — depends on session_type, tool_pattern, session_scale
  const session_subtype = detectSessionSubtype(events, session_type, tool_pattern, session_scale, {
    has_brain_file_writes,
    has_git_outcome,
    first_real_prompt,
    is_machine_initiated,
  });

  return {
    is_junk: false,
    tool_pattern,
    session_scale,
    session_type,
    ...(session_subtype !== undefined && { session_subtype }),
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
    delegation_style,
    initiation_source,
    session_continuity,
    opening_style,
    closing_style,
    autonomy_ratio,
    session_liveness,
    output_type,
  };
}

// ── session_subtype detection (B061) ────────────────────────────────────────

export function detectSessionSubtype(
  events: AngelEyeEvent[],
  sessionType: SessionType,
  toolPattern: ToolPattern,
  sessionScale: SessionScale,
  options: {
    has_brain_file_writes?: boolean;
    has_git_outcome?: boolean;
    first_real_prompt?: string;
    is_machine_initiated?: boolean;
  }
): SessionSubtype | undefined {
  const prompt = options.first_real_prompt ?? '';

  // ── BUILD subtypes ──────────────────────────────────────────────────────
  if (sessionType === 'BUILD') {
    if (
      toolPattern === 'edit-heavy' &&
      (sessionScale === 'moderate' || sessionScale === 'heavy' || sessionScale === 'marathon') &&
      options.has_git_outcome
    ) {
      return 'feature_implementation';
    }
    if (/\b(?:fix|bug|broken|error)s?\b/i.test(prompt)) return 'bug_fix_round';
    if (/\b(?:refactor|rename|extract|clean)\b/i.test(prompt)) return 'refactoring';
    if (/\b(?:test|spec|coverage)s?\b/i.test(prompt)) return 'test_writing';
    // Check edit targets for test files
    const editEvents = events.filter(
      (e) =>
        e.event === 'tool_use' &&
        (e.tool === 'Edit' || e.tool === 'Write' || e.tool === 'MultiEdit')
    );
    const testFileEdits = editEvents.filter((e) => {
      const file = typeof e.tool_summary?.['file'] === 'string' ? e.tool_summary['file'] : '';
      return file.endsWith('.test.ts') || file.endsWith('.test.tsx') || file.endsWith('.spec.ts');
    });
    if (testFileEdits.length > 0 && testFileEdits.length >= editEvents.length * 0.5) {
      return 'test_writing';
    }
    if (/\b(?:ci|pipeline|deploy|release)s?\b/i.test(prompt) && toolPattern === 'bash-heavy') {
      return 'ci_pipeline';
    }
    return undefined;
  }

  // ── ORIENTATION subtypes ────────────────────────────────────────────────
  if (sessionType === 'ORIENTATION') {
    if ((sessionScale === 'micro' || sessionScale === 'light') && events.length > 0) {
      const firstTool = events.find((e) => e.event === 'tool_use');
      if (firstTool && (firstTool.tool === 'Read' || firstTool.tool === 'Glob')) {
        return 'file_retrieval';
      }
    }
    if (/\b(?:find|where|locate|show me)\b/i.test(prompt)) return 'artifact_lookup';
    if (toolPattern === 'read-heavy') return 'codebase_exploration';
    return undefined;
  }

  // ── KNOWLEDGE subtypes ──────────────────────────────────────────────────
  if (sessionType === 'KNOWLEDGE') {
    if (options.has_brain_file_writes && /capture|save|store|remember/i.test(prompt)) {
      return 'brain_capture';
    }
    if (options.has_brain_file_writes) return 'brain_maintenance';
    // advisory_refinement: edit-heavy targeting .md files (not brains/)
    if (toolPattern === 'edit-heavy') {
      const editEvents = events.filter(
        (e) =>
          e.event === 'tool_use' &&
          (e.tool === 'Edit' || e.tool === 'Write' || e.tool === 'MultiEdit')
      );
      const mdEdits = editEvents.filter((e) => {
        const file = typeof e.tool_summary?.['file'] === 'string' ? e.tool_summary['file'] : '';
        return file.endsWith('.md') && !file.includes('/brains/');
      });
      if (mdEdits.length > 0) return 'advisory_refinement';
    }
    return undefined;
  }

  // ── RESEARCH subtypes ──────────────────────────────────────────────────
  if (sessionType === 'RESEARCH') {
    if (toolPattern === 'websearch-heavy') return 'technology_survey';
    if (/\b(?:setup|install|config|hardware)\b/i.test(prompt))
      return 'hardware_setup_troubleshooting';
    if (/\b(?:release|version|changelog)s?\b/i.test(prompt)) return 'release_exploration';
    return undefined;
  }

  // ── OPS subtypes ────────────────────────────────────────────────────────
  if (sessionType === 'OPS') {
    if (detectIsPaperclipAgent(events)) return 'paperclip_agent';
    if (/^\*?run\s+\d+/i.test(prompt)) return 'poem_execution';
    if (toolPattern === 'bash-heavy' && /\b(?:clean|delete|remove|organize)\b/i.test(prompt)) {
      return 'directory_cleanup';
    }
    return undefined;
  }

  // ── TEST subtypes ──────────────────────────────────────────────────────
  if (sessionType === 'TEST') {
    if (toolPattern === 'playwright-heavy') return 'playwright_e2e';
    if (/\b(?:debug|fail|broken|fix)\w*\b/i.test(prompt)) return 'test_debugging';
    return undefined;
  }

  return undefined;
}

// ── C12: opening_style ──────────────────────────────────────────────────────

const GREETING_PATTERN = /^(hello|hi|hey|good morning)/i;
const CONTINUATION_PATTERN =
  /\b(?:continuing|continued|last time|last session|prior session|pick up where)\b/i;
const STRUCTURED_MARKERS = /[{}[\]]|^#{1,3}\s/m;

export function detectOpeningStyle(events: AngelEyeEvent[]): OpeningStyle {
  if (events.length === 0) return 'unknown';

  // agent_initiated: first event is not user_prompt
  if (events[0]!.event !== 'user_prompt') return 'agent_initiated';

  const firstPrompt = events.find((e) => e.event === 'user_prompt');
  if (!firstPrompt?.prompt) return 'unknown';

  const prompt = firstPrompt.prompt.trim();
  const len = prompt.length;

  // skill_invocation: starts with /
  if (prompt.startsWith('/')) return 'skill_invocation';

  // paste_handover: >2000 chars or handover markers
  if (
    len > 2000 ||
    prompt.startsWith('This session is being continued') ||
    prompt.includes('<task-notification')
  ) {
    return 'paste_handover';
  }

  // voice_dictation: long run-on without punctuation breaks
  const segments = prompt.split(/[.!?]+/);
  const hasRunOn = segments.some((seg) => {
    const words = seg
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    return words.length > 100;
  });
  if (hasRunOn && len > 100) return 'voice_dictation';

  // code_paste: contains code markers, 200-2000 chars
  if (len >= 200 && len <= 2000 && (prompt.includes('```') || /^ {4}\S/m.test(prompt))) {
    return 'code_paste';
  }

  // context_dump: >500 chars with structured markers (JSON, markdown headers)
  if (len > 500 && STRUCTURED_MARKERS.test(prompt)) return 'context_dump';

  // greeting: short greeting
  if (GREETING_PATTERN.test(prompt) && len < 20) return 'greeting';

  // continuation: references prior session
  if (CONTINUATION_PATTERN.test(prompt)) return 'continuation';

  // typed_instruction: imperative, <200 chars, no question mark
  if (len < 200 && !prompt.includes('?')) return 'typed_instruction';

  // typed_question: ends with ? or is short conversational
  if (prompt.endsWith('?') || len < 100) return 'typed_question';

  return 'unknown';
}

// ── C13: closing_style ──────────────────────────────────────────────────────

const CLOSING_LANGUAGE =
  /\b(?:all done|that's it|shipped|deployed|committed|pushed|merged|complete|finished|wrapped up)\b/i;
const HANDOFF_LANGUAGE =
  /\b(?:next session|pick up later|save context|hand off|continue later|next time)\b/i;

export function detectClosingStyle(events: AngelEyeEvent[]): ClosingStyle {
  if (events.length === 0) return 'unknown';

  const tail = events.slice(-10);
  const last3 = events.slice(-3);

  // error_bail: last 3 events contain tool_failure or stop_failure
  if (last3.some((e) => e.event === 'tool_failure' || e.event === 'stop_failure')) {
    return 'error_bail';
  }

  // Check for git commit/push in Bash tool events in the tail
  const tailBashCommands = tail
    .filter((e) => e.event === 'tool_use' && e.tool === 'Bash')
    .map((e) => (typeof e.tool_summary?.['command'] === 'string' ? e.tool_summary['command'] : ''));

  const hasCommit = tailBashCommands.some((cmd) => /git\s+commit/.test(cmd));
  const hasPush = tailBashCommands.some((cmd) => /git\s+push/.test(cmd));

  if (hasCommit && hasPush) return 'commit_push';
  if (hasCommit) return 'commit_only';

  // Find last stop event in tail for summary/handoff checks
  const lastStop = [...tail].reverse().find((e) => e.event === 'stop');
  const lastMessage = lastStop?.last_message ?? '';

  // task_handoff: mentions next session, save context
  if (HANDOFF_LANGUAGE.test(lastMessage)) return 'task_handoff';

  // summary_close: closing language in last stop message
  if (CLOSING_LANGUAGE.test(lastMessage)) return 'summary_close';

  // question_answer: last events are user_prompt + stop with no tool_use between
  const lastEvents = events.slice(-4);
  let lastPromptIdx = -1;
  let lastStopIdx = -1;
  for (let i = lastEvents.length - 1; i >= 0; i--) {
    if (lastPromptIdx === -1 && lastEvents[i]!.event === 'user_prompt') lastPromptIdx = i;
    if (lastStopIdx === -1 && lastEvents[i]!.event === 'stop') lastStopIdx = i;
  }
  if (
    lastPromptIdx >= 0 &&
    lastStopIdx > lastPromptIdx &&
    !lastEvents.slice(lastPromptIdx, lastStopIdx).some((e) => e.event === 'tool_use')
  ) {
    return 'question_answer';
  }

  // natural_completion: has closing ceremony but not commit/push (already checked)
  if (lastStop && lastMessage.length > 0) return 'natural_completion';

  // abrupt_abandon: no closing ceremony, no summary
  return 'abrupt_abandon';
}

// ── C15: autonomy_ratio ─────────────────────────────────────────────────────

export function detectAutonomyRatio(events: AngelEyeEvent[]): number {
  const toolEvents = events.filter((e) => e.event === 'tool_use').length;
  const promptEvents = events.filter((e) => e.event === 'user_prompt').length;
  const total = toolEvents + promptEvents;

  if (total === 0) return 0;

  return Math.round((toolEvents / total) * 100) / 100;
}

// ── C16: session_liveness ───────────────────────────────────────────────────

export function detectSessionLiveness(events: AngelEyeEvent[]): SessionLiveness {
  if (events.length === 0) return 'low';

  const totalEvents = events.length;

  // Calculate session duration in minutes
  const timestamps = events.map((e) => new Date(e.ts).getTime()).filter((t) => !isNaN(t));

  if (timestamps.length < 2) {
    // Can't compute duration — use event count heuristic
    if (totalEvents > 10) return 'high';
    if (totalEvents >= 3) return 'medium';
    return 'low';
  }

  const firstTs = timestamps.reduce((a, b) => Math.min(a, b));
  const lastTs = timestamps.reduce((a, b) => Math.max(a, b));
  const durationMinutes = (lastTs - firstTs) / 60_000;

  if (durationMinutes < 1) {
    // Very short session — use event count
    if (totalEvents > 10) return 'high';
    if (totalEvents >= 3) return 'medium';
    return 'low';
  }

  const eventsPerMinute = totalEvents / durationMinutes;

  if (eventsPerMinute > 5) return 'high';
  if (eventsPerMinute >= 1) return 'medium';
  return 'low';
}
