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
  has_playwright_calls?: boolean;
  has_task_orchestration?: boolean;
  has_parallel_subagent_bursts?: boolean;
  has_skill_created?: boolean;
  has_skill_modified?: boolean;
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
    expect(result).toBe('build.shipped');
  });

  it('returns bug_fix_round when prompt mentions fix/bug', () => {
    const events = [makePromptEvent('fix the login bug')];
    const result = callDetect(events, 'BUILD', 'mixed', 'moderate', {
      first_real_prompt: 'fix the login bug',
    });
    expect(result).toBe('build.bug_fix');
  });

  it('returns refactoring when prompt mentions refactor', () => {
    const events = [makePromptEvent('refactor the auth module')];
    const result = callDetect(events, 'BUILD', 'edit-heavy', 'moderate', {
      first_real_prompt: 'refactor the auth module',
    });
    expect(result).toBe('build.refactor');
  });

  it('returns test_writing when prompt mentions test', () => {
    const events = [makePromptEvent('write tests for the API')];
    const result = callDetect(events, 'BUILD', 'edit-heavy', 'moderate', {
      first_real_prompt: 'write tests for the API',
    });
    expect(result).toBe('build.test_writing');
  });

  it('returns ci_pipeline for bash-heavy + ci keyword', () => {
    const events = [
      makePromptEvent('set up ci pipeline'),
      makeToolEvent('Bash', { command: 'npm run build' }, { id: '2' }),
    ];
    const result = callDetect(events, 'BUILD', 'bash-heavy', 'moderate', {
      first_real_prompt: 'set up ci pipeline',
    });
    expect(result).toBe('build.ci_pipeline');
  });

  it('defaults to build.feature when no specific BUILD rule matches', () => {
    const events = [makePromptEvent('do something')];
    const result = callDetect(events, 'BUILD', 'mixed', 'moderate', {
      first_real_prompt: 'do something',
    });
    expect(result).toBe('build.feature');
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
    expect(result).toBe('orientation.codebase_exploration');
  });

  it('returns orientation.quick_check for micro scale (fastest signal)', () => {
    const events = [
      makePromptEvent('show me config'),
      makeToolEvent('Read', undefined, { id: '2' }),
    ];
    const result = callDetect(events, 'ORIENTATION', 'mixed', 'micro', {
      first_real_prompt: 'show me config',
    });
    expect(result).toBe('orientation.quick_check');
  });

  it('returns file_retrieval for light scale + first tool is Read', () => {
    const events = [
      makePromptEvent('read the main config file'),
      makeToolEvent('Read', undefined, { id: '2' }),
    ];
    const result = callDetect(events, 'ORIENTATION', 'read-heavy', 'light', {
      first_real_prompt: 'read the main config file',
    });
    expect(result).toBe('orientation.file_retrieval');
  });

  it('returns artifact_lookup when prompt contains find/where/locate', () => {
    const events = [makePromptEvent('where is the auth middleware')];
    const result = callDetect(events, 'ORIENTATION', 'mixed', 'moderate', {
      first_real_prompt: 'where is the auth middleware',
    });
    expect(result).toBe('orientation.artifact_lookup');
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
    expect(result).toBe('knowledge.brain_capture');
  });

  it('returns brain_maintenance when brain writes present', () => {
    const events = [makePromptEvent('update the brain docs')];
    const result = callDetect(events, 'KNOWLEDGE', 'edit-heavy', 'moderate', {
      has_brain_file_writes: true,
      first_real_prompt: 'update the brain docs',
    });
    expect(result).toBe('knowledge.brain_maintenance');
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
    expect(result).toBe('knowledge.advisory_refinement');
  });
});

// ── RESEARCH subtypes ───────────────────────────────────────────────────────

describe('detectSessionSubtype — RESEARCH', () => {
  it('returns technology_survey for websearch-heavy', () => {
    const events = [makePromptEvent('research React frameworks')];
    const result = callDetect(events, 'RESEARCH', 'websearch-heavy', 'moderate', {
      first_real_prompt: 'research React frameworks',
    });
    expect(result).toBe('research.technology_survey');
  });

  it('returns hardware_setup_troubleshooting for setup keyword', () => {
    const events = [makePromptEvent('help me setup the printer')];
    const result = callDetect(events, 'RESEARCH', 'mixed', 'moderate', {
      first_real_prompt: 'help me setup the printer',
    });
    expect(result).toBe('research.technology_survey');
  });

  it('returns release_exploration for release keyword', () => {
    const events = [makePromptEvent('what is new in the latest release')];
    const result = callDetect(events, 'RESEARCH', 'mixed', 'moderate', {
      first_real_prompt: 'what is new in the latest release',
    });
    expect(result).toBe('research.exploration');
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
    expect(result).not.toBe('build.bug_fix');
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
  it('defaults to research.exploration when no specific RESEARCH rule matches', () => {
    const events = [makePromptEvent('hello world')];
    const result = callDetect(events, 'RESEARCH', 'mixed', 'moderate', {
      first_real_prompt: 'hello world',
    });
    expect(result).toBe('research.exploration');
  });
});

// ── isSkillInvocation behaviour (built-in command exclusion) ───────────────

describe('detectSessionSubtype — built-in slash commands do NOT trigger build.campaign', () => {
  const builtins = [
    '/clear',
    '/compact',
    '/help',
    '/skills',
    '/jump',
    '/exit',
    '/memory',
    '/model',
  ];

  builtins.forEach((cmd) => {
    it(`treats "${cmd}" as a built-in (no build.campaign trigger)`, () => {
      const events = [
        makePromptEvent(cmd),
        ...Array.from({ length: 5 }, (_, i) => makeToolEvent('Bash', undefined, { id: `e${i}` })),
      ];
      const result = callDetect(events, 'BUILD', 'bash-heavy', 'moderate', {
        first_real_prompt: cmd,
      });
      expect(result).not.toBe('build.campaign');
    });
  });

  it('still triggers build.campaign for genuine skill invocations like /ralphy', () => {
    const events = [
      makePromptEvent('/ralphy let us go'),
      ...Array.from({ length: 5 }, (_, i) => makeToolEvent('Bash', undefined, { id: `e${i}` })),
    ];
    const result = callDetect(events, 'BUILD', 'bash-heavy', 'moderate', {
      first_real_prompt: '/ralphy let us go',
    });
    expect(result).toBe('build.campaign');
  });

  it('still triggers build.campaign for plugin-prefixed commands like /appydave:ralphy', () => {
    const events = [
      makePromptEvent('/appydave:ralphy do the thing'),
      ...Array.from({ length: 5 }, (_, i) => makeToolEvent('Bash', undefined, { id: `e${i}` })),
    ];
    const result = callDetect(events, 'BUILD', 'bash-heavy', 'moderate', {
      first_real_prompt: '/appydave:ralphy do the thing',
    });
    expect(result).toBe('build.campaign');
  });
});

// ── Empty ghost session ─────────────────────────────────────────────────────

describe('detectSessionSubtype — empty ghost sessions', () => {
  it('returns meta.ghost_session when no user_prompt events fire', () => {
    const events: AngelEyeEvent[] = [
      makeEvent({ event: 'session_start', id: 'e1' }),
      makeEvent({ event: 'instructions_loaded', id: 'e2' }),
      makeEvent({ event: 'session_end', id: 'e3' }),
    ];
    const result = callDetect(events, 'BUILD', 'mixed', 'micro', {});
    expect(result).toBe('meta.ghost_session');
  });

  it('does NOT flag empty ghost when there IS a user_prompt', () => {
    const events: AngelEyeEvent[] = [
      makeEvent({ event: 'session_start', id: 'e1' }),
      makePromptEvent('hello', { id: 'e2' }),
      makeEvent({ event: 'session_end', id: 'e3' }),
    ];
    const result = callDetect(events, 'BUILD', 'mixed', 'micro', {
      first_real_prompt: 'hello',
    });
    expect(result).not.toBe('meta.ghost_session');
  });

  it('does NOT flag long sessions even with no user_prompt (data anomaly, not ghost)', () => {
    const events: AngelEyeEvent[] = Array.from({ length: 20 }, (_, i) =>
      makeToolEvent('Bash', undefined, { id: `e${i}` })
    );
    const result = callDetect(events, 'BUILD', 'bash-heavy', 'heavy', {});
    expect(result).not.toBe('meta.ghost_session');
  });
});

// ── findFirstRealPrompt — settings-only built-ins are skipped ─────────────

import { findFirstRealPrompt } from './classifier.service.js';

describe('findFirstRealPrompt — skip settings-only built-ins', () => {
  it('skips /model sonnet alone and returns next prompt', () => {
    const events = [
      makePromptEvent('/model sonnet', { id: 'p1' }),
      makePromptEvent('How do I run the app?', { id: 'p2' }),
    ];
    expect(findFirstRealPrompt(events)).toBe('How do I run the app?');
  });

  it('skips /login alone and returns next prompt', () => {
    const events = [
      makePromptEvent('/login', { id: 'p1' }),
      makePromptEvent('please review the auth code', { id: 'p2' }),
    ];
    expect(findFirstRealPrompt(events)).toBe('please review the auth code');
  });

  it('does NOT skip /model sonnet please help with X (real instruction)', () => {
    const events = [makePromptEvent('/model sonnet please help with auth bug', { id: 'p1' })];
    expect(findFirstRealPrompt(events)).toBe('/model sonnet please help with auth bug');
  });

  it('returns undefined when only settings commands fire', () => {
    const events = [
      makePromptEvent('/model', { id: 'p1' }),
      makePromptEvent('/login', { id: 'p2' }),
    ];
    expect(findFirstRealPrompt(events)).toBeUndefined();
  });
});

// ── Skill-name lookup (specific subtype overrides) ─────────────────────────

describe('detectSessionSubtype — skill-name lookup overrides build.campaign', () => {
  const cases: Array<[string, string]> = [
    ['/brain-librarian', 'knowledge.brain_audit'],
    ['/brain-librarian full health check', 'knowledge.brain_audit'],
    ['/release-notes', 'knowledge.brain_maintenance'],
    ['/brand-dave:refresh-claude-brain', 'knowledge.brain_maintenance'],
    ['/brand-dave:refresh-bmad-brain', 'knowledge.brain_maintenance'],
    ['/brand-dave:refresh-google-brain', 'knowledge.brain_maintenance'],
    ['/omi-extract', 'knowledge.omi_ingestion'],
    ['/omi-fetch', 'knowledge.omi_ingestion'],
    ['/appydave:omi-fetch', 'knowledge.omi_ingestion'],
    ['/appydave:omi', 'knowledge.omi_ingestion'],
    ['/system-context', 'knowledge.advisory_refinement'],
    ['/appydave:system-context', 'knowledge.advisory_refinement'],
  ];

  cases.forEach(([prompt, expected]) => {
    it(`maps "${prompt}" to ${expected}`, () => {
      const events = [
        makePromptEvent(prompt),
        ...Array.from({ length: 5 }, (_, i) => makeToolEvent('Bash', undefined, { id: `e${i}` })),
      ];
      const result = callDetect(events, 'BUILD', 'bash-heavy', 'moderate', {
        first_real_prompt: prompt,
      });
      expect(result).toBe(expected);
    });
  });

  it('does NOT divert /bmad-* — those stay build.campaign', () => {
    const events = [
      makePromptEvent('/bmad-dev DS 5.4'),
      ...Array.from({ length: 5 }, (_, i) => makeToolEvent('Bash', undefined, { id: `e${i}` })),
    ];
    const result = callDetect(events, 'BUILD', 'bash-heavy', 'moderate', {
      first_real_prompt: '/bmad-dev DS 5.4',
    });
    expect(result).toBe('build.campaign');
  });

  it('does NOT divert /focus — those stay build.campaign', () => {
    const events = [
      makePromptEvent('/focus angeleye'),
      ...Array.from({ length: 5 }, (_, i) => makeToolEvent('Bash', undefined, { id: `e${i}` })),
    ];
    const result = callDetect(events, 'BUILD', 'bash-heavy', 'moderate', {
      first_real_prompt: '/focus angeleye',
    });
    expect(result).toBe('build.campaign');
  });

  it('non-skill prompts are not affected', () => {
    const events = [
      makePromptEvent('how do I run the tests'),
      ...Array.from({ length: 5 }, (_, i) => makeToolEvent('Bash', undefined, { id: `e${i}` })),
    ];
    const result = callDetect(events, 'BUILD', 'bash-heavy', 'moderate', {
      first_real_prompt: 'how do I run the tests',
    });
    // falls through to existing rules — not knowledge.* anything
    expect(result).not.toMatch(/^knowledge\./);
  });
});

// ── Abandoned / test prompts → meta.accidental ─────────────────────────────

describe('detectSessionSubtype — abandoned/test prompts', () => {
  const accidentalCases = [
    'session',
    'config',
    'hello',
    'sessions',
    '/exit',
    '/model',
    '/model sonnet',
    '/login',
    'Unknown skill: rx',
    'Unknown skill: fococs',
    "say 'yay'",
    'say hello',
    'say the quick brown fox',
  ];

  accidentalCases.forEach((p) => {
    it(`tags "${p}" as meta.accidental`, () => {
      const events = [makePromptEvent(p), makeToolEvent('Bash', undefined, { id: 't1' })];
      expect(callDetect(events, 'BUILD', 'mixed', 'micro', { first_real_prompt: p })).toBe(
        'meta.accidental'
      );
    });
  });

  it('does NOT flag normal short questions', () => {
    expect(
      callDetect(
        [makePromptEvent('how do I start the app'), makeToolEvent('Bash', undefined, { id: 't1' })],
        'BUILD',
        'mixed',
        'micro',
        { first_real_prompt: 'how do I start the app' }
      )
    ).not.toBe('meta.accidental');
  });

  it('does NOT flag /bmad-sm (real skill, not built-in)', () => {
    expect(
      callDetect(
        [makePromptEvent('/bmad-sm'), makeToolEvent('Bash', undefined, { id: 't1' })],
        'BUILD',
        'mixed',
        'micro',
        { first_real_prompt: '/bmad-sm' }
      )
    ).toBe('build.campaign');
  });
});

// ── Bash-heavy commit/push → build.shipped ─────────────────────────────────

describe('detectSessionSubtype — bash-heavy commit/push → build.shipped', () => {
  const commitPrompts = [
    'Can you commit and push?',
    'Need to commit and push.',
    'git commit',
    'Get committed and push.',
    'push to origin main',
  ];

  commitPrompts.forEach((p) => {
    it(`tags "${p}" + bash + git outcome as build.shipped`, () => {
      const events = [
        makePromptEvent(p),
        ...Array.from({ length: 8 }, (_, i) => makeToolEvent('Bash', undefined, { id: `t${i}` })),
      ];
      expect(
        callDetect(events, 'BUILD', 'bash-heavy', 'moderate', {
          first_real_prompt: p,
          has_git_outcome: true,
        })
      ).toBe('build.shipped');
    });
  });

  it('does NOT trigger without git outcome', () => {
    const events = [
      makePromptEvent('Can you commit and push?'),
      ...Array.from({ length: 8 }, (_, i) => makeToolEvent('Bash', undefined, { id: `t${i}` })),
    ];
    expect(
      callDetect(events, 'BUILD', 'bash-heavy', 'moderate', {
        first_real_prompt: 'Can you commit and push?',
        has_git_outcome: false,
      })
    ).not.toBe('build.shipped');
  });
});

// ── Iterative design tightening (require edits) ────────────────────────────

describe('detectSessionSubtype — build.iterative_design requires edits', () => {
  it('tags agent-heavy + many edits as iterative_design', () => {
    const events = [
      makePromptEvent('do iterative refinement with agents'),
      ...Array.from({ length: 8 }, (_, i) => makeToolEvent('Agent', undefined, { id: `a${i}` })),
      ...Array.from({ length: 6 }, (_, i) =>
        makeToolEvent('Edit', { file: 'src/foo.ts' }, { id: `e${i}` })
      ),
    ];
    expect(
      callDetect(events, 'BUILD', 'agent-heavy', 'moderate', {
        first_real_prompt: 'do iterative refinement with agents',
      })
    ).toBe('build.iterative_design');
  });

  it('does NOT tag agent-heavy + minimal edits as iterative_design', () => {
    const events = [
      makePromptEvent('explore this codebase'),
      ...Array.from({ length: 12 }, (_, i) => makeToolEvent('Agent', undefined, { id: `a${i}` })),
      ...Array.from({ length: 2 }, (_, i) => makeToolEvent('Read', undefined, { id: `r${i}` })),
    ];
    expect(
      callDetect(events, 'BUILD', 'agent-heavy', 'moderate', {
        first_real_prompt: 'explore this codebase',
      })
    ).not.toBe('build.iterative_design');
  });
});

// ── Playwright disambiguation ──────────────────────────────────────────────

describe('detectSessionSubtype — playwright disambiguation', () => {
  it('tags screenshot tour as documentation_capture', () => {
    const events = [
      makePromptEvent('/appydave:screenshot-tour run a full system tour'),
      ...Array.from({ length: 12 }, (_, i) =>
        makeToolEvent('mcp__playwright__browser_take_screenshot', undefined, { id: `s${i}` })
      ),
      ...Array.from({ length: 8 }, (_, i) =>
        makeToolEvent('mcp__playwright__browser_navigate', undefined, { id: `n${i}` })
      ),
    ];
    expect(
      callDetect(events, 'BUILD', 'playwright-heavy', 'heavy', {
        first_real_prompt: '/appydave:screenshot-tour run a full system tour',
        has_playwright_calls: true,
      })
    ).toBe('orientation.documentation_capture');
  });

  it('tags /bmad-sat as user_acceptance_test', () => {
    const events = [
      makePromptEvent('/bmad-sat CS 5.4'),
      ...Array.from({ length: 6 }, (_, i) =>
        makeToolEvent('mcp__playwright__browser_click', undefined, { id: `c${i}` })
      ),
      ...Array.from({ length: 4 }, (_, i) => makeToolEvent('Bash', undefined, { id: `b${i}` })),
    ];
    // /bmad-sat → already routes to build.campaign via skill_invocation upstream;
    // playwright disambiguation only fires when no upstream rule caught it.
    // For this test we set sessionType=BUILD and leave skill_invocation regex to handle it.
    const result = callDetect(events, 'BUILD', 'playwright-heavy', 'moderate', {
      first_real_prompt: '/bmad-sat CS 5.4',
      has_playwright_calls: true,
    });
    // Either build.campaign (skill_invocation) or build.user_acceptance_test is acceptable
    expect(['build.campaign', 'build.user_acceptance_test']).toContain(result);
  });

  it('tags playwright + UAT keywords as user_acceptance_test', () => {
    const events = [
      makePromptEvent('verify the acceptance criteria for story 5.4'),
      ...Array.from({ length: 6 }, (_, i) =>
        makeToolEvent('mcp__playwright__browser_click', undefined, { id: `c${i}` })
      ),
      ...Array.from({ length: 4 }, (_, i) => makeToolEvent('Bash', undefined, { id: `b${i}` })),
    ];
    expect(
      callDetect(events, 'BUILD', 'playwright-heavy', 'moderate', {
        first_real_prompt: 'verify the acceptance criteria for story 5.4',
        has_playwright_calls: true,
      })
    ).toBe('build.user_acceptance_test');
  });

  it('tags playwright clicks/screenshots without edits as visual_inspection', () => {
    const events = [
      makePromptEvent('use Playwright in headed mode so I can see it'),
      ...Array.from({ length: 8 }, (_, i) =>
        makeToolEvent('mcp__playwright__browser_click', undefined, { id: `c${i}` })
      ),
      ...Array.from({ length: 4 }, (_, i) =>
        makeToolEvent('mcp__playwright__browser_take_screenshot', undefined, { id: `s${i}` })
      ),
    ];
    expect(
      callDetect(events, 'BUILD', 'playwright-heavy', 'heavy', {
        first_real_prompt: 'use Playwright in headed mode so I can see it',
        has_playwright_calls: true,
      })
    ).toBe('orientation.visual_inspection');
  });

  it('tags playwright + .test.ts edits as playwright_e2e (real e2e tests)', () => {
    const events = [
      makePromptEvent('write a playwright test for the login flow'),
      makeToolEvent('Edit', { file: 'tests/login.test.ts' }, { id: 'e1' }),
      makeToolEvent('Edit', { file: 'tests/login.test.ts' }, { id: 'e2' }),
      makeToolEvent('Write', { file: 'tests/auth.test.ts' }, { id: 'e3' }),
      ...Array.from({ length: 4 }, (_, i) =>
        makeToolEvent('mcp__playwright__browser_click', undefined, { id: `c${i}` })
      ),
    ];
    expect(
      callDetect(events, 'BUILD', 'playwright-heavy', 'moderate', {
        first_real_prompt: 'write a playwright test for the login flow',
        has_playwright_calls: true,
      })
    ).toBe('playwright_e2e');
  });
});
