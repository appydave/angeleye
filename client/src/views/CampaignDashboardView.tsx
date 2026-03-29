import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
);

// ─── Constants ──────────────────────────────────────────────────────────────

const CHART_COLORS = [
  '#c8841a',
  '#8b6914',
  '#a67c3b',
  '#d4a24e',
  '#6b8e5a',
  '#7c9885',
  '#5a7d9b',
  '#8b7355',
  '#c4956a',
  '#9b8567',
  '#b8860b',
  '#cd853f',
  '#daa520',
  '#d2691e',
];

const GRID_COLOR = 'rgba(212, 205, 196, 0.4)';

// ─── Types ──────────────────────────────────────────────────────────────────

type DataSource = 'LIVE' | 'PARTIAL' | 'MOCK';

interface StatsData {
  total: number;
  byType: Record<string, number>;
  fields: Record<string, Record<string, number>>;
}

interface MockData {
  campaignOverview: {
    totalSessions: number;
    machines: number;
    wavesAndBackwardPass: number;
    m4Mini: number;
    m4Pro: number;
    unknownMachine: number;
    schemaV2: number;
    noSchemaVersion: number;
  };
  derivedMetrics: {
    autonomyRatio: { buckets: { label: string; sessions: number }[] };
    sessionLiveness: { buckets: { label: string; sessions: number }[] };
  };
  buildAccuracy: { scale: string; accuracy: string }[];
  machines: {
    m4Mini: Record<string, number>;
    m4Pro: Record<string, number>;
  };
  predicates: { name: string; truePercent: number; evaluated: number }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SessionRecord = Record<string, any>;

// ─── Helpers ────────────────────────────────────────────────────────────────

function aggregateField(sessions: SessionRecord[], field: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of sessions) {
    const val = String(s[field] ?? 'unknown');
    counts[val] = (counts[val] ?? 0) + 1;
  }
  return counts;
}

function topN(counts: Record<string, number>, n: number): [string, number][] {
  return Object.entries(counts)
    .filter(
      ([k]) => k && k !== 'unknown' && k !== 'unclassified' && k !== 'undefined' && k !== 'null'
    )
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

function countBoolField(
  sessions: SessionRecord[],
  field: string
): { trueCount: number; total: number } {
  let trueCount = 0;
  let total = 0;
  for (const s of sessions) {
    if (s[field] !== undefined && s[field] !== null) {
      total++;
      if (s[field]) trueCount++;
    }
  }
  return { trueCount, total };
}

function parseAccuracy(s: string): number {
  const clean = String(s).replace(/[~%]/g, '');
  if (clean.includes('-')) {
    const [lo, hi] = clean.split('-').map(Number);
    return (lo + hi) / 2;
  }
  return Number(clean) || 0;
}

// ─── Chart option builders ──────────────────────────────────────────────────

function barOpts(horizontal = false) {
  return {
    indexAxis: horizontal ? ('y' as const) : ('x' as const),
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: GRID_COLOR } },
      y: { grid: { color: GRID_COLOR } },
    },
  };
}

function doughnutOpts() {
  return {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '55%',
    plugins: {
      legend: { position: 'bottom' as const, labels: { font: { size: 10 } } },
    },
  };
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: DataSource }) {
  const dotColor =
    source === 'LIVE' ? 'bg-green-500' : source === 'PARTIAL' ? 'bg-amber-500' : 'bg-stone-400';
  return (
    <span className="absolute top-4 right-4 flex items-center gap-1.5 rounded bg-surface border border-border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-body">
      <span className={`inline-block h-[7px] w-[7px] rounded-full ${dotColor}`} />
      {source}
    </span>
  );
}

function DashboardCard({
  title,
  source,
  wide = false,
  full = false,
  className = '',
  children,
}: {
  title: string;
  source: DataSource;
  wide?: boolean;
  full?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const borderStyle =
    source === 'LIVE' || source === 'PARTIAL'
      ? 'border-l-4 border-l-accent'
      : 'border-l-4 border-l-border border-dashed';
  const span = full ? 'col-span-full' : wide ? 'sm:col-span-2' : '';
  const opacity = source === 'MOCK' ? 'opacity-60' : '';

  return (
    <div
      className={`relative rounded-lg bg-card border border-border p-5 shadow-sm transition-colors hover:bg-surface ${borderStyle} ${span} ${className}`}
    >
      <h2 className="mb-4 pr-[70px] text-xs font-semibold uppercase tracking-wider text-body">
        {title}
      </h2>
      <SourceBadge source={source} />
      <div className={opacity}>{children}</div>
    </div>
  );
}

function StatBox({
  value,
  label,
  live,
  color = 'text-accent',
}: {
  value: number | string;
  label: string;
  live: boolean;
  color?: string;
}) {
  return (
    <div className="relative rounded-lg bg-surface border border-border p-3.5 text-center">
      <span
        className={`absolute top-1 right-1.5 inline-block h-1.5 w-1.5 rounded-full ${live ? 'bg-green-500' : 'bg-stone-400'}`}
      />
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="mt-0.5 text-[0.72rem] uppercase tracking-wide text-body">{label}</div>
    </div>
  );
}

// ─── Predicate map for live aggregation ─────────────────────────────────────

const LIVE_PREDICATE_MAP: Record<string, string> = {
  has_handover_context: 'handover context',
  has_cross_project_reads: 'cross-project reads',
  has_web_research: 'web research',
  has_parallel_subagent_bursts: 'parallel subagents',
  has_task_orchestration: 'task orchestration',
  has_git_outcome: 'git outcome',
  has_voice_dictation_artifacts: 'voice dictation',
  has_brain_file_writes: 'brain file writes',
  has_cross_session_refs: 'cross session refs',
  has_unauthorized_edits: 'unauthorized edits',
  has_closing_ceremony: 'closing ceremony',
  is_compaction_resume: 'compaction resume',
  is_machine_initiated: 'machine initiated',
  has_playwright_calls: 'playwright calls',
};

// ─── Main component ─────────────────────────────────────────────────────────

export default function CampaignDashboardView() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[] | null>(null);
  const [mock, setMock] = useState<MockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      try {
        const [statsRes, sessionsRes, mockRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/sessions?limit=2000'),
          fetch('/api/mock-views/campaign-infographic'),
        ]);

        const statsJson = statsRes.ok ? await statsRes.json() : null;
        const sessionsJson = sessionsRes.ok ? await sessionsRes.json() : null;
        const mockJson = mockRes.ok ? await mockRes.json() : null;

        if (cancelled) return;

        if (statsJson?.status === 'ok') setStats(statsJson.data);
        if (sessionsJson?.status === 'ok') setSessions(sessionsJson.data?.sessions ?? []);
        if (mockJson?.status === 'ok') setMock(mockJson.data);
        else setError('Could not load mock data');
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Loading / Error states ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="h-full min-h-0 overflow-y-auto p-6">
        <h1 className="font-bebas text-3xl tracking-wider text-primary">CAMPAIGN DASHBOARD</h1>
        <p className="mt-4 text-body">Loading dashboard data...</p>
      </div>
    );
  }

  if (error && !mock) {
    return (
      <div className="h-full min-h-0 overflow-y-auto p-6">
        <h1 className="font-bebas text-3xl tracking-wider text-primary">CAMPAIGN DASHBOARD</h1>
        <p className="mt-4 text-red-600">{error}</p>
      </div>
    );
  }

  // ─── Derived data ───────────────────────────────────────────────────────

  const hasLiveStats = !!stats;
  const hasLiveSessions = !!sessions && sessions.length > 0;

  // Coverage summary
  const sectionSources: { label: string; source: DataSource }[] = [
    { label: 'Campaign Overview', source: hasLiveStats ? 'PARTIAL' : 'MOCK' },
    { label: 'Session Types', source: hasLiveStats ? 'LIVE' : 'MOCK' },
    { label: 'Session Scale', source: hasLiveSessions ? 'LIVE' : 'MOCK' },
    {
      label: 'Delegation Style',
      source: hasLiveStats && stats?.fields?.delegation_style ? 'LIVE' : 'MOCK',
    },
    {
      label: 'Initiation Source',
      source: hasLiveStats && stats?.fields?.initiation_source ? 'LIVE' : 'MOCK',
    },
    {
      label: 'Session Continuity',
      source: hasLiveStats && stats?.fields?.session_continuity ? 'LIVE' : 'MOCK',
    },
    { label: 'Output Type', source: hasLiveStats && stats?.fields?.output_type ? 'LIVE' : 'MOCK' },
    { label: 'Autonomy Ratio', source: 'MOCK' as DataSource },
    {
      label: 'Session Liveness',
      source: hasLiveStats && stats?.fields?.session_liveness ? 'LIVE' : 'MOCK',
    },
    { label: 'Top Projects', source: hasLiveSessions ? 'LIVE' : 'MOCK' },
    { label: 'Key Predicates', source: hasLiveSessions ? 'PARTIAL' : 'MOCK' },
    { label: 'BUILD Accuracy', source: 'MOCK' as DataSource },
    { label: 'Machine Comparison', source: 'MOCK' as DataSource },
  ];

  const liveCount = sectionSources.filter((s) => s.source === 'LIVE').length;
  const partialCount = sectionSources.filter((s) => s.source === 'PARTIAL').length;
  const mockCount = sectionSources.filter((s) => s.source === 'MOCK').length;
  const populated = liveCount + partialCount;
  const pct = Math.round((populated / sectionSources.length) * 100);

  // ─── Card data builders ─────────────────────────────────────────────────

  // 1. Campaign Overview
  const overview = mock?.campaignOverview;
  const overviewBoxes = overview
    ? [
        {
          value: hasLiveStats ? stats!.total : overview.totalSessions,
          label: 'Total Sessions',
          live: hasLiveStats,
          color: 'text-accent',
        },
        { value: overview.machines, label: 'Machines', live: false, color: 'text-green-500' },
        {
          value: overview.wavesAndBackwardPass,
          label: 'Waves + Backward',
          live: false,
          color: 'text-amber-500',
        },
        { value: overview.m4Mini, label: 'M4 Mini', live: false, color: 'text-purple-500' },
        { value: overview.m4Pro, label: 'M4 Pro', live: false, color: 'text-red-500' },
        {
          value: overview.unknownMachine,
          label: 'Unknown Machine',
          live: false,
          color: 'text-body',
        },
        { value: overview.schemaV2, label: 'Schema v2', live: false, color: 'text-green-500' },
        {
          value: overview.noSchemaVersion,
          label: 'No Schema Version',
          live: false,
          color: 'text-body',
        },
      ]
    : [];

  // 2. Session Type Distribution
  const sessionTypeData = (() => {
    if (hasLiveStats && stats!.byType) {
      const entries = Object.entries(stats!.byType).sort((a, b) => {
        if (a[0] === 'unclassified') return 1;
        if (b[0] === 'unclassified') return -1;
        return b[1] - a[1];
      });
      return { labels: entries.map((e) => e[0]), values: entries.map((e) => e[1]) };
    }
    return null;
  })();

  // 3. Session Scale
  const sessionScaleData = (() => {
    if (hasLiveSessions) {
      const counts = aggregateField(sessions!, 'session_scale');
      const order = ['light', 'micro', 'moderate', 'heavy', 'marathon', 'trivial'];
      const labels: string[] = [];
      const values: number[] = [];
      for (const s of order) {
        if (counts[s]) {
          labels.push(s);
          values.push(counts[s]);
        }
      }
      for (const [k, v] of Object.entries(counts)) {
        if (!order.includes(k)) {
          labels.push(k);
          values.push(v);
        }
      }
      return { labels, values };
    }
    return null;
  })();

  // 4-7, 9: Fields from stats
  function fieldData(fieldName: string): { labels: string[]; values: number[] } | null {
    if (hasLiveStats && stats?.fields?.[fieldName]) {
      const entries = Object.entries(stats.fields[fieldName]).sort((a, b) => b[1] - a[1]);
      return { labels: entries.map((e) => e[0]), values: entries.map((e) => e[1]) };
    }
    return null;
  }

  const delegationData = fieldData('delegation_style');
  const initiationData = fieldData('initiation_source');
  const continuityData = fieldData('session_continuity');
  const outputTypeData = fieldData('output_type');
  const livenessData = fieldData('session_liveness');

  // 8. Autonomy Ratio (mock only)
  const autonomyData = mock?.derivedMetrics?.autonomyRatio?.buckets
    ? {
        labels: mock.derivedMetrics.autonomyRatio.buckets.map((b) => b.label),
        values: mock.derivedMetrics.autonomyRatio.buckets.map((b) => b.sessions),
      }
    : null;

  // 10. Top 15 Projects
  const projectData = (() => {
    if (hasLiveSessions) {
      const counts = aggregateField(sessions!, 'project');
      const top = topN(counts, 15);
      return { labels: top.map((e) => e[0]), values: top.map((e) => e[1]) };
    }
    return null;
  })();

  // 11. Key Predicates
  const predicateData = (() => {
    if (hasLiveSessions) {
      const labels: string[] = [];
      const trueValues: number[] = [];
      const totalValues: number[] = [];
      for (const [field, label] of Object.entries(LIVE_PREDICATE_MAP)) {
        const { trueCount, total } = countBoolField(sessions!, field);
        if (total > 0) {
          labels.push(label);
          trueValues.push(trueCount);
          totalValues.push(total);
        }
      }
      return { labels, trueValues, totalValues };
    }
    return null;
  })();

  // 12. BUILD Accuracy (mock only)
  const accuracyData = mock?.buildAccuracy
    ? {
        labels: mock.buildAccuracy.map((b) => b.scale),
        values: mock.buildAccuracy.map((b) => parseAccuracy(b.accuracy)),
      }
    : null;

  // 13. Machine Comparison (mock only)
  const machineData = mock?.machines
    ? {
        labels: ['Sessions', 'BUILD', 'KNOWLEDGE', 'RESEARCH', 'OPERATIONS', 'Schema v2'],
        m4Mini: [
          mock.machines.m4Mini.sessions ?? 0,
          mock.machines.m4Mini.BUILD ?? 0,
          mock.machines.m4Mini.KNOWLEDGE ?? 0,
          mock.machines.m4Mini.RESEARCH ?? 0,
          mock.machines.m4Mini.OPERATIONS ?? 0,
          mock.machines.m4Mini.schemaV2 ?? 0,
        ],
        m4Pro: [
          mock.machines.m4Pro.sessions ?? 0,
          mock.machines.m4Pro.BUILD ?? 0,
          mock.machines.m4Pro.KNOWLEDGE ?? 0,
          mock.machines.m4Pro.RESEARCH ?? 0,
          mock.machines.m4Pro.OPERATIONS ?? 0,
          mock.machines.m4Pro.schemaV2 ?? 0,
        ],
      }
    : null;

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="h-full min-h-0 overflow-y-auto p-6">
      {/* Header */}
      <h1 className="font-bebas text-3xl tracking-wider text-primary">CAMPAIGN DASHBOARD</h1>
      <p className="mt-1 text-sm font-mono text-body">
        Live registry data overlaid on angeleye-analysis-1 mock data
      </p>

      {/* Summary bar */}
      <div className="mt-4 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-card border border-border px-6 py-3.5">
        <div className="text-sm font-semibold text-heading">
          <span className="font-bold text-accent">{populated}</span> of{' '}
          <span className="font-bold text-accent">{sectionSources.length}</span> dimensions
          populated from live data (<span className="font-bold text-accent">{pct}%</span> coverage)
          &mdash; {liveCount} live, {partialCount} partial, {mockCount} mock
        </div>
        <div className="flex gap-4 text-xs text-body">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" /> LIVE
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> PARTIAL
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-stone-400" /> MOCK
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-400 bg-red-50/20 px-5 py-2.5 text-center text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 max-w-[1600px] mx-auto">
        {/* 1. Campaign Overview */}
        <DashboardCard title="Campaign Overview" source={sectionSources[0].source} full>
          {overview ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {overviewBoxes.map((box, i) => (
                <StatBox
                  key={i}
                  value={box.value}
                  label={box.label}
                  live={box.live}
                  color={box.color}
                />
              ))}
            </div>
          ) : (
            <p className="text-body text-sm">No overview data available</p>
          )}
        </DashboardCard>

        {/* 2. Session Type Distribution */}
        <DashboardCard title="Session Type Distribution" source={sectionSources[1].source}>
          {sessionTypeData ? (
            <div className="mx-auto max-w-[320px]">
              <Doughnut
                data={{
                  labels: sessionTypeData.labels,
                  datasets: [
                    {
                      data: sessionTypeData.values,
                      backgroundColor: CHART_COLORS.slice(0, sessionTypeData.labels.length),
                      borderColor: 'rgba(245,241,235,0.8)',
                      borderWidth: 1,
                    },
                  ],
                }}
                options={doughnutOpts()}
              />
            </div>
          ) : (
            <p className="text-body text-sm">No session type data</p>
          )}
        </DashboardCard>

        {/* 3. Session Scale */}
        <DashboardCard title="Session Scale" source={sectionSources[2].source}>
          {sessionScaleData ? (
            <Bar
              data={{
                labels: sessionScaleData.labels,
                datasets: [
                  {
                    data: sessionScaleData.values,
                    backgroundColor: CHART_COLORS.slice(0, sessionScaleData.labels.length),
                    borderRadius: 4,
                  },
                ],
              }}
              options={barOpts(true)}
            />
          ) : (
            <p className="text-body text-sm">No scale data</p>
          )}
        </DashboardCard>

        {/* 4. Delegation Style */}
        <DashboardCard title="Delegation Style" source={sectionSources[3].source}>
          {delegationData ? (
            <div className="mx-auto max-w-[320px]">
              <Doughnut
                data={{
                  labels: delegationData.labels,
                  datasets: [
                    {
                      data: delegationData.values,
                      backgroundColor: CHART_COLORS.slice(0, delegationData.labels.length),
                      borderColor: 'rgba(245,241,235,0.8)',
                      borderWidth: 1,
                    },
                  ],
                }}
                options={doughnutOpts()}
              />
            </div>
          ) : (
            <p className="text-body text-sm">No delegation data</p>
          )}
        </DashboardCard>

        {/* 5. Initiation Source */}
        <DashboardCard title="Initiation Source" source={sectionSources[4].source}>
          {initiationData ? (
            <Bar
              data={{
                labels: initiationData.labels,
                datasets: [
                  {
                    data: initiationData.values,
                    backgroundColor: CHART_COLORS.slice(0, initiationData.labels.length),
                    borderRadius: 4,
                  },
                ],
              }}
              options={barOpts(true)}
            />
          ) : (
            <p className="text-body text-sm">No initiation data</p>
          )}
        </DashboardCard>

        {/* 6. Session Continuity */}
        <DashboardCard title="Session Continuity" source={sectionSources[5].source}>
          {continuityData ? (
            <Bar
              data={{
                labels: continuityData.labels,
                datasets: [
                  {
                    data: continuityData.values,
                    backgroundColor: CHART_COLORS.slice(0, continuityData.labels.length),
                    borderRadius: 4,
                  },
                ],
              }}
              options={barOpts(false)}
            />
          ) : (
            <p className="text-body text-sm">No continuity data</p>
          )}
        </DashboardCard>

        {/* 7. Output Type */}
        <DashboardCard title="Output Type" source={sectionSources[6].source}>
          {outputTypeData ? (
            <div className="mx-auto max-w-[320px]">
              <Doughnut
                data={{
                  labels: outputTypeData.labels,
                  datasets: [
                    {
                      data: outputTypeData.values,
                      backgroundColor: CHART_COLORS.slice(0, outputTypeData.labels.length),
                      borderColor: 'rgba(245,241,235,0.8)',
                      borderWidth: 1,
                    },
                  ],
                }}
                options={doughnutOpts()}
              />
            </div>
          ) : (
            <p className="text-body text-sm">No output type data</p>
          )}
        </DashboardCard>

        {/* 8. Autonomy Ratio */}
        <DashboardCard title="Autonomy Ratio" source={sectionSources[7].source}>
          {autonomyData ? (
            <Bar
              data={{
                labels: autonomyData.labels,
                datasets: [
                  {
                    data: autonomyData.values,
                    backgroundColor: [
                      '#22c55e',
                      '#c8841a',
                      '#f59e0b',
                      '#c0392b',
                      'rgba(212,205,196,0.5)',
                    ],
                    borderRadius: 4,
                  },
                ],
              }}
              options={barOpts(false)}
            />
          ) : (
            <p className="text-body text-sm">No autonomy data</p>
          )}
        </DashboardCard>

        {/* 9. Session Liveness */}
        <DashboardCard title="Session Liveness" source={sectionSources[8].source}>
          {livenessData ? (
            <Bar
              data={{
                labels: livenessData.labels,
                datasets: [
                  {
                    data: livenessData.values,
                    backgroundColor: [
                      '#22c55e',
                      '#2E91FC',
                      '#c0392b',
                      '#f59e0b',
                      'rgba(212,205,196,0.5)',
                    ],
                    borderRadius: 4,
                  },
                ],
              }}
              options={barOpts(false)}
            />
          ) : (
            <p className="text-body text-sm">No liveness data</p>
          )}
        </DashboardCard>

        {/* 10. Top 15 Projects */}
        <DashboardCard title="Top 15 Projects" source={sectionSources[9].source} wide>
          {projectData ? (
            <div className="h-[420px]">
              <Bar
                data={{
                  labels: projectData.labels,
                  datasets: [
                    {
                      data: projectData.values,
                      backgroundColor: CHART_COLORS.slice(0, projectData.labels.length),
                      borderRadius: 4,
                    },
                  ],
                }}
                options={{ ...barOpts(true), maintainAspectRatio: false }}
              />
            </div>
          ) : (
            <p className="text-body text-sm">No project data</p>
          )}
        </DashboardCard>

        {/* 11. Key Predicates */}
        <DashboardCard title="Key Predicates" source={sectionSources[10].source} wide>
          {predicateData ? (
            <div className="h-[350px]">
              <Bar
                data={{
                  labels: predicateData.labels,
                  datasets: [
                    {
                      label: 'True',
                      data: predicateData.trueValues,
                      backgroundColor: 'rgba(200,132,26,0.8)',
                      borderRadius: 4,
                    },
                    {
                      label: 'Total Evaluated',
                      data: predicateData.totalValues,
                      backgroundColor: 'rgba(212,205,196,0.5)',
                      borderRadius: 4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' as const } },
                  scales: {
                    x: { grid: { color: GRID_COLOR } },
                    y: { grid: { color: GRID_COLOR } },
                  },
                }}
              />
            </div>
          ) : (
            <p className="text-body text-sm">No predicate data</p>
          )}
        </DashboardCard>

        {/* 12. BUILD Accuracy by Scale */}
        <DashboardCard title="BUILD Accuracy by Scale" source={sectionSources[11].source}>
          {accuracyData ? (
            <Line
              data={{
                labels: accuracyData.labels,
                datasets: [
                  {
                    label: 'Accuracy %',
                    data: accuracyData.values,
                    borderColor: '#c8841a',
                    backgroundColor: 'rgba(200,132,26,0.12)',
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#c8841a',
                    pointBorderColor: '#f5f1eb',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: { callbacks: { label: (ctx) => `Accuracy: ${ctx.raw}%` } },
                },
                scales: {
                  y: {
                    min: 0,
                    max: 100,
                    ticks: { callback: (v) => `${v}%` },
                    grid: { color: GRID_COLOR },
                  },
                  x: { grid: { color: GRID_COLOR } },
                },
              }}
            />
          ) : (
            <p className="text-body text-sm">No accuracy data</p>
          )}
        </DashboardCard>

        {/* 13. Machine Comparison */}
        <DashboardCard title="Machine Comparison" source={sectionSources[12].source}>
          {machineData ? (
            <Bar
              data={{
                labels: machineData.labels,
                datasets: [
                  {
                    label: 'M4 Mini',
                    data: machineData.m4Mini,
                    backgroundColor: 'rgba(200,132,26,0.7)',
                    borderRadius: 4,
                  },
                  {
                    label: 'M4 Pro',
                    data: machineData.m4Pro,
                    backgroundColor: 'rgba(46,145,252,0.7)',
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: { legend: { position: 'top' as const } },
                scales: {
                  x: { grid: { color: GRID_COLOR } },
                  y: { grid: { color: GRID_COLOR } },
                },
              }}
            />
          ) : (
            <p className="text-body text-sm">No machine data</p>
          )}
        </DashboardCard>
      </div>

      {/* Footer */}
      <footer className="mt-10 border-t border-border pt-5 text-center text-xs text-body">
        AngelEye — Ambient Intelligence for Claude Code — Hybrid dashboard (live + mock)
      </footer>
    </div>
  );
}
