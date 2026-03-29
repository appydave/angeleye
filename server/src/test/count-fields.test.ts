import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { countByFields } from '../services/sync.service.js';
import { _setDataDir, initAngelEyeDirs, updateRegistry } from '../services/registry.service.js';
import statsRouter from '../routes/stats.js';
import type { Registry } from '@appystack/shared';

// ── Expected Phase 2c field keys ──────────────────────────────────────────────

const EXPECTED_FIELDS = [
  'session_subtype',
  'delegation_style',
  'initiation_source',
  'session_continuity',
  'opening_style',
  'closing_style',
  'session_liveness',
  'output_type',
] as const;

// ── countByFields() pure function tests ───────────────────────────────────────

describe('countByFields()', () => {
  it('returns all 8 field keys with empty objects for an empty registry', () => {
    const result = countByFields({});

    expect(Object.keys(result)).toHaveLength(8);
    for (const field of EXPECTED_FIELDS) {
      expect(result).toHaveProperty(field);
      expect(result[field]).toEqual({});
    }
  });

  it('counts field values correctly for entries with Phase 2c fields', () => {
    const registry: Registry = {
      'ses-1': {
        session_id: 'ses-1',
        project: 'proj-a',
        project_dir: '/projects/a',
        started_at: '2026-03-01T10:00:00.000Z',
        last_active: '2026-03-01T10:00:00.000Z',
        name: null,
        tags: [],
        workspace_id: null,
        status: 'ended',
        source: 'hook',
        delegation_style: 'conversational',
        initiation_source: 'user_typed',
        session_liveness: 'high',
        output_type: 'code_changes',
      },
      'ses-2': {
        session_id: 'ses-2',
        project: 'proj-b',
        project_dir: '/projects/b',
        started_at: '2026-03-01T11:00:00.000Z',
        last_active: '2026-03-01T11:00:00.000Z',
        name: null,
        tags: [],
        workspace_id: null,
        status: 'ended',
        source: 'hook',
        delegation_style: 'conversational',
        initiation_source: 'skill_invoked',
        session_liveness: 'low',
        output_type: 'code_changes',
      },
      'ses-3': {
        session_id: 'ses-3',
        project: 'proj-c',
        project_dir: '/projects/c',
        started_at: '2026-03-01T12:00:00.000Z',
        last_active: '2026-03-01T12:00:00.000Z',
        name: null,
        tags: [],
        workspace_id: null,
        status: 'ended',
        source: 'hook',
        delegation_style: 'directive',
        initiation_source: 'user_typed',
        session_liveness: 'high',
        output_type: 'mixed',
      },
    };

    const result = countByFields(registry);

    // delegation_style: conversational=2, directive=1
    expect(result.delegation_style).toEqual({ conversational: 2, directive: 1 });

    // initiation_source: user_typed=2, skill_invoked=1
    expect(result.initiation_source).toEqual({ user_typed: 2, skill_invoked: 1 });

    // session_liveness: high=2, low=1
    expect(result.session_liveness).toEqual({ high: 2, low: 1 });

    // output_type: code_changes=2, mixed=1
    expect(result.output_type).toEqual({ code_changes: 2, mixed: 1 });

    // Fields not set on any entry → all counted as 'unknown'
    expect(result.session_subtype).toEqual({ unknown: 3 });
    expect(result.session_continuity).toEqual({ unknown: 3 });
    expect(result.opening_style).toEqual({ unknown: 3 });
    expect(result.closing_style).toEqual({ unknown: 3 });
  });

  it('counts missing/undefined field values as "unknown"', () => {
    const registry: Registry = {
      'ses-no-fields': {
        session_id: 'ses-no-fields',
        project: 'proj-x',
        project_dir: '/projects/x',
        started_at: '2026-03-01T10:00:00.000Z',
        last_active: '2026-03-01T10:00:00.000Z',
        name: null,
        tags: [],
        workspace_id: null,
        status: 'ended',
        source: 'hook',
        // No Phase 2c fields at all
      },
    };

    const result = countByFields(registry);

    for (const field of EXPECTED_FIELDS) {
      expect(result[field]).toEqual({ unknown: 1 });
    }
  });

  it('handles a mix of set and missing field values across entries', () => {
    const registry: Registry = {
      'ses-full': {
        session_id: 'ses-full',
        project: 'proj-a',
        project_dir: '/projects/a',
        started_at: '2026-03-01T10:00:00.000Z',
        last_active: '2026-03-01T10:00:00.000Z',
        name: null,
        tags: [],
        workspace_id: null,
        status: 'ended',
        source: 'hook',
        delegation_style: 'autonomous',
        session_liveness: 'medium',
      },
      'ses-empty': {
        session_id: 'ses-empty',
        project: 'proj-b',
        project_dir: '/projects/b',
        started_at: '2026-03-01T11:00:00.000Z',
        last_active: '2026-03-01T11:00:00.000Z',
        name: null,
        tags: [],
        workspace_id: null,
        status: 'ended',
        source: 'hook',
      },
    };

    const result = countByFields(registry);

    // delegation_style: one set, one missing
    expect(result.delegation_style).toEqual({ autonomous: 1, unknown: 1 });

    // session_liveness: one set, one missing
    expect(result.session_liveness).toEqual({ medium: 1, unknown: 1 });

    // Fields not set on either entry
    expect(result.session_subtype).toEqual({ unknown: 2 });
  });
});

// ── /api/stats route — fields in response ─────────────────────────────────────

describe('GET /api/stats — fields property', () => {
  let testDir: string;
  let app: express.Express;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'angeleye-count-fields-test-'));
    _setDataDir(testDir);
    await initAngelEyeDirs();
    app = express();
    app.use(express.json());
    app.use('/api/stats', statsRouter);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('response includes fields with all 8 expected keys', async () => {
    const res = await request(app).get('/api/stats');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data).toHaveProperty('fields');

    const fields = res.body.data.fields as Record<string, Record<string, number>>;
    for (const key of EXPECTED_FIELDS) {
      expect(fields).toHaveProperty(key);
    }
  });

  it('fields reflect registry entries with Phase 2c values', async () => {
    await updateRegistry('ses-field-1', {
      session_id: 'ses-field-1',
      project_dir: '/projects/a',
      last_active: '2026-03-01T10:00:00.000Z',
      delegation_style: 'orchestrated',
      output_type: 'new_artifacts',
    });
    await updateRegistry('ses-field-2', {
      session_id: 'ses-field-2',
      project_dir: '/projects/b',
      last_active: '2026-03-01T11:00:00.000Z',
      delegation_style: 'orchestrated',
      output_type: 'conversation_only',
    });

    const res = await request(app).get('/api/stats');

    expect(res.status).toBe(200);
    const fields = res.body.data.fields as Record<string, Record<string, number>>;
    expect(fields.delegation_style['orchestrated']).toBe(2);
    expect(fields.output_type['new_artifacts']).toBe(1);
    expect(fields.output_type['conversation_only']).toBe(1);
  });
});
