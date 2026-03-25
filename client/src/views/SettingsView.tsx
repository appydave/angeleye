import { useState, useEffect } from 'react';

type SessionType = 'BUILD' | 'TEST' | 'RESEARCH' | 'KNOWLEDGE' | 'OPS' | 'ORIENTATION';
type TypeCounts = Record<SessionType | 'unclassified', number>;

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
}

interface LastSyncRecord {
  timestamp: string;
  imported: number;
  classified: number;
}

interface StatsResult {
  byType: Record<SessionType | 'unclassified', number>;
  total: number;
}

const TYPE_ORDER: (SessionType | 'unclassified')[] = [
  'BUILD',
  'ORIENTATION',
  'KNOWLEDGE',
  'RESEARCH',
  'OPS',
  'TEST',
  'unclassified',
];

const TYPE_COLORS: Record<string, string> = {
  BUILD: '#c8841a',
  ORIENTATION: '#7a6e5e',
  KNOWLEDGE: '#0d9488',
  RESEARCH: '#3b82b6',
  OPS: '#ea580c',
  TEST: '#7c3aed',
  unclassified: '#d4cdc4',
};

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

function DiffTable({ result }: { result: SyncResult }) {
  const maxDelta = Math.max(
    ...TYPE_ORDER.map((t) => Math.abs((result.after[t] ?? 0) - (result.before[t] ?? 0)))
  );

  return (
    <div className="mt-5 border-t border-border pt-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-3">
        Sync Results — {result.imported} new, {result.classified} classified
      </div>

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
            <th className="py-1.5 px-2 w-16"></th>
          </tr>
        </thead>
        <tbody>
          {TYPE_ORDER.map((type) => {
            const before = result.before[type] ?? 0;
            const after = result.after[type] ?? 0;
            const delta = after - before;
            const barWidth = maxDelta > 0 ? (Math.abs(delta) / maxDelta) * 48 : 0;

            return (
              <tr key={type} className="border-b border-border last:border-b-0">
                <td
                  className={`py-1 px-2 font-semibold ${type === 'unclassified' ? 'text-muted-foreground/60' : 'text-foreground'}`}
                >
                  {type === 'unclassified' ? 'unclassified' : type}
                </td>
                <td className="py-1 px-2 text-right font-mono tabular-nums">{before}</td>
                <td className="py-1 px-2 text-right font-mono tabular-nums">{after}</td>
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
                <td className="py-1 px-2">
                  {delta !== 0 && (
                    <span
                      className="inline-block h-2 rounded-sm align-middle"
                      style={{
                        width: `${barWidth}px`,
                        background: delta < 0 ? '#c0392b33' : (TYPE_COLORS[type] ?? '#d4cdc4'),
                        opacity: delta < 0 ? 0.5 : 0.7,
                      }}
                    />
                  )}
                </td>
              </tr>
            );
          })}
          <tr className="border-t-2 border-border font-bold">
            <td className="py-1.5 px-2">Total</td>
            <td className="py-1.5 px-2 text-right font-mono tabular-nums">{result.totalBefore}</td>
            <td className="py-1.5 px-2 text-right font-mono tabular-nums">{result.totalAfter}</td>
            <td className="py-1.5 px-2 text-right font-mono tabular-nums text-[#5a9a3c]">
              {result.totalAfter - result.totalBefore > 0
                ? `+${result.totalAfter - result.totalBefore}`
                : result.totalAfter - result.totalBefore === 0
                  ? '—'
                  : result.totalAfter - result.totalBefore}
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>

      {result.newByProject.length > 0 && (
        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
            {result.imported} New Sessions
          </div>
          <div className="space-y-0.5">
            {result.newByProject.map((p) => (
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

      {result.errors > 0 && (
        <p className="mt-3 text-xs text-destructive">
          {result.errors} error{result.errors !== 1 ? 's' : ''} during sync
        </p>
      )}
    </div>
  );
}

export default function SettingsView() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<LastSyncRecord | null | undefined>(undefined);
  const [stats, setStats] = useState<StatsResult | null>(null);

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

  function runSync() {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    fetch('/api/sync', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        const result = d.data as SyncResult;
        setSyncResult(result);
        setLastSync({
          timestamp: new Date().toISOString(),
          imported: result.imported,
          classified: result.classified,
        });
        void fetch('/api/stats')
          .then((r) => r.json())
          .then((d) => setStats(d.data as StatsResult))
          .catch(() => {
            /* non-fatal */
          });
      })
      .catch(() => {
        setSyncError('Sync request failed.');
      })
      .finally(() => {
        setSyncing(false);
      });
  }

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between px-0 py-2 border-b border-border">
        <h1 className="font-bebas text-3xl tracking-wider text-foreground">Settings</h1>
      </div>

      <div className="bg-card border border-border rounded-md shadow-sm p-5 max-w-[600px]">
        <h2 className="font-bebas text-lg tracking-wider text-primary mb-1">Session Sync</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Scan and classify all Claude Code sessions in one pass. Safe to run multiple times.
        </p>

        <div className="text-xs text-muted-foreground mb-3">
          {lastSync === undefined && <span>Loading…</span>}
          {lastSync === null && <span>Never synced</span>}
          {lastSync && (
            <span>
              Last sync: {relativeTime(lastSync.timestamp)}
              {lastSync.imported > 0 &&
                ` — ${lastSync.imported} new session${lastSync.imported !== 1 ? 's' : ''}`}
            </span>
          )}
        </div>

        <button
          onClick={runSync}
          disabled={syncing}
          className="px-4 py-1.5 text-sm font-medium border border-border rounded hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {syncing ? 'Syncing…' : 'Sync Sessions'}
        </button>

        {syncResult && <DiffTable result={syncResult} />}

        {syncError && <p className="mt-4 text-sm text-destructive">{syncError}</p>}

        {!syncResult && stats && (
          <div className="mt-4">
            <p className="text-xs font-bebas tracking-wider text-muted-foreground mb-2">
              Session Types — {stats.total} total
            </p>
            <div className="flex flex-wrap gap-2">
              {(['BUILD', 'RESEARCH', 'KNOWLEDGE', 'TEST', 'OPS', 'ORIENTATION'] as const).map(
                (type) => (
                  <span key={type} className="text-xs font-mono">
                    <span className="text-foreground">{type}</span>
                    <span className="text-muted-foreground ml-1">{stats.byType[type] ?? 0}</span>
                  </span>
                )
              )}
              {(stats.byType['unclassified'] ?? 0) > 0 && (
                <span className="text-xs font-mono">
                  <span className="text-muted-foreground/60">unclassified</span>
                  <span className="text-muted-foreground ml-1">{stats.byType['unclassified']}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
