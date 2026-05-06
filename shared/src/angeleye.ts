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
// Dot-notation taxonomy. session_subtype is derived: session_tags[0].tag (highest confidence).
// session_tags is the source of truth; session_subtype is a convenience read field.
//
// DATA: taxonomy.subtypes
// See docs/architecture/data-driven-extraction.md §1.
// This union encodes domain-specific subtypes (knowledge.brain_capture,
// knowledge.omi_ingestion, etc.). For multi-user deployments these would move
// to a config file (YAML/JSON) and SessionSubtype becomes string with runtime
// validation, or be code-generated from config.

export interface SessionTag {
  tag: SessionSubtype;
  confidence: number; // 0.0–1.0
  /**
   * Provenance of this tag. Lets cleanup scripts safely target migration-derived
   * tags without nuking real LLM work that happens to share the same shape.
   * - 'llm'           — written by the enrich-subtypes skill (considered work)
   * - 'migrated'      — written by the original migration from snake_case session_subtype
   * - 'heuristic_only' — written by automation as a heuristic-confirmed fallback
   * Optional for backwards compatibility with pre-source data; treat undefined as 'migrated'.
   */
  source?: 'llm' | 'migrated' | 'heuristic_only';
}

export type SessionSubtype =
  // BUILD — code production sessions
  | 'build.feature' // generic fallback (confidence 0.50)
  | 'build.shipped' // clear feature shipped + git outcome
  | 'build.bug_fix' // fix/bug in prompt or edit targets
  | 'build.refactor' // refactor/rename/extract
  | 'build.test_writing' // majority of edits are test files
  | 'build.ci_pipeline' // CI/deploy/pipeline edits
  | 'build.campaign' // /skill invocation OR task_orchestration + parallel bursts
  | 'build.orchestrated_campaign' // agent-heavy + task_orchestration, no parallel bursts
  | 'build.bmad_orchestrator' // BMAD lifecycle lead session (Swagger/orchestrator pane)
  | 'build.bmad_agent' // BMAD individual agent pane (bmad-sm, bmad-dev, bmad-dr, bmad-sat, etc.)
  | 'build.ruflo_orchestrator' // RuFlo Mode B lead session (subagent_starts + Agent() calls)
  | 'build.ralphy_campaign' // Ralphy-led parallel multi-agent run
  | 'build.multi_phase' // session spans multiple distinct phases
  | 'build.project_scaffolding' // scaffold/init/setup prompt
  | 'build.visual_implementation' // UI/CSS/Tailwind edits, component work
  | 'build.worktree_campaign' // worktree in file paths or prompt
  | 'build.prompt_engineering' // edits to SKILL.md, CLAUDE.md, prompt files
  // ORIENTATION — navigation and lookup sessions
  | 'orientation.quick_check' // generic fallback (confidence 0.50)
  | 'orientation.codebase_exploration' // broad read of codebase
  | 'orientation.file_retrieval' // fetching a known file
  | 'orientation.artifact_lookup' // looking for config, credential, specific output
  | 'orientation.feature_exploration' // exploring how a specific feature works
  | 'orientation.identity_check' // prompt asks who Claude is / what project
  | 'orientation.morning_triage' // first prompt about what to work on today
  | 'orientation.bookend' // opening/closing around another session
  | 'orientation.exploration' // generic orientation, nothing specific
  // KNOWLEDGE — brain and documentation sessions
  | 'knowledge.general' // generic fallback (confidence 0.50)
  | 'knowledge.brain_capture' // capturing new findings for first time
  | 'knowledge.brain_maintenance' // updating/reorganising existing brain files
  | 'knowledge.advisory_refinement' // editing CLAUDE.md, skills, prompt docs
  | 'knowledge.brain_audit' // auditing brain structure, planning organisation
  | 'knowledge.methodology_design' // designing a process, workflow, or method
  | 'knowledge.loom_capture' // processing Loom/video transcript
  | 'knowledge.omi_ingestion' // OMI wearable transcript processing
  // RESEARCH — investigation and evaluation sessions
  | 'research.exploration' // generic fallback (confidence 0.50)
  | 'research.technology_survey' // websearch-heavy, evaluating tools/libraries
  | 'research.tool_evaluation' // comparing specific tools or approaches
  | 'research.conceptual_exploration' // exploring ideas, no specific deliverable
  | 'research.quick_answer' // short session, specific question answered
  // META — session quality/nature classifications
  | 'meta.ghost_session' // human opened Claude, typed nothing, closed (confidence 0.95)
  | 'meta.scheduled_probe' // scheduler spawned Claude with no prompt — lifecycle only (confidence 0.95)
  | 'meta.accidental' // micro + no tool use + abrupt abandon (confidence 0.95)
  // PLAYWRIGHT-DERIVED — disambiguating what playwright tool use means
  | 'orientation.visual_inspection' // playwright clicks/screenshots, no edits — looking at UI
  | 'orientation.documentation_capture' // /screenshot-tour: visit every route + capture screenshots
  | 'build.user_acceptance_test' // /bmad-sat: AC validation via playwright + bash, no edits
  // LEGACY — values still present in registry data, not produced by classifier going forward
  | 'playwright_e2e'
  | 'skill.development'
  | 'skill.creation'
  | 'knowledge.brain_creation'
  | 'orientation.artifact_retrieval'
  | 'operations.poem_execution'
  | string; // escape hatch — classifier may produce values not yet in this union

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
  // Three-field subtype model:
  //   subtype_heuristic — written by the deterministic classifier (free, runs on every sync).
  //                       Approximate, sometimes wrong (e.g. over-applies build.campaign to
  //                       any /command). Always present after sync.
  //   session_tags      — written by the LLM enrichment skill (manual, considered).
  //                       Multiple tags with confidence scores, sorted descending.
  //                       Source of truth when present.
  //   session_subtype   — DERIVED. Equals session_tags[0].tag when session_tags is present,
  //                       otherwise equals subtype_heuristic. Written by both writers but
  //                       neither writer overrides an LLM-set value.
  subtype_heuristic?: SessionSubtype;
  session_tags?: SessionTag[];
  session_subtype?: SessionSubtype;
  // Enrichment pass metadata — set by the enrichment loop, never by the classifier
  enrichment_version?: number; // increments when the enrichment algorithm changes
  enriched_at?: string; // ISO timestamp of the last enrichment pass
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
  // Session origin classification
  // 'main'       = human-driven primary session
  // 'subagent'   = spawned by Agent Teams; first user message is a <teammate-message> wrapper
  // 'subprocess' = headless skill subprocess (e.g. omi-extract-haiku Haiku invocations).
  //                Identified by event_count <= 5 + first prompt matching template patterns
  //                ("-\nGenerate...", "-\nExtract...", "You are executing...").
  //                See docs/architecture/known-issues.md#subprocess-session-mechanism-3
  // Detected at SessionStart; backfilled by scripts/audits/backfill-session-kind.ts
  session_kind?: 'main' | 'subagent' | 'subprocess';
  teammate_id?: string | null; // observed values: 'team-lead'
}

export interface WorkspaceEntry {
  id: string;
  name: string;
  tags: string[];
  created_at: string;
}

export type Registry = Record<string, RegistryEntry>;

// ── Enrichment sidecar types ────────────────────────────────────────────────

export interface EnrichmentPass {
  version: number; // matches enrichment_version on RegistryEntry
  enriched_at: string; // ISO timestamp
  model: string; // e.g. 'claude-opus-4-7'
  changes: Partial<RegistryEntry>; // fields written to registry this pass
  notes?: string; // optional summary of what this pass concluded
}

export interface EnrichmentLogEntry extends EnrichmentPass {
  session_id: string; // foreign key into registry
}

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
  project_dir?: string;
  status: WorkflowStatus;
  current_station: number;
  created_at: string;
  updated_at: string;
  stations: StationInstance[];
  backtracks: BacktrackRecord[];
  metadata: Record<string, unknown>;
}

// ── Diagnostics ─────────────────────────────────────────────────────────────
// Surfaces registry data-quality and ingestion-health metrics for the
// Diagnostics view. Live counts come from the registry; subagent stats
// and orphan counts come from a precomputed audit snapshot when present.
export interface DiagnosticsResponse {
  generated_at: string;
  registry: {
    total: number;
    with_jsonl: number; // upstream JSONL still on disk
    archive_only: number; // no upstream JSONL but AngelEye archive present
    true_phantom: number; // no upstream JSONL and no archive (data lost)
    is_junk: number;
  };
  tags: {
    llm_enriched: number;
    heuristic_only: number;
    migrated: number;
    untagged: number;
    build_feature_queue: number;
  };
  subagents: {
    snapshot_present: boolean;
    snapshot_path?: string;
    teammate_message_files?: number; // raw JSONLs identified as Mechanism B
    in_registry_main?: number; // estimate: registry rows minus subagent count
    in_registry_subagent?: number;
    field_populated?: boolean; // whether session_kind has been backfilled
  };
  orphans: {
    snapshot_present: boolean;
    count?: number;
    top_dirs?: { dir: string; count: number }[];
  };
  open_issues: { id: string; title: string; doc_link: string }[];
}
