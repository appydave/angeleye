import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AngelEyeEvent } from '@appystack/shared';
import { timeAgo } from '../utils/session-helpers.js';

// ─── Props ──────────────────────────────────────────────────────────────────

export interface SessionMetadata {
  name?: string | null;
  project?: string | null;
  sessionType?: string | null;
  startedAt?: string | null;
  sessionId?: string | null;
}

interface SessionEventsPanelProps {
  sessionId: string | null;
  sessionIds?: string[];
  onSessionChange?: (id: string) => void;
  metadata?: SessionMetadata;
}

// ─── Turn Types ─────────────────────────────────────────────────────────────

interface ToolCall {
  tool: string;
  summary: string;
  ts: string;
  failed?: boolean;
}

type Turn =
  | { type: 'user'; prompt: string; ts: string }
  | { type: 'claude'; message: string | null; tools: ToolCall[]; ts: string }
  | { type: 'divider'; label: string; ts: string };

// ─── Noise events to skip ───────────────────────────────────────────────────

const NOISE_EVENTS = new Set(['pre_tool_use', 'progress', 'instructions_loaded', 'cwd_changed']);

// ─── Conversation Grouping ──────────────────────────────────────────────────

export function groupEventsIntoTurns(events: AngelEyeEvent[]): Turn[] {
  const turns: Turn[] = [];
  let pendingTools: ToolCall[] = [];
  let claudeTurnTs: string | null = null;

  function flushClaudeTurn(fallbackTs: string): void {
    if (pendingTools.length > 0 || claudeTurnTs) {
      turns.push({
        type: 'claude',
        message: null,
        tools: pendingTools,
        ts: claudeTurnTs ?? fallbackTs,
      });
      pendingTools = [];
      claudeTurnTs = null;
    }
  }

  for (const ev of events) {
    // Dividers
    if (ev.event === 'session_start' || ev.event === 'session_end') {
      flushClaudeTurn(ev.ts);
      turns.push({
        type: 'divider',
        label: ev.event === 'session_start' ? 'Session Start' : 'Session End',
        ts: ev.ts,
      });
      continue;
    }

    // Skip noise
    if (NOISE_EVENTS.has(ev.event)) continue;

    // User prompt starts a new user turn
    if (ev.event === 'user_prompt') {
      flushClaudeTurn(ev.ts);
      turns.push({ type: 'user', prompt: ev.prompt ?? '(empty prompt)', ts: ev.ts });
      continue;
    }

    // Tool use accumulates into the current Claude turn
    if (ev.event === 'tool_use' || ev.event === 'tool_failure') {
      if (!claudeTurnTs) claudeTurnTs = ev.ts;
      const toolName = ev.tool ?? 'unknown';
      let summary = toolName;
      if (ev.event === 'tool_failure') {
        summary = ev.error ?? 'failed';
      } else if (ev.tool_summary) {
        const keys = Object.keys(ev.tool_summary);
        if (keys.length > 0) {
          summary = String(ev.tool_summary[keys[0]]).slice(0, 80);
        }
      }
      pendingTools.push({
        tool: toolName,
        summary,
        ts: ev.ts,
        failed: ev.event === 'tool_failure',
      });
      continue;
    }

    // Stop event ends a Claude turn
    if (ev.event === 'stop' || ev.event === 'subagent_stop') {
      turns.push({
        type: 'claude',
        message: ev.last_message ?? null,
        tools: pendingTools,
        ts: claudeTurnTs ?? ev.ts,
      });
      pendingTools = [];
      claudeTurnTs = null;
      continue;
    }

    // Subagent start as divider
    if (ev.event === 'subagent_start') {
      const label = `Subagent started${ev.agent_type ? ` (${ev.agent_type})` : ''}`;
      turns.push({ type: 'divider', label, ts: ev.ts });
      continue;
    }

    // All other events are silently skipped (noise)
  }

  // Flush any remaining pending Claude turn
  if (pendingTools.length > 0 || claudeTurnTs) {
    turns.push({
      type: 'claude',
      message: null,
      tools: pendingTools,
      ts: claudeTurnTs ?? events[events.length - 1]?.ts ?? '',
    });
  }

  return turns;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function toolCallSummaryText(tools: ToolCall[]): string {
  const counts = new Map<string, number>();
  for (const t of tools) {
    counts.set(t.tool, (counts.get(t.tool) ?? 0) + 1);
  }
  const parts: string[] = [];
  for (const [name, count] of counts) {
    parts.push(`${name}(${count})`);
  }
  return parts.join(', ');
}

// ─── Bubble Components ──────────────────────────────────────────────────────

function UserBubble({ turn }: { turn: Turn & { type: 'user' } }) {
  return (
    <div
      className="flex gap-[10px]"
      style={{ alignSelf: 'flex-end', flexDirection: 'row-reverse', maxWidth: '92%' }}
    >
      {/* Avatar */}
      <div
        className="shrink-0 flex items-center justify-center"
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#c8841a',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          marginTop: 2,
        }}
      >
        You
      </div>
      {/* Content */}
      <div className="flex flex-col" style={{ gap: 4 }}>
        <div className="flex items-center" style={{ gap: 8, flexDirection: 'row-reverse' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#2a2018' }}>You</span>
          <span style={{ fontSize: 10, color: '#b0a494' }}>{timeAgo(turn.ts)}</span>
        </div>
        <div
          className="whitespace-pre-wrap break-words"
          style={{
            padding: '10px 14px',
            background: '#f5f1eb',
            border: '1px solid #d4cdc4',
            borderLeft: '3px solid #c8841a',
            borderRadius: '10px 10px 4px 10px',
            fontSize: 13,
            lineHeight: 1.5,
            color: '#2a2018',
            boxShadow: '0 1px 3px rgba(42,32,24,0.06)',
          }}
        >
          {turn.prompt}
        </div>
      </div>
    </div>
  );
}

function ToolCallGroup({ tools, turnIndex }: { tools: ToolCall[]; turnIndex: number }) {
  const [expanded, setExpanded] = useState(false);

  if (tools.length === 0) return null;

  const summaryText = toolCallSummaryText(tools);

  return (
    <div style={{ paddingLeft: 38 }}>
      <div
        className="hover:brightness-95 transition-all"
        role="button"
        tabIndex={0}
        data-testid={`tool-toggle-${turnIndex}`}
        onClick={() => setExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          color: '#7a6e5e',
          background: '#e8e0d4',
          border: '1px solid #d4cdc4',
          borderRadius: 4,
          padding: '4px 10px',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            fontSize: 9,
            transition: 'transform 0.15s',
            transform: expanded ? 'rotate(90deg)' : 'none',
          }}
        >
          &#9656;
        </span>
        <span>
          {tools.length} tool call{tools.length !== 1 ? 's' : ''} &mdash; {summaryText}
        </span>
      </div>
      {expanded && (
        <div
          style={{
            marginTop: 6,
            padding: '8px 12px',
            background: '#f5f1eb',
            border: '1px solid #d4cdc4',
            borderRadius: 4,
            fontSize: 11,
            color: '#7a6e5e',
            lineHeight: 1.7,
          }}
        >
          {tools.map((tc, i) => (
            <div key={`${tc.tool}-${tc.ts}-${i}`} className="flex items-center" style={{ gap: 6 }}>
              {tc.failed && (
                <span style={{ color: '#c0392b', fontSize: 10, fontWeight: 700 }}>!</span>
              )}
              <span
                style={{
                  fontWeight: 600,
                  color: tc.failed ? '#c0392b' : '#4a3e30',
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  fontSize: 11,
                }}
              >
                {tc.tool}
              </span>
              <span
                style={{
                  color: tc.failed ? '#c0392b' : '#b0a494',
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  fontSize: 10,
                }}
              >
                {tc.failed ? `FAILED: ${tc.summary}` : tc.summary}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClaudeBubble({ turn, turnIndex }: { turn: Turn & { type: 'claude' }; turnIndex: number }) {
  const hasMessage = turn.message !== null && turn.message !== '';
  const hasTools = turn.tools.length > 0;

  return (
    <div style={{ alignSelf: 'flex-start', maxWidth: '92%' }}>
      <div className="flex gap-[10px]">
        {/* Avatar */}
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#2a2018',
            color: '#d4c9b8',
            fontSize: 11,
            fontWeight: 700,
            marginTop: 2,
          }}
        >
          C
        </div>
        {/* Content */}
        <div className="flex flex-col" style={{ gap: 4 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2a2018' }}>Claude</span>
            <span style={{ fontSize: 10, color: '#b0a494' }}>{timeAgo(turn.ts)}</span>
          </div>
          {hasMessage ? (
            <div
              className="whitespace-pre-wrap break-words"
              style={{
                padding: '10px 14px',
                background: '#e8e0d4',
                border: '1px solid #d4cdc4',
                borderRadius: '10px 10px 10px 4px',
                fontSize: 13,
                lineHeight: 1.5,
                color: '#2a2018',
                boxShadow: '0 1px 3px rgba(42,32,24,0.06)',
              }}
            >
              {turn.message}
            </div>
          ) : !hasTools ? (
            <span style={{ fontSize: 12, color: '#b0a494', fontStyle: 'italic' }}>
              (no text response)
            </span>
          ) : null}
        </div>
      </div>
      {/* Tool calls below bubble */}
      <ToolCallGroup tools={turn.tools} turnIndex={turnIndex} />
    </div>
  );
}

function DividerRow({ turn }: { turn: Turn & { type: 'divider' } }) {
  return (
    <div className="flex items-center gap-2 my-3 px-2">
      <div className="flex-1 border-t" style={{ borderColor: '#7a6e5e44' }} />
      <span
        className="text-[10px] font-medium uppercase tracking-wider"
        style={{ color: '#7a6e5e' }}
      >
        {turn.label}
      </span>
      <span className="text-[10px]" style={{ color: '#7a6e5eaa' }}>
        {timeAgo(turn.ts)}
      </span>
      <div className="flex-1 border-t" style={{ borderColor: '#7a6e5e44' }} />
    </div>
  );
}

function TurnRenderer({ turn, index }: { turn: Turn; index: number }) {
  switch (turn.type) {
    case 'user':
      return <UserBubble turn={turn} />;
    case 'claude':
      return <ClaudeBubble turn={turn} turnIndex={index} />;
    case 'divider':
      return <DividerRow turn={turn} />;
  }
}

// ─── Chat Header ───────────────────────────────────────────────────────────

const TYPE_BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  BUILD: { bg: '#2980b920', color: '#2471a3' },
  KNOWLEDGE: { bg: '#8e44ad20', color: '#7d3c98' },
  ORIENT: { bg: '#c8841a20', color: '#b07518' },
};

function ChatHeader({ metadata }: { metadata: SessionMetadata }) {
  const displayName = metadata.name ?? metadata.sessionType ?? 'Session';
  const typeUpper = (metadata.sessionType ?? '').toUpperCase();
  const badgeColors = TYPE_BADGE_COLORS[typeUpper] ?? TYPE_BADGE_COLORS.BUILD;
  const truncatedId = metadata.sessionId ? metadata.sessionId.slice(0, 8) : null;

  return (
    <div
      className="shrink-0"
      style={{
        background: '#f5f1eb',
        padding: '12px 20px',
        borderBottom: '1px solid #d4cdc4',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span
            className="font-bebas"
            style={{
              fontSize: 22,
              color: '#c8841a',
              letterSpacing: '0.06em',
              lineHeight: 1.1,
            }}
          >
            {displayName}
          </span>
          {metadata.project && (
            <span style={{ fontSize: 12, color: '#7a6e5e' }}>{metadata.project}</span>
          )}
          <div className="flex items-center gap-2">
            {metadata.sessionType && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 3,
                  background: badgeColors.bg,
                  color: badgeColors.color,
                }}
              >
                {typeUpper}
              </span>
            )}
            {truncatedId && (
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#b0a494' }}>
                {truncatedId}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Chat Footer ───────────────────────────────────────────────────────────

function ChatFooter({ events }: { events: AngelEyeEvent[] }) {
  const toolCallCount = events.filter((e) => e.event === 'tool_use').length;
  const promptCount = events.filter((e) => e.event === 'user_prompt').length;

  let startedStr = '';
  if (events.length > 0) {
    const firstTs = events[0].ts;
    if (firstTs) {
      startedStr = timeAgo(firstTs);
    }
  }

  // Derive session type from events if available
  const sessionType =
    events.find((e) => e.event === 'session_start')?.agent_type?.toUpperCase() ?? '';

  const separator = <span style={{ color: '#d4cdc4', margin: '0 4px' }}>&bull;</span>;

  return (
    <div className="shrink-0" style={{ background: '#f5f1eb', borderTop: '1px solid #d4cdc4' }}>
      {/* Metadata row */}
      <div
        style={{
          padding: '8px 20px',
          fontSize: 11,
          color: '#7a6e5e',
        }}
      >
        {startedStr && (
          <>
            <span>Started {startedStr}</span>
            {separator}
          </>
        )}
        <span>{toolCallCount} tool calls</span>
        {sessionType && (
          <>
            {separator}
            <span>{sessionType}</span>
          </>
        )}
        {separator}
        <span>{promptCount} prompts</span>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function SessionEventsPanel({
  sessionId,
  sessionIds,
  onSessionChange,
  metadata,
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

  const turns = useMemo(() => groupEventsIntoTurns(events), [events]);

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
      {/* Chat Header */}
      {metadata && <ChatHeader metadata={metadata} />}

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

      <div
        className="flex-1 min-h-0 overflow-y-auto flex flex-col"
        style={{ padding: 20, gap: 16, background: '#ede7dc' }}
      >
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

        {!loading &&
          !error &&
          turns.length > 0 &&
          turns.map((turn, i) => (
            <TurnRenderer key={`turn-${i}-${turn.ts}`} turn={turn} index={i} />
          ))}
      </div>

      {/* Chat Footer — only when events are loaded */}
      {!loading && !error && events.length > 0 && <ChatFooter events={events} />}
    </div>
  );
}
