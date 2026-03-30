import { useState, useEffect, useCallback } from 'react';
import type { AngelEyeEvent } from '@appystack/shared';

// ─── Props ──────────────────────────────────────────────────────────────────

interface SessionEventsPanelProps {
  sessionId: string | null;
  sessionIds?: string[];
  onSessionChange?: (id: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function eventSummary(event: AngelEyeEvent): string {
  switch (event.event) {
    case 'tool_use': {
      const tool = event.tool ?? 'unknown tool';
      if (event.tool_summary) {
        const keys = Object.keys(event.tool_summary);
        if (keys.length > 0) {
          const first = event.tool_summary[keys[0]];
          return `${tool} — ${String(first).slice(0, 80)}`;
        }
      }
      return tool;
    }
    case 'user_prompt':
      return event.prompt ?? '';
    case 'stop':
      return event.reason ?? 'Session ended';
    case 'session_start':
      return 'Session started';
    case 'session_end':
      return 'Session ended';
    case 'subagent_start':
      return `Subagent started${event.agent_type ? ` (${event.agent_type})` : ''}`;
    case 'subagent_stop':
      return `Subagent stopped${event.reason ? `: ${event.reason}` : ''}`;
    default:
      return event.event;
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

// ─── Event Row ──────────────────────────────────────────────────────────────

function EventRow({ event }: { event: AngelEyeEvent }) {
  const ts = formatTime(event.ts);

  switch (event.event) {
    case 'user_prompt':
      return (
        <div className="flex justify-end mb-2">
          <div
            className="max-w-[80%] rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: '#c8841a22', border: '1px solid #c8841a44' }}
          >
            <div className="whitespace-pre-wrap break-words" style={{ color: '#2a2018' }}>
              {event.prompt ?? '(empty prompt)'}
            </div>
            <div className="text-[10px] mt-1 text-right" style={{ color: '#7a6e5e' }}>
              {ts}
            </div>
          </div>
        </div>
      );

    case 'tool_use':
      return (
        <div
          className="flex items-start gap-2 mb-1 px-2 py-1 rounded text-xs"
          style={{ color: '#7a6e5e' }}
        >
          <span className="shrink-0 font-mono" style={{ color: '#7a6e5eaa' }}>
            {ts}
          </span>
          <span
            className="shrink-0 rounded px-1.5 py-0.5 font-medium"
            style={{ backgroundColor: '#e8e0d4', color: '#5a9a3c' }}
          >
            {event.tool ?? 'tool'}
          </span>
          <span className="flex-1 break-all truncate">{eventSummary(event)}</span>
        </div>
      );

    case 'session_start':
    case 'session_end':
      return (
        <div className="flex items-center gap-2 my-3 px-2">
          <div className="flex-1 border-t" style={{ borderColor: '#7a6e5e44' }} />
          <span
            className="text-[10px] font-medium uppercase tracking-wider"
            style={{ color: '#7a6e5e' }}
          >
            {event.event === 'session_start' ? 'Session Start' : 'Session End'}
          </span>
          <span className="text-[10px]" style={{ color: '#7a6e5eaa' }}>
            {ts}
          </span>
          <div className="flex-1 border-t" style={{ borderColor: '#7a6e5e44' }} />
        </div>
      );

    case 'subagent_start':
    case 'subagent_stop':
      return (
        <div
          className="flex items-center gap-2 mb-1 ml-6 px-2 py-1 rounded text-xs"
          style={{ backgroundColor: '#8a6ab511', color: '#8a6ab5' }}
        >
          <span className="shrink-0 font-mono text-[10px]" style={{ color: '#7a6e5eaa' }}>
            {ts}
          </span>
          <span className="font-medium">{eventSummary(event)}</span>
        </div>
      );

    case 'stop':
      return (
        <div className="flex items-center gap-2 my-2 px-2">
          <div className="flex-1 border-t border-dashed" style={{ borderColor: '#7a6e5e33' }} />
          <span className="text-[10px]" style={{ color: '#7a6e5e' }}>
            {eventSummary(event)}
          </span>
          <span className="text-[10px]" style={{ color: '#7a6e5eaa' }}>
            {ts}
          </span>
          <div className="flex-1 border-t border-dashed" style={{ borderColor: '#7a6e5e33' }} />
        </div>
      );

    default:
      // Render minor events (pre_tool_use, progress, etc.) minimally
      return (
        <div
          className="flex items-start gap-2 mb-0.5 px-2 py-0.5 text-[10px]"
          style={{ color: '#7a6e5e88' }}
        >
          <span className="shrink-0 font-mono">{ts}</span>
          <span className="rounded px-1 py-0.5" style={{ backgroundColor: '#e8e0d466' }}>
            {event.event}
          </span>
          <span className="flex-1 break-all truncate">{eventSummary(event)}</span>
        </div>
      );
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function SessionEventsPanel({
  sessionId,
  sessionIds,
  onSessionChange,
}: SessionEventsPanelProps) {
  const [events, setEvents] = useState<AngelEyeEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (sid: string) => {
    setLoading(true);
    setError(null);
    setEvents([]);
    try {
      const res = await fetch(`/api/sessions/${sid}/events`);
      if (!res.ok) {
        setError(`Failed to load events (${res.status})`);
        return;
      }
      const json = (await res.json()) as { status: string; data?: { events?: AngelEyeEvent[] } };
      if (json.status !== 'ok') {
        setError('Unexpected response from server');
        return;
      }
      setEvents(json.data?.events ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setEvents([]);
      setError(null);
      return;
    }
    void fetchEvents(sessionId);
  }, [sessionId, fetchEvents]);

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!sessionId) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-0" style={{ color: '#7a6e5e' }}>
        <span className="text-sm">Select a station to view its session.</span>
      </div>
    );
  }

  // ── Multi-session tabs ───────────────────────────────────────────────────
  const showTabs = sessionIds && sessionIds.length > 1;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {showTabs && (
        <div
          className="flex gap-1 border-b px-4 py-1 shrink-0"
          style={{ borderColor: '#7a6e5e33' }}
        >
          {sessionIds.map((id, i) => (
            <button
              key={id}
              onClick={() => onSessionChange?.(id)}
              className="px-2 py-1 text-xs transition-colors"
              style={
                id === sessionId
                  ? { color: '#c8841a', borderBottom: '2px solid #c8841a' }
                  : { color: '#7a6e5e' }
              }
            >
              Session {i + 1}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <span className="text-sm" style={{ color: '#7a6e5e' }}>
              Loading events...
            </span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-8">
            <span className="text-sm text-red-500">{error}</span>
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <span className="text-sm" style={{ color: '#7a6e5e' }}>
              No events found for this session.
            </span>
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div>
            {events.map((ev) => (
              <EventRow key={ev.id ?? `${ev.ts}-${ev.event}`} event={ev} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
