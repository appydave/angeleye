import { describe, it, expect } from 'vitest';
import type { AngelEyeEvent } from '@appystack/shared';
import {
  classifySession,
  detectIsJunk,
  detectToolPattern,
  detectSessionType,
  findFirstEditedDir,
  findFirstRealPrompt,
} from './classifier.service.js';

// ── Helper ─────────────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<AngelEyeEvent> = {}): AngelEyeEvent {
  return {
    id: 'evt-001',
    session_id: 'ses-abc',
    ts: new Date().toISOString(),
    source: 'hook',
    event: 'session_start',
    ...overrides,
  };
}

function makeToolEvent(tool: string, toolSummary?: Record<string, unknown>): AngelEyeEvent {
  return makeEvent({
    event: 'tool_use',
    tool,
    tool_summary: toolSummary,
  });
}

function makePromptEvent(prompt: string, cwd?: string): AngelEyeEvent {
  return makeEvent({
    event: 'user_prompt',
    prompt,
    cwd,
  });
}

// ── detectIsJunk — Rule 1 ─────────────────────────────────────────────────────

describe('detectIsJunk — Rule 1: single event, prompt <= 2 chars', () => {
  it('returns true when single event and prompt is empty string', () => {
    const events = [makePromptEvent('', '/projects/app')];
    expect(detectIsJunk(events, 'ses-r1')).toBe(true);
  });

  it('returns true when single event and prompt is 1 character', () => {
    const events = [makePromptEvent('x', '/projects/app')];
    expect(detectIsJunk(events, 'ses-r1b')).toBe(true);
  });

  it('returns false when single event and prompt is exactly 3 characters but has 5+ words would not apply here — non-junk via Rule5 threshold miss', () => {
    // 3-char single-word prompt is caught by Rule 5 (prompt.length <= 5),
    // but a multi-event session with tool_use escapes it
    const events = [
      makeEvent({ event: 'session_start', cwd: '/projects/app' }),
      makePromptEvent('hey', '/projects/app'),
      makeToolEvent('Bash'),
    ];
    expect(detectIsJunk(events, 'ses-r1c')).toBe(false);
  });
});

// ── detectIsJunk — Rule 2 ─────────────────────────────────────────────────────

describe('detectIsJunk — Rule 2: single event, cwd includes /tmp', () => {
  it('returns true when single event and cwd includes /tmp', () => {
    const events = [
      makeEvent({ event: 'session_start', cwd: '/tmp/claude-work', prompt: 'do something' }),
    ];
    expect(detectIsJunk(events, 'ses-r2')).toBe(true);
  });

  it('returns false when multiple events even if cwd includes /tmp', () => {
    const events = [
      makeEvent({ event: 'session_start', cwd: '/tmp/work' }),
      makePromptEvent('do something', '/tmp/work'),
    ];
    expect(detectIsJunk(events, 'ses-r2b')).toBe(false);
  });
});

// ── detectIsJunk — Rule 3 ─────────────────────────────────────────────────────

describe('detectIsJunk — Rule 3: sessionId starts with agent-', () => {
  it('returns true when sessionId starts with agent-', () => {
    const events = [
      makeEvent({ event: 'session_start', cwd: '/projects/app' }),
      makePromptEvent('Build something useful please'),
    ];
    expect(detectIsJunk(events, 'agent-sub-123')).toBe(true);
  });

  it('returns false when sessionId does not start with agent-', () => {
    const events = [
      makeEvent({ event: 'session_start', cwd: '/projects/app' }),
      makePromptEvent('Build something useful please'),
    ];
    expect(detectIsJunk(events, 'ses-main-123')).toBe(false);
  });
});

// ── detectIsJunk — Rule 4 ─────────────────────────────────────────────────────

describe('detectIsJunk — Rule 4: single event, prompt starts with Hello how can I', () => {
  it('returns true for single event with default hello prompt (4 words — under PROTECT threshold)', () => {
    // 'Hello how can I' = 4 words, so PROTECT (>=5 words) does not fire
    const events = [makePromptEvent('Hello how can I')];
    expect(detectIsJunk(events, 'ses-r4')).toBe(true);
  });

  it('returns false when there are multiple events even with that prompt', () => {
    const events = [
      makeEvent({ event: 'session_start' }),
      makePromptEvent('Hello how can I help you today?'),
    ];
    expect(detectIsJunk(events, 'ses-r4b')).toBe(false);
  });
});

// ── detectIsJunk — Rule 5 ─────────────────────────────────────────────────────

describe('detectIsJunk — Rule 5: <= 3 events, no tool_use, prompt <= 5 chars', () => {
  it('returns true when 2 events, no tool_use, short prompt', () => {
    const events = [
      makeEvent({ event: 'session_start', cwd: '/projects/app' }),
      makePromptEvent('hi', '/projects/app'),
    ];
    expect(detectIsJunk(events, 'ses-r5')).toBe(true);
  });

  it('returns false when <= 3 events but has tool_use event', () => {
    const events = [
      makeEvent({ event: 'session_start', cwd: '/projects/app' }),
      makePromptEvent('hi', '/projects/app'),
      makeToolEvent('Bash'),
    ];
    expect(detectIsJunk(events, 'ses-r5b')).toBe(false);
  });
});

// ── detectIsJunk — PROTECT rule ──────────────────────────────────────────────

describe('detectIsJunk — PROTECT: single event, prompt >= 5 words is NOT junk', () => {
  it('returns false when single event has 5-word prompt', () => {
    const events = [makePromptEvent('Fix the login page bug', '/projects/app')];
    expect(detectIsJunk(events, 'ses-protect')).toBe(false);
  });

  it('returns false when single event has more than 5 words', () => {
    const events = [makePromptEvent('Can you help me refactor this authentication module?')];
    expect(detectIsJunk(events, 'ses-protect2')).toBe(false);
  });
});

// ── detectToolPattern ─────────────────────────────────────────────────────────

describe('detectToolPattern — playwright-heavy', () => {
  it('returns playwright-heavy when playwright tools > 40%', () => {
    const events = [
      makeToolEvent('mcp__playwright__browser_click'),
      makeToolEvent('mcp__playwright__browser_navigate'),
      makeToolEvent('mcp__playwright__browser_snapshot'),
      makeToolEvent('Bash'),
    ];
    // 3/4 = 75% playwright
    expect(detectToolPattern(events)).toBe('playwright-heavy');
  });
});

describe('detectToolPattern — bash-heavy', () => {
  it('returns bash-heavy when Bash tools > 40%', () => {
    const events = [
      makeToolEvent('Bash'),
      makeToolEvent('Bash'),
      makeToolEvent('Bash'),
      makeToolEvent('Read'),
      makeToolEvent('Edit'),
    ];
    // 3/5 = 60% bash
    expect(detectToolPattern(events)).toBe('bash-heavy');
  });
});

describe('detectToolPattern — task-heavy', () => {
  it('returns task-heavy when Task tools > 40%', () => {
    const events = [
      makeToolEvent('Task'),
      makeToolEvent('TaskCreate'),
      makeToolEvent('TaskUpdate'),
      makeToolEvent('Bash'),
    ];
    // 3/4 = 75% task
    expect(detectToolPattern(events)).toBe('task-heavy');
  });
});

describe('detectToolPattern — agent-heavy', () => {
  it('returns agent-heavy when Agent tools > 20%', () => {
    const events = [
      makeToolEvent('Agent'),
      makeToolEvent('Agent'),
      makeToolEvent('Bash'),
      makeToolEvent('Read'),
      makeToolEvent('Edit'),
      makeToolEvent('Glob'),
      makeToolEvent('Read'),
    ];
    // 2/7 ~= 28.5% agent
    expect(detectToolPattern(events)).toBe('agent-heavy');
  });
});

describe('detectToolPattern — websearch-heavy', () => {
  it('returns websearch-heavy when WebFetch/brave-search > 30%', () => {
    const events = [
      makeToolEvent('WebFetch'),
      makeToolEvent('mcp__brave-search__brave_web_search'),
      makeToolEvent('Read'),
      makeToolEvent('Read'),
      makeToolEvent('Bash'),
    ];
    // 2/5 = 40% websearch
    expect(detectToolPattern(events)).toBe('websearch-heavy');
  });
});

describe('detectToolPattern — edit-heavy', () => {
  it('returns edit-heavy when Edit/Write/MultiEdit > 40%', () => {
    const events = [
      makeToolEvent('Edit'),
      makeToolEvent('Write'),
      makeToolEvent('MultiEdit'),
      makeToolEvent('Bash'),
      makeToolEvent('Read'),
    ];
    // 3/5 = 60% edit
    expect(detectToolPattern(events)).toBe('edit-heavy');
  });
});

describe('detectToolPattern — read-heavy', () => {
  it('returns read-heavy when Glob/Read/Grep > 60% and edit < 10%', () => {
    const events = [
      makeToolEvent('Read'),
      makeToolEvent('Grep'),
      makeToolEvent('Glob'),
      makeToolEvent('Read'),
      makeToolEvent('Bash'),
    ];
    // 4/5 = 80% read, 0% edit
    expect(detectToolPattern(events)).toBe('read-heavy');
  });
});

describe('detectToolPattern — mixed', () => {
  it('returns mixed when no single pattern dominates', () => {
    const events = [
      makeToolEvent('Read'),
      makeToolEvent('Bash'),
      makeToolEvent('Edit'),
      makeToolEvent('WebFetch'),
      makeToolEvent('Grep'),
    ];
    // each ~20% — no threshold met
    expect(detectToolPattern(events)).toBe('mixed');
  });

  it('returns mixed when fewer than 3 tool_use events', () => {
    const events = [makeToolEvent('Bash'), makeToolEvent('Edit')];
    expect(detectToolPattern(events)).toBe('mixed');
  });
});

// ── detectSessionType ─────────────────────────────────────────────────────────

describe('detectSessionType — TEST', () => {
  it('returns TEST for playwright-heavy', () => {
    expect(detectSessionType('playwright-heavy', '/projects/myapp')).toBe('TEST');
  });
});

describe('detectSessionType — OPS', () => {
  it('returns OPS for bash-heavy in agent-os dir', () => {
    expect(detectSessionType('bash-heavy', '/projects/agent-os')).toBe('OPS');
  });

  it('returns OPS for bash-heavy in ansible dir', () => {
    expect(detectSessionType('bash-heavy', '/projects/ansible-playbooks')).toBe('OPS');
  });
});

describe('detectSessionType — BUILD', () => {
  it('returns BUILD for bash-heavy in non-ops dir', () => {
    expect(detectSessionType('bash-heavy', '/projects/flivideo')).toBe('BUILD');
  });

  it('returns BUILD for edit-heavy', () => {
    expect(detectSessionType('edit-heavy', '/projects/myapp')).toBe('BUILD');
  });

  it('returns BUILD for task-heavy', () => {
    expect(detectSessionType('task-heavy', '/projects/myapp')).toBe('BUILD');
  });

  it('returns BUILD for agent-heavy', () => {
    expect(detectSessionType('agent-heavy', '/projects/myapp')).toBe('BUILD');
  });
});

describe('detectSessionType — RESEARCH', () => {
  it('returns RESEARCH for websearch-heavy', () => {
    expect(detectSessionType('websearch-heavy', '/projects/myapp')).toBe('RESEARCH');
  });
});

describe('detectSessionType — KNOWLEDGE', () => {
  it('returns KNOWLEDGE for read-heavy in brain dir', () => {
    expect(detectSessionType('read-heavy', '/dev/brains/brand-dave')).toBe('KNOWLEDGE');
  });
});

describe('detectSessionType — ORIENTATION', () => {
  it('returns ORIENTATION for read-heavy in non-brain dir', () => {
    expect(detectSessionType('read-heavy', '/projects/myapp')).toBe('ORIENTATION');
  });
});

// ── findFirstEditedDir ────────────────────────────────────────────────────────

describe('findFirstEditedDir', () => {
  it('returns directory of first Edit event with a file', () => {
    const events = [
      makeEvent({ event: 'session_start' }),
      makePromptEvent('Fix this file'),
      makeToolEvent('Edit', { file: '/projects/myapp/src/components/Header.tsx' }),
    ];
    expect(findFirstEditedDir(events)).toBe('/projects/myapp/src/components');
  });

  it('returns directory of first Write event with a file', () => {
    const events = [makeToolEvent('Write', { file: '/projects/app/server/routes/api.ts' })];
    expect(findFirstEditedDir(events)).toBe('/projects/app/server/routes');
  });

  it('returns directory from Read event when it comes before Edit', () => {
    const events = [
      makeToolEvent('Read', { file: '/projects/app/src/index.ts' }),
      makeToolEvent('Edit', { file: '/projects/app/src/other.ts' }),
    ];
    // Read comes first so its dir is returned
    expect(findFirstEditedDir(events)).toBe('/projects/app/src');
  });

  it('returns undefined when no file-touching tool events exist', () => {
    const events = [
      makeEvent({ event: 'session_start' }),
      makePromptEvent('What is this?'),
      makeToolEvent('Bash'),
    ];
    expect(findFirstEditedDir(events)).toBeUndefined();
  });

  it('returns undefined when tool_use events exist but none have file in tool_summary', () => {
    const events = [makeToolEvent('Edit', { command: 'some-thing' })];
    expect(findFirstEditedDir(events)).toBeUndefined();
  });
});

// ── findFirstRealPrompt ───────────────────────────────────────────────────────

describe('findFirstRealPrompt', () => {
  it('returns the first real user prompt', () => {
    const events = [
      makeEvent({ event: 'session_start' }),
      makePromptEvent('Fix the login bug in auth service'),
    ];
    expect(findFirstRealPrompt(events)).toBe('Fix the login bug in auth service');
  });

  it('skips context handover injection (This session is being continued)', () => {
    const events = [
      makePromptEvent('This session is being continued from a previous conversation.'),
      makePromptEvent('Now please fix the auth module'),
    ];
    expect(findFirstRealPrompt(events)).toBe('Now please fix the auth module');
  });

  it('skips task-notification injection', () => {
    const events = [
      makePromptEvent('<task-notification>Task assigned: build something</task-notification>'),
      makePromptEvent('Add unit tests for the service'),
    ];
    expect(findFirstRealPrompt(events)).toBe('Add unit tests for the service');
  });

  it('skips Session Context injection', () => {
    const events = [
      makePromptEvent('Session Context: previous work included X and Y'),
      makePromptEvent('Continue with the database schema'),
    ];
    expect(findFirstRealPrompt(events)).toBe('Continue with the database schema');
  });

  it('skips pastes longer than 2000 characters', () => {
    const longPaste = 'x'.repeat(2001);
    const events = [makePromptEvent(longPaste), makePromptEvent('Now summarize that paste above')];
    expect(findFirstRealPrompt(events)).toBe('Now summarize that paste above');
  });

  it('skips prompts with 1 or 2 characters', () => {
    const events = [makePromptEvent('?'), makePromptEvent('Refactor the sessions service')];
    expect(findFirstRealPrompt(events)).toBe('Refactor the sessions service');
  });

  it('returns undefined when no real prompt exists', () => {
    const events = [
      makePromptEvent('This session is being continued from a previous conversation.'),
      makePromptEvent('x'),
    ];
    expect(findFirstRealPrompt(events)).toBeUndefined();
  });

  it('truncates long prompts to 200 characters', () => {
    const longPrompt = 'A'.repeat(300);
    const events = [makePromptEvent(longPrompt)];
    const result = findFirstRealPrompt(events);
    expect(result).toHaveLength(200);
  });
});

// ── classifySession integration ────────────────────────────────────────────────

describe('classifySession — junk sessions return early', () => {
  it('returns is_junk true with no other fields for agent- session', () => {
    const events = [makePromptEvent('hi')];
    const result = classifySession(events, 'agent-sub-456', '/projects/app');
    expect(result.is_junk).toBe(true);
    expect(result.session_type).toBeUndefined();
    expect(result.tool_pattern).toBeUndefined();
    expect(result.first_edited_dir).toBeUndefined();
    expect(result.first_real_prompt).toBeUndefined();
  });
});

describe('classifySession — full classification for non-junk session', () => {
  it('computes all fields for a build session', () => {
    const events = [
      makeEvent({ event: 'session_start', cwd: '/projects/angeleye' }),
      makePromptEvent('Implement the classifier service'),
      makeToolEvent('Edit', {
        file: '/projects/angeleye/server/src/services/classifier.service.ts',
      }),
      makeToolEvent('Edit', { file: '/projects/angeleye/server/src/services/registry.service.ts' }),
      makeToolEvent('Write', { file: '/projects/angeleye/server/src/services/new.service.ts' }),
      makeToolEvent('Bash'),
    ];
    const result = classifySession(events, 'ses-build-1', '/projects/angeleye');
    expect(result.is_junk).toBe(false);
    expect(result.tool_pattern).toBe('edit-heavy');
    expect(result.session_type).toBe('BUILD');
    expect(result.first_edited_dir).toBe('/projects/angeleye/server/src/services');
    expect(result.first_real_prompt).toBe('Implement the classifier service');
  });
});
