import { useMemo, useState } from 'react';
import type { WorkflowInstance, WorkflowType } from '@appystack/shared';
import { useWorkflows } from '../hooks/useWorkflows.js';
import { timeAgo } from '../utils/session-helpers.js';
import WorkflowDetailView from './WorkflowDetailView.js';

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WorkflowInstance['status'] }) {
  const styles: Record<string, string> = {
    not_started: 'bg-zinc-200 text-zinc-600',
    in_progress: 'bg-amber-500/15 text-amber-700',
    closed: 'bg-green-600/15 text-green-700',
  };
  const labels: Record<string, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    closed: 'Closed',
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[status] ?? styles.not_started}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

// ─── Current Station Helper ──────────────────────────────────────────────────

function currentStationLabel(workflow: WorkflowInstance, type: WorkflowType | undefined): string {
  if (workflow.status === 'not_started') return '--';
  const station = workflow.stations.find((s) => s.position === workflow.current_station);
  if (!station) return '--';
  const config = type?.stations.find((s) => s.position === station.position);
  const identity = config?.identity ? ` \u2014 ${config.identity}` : '';
  return `${station.action_code}${identity}`;
}

// ─── Progress Helper ─────────────────────────────────────────────────────────

function progressLabel(workflow: WorkflowInstance): string {
  const active = workflow.stations.filter((s) => s.session_ids.length > 0).length;
  return `${active}/${workflow.stations.length} stations`;
}

// ─── Session Count ───────────────────────────────────────────────────────────

function sessionCount(workflow: WorkflowInstance): number {
  return workflow.stations.reduce((sum, s) => sum + s.session_ids.length, 0);
}

// ─── WorkflowsView ──────────────────────────────────────────────────────────

export default function WorkflowsView() {
  const { data, loading, error, refresh } = useWorkflows();
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  const typeMap = useMemo(() => {
    if (!data?.types) return new Map<string, WorkflowType>();
    return new Map(data.types.map((t) => [t.id, t]));
  }, [data?.types]);

  const workflows = data?.workflows ?? [];
  const types = data?.types ?? [];

  async function handleSeed() {
    setSeeding(true);
    setSeedMessage(null);
    try {
      const res = await fetch('/api/workflows/seed', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || json.status !== 'ok') {
        setSeedMessage(json.message ?? json.error ?? 'Seed failed');
      } else {
        const d = json.data;
        setSeedMessage(
          `Created ${d.workflows_created} workflows, routed ${d.sessions_routed} sessions`
        );
        refresh();
      }
    } catch (err) {
      setSeedMessage(err instanceof Error ? err.message : 'Seed request failed');
    } finally {
      setSeeding(false);
    }
  }

  if (selectedWorkflowId) {
    const wf = workflows.find((w) => w.instance_id === selectedWorkflowId);
    const wfType = wf ? typeMap.get(wf.workflow_type_id) : undefined;
    return (
      <WorkflowDetailView workflow={wf} type={wfType} onBack={() => setSelectedWorkflowId(null)} />
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface shrink-0">
        <h1 className="font-bebas text-3xl tracking-wider text-primary">WORKFLOWS</h1>
        {!loading && !error && (
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-xs">
              {types.length} type{types.length !== 1 ? 's' : ''}
            </span>
            <span className="text-muted-foreground text-xs">
              {workflows.length} instance{workflows.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="text-xs px-3 py-1 text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {seeding ? 'Syncing...' : 'Sync Sessions'}
            </button>
            <button
              onClick={refresh}
              className="text-xs px-3 py-1 text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary rounded"
            >
              Refresh
            </button>
            {seedMessage && <span className="text-xs text-muted-foreground">{seedMessage}</span>}
          </div>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center flex-1 text-muted-foreground text-sm">
          Loading workflows...
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-sm">
          <span className="text-destructive">{error}</span>
          <button
            onClick={refresh}
            className="text-xs px-3 py-1 text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary rounded"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-sm px-4 text-center">
              <span className="text-muted-foreground">
                No workflow instances yet. Workflows are created when BMAD story sessions are
                tracked.
              </span>
              <button
                disabled={seeding}
                onClick={handleSeed}
                className="px-4 py-1.5 text-xs font-medium border border-border hover:border-primary text-muted-foreground hover:text-primary rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {seeding ? 'Seeding...' : 'Seed from Sessions'}
              </button>
              {seedMessage && <span className="text-xs text-muted-foreground">{seedMessage}</span>}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-left text-muted-foreground text-xs">
                  <th className="px-4 py-2 font-medium">Work Item</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Progress</th>
                  <th className="px-4 py-2 font-medium">Current Station</th>
                  <th className="px-4 py-2 font-medium text-center">Sessions</th>
                  <th className="px-4 py-2 font-medium text-right">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {workflows.map((wf) => {
                  const wfType = typeMap.get(wf.workflow_type_id);
                  return (
                    <tr
                      key={wf.instance_id}
                      className="border-b border-border hover:bg-surface-hover transition-colors cursor-pointer"
                      onClick={() => setSelectedWorkflowId(wf.instance_id)}
                    >
                      <td className="px-4 py-2 font-medium text-foreground">
                        {wf.work_item_label}
                      </td>
                      <td className="px-4 py-2 text-foreground">
                        <span>{wfType?.name ?? wf.workflow_type_id}</span>
                        {wfType?.domain && (
                          <span
                            className="ml-2 text-[10px] font-medium uppercase"
                            style={{
                              padding: '1px 6px',
                              borderRadius: 3,
                              background: '#c8841a20',
                              color: '#b07518',
                            }}
                          >
                            {wfType.domain}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge status={wf.status} />
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{progressLabel(wf)}</td>
                      <td className="px-4 py-2 text-foreground">
                        {currentStationLabel(wf, wfType)}
                      </td>
                      <td className="px-4 py-2 text-center text-muted-foreground">
                        {sessionCount(wf)}
                      </td>
                      <td className="px-4 py-2 text-right text-muted-foreground">
                        {timeAgo(wf.updated_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
