import { describe, it, expect } from 'vitest';
import type { AngelEyeEvent, SessionType, ToolPattern, SessionScale } from '@appystack/shared';
import { detectSessionSubtype } from './classifier.service.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<AngelEyeEvent> = {}): AngelEyeEvent {
  return {
    id: 'evt-001',
    session_id: 'ses-abc',
    ts: '2026-01-01T00:00:00Z',
    source: 'hook',
    event: 'session_start',
    ...overrides,
  };
}

function makeToolEvent(
  tool: string,
  toolSummary?: Record<string, unknown>,
  overrides?: Partial<AngelEyeEvent>
): AngelEyeEvent {
  return makeEvent({
    event: 'tool_use',
    tool,
    tool_summary: toolSummary,
    ...overrides,
  });
}

function makePromptEvent(prompt: string, overrides?: Partial<AngelEyeEvent>): AngelEyeEvent {
  return makeEvent({
    event: 'user_prompt',
    prompt,
    ...overrides,
  });
}

interface SubtypeOptions {
  has_brain_file_writes?: boolean;
  has_git_outcome?: boolean;
  first_real_prompt?: string;
  is_machine_initiated?: boolean;
}

function callDetect(
  events: AngelEyeEvent[],
  sessionType: SessionType,
  toolPattern: ToolPattern,
  sessionScale: SessionScale,
  options: SubtypeOptions = {}
) {
  return detectSessionSubtype(events, sessionType, toolPattern, sessionScale, options);
}

// ── BUILD subtypes ──────────────────────────────────────────────────────────

describe('detectSessionSubtype — BUILD', () => {
  it('returns feature_implementation for edit-heavy + moderate+ scale + git outcome', () => {
    const events = [
      makePromptEvent('implement the new dashboard'),
      ...Array.from({ length: 20 }, (_, i) =>
        makeToolEvent('Edit', { file: '/app/src/dashboard.ts' }, { id: `e${i}` })
      ),
    ];
    const result = callDetect(events, 'BUILD', 'edit-heavy', 'moderate', {
      has_git_outcome: true,
      first_real_prompt: 'implement the new dashboard',
    });
    expect(result).toBe('feature_implementation');
  });

  it('returns bug_fix_round when prompt mentions fix/bug', () => {
    const events = [makePromptEvent('fix the login bug')];
    const result = callDetect(events, 'BUILD', 'mixed', 'moderate', {
      first_real_prompt: 'fix the login bug',
    });
    expect(result).toBe('bug_fix_round');
  });

  it('returns refactoring when prompt mentions refactor', () => {
    const events = [makePromptEvent('refactor the auth module')];
    const result = callDetect(events, 'BUILD', 'edit-heavy', 'moderate', {
      first_real_prompt: 'refactor the auth module',
    });
    expect(result).toBe('refactoring');
  });

  it('returns test_writing when prompt mentions test', () => {
    const events = [makePromptEvent('write tests for the API')];
    const result = callDetect(events, 'BUILD', 'edit-heavy', 'moderate', {
      first_real_prompt: 'write tests for the API',
    });
    expect(result).toBe('test_writing');
  });

  it('returns ci_pipeline for bash-heavy + ci keyword', () => {
    const events = [
      makePromptEvent('set up ci pipeline'),
      makeToolEvent('Bash', { command: 'npm run build' }, { id: '2' }),
    ];
    const result = callDetect(events, 'BUILD', 'bash-heavy', 'moderate', {
      first_real_prompt: 'set up ci pipeline',
    });
    expect(result).toBe('ci_pipeline');
  });

  it('returns undefined when no BUILD rule matches', () => {
    const events = [makePromptEvent('do something')];
    const result = callDetect(events, 'BUILD', 'mixed', 'moderate', {
      first_real_prompt: 'do something',
    });
    expect(result).toBeUndefined();
  });
});

// ── ORIENTATION subtypes ────────────────────────────────────────────────────

describe('detectSessionSubtype — ORIENTATION', () => {
  it('returns codebase_exploration for read-heavy', () => {
    const events = [
      makePromptEvent('explore the codebase'),
      makeToolEvent('Read', undefined, { id: '2' }),
    ];
    const result = callDetect(events, 'ORIENTATION', 'read-heavy', 'moderate', {
      first_real_prompt: 'explore the codebase',
    });
    expect(result).toBe('codebase_exploration');
  });

  it('returns file_retrieval for micro scale + first tool is Read', () => {
    const events = [
      makePromptEvent('show me config'),
      makeToolEvent('Read', undefined, { id: '2' }),
    ];
    const result = callDetect(events, 'ORIENTATION', 'mixed', 'micro', {
      first_real_prompt: 'show me config',
    });
    expect(result).toBe('file_retrieval');
  });

  it('returns artifact_lookup when prompt contains find/where/locate', () => {
    const events = [makePromptEvent('where is the auth middleware')];
    const result = callDetect(events, 'ORIENTATION', 'mixed', 'moderate', {
      first_real_prompt: 'where is the auth middleware',
    });
    expect(result).toBe('artifact_lookup');
  });
});

// ── KNOWLEDGE subtypes ──────────────────────────────────────────────────────

describe('detectSessionSubtype — KNOWLEDGE', () => {
  it('returns brain_capture when brain writes + capture keyword', () => {
    const events = [makePromptEvent('capture this knowledge')];
    const result = callDetect(events, 'KNOWLEDGE', 'edit-heavy', 'moderate', {
      has_brain_file_writes: true,
      first_real_prompt: 'capture this knowledge',
    });
    expect(result).toBe('brain_capture');
  });

  it('returns brain_maintenance when brain writes present', () => {
    const events = [makePromptEvent('update the brain docs')];
    const result = callDetect(events, 'KNOWLEDGE', 'edit-heavy', 'moderate', {
      has_brain_file_writes: true,
      first_real_prompt: 'update the brain docs',
    });
    expect(result).toBe('brain_maintenance');
  });

  it('returns advisory_refinement for edit-heavy targeting .md (not brains)', () => {
    const events = [
      makePromptEvent('update the docs'),
      makeToolEvent('Edit', { file: '/app/docs/guide.md' }, { id: '2' }),
      makeToolEvent('Edit', { file: '/app/docs/setup.md' }, { id: '3' }),
      makeToolEvent('Edit', { file: '/app/docs/api.md' }, { id: '4' }),
    ];
    const result = callDetect(events, 'KNOWLEDGE', 'edit-heavy', 'moderate', {
      has_brain_file_writes: false,
      first_real_prompt: 'update the docs',
    });
    expect(result).toBe('advisory_refinement');
  });
});

// ── RESEARCH subtypes ───────────────────────────────────────────────────────

describe('detectSessionSubtype — RESEARCH', () => {
  it('returns technology_survey for websearch-heavy', () => {
    const events = [makePromptEvent('research React frameworks')];
    const result = callDetect(events, 'RESEARCH', 'websearch-heavy', 'moderate', {
      first_real_prompt: 'research React frameworks',
    });
    expect(result).toBe('technology_survey');
  });

  it('returns hardware_setup_troubleshooting for setup keyword', () => {
    const events = [makePromptEvent('help me setup the printer')];
    const result = callDetect(events, 'RESEARCH', 'mixed', 'moderate', {
      first_real_prompt: 'help me setup the printer',
    });
    expect(result).toBe('hardware_setup_troubleshooting');
  });

  it('returns release_exploration for release keyword', () => {
    const events = [makePromptEvent('what is new in the latest release')];
    const result = callDetect(events, 'RESEARCH', 'mixed', 'moderate', {
      first_real_prompt: 'what is new in the latest release',
    });
    expect(result).toBe('release_exploration');
  });
});

// ── OPS subtypes ────────────────────────────────────────────────────────────

describe('detectSessionSubtype — OPS', () => {
  it('returns poem_execution for "run 42" prompt', () => {
    const events = [makePromptEvent('run 42')];
    const result = callDetect(events, 'OPS', 'bash-heavy', 'moderate', {
      first_real_prompt: 'run 42',
    });
    expect(result).toBe('poem_execution');
  });

  it('returns directory_cleanup for bash-heavy + clean keyword', () => {
    const events = [
      makePromptEvent('clean up temp files'),
      makeToolEvent('Bash', { command: 'rm -rf /tmp/old' }, { id: '2' }),
    ];
    const result = callDetect(events, 'OPS', 'bash-heavy', 'moderate', {
      first_real_prompt: 'clean up temp files',
    });
    expect(result).toBe('directory_cleanup');
  });

  it('returns paperclip_agent when first prompt is paperclip pattern', () => {
    const events = [
      makePromptEvent('You are agent 12345678-1234-1234-1234-123456789abc assigned to...'),
    ];
    const result = callDetect(events, 'OPS', 'mixed', 'moderate', {
      first_real_prompt: 'You are agent 12345678-1234-1234-1234-123456789abc assigned to...',
    });
    expect(result).toBe('paperclip_agent');
  });
});

// ── TEST subtypes ───────────────────────────────────────────────────────────

describe('detectSessionSubtype — TEST', () => {
  it('returns playwright_e2e for playwright-heavy', () => {
    const events = [
      makePromptEvent('run the e2e tests'),
      makeToolEvent('mcp__playwright__browser_navigate', undefined, { id: '2' }),
    ];
    const result = callDetect(events, 'TEST', 'playwright-heavy', 'moderate', {
      first_real_prompt: 'run the e2e tests',
    });
    expect(result).toBe('playwright_e2e');
  });

  it('returns test_debugging when prompt mentions debug/fail', () => {
    const events = [makePromptEvent('debug the failing test')];
    const result = callDetect(events, 'TEST', 'mixed', 'moderate', {
      first_real_prompt: 'debug the failing test',
    });
    expect(result).toBe('test_debugging');
  });
});

// ── Cross-type gating ───────────────────────────────────────────────────────

describe('detectSessionSubtype — type gating', () => {
  it('does not return BUILD subtypes for a TEST session', () => {
    const events = [makePromptEvent('fix the bug')];
    // "fix" matches bug_fix_round rule, but session_type is TEST, not BUILD
    const result = callDetect(events, 'TEST', 'edit-heavy', 'moderate', {
      first_real_prompt: 'fix the bug',
    });
    // Should match test_debugging (TEST rule for "fix") not bug_fix_round (BUILD rule)
    expect(result).toBe('test_debugging');
    expect(result).not.toBe('bug_fix_round');
  });

  it('returns undefined when session type has no matching rules', () => {
    const events = [makePromptEvent('just chatting')];
    // PLANNING type has no rules in our implementation
    const result = callDetect(events, 'PLANNING' as SessionType, 'mixed', 'moderate', {
      first_real_prompt: 'just chatting',
    });
    expect(result).toBeUndefined();
  });
});

// ── Fallback ────────────────────────────────────────────────────────────────

describe('detectSessionSubtype — fallback', () => {
  it('returns undefined when no rules match within a type', () => {
    const events = [makePromptEvent('hello world')];
    const result = callDetect(events, 'RESEARCH', 'mixed', 'moderate', {
      first_real_prompt: 'hello world',
    });
    expect(result).toBeUndefined();
  });
});
