import { useEffect, useRef, useState } from 'react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import type { RegistryEntry, WorkspaceEntry } from '@appystack/shared';

// ─── Folder Inference ─────────────────────────────────────────────────────────

function inferWorkspace(
  session: RegistryEntry,
  workspaces: WorkspaceEntry[]
): WorkspaceEntry | null {
  if (!session.project_dir) return null;
  const segments = session.project_dir.split('/').filter(Boolean).slice(-3);
  return (
    workspaces.find((ws) =>
      segments.some(
        (seg) =>
          seg.toLowerCase().includes(ws.name.toLowerCase()) ||
          ws.name.toLowerCase().includes(seg.toLowerCase())
      )
    ) ?? null
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(isoString: string): string {
  const secs = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

function sessionLabel(entry: RegistryEntry): string {
  return entry.name ?? entry.project ?? entry.session_id?.slice(0, 8) ?? 'unknown';
}

function statusDot(isoString: string): { symbol: string; className: string } {
  const secs = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (secs < 30) return { symbol: '●', className: 'text-green-500' };
  if (secs < 120) return { symbol: '●', className: 'text-amber-400' };
  return { symbol: '○', className: 'text-muted-foreground' };
}

// ─── Draggable Session ────────────────────────────────────────────────────────

interface DraggableSessionProps {
  session: RegistryEntry;
  workspaces: WorkspaceEntry[];
  onAssign: (sessionId: string, workspaceId: string | null) => void;
  onDismiss: (sessionId: string, currentTags: string[]) => void;
}

function DraggableSession({ session, workspaces, onAssign, onDismiss }: DraggableSessionProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: session.session_id,
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dot = statusDot(session.last_active);
  const inferredWs = inferWorkspace(session, workspaces);
  const showInferenceBadge = inferredWs !== null && !session.tags.includes('inference:dismissed');

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  useEffect(() => {
    if (!showDropdown) return;
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showDropdown]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col gap-1 px-3 py-2 bg-background border border-border rounded text-sm cursor-grab active:cursor-grabbing transition-opacity${isDragging ? ' opacity-50' : ''}`}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`${dot.className} text-base shrink-0`}>{dot.symbol}</span>
          <span className="text-foreground font-medium truncate">{sessionLabel(session)}</span>
          <span className="text-muted-foreground text-xs shrink-0">
            {timeAgo(session.last_active)}
          </span>
        </div>
        <div
          className="relative shrink-0"
          ref={dropdownRef}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="text-muted-foreground hover:text-primary transition-colors text-xs px-2 py-1 border border-border rounded hover:border-primary"
          >
            → Assign
          </button>
          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 z-10 bg-surface border border-border rounded shadow-lg min-w-36">
              {workspaces.length === 0 && (
                <div className="px-3 py-2 text-muted-foreground text-xs">No workspaces yet</div>
              )}
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    onAssign(session.session_id, ws.id);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-surface-hover transition-colors"
                >
                  {ws.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {showInferenceBadge && inferredWs && (
        <div className="flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
          <span className="text-xs text-muted-foreground">Looks like {inferredWs.name}?</span>
          <button
            onClick={() => onAssign(session.session_id, inferredWs.id)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors px-1"
            title="Yes, assign to this workspace"
          >
            [✓]
          </button>
          <button
            onClick={() => onDismiss(session.session_id, session.tags)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
            title="No, dismiss this suggestion"
          >
            [✗]
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Draggable Workspace Session (non-inbox) ──────────────────────────────────

interface DraggableWorkspaceSessionProps {
  session: RegistryEntry;
}

function DraggableWorkspaceSession({ session }: DraggableWorkspaceSessionProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: session.session_id,
  });
  const dot = statusDot(session.last_active);

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm bg-background border border-border cursor-grab active:cursor-grabbing transition-opacity${isDragging ? ' opacity-50' : ''}`}
      {...listeners}
      {...attributes}
    >
      <span className={`${dot.className} text-base shrink-0`}>{dot.symbol}</span>
      <span className="text-foreground font-medium truncate flex-1">{sessionLabel(session)}</span>
      <span className="text-muted-foreground text-xs shrink-0">{timeAgo(session.last_active)}</span>
    </div>
  );
}

// ─── Droppable Zone ───────────────────────────────────────────────────────────

interface DroppableZoneProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

function DroppableZone({ id, children, className = '' }: DroppableZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`${className}${isOver ? ' ring-1 ring-primary' : ''}`}>
      {children}
    </div>
  );
}

// ─── Workspace Card ───────────────────────────────────────────────────────────

interface WorkspaceCardProps {
  workspace: WorkspaceEntry;
  sessions: RegistryEntry[];
}

function WorkspaceCard({ workspace, sessions }: WorkspaceCardProps) {
  return (
    <div className="border border-border rounded bg-surface">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="font-bebas tracking-wider text-primary text-lg">{workspace.name}</span>
        <span className="text-muted-foreground text-xs">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </span>
      </div>
      <DroppableZone id={workspace.id} className="p-2 flex flex-col gap-1.5 min-h-12 rounded-b">
        {sessions.length === 0 && (
          <div className="text-muted-foreground text-xs px-1 py-2 text-center">
            (empty — drop here)
          </div>
        )}
        {sessions.map((session) => (
          <DraggableWorkspaceSession key={session.session_id} session={session} />
        ))}
      </DroppableZone>
    </div>
  );
}

// ─── New Workspace Input ──────────────────────────────────────────────────────

interface NewWorkspaceInputProps {
  onCreated: (workspace: WorkspaceEntry) => void;
  onCancel: () => void;
}

function NewWorkspaceInput({ onCreated, onCancel }: NewWorkspaceInputProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    })
      .then((r) => r.json())
      .then((body: { status: string; data?: WorkspaceEntry }) => {
        if (body.data) {
          onCreated(body.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Workspace name…"
        disabled={loading}
        className="text-sm bg-surface border border-primary rounded px-3 py-1 text-foreground placeholder-muted-foreground outline-none focus:ring-1 focus:ring-primary"
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {loading ? '…' : 'Create'}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-xs px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        Cancel
      </button>
    </form>
  );
}

// ─── OrganiserView ────────────────────────────────────────────────────────────

export default function OrganiserView() {
  const [sessions, setSessions] = useState<RegistryEntry[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceEntry[]>([]);
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);

  // Fetch on mount only — this view is visited occasionally, no polling needed
  useEffect(() => {
    fetch('/api/sessions')
      .then((r) => r.json())
      .then((body: { status: string; data?: { sessions?: RegistryEntry[] } }) => {
        setSessions(body.data?.sessions ?? []);
      })
      .catch(() => {});

    fetch('/api/workspaces')
      .then((r) => r.json())
      .then((body: { status: string; data?: { workspaces?: WorkspaceEntry[] } }) => {
        setWorkspaces(body.data?.workspaces ?? []);
      })
      .catch(() => {});
  }, []);

  const inboxSessions = sessions
    .filter((s) => s.workspace_id === null)
    .sort((a, b) => new Date(b.last_active).getTime() - new Date(a.last_active).getTime());

  const handleAssign = (sessionId: string, workspaceId: string | null) => {
    // Optimistic update immediately
    setSessions((prev) =>
      prev.map((s) => (s.session_id === sessionId ? { ...s, workspace_id: workspaceId } : s))
    );

    fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: workspaceId }),
    })
      .then((r) => r.json())
      .then((body: { status: string; data?: RegistryEntry }) => {
        if (body.data) {
          setSessions((prev) => prev.map((s) => (s.session_id === sessionId ? body.data! : s)));
        }
      })
      .catch(() => {});
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const sessionId = active.id as string;
    const targetWorkspaceId = over.id === 'inbox' ? null : (over.id as string);
    handleAssign(sessionId, targetWorkspaceId);
  };

  const handleDismiss = (sessionId: string, currentTags: string[]) => {
    const newTags = [...currentTags, 'inference:dismissed'];
    // Optimistic update
    setSessions((prev) =>
      prev.map((s) => (s.session_id === sessionId ? { ...s, tags: newTags } : s))
    );

    fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: newTags }),
    })
      .then((r) => r.json())
      .then((body: { status: string; data?: RegistryEntry }) => {
        if (body.data) {
          setSessions((prev) => prev.map((s) => (s.session_id === sessionId ? body.data! : s)));
        }
      })
      .catch(() => {});
  };

  const handleWorkspaceCreated = (workspace: WorkspaceEntry) => {
    setWorkspaces((prev) => [...prev, workspace]);
    setShowNewWorkspace(false);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface shrink-0">
          <h1 className="font-bebas text-3xl tracking-wider text-primary">ORGANISER</h1>
          <div className="flex items-center gap-3">
            {showNewWorkspace ? (
              <NewWorkspaceInput
                onCreated={handleWorkspaceCreated}
                onCancel={() => setShowNewWorkspace(false)}
              />
            ) : (
              <button
                onClick={() => setShowNewWorkspace(true)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary rounded px-3 py-1"
              >
                + New Workspace
              </button>
            )}
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: INBOX */}
          <div className="flex flex-col w-1/2 border-r border-border min-h-0">
            <div className="px-4 py-2 border-b border-border bg-surface shrink-0 flex items-center gap-2">
              <span className="font-bebas tracking-wider text-primary text-lg">INBOX</span>
              <span className="text-muted-foreground text-xs">
                {inboxSessions.length} unassigned
              </span>
            </div>
            <DroppableZone
              id="inbox"
              className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 rounded"
            >
              {inboxSessions.length === 0 && (
                <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                  No unassigned sessions.
                </div>
              )}
              {inboxSessions.map((session) => (
                <DraggableSession
                  key={session.session_id}
                  session={session}
                  workspaces={workspaces}
                  onAssign={handleAssign}
                  onDismiss={handleDismiss}
                />
              ))}
            </DroppableZone>
          </div>

          {/* Right: WORKSPACES */}
          <div className="flex flex-col w-1/2 min-h-0">
            <div className="px-4 py-2 border-b border-border bg-surface shrink-0 flex items-center gap-2">
              <span className="font-bebas tracking-wider text-primary text-lg">WORKSPACES</span>
              <span className="text-muted-foreground text-xs">
                {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              {workspaces.length === 0 && (
                <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                  No workspaces yet — create one above.
                </div>
              )}
              {workspaces.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  workspace={workspace}
                  sessions={sessions.filter((s) => s.workspace_id === workspace.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
}
