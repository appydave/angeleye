import { describe, it, expect } from 'vitest';
import { extractSessionTitle } from './backfill.service.js';

// Fixtures are real lines copied out of ~/.claude/projects JSONLs (2026-08-21
// census, Claude Code 2.1.235–2.1.238), not shapes invented to match the code.
// Expectations are literals — never re-derived with the expression under test.
const CUSTOM_TITLE = '{"type":"custom-title","customTitle":"angeleye-dev","sessionId":"s1"}';
const AI_TITLE =
  '{"type":"ai-title","aiTitle":"Transfer downloaded files between computers","sessionId":"a56202fe-7917-4bbf-9d87-8335a40684fe"}';
const AGENT_NAME = '{"type":"agent-name","agentName":"angeleye-dev","sessionId":"s1"}';
const USER_LINE =
  '{"type":"user","message":{"role":"user","content":"hi"},"uuid":"u1","timestamp":"2026-08-21T12:00:00.000Z"}';

describe('extractSessionTitle', () => {
  it('returns null when the transcript carries no title entry', () => {
    expect(extractSessionTitle([USER_LINE, AGENT_NAME])).toBeNull();
  });

  it('reads a user-chosen custom-title', () => {
    expect(extractSessionTitle([USER_LINE, CUSTOM_TITLE])).toEqual({
      title: 'angeleye-dev',
      source: 'custom-title',
    });
  });

  it('reads a model-generated ai-title — the type AngelEye used to ignore entirely', () => {
    expect(extractSessionTitle([USER_LINE, AI_TITLE])).toEqual({
      title: 'Transfer downloaded files between computers',
      source: 'ai-title',
    });
  });

  it('prefers the user-chosen title even when the ai-title was written LAST', () => {
    // This is the whole point of the precedence rule: /rename appends, and an
    // ai-title regenerated afterwards must not overwrite the user's choice.
    expect(extractSessionTitle([CUSTOM_TITLE, AI_TITLE])).toEqual({
      title: 'angeleye-dev',
      source: 'custom-title',
    });
  });

  it('prefers the user-chosen title when the ai-title came first', () => {
    expect(extractSessionTitle([AI_TITLE, CUSTOM_TITLE])).toEqual({
      title: 'angeleye-dev',
      source: 'custom-title',
    });
  });

  it('last wins within a kind — a second /rename supersedes the first', () => {
    const renamed = '{"type":"custom-title","customTitle":"angeleye-q2","sessionId":"s1"}';
    expect(extractSessionTitle([CUSTOM_TITLE, renamed])).toEqual({
      title: 'angeleye-q2',
      source: 'custom-title',
    });
  });

  it('last wins within ai-title too', () => {
    const later = '{"type":"ai-title","aiTitle":"Second guess","sessionId":"s1"}';
    expect(extractSessionTitle([AI_TITLE, later])).toEqual({
      title: 'Second guess',
      source: 'ai-title',
    });
  });

  it('skips malformed lines instead of throwing', () => {
    expect(extractSessionTitle(['{not json', '', CUSTOM_TITLE])).toEqual({
      title: 'angeleye-dev',
      source: 'custom-title',
    });
  });

  it('ignores a title entry whose value is not a string', () => {
    const bad = '{"type":"ai-title","aiTitle":null,"sessionId":"s1"}';
    expect(extractSessionTitle([bad])).toBeNull();
  });
});
