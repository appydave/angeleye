import { describe, it, expect } from 'vitest';
import { deriveSessionSubtype } from './sync.service.js';

describe('deriveSessionSubtype — split between LLM tags and rule-based heuristic', () => {
  it('returns the top tag when session_tags is present (LLM wins)', () => {
    const result = deriveSessionSubtype({
      session_tags: [
        { tag: 'build.shipped', confidence: 0.85 },
        { tag: 'build.feature', confidence: 0.5 },
      ],
      subtype_heuristic: 'build.campaign',
    });
    expect(result).toBe('build.shipped');
  });

  it('sorts session_tags by confidence descending before picking', () => {
    const result = deriveSessionSubtype({
      session_tags: [
        { tag: 'build.feature', confidence: 0.5 },
        { tag: 'build.shipped', confidence: 0.85 },
        { tag: 'build.bug_fix', confidence: 0.7 },
      ],
      subtype_heuristic: 'build.campaign',
    });
    expect(result).toBe('build.shipped');
  });

  it('falls back to subtype_heuristic when session_tags is empty', () => {
    const result = deriveSessionSubtype({
      session_tags: [],
      subtype_heuristic: 'build.campaign',
    });
    expect(result).toBe('build.campaign');
  });

  it('falls back to subtype_heuristic when session_tags is undefined', () => {
    const result = deriveSessionSubtype({
      subtype_heuristic: 'orientation.quick_check',
    });
    expect(result).toBe('orientation.quick_check');
  });

  it('returns undefined when neither writer has produced a value', () => {
    const result = deriveSessionSubtype({});
    expect(result).toBeUndefined();
  });

  it('LLM tag survives even when heuristic disagrees (force-resync invariant)', () => {
    // Scenario: rule-based classifier says build.campaign because the prompt starts
    // with /something. The LLM has already enriched the session and tagged it as
    // build.shipped. After a force resync, derivation must keep the LLM answer.
    const result = deriveSessionSubtype({
      session_tags: [{ tag: 'build.shipped', confidence: 0.85 }],
      subtype_heuristic: 'build.campaign',
    });
    expect(result).toBe('build.shipped');
  });
});
