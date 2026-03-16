import { useState } from 'react';

interface BackfillResult {
  scanned: number;
  imported: number;
  skipped: number;
  errors: number;
}

interface ClassifyResult {
  classified: number;
  skipped: number;
  errors: number;
}

export default function SettingsView() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BackfillResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [classifying, setClassifying] = useState(false);
  const [classifyResult, setClassifyResult] = useState<ClassifyResult | null>(null);
  const [classifyError, setClassifyError] = useState<string | null>(null);

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

  function runClassify() {
    setClassifying(true);
    setClassifyResult(null);
    setClassifyError(null);
    fetch('/api/classify', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        setClassifyResult(d.data as ClassifyResult);
      })
      .catch(() => {
        setClassifyError('Classify request failed.');
      })
      .finally(() => {
        setClassifying(false);
      });
  }

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between px-0 py-2 border-b border-border">
        <h1 className="font-bebas text-3xl tracking-wider text-foreground">Settings</h1>
      </div>

      <div className="bg-card border border-border rounded-md shadow-sm p-5 max-w-lg">
        <h2 className="font-bebas text-lg tracking-wider text-primary mb-1">Transcript Backfill</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Scan <code className="text-primary">~/.claude/projects/</code> and import historical
          sessions into the registry. Safe to run multiple times — skips already-known sessions.
        </p>

        <div className="flex gap-2">
          <button
            onClick={runBackfill}
            disabled={running}
            className="px-4 py-1.5 text-sm font-medium border border-border rounded hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {running ? 'Running…' : 'Run Backfill'}
          </button>

          <button
            onClick={runClassify}
            disabled={classifying}
            className="px-4 py-1.5 text-sm font-medium border border-border rounded hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {classifying ? 'Classifying…' : 'Classify Sessions'}
          </button>
        </div>

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

        {classifyResult && (
          <div className="mt-4 text-sm space-y-1">
            <p className="text-primary font-medium">
              Classified {classifyResult.classified} sessions ({classifyResult.skipped} skipped)
            </p>
            {classifyResult.errors > 0 && (
              <p className="text-destructive">Errors: {classifyResult.errors}</p>
            )}
          </div>
        )}

        {classifyError && <p className="mt-4 text-sm text-destructive">{classifyError}</p>}
      </div>
    </div>
  );
}
