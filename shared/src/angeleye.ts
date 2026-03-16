export type AngelEyeSource = 'hook' | 'transcript';

export type AngelEyeEventType =
  | 'session_start'
  | 'user_prompt'
  | 'tool_use'
  | 'stop'
  | 'session_end'
  | 'subagent_start'
  | 'subagent_stop';

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
}

export type SessionType =
  | 'BUILD' // product code changes — Edit/Write/Bash dominant
  | 'TEST' // UAT, Playwright, test running
  | 'RESEARCH' // web search, reading, external investigation
  | 'KNOWLEDGE' // brain/docs updates — no product changes
  | 'OPS' // infrastructure, CI/CD, Bash-only campaigns
  | 'ORIENTATION'; // cold start, reorientation, lookup

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
  // rule-based classification (no LLM, computed from events)
  is_junk?: boolean;
  session_type?: SessionType;
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
