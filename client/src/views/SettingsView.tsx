import { useState } from 'react';

interface BackfillResult {
  scanned: number;
  imported: number;
  skipped: number;
  errors: number;
}

export default function SettingsView() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BackfillResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function runBackfill() {
    setRunning(true);
    setResult(null);
    setError(null);
    fetch('/api/backfill', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        setResult(d.data as BackfillResult);
      })
      .catch(() => {
        setError('Backfill request failed.');
      })
      .finally(() => {
        setRunning(false);
      });
  }

  return (
    <div>
      <h1 className="font-bebas text-3xl tracking-wider text-primary mb-6">Settings</h1>

      <div className="border border-border rounded p-4 max-w-md">
        <h2 className="font-bebas text-lg tracking-wider text-primary mb-1">Transcript Backfill</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Scan <code className="text-primary">~/.claude/projects/</code> and import historical
          sessions into the registry. Safe to run multiple times — skips already-known sessions.
        </p>

        <button
          onClick={runBackfill}
          disabled={running}
          className="px-4 py-1.5 text-sm font-medium border border-border rounded hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {running ? 'Running…' : 'Run Backfill'}
        </button>

        {result && (
          <div className="mt-4 text-sm space-y-1">
            <p className="text-primary font-medium">Done</p>
            <p className="text-muted-foreground">Scanned: {result.scanned}</p>
            <p className="text-primary">Imported: {result.imported}</p>
            <p className="text-muted-foreground">Skipped: {result.skipped}</p>
            {result.errors > 0 && <p className="text-destructive">Errors: {result.errors}</p>}
          </div>
        )}

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
