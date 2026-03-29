import { useState, useEffect } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface HeroStat {
  value: string;
  label: string;
}

interface MockSessionType {
  type: string;
  count: number;
  sharePercent?: number;
  badgeClass?: string;
}

interface SubtypeItem {
  name: string;
  count: number;
}

interface ProjectItem {
  name: string;
  count: number;
}

interface ToolItem {
  rank: number;
  name: string;
  sessions: number;
  prevalencePercent: number;
}

interface ClassifierItem {
  value: string;
  count: number;
  percent?: number | null;
}

interface ClassifierTopN {
  _note?: string;
  totalUniqueValues: number;
  items: ClassifierItem[];
}

interface PredicateItem {
  name: string;
  trueCount: number;
  evaluatedCount: number;
  percent: number;
}

interface BuildAccuracyItem {
  scale: string;
  accuracy: string;
  evidence: string;
}

interface MachineInfo {
  name: string;
  role: string;
  sessions: number;
  waves: string;
  characteristics: string[];
}

interface DerivedBucket {
  bucket: string;
  range: string | null;
  sessions: number;
  meaning: string;
}

interface DerivedMetric {
  formula: string;
  buckets: DerivedBucket[];
}

interface SkillItem {
  name: string;
  count: number;
}

interface SchemaField {
  field: string;
  type: string;
  description?: string;
  stats?: string;
}

interface MockData {
  _meta?: Record<string, unknown>;
  heroStats: HeroStat[];
  schema: {
    topLevel: SchemaField[];
    shape: SchemaField[];
    predicates: SchemaField[];
    classifiers: SchemaField[];
    observations?: SchemaField[];
    derived?: unknown[];
  };
  sessionTypes: MockSessionType[];
  subtypes: { _note?: string; items: SubtypeItem[]; totalUniqueSubtypes: number };
  projects: { _note?: string; items: ProjectItem[]; additionalSingleSessionProjects: number };
  tools: ToolItem[];
  classifiers: {
    delegationStyle: ClassifierItem[];
    sessionContinuity: ClassifierItem[];
    outputType: ClassifierItem[];
    initiationSource: ClassifierItem[];
    openingStyle: ClassifierTopN;
    closingStyle: ClassifierTopN;
    toolProfile: ClassifierTopN;
  };
  predicates: PredicateItem[];
  buildAccuracy: BuildAccuracyItem[];
  buildAccuracyRules: string[];
  machines: {
    m4Mini: MachineInfo;
    m4Pro: MachineInfo;
    overlap: string;
  };
  derivedMetrics: {
    autonomyRatio: DerivedMetric;
    sessionLiveness: DerivedMetric;
  };
  skills: { _note?: string; items: SkillItem[] };
}

interface StatsData {
  total: number;
  byType: Record<string, number>;
  fields?: Record<string, Record<string, number>>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SessionRecord = Record<string, any>;

// ─── Helpers ────────────────────────────────────────────────────────────────

function aggregateField(sessions: SessionRecord[], field: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of sessions) {
    const val = s[field];
    if (val != null && val !== '') {
      counts[val] = (counts[val] ?? 0) + 1;
    }
  }
  return counts;
}

function aggregateBooleans(
  sessions: SessionRecord[],
  fields: string[]
): Record<string, { trueCount: number; total: number }> {
  const result: Record<string, { trueCount: number; total: number }> = {};
  for (const f of fields) {
    let trueCount = 0;
    let evaluated = 0;
    for (const s of sessions) {
      if (s[f] !== undefined && s[f] !== null) {
        evaluated++;
        if (s[f] === true) trueCount++;
      }
    }
    result[f] = { trueCount, total: evaluated };
  }
  return result;
}

function sorted(obj: Record<string, number>): [string, number][] {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]);
}

// ─── Sub-components ─────────────────────────────────────────────────────────

type BadgeType = 'LIVE' | 'PARTIAL' | 'MOCK';

function SourceBadge({ type }: { type: BadgeType }) {
  const styles: Record<BadgeType, { bg: string; text: string; dot: string }> = {
    LIVE: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
    PARTIAL: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
    MOCK: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  };
  const s = styles[type];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${s.bg} ${s.text}`}
    >
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {type}
    </span>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-full bg-zinc-200 rounded-full h-2.5">
      <div
        className="h-2.5 rounded-full"
        style={{ width: `${pct}%`, backgroundColor: color ?? '#c8841a' }}
      />
    </div>
  );
}

function SectionWrapper({
  title,
  num,
  badge,
  variant,
  children,
}: {
  title: string;
  num: number;
  badge: BadgeType;
  variant: 'live' | 'partial' | 'mock';
  children: React.ReactNode;
}) {
  const borderStyles: Record<string, string> = {
    live: 'border-l-4 border-l-primary',
    partial: 'border-l-4 border-l-amber-500',
    mock: 'border-l-4 border-l-border border-dashed opacity-65',
  };
  return (
    <section className="mb-8">
      <h2 className="font-bebas text-xl tracking-wider text-heading uppercase flex items-center gap-2 pb-2 mb-3">
        {num}. {title} <SourceBadge type={badge} />
      </h2>
      <div className={`bg-card border border-border rounded-lg p-4 ${borderStyles[variant]}`}>
        {children}
      </div>
    </section>
  );
}

function deltaStr(live: number, mock: number): React.ReactNode {
  const diff = live - mock;
  if (diff === 0) return <span className="text-body">=</span>;
  if (diff > 0) return <span className="text-green-700 font-semibold">+{diff}</span>;
  return <span className="text-red-700 font-semibold">{diff}</span>;
}

const BADGE_COLORS: Record<string, string> = {
  BUILD: 'bg-blue-100 text-blue-800',
  KNOWLEDGE: 'bg-violet-100 text-violet-800',
  RESEARCH: 'bg-green-100 text-green-800',
  ORIENTATION: 'bg-amber-100 text-amber-800',
  OPERATIONS: 'bg-orange-100 text-orange-800',
  OPS: 'bg-orange-100 text-orange-800',
  META: 'bg-gray-200 text-gray-600',
  SYSOPS: 'bg-teal-100 text-teal-800',
  PLANNING: 'bg-pink-100 text-pink-800',
  MIXED: 'bg-yellow-100 text-yellow-800',
  SKILL: 'bg-emerald-100 text-emerald-800',
  SETUP: 'bg-amber-100 text-amber-900',
  TEST: 'bg-indigo-100 text-indigo-800',
  REVIEW: 'bg-rose-100 text-rose-800',
  DEBUG: 'bg-red-100 text-red-800',
  BRAND: 'bg-stone-100 text-stone-800 border border-stone-300',
  UNCLASSIFIED: 'bg-gray-200 text-gray-500',
  unclassified: 'bg-gray-200 text-gray-500',
};

function TypeBadge({ type }: { type: string }) {
  const cls = BADGE_COLORS[type] ?? BADGE_COLORS['UNCLASSIFIED'];
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase ${cls}`}>
      {type}
    </span>
  );
}

// ─── Classifier bar group ───────────────────────────────────────────────────

function ClassifierGroup({
  title,
  items,
  color,
  note,
}: {
  title: string;
  items: ClassifierItem[];
  color: string;
  note?: string;
}) {
  const maxCount = items.length > 0 ? Math.max(...items.map((i) => i.count)) : 1;
  return (
    <div className="mb-5">
      <h4 className="text-xs uppercase tracking-wide text-heading font-semibold mb-2">
        {title}
        {note && (
          <span className="text-[0.72rem] text-body font-normal normal-case ml-2">{note}</span>
        )}
      </h4>
      {items.map((item) => {
        const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
        return (
          <div key={item.value} className="flex items-center mb-1 text-sm">
            <span className="w-44 shrink-0 text-heading">{item.value}</span>
            <div className="flex-1 min-w-[80px] h-3.5 bg-zinc-200 rounded mx-2 overflow-hidden">
              <div
                className="h-full rounded"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
            <span className="w-24 text-right text-xs text-body tabular-nums">
              {item.count}
              {item.percent != null ? ` (${item.percent}%)` : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Live classifier group from stats.fields ────────────────────────────────

function LiveClassifierGroup({
  title,
  data,
  color,
}: {
  title: string;
  data: Record<string, number>;
  color: string;
}) {
  const items = sorted(data).map(([value, count]) => ({ value, count, percent: null }));
  return <ClassifierGroup title={title} items={items} color={color} note="(from live stats)" />;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function CampaignInfographicView() {
  const [mockData, setMockData] = useState<MockData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [statsRes, sessionsRes, mockRes] = await Promise.all([
          fetch('/api/stats').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/sessions?limit=2000').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/mock-views/campaign-infographic').then((r) => (r.ok ? r.json() : null)),
        ]);

        if (cancelled) return;

        const mock = mockRes?.status === 'ok' ? mockRes.data : mockRes;
        if (!mock?.heroStats) {
          setError('Failed to load campaign infographic data');
          setLoading(false);
          return;
        }
        setMockData(mock as MockData);

        if (statsRes?.status === 'ok') setStats(statsRes.data as StatsData);

        const rawSessions =
          sessionsRes?.status === 'ok' ? (sessionsRes.data?.sessions ?? sessionsRes.data) : null;
        if (Array.isArray(rawSessions) && rawSessions.length > 0) {
          setSessions(rawSessions as SessionRecord[]);
        }
      } catch {
        if (!cancelled) setError('Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="h-full min-h-0 overflow-y-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface rounded w-1/3" />
          <div className="h-4 bg-surface rounded w-2/3" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !mockData) {
    return (
      <div className="h-full min-h-0 overflow-y-auto p-6">
        <p className="text-red-600">{error ?? 'No data available'}</p>
      </div>
    );
  }

  const hasLiveStats = stats !== null;
  const hasLiveSessions = sessions !== null && sessions.length > 0;

  // Pre-compute live aggregations
  const liveProjectMap = hasLiveSessions ? aggregateField(sessions!, 'project') : {};
  const liveToolPatterns = hasLiveSessions ? aggregateField(sessions!, 'tool_pattern') : {};
  const liveTriggers = hasLiveSessions ? aggregateField(sessions!, 'trigger_command') : {};

  const livePredicateNames = [
    'has_playwright_calls',
    'is_compaction_resume',
    'is_machine_initiated',
    'has_web_research',
    'has_parallel_subagent_bursts',
    'has_task_orchestration',
    'has_git_outcome',
    'has_brain_file_writes',
    'has_cross_session_refs',
    'has_unauthorized_edits',
    'has_handover_context',
    'has_cross_project_reads',
    'has_closing_ceremony',
    'has_voice_dictation_artifacts',
    'is_cwd_incidental',
  ];

  const liveBooleans = hasLiveSessions ? aggregateBooleans(sessions!, livePredicateNames) : {};

  // Live classifier fields from stats.fields
  const liveFields = stats?.fields ?? {};
  const liveClassifierKeys = [
    'delegation_style',
    'initiation_source',
    'session_continuity',
    'output_type',
    'session_liveness',
  ];
  const hasLiveClassifiers = liveClassifierKeys.some(
    (k) => liveFields[k] && Object.keys(liveFields[k]).length > 0
  );

  // ─── Gap analysis computation ──────────────────────────────────────────────

  const gapRows: {
    dimension: string;
    analysis: string;
    live: string;
    status: 'LIVE' | 'PARTIAL' | 'MOCK';
    notes: string;
  }[] = [
    {
      dimension: 'Total Sessions',
      analysis: '924 (2 machines, 15+1 waves)',
      live: hasLiveStats ? `${stats!.total} (this machine)` : '\u2014',
      status: hasLiveStats ? 'LIVE' : 'MOCK',
      notes: 'Live is single-machine; analysis was cross-machine',
    },
    {
      dimension: 'Session Types (6 core)',
      analysis: '16 types classified',
      live: hasLiveStats ? `${Object.keys(stats!.byType).length} types in registry` : '\u2014',
      status: hasLiveStats ? 'LIVE' : 'MOCK',
      notes: 'Live uses OPS, analysis uses OPERATIONS',
    },
    {
      dimension: 'Session Subtypes',
      analysis: '478 unique subtypes',
      live: '\u2014',
      status: 'MOCK',
      notes: 'LLM-computed during analysis. Not derived live.',
    },
    {
      dimension: 'Projects',
      analysis: `${mockData.projects.items.length} projects + ${mockData.projects.additionalSingleSessionProjects} singletons`,
      live: hasLiveSessions
        ? `${Object.keys(liveProjectMap).length} projects from registry`
        : '\u2014',
      status: hasLiveSessions ? 'LIVE' : 'MOCK',
      notes: 'project field in RegistryEntry',
    },
    {
      dimension: 'Tool Pattern',
      analysis: 'Not a separate metric in analysis',
      live: hasLiveSessions ? `${Object.keys(liveToolPatterns).length} patterns` : '\u2014',
      status: hasLiveSessions ? 'LIVE' : 'MOCK',
      notes: 'Classifier from hook enrichment',
    },
    {
      dimension: 'Individual Tool Usage (45 tools)',
      analysis: 'Per-session tool prevalence',
      live: '\u2014',
      status: 'MOCK',
      notes: 'Requires JSONL parsing, not in registry',
    },
    {
      dimension: 'C08 Delegation Style',
      analysis: `${mockData.classifiers.delegationStyle.length} values`,
      live: liveFields.delegation_style
        ? `${Object.keys(liveFields.delegation_style).length} values`
        : '\u2014',
      status: liveFields.delegation_style ? 'LIVE' : 'MOCK',
      notes: 'Phase 2c classifier',
    },
    {
      dimension: 'C09 Session Continuity',
      analysis: `${mockData.classifiers.sessionContinuity.length} values`,
      live: liveFields.session_continuity
        ? `${Object.keys(liveFields.session_continuity).length} values`
        : '\u2014',
      status: liveFields.session_continuity ? 'LIVE' : 'MOCK',
      notes: 'Phase 2c classifier',
    },
    {
      dimension: 'C10 Output Type',
      analysis: `${mockData.classifiers.outputType.length} values`,
      live: liveFields.output_type
        ? `${Object.keys(liveFields.output_type).length} values`
        : '\u2014',
      status: liveFields.output_type ? 'LIVE' : 'MOCK',
      notes: 'Phase 2c classifier',
    },
    {
      dimension: 'C11 Initiation Source',
      analysis: `${mockData.classifiers.initiationSource.length} values`,
      live: liveFields.initiation_source
        ? `${Object.keys(liveFields.initiation_source).length} values`
        : '\u2014',
      status: liveFields.initiation_source ? 'LIVE' : 'MOCK',
      notes: 'Phase 2c classifier',
    },
    {
      dimension: 'Opening / Closing / Tool Profile',
      analysis: `${mockData.classifiers.openingStyle.totalUniqueValues} / ${mockData.classifiers.closingStyle.totalUniqueValues} / ${mockData.classifiers.toolProfile.totalUniqueValues} unique`,
      live: '\u2014',
      status: 'MOCK',
      notes: 'LLM-classified, not in live registry',
    },
    {
      dimension: 'Predicates (live-capable)',
      analysis: `${livePredicateNames.length} predicates`,
      live: hasLiveSessions ? 'Fields exist in registry' : '\u2014',
      status: hasLiveSessions ? 'LIVE' : 'MOCK',
      notes: 'has_playwright_calls, is_compaction_resume, etc.',
    },
    {
      dimension: 'Predicates (analysis-only)',
      analysis: 'frustration, wrong approach, buggy output, etc.',
      live: '\u2014',
      status: 'MOCK',
      notes: 'LLM-evaluated during analysis campaign',
    },
    {
      dimension: 'BUILD Accuracy by Scale',
      analysis: `${mockData.buildAccuracy.length} scale levels`,
      live: '\u2014',
      status: 'MOCK',
      notes: 'Requires type vs scale cross-reference',
    },
    {
      dimension: 'Machine Comparison',
      analysis: `${mockData.machines.m4Mini.name} (${mockData.machines.m4Mini.sessions}) vs ${mockData.machines.m4Pro.name} (${mockData.machines.m4Pro.sessions})`,
      live: '\u2014',
      status: 'MOCK',
      notes: 'Single-machine registry; analysis had 2 machines',
    },
    {
      dimension: 'Autonomy Ratio',
      analysis: `${mockData.derivedMetrics.autonomyRatio.buckets.length} buckets`,
      live: '\u2014',
      status: 'MOCK',
      notes: 'Derived from tool_use_count / user_prompt_count',
    },
    {
      dimension: 'Session Liveness',
      analysis: `${mockData.derivedMetrics.sessionLiveness.buckets.length} buckets`,
      live: liveFields.session_liveness
        ? `${Object.keys(liveFields.session_liveness).length} values`
        : '\u2014',
      status: liveFields.session_liveness ? 'PARTIAL' : 'MOCK',
      notes: 'Live has enum; mock has ratio-based buckets',
    },
    {
      dimension: 'Skills / Trigger Commands',
      analysis: `${mockData.skills.items.length} skills`,
      live: hasLiveSessions ? `${Object.keys(liveTriggers).length} trigger commands` : '\u2014',
      status: hasLiveSessions ? 'PARTIAL' : 'MOCK',
      notes: 'trigger_command exists but differs from skill taxonomy',
    },
  ];

  // Coverage summary
  const liveCount = gapRows.filter((r) => r.status === 'LIVE').length;
  const partialCount = gapRows.filter((r) => r.status === 'PARTIAL').length;
  const totalGap = gapRows.length;
  const coveragePct = Math.round(((liveCount + partialCount * 0.5) / totalGap) * 100);

  // ─── Build session types union ──────────────────────────────────────────────

  const allTypes = new Set<string>();
  mockData.sessionTypes.forEach((t) => allTypes.add(t.type));
  if (hasLiveStats) {
    Object.keys(stats!.byType).forEach((k) =>
      allTypes.add(k === 'OPS' ? 'OPERATIONS' : k.toUpperCase())
    );
  }

  const liveTypeMap: Record<string, number> = {};
  if (hasLiveStats) {
    for (const [k, v] of Object.entries(stats!.byType)) {
      liveTypeMap[k === 'OPS' ? 'OPERATIONS' : k.toUpperCase()] = v;
    }
  }

  const sortedTypes = Array.from(allTypes).sort((a, b) => {
    const ma = mockData.sessionTypes.find((t) => t.type === a);
    const mb = mockData.sessionTypes.find((t) => t.type === b);
    return (mb?.count ?? 0) - (ma?.count ?? 0);
  });

  // Build projects union
  const allProjects = new Set<string>();
  mockData.projects.items.forEach((p) => allProjects.add(p.name));
  Object.keys(liveProjectMap).forEach((p) => allProjects.add(p));

  const sortedProjects = Array.from(allProjects).sort((a, b) => {
    const ma = mockData.projects.items.find((p) => p.name === a);
    const va = Math.max(ma?.count ?? 0, liveProjectMap[a] ?? 0);
    const mb = mockData.projects.items.find((p) => p.name === b);
    const vb = Math.max(mb?.count ?? 0, liveProjectMap[b] ?? 0);
    return vb - va;
  });

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="text-center mb-6 pb-4 border-b border-border">
          <h1 className="font-bebas text-3xl tracking-wider text-primary">
            AngelEye — Hybrid Campaign Infographic
          </h1>
          <p className="text-sm text-body font-mono mt-1">
            Mock (angeleye-analysis-1) &bull; overlaid with Live registry data
          </p>
        </header>

        {/* Summary bar */}
        <div className="bg-zinc-900 text-surface rounded-lg px-5 py-3 mb-8 flex flex-wrap items-center gap-5 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-extrabold text-primary">{liveCount}</span>
            <span className="text-xs uppercase tracking-wide text-zinc-400">
              of {totalGap} dimensions live
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-extrabold text-primary">{partialCount}</span>
            <span className="text-xs uppercase tracking-wide text-zinc-400">partial</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="w-28 h-2.5 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${coveragePct}%` }}
              />
            </div>
            <span className="font-bold text-primary text-lg">{coveragePct}%</span>
          </div>
        </div>

        {/* 1. Campaign at a Glance */}
        <SectionWrapper title="Campaign at a Glance" num={1} badge="PARTIAL" variant="partial">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {mockData.heroStats.map((stat) => {
              const isLiveSessions2 = stat.label === 'Sessions' && hasLiveStats;
              const isLiveProjects = stat.label === 'Projects' && hasLiveSessions;
              const isLive = isLiveSessions2 || isLiveProjects;
              const displayValue = isLiveSessions2
                ? String(stats!.total)
                : isLiveProjects
                  ? `${Object.keys(liveProjectMap).length}+`
                  : stat.value;

              return (
                <div
                  key={stat.label}
                  className="bg-card border border-border rounded-lg p-4 text-center relative"
                >
                  <span
                    className={`absolute top-1.5 right-2 w-2 h-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-red-400'}`}
                  />
                  <div className="text-3xl font-extrabold text-primary leading-tight">
                    {displayValue}
                  </div>
                  <div className="text-xs uppercase tracking-wide text-body mt-1">{stat.label}</div>
                  {isLive && (
                    <div className="text-[0.7rem] text-green-700 font-semibold mt-1">
                      Mock: {stat.value}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SectionWrapper>

        {/* 2. Schema v3 */}
        <SectionWrapper
          title="The Schema — v3 Session Index Entry"
          num={2}
          badge="MOCK"
          variant="mock"
        >
          <div className="bg-surface border border-border rounded-lg p-5 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre">
            <span className="text-violet-600">-- Top-Level Fields --</span>
            {'\n'}
            {mockData.schema.topLevel.map((f) => (
              <span key={f.field}>
                <span className="text-blue-500">{f.field.padEnd(22)}</span>{' '}
                <span className="text-primary">{f.type}</span>
                {f.description && <span className="text-body"> {f.description}</span>}
                {'\n'}
              </span>
            ))}
            {'\n'}
            <span className="text-violet-600">-- Shape --</span>
            {'\n'}
            {mockData.schema.shape.map((f) => (
              <span key={f.field}>
                {'  '}
                <span className="text-blue-500">{f.field.padEnd(22)}</span>{' '}
                <span className="text-primary">{f.type.padEnd(8)}</span>{' '}
                <span className="text-body">{f.description ?? ''}</span>
                {'\n'}
              </span>
            ))}
            {'\n'}
            <span className="text-violet-600">-- Predicates (P01-P22) --</span>
            {'\n'}
            {mockData.schema.predicates.map((f) => (
              <span key={f.field}>
                {'  '}
                <span className="text-blue-500">{f.field.padEnd(36)}</span>{' '}
                <span className="text-primary">{f.type}</span>
                {'   '}
                <span className="text-body">{f.description ?? ''}</span>
                {f.stats && <span className="text-body"> {f.stats}</span>}
                {'\n'}
              </span>
            ))}
            {'\n'}
            <span className="text-violet-600">-- Classifiers --</span>
            {'\n'}
            {mockData.schema.classifiers.map((f) => (
              <span key={f.field}>
                {'  '}
                <span className="text-blue-500">{f.field.padEnd(28)}</span>{' '}
                <span className="text-primary">{f.type.padEnd(8)}</span>{' '}
                <span className="text-body">{f.description ?? ''}</span>
                {'\n'}
              </span>
            ))}
          </div>
        </SectionWrapper>

        {/* 3. Session Types */}
        <SectionWrapper
          title="Session Types"
          num={3}
          badge={hasLiveStats ? 'LIVE' : 'MOCK'}
          variant={hasLiveStats ? 'live' : 'mock'}
        >
          <div className="max-h-[500px] overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                    Type
                  </th>
                  <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                    Analysis (Mock)
                  </th>
                  <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                    Live
                  </th>
                  <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                    Delta
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTypes.map((type) => {
                  const mock = mockData.sessionTypes.find((t) => t.type === type);
                  const mockCount = mock?.count ?? 0;
                  const liveVal = liveTypeMap[type] ?? null;
                  const hasDiff = liveVal !== null && liveVal !== mockCount;
                  return (
                    <tr
                      key={type}
                      className={`border-b border-border even:bg-surface odd:bg-card hover:bg-zinc-200 ${hasDiff ? 'bg-amber-50/30' : ''}`}
                    >
                      <td className="px-3 py-1.5">
                        <TypeBadge type={type} />
                      </td>
                      <td className="px-3 py-1.5 font-bold tabular-nums">{mockCount}</td>
                      <td className="px-3 py-1.5 font-bold tabular-nums">
                        {liveVal !== null ? liveVal : <span className="text-body">&mdash;</span>}
                      </td>
                      <td className="px-3 py-1.5">
                        {liveVal !== null ? (
                          deltaStr(liveVal, mockCount)
                        ) : (
                          <span className="text-body">&mdash;</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionWrapper>

        {/* 4. Session Subtypes */}
        <SectionWrapper title="Session Subtypes" num={4} badge="MOCK" variant="mock">
          <p className="text-xs text-body italic mb-3 pl-1 border-l-2 border-border">
            {mockData.subtypes.totalUniqueSubtypes} unique subtypes total &mdash; showing N&ge;3.
            Not computed in live registry.
          </p>
          <div className="max-h-[360px] overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                    Subtype
                  </th>
                  <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockData.subtypes.items.map((s) => (
                  <tr
                    key={s.name}
                    className="border-b border-border even:bg-surface odd:bg-card hover:bg-zinc-200"
                  >
                    <td className="px-3 py-1.5">{s.name}</td>
                    <td className="px-3 py-1.5 font-bold tabular-nums">{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionWrapper>

        {/* 5. Projects */}
        <SectionWrapper
          title="Projects"
          num={5}
          badge={hasLiveSessions ? 'LIVE' : 'MOCK'}
          variant={hasLiveSessions ? 'live' : 'mock'}
        >
          <div className="max-h-[500px] overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                    Project
                  </th>
                  <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                    Analysis (Mock)
                  </th>
                  <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                    Live
                  </th>
                  <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                    Delta
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedProjects.map((name) => {
                  const mock = mockData.projects.items.find((p) => p.name === name);
                  const mockCount = mock?.count ?? 0;
                  const liveVal = liveProjectMap[name] ?? null;
                  const hasDiff = liveVal !== null && liveVal !== mockCount;
                  return (
                    <tr
                      key={name}
                      className={`border-b border-border even:bg-surface odd:bg-card hover:bg-zinc-200 ${hasDiff ? 'bg-amber-50/30' : ''}`}
                    >
                      <td className="px-3 py-1.5">
                        <code className="text-xs">{name}</code>
                      </td>
                      <td className="px-3 py-1.5 font-bold tabular-nums">
                        {mockCount || <span className="text-body">&mdash;</span>}
                      </td>
                      <td className="px-3 py-1.5 font-bold tabular-nums">
                        {liveVal !== null ? liveVal : <span className="text-body">&mdash;</span>}
                      </td>
                      <td className="px-3 py-1.5">
                        {liveVal !== null ? (
                          deltaStr(liveVal, mockCount)
                        ) : (
                          <span className="text-body">&mdash;</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionWrapper>

        {/* 6. Tools Observed */}
        <SectionWrapper
          title="Tools Observed"
          num={6}
          badge={hasLiveSessions ? 'PARTIAL' : 'MOCK'}
          variant={hasLiveSessions ? 'partial' : 'mock'}
        >
          {/* Live tool patterns */}
          {Object.keys(liveToolPatterns).length > 0 && (
            <div className="mb-5">
              <h3 className="text-xs uppercase tracking-wide text-heading font-semibold mb-2 flex items-center gap-2">
                Tool Patterns <SourceBadge type="LIVE" />
              </h3>
              {sorted(liveToolPatterns).map(([pattern, count]) => {
                const pct = sessions ? ((count / sessions.length) * 100).toFixed(1) : '0';
                return (
                  <div key={pattern} className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="w-64 shrink-0 text-sm text-heading">{pattern}</span>
                    <div className="flex-1 min-w-[100px]">
                      <ProgressBar value={count} max={sessions?.length ?? 1} />
                    </div>
                    <span className="w-28 text-right text-xs text-body tabular-nums">
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mock individual tools */}
          <h3 className="text-xs uppercase tracking-wide text-heading font-semibold mb-2 flex items-center gap-2">
            Individual Tool Usage <SourceBadge type="MOCK" />
          </h3>
          <div className="max-h-[360px] overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                    #
                  </th>
                  <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                    Tool
                  </th>
                  <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                    Sessions
                  </th>
                  <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                    Prevalence
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockData.tools.map((t) => (
                  <tr
                    key={t.rank}
                    className="border-b border-border even:bg-surface odd:bg-card hover:bg-zinc-200"
                  >
                    <td className="px-3 py-1.5 text-body">{t.rank}</td>
                    <td className="px-3 py-1.5">
                      <code className="text-xs">{t.name}</code>
                    </td>
                    <td className="px-3 py-1.5 font-bold tabular-nums">{t.sessions}</td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 min-w-[60px]">
                          <ProgressBar value={t.prevalencePercent} max={100} />
                        </div>
                        <span className="text-xs text-body w-10 text-right tabular-nums">
                          {t.prevalencePercent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionWrapper>

        {/* 7. Classifiers */}
        <SectionWrapper
          title="Classifiers (C08-C11, Opening/Closing/Tool Profile)"
          num={7}
          badge={hasLiveClassifiers ? 'PARTIAL' : 'MOCK'}
          variant={hasLiveClassifiers ? 'partial' : 'mock'}
        >
          {/* Live classifiers from stats.fields */}
          {liveFields.delegation_style && Object.keys(liveFields.delegation_style).length > 0 && (
            <LiveClassifierGroup
              title="C08 Delegation Style"
              data={liveFields.delegation_style}
              color="#3b82f6"
            />
          )}
          {!liveFields.delegation_style && (
            <ClassifierGroup
              title="C08 Delegation Style"
              items={mockData.classifiers.delegationStyle}
              color="#3b82f6"
            />
          )}

          {liveFields.session_continuity &&
            Object.keys(liveFields.session_continuity).length > 0 && (
              <LiveClassifierGroup
                title="C09 Session Continuity"
                data={liveFields.session_continuity}
                color="#8b5cf6"
              />
            )}
          {!liveFields.session_continuity && (
            <ClassifierGroup
              title="C09 Session Continuity"
              items={mockData.classifiers.sessionContinuity}
              color="#8b5cf6"
            />
          )}

          {liveFields.output_type && Object.keys(liveFields.output_type).length > 0 && (
            <LiveClassifierGroup
              title="C10 Output Type"
              data={liveFields.output_type}
              color="#22c55e"
            />
          )}
          {!liveFields.output_type && (
            <ClassifierGroup
              title="C10 Output Type"
              items={mockData.classifiers.outputType}
              color="#22c55e"
            />
          )}

          {liveFields.initiation_source && Object.keys(liveFields.initiation_source).length > 0 && (
            <LiveClassifierGroup
              title="C11 Initiation Source"
              data={liveFields.initiation_source}
              color="#f59e0b"
            />
          )}
          {!liveFields.initiation_source && (
            <ClassifierGroup
              title="C11 Initiation Source"
              items={mockData.classifiers.initiationSource}
              color="#f59e0b"
            />
          )}

          {liveFields.session_liveness && Object.keys(liveFields.session_liveness).length > 0 && (
            <LiveClassifierGroup
              title="Session Liveness"
              data={liveFields.session_liveness}
              color="#06b6d4"
            />
          )}

          {/* Always mock: opening, closing, tool profile */}
          <ClassifierGroup
            title="Opening Style"
            items={mockData.classifiers.openingStyle.items}
            color="#ef4444"
            note={`(${mockData.classifiers.openingStyle.totalUniqueValues} unique — top 10)`}
          />
          <ClassifierGroup
            title="Closing Style"
            items={mockData.classifiers.closingStyle.items}
            color="#6366f1"
            note={`(${mockData.classifiers.closingStyle.totalUniqueValues} unique — top 10)`}
          />
          <ClassifierGroup
            title="Tool Profile"
            items={mockData.classifiers.toolProfile.items}
            color="#c8841a"
            note={`(${mockData.classifiers.toolProfile.totalUniqueValues} unique — top 10)`}
          />
        </SectionWrapper>

        {/* 8. Predicates */}
        <SectionWrapper
          title="Predicates (P01-P22)"
          num={8}
          badge={hasLiveSessions ? 'PARTIAL' : 'MOCK'}
          variant={hasLiveSessions ? 'partial' : 'mock'}
        >
          <div className="max-h-[500px] overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                    Predicate
                  </th>
                  <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                    Source
                  </th>
                  <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                    Analysis True/Eval
                  </th>
                  <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                    Analysis %
                  </th>
                  {hasLiveSessions && (
                    <>
                      <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                        Live True/Eval
                      </th>
                      <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                        Live %
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {mockData.predicates.map((p) => {
                  const isLivePred = livePredicateNames.includes(p.name);
                  const liveB = liveBooleans[p.name];
                  const livePct =
                    liveB && liveB.total > 0
                      ? Math.round((liveB.trueCount / liveB.total) * 100)
                      : 0;

                  return (
                    <tr
                      key={p.name}
                      className="border-b border-border even:bg-surface odd:bg-card hover:bg-zinc-200"
                    >
                      <td className="px-3 py-1.5">
                        <code className="text-xs">{p.name}</code>
                      </td>
                      <td className="px-3 py-1.5">
                        <SourceBadge type={isLivePred ? 'LIVE' : 'MOCK'} />
                      </td>
                      <td className="px-3 py-1.5 font-bold tabular-nums">
                        {p.trueCount} / {p.evaluatedCount}
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 min-w-[60px]">
                            <ProgressBar value={p.percent} max={100} />
                          </div>
                          <span className="text-xs text-body w-8 text-right tabular-nums">
                            {p.percent}%
                          </span>
                        </div>
                      </td>
                      {hasLiveSessions && (
                        <>
                          <td className="px-3 py-1.5 font-bold tabular-nums">
                            {isLivePred && liveB ? (
                              `${liveB.trueCount} / ${liveB.total}`
                            ) : (
                              <span className="text-body">&mdash;</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 tabular-nums">
                            {isLivePred && liveB ? (
                              `${livePct}%`
                            ) : (
                              <span className="text-body">&mdash;</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionWrapper>

        {/* 9. BUILD Accuracy by Scale */}
        <SectionWrapper title="BUILD Accuracy by Scale" num={9} badge="MOCK" variant="mock">
          <table className="w-full text-sm border-collapse mb-4">
            <thead>
              <tr>
                <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                  Scale
                </th>
                <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                  BUILD Accuracy
                </th>
                <th className="bg-surface text-body text-left text-xs uppercase tracking-wide px-3 py-2 border-b-2 border-border">
                  Evidence
                </th>
              </tr>
            </thead>
            <tbody>
              {mockData.buildAccuracy.map((b) => (
                <tr
                  key={b.scale}
                  className="border-b border-border even:bg-surface odd:bg-card hover:bg-zinc-200"
                >
                  <td className="px-3 py-1.5">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-surface text-heading">
                      {b.scale}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 font-bold tabular-nums">{b.accuracy}</td>
                  <td className="px-3 py-1.5 text-body">{b.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {mockData.buildAccuracyRules.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-4">
              <h4 className="text-sm font-semibold text-red-700 mb-2">Iron-Clad Rules</h4>
              <ol className="list-decimal list-inside text-sm text-heading space-y-1">
                {mockData.buildAccuracyRules.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ol>
            </div>
          )}
        </SectionWrapper>

        {/* 10. Machine Comparison */}
        <SectionWrapper title="Machine Comparison" num={10} badge="MOCK" variant="mock">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[mockData.machines.m4Mini, mockData.machines.m4Pro].map((machine) => (
              <div key={machine.name} className="bg-card border border-border rounded-lg p-4">
                <h4 className="text-heading font-semibold mb-2">
                  {machine.name} &mdash; {machine.role}
                </h4>
                <div className="text-2xl font-extrabold text-primary mb-1">
                  {machine.sessions} sessions
                </div>
                <div className="text-xs text-body mb-3">Waves {machine.waves}</div>
                <ul className="space-y-1">
                  {machine.characteristics.map((c, i) => (
                    <li key={i} className="text-sm text-heading pl-3 relative">
                      <span className="absolute left-0 text-primary">&bull;</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-surface border-l-[3px] border-l-primary rounded p-3 text-sm text-body">
            {mockData.machines.overlap}
          </div>
        </SectionWrapper>

        {/* 11. Derived Metrics */}
        <SectionWrapper
          title="Derived Metrics"
          num={11}
          badge={liveFields.session_liveness ? 'PARTIAL' : 'MOCK'}
          variant={liveFields.session_liveness ? 'partial' : 'mock'}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Autonomy Ratio */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-xs uppercase tracking-wide text-body font-semibold mb-1">
                Autonomy Ratio
              </h3>
              <p className="text-xs text-body mb-3">
                Formula: {mockData.derivedMetrics.autonomyRatio.formula}
              </p>
              {(() => {
                const buckets = mockData.derivedMetrics.autonomyRatio.buckets;
                const maxSessions =
                  buckets.length > 0 ? Math.max(...buckets.map((b) => b.sessions)) : 1;
                return buckets.map((b) => (
                  <div key={b.bucket} className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="w-36 shrink-0 text-sm text-heading">
                      {b.bucket} {b.range ? `(${b.range})` : ''}
                    </span>
                    <div className="flex-1 min-w-[80px]">
                      <ProgressBar value={b.sessions} max={maxSessions} />
                    </div>
                    <span className="w-36 text-right text-xs text-body tabular-nums">
                      {b.sessions} &mdash; {b.meaning}
                    </span>
                  </div>
                ));
              })()}
            </div>

            {/* Session Liveness */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-xs uppercase tracking-wide text-body font-semibold mb-1">
                Session Liveness
              </h3>
              <p className="text-xs text-body mb-3">
                Formula: {mockData.derivedMetrics.sessionLiveness.formula}
              </p>
              {liveFields.session_liveness &&
              Object.keys(liveFields.session_liveness).length > 0 ? (
                <>
                  <p className="text-[0.7rem] text-green-700 font-semibold mb-2">
                    Using LIVE enum values from stats.fields
                  </p>
                  {sorted(liveFields.session_liveness).map(([val, count]) => {
                    const maxVal = Math.max(...Object.values(liveFields.session_liveness!));
                    return (
                      <div key={val} className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="w-36 shrink-0 text-sm text-heading">{val}</span>
                        <div className="flex-1 min-w-[80px]">
                          <ProgressBar value={count} max={maxVal} />
                        </div>
                        <span className="w-20 text-right text-xs text-body tabular-nums">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </>
              ) : (
                (() => {
                  const buckets = mockData.derivedMetrics.sessionLiveness.buckets;
                  const maxSessions =
                    buckets.length > 0 ? Math.max(...buckets.map((b) => b.sessions)) : 1;
                  return buckets.map((b) => (
                    <div key={b.bucket} className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="w-36 shrink-0 text-sm text-heading">
                        {b.bucket} {b.range ? `(${b.range})` : ''}
                      </span>
                      <div className="flex-1 min-w-[80px]">
                        <ProgressBar value={b.sessions} max={maxSessions} />
                      </div>
                      <span className="w-36 text-right text-xs text-body tabular-nums">
                        {b.sessions} &mdash; {b.meaning}
                      </span>
                    </div>
                  ));
                })()
              )}
            </div>
          </div>
        </SectionWrapper>

        {/* 12. Skills Invoked */}
        <SectionWrapper
          title="Skills Invoked"
          num={12}
          badge={Object.keys(liveTriggers).length > 0 ? 'PARTIAL' : 'MOCK'}
          variant={Object.keys(liveTriggers).length > 0 ? 'partial' : 'mock'}
        >
          {/* Live triggers */}
          {Object.keys(liveTriggers).length > 0 && (
            <div className="mb-5">
              <h3 className="text-xs uppercase tracking-wide text-heading font-semibold mb-2 flex items-center gap-2">
                Live Trigger Commands <SourceBadge type="LIVE" />
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {sorted(liveTriggers).map(([cmd, count]) => (
                  <span
                    key={cmd}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface border border-border rounded text-sm"
                  >
                    <span className="text-blue-500 font-mono text-xs">{cmd}</span>
                    <span className="text-body text-xs">&times;{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mock skills */}
          <h3 className="text-xs uppercase tracking-wide text-heading font-semibold mb-2 flex items-center gap-2">
            Analysis Campaign Skills <SourceBadge type="MOCK" />
          </h3>
          {mockData.skills._note && (
            <p className="text-xs text-body italic mb-2 pl-1 border-l-2 border-border">
              {mockData.skills._note}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {mockData.skills.items.map((s) => (
              <span
                key={s.name}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface border border-border rounded text-sm"
              >
                <span className="text-blue-500 font-mono text-xs">{s.name}</span>
                <span className="text-body text-xs">&times;{s.count}</span>
              </span>
            ))}
          </div>
        </SectionWrapper>

        {/* 13. Gap Analysis */}
        <section className="mb-8">
          <h2 className="font-bebas text-xl tracking-wider text-heading uppercase flex items-center gap-2 pb-2 mb-3">
            13. Gap Analysis &mdash; Mock vs Live Coverage
          </h2>
          <div className="bg-card border border-border border-l-4 border-l-zinc-900 rounded-lg p-4">
            <div className="max-h-[500px] overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="bg-zinc-900 text-surface text-left text-xs uppercase tracking-wide px-3 py-2">
                      Dimension
                    </th>
                    <th className="bg-zinc-900 text-surface text-left text-xs uppercase tracking-wide px-3 py-2">
                      Analysis Value
                    </th>
                    <th className="bg-zinc-900 text-surface text-left text-xs uppercase tracking-wide px-3 py-2">
                      Live Equivalent
                    </th>
                    <th className="bg-zinc-900 text-surface text-left text-xs uppercase tracking-wide px-3 py-2">
                      Status
                    </th>
                    <th className="bg-zinc-900 text-surface text-left text-xs uppercase tracking-wide px-3 py-2">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gapRows.map((g) => {
                    const statusClass =
                      g.status === 'LIVE'
                        ? 'text-green-700 font-semibold'
                        : g.status === 'PARTIAL'
                          ? 'text-amber-700 font-semibold'
                          : 'text-red-700 font-semibold';
                    return (
                      <tr
                        key={g.dimension}
                        className="border-b border-border even:bg-surface odd:bg-card hover:bg-zinc-200"
                      >
                        <td className="px-3 py-1.5 font-semibold">{g.dimension}</td>
                        <td className="px-3 py-1.5 text-xs">{g.analysis}</td>
                        <td className="px-3 py-1.5 text-xs">{g.live}</td>
                        <td className={`px-3 py-1.5 ${statusClass}`}>{g.status}</td>
                        <td className="px-3 py-1.5 text-xs text-body">{g.notes}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
