import { useState, useEffect } from 'react';

interface SyncResult {
  imported: number;
  classified: number;
  alreadyUpToDate: number;
  errors: number;
}

interface LastSyncRecord {
  timestamp: string;
  imported: number;
  classified: number;
}

type SessionType = 'BUILD' | 'TEST' | 'RESEARCH' | 'KNOWLEDGE' | 'OPS' | 'ORIENTATION';

interface StatsResult {
  byType: Record<SessionType | 'unclassified', number>;
  total: number;
}

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

      <div className="bg-card border border-border rounded-md shadow-sm p-5 max-w-lg">
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

        {syncResult && (
          <div className="mt-4 text-sm space-y-1">
            <p className="text-primary font-medium">Sync complete</p>
            {syncResult.imported > 0 && (
              <p className="text-primary">
                {syncResult.imported} new session{syncResult.imported !== 1 ? 's' : ''} imported
              </p>
            )}
            {syncResult.classified > 0 && (
              <p className="text-primary">
                {syncResult.classified} session{syncResult.classified !== 1 ? 's' : ''} classified
              </p>
            )}
            <p className="text-muted-foreground">{syncResult.alreadyUpToDate} already up to date</p>
            {syncResult.errors > 0 && (
              <p className="text-destructive">Errors: {syncResult.errors}</p>
            )}
          </div>
        )}

        {syncError && <p className="mt-4 text-sm text-destructive">{syncError}</p>}

        {stats && (
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
