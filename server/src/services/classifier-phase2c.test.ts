import { describe, it, expect } from 'vitest';
import type { AngelEyeEvent } from '@appystack/shared';
import {
  detectDelegationStyle,
  detectInitiationSource,
  detectSessionContinuity,
  detectOutputType,
  detectAutonomyRatio,
  detectSessionLiveness,
  detectOpeningStyle,
  detectClosingStyle,
} from './classifier.service.js';

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

// ── detectDelegationStyle ─────────────────────────────────────────────────────

describe('detectDelegationStyle', () => {
  it('returns orchestrated when task orchestration tools are present', () => {
    const events = [
      makePromptEvent('build it'),
      makeToolEvent('TaskCreate', undefined, { id: '2' }),
      makeToolEvent('TaskCreate', undefined, { id: '3' }),
      makeToolEvent('TaskOutput', undefined, { id: '4' }),
    ];
    expect(detectDelegationStyle(events)).toBe('orchestrated');
  });

  it('returns autonomous when machine-initiated and moderate+ scale', () => {
    // No user_prompt as first event, and enough tool_use events for moderate scale
    const events: AngelEyeEvent[] = [
      makeEvent({ event: 'session_start', id: '0' }),
      ...Array.from({ length: 15 }, (_, i) => makeToolEvent('Bash', undefined, { id: `t${i}` })),
    ];
    expect(detectDelegationStyle(events)).toBe('autonomous');
  });

  it('returns directive when first prompt is short imperative', () => {
    const events = [
      makePromptEvent('fix the auth bug'),
      makeToolEvent('Edit', undefined, { id: '2' }),
    ];
    expect(detectDelegationStyle(events)).toBe('directive');
  });

  it('returns conversational as default', () => {
    const events = [
      makePromptEvent(
        'What does this function do? I am curious about how it works and what the parameters mean'
      ),
    ];
    expect(detectDelegationStyle(events)).toBe('conversational');
  });
});

// ── detectInitiationSource ────────────────────────────────────────────────────

describe('detectInitiationSource', () => {
  it('returns agent_dispatched when machine-initiated', () => {
    const events = [makeEvent({ event: 'session_start' }), makeToolEvent('Bash')];
    expect(detectInitiationSource(events)).toBe('agent_dispatched');
  });

  it('returns skill_invoked when first prompt starts with /', () => {
    const events = [makePromptEvent('/commit fix auth')];
    expect(detectInitiationSource(events)).toBe('skill_invoked');
  });

  it('returns user_typed as default', () => {
    const events = [makePromptEvent('hello there')];
    expect(detectInitiationSource(events)).toBe('user_typed');
  });
});

// ── detectSessionContinuity ───────────────────────────────────────────────────

describe('detectSessionContinuity', () => {
  it('returns compaction when pre_compact event exists', () => {
    const events = [
      makePromptEvent('do something'),
      makeEvent({ event: 'pre_compact', id: '2' }),
      makeEvent({ event: 'post_compact', id: '3' }),
    ];
    expect(detectSessionContinuity(events)).toBe('compaction');
  });

  it('returns handover_paste when handover context is detected', () => {
    const events = [makePromptEvent('This session is being continued from a previous context...')];
    expect(detectSessionContinuity(events)).toBe('handover_paste');
  });

  it('returns skill_launcher when trigger_command present and prompt is just the command', () => {
    const events = [makePromptEvent('/commit')];
    expect(detectSessionContinuity(events)).toBe('skill_launcher');
  });

  it('returns recall when cross-session references detected', () => {
    const events = [makePromptEvent('Continuing from last session where we fixed the bug')];
    expect(detectSessionContinuity(events)).toBe('recall');
  });

  it('returns fresh as default', () => {
    const events = [makePromptEvent('hello')];
    expect(detectSessionContinuity(events)).toBe('fresh');
  });
});

// ── detectOutputType ──────────────────────────────────────────────────────────

describe('detectOutputType', () => {
  it('returns code_changes when Edit targets source files', () => {
    const events = [
      makePromptEvent('fix it'),
      makeToolEvent('Edit', { file: '/app/src/index.ts' }, { id: '2' }),
    ];
    expect(detectOutputType(events)).toBe('code_changes');
  });

  it('returns knowledge_synthesis when Write targets .md files', () => {
    const events = [
      makePromptEvent('update docs'),
      makeToolEvent('Write', { file: '/docs/README.md' }, { id: '2' }),
    ];
    expect(detectOutputType(events)).toBe('knowledge_synthesis');
  });

  it('returns mixed when both code and knowledge files touched', () => {
    const events = [
      makePromptEvent('update all the things'),
      makeToolEvent('Edit', { file: '/app/src/index.ts' }, { id: '2' }),
      makeToolEvent('Write', { file: '/brains/angeleye/notes.md' }, { id: '3' }),
    ];
    expect(detectOutputType(events)).toBe('mixed');
  });

  it('returns conversation_only when no write tools used', () => {
    const events = [
      makePromptEvent('what does this do?'),
      makeToolEvent('Read', { file: '/app/src/index.ts' }, { id: '2' }),
    ];
    expect(detectOutputType(events)).toBe('conversation_only');
  });

  it('returns code_changes for Write targeting source files', () => {
    const events = [
      makePromptEvent('create the file'),
      makeToolEvent('Write', { file: '/app/src/new-file.ts' }, { id: '2' }),
    ];
    expect(detectOutputType(events)).toBe('code_changes');
  });
});

// ── detectAutonomyRatio ───────────────────────────────────────────────────────

describe('detectAutonomyRatio', () => {
  it('returns high ratio when mostly tool_use events', () => {
    const events = [
      makePromptEvent('do it'),
      makeToolEvent('Bash', undefined, { id: '2' }),
      makeToolEvent('Edit', undefined, { id: '3' }),
      makeToolEvent('Read', undefined, { id: '4' }),
      makeToolEvent('Write', undefined, { id: '5' }),
    ];
    // 4 tools, 1 prompt → 4/5 = 0.8
    expect(detectAutonomyRatio(events)).toBe(0.8);
  });

  it('returns 0 when no tool or prompt events', () => {
    const events = [makeEvent({ event: 'session_start' })];
    expect(detectAutonomyRatio(events)).toBe(0);
  });

  it('returns 0.5 for equal tool and prompt events', () => {
    const events = [
      makePromptEvent('do A'),
      makeToolEvent('Bash', undefined, { id: '2' }),
      makePromptEvent('do B', { id: '3' }),
      makeToolEvent('Edit', undefined, { id: '4' }),
    ];
    expect(detectAutonomyRatio(events)).toBe(0.5);
  });
});

// ── detectSessionLiveness ─────────────────────────────────────────────────────

describe('detectSessionLiveness', () => {
  it('returns high when event rate > 5 per minute', () => {
    const base = new Date('2026-01-01T00:00:00Z');
    // 20 events in 2 minutes → 10 events/min
    const events = Array.from({ length: 20 }, (_, i) =>
      makeEvent({
        id: `e${i}`,
        ts: new Date(base.getTime() + i * 6_000).toISOString(), // every 6 seconds
      })
    );
    expect(detectSessionLiveness(events)).toBe('high');
  });

  it('returns low when event rate < 1 per minute', () => {
    const base = new Date('2026-01-01T00:00:00Z');
    // 3 events over 10 minutes → 0.3 events/min
    const events = [
      makeEvent({ id: 'e1', ts: base.toISOString() }),
      makeEvent({ id: 'e2', ts: new Date(base.getTime() + 5 * 60_000).toISOString() }),
      makeEvent({ id: 'e3', ts: new Date(base.getTime() + 10 * 60_000).toISOString() }),
    ];
    expect(detectSessionLiveness(events)).toBe('low');
  });

  it('returns medium for moderate event rate', () => {
    const base = new Date('2026-01-01T00:00:00Z');
    // 10 events over 5 minutes → 2 events/min
    const events = Array.from({ length: 10 }, (_, i) =>
      makeEvent({
        id: `e${i}`,
        ts: new Date(base.getTime() + i * 30_000).toISOString(), // every 30 seconds
      })
    );
    expect(detectSessionLiveness(events)).toBe('medium');
  });

  it('returns low for empty events', () => {
    expect(detectSessionLiveness([])).toBe('low');
  });
});

// ── detectOpeningStyle ────────────────────────────────────────────────────────

describe('detectOpeningStyle', () => {
  it('returns agent_initiated when first event is not user_prompt', () => {
    const events = [makeEvent({ event: 'session_start' }), makeToolEvent('Bash')];
    expect(detectOpeningStyle(events)).toBe('agent_initiated');
  });

  it('returns skill_invocation when first prompt starts with /', () => {
    const events = [makePromptEvent('/commit fix auth')];
    expect(detectOpeningStyle(events)).toBe('skill_invocation');
  });

  it('returns greeting for short hello', () => {
    const events = [makePromptEvent('hello')];
    expect(detectOpeningStyle(events)).toBe('greeting');
  });

  it('returns typed_instruction for short imperative', () => {
    const events = [makePromptEvent('fix the auth bug')];
    expect(detectOpeningStyle(events)).toBe('typed_instruction');
  });

  it('returns typed_question for prompt with question mark', () => {
    const events = [makePromptEvent('what does this function do?')];
    expect(detectOpeningStyle(events)).toBe('typed_question');
  });

  it('returns unknown for empty events', () => {
    expect(detectOpeningStyle([])).toBe('unknown');
  });
});

// ── detectClosingStyle ────────────────────────────────────────────────────────

describe('detectClosingStyle', () => {
  it('returns commit_push when tail has git commit and push', () => {
    const events = [
      makePromptEvent('ship it'),
      makeToolEvent('Bash', { command: 'git commit -m "done"' }, { id: '2' }),
      makeToolEvent('Bash', { command: 'git push origin main' }, { id: '3' }),
    ];
    expect(detectClosingStyle(events)).toBe('commit_push');
  });

  it('returns commit_only when tail has commit but no push', () => {
    const events = [
      makePromptEvent('commit it'),
      makeToolEvent('Bash', { command: 'git commit -m "done"' }, { id: '2' }),
    ];
    expect(detectClosingStyle(events)).toBe('commit_only');
  });

  it('returns error_bail when last events have tool_failure', () => {
    const events = [
      makePromptEvent('do something'),
      makeToolEvent('Bash', undefined, { id: '2' }),
      makeEvent({ event: 'tool_failure', id: '3' }),
    ];
    expect(detectClosingStyle(events)).toBe('error_bail');
  });

  it('returns abrupt_abandon as default fallback', () => {
    const events = [makePromptEvent('do something'), makeToolEvent('Bash', undefined, { id: '2' })];
    expect(detectClosingStyle(events)).toBe('abrupt_abandon');
  });

  it('returns unknown for empty events', () => {
    expect(detectClosingStyle([])).toBe('unknown');
  });
});
