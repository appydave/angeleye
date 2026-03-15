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
}

export interface WorkspaceEntry {
  id: string;
  name: string;
  tags: string[];
  created_at: string;
}

export type Registry = Record<string, RegistryEntry>;
