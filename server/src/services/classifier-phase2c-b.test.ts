import { describe, it, expect } from 'vitest';
import type { AngelEyeEvent } from '@appystack/shared';
import {
  detectOpeningStyle,
  detectClosingStyle,
  detectAutonomyRatio,
  detectSessionLiveness,
} from './classifier.service.js';

// ── Helper ─────────────────────────────────────────────────────────────────────

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

function makePromptEvent(prompt: string, ts?: string): AngelEyeEvent {
  return makeEvent({
    event: 'user_prompt',
    prompt,
    ...(ts && { ts }),
  });
}

function makeToolEvent(
  tool: string,
  toolSummary?: Record<string, unknown>,
  ts?: string
): AngelEyeEvent {
  return makeEvent({
    event: 'tool_use',
    tool,
    tool_summary: toolSummary,
    ...(ts && { ts }),
  });
}

// ── detectOpeningStyle ──────────────────────────────────────────────────────────

describe('detectOpeningStyle', () => {
  it('returns skill_invocation when first prompt starts with /', () => {
    const events = [makePromptEvent('/commit fix the auth bug')];
    expect(detectOpeningStyle(events)).toBe('skill_invocation');
  });

  it('returns voice_dictation for long run-on prompt without punctuation', () => {
    // Create a prompt with >100 words in a single sentence (no . ! ? breaks)
    const words = Array.from({ length: 110 }, (_, i) => `word${i}`).join(' ');
    const events = [makePromptEvent(words)];
    expect(detectOpeningStyle(events)).toBe('voice_dictation');
  });

  it('returns paste_handover when first prompt exceeds 2000 chars', () => {
    const longPrompt = 'x'.repeat(2001);
    const events = [makePromptEvent(longPrompt)];
    expect(detectOpeningStyle(events)).toBe('paste_handover');
  });

  it('returns typed_question when prompt is short and ends with ?', () => {
    const events = [makePromptEvent('How do I fix this bug?')];
    expect(detectOpeningStyle(events)).toBe('typed_question');
  });

  it('returns typed_instruction for short imperative with no question mark', () => {
    const events = [makePromptEvent('Fix the auth middleware')];
    expect(detectOpeningStyle(events)).toBe('typed_instruction');
  });

  it('returns greeting for short greeting', () => {
    const events = [makePromptEvent('hello')];
    expect(detectOpeningStyle(events)).toBe('greeting');
  });

  it('returns continuation when prompt references prior session', () => {
    const events = [makePromptEvent('Continuing from last session, fix the tests')];
    expect(detectOpeningStyle(events)).toBe('continuation');
  });

  it('returns agent_initiated when first event is not user_prompt', () => {
    const events = [makeEvent({ event: 'session_start' }), makeToolEvent('Bash')];
    expect(detectOpeningStyle(events)).toBe('agent_initiated');
  });

  it('returns unknown for empty events', () => {
    expect(detectOpeningStyle([])).toBe('unknown');
  });

  it('returns code_paste for medium prompt with code fences', () => {
    const codePrompt = 'Please review this code:\n' + '```typescript\n' + 'x'.repeat(200) + '\n```';
    const events = [makePromptEvent(codePrompt)];
    expect(detectOpeningStyle(events)).toBe('code_paste');
  });

  it('returns context_dump for large structured prompt with JSON markers', () => {
    const structuredPrompt = '{ "config": ' + 'x'.repeat(500) + ' }';
    const events = [makePromptEvent(structuredPrompt)];
    expect(detectOpeningStyle(events)).toBe('context_dump');
  });
});

// ── detectClosingStyle ──────────────────────────────────────────────────────────

describe('detectClosingStyle', () => {
  it('returns commit_push when tail has git commit AND git push', () => {
    const events = [
      makePromptEvent('build the feature'),
      makeToolEvent('Edit'),
      makeToolEvent('Bash', { command: 'git commit -m "feat: add auth"' }),
      makeToolEvent('Bash', { command: 'git push origin main' }),
      makeEvent({ event: 'stop', last_message: 'Done' }),
    ];
    expect(detectClosingStyle(events)).toBe('commit_push');
  });

  it('returns commit_only when tail has git commit but no push', () => {
    const events = [
      makePromptEvent('build the feature'),
      makeToolEvent('Edit'),
      makeToolEvent('Bash', { command: 'git commit -m "feat: add auth"' }),
      makeEvent({ event: 'stop', last_message: 'Committed' }),
    ];
    expect(detectClosingStyle(events)).toBe('commit_only');
  });

  it('returns abrupt_abandon when no closing ceremony', () => {
    const events = [
      makePromptEvent('do something'),
      makeToolEvent('Bash', { command: 'npm test' }),
    ];
    expect(detectClosingStyle(events)).toBe('abrupt_abandon');
  });

  it('returns summary_close when last stop has closing language', () => {
    const events = [
      makePromptEvent('build it'),
      makeToolEvent('Edit'),
      makeEvent({ event: 'stop', last_message: 'All done! The feature is complete.' }),
    ];
    expect(detectClosingStyle(events)).toBe('summary_close');
  });

  it('returns error_bail when last events contain tool_failure', () => {
    const events = [
      makePromptEvent('run the tests'),
      makeToolEvent('Bash'),
      makeEvent({ event: 'tool_failure', error: 'ENOENT' }),
    ];
    expect(detectClosingStyle(events)).toBe('error_bail');
  });

  it('returns task_handoff when last message mentions next session', () => {
    const events = [
      makePromptEvent('work on this'),
      makeEvent({ event: 'stop', last_message: 'We can pick up later in the next session.' }),
    ];
    expect(detectClosingStyle(events)).toBe('task_handoff');
  });

  it('returns question_answer when ends with prompt then stop, no tools between', () => {
    const events = [
      makeToolEvent('Read'),
      makePromptEvent('What does this function do?'),
      makeEvent({ event: 'stop', last_message: '' }),
    ];
    expect(detectClosingStyle(events)).toBe('question_answer');
  });

  it('returns unknown for empty events', () => {
    expect(detectClosingStyle([])).toBe('unknown');
  });
});

// ── detectAutonomyRatio ─────────────────────────────────────────────────────────

describe('detectAutonomyRatio', () => {
  it('returns high ratio when many tools and few prompts', () => {
    const events = [
      makePromptEvent('build everything'),
      makeToolEvent('Edit'),
      makeToolEvent('Bash'),
      makeToolEvent('Write'),
      makeToolEvent('Edit'),
      makeToolEvent('Bash'),
      makeToolEvent('Edit'),
      makeToolEvent('Write'),
      makeToolEvent('Bash'),
      makeToolEvent('Edit'),
    ];
    // 9 tools / (9 tools + 1 prompt) = 0.9
    expect(detectAutonomyRatio(events)).toBe(0.9);
  });

  it('returns low ratio when many prompts and few tools', () => {
    const events = [
      makePromptEvent('step 1'),
      makeToolEvent('Bash'),
      makePromptEvent('step 2'),
      makePromptEvent('step 3'),
      makePromptEvent('step 4'),
    ];
    // 1 tool / (1 tool + 4 prompts) = 0.2
    expect(detectAutonomyRatio(events)).toBe(0.2);
  });

  it('returns 0 for empty events', () => {
    expect(detectAutonomyRatio([])).toBe(0);
  });

  it('returns 0.5 for balanced tool/prompt mix', () => {
    const events = [
      makePromptEvent('do this'),
      makeToolEvent('Bash'),
      makePromptEvent('now this'),
      makeToolEvent('Edit'),
    ];
    // 2 tools / (2 tools + 2 prompts) = 0.5
    expect(detectAutonomyRatio(events)).toBe(0.5);
  });

  it('ignores non-tool non-prompt events', () => {
    const events = [
      makePromptEvent('hello'),
      makeEvent({ event: 'session_start' }),
      makeEvent({ event: 'stop' }),
      makeToolEvent('Bash'),
    ];
    // 1 tool / (1 tool + 1 prompt) = 0.5
    expect(detectAutonomyRatio(events)).toBe(0.5);
  });
});

// ── detectSessionLiveness ───────────────────────────────────────────────────────

describe('detectSessionLiveness', () => {
  it('returns high when many events in short duration', () => {
    // 20 events in 2 minutes = 10 events/min
    const baseTime = new Date('2026-01-01T00:00:00Z').getTime();
    const events = Array.from({ length: 20 }, (_, i) =>
      makeEvent({
        id: `evt-${i}`,
        ts: new Date(baseTime + i * 6_000).toISOString(), // every 6 seconds
        event: 'tool_use',
        tool: 'Bash',
      })
    );
    expect(detectSessionLiveness(events)).toBe('high');
  });

  it('returns low when few events over long duration', () => {
    // 2 events over 30 minutes = 0.067 events/min
    const events = [
      makeEvent({ ts: '2026-01-01T00:00:00Z', event: 'user_prompt', prompt: 'hello' }),
      makeEvent({ id: 'evt-2', ts: '2026-01-01T00:30:00Z', event: 'stop' }),
    ];
    expect(detectSessionLiveness(events)).toBe('low');
  });

  it('returns medium for moderate event density', () => {
    // 5 events in 2 minutes = 2.5 events/min
    const baseTime = new Date('2026-01-01T00:00:00Z').getTime();
    const events = Array.from({ length: 5 }, (_, i) =>
      makeEvent({
        id: `evt-${i}`,
        ts: new Date(baseTime + i * 24_000).toISOString(), // every 24 seconds
        event: 'tool_use',
        tool: 'Bash',
      })
    );
    expect(detectSessionLiveness(events)).toBe('medium');
  });

  it('returns low for empty events', () => {
    expect(detectSessionLiveness([])).toBe('low');
  });

  it('uses event count heuristic when duration < 1 minute', () => {
    // 15 events all at same timestamp — high by count
    const events = Array.from({ length: 15 }, (_, i) =>
      makeEvent({
        id: `evt-${i}`,
        ts: '2026-01-01T00:00:00Z',
        event: 'tool_use',
        tool: 'Bash',
      })
    );
    expect(detectSessionLiveness(events)).toBe('high');
  });

  it('returns medium for single timestamp with 5 events', () => {
    const events = Array.from({ length: 5 }, (_, i) =>
      makeEvent({
        id: `evt-${i}`,
        ts: '2026-01-01T00:00:00Z',
        event: 'tool_use',
        tool: 'Bash',
      })
    );
    expect(detectSessionLiveness(events)).toBe('medium');
  });
});
