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
                {type === 'unclassified' ? 'unclassified' : type}
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
              <td className="py-1 px-2 font-medium text-foreground">{formatLabel(key)}</td>
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
            <td className="py-1 px-2 font-medium text-foreground">{formatLabel(key)}</td>
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
