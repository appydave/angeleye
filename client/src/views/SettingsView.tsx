import { useState, useEffect } from 'react';
import type { SessionType } from '@appystack/shared';

type TypeCounts = Record<SessionType | 'unclassified', number>;
type FieldCounts = Record<string, number>;

interface FieldBreakdown {
  before: FieldCounts;
  after: FieldCounts;
}

interface NewByProject {
  project: string;
  count: number;
  type: SessionType | 'unclassified';
}

interface SyncResult {
  imported: number;
  classified: number;
  alreadyUpToDate: number;
  errors: number;
  before: TypeCounts;
  after: TypeCounts;
  totalBefore: number;
  totalAfter: number;
  newByProject: NewByProject[];
  fields?: Record<string, FieldBreakdown>;
}

interface LastSyncRecord {
  timestamp: string;
  imported: number;
  classified: number;
}

interface StatsResult {
  byType: Record<SessionType | 'unclassified', number>;
  total: number;
  fields?: Record<string, FieldCounts>;
}

const TYPE_ORDER: readonly (SessionType | 'unclassified')[] = [
  'BUILD',
  'ORIENTATION',
  'KNOWLEDGE',
  'RESEARCH',
  'OPS',
  'TEST',
  'unclassified',
] as const;

const TYPE_COLORS: Record<SessionType | 'unclassified', string> = {
  BUILD: '#c8841a',
  ORIENTATION: '#7a6e5e',
  KNOWLEDGE: '#0d9488',
  RESEARCH: '#3b82b6',
  OPS: '#ea580c',
  TEST: '#7c3aed',
  unclassified: '#d4cdc4',
};

// ── Accordion field config ────────────────────────────────────────────────

interface AccordionField {
  key: string;
  label: string;
}

interface AccordionSection {
  id: string;
  label: string;
  fields: AccordionField[];
}

const ACCORDION_SECTIONS: AccordionSection[] = [
  {
    id: 'subtypes',
    label: 'Subtypes',
    fields: [{ key: 'session_subtype', label: 'Session Subtype' }],
  },
  {
    id: 'interaction',
    label: 'Interaction Style',
    fields: [
      { key: 'delegation_style', label: 'Delegation' },
      { key: 'opening_style', label: 'Opening' },
      { key: 'closing_style', label: 'Closing' },
    ],
  },
  {
    id: 'metrics',
    label: 'Session Metrics',
    fields: [
      { key: 'session_liveness', label: 'Liveness' },
      { key: 'output_type', label: 'Output Type' },
      { key: 'initiation_source', label: 'Initiation' },
      { key: 'session_continuity', label: 'Continuity' },
    ],
  },
];

// ── Value descriptions (shown on hover) ──────────────────────────────────

const VALUE_DESCRIPTIONS: Record<string, string> = {
  // Session types
  BUILD: 'Sessions where you built, implemented, or modified code',
  ORIENTATION: 'Sessions spent reading, exploring, or understanding a codebase',
  KNOWLEDGE: 'Sessions creating or updating knowledge documents and brain files',
  RESEARCH: 'Sessions investigating external tools, libraries, or concepts',
  OPS: 'Sessions running operational tasks — deployments, pipelines, system maintenance',
  TEST: 'Sessions writing, debugging, or running tests',
  unclassified: "Sessions where classification rules didn't fire — usually very short or unusual",

  // Session subtypes — flat taxonomy
  bug_fix_round: 'Tracking down and fixing a specific bug',
  feature_implementation: 'Building a new feature end-to-end with code changes',
  refactoring: 'Restructuring existing code without changing behaviour',
  test_writing: 'Writing or updating test files',
  ci_pipeline: 'Setting up or fixing CI/CD pipelines and deployment scripts',
  codebase_exploration: 'Reading through a codebase to understand its structure and patterns',
  file_retrieval: 'Fetching a specific file or piece of information',
  artifact_lookup: 'Finding a specific artifact — config, credential, or generated output',
  brain_maintenance: 'Updating or reorganising knowledge brain files',
  advisory_refinement: 'Refining prompts, instructions, or AI guidance documents',
  brain_capture: 'Capturing new knowledge into brain files for the first time',
  technology_survey: 'Researching a technology, library, or tool from external sources',
  hardware_setup_troubleshooting: 'Setting up or fixing hardware or environment issues',
  release_exploration: 'Investigating release notes, changelogs, or version differences',
  poem_execution: 'Running a POEM OS workflow or prompt orchestration sequence',
  directory_cleanup: 'Organising, archiving, or removing files and directories',
  paperclip_agent: 'Autonomous agent running a long background task',
  daily_planning: 'Planning session — reviewing priorities and setting direction for the day',
  interactive_design: 'Designing or iterating on UI, architecture, or system design interactively',
  sprint_planning: 'Planning a sprint, campaign, or batch of work items',
  mcp_integration: 'Setting up or configuring an MCP server integration',
  environment_setup: 'Setting up a development environment, dependencies, or tooling',
  dependency_management: 'Updating, auditing, or resolving package dependencies',
  playwright_e2e: 'Running or writing Playwright end-to-end browser tests',
  test_debugging: 'Debugging failing tests to find root cause',
  session_about_sessions: 'A meta-session where AngelEye or session classification is the topic',
  unknown: 'Not yet determined — will be classified in a future enrichment pass',

  // LLM-enrichment taxonomy (dot-notation, March 2026 campaign)
  'build.feature': 'Standard feature implementation — new capability added to an existing codebase',
  'build.campaign':
    'Coordinated multi-agent build — coordinator session launching parallel workers',
  'build.orchestrated_campaign':
    'Multi-session orchestrated effort using agent chains and subagents',
  'build.iterative_design':
    'Back-and-forth design iteration — trying, evaluating, adjusting in a loop',
  'build.multi_phase': 'Session spanning multiple distinct implementation phases',
  'research.exploration': 'Open-ended research into an unfamiliar topic or technology',
  'research.quick_answer': 'Targeted lookup — a specific question with a specific answer needed',
  'research.codebase_exploration': 'Deep read of an external codebase to understand its patterns',
  'knowledge.general': 'General knowledge capture — observations, patterns, lessons learned',
  'knowledge.research': 'Research findings captured into knowledge documents',
  'knowledge.brain_creation': 'Creating a new brain file or knowledge domain from scratch',
  'knowledge.brain_update': 'Updating an existing brain file with new findings',
  'knowledge.methodology_design': 'Designing or refining a methodology, framework, or process',
  'operations.maintenance': 'Routine maintenance — cleanup, updates, housekeeping',
  'operations.system_task': 'Running a specific system-level task or script',
  'operations.poem_execution': 'Executing a POEM OS prompt sequence',
  'orientation.artifact_retrieval': 'Retrieving a specific artifact, config, or credential',
  'orientation.codebase_exploration': 'Exploring a codebase to orient within it',
  'orientation.quick_check': 'Fast check of a value, status, or fact — in and out',
  'orientation.exploration': 'Open-ended exploration of an area without a specific goal',
  'orientation.abandoned': 'Session that started orientation but was immediately abandoned',
  'planning.general': 'General planning session — reviewing state, setting direction',
  'sysops.system_configuration': 'Configuring system settings, shell, or OS-level tools',
  'sysops.infrastructure': 'Infrastructure work — networking, servers, deployment config',
  'skill.development': 'Building or refining a Claude Code skill',
  'skill.creation': 'Creating a new skill from scratch',
  'mixed.multi_activity': 'Session that clearly spanned multiple unrelated activities',
  'meta.accidental':
    "Session that wasn't real work — accidental window open, brief wrong-project visit",
  'meta.ghost_session': 'Session file exists but has no meaningful content or activity',
  'test.execution': 'Running existing tests to check for regressions (not writing new tests)',

  // Delegation styles
  orchestrated: 'Claude coordinating multiple parallel subagents or tasks',
  directive: 'User giving specific step-by-step instructions, Claude executing',
  autonomous: 'Claude working independently with minimal user direction',
  conversational: 'Back-and-forth dialogue — user and Claude refining together',

  // Opening styles
  skill_invocation: 'Session started by invoking a slash command (e.g. /plan, /ralphy)',
  agent_initiated: 'Session started by an automated agent or hook, not a human typing',
  typed_question: 'Session opened with a natural language question',
  paste_handover: 'Session opened by pasting a large block of context or prior conversation',
  typed_instruction: 'Session opened with a direct instruction or command',
  context_dump: 'Session opened with a large context block — docs, specs, or data',
  voice_dictation: 'Session opened with voice-to-text input (OMI wearable or similar)',
  code_paste: 'Session opened by pasting code for review or modification',
  continuation: 'Session explicitly resumed from a prior session with handover context',
  greeting: 'Session opened with a greeting or pleasantry before the real work',

  // Closing styles
  abrupt_abandon:
    'Session ended without a formal close — window closed or task just stopped. The most common pattern; not a problem.',
  summary_close: 'Claude provided a summary or handover note before the session ended',
  natural_completion: 'Task completed cleanly — the work was done and the session ended',
  question_answer: 'Session ended after a question was answered with no follow-up',
  commit_push: 'Session ended after a git commit and push to remote',
  task_handoff: 'Session ended with an explicit handoff note prepared for the next session',
  commit_only: 'Session ended after committing locally but without pushing',
  error_bail: 'Session ended due to an error or blocker — work was abandoned mid-task',

  // Liveness
  low: 'Minimal activity — few tool calls, short session; possibly orientation or accidental',
  medium: 'Moderate activity — a mix of reading and writing tool calls',
  high: 'High activity — many tool calls, substantial work performed',

  // Output types
  code: 'Primary output was code changes to the codebase',
  knowledge: 'Primary output was knowledge documents or brain files',
  research: 'Primary output was research findings or analysis',
  operations: 'Primary output was operational changes — config, scripts, infrastructure',
  test: 'Primary output was test files',
  planning: 'Primary output was plans, tickets, or task lists',
  mixed: 'Session produced multiple distinct output types',

  // Initiation source
  human: 'Session started by a human typing in Claude Code',
  agent: 'Session started by an automated agent or tool',
  hook: 'Session started by a Claude Code hook event',

  // Session continuity
  fresh: 'New session with no connection to prior sessions',
  resumed: 'Explicitly resumed from a prior session using /rename or --resume',
};

function getDescription(value: string): string | undefined {
  return VALUE_DESCRIPTIONS[value];
}

// ── Tooltip ───────────────────────────────────────────────────────────────

function Tooltip({
  content,
  children,
}: {
  content: string | undefined;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  if (!content) return <>{children}</>;
  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span className="absolute top-full left-0 mt-1 z-50 w-[260px] bg-card border border-border rounded shadow-lg px-2.5 py-1.5 text-[11px] text-foreground leading-relaxed pointer-events-none whitespace-normal">
          {content}
        </span>
      )}
    </span>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function relativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ');
}

function totalDelta(before: FieldCounts, after: FieldCounts): number {
  let gains = 0;
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const k of allKeys) {
    const diff = (after[k] ?? 0) - (before[k] ?? 0);
    if (diff > 0) gains += diff;
  }
  return gains;
}

// ── Type delta table ──────────────────────────────────────────────────────

function TypeDeltaTable({ before, after }: { before: TypeCounts; after: TypeCounts }) {
  return (
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 py-1.5 px-2">
            Type
          </th>
          <th className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 py-1.5 px-2">
            Before
          </th>
          <th className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 py-1.5 px-2">
            After
          </th>
          <th className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 py-1.5 px-2">
            Delta
          </th>
        </tr>
      </thead>
      <tbody>
        {TYPE_ORDER.map((type) => {
          const b = before[type] ?? 0;
          const a = after[type] ?? 0;
          const delta = a - b;
          return (
            <tr key={type} className="border-b border-border/50 last:border-b-0">
              <td className="py-1 px-2 font-medium" style={{ color: TYPE_COLORS[type] }}>
                <Tooltip content={getDescription(type)}>
                  <span
                    className={
                      getDescription(type)
                        ? 'border-b border-dotted border-current/40 cursor-help'
                        : ''
                    }
                  >
                    {type === 'unclassified' ? 'unclassified' : type}
                  </span>
                </Tooltip>
              </td>
              <td className="py-1 px-2 text-right font-mono tabular-nums">{b}</td>
              <td className="py-1 px-2 text-right font-mono tabular-nums">{a}</td>
              <td
                className={`py-1 px-2 text-right font-mono tabular-nums font-semibold ${
                  delta > 0
                    ? 'text-[#5a9a3c]'
                    : delta < 0
                      ? 'text-destructive'
                      : 'text-muted-foreground/60'
                }`}
              >
                {delta > 0 ? `+${delta}` : delta === 0 ? '—' : `${delta}`}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Field delta table ─────────────────────────────────────────────────────

function FieldDeltaTable({ before, after }: { before: FieldCounts; after: FieldCounts }) {
  const allKeys = [...new Set([...Object.keys(after), ...Object.keys(before)])].sort(
    (a, b) => (after[b] ?? 0) - (after[a] ?? 0)
  );

  return (
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 py-1 px-2">
            Value
          </th>
          <th className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 py-1 px-2">
            Before
          </th>
          <th className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 py-1 px-2">
            After
          </th>
          <th className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 py-1 px-2">
            Delta
          </th>
        </tr>
      </thead>
      <tbody>
        {allKeys.map((key) => {
          const b = before[key] ?? 0;
          const a = after[key] ?? 0;
          const delta = a - b;
          return (
            <tr key={key} className="border-b border-border/50 last:border-b-0">
              <td className="py-1 px-2 font-medium text-foreground">
                <Tooltip content={getDescription(key)}>
                  <span
                    className={
                      getDescription(key)
                        ? 'border-b border-dotted border-muted-foreground/40 cursor-help'
                        : ''
                    }
                  >
                    {formatLabel(key)}
                  </span>
                </Tooltip>
              </td>
              <td className="py-1 px-2 text-right font-mono tabular-nums">{b}</td>
              <td className="py-1 px-2 text-right font-mono tabular-nums">{a}</td>
              <td
                className={`py-1 px-2 text-right font-mono tabular-nums font-semibold ${
                  delta > 0
                    ? 'text-[#5a9a3c]'
                    : delta < 0
                      ? 'text-destructive'
                      : 'text-muted-foreground/60'
                }`}
              >
                {delta > 0 ? `+${delta}` : delta === 0 ? '—' : `${delta}`}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Field stats table (idle — no delta columns) ───────────────────────────

function FieldStatsTable({ counts }: { counts: FieldCounts }) {
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 py-1 px-2">
            Value
          </th>
          <th className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 py-1 px-2">
            Count
          </th>
        </tr>
      </thead>
      <tbody>
        {sorted.map(([key, count]) => (
          <tr key={key} className="border-b border-border/50 last:border-b-0">
            <td className="py-1 px-2 font-medium text-foreground">
              <Tooltip content={getDescription(key)}>
                <span
                  className={
                    getDescription(key)
                      ? 'border-b border-dotted border-muted-foreground/40 cursor-help'
                      : ''
                  }
                >
                  {formatLabel(key)}
                </span>
              </Tooltip>
            </td>
            <td className="py-1 px-2 text-right font-mono tabular-nums">{count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function SettingsView() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<LastSyncRecord | null | undefined>(undefined);
  const [stats, setStats] = useState<StatsResult | null>(null);
  const [showReclassify, setShowReclassify] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/sync/status')
      .then((r) => r.json())
      .then((d) => setLastSync((d.data?.lastSync as LastSyncRecord | null) ?? null))
      .catch(() => setLastSync(null));
  }, []);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => setStats(d.data as StatsResult))
      .catch(() => {
        /* non-fatal */
      });
  }, []);

  function refreshStats() {
    void fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => setStats(d.data as StatsResult))
      .catch(() => {
        /* non-fatal */
      });
  }

  function runSync(force: boolean) {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    setShowReclassify(false);
    const url = force ? '/api/sync?force=true' : '/api/sync';
    fetch(url, { method: 'POST' })
      .then((r) => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      })
      .then((d) => {
        const result = d.data as SyncResult;
        setSyncResult(result);
        setLastSync({
          timestamp: new Date().toISOString(),
          imported: result.imported,
          classified: result.classified,
        });
        refreshStats();
      })
      .catch(() => {
        setSyncError('Sync request failed.');
      })
      .finally(() => {
        setSyncing(false);
      });
  }

  function toggleSection(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const hasResults = syncResult !== null;

  return (
    <div className="p-6 flex flex-col gap-4 h-full min-h-0 overflow-y-auto">
      <div className="flex items-center justify-between px-0 py-2 border-b border-border">
        <h1 className="font-bebas text-3xl tracking-wider text-foreground">Settings</h1>
      </div>

      <div className="bg-card border border-border rounded-md shadow-sm p-5 max-w-[640px]">
        {/* Card header */}
        <h2 className="font-bebas text-lg tracking-wider text-primary mb-1">Session Sync</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Scan and classify all Claude Code sessions. Safe to run multiple times.
        </p>

        {/* Stats strip */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-4 px-3 py-2 bg-surface-mid rounded">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${lastSync ? 'bg-[#5a9a3c]' : 'bg-muted-foreground/40'}`}
          />
          {lastSync === undefined && <span>Loading…</span>}
          {lastSync === null && <span>Never synced</span>}
          {lastSync && <span>Last sync: {relativeTime(lastSync.timestamp)}</span>}
          {stats && (
            <>
              <span className="w-px h-3.5 bg-border" />
              <span>
                <span className="font-mono font-semibold text-foreground">{stats.total}</span>{' '}
                sessions
              </span>
              <span className="w-px h-3.5 bg-border" />
              <span>
                <span className="font-mono font-semibold text-foreground">
                  {stats.total - (stats.byType['unclassified'] ?? 0)}
                </span>{' '}
                classified
              </span>
            </>
          )}
        </div>

        {/* Action row */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => runSync(false)}
            disabled={syncing}
            className="px-5 py-1.5 text-sm font-semibold text-white bg-primary rounded hover:bg-primary/85 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {syncing ? 'Syncing…' : 'Sync Sessions'}
          </button>
          <button
            onClick={() => setShowReclassify(!showReclassify)}
            disabled={syncing}
            className="text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-primary bg-transparent border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Re-classify all sessions
          </button>
        </div>

        {/* Reclassify expansion */}
        {showReclassify && (
          <div className="bg-[#fef9f0] border border-[#e8dcc8] rounded px-3.5 py-3 mb-4 text-xs">
            <p className="text-muted-foreground mb-2">
              This re-runs all classification rules on every session. Use after updating classifier
              logic. Totals won&apos;t change but sessions may move between categories.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => runSync(true)}
                className="px-3.5 py-1 text-[11px] font-semibold text-white bg-destructive rounded hover:bg-destructive/85 cursor-pointer border-none"
              >
                Re-classify All
              </button>
              <button
                onClick={() => setShowReclassify(false)}
                className="px-3.5 py-1 text-[11px] text-muted-foreground border border-border rounded cursor-pointer bg-transparent hover:bg-surface-mid"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {syncError && <p className="text-sm text-destructive mb-4">{syncError}</p>}

        {/* Results summary line */}
        {hasResults && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <span className="font-mono font-semibold text-foreground">{syncResult.classified}</span>
            <span>classified</span>
            {syncResult.imported > 0 && (
              <span className="text-[10px] font-bold bg-[#e8f5e0] text-[#5a9a3c] px-1.5 py-0.5 rounded">
                +{syncResult.imported} new
              </span>
            )}
            {syncResult.errors > 0 && (
              <span className="text-[10px] font-bold bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                {syncResult.errors} error{syncResult.errors !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Accordion: Session Types (always visible) */}
        <div className="border border-border rounded overflow-hidden">
          {/* Session Types — always open */}
          <div className="border-b border-border">
            <div className="px-3.5 py-2.5 text-xs font-semibold text-foreground tracking-wide bg-card flex items-center gap-2">
              <span>Session Types</span>
              {stats && (
                <span className="font-mono text-[10px] font-normal text-muted-foreground bg-surface-mid px-1.5 py-0.5 rounded">
                  {stats.total}
                </span>
              )}
            </div>
            <div className="px-3.5 pb-3 bg-card">
              {hasResults ? (
                <TypeDeltaTable before={syncResult.before} after={syncResult.after} />
              ) : stats ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {(['BUILD', 'RESEARCH', 'KNOWLEDGE', 'TEST', 'OPS', 'ORIENTATION'] as const).map(
                    (type) => (
                      <span key={type} className="text-xs font-mono">
                        <span style={{ color: TYPE_COLORS[type] }}>{type}</span>
                        <span className="text-muted-foreground ml-1">
                          {stats.byType[type] ?? 0}
                        </span>
                      </span>
                    )
                  )}
                  {(stats.byType['unclassified'] ?? 0) > 0 && (
                    <span className="text-xs font-mono">
                      <span className="text-muted-foreground/60">unclassified</span>
                      <span className="text-muted-foreground ml-1">
                        {stats.byType['unclassified']}
                      </span>
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* Collapsible Phase 2c sections */}
          {ACCORDION_SECTIONS.map((section) => {
            const isOpen = openSections.has(section.id);

            // Compute section-level delta badge
            let sectionDelta = 0;
            if (hasResults && syncResult.fields) {
              for (const f of section.fields) {
                const fb = syncResult.fields[f.key];
                if (fb) sectionDelta += totalDelta(fb.before, fb.after);
              }
            }

            return (
              <div key={section.id} className="border-b border-border last:border-b-0">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-foreground tracking-wide bg-card hover:bg-surface-mid transition-colors cursor-pointer border-none text-left"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="text-muted-foreground text-[10px] inline-block transition-transform"
                      style={{ transform: isOpen ? 'rotate(90deg)' : 'none' }}
                    >
                      ›
                    </span>
                    <span>{section.label}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    {hasResults && sectionDelta > 0 && (
                      <span className="font-mono text-[10px] font-semibold bg-[#e8f0fa] text-[#3a7ab8] px-1.5 py-0.5 rounded">
                        +{sectionDelta}
                      </span>
                    )}
                    {hasResults && sectionDelta === 0 && (
                      <span className="font-mono text-[10px] bg-surface-mid text-muted-foreground/60 px-1.5 py-0.5 rounded">
                        no change
                      </span>
                    )}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-3.5 pb-3 bg-card">
                    {section.fields.map((field) => {
                      const fieldData = hasResults ? syncResult.fields?.[field.key] : undefined;
                      const statsCounts = stats?.fields?.[field.key];

                      return (
                        <div key={field.key} className="mb-3 last:mb-0">
                          {section.fields.length > 1 && (
                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">
                              {field.label}
                            </div>
                          )}
                          {fieldData ? (
                            <FieldDeltaTable before={fieldData.before} after={fieldData.after} />
                          ) : statsCounts ? (
                            <FieldStatsTable counts={statsCounts} />
                          ) : (
                            <p className="text-[11px] text-muted-foreground/50">
                              Run sync to see data
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* New sessions by project */}
        {hasResults && syncResult.newByProject.length > 0 && (
          <div className="mt-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
              {syncResult.imported} New Sessions
            </div>
            <div className="space-y-0.5">
              {syncResult.newByProject.map((p) => (
                <div key={p.project} className="flex items-center gap-2 text-xs py-0.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: TYPE_COLORS[p.type] ?? '#d4cdc4' }}
                  />
                  <span className="font-semibold text-primary tabular-nums w-5 text-right">
                    {p.count}
                  </span>
                  <span className="text-foreground font-medium flex-1">{p.project}</span>
                  <span className="text-[10px] font-semibold text-muted-foreground bg-surface-mid px-1.5 py-0.5 rounded-sm">
                    {p.type === 'ORIENTATION' ? 'ORIENT.' : p.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
