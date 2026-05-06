import { describe, it, expect } from 'vitest';
import type { AngelEyeEvent } from '@appystack/shared';
import { detectSessionSubtype } from '../services/classifier.service.js';

function makeEvent(overrides: Partial<AngelEyeEvent> = {}): AngelEyeEvent {
  return {
    id: 'evt-001',
    session_id: 'ses-abc',
    ts: new Date().toISOString(),
    source: 'hook',
    event: 'tool_use',
    ...overrides,
  };
}

function toolEvent(tool: string, file?: string): AngelEyeEvent {
  return makeEvent({
    tool,
    tool_summary: file ? { file } : undefined,
  });
}

// ── BUILD subtypes ────────────────────────────────────────────────────────────

describe('detectSessionSubtype — BUILD', () => {
  it('returns skill.creation when has_skill_created', () => {
    expect(
      detectSessionSubtype([], 'BUILD', 'edit-heavy', 'moderate', { has_skill_created: true })
    ).toBe('skill.creation');
  });

  it('returns skill.development when has_skill_modified (and no skill created)', () => {
    expect(
      detectSessionSubtype([], 'BUILD', 'edit-heavy', 'moderate', { has_skill_modified: true })
    ).toBe('skill.development');
  });

  it('returns build.campaign when prompt starts with /command', () => {
    expect(
      detectSessionSubtype([], 'BUILD', 'agent-heavy', 'heavy', {
        first_real_prompt: '/ralphy start the campaign',
      })
    ).toBe('build.campaign');
  });

  it('returns build.campaign when task_orchestration + parallel_subagent_bursts', () => {
    expect(
      detectSessionSubtype([], 'BUILD', 'agent-heavy', 'heavy', {
        has_task_orchestration: true,
        has_parallel_subagent_bursts: true,
      })
    ).toBe('build.campaign');
  });

  it('returns build.orchestrated_campaign when agent-heavy + task_orchestration only', () => {
    expect(
      detectSessionSubtype([], 'BUILD', 'agent-heavy', 'heavy', {
        has_task_orchestration: true,
        has_parallel_subagent_bursts: false,
      })
    ).toBe('build.orchestrated_campaign');
  });

  it('returns feature_implementation when edit-heavy + substantial scale + git outcome', () => {
    expect(
      detectSessionSubtype([], 'BUILD', 'edit-heavy', 'moderate', {
        has_git_outcome: true,
      })
    ).toBe('build.shipped');
  });

  it('returns bug_fix_round when prompt contains fix/bug keywords', () => {
    expect(
      detectSessionSubtype([], 'BUILD', 'mixed', 'light', {
        first_real_prompt: 'fix the broken auth middleware',
      })
    ).toBe('build.bug_fix');
  });

  it('returns refactoring when prompt contains refactor keywords', () => {
    expect(
      detectSessionSubtype([], 'BUILD', 'edit-heavy', 'moderate', {
        first_real_prompt: 'refactor the payment service',
      })
    ).toBe('build.refactor');
  });

  it('returns test_writing when prompt contains test keywords', () => {
    expect(
      detectSessionSubtype([], 'BUILD', 'edit-heavy', 'light', {
        first_real_prompt: 'write tests for the auth module',
      })
    ).toBe('build.test_writing');
  });

  it('returns test_writing when majority of edits target test files', () => {
    const events = [
      toolEvent('Edit', 'src/auth.test.ts'),
      toolEvent('Edit', 'src/user.test.ts'),
      toolEvent('Edit', 'src/auth.ts'),
    ];
    expect(detectSessionSubtype(events, 'BUILD', 'edit-heavy', 'moderate', {})).toBe(
      'build.test_writing'
    );
  });

  it('returns ci_pipeline when prompt + bash-heavy (no conflicting keywords)', () => {
    expect(
      detectSessionSubtype([], 'BUILD', 'bash-heavy', 'light', {
        first_real_prompt: 'setup the deploy pipeline',
      })
    ).toBe('build.ci_pipeline');
  });

  it('returns build.iterative_design for agent-heavy without orchestration when edits are substantial', () => {
    // Tightened 2026-05-04: requires >5 Edit/Write events alongside agent-heavy.
    const events = [
      ...Array.from({ length: 4 }, () => toolEvent('Agent')),
      ...Array.from({ length: 6 }, () => toolEvent('Edit', 'src/foo.ts')),
    ];
    expect(detectSessionSubtype(events, 'BUILD', 'agent-heavy', 'moderate', {})).toBe(
      'build.iterative_design'
    );
  });

  it('defaults to build.feature when no specific signal fires', () => {
    expect(detectSessionSubtype([], 'BUILD', 'mixed', 'moderate', {})).toBe('build.feature');
  });
});

// ── ORIENTATION subtypes ──────────────────────────────────────────────────────

describe('detectSessionSubtype — ORIENTATION', () => {
  it('returns orientation.quick_check for micro scale', () => {
    expect(detectSessionSubtype([], 'ORIENTATION', 'read-heavy', 'micro', {})).toBe(
      'orientation.quick_check'
    );
  });

  it('returns artifact_lookup when prompt contains find/where/locate', () => {
    expect(
      detectSessionSubtype([], 'ORIENTATION', 'mixed', 'light', {
        first_real_prompt: 'where is the auth config?',
      })
    ).toBe('orientation.artifact_lookup');
  });

  it('returns file_retrieval for light sessions starting with Read', () => {
    const events = [toolEvent('Read', 'src/config.ts')];
    expect(detectSessionSubtype(events, 'ORIENTATION', 'read-heavy', 'light', {})).toBe(
      'orientation.file_retrieval'
    );
  });

  it('returns codebase_exploration for read-heavy sessions', () => {
    expect(detectSessionSubtype([], 'ORIENTATION', 'read-heavy', 'moderate', {})).toBe(
      'orientation.codebase_exploration'
    );
  });

  it('defaults to orientation.exploration when no specific signal fires', () => {
    expect(detectSessionSubtype([], 'ORIENTATION', 'mixed', 'moderate', {})).toBe(
      'orientation.exploration'
    );
  });
});

// ── KNOWLEDGE subtypes ────────────────────────────────────────────────────────

describe('detectSessionSubtype — KNOWLEDGE', () => {
  it('returns brain_capture when brain writes + capture prompt', () => {
    expect(
      detectSessionSubtype([], 'KNOWLEDGE', 'edit-heavy', 'light', {
        has_brain_file_writes: true,
        first_real_prompt: 'capture these findings about auth patterns',
      })
    ).toBe('knowledge.brain_capture');
  });

  it('returns brain_maintenance when brain writes without capture prompt', () => {
    expect(
      detectSessionSubtype([], 'KNOWLEDGE', 'edit-heavy', 'light', {
        has_brain_file_writes: true,
        first_real_prompt: 'update the brains',
      })
    ).toBe('knowledge.brain_maintenance');
  });

  it('returns advisory_refinement when edit-heavy targets .md files outside brains/', () => {
    const events = [toolEvent('Edit', 'docs/CLAUDE.md'), toolEvent('Edit', 'README.md')];
    expect(detectSessionSubtype(events, 'KNOWLEDGE', 'edit-heavy', 'light', {})).toBe(
      'knowledge.advisory_refinement'
    );
  });

  it('defaults to knowledge.general when no specific signal fires', () => {
    expect(detectSessionSubtype([], 'KNOWLEDGE', 'mixed', 'moderate', {})).toBe(
      'knowledge.general'
    );
  });
});

// ── RESEARCH subtypes ─────────────────────────────────────────────────────────

describe('detectSessionSubtype — RESEARCH', () => {
  it('returns technology_survey for websearch-heavy sessions', () => {
    expect(detectSessionSubtype([], 'RESEARCH', 'websearch-heavy', 'moderate', {})).toBe(
      'research.technology_survey'
    );
  });

  it('returns hardware_setup_troubleshooting when prompt contains setup/install/hardware', () => {
    expect(
      detectSessionSubtype([], 'RESEARCH', 'mixed', 'light', {
        first_real_prompt: 'how to setup the new hardware',
      })
    ).toBe('research.technology_survey');
  });

  it('returns release_exploration when prompt mentions release/version (non-websearch)', () => {
    expect(
      detectSessionSubtype([], 'RESEARCH', 'mixed', 'light', {
        first_real_prompt: 'what changed in the latest release?',
      })
    ).toBe('research.exploration');
  });

  it('defaults to research.exploration when no specific signal fires', () => {
    expect(detectSessionSubtype([], 'RESEARCH', 'mixed', 'moderate', {})).toBe(
      'research.exploration'
    );
  });
});

// ── OPS subtypes ──────────────────────────────────────────────────────────────

describe('detectSessionSubtype — OPS', () => {
  it('returns poem_execution when prompt matches run N pattern', () => {
    expect(
      detectSessionSubtype([], 'OPS', 'bash-heavy', 'light', {
        first_real_prompt: 'run 3',
      })
    ).toBe('poem_execution');
  });

  it('returns directory_cleanup for bash-heavy + clean/remove prompt', () => {
    expect(
      detectSessionSubtype([], 'OPS', 'bash-heavy', 'light', {
        first_real_prompt: 'clean up the old log files',
      })
    ).toBe('directory_cleanup');
  });

  it('defaults to operations.system_task when no specific signal fires', () => {
    expect(detectSessionSubtype([], 'OPS', 'mixed', 'moderate', {})).toBe('operations.system_task');
  });
});

// ── TEST subtypes ─────────────────────────────────────────────────────────────

describe('detectSessionSubtype — TEST', () => {
  it('returns playwright_e2e for playwright-heavy sessions', () => {
    expect(detectSessionSubtype([], 'TEST', 'playwright-heavy', 'moderate', {})).toBe(
      'playwright_e2e'
    );
  });

  it('returns test_debugging when prompt mentions debug/fail/broken', () => {
    expect(
      detectSessionSubtype([], 'TEST', 'mixed', 'light', {
        first_real_prompt: 'the tests are failing after the refactor',
      })
    ).toBe('test_debugging');
  });

  it('defaults to test.execution when no specific signal fires', () => {
    expect(detectSessionSubtype([], 'TEST', 'mixed', 'moderate', {})).toBe('test.execution');
  });
});
