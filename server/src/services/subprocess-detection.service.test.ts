import { describe, it, expect } from 'vitest';
import type { AngelEyeEvent } from '@appystack/shared';
import { detectSubprocess } from './subprocess-detection.service.js';

function makePrompt(text: string, id = 'p1'): AngelEyeEvent {
  return {
    id,
    session_id: 'ses-x',
    ts: '2026-01-01T00:00:00Z',
    source: 'hook',
    event: 'user_prompt',
    prompt: text,
  };
}

function makeTool(tool: string, id = 't1'): AngelEyeEvent {
  return {
    id,
    session_id: 'ses-x',
    ts: '2026-01-01T00:00:00Z',
    source: 'hook',
    event: 'tool_use',
    tool,
  };
}

describe('detectSubprocess — positive cases', () => {
  const positiveCases = [
    '-\nGenerate 3-7 relevant tags for this content. Return only a JSON array of lowercase strings.',
    '-\nExtract 1-3 concrete facts about specific people, companies, or projects from this conversation.',
    '-\nExtract entities and relationships from this conversation:\n\nUser: File: 01-onboarding/lars.md',
    '-\nExtract key facts from this conversation as a JSON array of objects.',
    '-\nSummarize this content for a personal knowledge system. This is a HIGH-PRIORITY memory.',
    '-\nGiven a NEW fact and a list of EXISTING facts about the same person/entity, determine if it is a duplicate.',
    '-\nYou are an entity graph deduplication assistant for a personal knowledge system.',
    '-\nYou are executing a heartbeat task. Follow these instructions exactly.',
    '-\nGiven these observations about "Lars", what PATTERNS do you detect?',
    '-\nWrite a concise 2-sentence profile for this person. Be factual.',
    'You are executing a skill. Follow the instructions below exactly.',
    // Bare patterns without the leading `-\n` separator
    'Extract entities and relationships from this conversation:\n\nUser: File: 02-topics/omi-web.md',
    'Pre-compaction memory flush. The session is near auto-compaction.\n\nReview the conversation context below.',
  ];

  positiveCases.forEach((prompt) => {
    it(`detects subprocess for prompt starting "${prompt.slice(0, 40)}..."`, () => {
      const events = [makePrompt(prompt)];
      expect(detectSubprocess(events).is_subprocess).toBe(true);
    });
  });
});

describe('detectSubprocess — negative cases', () => {
  it('does NOT flag normal user questions', () => {
    expect(detectSubprocess([makePrompt('How do I start the app?')]).is_subprocess).toBe(false);
  });

  it('does NOT flag skill invocations', () => {
    expect(detectSubprocess([makePrompt('/bmad-dev DS 5.4')]).is_subprocess).toBe(false);
  });

  it('does NOT flag /brain-librarian', () => {
    expect(detectSubprocess([makePrompt('/brain-librarian')]).is_subprocess).toBe(false);
  });

  it('does NOT flag bookend-style continuations', () => {
    expect(
      detectSubprocess([makePrompt("I'm just wanting to continue from another conversation")])
        .is_subprocess
    ).toBe(false);
  });

  it('does NOT flag sessions with > 5 events even if prompt matches', () => {
    const events: AngelEyeEvent[] = [
      makePrompt('-\nGenerate 3-7 relevant tags for this content.'),
      makeTool('Read', 't1'),
      makeTool('Edit', 't2'),
      makeTool('Write', 't3'),
      makeTool('Bash', 't4'),
      makeTool('Bash', 't5'),
      makeTool('Bash', 't6'),
    ];
    expect(detectSubprocess(events).is_subprocess).toBe(false);
  });

  it('does NOT flag empty event list', () => {
    expect(detectSubprocess([]).is_subprocess).toBe(false);
  });

  it('does NOT flag sessions without a user_prompt event', () => {
    expect(detectSubprocess([makeTool('Read')]).is_subprocess).toBe(false);
  });
});

describe('detectSubprocess — boundary at 5 events', () => {
  it('flags subprocess with exactly 5 events', () => {
    const events: AngelEyeEvent[] = [
      makePrompt('-\nSummarize this content for a personal knowledge system.'),
      makeTool('Read', 't1'),
      makeTool('Edit', 't2'),
      makeTool('Write', 't3'),
      makeTool('Bash', 't4'),
    ];
    expect(detectSubprocess(events).is_subprocess).toBe(true);
  });
});
