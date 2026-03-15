import { useEffect, useRef, useState } from 'react';
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

function idleTextClass(secs: number): string {
  if (secs >= 15) return 'text-red-400';
  if (secs >= 8) return 'text-amber-400';
  return 'text-muted-foreground';
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

export default function ObserverView() {
  const [sessions, setSessions] = useState<SessionState[]>([]);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [focusEvents, setFocusEvents] = useState<FocusEvents | null>(null);
  const [, setTick] = useState(0); // forces re-render for live time displays
  const idleCounters = useRef<Record<string, number>>({});

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
        const events = (body.data?.events ?? []).slice(-10);
        setFocusEvents({ sessionId, events });
      })
      .catch(() => {
        // Server may be unavailable — silently ignore
      });
  };

  const activeSessions = sessions.filter((s) => s.entry.status === 'active');
  const anyActive = activeSessions.length > 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Layer 1: Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface shrink-0">
        <h1 className="font-bebas text-3xl tracking-wider text-primary">Observer</h1>
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
      <div className="flex items-center gap-3 px-4 py-1 border-b border-border shrink-0 bg-surface">
        <span className="w-4 shrink-0" />
        <span className="font-bebas tracking-wider text-muted-foreground text-xs w-32 shrink-0">
          SESSION
        </span>
        <span className="font-bebas tracking-wider text-muted-foreground text-xs flex-1">
          LAST ACTIVITY
        </span>
        <span className="font-bebas tracking-wider text-muted-foreground text-xs w-16 text-right shrink-0">
          WHEN
        </span>
        <span className="font-bebas tracking-wider text-muted-foreground text-xs w-12 text-right shrink-0">
          IDLE
        </span>
      </div>

      {/* Layer 2: Activity Feed */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {sessions.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No sessions yet — waiting for Claude Code activity.
          </div>
        )}
        {sessions.map((s) => {
          const dot = statusDot(s.entry.last_active);
          const lastEvent = s.events.length > 0 ? s.events[s.events.length - 1] : null;
          const isFocused = focusedId === s.entry.session_id;
          return (
            <div
              key={s.entry.session_id}
              onClick={() => handleRowClick(s.entry.session_id)}
              className={[
                'flex items-center gap-3 px-4 py-2 cursor-pointer border-b border-border hover:bg-surface-hover transition-colors text-sm',
                isFocused ? 'bg-surface-mid border-l-2 border-l-primary' : '',
              ].join(' ')}
            >
              {/* Status dot */}
              <span className={`${dot.className} text-base w-4 shrink-0`}>{dot.symbol}</span>

              {/* Session name */}
              <span className="text-foreground font-medium w-32 truncate shrink-0">
                {sessionLabel(s.entry)}
              </span>

              {/* Last event summary */}
              <span className="text-muted-foreground flex-1 truncate">
                {lastEvent
                  ? eventSummary(lastEvent)
                  : s.entry.status === 'active'
                    ? 'active'
                    : 'ended'}
              </span>

              {/* Time since last event */}
              <span className="text-muted-foreground text-xs w-16 text-right shrink-0">
                {timeAgo(s.entry.last_active)}
              </span>

              {/* Idle counter */}
              <span className={`text-xs w-12 text-right shrink-0 ${idleTextClass(s.idleSecs)}`}>
                {s.idleSecs}s
              </span>
            </div>
          );
        })}
      </div>

      {/* Layer 3: Focus Panel */}
      {focusedId && focusEvents && (
        <div className="border-t border-border bg-surface shrink-0 max-h-72 flex flex-col">
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
      )}
    </div>
  );
}
