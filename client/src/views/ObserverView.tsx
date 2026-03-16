import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  AngelEyeEvent,
  RegistryEntry,
  ServerToClientEvents,
  ClientToServerEvents,
} from '@appystack/shared';
import { SOCKET_EVENTS } from '@appystack/shared';
import { sessionLabel, statusDot, timeAgo } from '../utils/session-helpers';

// Connect once outside component to avoid reconnecting on re-renders
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('/', { path: '/socket.io' });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function eventSummary(event: AngelEyeEvent): string {
  switch (event.event) {
    case 'tool_use': {
      const tool = event.tool ?? 'unknown tool';
      if (event.tool_summary) {
        const keys = Object.keys(event.tool_summary);
        if (keys.length > 0) {
          const first = event.tool_summary[keys[0]];
          return `${tool} — ${String(first).slice(0, 60)}`;
        }
      }
      return tool;
    }
    case 'user_prompt':
      return (event.prompt ?? '').slice(0, 80);
    case 'stop':
      return `stop: ${event.reason ?? 'unknown'}`;
    case 'session_start':
      return `session started`;
    case 'session_end':
      return `session ended`;
    case 'subagent_start':
      return `subagent started${event.agent_type ? ` (${event.agent_type})` : ''}`;
    case 'subagent_stop':
      return `subagent stopped${event.reason ? `: ${event.reason}` : ''}`;
    default:
      return event.event;
  }
}

function formatTimestamp(isoString: string): string {
  const d = new Date(isoString);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function pulseDisplay(idleSecs: number, status: string): { text: string; className: string } {
  if (status !== 'active') return { text: '—', className: 'text-muted-foreground' };
  const text = idleSecs >= 60 ? `${Math.floor(idleSecs / 60)}m` : `${idleSecs}s`;
  if (idleSecs >= 15) return { text, className: 'text-red-400' };
  if (idleSecs >= 8) return { text, className: 'text-amber-400' };
  return { text, className: 'text-green-500' };
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface SessionState {
  entry: RegistryEntry;
  events: AngelEyeEvent[];
  idleSecs: number;
}

interface FocusEvents {
  sessionId: string;
  events: AngelEyeEvent[];
}

// ─── Component ───────────────────────────────────────────────────────────────

function sessionTypeBadgeClass(sessionType: string): string {
  switch (sessionType) {
    case 'BUILD':
      return 'bg-foreground/85 text-primary';
    case 'TEST':
      return 'bg-foreground/85 text-sky-300';
    case 'RESEARCH':
      return 'bg-foreground/85 text-purple-300';
    case 'KNOWLEDGE':
      return 'bg-foreground/85 text-green-400';
    case 'OPS':
      return 'bg-foreground/85 text-orange-300';
    case 'ORIENTATION':
      return 'bg-foreground/40 text-[#d4c9b8]';
    default:
      return '';
  }
}

export default function ObserverView() {
  const [sessions, setSessions] = useState<SessionState[]>([]);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [focusEvents, setFocusEvents] = useState<FocusEvents | null>(null);
  const [, setTick] = useState(0); // forces re-render for live time displays
  const [panelHeight, setPanelHeight] = useState(240);
  const [hideJunk, setHideJunk] = useState(true);
  const idleCounters = useRef<Record<string, number>>({});
  const dragState = useRef<{ startY: number; startHeight: number } | null>(null);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    void fetch('/api/sessions')
      .then((r) => r.json())
      .then((body: { status: string; data?: { sessions?: RegistryEntry[] } }) => {
        const entries: RegistryEntry[] = body.data?.sessions ?? [];
        setSessions(
          entries.map((entry) => ({
            entry,
            events: [],
            idleSecs: Math.floor((Date.now() - new Date(entry.last_active).getTime()) / 1000),
          }))
        );
        // Seed idle counters from server last_active
        entries.forEach((e) => {
          idleCounters.current[e.session_id] = Math.floor(
            (Date.now() - new Date(e.last_active).getTime()) / 1000
          );
        });
      })
      .catch(() => {
        // Server may be unavailable on first load — silently ignore and wait for socket events
      });
  }, []);

  // ── Socket listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const handleEvent = (event: AngelEyeEvent) => {
      idleCounters.current[event.session_id] = 0;

      setSessions((prev) => {
        const idx = prev.findIndex((s) => s.entry.session_id === event.session_id);
        let next: SessionState[];

        if (idx === -1) {
          // New session not yet in list — create a minimal entry
          const newEntry: RegistryEntry = {
            session_id: event.session_id,
            project: event.cwd?.split('/').pop() ?? event.session_id.slice(0, 8),
            project_dir: event.cwd ?? '',
            started_at: event.ts,
            last_active: event.ts,
            name: null,
            tags: [],
            workspace_id: null,
            status: 'active',
            source: event.source,
          };
          next = [{ entry: newEntry, events: [event], idleSecs: 0 }, ...prev];
        } else {
          const existing = prev[idx];
          const updatedEntry: RegistryEntry = {
            ...existing.entry,
            last_active: event.ts,
          };
          const updatedSession: SessionState = {
            entry: updatedEntry,
            events: [...existing.events, event].slice(-200),
            idleSecs: 0,
          };
          next = [...prev];
          next[idx] = updatedSession;
        }

        // Re-sort by last_active descending
        return next.sort(
          (a, b) =>
            new Date(b.entry.last_active).getTime() - new Date(a.entry.last_active).getTime()
        );
      });

      // Update focus panel if watching this session
      if (focusedId === event.session_id) {
        setFocusEvents((prev) => {
          if (!prev || prev.sessionId !== event.session_id) return prev;
          return {
            sessionId: event.session_id,
            events: [...prev.events, event].slice(-10),
          };
        });
      }
    };

    socket.on(SOCKET_EVENTS.ANGELEYE_EVENT, handleEvent);
    return () => {
      socket.off(SOCKET_EVENTS.ANGELEYE_EVENT, handleEvent);
    };
  }, [focusedId]);

  // ── Idle counter tick ──────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      Object.keys(idleCounters.current).forEach((id) => {
        idleCounters.current[id] = (idleCounters.current[id] ?? 0) + 1;
      });
      setSessions((prev) =>
        prev.map((s) => ({
          ...s,
          idleSecs: idleCounters.current[s.entry.session_id] ?? s.idleSecs + 1,
        }))
      );
      setTick((t) => t + 1); // also force re-render for timeAgo / statusDot
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Focus panel fetch ──────────────────────────────────────────────────────
  const handleRowClick = (sessionId: string) => {
    if (focusedId === sessionId) {
      setFocusedId(null);
      setFocusEvents(null);
      return;
    }
    setFocusedId(sessionId);
    void fetch(`/api/sessions/${sessionId}/events`)
      .then((r) => r.json())
      .then((body: { status: string; data?: { events?: AngelEyeEvent[] } }) => {
        const events = body.data?.events ?? [];
        setFocusEvents({ sessionId, events });
      })
      .catch(() => {
        // Server may be unavailable — silently ignore
      });
  };

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragState.current = { startY: e.clientY, startHeight: panelHeight };

      const onMove = (ev: MouseEvent) => {
        if (!dragState.current) return;
        const delta = dragState.current.startY - ev.clientY;
        const next = Math.max(100, Math.min(600, dragState.current.startHeight + delta));
        setPanelHeight(next);
      };

      const onUp = () => {
        dragState.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [panelHeight]
  );

  const activeSessions = sessions.filter((s) => s.entry.status === 'active');
  const anyActive = activeSessions.length > 0;
  const visibleSessions = hideJunk ? sessions.filter((s) => s.entry.is_junk !== true) : sessions;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Layer 1: Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <h1 className="font-bebas text-3xl tracking-wider text-foreground">Observer</h1>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </span>
          <span
            className={anyActive ? 'text-green-500 text-lg' : 'text-muted-foreground text-lg'}
            title={anyActive ? 'Active sessions' : 'No active sessions'}
          >
            ●
          </span>
        </div>
      </div>

      {/* Column Header Row */}
      <div className="flex items-center gap-3 px-4 py-2 shrink-0 bg-foreground">
        <span className="w-4 shrink-0" />
        <span className="font-bebas tracking-wider text-[#d4c9b8] text-xs w-32 shrink-0 opacity-70">
          SESSION
        </span>
        <span className="font-bebas tracking-wider text-[#d4c9b8] text-xs flex-1 opacity-70">
          LAST ACTIVITY
        </span>
        <span className="font-bebas tracking-wider text-[#d4c9b8] text-xs w-16 text-right shrink-0 opacity-70">
          WHEN
        </span>
        <span className="font-bebas tracking-wider text-[#d4c9b8] text-xs w-12 text-right shrink-0 opacity-70">
          PULSE
        </span>
        <button
          onClick={() => setHideJunk((v) => !v)}
          className="text-[10px] text-muted-foreground hover:text-primary cursor-pointer font-bebas tracking-wider shrink-0 bg-transparent border-none p-0"
        >
          {hideJunk ? 'show junk' : 'hide junk'}
        </button>
      </div>

      {/* Layer 2: Activity Feed */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 flex flex-col gap-1.5">
        {sessions.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No sessions yet — waiting for Claude Code activity.
          </div>
        )}
        {visibleSessions.map((s) => {
          const dot = statusDot(s.entry.last_active);
          const lastEvent = s.events.length > 0 ? s.events[s.events.length - 1] : null;
          const isFocused = focusedId === s.entry.session_id;
          const sessionType = s.entry.session_type;
          const badgeClass = sessionType ? sessionTypeBadgeClass(sessionType) : '';
          return (
            <div
              key={s.entry.session_id}
              onClick={() => handleRowClick(s.entry.session_id)}
              className={[
                'flex items-start gap-3 px-3 py-2.5 cursor-pointer rounded-md border border-border bg-card shadow-sm hover:shadow-md hover:bg-[#faf8f4] transition-all text-sm',
                isFocused
                  ? 'border-l-[3px] border-l-primary'
                  : 'border-l-[3px] border-l-transparent',
              ].join(' ')}
            >
              {/* Status dot */}
              <span className={`${dot.className} text-base w-4 shrink-0 mt-1`}>{dot.symbol}</span>

              {/* Two-row layout: top = name+badge+id+when+pulse / bottom = prompt or last event */}
              <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                {/* Top row */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-foreground font-medium truncate shrink-0 max-w-[140px]">
                    {sessionLabel(s.entry)}
                  </span>
                  {sessionType && (
                    <span
                      className={`text-[10px] font-bebas tracking-wider px-1.5 py-0.5 rounded shrink-0 ${badgeClass}`}
                    >
                      {sessionType}
                    </span>
                  )}
                  {sessionLabel(s.entry) !== s.entry.session_id.slice(0, 8) && (
                    <span
                      className="font-mono text-xs text-muted-foreground/50 cursor-pointer hover:text-primary shrink-0"
                      title="Click to copy session ID"
                      onClick={(e) => {
                        e.stopPropagation();
                        void navigator.clipboard.writeText(s.entry.session_id);
                      }}
                    >
                      {s.entry.session_id.slice(0, 8)}
                    </span>
                  )}
                  <span className="flex-1" />
                  <span className="text-muted-foreground text-xs shrink-0">
                    {timeAgo(s.entry.last_active)}
                  </span>
                  {(() => {
                    const pulse = pulseDisplay(s.idleSecs, s.entry.status);
                    return (
                      <span className={`text-xs w-8 text-right shrink-0 ${pulse.className}`}>
                        {pulse.text}
                      </span>
                    );
                  })()}
                </div>

                {/* Bottom row — prompt or last event, full width */}
                {(s.entry.first_real_prompt ?? lastEvent) && (
                  <span className="text-xs text-muted-foreground/70 truncate">
                    {s.entry.first_real_prompt ? (
                      <span className="italic">{s.entry.first_real_prompt}</span>
                    ) : lastEvent ? (
                      eventSummary(lastEvent)
                    ) : null}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Layer 3: Focus Panel */}
      {focusedId && focusEvents && (
        <>
          {/* Drag handle */}
          <div
            onMouseDown={handleDragStart}
            className="h-2 bg-border hover:bg-primary/20 cursor-row-resize shrink-0 flex items-center justify-center group select-none"
            title="Drag to resize"
          >
            <div className="flex gap-1">
              <span className="w-8 h-px bg-muted-foreground/40 rounded group-hover:bg-primary/60" />
              <span className="w-8 h-px bg-muted-foreground/40 rounded group-hover:bg-primary/60" />
              <span className="w-8 h-px bg-muted-foreground/40 rounded group-hover:bg-primary/60" />
            </div>
          </div>
          <div className="bg-card shrink-0 flex flex-col" style={{ height: panelHeight }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <span className="text-primary font-bebas tracking-wider text-lg">
                {sessionLabel(
                  sessions.find((s) => s.entry.session_id === focusedId)?.entry ?? {
                    session_id: focusedId,
                    project: focusedId.slice(0, 8),
                    project_dir: '',
                    started_at: '',
                    last_active: '',
                    name: null,
                    tags: [],
                    workspace_id: null,
                    status: 'active',
                    source: 'hook',
                  }
                )}
              </span>
              <button
                onClick={() => {
                  setFocusedId(null);
                  setFocusEvents(null);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none px-1"
                aria-label="Close focus panel"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {focusEvents.events.length === 0 && (
                <div className="px-4 py-3 text-muted-foreground text-xs">No events recorded.</div>
              )}
              {[...focusEvents.events].reverse().map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start gap-3 px-4 py-1.5 border-b border-border text-xs hover:bg-surface-hover"
                >
                  {/* Timestamp */}
                  <span className="text-muted-foreground shrink-0 w-16">
                    {formatTimestamp(ev.ts)}
                  </span>

                  {/* Event type badge */}
                  <span className="text-primary bg-primary/10 rounded px-1.5 py-0.5 shrink-0 text-xs font-medium">
                    {ev.event}
                  </span>

                  {/* Description */}
                  <span className="text-foreground flex-1 break-all">{eventSummary(ev)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
