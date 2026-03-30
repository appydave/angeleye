import { describe, it, expect } from 'vitest';
import type { AngelEyeEvent } from '@appystack/shared';
import { groupEventsIntoTurns } from './SessionEventsPanel.js';

function makeEvent(
  overrides: Partial<AngelEyeEvent> & { event: AngelEyeEvent['event'] }
): AngelEyeEvent {
  return {
    id: `evt-${Math.random().toString(36).slice(2, 8)}`,
    session_id: 'test-session',
    ts: '2026-03-30T10:00:00Z',
    source: 'hook',
    ...overrides,
  };
}

describe('groupEventsIntoTurns', () => {
  it('returns empty array for empty input', () => {
    expect(groupEventsIntoTurns([])).toEqual([]);
  });

  it('groups a user_prompt into a user turn', () => {
    const events = [makeEvent({ event: 'user_prompt', prompt: 'hello' })];
    const turns = groupEventsIntoTurns(events);

    expect(turns).toHaveLength(1);
    expect(turns[0]!.type).toBe('user');
    if (turns[0]!.type === 'user') {
      expect(turns[0]!.prompt).toBe('hello');
    }
  });

  it('groups tool_use events into a claude turn ended by stop', () => {
    const events = [
      makeEvent({ event: 'tool_use', tool: 'Read', ts: '2026-03-30T10:00:01Z' }),
      makeEvent({ event: 'tool_use', tool: 'Edit', ts: '2026-03-30T10:00:02Z' }),
      makeEvent({ event: 'stop', last_message: 'Done editing.', ts: '2026-03-30T10:00:03Z' }),
    ];
    const turns = groupEventsIntoTurns(events);

    expect(turns).toHaveLength(1);
    expect(turns[0]!.type).toBe('claude');
    if (turns[0]!.type === 'claude') {
      expect(turns[0]!.tools).toHaveLength(2);
      expect(turns[0]!.tools[0]!.tool).toBe('Read');
      expect(turns[0]!.tools[1]!.tool).toBe('Edit');
      expect(turns[0]!.message).toBe('Done editing.');
    }
  });

  it('renders stop event last_message as claude bubble text', () => {
    const events = [
      makeEvent({
        event: 'stop',
        last_message: 'Here is my response.',
        ts: '2026-03-30T10:00:01Z',
      }),
    ];
    const turns = groupEventsIntoTurns(events);

    expect(turns).toHaveLength(1);
    expect(turns[0]!.type).toBe('claude');
    if (turns[0]!.type === 'claude') {
      expect(turns[0]!.message).toBe('Here is my response.');
    }
  });

  it('sets message to null when stop has no last_message', () => {
    const events = [
      makeEvent({ event: 'tool_use', tool: 'Bash', ts: '2026-03-30T10:00:01Z' }),
      makeEvent({ event: 'stop', ts: '2026-03-30T10:00:02Z' }),
    ];
    const turns = groupEventsIntoTurns(events);

    expect(turns).toHaveLength(1);
    if (turns[0]!.type === 'claude') {
      expect(turns[0]!.message).toBeNull();
      expect(turns[0]!.tools).toHaveLength(1);
    }
  });

  it('skips noise events (progress, pre_tool_use, cwd_changed, instructions_loaded)', () => {
    const events = [
      makeEvent({ event: 'user_prompt', prompt: 'test' }),
      makeEvent({ event: 'progress' as AngelEyeEvent['event'] }),
      makeEvent({ event: 'pre_tool_use' }),
      makeEvent({ event: 'cwd_changed' }),
      makeEvent({ event: 'instructions_loaded' }),
      makeEvent({ event: 'stop', last_message: 'done' }),
    ];
    const turns = groupEventsIntoTurns(events);

    // Should only have user turn + claude turn, no noise
    expect(turns).toHaveLength(2);
    expect(turns[0]!.type).toBe('user');
    expect(turns[1]!.type).toBe('claude');
  });

  it('includes tool_failure events in the tool group with failed flag', () => {
    const events = [
      makeEvent({ event: 'tool_use', tool: 'Read', ts: '2026-03-30T10:00:01Z' }),
      makeEvent({
        event: 'tool_failure',
        tool: 'Write',
        error: 'permission denied',
        ts: '2026-03-30T10:00:02Z',
      }),
      makeEvent({ event: 'stop', last_message: 'Write failed.', ts: '2026-03-30T10:00:03Z' }),
    ];
    const turns = groupEventsIntoTurns(events);

    expect(turns).toHaveLength(1);
    if (turns[0]!.type === 'claude') {
      expect(turns[0]!.tools).toHaveLength(2);
      expect(turns[0]!.tools[0]!.failed).toBeFalsy();
      expect(turns[0]!.tools[1]!.tool).toBe('Write');
      expect(turns[0]!.tools[1]!.failed).toBe(true);
      expect(turns[0]!.tools[1]!.summary).toBe('permission denied');
    }
  });

  it('creates dividers for session_start and session_end', () => {
    const events = [
      makeEvent({ event: 'session_start', ts: '2026-03-30T10:00:00Z' }),
      makeEvent({ event: 'user_prompt', prompt: 'hi', ts: '2026-03-30T10:00:01Z' }),
      makeEvent({ event: 'session_end', ts: '2026-03-30T10:00:02Z' }),
    ];
    const turns = groupEventsIntoTurns(events);

    expect(turns).toHaveLength(3);
    expect(turns[0]!.type).toBe('divider');
    if (turns[0]!.type === 'divider') expect(turns[0]!.label).toBe('Session Start');
    expect(turns[1]!.type).toBe('user');
    expect(turns[2]!.type).toBe('divider');
    if (turns[2]!.type === 'divider') expect(turns[2]!.label).toBe('Session End');
  });

  it('creates a divider for subagent_start with agent_type', () => {
    const events = [
      makeEvent({ event: 'subagent_start', agent_type: 'researcher', ts: '2026-03-30T10:00:00Z' }),
    ];
    const turns = groupEventsIntoTurns(events);

    expect(turns).toHaveLength(1);
    expect(turns[0]!.type).toBe('divider');
    if (turns[0]!.type === 'divider') {
      expect(turns[0]!.label).toContain('researcher');
    }
  });

  it('flushes pending tools as a claude turn at end-of-stream (no stop event)', () => {
    const events = [
      makeEvent({ event: 'tool_use', tool: 'Read', ts: '2026-03-30T10:00:01Z' }),
      makeEvent({ event: 'tool_use', tool: 'Grep', ts: '2026-03-30T10:00:02Z' }),
    ];
    const turns = groupEventsIntoTurns(events);

    expect(turns).toHaveLength(1);
    expect(turns[0]!.type).toBe('claude');
    if (turns[0]!.type === 'claude') {
      expect(turns[0]!.tools).toHaveLength(2);
      expect(turns[0]!.message).toBeNull();
    }
  });

  it('flushes pending tools when a user_prompt arrives mid-stream', () => {
    const events = [
      makeEvent({ event: 'tool_use', tool: 'Read', ts: '2026-03-30T10:00:01Z' }),
      makeEvent({ event: 'user_prompt', prompt: 'continue', ts: '2026-03-30T10:00:02Z' }),
      makeEvent({ event: 'stop', last_message: 'ok', ts: '2026-03-30T10:00:03Z' }),
    ];
    const turns = groupEventsIntoTurns(events);

    expect(turns).toHaveLength(3);
    // First: flushed claude turn (tools only, no message)
    expect(turns[0]!.type).toBe('claude');
    if (turns[0]!.type === 'claude') {
      expect(turns[0]!.tools).toHaveLength(1);
      expect(turns[0]!.message).toBeNull();
    }
    // Second: user turn
    expect(turns[1]!.type).toBe('user');
    // Third: claude turn from stop
    expect(turns[2]!.type).toBe('claude');
  });

  it('handles subagent_stop with last_message as a claude turn', () => {
    const events = [
      makeEvent({
        event: 'subagent_stop',
        last_message: 'Agent done.',
        ts: '2026-03-30T10:00:01Z',
      }),
    ];
    const turns = groupEventsIntoTurns(events);

    expect(turns).toHaveLength(1);
    expect(turns[0]!.type).toBe('claude');
    if (turns[0]!.type === 'claude') {
      expect(turns[0]!.message).toBe('Agent done.');
    }
  });

  it('groups a full conversation with multiple turns correctly', () => {
    const events = [
      makeEvent({ event: 'session_start', ts: '2026-03-30T10:00:00Z' }),
      makeEvent({ event: 'user_prompt', prompt: 'fix the bug', ts: '2026-03-30T10:00:01Z' }),
      makeEvent({ event: 'tool_use', tool: 'Read', ts: '2026-03-30T10:00:02Z' }),
      makeEvent({ event: 'tool_use', tool: 'Edit', ts: '2026-03-30T10:00:03Z' }),
      makeEvent({ event: 'stop', last_message: 'Fixed it.', ts: '2026-03-30T10:00:04Z' }),
      makeEvent({ event: 'user_prompt', prompt: 'run tests', ts: '2026-03-30T10:00:05Z' }),
      makeEvent({ event: 'tool_use', tool: 'Bash', ts: '2026-03-30T10:00:06Z' }),
      makeEvent({ event: 'stop', last_message: 'All passing.', ts: '2026-03-30T10:00:07Z' }),
      makeEvent({ event: 'session_end', ts: '2026-03-30T10:00:08Z' }),
    ];
    const turns = groupEventsIntoTurns(events);

    expect(turns).toHaveLength(6);
    expect(turns.map((t) => t.type)).toEqual([
      'divider',
      'user',
      'claude',
      'user',
      'claude',
      'divider',
    ]);
  });
});
