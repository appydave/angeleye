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

export type SessionScale = 'micro' | 'light' | 'moderate' | 'heavy' | 'marathon';

// ── Phase 2c classifier types (B060) ───────────────────────────────────────

export type DelegationStyle = 'conversational' | 'directive' | 'orchestrated' | 'autonomous';

export type InitiationSource =
  | 'user_typed'
  | 'voice_dictated'
  | 'handover_paste'
  | 'skill_invoked'
  | 'agent_dispatched';

export type SessionContinuity =
  | 'fresh'
  | 'handover_paste'
  | 'compaction'
  | 'skill_launcher'
  | 'recall';

export type OpeningStyle =
  | 'typed_question' // short typed prompt, conversational
  | 'typed_instruction' // typed directive ("fix this", "add that")
  | 'voice_dictation' // long run-on, STT artifacts
  | 'skill_invocation' // starts with /command
  | 'paste_handover' // large paste (>2000 chars) or handover markers
  | 'code_paste' // medium paste with code markers (```, indentation)
  | 'continuation' // "continuing from...", cross-session refs
  | 'greeting' // "hello", "hi", "hey"
  | 'context_dump' // large structured context (JSON, markdown)
  | 'agent_initiated' // machine-initiated (no user prompt first)
  | 'unknown'; // fallback

export type ClosingStyle =
  | 'commit_push' // git commit + push in tail
  | 'commit_only' // git commit without push
  | 'summary_close' // assistant says "all done", "shipped", etc.
  | 'abrupt_abandon' // no closing ceremony, just stops
  | 'task_handoff' // mentions next session, saves context
  | 'question_answer' // ends on a Q&A exchange, no artifacts
  | 'error_bail' // last events are failures/errors
  | 'natural_completion' // work completed, no explicit ceremony
  | 'unknown'; // fallback

export type OutputType =
  | 'conversation_only'
  | 'code_changes'
  | 'knowledge_synthesis'
  | 'mixed'
  | 'new_artifacts';

export type SessionLiveness = 'high' | 'medium' | 'low';

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
  session_scale?: SessionScale;
  first_edited_dir?: string; // first directory meaningfully touched
  first_real_prompt?: string; // first non-junk prompt snippet, max 200 chars
  pii_flags?: string[];
  // Tier 1 predicates
  has_playwright_calls?: boolean;
  is_compaction_resume?: boolean;
  is_machine_initiated?: boolean;
  has_web_research?: boolean;
  has_parallel_subagent_bursts?: boolean;
  has_task_orchestration?: boolean;
  has_git_outcome?: boolean;
  // Tier 1 extractors
  trigger_command?: string | null;
  trigger_arguments?: string | null;
  // Agent genesis predicates
  has_skill_created?: boolean;
  has_skill_modified?: boolean;
  // Tier 2 predicates (regex/heuristic)
  has_brain_file_writes?: boolean;
  has_cross_session_refs?: boolean;
  has_unauthorized_edits?: boolean;
  has_voice_dictation_artifacts?: boolean;
  has_handover_context?: boolean;
  has_cross_project_reads?: boolean;
  has_closing_ceremony?: boolean;
  // Domain overlay classifiers (C14-C16)
  workflow_role?: string | null;
  workflow_identity?: string | null;
  workflow_action?: string | null;
  // Phase 2c classifiers (B060)
  delegation_style?: DelegationStyle;
  initiation_source?: InitiationSource;
  session_continuity?: SessionContinuity;
  opening_style?: OpeningStyle;
  closing_style?: ClosingStyle;
  autonomy_ratio?: number; // 0.0-1.0
  session_liveness?: SessionLiveness;
  output_type?: OutputType;
  // Affinity group references
  group_ids?: string[];
}

export interface WorkspaceEntry {
  id: string;
  name: string;
  tags: string[];
  created_at: string;
}

export type Registry = Record<string, RegistryEntry>;

// ── Domain Overlay types (C14-C16) ─────────────────────────────────────────

export interface DomainRoleMapping {
  role: string; // generic: builder, reviewer, tester, planner, observer, orchestrator, advisor, shipper
  identity: string | null; // agent name: Bob, Amelia, Nate, etc.
  actions: string[]; // action codes: WN, CS, VS, DS, DR, etc.
}

export interface DomainOverlay {
  domain: string; // e.g., "bmad-v6"
  role_mappings: Record<string, DomainRoleMapping>; // key is skill command pattern e.g., "/bmad-sm"
}

export interface OverlayResult {
  domain: string;
  role: string;
  identity: string | null;
  action: string | null;
}

// ── Affinity Groups ─────────────────────────────────────────────────────────

export type AffinityGroupType = 'story_unit' | 'epic_sprint' | 'project_phase' | 'ad_hoc';

export type AffinityConfidence = 'deterministic' | 'heuristic' | 'inferred';

export interface AffinityGroup {
  group_id: string;
  group_type: AffinityGroupType;
  label: string;
  session_ids: string[];
  confidence: AffinityConfidence;
  domain_overlay?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// ── Workflow Types ──────────────────────────────────────────────────────────
// Factory workflow model: workflow types (configs), stations, and runtime instances.
// See brains/angeleye/workflow-model.md for conceptual docs.

export type CeremonyLevel = 'full' | 'reduced' | 'minimal';

export type StationState = 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'backtracked';

export type WorkflowStatus = 'not_started' | 'in_progress' | 'closed';

export interface SkipRule {
  station_action: string;
  condition: string;
}

export interface StationConfig {
  position: number;
  action_code: string;
  role: string;
  identity: string | null;
  requires_fresh_session: boolean;
  can_spawn_subagents: boolean;
  backtrack_target: boolean;
}

export interface WorkflowType {
  id: string;
  name: string;
  domain: string;
  stations: StationConfig[];
  ceremony_level: CeremonyLevel;
  skip_rules: SkipRule[];
}

export interface StationInstance {
  position: number;
  action_code: string;
  state: StationState;
  session_ids: string[];
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  context_used_pct: number | null;
  subagent_count: number;
  verdict: string | null;
}

export interface BacktrackRecord {
  from_station: number;
  to_station: number;
  reason: string;
  timestamp: string;
}

// ── Project Config ─────────────────────────────────────────────────────────

export interface ProjectConfig {
  id: string;
  name: string;
  path: string;
  description: string;
  repository?: string;
  tags?: string[];
}

export interface WorkflowInstance {
  instance_id: string;
  workflow_type_id: string;
  work_item_id: string;
  work_item_label: string;
  status: WorkflowStatus;
  current_station: number;
  created_at: string;
  updated_at: string;
  stations: StationInstance[];
  backtracks: BacktrackRecord[];
  metadata: Record<string, unknown>;
}
