import { appendFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { logger } from '../config/logger.js';
import { _auditDir } from './registry.service.js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface FieldExpectation {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
}

export interface SchemaExpectation {
  fields: Record<string, FieldExpectation>;
}

export interface SchemaSurprise {
  field: string;
  expected: string;
  got: string;
}

export interface AuditEntry {
  ts: string;
  hook: string;
  event_type: string;
  surprises: SchemaSurprise[];
}

// ── Common fields present in every hook payload (never reported as surprises) ─

const COMMON_FIELDS = new Set([
  'session_id',
  'cwd',
  'hook_event_name',
  'transcript_path',
  'permission_mode',
  'stop_hook_active',
  'agent_id',
  'agent_type',
]);

// ── Schema Expectations ──────────────────────────────────────────────────────
// Original 7 events: tight expectations (required fields known from production).
// New 17 events: loose expectations (best-guess from hooks-reference.md, changelog).

export const HOOK_SCHEMA_EXPECTATIONS: Record<string, SchemaExpectation> = {
  // ── Original 7 (tight) ──────────────────────────────────────────────────
  session_start: {
    fields: {},
  },
  user_prompt: {
    fields: {
      user_prompt: { type: 'string' },
      prompt: { type: 'string' },
    },
  },
  tool_use: {
    fields: {
      tool_name: { type: 'string', required: true },
      tool_input: { type: 'object' },
      tool_result: { type: 'string' },
      tool_use_id: { type: 'string' },
    },
  },
  stop: {
    fields: {
      reason: { type: 'string' },
      last_assistant_message: { type: 'string' },
    },
  },
  session_end: {
    fields: {},
  },
  subagent_start: {
    fields: {},
  },
  subagent_stop: {
    fields: {
      reason: { type: 'string' },
      last_assistant_message: { type: 'string' },
    },
  },

  // ── P1: Session health ──────────────────────────────────────────────────
  tool_failure: {
    fields: {
      tool_name: { type: 'string' },
      tool_input: { type: 'object' },
      tool_use_id: { type: 'string' },
      error: { type: 'string' },
    },
  },
  stop_failure: {
    fields: {
      error: { type: 'string' },
      status_code: { type: 'number' },
    },
  },
  worktree_create: {
    fields: {
      worktree_path: { type: 'string' },
      worktree_branch: { type: 'string' },
    },
  },
  worktree_remove: {
    fields: {
      worktree_path: { type: 'string' },
    },
  },
  cwd_changed: {
    fields: {
      old_cwd: { type: 'string' },
      new_cwd: { type: 'string' },
    },
  },

  // ── P2: Context intelligence ────────────────────────────────────────────
  pre_tool_use: {
    fields: {
      tool_name: { type: 'string' },
      tool_input: { type: 'object' },
      tool_use_id: { type: 'string' },
    },
  },
  instructions_loaded: {
    fields: {
      files: { type: 'array' },
    },
  },
  pre_compact: {
    fields: {},
  },
  post_compact: {
    fields: {},
  },
  permission_request: {
    fields: {
      tool_name: { type: 'string' },
    },
  },
  notification: {
    fields: {
      message: { type: 'string' },
      type: { type: 'string' },
    },
  },

  // ── P3: Multi-agent and advanced ────────────────────────────────────────
  teammate_idle: {
    fields: {},
  },
  task_completed: {
    fields: {},
  },
  config_change: {
    fields: {
      file_path: { type: 'string' },
    },
  },
  elicitation: {
    fields: {
      server_name: { type: 'string' },
    },
  },
  elicitation_result: {
    fields: {
      server_name: { type: 'string' },
    },
  },
  file_changed: {
    fields: {
      file_path: { type: 'string' },
    },
  },
};

// ── Pure detection function ──────────────────────────────────────────────────

function jsType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

export function detectSurprises(
  _hookName: string,
  eventType: string,
  payload: Record<string, unknown>,
  expectations: Record<string, SchemaExpectation> = HOOK_SCHEMA_EXPECTATIONS
): SchemaSurprise[] {
  const expectation = expectations[eventType];
  if (!expectation) return [];

  const surprises: SchemaSurprise[] = [];

  // Check expected fields
  for (const [field, spec] of Object.entries(expectation.fields)) {
    if (!(field in payload)) {
      if (spec.required) {
        surprises.push({ field, expected: spec.type, got: 'missing' });
      }
    } else {
      const actual = jsType(payload[field]);
      if (actual !== spec.type) {
        surprises.push({ field, expected: spec.type, got: actual });
      }
    }
  }

  // Check unexpected fields
  for (const field of Object.keys(payload)) {
    if (COMMON_FIELDS.has(field)) continue;
    if (field in expectation.fields) continue;
    surprises.push({ field, expected: 'missing', got: jsType(payload[field]) });
  }

  return surprises;
}

// ── Fire-and-forget writer ───────────────────────────────────────────────────

export async function auditPayload(
  hookName: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const surprises = detectSurprises(hookName, eventType, payload);
    if (surprises.length === 0) return;

    const entry: AuditEntry = {
      ts: new Date().toISOString(),
      hook: hookName,
      event_type: eventType,
      surprises,
    };

    const auditDir = _auditDir();
    await mkdir(auditDir, { recursive: true });
    const filePath = join(auditDir, 'hook-schema-surprises.jsonl');
    await appendFile(filePath, JSON.stringify(entry) + '\n', 'utf-8');
  } catch (err) {
    logger.warn({ err, hookName, eventType }, 'Schema audit write failed — ignoring');
  }
}
