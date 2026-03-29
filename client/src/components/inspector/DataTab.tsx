import type { WorkflowInstance, AffinityGroup, AffinityGroupType } from '@appystack/shared';
import { useInspectorData } from '../../hooks/useInspectorData.js';
import CollapsibleSection from './CollapsibleSection.js';

// ─── Status Badge (matches WorkflowsView.tsx) ──────────────────────────────

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

// ─── Affinity Type Badge ────────────────────────────────────────────────────

function AffinityTypeBadge({ type }: { type: AffinityGroupType }) {
  const styles: Record<string, string> = {
    story_unit: 'bg-blue-500/15 text-blue-700',
    epic_sprint: 'bg-purple-500/15 text-purple-700',
    ad_hoc: 'bg-zinc-200 text-zinc-600',
    project_phase: 'bg-green-600/15 text-green-700',
  };
  const labels: Record<string, string> = {
    story_unit: 'Story Unit',
    epic_sprint: 'Epic Sprint',
    ad_hoc: 'Ad Hoc',
    project_phase: 'Project Phase',
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[type] ?? styles.ad_hoc}`}
    >
      {labels[type] ?? type}
    </span>
  );
}

// ─── Count Table ────────────────────────────────────────────────────────────

function CountTable({
  data,
  total,
  label,
  maxRows,
}: {
  data: Record<string, number>;
  total: number;
  label: string;
  maxRows?: number;
}) {
  const sorted = Object.entries(data).sort(([, a], [, b]) => b - a);
  const display = maxRows ? sorted.slice(0, maxRows) : sorted;
  const remaining = maxRows ? sorted.length - maxRows : 0;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left">
          <th className="px-3 py-1.5 font-medium text-heading">{label}</th>
          <th className="px-3 py-1.5 font-medium text-heading text-right">Count</th>
          <th className="px-3 py-1.5 font-medium text-heading text-right">%</th>
        </tr>
      </thead>
      <tbody>
        {display.map(([key, count]) => (
          <tr key={key} className="border-b border-border">
            <td className="px-3 py-1.5 text-body">{key}</td>
            <td className="px-3 py-1.5 text-body text-right">{count}</td>
            <td className="px-3 py-1.5 text-body text-right">
              {total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'}%
            </td>
          </tr>
        ))}
        {remaining > 0 && (
          <tr>
            <td colSpan={3} className="px-3 py-1.5 text-muted-foreground text-xs italic">
              {remaining} more...
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

// ─── Sessions Summary Section ───────────────────────────────────────────────

function SessionsSummary({
  summary,
}: {
  summary: { total: number; byType: Record<string, number>; byProject: Record<string, number> };
}) {
  return (
    <div className="space-y-4">
      <div className="text-center py-2">
        <div className="text-4xl font-bold text-heading">{summary.total}</div>
        <div className="text-sm text-muted-foreground">Total Sessions</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-heading mb-2">By Type</h3>
          <CountTable data={summary.byType} total={summary.total} label="Type" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-heading mb-2">By Project</h3>
          <CountTable data={summary.byProject} total={summary.total} label="Project" maxRows={20} />
        </div>
      </div>
    </div>
  );
}

// ─── Workflows Section ──────────────────────────────────────────────────────

function WorkflowsSection({ workflows }: { workflows: WorkflowInstance[] }) {
  if (workflows.length === 0) {
    return <div className="text-sm text-muted-foreground py-2">No workflows created yet</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-3 py-1.5 font-medium text-heading">ID</th>
            <th className="px-3 py-1.5 font-medium text-heading">Type ID</th>
            <th className="px-3 py-1.5 font-medium text-heading">Work Item</th>
            <th className="px-3 py-1.5 font-medium text-heading">Status</th>
            <th className="px-3 py-1.5 font-medium text-heading">Stations</th>
            <th className="px-3 py-1.5 font-medium text-heading">Current Station</th>
          </tr>
        </thead>
        <tbody>
          {workflows.map((wf) => {
            const completed = wf.stations.filter(
              (s) => s.state === 'completed' || s.state === 'skipped'
            ).length;
            const currentStation =
              wf.status === 'not_started'
                ? '--'
                : (wf.stations[wf.current_station]?.action_code ?? '--');
            return (
              <tr key={wf.instance_id} className="border-b border-border">
                <td className="px-3 py-1.5 text-body font-mono text-xs">
                  {wf.instance_id.slice(0, 8)}
                </td>
                <td className="px-3 py-1.5 text-body">{wf.workflow_type_id}</td>
                <td className="px-3 py-1.5 text-body">{wf.work_item_label}</td>
                <td className="px-3 py-1.5">
                  <StatusBadge status={wf.status} />
                </td>
                <td className="px-3 py-1.5 text-body">
                  {completed}/{wf.stations.length}
                </td>
                <td className="px-3 py-1.5 text-body">{currentStation}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Affinity Groups Section ────────────────────────────────────────────────

function AffinityGroupsSection({ groups }: { groups: AffinityGroup[] }) {
  if (groups.length === 0) {
    return <div className="text-sm text-muted-foreground py-2">No affinity groups found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-3 py-1.5 font-medium text-heading">Label</th>
            <th className="px-3 py-1.5 font-medium text-heading">Type</th>
            <th className="px-3 py-1.5 font-medium text-heading">Confidence</th>
            <th className="px-3 py-1.5 font-medium text-heading text-center">Sessions</th>
            <th className="px-3 py-1.5 font-medium text-heading">Domain</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g.group_id} className="border-b border-border">
              <td className="px-3 py-1.5 text-body">{g.label}</td>
              <td className="px-3 py-1.5">
                <AffinityTypeBadge type={g.group_type} />
              </td>
              <td className="px-3 py-1.5 text-body capitalize">{g.confidence}</td>
              <td className="px-3 py-1.5 text-body text-center">{g.session_ids.length}</td>
              <td className="px-3 py-1.5 text-body">{g.domain_overlay ?? '--'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── DataTab ────────────────────────────────────────────────────────────────

export default function DataTab() {
  const { data, loading, error, refresh } = useInspectorData();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        Loading inspector data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-sm">
        <span className="text-destructive">{error}</span>
        <button
          onClick={refresh}
          className="text-xs px-3 py-1 text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <CollapsibleSection title="Sessions Summary">
        <SessionsSummary summary={data.summary.sessions} />
      </CollapsibleSection>

      <CollapsibleSection title={`Workflows (${data.workflows.length})`}>
        <WorkflowsSection workflows={data.workflows} />
      </CollapsibleSection>

      <CollapsibleSection title={`Affinity Groups (${data.affinityGroups.length})`}>
        <AffinityGroupsSection groups={data.affinityGroups} />
      </CollapsibleSection>
    </div>
  );
}
