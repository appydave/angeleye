import { useState, useEffect, useMemo } from 'react';
import type { WorkflowInstance, WorkflowType } from '@appystack/shared';
import WorkflowPipeline from '../components/WorkflowPipeline.js';
import SessionEventsPanel from '../components/SessionEventsPanel.js';
import type { SessionMetadata } from '../components/SessionEventsPanel.js';

// ─── Props ──────────────────────────────────────────────────────────────────

interface WorkflowDetailViewProps {
  workflow: WorkflowInstance | undefined;
  type: WorkflowType | undefined;
  onBack: () => void;
}

// ─── Status Pill ────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: WorkflowInstance['status'] }) {
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

// ─── Main Component ─────────────────────────────────────────────────────────

export default function WorkflowDetailView({ workflow, type, onBack }: WorkflowDetailViewProps) {
  const [selectedStation, setSelectedStation] = useState<number | null>(
    workflow?.current_station ?? null
  );
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Reset selected station when workflow changes
  useEffect(() => {
    setSelectedStation(workflow?.current_station ?? null);
    setActiveSessionId(null);
  }, [workflow?.instance_id]);

  // Derive session info from selected station
  const station = workflow?.stations.find((s) => s.position === selectedStation) ?? null;
  const sessionIds = station?.session_ids ?? [];
  const currentSessionId =
    activeSessionId && sessionIds.includes(activeSessionId)
      ? activeSessionId
      : (sessionIds[0] ?? null);

  // Derive session metadata for the chat panel header
  const sessionMetadata: SessionMetadata | undefined = useMemo(() => {
    if (!currentSessionId || !workflow) return undefined;
    const projectName = workflow.project_dir
      ? (workflow.project_dir.split('/').filter(Boolean).pop() ?? null)
      : null;
    return {
      name: workflow.work_item_label ?? null,
      project: projectName,
      sessionType: station?.action_code ?? null,
      startedAt: station?.started_at ?? workflow.created_at ?? null,
      sessionId: currentSessionId,
    };
  }, [currentSessionId, workflow, station]);

  function handleStationClick(position: number) {
    setSelectedStation(position);
    setActiveSessionId(null); // reset to first session of new station
  }

  function handleSessionChange(id: string) {
    setActiveSessionId(id);
  }

  // Guard: missing data
  if (!workflow || !type) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-surface shrink-0">
          <button
            onClick={onBack}
            className="text-xs px-3 py-1 text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary rounded"
          >
            &larr; Back to Workflows
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Workflow not found.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border bg-surface">
        <div className="mb-1">
          <button
            onClick={onBack}
            className="text-xs px-3 py-1 text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary rounded"
          >
            &larr; Back to Workflows
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bebas text-2xl tracking-wider text-primary">
            {workflow.work_item_label}
          </span>
          <span className="text-sm text-muted-foreground">{workflow.work_item_id}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{type.name}</span>
          <span className="text-xs text-muted-foreground">&middot;</span>
          <span className="text-xs text-muted-foreground">{type.domain}</span>
          <span className="text-xs text-muted-foreground">&middot;</span>
          <StatusPill status={workflow.status} />
        </div>
      </div>

      {/* Pipeline — fixed height, non-scrolling */}
      <div className="shrink-0 px-4" style={{ minHeight: 200 }}>
        <WorkflowPipeline
          workflow={workflow}
          type={type}
          selectedStation={selectedStation}
          onStationClick={handleStationClick}
        />
      </div>

      {/* Chat panel — constrained center column */}
      <div className="flex-1 flex justify-center overflow-hidden min-h-0 border-t border-border">
        <div className="flex flex-col w-full min-h-0" style={{ maxWidth: 800, minWidth: 480 }}>
          {sessionIds.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No sessions for this station
            </div>
          ) : (
            <SessionEventsPanel
              sessionId={currentSessionId}
              sessionIds={sessionIds.length > 1 ? sessionIds : undefined}
              onSessionChange={sessionIds.length > 1 ? handleSessionChange : undefined}
              metadata={sessionMetadata}
            />
          )}
        </div>
      </div>
    </div>
  );
}
