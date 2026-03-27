import { describe, it, expect } from 'vitest';
import type { AngelEyeEvent, SessionSubtype } from '@appystack/shared';
import {
  classifySession,
  detectIsJunk,
  detectToolPattern,
  detectSessionType,
  detectSessionScale,
  detectIsPaperclipAgent,
  detectPiiFlags,
  findFirstEditedDir,
  findFirstRealPrompt,
  detectHasBrainFileWrites,
  detectHasCrossSessionRefs,
  detectHasUnauthorizedEdits,
  detectHasVoiceDictationArtifacts,
  detectHasHandoverContext,
  detectHasCrossProjectReads,
  detectHasClosingCeremony,
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

// ── detectSessionScale (B038) ─────────────────────────────────────────────────

describe('detectSessionScale', () => {
  it('returns micro for <= 3 tool calls', () => {
    const events = [makeToolEvent('Bash'), makeToolEvent('Read')];
    expect(detectSessionScale(events)).toBe('micro');
  });

  it('returns light for 4-10 tool calls', () => {
    const events = Array.from({ length: 7 }, () => makeToolEvent('Bash'));
    expect(detectSessionScale(events)).toBe('light');
  });

  it('returns moderate for 11-50 tool calls', () => {
    const events = Array.from({ length: 25 }, () => makeToolEvent('Bash'));
    expect(detectSessionScale(events)).toBe('moderate');
  });

  it('returns heavy for 51-200 tool calls', () => {
    const events = Array.from({ length: 100 }, () => makeToolEvent('Bash'));
    expect(detectSessionScale(events)).toBe('heavy');
  });

  it('returns marathon for > 200 tool calls', () => {
    const events = Array.from({ length: 250 }, () => makeToolEvent('Bash'));
    expect(detectSessionScale(events)).toBe('marathon');
  });
});

// ── detectIsPaperclipAgent (B041) ─────────────────────────────────────────────

describe('detectIsPaperclipAgent', () => {
  it('returns true when first prompt matches "You are agent {uuid}"', () => {
    const events = [
      makePromptEvent('You are agent 27231022-d305-4069-a16a-472c98259e33. Execute the task.'),
    ];
    expect(detectIsPaperclipAgent(events)).toBe(true);
  });

  it('returns false for normal user prompts', () => {
    const events = [makePromptEvent('Fix the login bug')];
    expect(detectIsPaperclipAgent(events)).toBe(false);
  });

  it('returns false when no prompt events', () => {
    const events = [makeEvent({ event: 'session_start' })];
    expect(detectIsPaperclipAgent(events)).toBe(false);
  });
});

// ── detectSessionType ─────────────────────────────────────────────────────────

// Helper: generate enough tool events to reach moderate scale (avoids BUILD guard)
function moderateEvents(): AngelEyeEvent[] {
  return [
    makePromptEvent('Do some work'),
    ...Array.from({ length: 20 }, () => makeToolEvent('Bash')),
  ];
}

describe('detectSessionType — TEST', () => {
  it('returns TEST for playwright-heavy', () => {
    expect(detectSessionType('playwright-heavy', '/projects/myapp', moderateEvents())).toBe('TEST');
  });
});

describe('detectSessionType — OPS', () => {
  it('returns OPS for bash-heavy in agent-os dir', () => {
    expect(detectSessionType('bash-heavy', '/projects/agent-os', moderateEvents())).toBe('OPS');
  });

  it('returns OPS for bash-heavy in ansible dir', () => {
    expect(detectSessionType('bash-heavy', '/projects/ansible-playbooks', moderateEvents())).toBe(
      'OPS'
    );
  });
});

describe('detectSessionType — BUILD', () => {
  it('returns BUILD for bash-heavy in non-ops dir (moderate+ scale)', () => {
    expect(detectSessionType('bash-heavy', '/projects/flivideo', moderateEvents())).toBe('BUILD');
  });

  it('returns BUILD for edit-heavy (moderate+ scale)', () => {
    expect(detectSessionType('edit-heavy', '/projects/myapp', moderateEvents())).toBe('BUILD');
  });

  it('returns BUILD for task-heavy (moderate+ scale)', () => {
    expect(detectSessionType('task-heavy', '/projects/myapp', moderateEvents())).toBe('BUILD');
  });

  it('returns BUILD for agent-heavy (moderate+ scale)', () => {
    expect(detectSessionType('agent-heavy', '/projects/myapp', moderateEvents())).toBe('BUILD');
  });
});

describe('detectSessionType — RESEARCH', () => {
  it('returns RESEARCH for websearch-heavy', () => {
    expect(detectSessionType('websearch-heavy', '/projects/myapp', moderateEvents())).toBe(
      'RESEARCH'
    );
  });
});

describe('detectSessionType — KNOWLEDGE', () => {
  it('returns KNOWLEDGE for read-heavy in brain dir', () => {
    expect(detectSessionType('read-heavy', '/dev/brains/brand-dave', moderateEvents())).toBe(
      'KNOWLEDGE'
    );
  });
});

describe('detectSessionType — ORIENTATION', () => {
  it('returns ORIENTATION for read-heavy in non-brain dir', () => {
    expect(detectSessionType('read-heavy', '/projects/myapp', moderateEvents())).toBe(
      'ORIENTATION'
    );
  });
});

// ── B038: Scale-aware BUILD guard ─────────────────────────────────────────────

describe('detectSessionType — B038 scale-aware BUILD guard', () => {
  it('demotes micro sessions from BUILD to ORIENTATION', () => {
    const microEvents = [makePromptEvent('hi'), makeToolEvent('Bash'), makeToolEvent('Read')];
    expect(detectSessionType('edit-heavy', '/projects/myapp', microEvents)).toBe('ORIENTATION');
  });

  it('demotes light sessions from BUILD to ORIENTATION', () => {
    const lightEvents = [
      makePromptEvent('do something'),
      ...Array.from({ length: 7 }, () => makeToolEvent('Edit')),
    ];
    expect(detectSessionType('edit-heavy', '/projects/myapp', lightEvents)).toBe('ORIENTATION');
  });

  it('demotes light sessions in brains/ to KNOWLEDGE', () => {
    const lightEvents = [
      makePromptEvent('check the brain'),
      ...Array.from({ length: 5 }, () => makeToolEvent('Read')),
    ];
    expect(detectSessionType('mixed', '/dev/ad/brains/angeleye', lightEvents)).toBe('KNOWLEDGE');
  });

  it('allows BUILD for moderate+ sessions', () => {
    expect(detectSessionType('edit-heavy', '/projects/myapp', moderateEvents())).toBe('BUILD');
  });
});

// ── B039: Iron-clad classifier rules ──────────────────────────────────────────

describe('detectSessionType — B039 iron-clad rules', () => {
  it('classifies "*run NNN" as OPS (poem execution)', () => {
    const events = [
      makePromptEvent('*run 123'),
      ...Array.from({ length: 20 }, () => makeToolEvent('Bash')),
    ];
    expect(detectSessionType('bash-heavy', '/projects/myapp', events)).toBe('OPS');
  });

  it('classifies "run 42" as OPS (poem execution, no asterisk)', () => {
    const events = [
      makePromptEvent('run 42'),
      ...Array.from({ length: 20 }, () => makeToolEvent('Bash')),
    ];
    expect(detectSessionType('bash-heavy', '/projects/myapp', events)).toBe('OPS');
  });

  it('classifies zero tool calls as ORIENTATION (never BUILD)', () => {
    const events = [makePromptEvent('What is this project about?')];
    expect(detectSessionType('mixed', '/projects/myapp', events)).toBe('ORIENTATION');
  });

  it('classifies brains/ + light scale as KNOWLEDGE (never BUILD)', () => {
    const events = [
      makePromptEvent('update the brain'),
      ...Array.from({ length: 8 }, () => makeToolEvent('Edit')),
    ];
    expect(detectSessionType('edit-heavy', '/dev/ad/brains/angeleye', events)).toBe('KNOWLEDGE');
  });
});

// ── B041: Paperclip agent detection ───────────────────────────────────────────

describe('detectSessionType — B041 paperclip agent', () => {
  it('classifies paperclip agent sessions as OPS', () => {
    const events = [
      makePromptEvent(
        'You are agent 27231022-d305-4069-a16a-472c98259e33. Execute the deployment task.'
      ),
      ...Array.from({ length: 30 }, () => makeToolEvent('Bash')),
    ];
    expect(detectSessionType('bash-heavy', '/projects/myapp', events)).toBe('OPS');
  });

  it('does not trigger for normal prompts mentioning agents', () => {
    const events = [
      makePromptEvent('How do I configure agent settings?'),
      ...Array.from({ length: 20 }, () => makeToolEvent('Read')),
    ];
    expect(detectSessionType('read-heavy', '/projects/myapp', events)).toBe('ORIENTATION');
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
  it('computes all fields for a build session (moderate+ scale)', () => {
    const events = [
      makeEvent({ event: 'session_start', cwd: '/projects/angeleye' }),
      makePromptEvent('Implement the classifier service'),
      makeToolEvent('Edit', {
        file: '/projects/angeleye/server/src/services/classifier.service.ts',
      }),
      makeToolEvent('Edit', { file: '/projects/angeleye/server/src/services/registry.service.ts' }),
      makeToolEvent('Write', { file: '/projects/angeleye/server/src/services/new.service.ts' }),
      makeToolEvent('Bash'),
      // Enough tool calls to reach moderate scale (avoid BUILD guard)
      ...Array.from({ length: 10 }, () => makeToolEvent('Edit')),
    ];
    const result = classifySession(events, 'ses-build-1', '/projects/angeleye');
    expect(result.is_junk).toBe(false);
    expect(result.tool_pattern).toBe('edit-heavy');
    expect(result.session_type).toBe('BUILD');
    expect(result.first_edited_dir).toBe('/projects/angeleye/server/src/services');
    expect(result.first_real_prompt).toBe('Implement the classifier service');
  });
});

// ── detectPiiFlags (B040) ──────────────────────────────────────────────────────

describe('detectPiiFlags — email detection', () => {
  it('detects email addresses', () => {
    const events = [makePromptEvent('Send to user@example.com please')];
    expect(detectPiiFlags(events)).toContain('email');
  });
});

describe('detectPiiFlags — IPv4 detection', () => {
  it('detects IPv4 addresses', () => {
    const events = [makePromptEvent('Connect to 192.168.1.100')];
    expect(detectPiiFlags(events)).toContain('ipv4');
  });

  it('does not false-positive on version numbers like 1.2.3', () => {
    const events = [makePromptEvent('Use version 1.2.3')];
    expect(detectPiiFlags(events)).not.toContain('ipv4');
  });
});

describe('detectPiiFlags — API key/token detection', () => {
  it('detects npm tokens', () => {
    const events = [makePromptEvent('Set NPM_TOKEN=npm_abcdefghijklmnopqrstuvwxyz')];
    expect(detectPiiFlags(events)).toContain('npm_token');
  });

  it('detects OpenAI-style sk- keys', () => {
    const events = [makePromptEvent('key is sk-abcdefghijklmnopqrstuvwxyz1234')];
    expect(detectPiiFlags(events)).toContain('openai_key');
  });

  it('detects GitHub personal access tokens', () => {
    const events = [makePromptEvent('Use ghp_abcdefghijklmnopqrstuvwxyz12')];
    expect(detectPiiFlags(events)).toContain('github_token');
  });

  it('detects Slack bot tokens', () => {
    const events = [makePromptEvent(`SLACK_TOKEN=${'xo' + 'xb'}-1234567890-abcdefghijklmnopq`)];
    expect(detectPiiFlags(events)).toContain('slack_token');
  });

  it('detects AWS access key IDs', () => {
    const events = [makePromptEvent('AWS key: AKIAIOSFODNN7EXAMPLE')];
    expect(detectPiiFlags(events)).toContain('aws_key');
  });

  it('detects BSA-style keys', () => {
    const events = [makePromptEvent('Key: BSAabcdefghijklmnopqrstuvwx')];
    expect(detectPiiFlags(events)).toContain('bsa_key');
  });
});

describe('detectPiiFlags — birthdate detection', () => {
  it('detects DD/MM/YYYY near "born"', () => {
    const events = [makePromptEvent('He was born 15/03/1990 in Sydney')];
    expect(detectPiiFlags(events)).toContain('birthdate');
  });

  it('detects YYYY-MM-DD near "dob"', () => {
    const events = [makePromptEvent('dob is 1985-07-22')];
    expect(detectPiiFlags(events)).toContain('birthdate');
  });

  it('does not flag dates without birth-related words', () => {
    const events = [makePromptEvent('Released on 15/03/2024')];
    expect(detectPiiFlags(events)).not.toContain('birthdate');
  });
});

describe('detectPiiFlags — generic secret detection', () => {
  it('detects long hex strings (40+ chars)', () => {
    const hex = 'a'.repeat(40);
    const events = [makePromptEvent(`Token: ${hex}`)];
    expect(detectPiiFlags(events)).toContain('generic_secret');
  });
});

describe('detectPiiFlags — integration', () => {
  it('returns empty array when no PII found', () => {
    const events = [makePromptEvent('Fix the login page')];
    expect(detectPiiFlags(events)).toEqual([]);
  });

  it('returns sorted unique flags across multiple prompts', () => {
    const events = [makePromptEvent('Email admin@test.com'), makePromptEvent('Server at 10.0.0.1')];
    const flags = detectPiiFlags(events);
    expect(flags).toContain('email');
    expect(flags).toContain('ipv4');
    // Should be sorted
    expect(flags).toEqual([...flags].sort());
  });

  it('only scans user_prompt events', () => {
    const events = [makeEvent({ event: 'tool_use', tool: 'Bash', prompt: 'user@example.com' })];
    expect(detectPiiFlags(events)).toEqual([]);
  });
});

describe('classifySession — PII flags integration', () => {
  it('includes pii_flags when PII detected in non-junk session', () => {
    const events = [
      makeEvent({ event: 'session_start', cwd: '/projects/app' }),
      makePromptEvent('Send email to admin@example.com'),
      ...Array.from({ length: 15 }, () => makeToolEvent('Edit')),
    ];
    const result = classifySession(events, 'ses-pii-1', '/projects/app');
    expect(result.pii_flags).toContain('email');
  });

  it('omits pii_flags when no PII detected', () => {
    const events = [
      makeEvent({ event: 'session_start', cwd: '/projects/app' }),
      makePromptEvent('Implement the classifier service'),
      ...Array.from({ length: 15 }, () => makeToolEvent('Edit')),
    ];
    const result = classifySession(events, 'ses-clean', '/projects/app');
    expect(result.pii_flags).toBeUndefined();
  });
});

// ── SessionSubtype type existence (B043) ───────────────────────────────────────

describe('SessionSubtype — B043 type definitions', () => {
  it('SessionSubtype type accepts confirmed subtypes', () => {
    // Type-level test: these assignments should compile without error.
    // If the type is wrong, TypeScript will fail at build time.
    const subtypes: SessionSubtype[] = [
      'bug_fix_round',
      'feature_implementation',
      'refactoring',
      'test_writing',
      'ci_pipeline',
      'codebase_exploration',
      'file_retrieval',
      'artifact_lookup',
      'brain_maintenance',
      'advisory_refinement',
      'brain_capture',
      'technology_survey',
      'hardware_setup_troubleshooting',
      'release_exploration',
      'poem_execution',
      'directory_cleanup',
      'paperclip_agent',
      'daily_planning',
      'interactive_design',
      'sprint_planning',
      'mcp_integration',
      'environment_setup',
      'dependency_management',
      'playwright_e2e',
      'test_debugging',
      'session_about_sessions',
    ];
    expect(subtypes.length).toBe(26);
  });

  it('ClassificationResult accepts session_subtype field', () => {
    const result = classifySession(
      [
        makeEvent({ event: 'session_start', cwd: '/projects/app' }),
        makePromptEvent('Implement feature'),
        ...Array.from({ length: 15 }, () => makeToolEvent('Edit')),
      ],
      'ses-subtype-1',
      '/projects/app'
    );
    // session_subtype is not yet populated by detection logic, so it should be undefined
    expect(result.session_subtype).toBeUndefined();
  });
});

// ── P04: detectHasBrainFileWrites ───────────────────────────────────────────

describe('detectHasBrainFileWrites', () => {
  it('returns true when Edit targets a brains/ path', () => {
    const events = [makeToolEvent('Edit', { file: '/dev/ad/brains/angeleye/concepts.md' })];
    expect(detectHasBrainFileWrites(events)).toBe(true);
  });

  it('returns true when Write targets a brains/ path', () => {
    const events = [makeToolEvent('Write', { file: '/dev/ad/brains/brand-dave/ops.md' })];
    expect(detectHasBrainFileWrites(events)).toBe(true);
  });

  it('returns false when Edit targets a non-brains path', () => {
    const events = [makeToolEvent('Edit', { file: '/projects/myapp/src/index.ts' })];
    expect(detectHasBrainFileWrites(events)).toBe(false);
  });

  it('returns false for Read events even in brains/ path', () => {
    const events = [makeToolEvent('Read', { file: '/dev/ad/brains/angeleye/concepts.md' })];
    expect(detectHasBrainFileWrites(events)).toBe(false);
  });

  it('returns false when no tool events exist', () => {
    const events = [makePromptEvent('Update the brain')];
    expect(detectHasBrainFileWrites(events)).toBe(false);
  });
});

// ── P06: detectHasCrossSessionRefs ──────────────────────────────────────────

describe('detectHasCrossSessionRefs', () => {
  it('returns true when prompt contains a UUID', () => {
    const events = [makePromptEvent('Continue from session 27231022-d305-4069-a16a-472c98259e33')];
    expect(detectHasCrossSessionRefs(events)).toBe(true);
  });

  it('returns true when prompt says "previous session"', () => {
    const events = [makePromptEvent('In the previous session we fixed the auth bug')];
    expect(detectHasCrossSessionRefs(events)).toBe(true);
  });

  it('returns true when prompt says "last time"', () => {
    const events = [makePromptEvent('Last time we worked on the migration')];
    expect(detectHasCrossSessionRefs(events)).toBe(true);
  });

  it('returns true when prompt says "earlier conversation"', () => {
    const events = [makePromptEvent('As discussed in an earlier conversation')];
    expect(detectHasCrossSessionRefs(events)).toBe(true);
  });

  it('returns true when prompt says "last session"', () => {
    const events = [makePromptEvent('Pick up where we left off last session')];
    expect(detectHasCrossSessionRefs(events)).toBe(true);
  });

  it('returns true when prompt says "prior session"', () => {
    const events = [makePromptEvent('The prior session had errors')];
    expect(detectHasCrossSessionRefs(events)).toBe(true);
  });

  it('returns false for normal prompts without session refs', () => {
    const events = [makePromptEvent('Fix the login bug')];
    expect(detectHasCrossSessionRefs(events)).toBe(false);
  });

  it('only scans user_prompt events', () => {
    const events = [makeEvent({ event: 'tool_use', tool: 'Bash', prompt: 'previous session' })];
    expect(detectHasCrossSessionRefs(events)).toBe(false);
  });
});

// ── P08: detectHasUnauthorizedEdits ─────────────────────────────────────────

describe('detectHasUnauthorizedEdits', () => {
  it('returns true when Edit path is outside project_dir', () => {
    const events = [makeToolEvent('Edit', { file: '/dev/ad/brains/angeleye/data.md' })];
    expect(detectHasUnauthorizedEdits(events, '/projects/myapp')).toBe(true);
  });

  it('returns true when Write path is outside project_dir', () => {
    const events = [makeToolEvent('Write', { file: '/tmp/scratch.ts' })];
    expect(detectHasUnauthorizedEdits(events, '/projects/myapp')).toBe(true);
  });

  it('returns false when Edit path is inside project_dir', () => {
    const events = [makeToolEvent('Edit', { file: '/projects/myapp/src/index.ts' })];
    expect(detectHasUnauthorizedEdits(events, '/projects/myapp')).toBe(false);
  });

  it('returns false when no file in tool_summary', () => {
    const events = [makeToolEvent('Edit', { command: 'something' })];
    expect(detectHasUnauthorizedEdits(events, '/projects/myapp')).toBe(false);
  });

  it('handles project_dir with trailing slash', () => {
    const events = [makeToolEvent('Edit', { file: '/projects/myapp/src/index.ts' })];
    expect(detectHasUnauthorizedEdits(events, '/projects/myapp/')).toBe(false);
  });
});

// ── P11: detectHasVoiceDictationArtifacts ───────────────────────────────────

describe('detectHasVoiceDictationArtifacts', () => {
  it('returns true for run-on sentence with >100 words and no punctuation', () => {
    const words = Array.from({ length: 110 }, (_, i) => `word${i}`).join(' ');
    const events = [makePromptEvent(words)];
    expect(detectHasVoiceDictationArtifacts(events)).toBe(true);
  });

  it('returns true for long prompt with STT error "cloud" (when prompt is long)', () => {
    const longPrompt =
      'I want to use cloud code to fix the auth service and then deploy the new version to production server so we can test it with the real users who have been waiting for this fix for a while now';
    const events = [makePromptEvent(longPrompt)];
    expect(detectHasVoiceDictationArtifacts(events)).toBe(true);
  });

  it('returns false for short prompt mentioning "cloud"', () => {
    const events = [makePromptEvent('Deploy to cloud')];
    expect(detectHasVoiceDictationArtifacts(events)).toBe(false);
  });

  it('returns true for long technical prompt without markdown formatting', () => {
    const words = Array.from({ length: 55 }, (_, i) => `implement${i}`).join(' ');
    const events = [makePromptEvent(words)];
    expect(detectHasVoiceDictationArtifacts(events)).toBe(true);
  });

  it('returns false for long prompt with markdown formatting', () => {
    const words = Array.from({ length: 55 }, (_, i) => `word${i}`).join(' ');
    const events = [makePromptEvent(`## Task\n\n${words}`)];
    expect(detectHasVoiceDictationArtifacts(events)).toBe(false);
  });

  it('returns false for normal typed prompt', () => {
    const events = [makePromptEvent('Fix the login bug. Add tests.')];
    expect(detectHasVoiceDictationArtifacts(events)).toBe(false);
  });

  it('only scans user_prompt events', () => {
    const words = Array.from({ length: 110 }, (_, i) => `word${i}`).join(' ');
    const events = [makeEvent({ event: 'tool_use', tool: 'Bash', prompt: words })];
    expect(detectHasVoiceDictationArtifacts(events)).toBe(false);
  });
});

// ── P17: detectHasHandoverContext ───────────────────────────────────────────

describe('detectHasHandoverContext', () => {
  it('returns true when first prompt starts with "This session is being continued"', () => {
    const events = [
      makePromptEvent('This session is being continued from a previous conversation.'),
    ];
    expect(detectHasHandoverContext(events)).toBe(true);
  });

  it('returns true when first prompt contains <task-notification', () => {
    const events = [
      makePromptEvent('<task-notification>Build the new feature</task-notification>'),
    ];
    expect(detectHasHandoverContext(events)).toBe(true);
  });

  it('returns true when first prompt starts with "Session Context:"', () => {
    const events = [makePromptEvent('Session Context: we were working on the classifier')];
    expect(detectHasHandoverContext(events)).toBe(true);
  });

  it('returns true when first prompt is > 2000 chars (large paste)', () => {
    const events = [makePromptEvent('x'.repeat(2001))];
    expect(detectHasHandoverContext(events)).toBe(true);
  });

  it('returns false for normal first prompt', () => {
    const events = [makePromptEvent('Fix the login bug')];
    expect(detectHasHandoverContext(events)).toBe(false);
  });

  it('returns false when no user_prompt events', () => {
    const events = [makeEvent({ event: 'session_start' })];
    expect(detectHasHandoverContext(events)).toBe(false);
  });
});

// ── P18: detectHasCrossProjectReads ─────────────────────────────────────────

describe('detectHasCrossProjectReads', () => {
  it('returns true when Read path is outside project_dir', () => {
    const events = [makeToolEvent('Read', { file: '/dev/ad/brains/angeleye/concepts.md' })];
    expect(detectHasCrossProjectReads(events, '/projects/myapp')).toBe(true);
  });

  it('returns true when Grep path is outside project_dir', () => {
    const events = [makeToolEvent('Grep', { file: '/other/project/src/index.ts' })];
    expect(detectHasCrossProjectReads(events, '/projects/myapp')).toBe(true);
  });

  it('returns true when Glob path is outside project_dir', () => {
    const events = [makeToolEvent('Glob', { file: '/other/project/src/types.ts' })];
    expect(detectHasCrossProjectReads(events, '/projects/myapp')).toBe(true);
  });

  it('returns false when Read path is inside project_dir', () => {
    const events = [makeToolEvent('Read', { file: '/projects/myapp/src/index.ts' })];
    expect(detectHasCrossProjectReads(events, '/projects/myapp')).toBe(false);
  });

  it('returns false for Edit events outside project_dir (not a read tool)', () => {
    const events = [makeToolEvent('Edit', { file: '/other/project/src/index.ts' })];
    expect(detectHasCrossProjectReads(events, '/projects/myapp')).toBe(false);
  });

  it('returns false when no file in tool_summary', () => {
    const events = [makeToolEvent('Read', { command: 'something' })];
    expect(detectHasCrossProjectReads(events, '/projects/myapp')).toBe(false);
  });
});

// ── P25: detectHasClosingCeremony ───────────────────────────────────────────

describe('detectHasClosingCeremony', () => {
  it('returns true when last events include git commit in Bash', () => {
    const events = [
      makePromptEvent('Commit the changes'),
      ...Array.from({ length: 8 }, () => makeToolEvent('Edit')),
      makeToolEvent('Bash', { command: 'git commit -m "feat: add feature"' }),
    ];
    expect(detectHasClosingCeremony(events)).toBe(true);
  });

  it('returns true when last events include git push in Bash', () => {
    const events = [
      makePromptEvent('Push to remote'),
      ...Array.from({ length: 8 }, () => makeToolEvent('Edit')),
      makeToolEvent('Bash', { command: 'git push origin main' }),
    ];
    expect(detectHasClosingCeremony(events)).toBe(true);
  });

  it('returns true when final stop event has closing summary language', () => {
    const events = [
      makePromptEvent('Fix the bug'),
      ...Array.from({ length: 5 }, () => makeToolEvent('Edit')),
      makeEvent({ event: 'stop', last_message: 'All changes have been committed and pushed.' }),
    ];
    expect(detectHasClosingCeremony(events)).toBe(true);
  });

  it('returns false when git commit is early in session (not in last 10)', () => {
    const events = [
      makeToolEvent('Bash', { command: 'git commit -m "initial"' }),
      ...Array.from({ length: 15 }, () => makeToolEvent('Edit')),
    ];
    expect(detectHasClosingCeremony(events)).toBe(false);
  });

  it('returns false when no closing patterns', () => {
    const events = [
      makePromptEvent('Fix the bug'),
      ...Array.from({ length: 5 }, () => makeToolEvent('Edit')),
      makeEvent({ event: 'stop', last_message: 'What would you like me to do next?' }),
    ];
    expect(detectHasClosingCeremony(events)).toBe(false);
  });
});

// ── Tier 2 predicates — classifySession integration ─────────────────────────

describe('classifySession — Tier 2 predicates integration', () => {
  it('includes all Tier 2 predicates in non-junk classification', () => {
    const events = [
      makeEvent({ event: 'session_start', cwd: '/projects/app' }),
      makePromptEvent('Implement the feature'),
      ...Array.from({ length: 15 }, () =>
        makeToolEvent('Edit', { file: '/projects/app/src/index.ts' })
      ),
    ];
    const result = classifySession(events, 'ses-tier2', '/projects/app');
    expect(result.has_brain_file_writes).toBe(false);
    expect(result.has_cross_session_refs).toBe(false);
    expect(result.has_unauthorized_edits).toBe(false);
    expect(result.has_voice_dictation_artifacts).toBe(false);
    expect(result.has_handover_context).toBe(false);
    expect(result.has_cross_project_reads).toBe(false);
    expect(result.has_closing_ceremony).toBe(false);
  });

  it('detects brain file writes via classifySession', () => {
    const events = [
      makeEvent({ event: 'session_start', cwd: '/projects/app' }),
      makePromptEvent('Update the brain docs'),
      makeToolEvent('Write', { file: '/dev/ad/brains/angeleye/data.md' }),
      ...Array.from({ length: 14 }, () =>
        makeToolEvent('Edit', { file: '/projects/app/src/x.ts' })
      ),
    ];
    const result = classifySession(events, 'ses-brain', '/projects/app');
    expect(result.has_brain_file_writes).toBe(true);
  });

  it('detects handover context via classifySession', () => {
    const events = [
      makeEvent({ event: 'session_start', cwd: '/projects/app' }),
      makePromptEvent('This session is being continued from previous work.'),
      makePromptEvent('Now fix the auth module'),
      ...Array.from({ length: 15 }, () =>
        makeToolEvent('Edit', { file: '/projects/app/src/x.ts' })
      ),
    ];
    const result = classifySession(events, 'ses-handover', '/projects/app');
    expect(result.has_handover_context).toBe(true);
  });
});
