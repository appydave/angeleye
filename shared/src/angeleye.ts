export type AngelEyeSource = 'hook' | 'transcript';

export type AngelEyeEventType =
  | 'session_start'
  | 'user_prompt'
  | 'tool_use'
  | 'stop'
  | 'session_end'
  | 'subagent_start'
  | 'subagent_stop'
  // Wave 11 — full hook coverage
  | 'tool_failure'
  | 'stop_failure'
  | 'worktree_create'
  | 'worktree_remove'
  | 'cwd_changed'
  | 'pre_tool_use'
  | 'instructions_loaded'
  | 'pre_compact'
  | 'post_compact'
  | 'permission_request'
  | 'notification'
  | 'teammate_idle'
  | 'task_completed'
  | 'config_change'
  | 'elicitation'
  | 'elicitation_result'
  | 'file_changed';

export interface AngelEyeEvent {
  id: string;
  session_id: string;
  ts: string;
  source: AngelEyeSource;
  event: AngelEyeEventType;
  cwd?: string;
  agent_id?: string;
  prompt?: string;
  tool?: string;
  tool_use_id?: string;
  tool_summary?: Record<string, unknown>;
  result?: string;
  reason?: string;
  last_message?: string;
  agent_type?: string;
  // Wave 11 — generic bucket for new event data
  payload?: Record<string, unknown>;
  error?: string;
}

export type SessionType =
  | 'BUILD' // product code changes — Edit/Write/Bash dominant
  | 'TEST' // UAT, Playwright, test running
  | 'RESEARCH' // web search, reading, external investigation
  | 'KNOWLEDGE' // brain/docs updates — no product changes
  | 'OPS' // infrastructure, CI/CD, Bash-only campaigns
  | 'ORIENTATION'; // cold start, reorientation, lookup

// ── Session Subtypes (B043) ─────────────────────────────────────────────────
// Confirmed subtypes with N >= 3 occurrences from 924-session campaign.
// Keyed by parent SessionType. Detection logic is NOT yet implemented —
// these types exist so downstream code can reference them.

export type SessionSubtype =
  // BUILD subtypes
  | 'bug_fix_round'
  | 'feature_implementation'
  | 'refactoring'
  | 'test_writing'
  | 'ci_pipeline'
  // ORIENTATION subtypes
  | 'codebase_exploration'
  | 'file_retrieval'
  | 'artifact_lookup'
  // KNOWLEDGE subtypes
  | 'brain_maintenance'
  | 'advisory_refinement'
  | 'brain_capture'
  // RESEARCH subtypes
  | 'technology_survey'
  | 'hardware_setup_troubleshooting'
  | 'release_exploration'
  // OPS subtypes
  | 'poem_execution'
  | 'directory_cleanup'
  | 'paperclip_agent'
  // PLANNING subtypes
  | 'daily_planning'
  | 'interactive_design'
  | 'sprint_planning'
  // SETUP subtypes
  | 'mcp_integration'
  | 'environment_setup'
  | 'dependency_management'
  // TEST subtypes
  | 'playwright_e2e'
  | 'test_debugging'
  // META subtypes
  | 'session_about_sessions';

export type ToolPattern =
  | 'playwright-heavy' // mcp__playwright__ > 40% of tool calls
  | 'bash-heavy' // Bash > 40% of tool calls
  | 'edit-heavy' // Edit+Write > 40% of tool calls
  | 'task-heavy' // Task+TaskCreate+TaskUpdate+TaskOutput > 40%
  | 'agent-heavy' // Agent > 20% of tool calls (lower threshold)
  | 'websearch-heavy' // WebFetch+mcp__brave-search > 30% of tool calls
  | 'read-heavy' // Glob+Read+Grep > 60% of tool calls, minimal writes
  | 'mixed'; // no single dominant pattern

export interface RegistryEntry {
  session_id: string;
  project: string;
  project_dir: string;
  started_at: string;
  last_active: string;
  name: string | null;
  tags: string[];
  workspace_id: string | null;
  status: 'active' | 'ended';
  source: AngelEyeSource;
  note?: string | null; // free-text annotation, set by user
  // rule-based classification (no LLM, computed from events)
  is_junk?: boolean;
  session_type?: SessionType;
  session_subtype?: SessionSubtype;
  tool_pattern?: ToolPattern;
  first_edited_dir?: string; // first directory meaningfully touched
  first_real_prompt?: string; // first non-junk prompt snippet, max 200 chars
}

export interface WorkspaceEntry {
  id: string;
  name: string;
  tags: string[];
  created_at: string;
}

export type Registry = Record<string, RegistryEntry>;
