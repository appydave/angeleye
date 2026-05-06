import { useEffect, useState } from 'react';
import type { DiagnosticsResponse, ApiResponse } from '@appystack/shared';

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: 'ok' | 'warn' | 'alert' | 'neutral';
}) {
  const toneClass = {
    ok: 'border-emerald-500/40',
    warn: 'border-amber-500/40',
    alert: 'border-red-500/40',
    neutral: 'border-border',
  }[tone ?? 'neutral'];
  return (
    <div className={`rounded border ${toneClass} bg-card px-3 py-2`}>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-mono text-heading">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

export default function DiagnosticsView() {
  const [data, setData] = useState<DiagnosticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/diagnostics');
      const json = (await res.json()) as ApiResponse<DiagnosticsResponse>;
      if (json.status !== 'ok' || !json.data) throw new Error(json.error || 'request failed');
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="border-b border-border bg-surface px-4 py-2 flex items-center gap-4 shrink-0">
        <h1 className="font-bebas text-3xl tracking-wider text-primary">DIAGNOSTICS</h1>
        <div className="ml-auto flex items-center gap-3">
          {data && (
            <span className="text-xs text-muted-foreground">
              generated {new Date(data.generated_at).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="text-xs px-3 py-1 text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary rounded disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {error && (
          <div className="rounded border border-red-500/40 bg-red-500/5 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {data && (
          <>
            <section className="rounded border border-primary/40 bg-primary/5 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                At a glance
              </div>
              <div className="text-sm text-heading">
                {data.registry.total} known sessions ·{' '}
                <span className="text-emerald-400">
                  {Math.round(
                    ((data.registry.with_jsonl + data.registry.archive_only) /
                      data.registry.total) *
                      100
                  )}
                  %
                </span>{' '}
                have data · <span className="text-emerald-400">{data.tags.llm_enriched}</span>{' '}
                reviewed by LLM ({Math.round((data.tags.llm_enriched / data.registry.total) * 100)}
                %) · <span className="text-amber-400">{data.tags.heuristic_only}</span> still
                auto-classified
                {data.subagents.teammate_message_files !== undefined && (
                  <>
                    {' · '}
                    <span className="text-blue-400">
                      {data.subagents.teammate_message_files}
                    </span>{' '}
                    subagent legs detected
                  </>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-2">
                Where the data lives
              </h2>
              <p className="text-xs text-muted-foreground mb-2">
                Every session row in the registry should have data somewhere — either Claude
                Code&apos;s raw transcript or AngelEye&apos;s archived event stream. &ldquo;True
                phantom&rdquo; rows have neither and aren&apos;t recoverable.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard
                  label="sessions in registry"
                  value={data.registry.total}
                  hint="everything AngelEye knows about"
                  tone="neutral"
                />
                <StatCard
                  label="raw transcript present"
                  value={data.registry.with_jsonl}
                  hint="Claude Code still has it"
                  tone="ok"
                />
                <StatCard
                  label="archive only"
                  value={data.registry.archive_only}
                  hint="raw pruned upstream, archive saved us"
                  tone="warn"
                />
                <StatCard
                  label="data lost"
                  value={data.registry.true_phantom}
                  hint="no transcript anywhere"
                  tone={data.registry.true_phantom > 0 ? 'alert' : 'ok'}
                />
                <StatCard
                  label="flagged junk"
                  value={data.registry.is_junk}
                  hint="ghost or accidental sessions"
                  tone="neutral"
                />
              </div>
            </section>

            <section>
              <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-2">
                How sessions are classified
              </h2>
              <p className="text-xs text-muted-foreground mb-2">
                Rule-based heuristics run on every session at ingest time. LLM enrichment is a
                manual second pass that overrides the heuristic with a considered classification.
                Untagged rows have neither.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard
                  label="LLM-reviewed"
                  value={data.tags.llm_enriched}
                  hint="manually classified by you"
                  tone="ok"
                />
                <StatCard
                  label="auto-classified"
                  value={data.tags.heuristic_only}
                  hint="awaiting LLM review"
                  tone="neutral"
                />
                <StatCard
                  label="from old import"
                  value={data.tags.migrated}
                  hint="legacy tags from migration"
                  tone="neutral"
                />
                <StatCard
                  label="untagged"
                  value={data.tags.untagged}
                  hint="no classification at all"
                  tone="neutral"
                />
                <StatCard
                  label="build.feature backlog"
                  value={data.tags.build_feature_queue}
                  hint="generic-fallback bucket; needs review"
                  tone={data.tags.build_feature_queue > 0 ? 'warn' : 'ok'}
                />
              </div>
            </section>

            <section>
              <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-2">
                Subagent detection (Agent Teams)
              </h2>
              <p className="text-xs text-muted-foreground mb-2">
                When Claude Code&apos;s Agent Teams feature spawns a teammate, that work runs in its
                own session. AngelEye flags those so they don&apos;t get classified as standalone
                work.
              </p>
              {data.subagents.snapshot_present ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <StatCard
                    label="subagent sessions found"
                    value={data.subagents.teammate_message_files ?? 0}
                    hint="legs of parent campaigns"
                  />
                  <StatCard
                    label="flagged in registry"
                    value={data.subagents.field_populated ? 'yes' : 'no'}
                    hint="backfill complete"
                    tone={data.subagents.field_populated ? 'ok' : 'warn'}
                  />
                  <StatCard
                    label="snapshot file"
                    value="present"
                    hint={data.subagents.snapshot_path}
                    tone="neutral"
                  />
                </div>
              ) : (
                <div className="rounded border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-200">
                  Snapshot missing — run{' '}
                  <code className="bg-card px-1 rounded">npm run audit:registry</code> to populate.
                </div>
              )}
            </section>

            <section>
              <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-2">
                Sessions on disk we never ingested
              </h2>
              <p className="text-xs text-muted-foreground mb-2">
                These are Claude Code session files that exist on your machine but never made it
                into AngelEye&apos;s registry — usually because hooks weren&apos;t running when the
                session ran. Top concentrations show projects where AngelEye is undercounting.
              </p>
              {data.orphans.snapshot_present ? (
                <div className="space-y-2">
                  <StatCard
                    label="total orphan files"
                    value={data.orphans.count ?? 0}
                    hint="sessions on disk but not in registry"
                    tone="warn"
                  />
                  {data.orphans.top_dirs && data.orphans.top_dirs.length > 0 && (
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-muted-foreground border-b border-border">
                          <th className="text-left py-1 px-2">Project</th>
                          <th className="text-right py-1 px-2">Sessions missed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.orphans.top_dirs.map((d) => (
                          <tr key={d.dir} className="border-b border-border/40">
                            <td className="py-1 px-2 font-mono text-xs">{d.dir}</td>
                            <td className="py-1 px-2 text-right">{d.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Snapshot not present — run audit script to populate.
                </div>
              )}
            </section>

            <section>
              <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-2">
                Things to fix (open architectural issues)
              </h2>
              <p className="text-xs text-muted-foreground mb-2">
                Known data-quality problems that aren&apos;t yet resolved. Each links to a doc with
                the full context and a re-runnable verification script.
              </p>
              <ul className="space-y-1 text-sm">
                {data.open_issues.map((issue) => (
                  <li key={issue.id} className="flex items-start gap-2">
                    <span className="text-amber-400">●</span>
                    <span>
                      <span className="text-heading">{issue.title}</span>
                      <span className="text-muted-foreground ml-2">
                        — see <code className="text-xs">{issue.doc_link}</code>
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
