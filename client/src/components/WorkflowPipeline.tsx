import type {
  WorkflowInstance,
  WorkflowType,
  StationInstance,
  StationConfig,
  StationState,
} from '@appystack/shared';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WorkflowPipelineProps {
  workflow: WorkflowInstance;
  type: WorkflowType;
  selectedStation: number | null;
  onStationClick: (position: number) => void;
}

// ---------------------------------------------------------------------------
// Identity-to-color mapping (from mockup CSS)
// ---------------------------------------------------------------------------

const identityColor: Record<string, string> = {
  Bob: '#4a7fb5',
  Amelia: '#5a9a3c',
  Nate: '#c07030',
  Taylor: '#8a6ab5',
  Lisa: '#b56a8a',
};

const FALLBACK_COLOR = '#8a8a8a';

function getIdentityColor(identity: string | null): string {
  if (!identity) return FALLBACK_COLOR;
  return identityColor[identity] ?? FALLBACK_COLOR;
}

function getInitial(identity: string | null, role: string): string {
  if (identity) return identity[0].toUpperCase();
  return role[0]?.toUpperCase() ?? '?';
}

// ---------------------------------------------------------------------------
// Duration formatting
// ---------------------------------------------------------------------------

function formatDuration(ms: number | null | undefined): string {
  if (ms == null || ms <= 0) return '\u2014';
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min < 60) return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  return remMin > 0 ? `${hr}h ${remMin}m` : `${hr}h`;
}

// ---------------------------------------------------------------------------
// Connector SVG between nodes
// ---------------------------------------------------------------------------

function Connector({
  leftState,
  rightState,
}: {
  leftState: StationState;
  rightState: StationState;
}) {
  const bothDone = leftState === 'completed' && rightState === 'completed';
  const stroke = bothDone ? '#5a9a3c' : '#9e9484';
  const strokeWidth = bothDone ? 2 : 1.5;
  const dashArray = bothDone ? undefined : '4,3';
  const fill = bothDone ? '#5a9a3c' : '#9e9484';

  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{ width: 40, paddingTop: 40 }}
    >
      <svg width="40" height="12" viewBox="0 0 40 12" overflow="visible">
        <line
          x1="0"
          y1="6"
          x2="30"
          y2="6"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dashArray}
        />
        <polygon points={bothDone ? '30,2 38,6 30,10' : '30,3 36,6 30,9'} fill={fill} />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// State badge (top-right corner of node)
// ---------------------------------------------------------------------------

function StateBadge({ state }: { state: StationState }) {
  const base =
    'absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold';

  if (state === 'completed') {
    return (
      <div className={base} style={{ background: '#5a9a3c', color: 'white' }}>
        &#10003;
      </div>
    );
  }

  if (state === 'in_progress') {
    return (
      <div className={base} style={{ background: '#c8841a' }}>
        <div
          className="w-2.5 h-2.5 rounded-full bg-white"
          style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
        />
      </div>
    );
  }

  // not_started / skipped / backtracked
  return <div className={base} style={{ background: '#ddd6cc', border: '1px solid #d4cdc4' }} />;
}

// ---------------------------------------------------------------------------
// Station node
// ---------------------------------------------------------------------------

interface StationNodeProps {
  station: StationInstance;
  config: StationConfig;
  isSelected: boolean;
  onClick: () => void;
}

function StationNode({ station, config, isSelected, onClick }: StationNodeProps) {
  const { state } = station;
  const isDone = state === 'completed';
  const isActive = state === 'in_progress';
  const isPending = state === 'not_started' || state === 'skipped';

  const color = getIdentityColor(config.identity);
  const initial = getInitial(config.identity, config.role);
  const agentName = config.identity ?? config.role;
  const sessionCount = station.session_ids.length;

  // Node border + visual treatment
  const nodeWidth = isActive ? 124 : 112;
  const borderColor = isDone ? '#d4e8cc' : isActive ? '#c8841a' : '#d4cdc4';

  const selectedRing = isSelected ? '0 0 0 3px rgba(200,132,26,0.35)' : undefined;
  const activeShadow = isActive
    ? '0 2px 12px rgba(200,132,26,0.18), 0 0 0 3px rgba(200,132,26,0.08)'
    : '0 1px 3px rgba(0,0,0,0.06)';
  const boxShadow = selectedRing ? `${activeShadow}, ${selectedRing}` : activeShadow;

  const avatarSize = isActive ? 40 : 36;
  const avatarFontSize = isActive ? 18 : 16;
  const actionFontSize = isActive ? 24 : 22;

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={onClick}
        className="relative rounded-xl text-center cursor-pointer transition-all duration-200"
        style={{
          width: nodeWidth,
          padding: '14px 10px 12px',
          background: '#f5f1eb',
          border: `2px solid ${borderColor}`,
          borderColor: isSelected ? '#c8841a' : borderColor,
          boxShadow,
          opacity: isPending ? 0.45 : 1,
          transform: isActive ? 'scale(1.04)' : undefined,
        }}
      >
        <StateBadge state={state} />

        {/* Avatar */}
        <div
          className="rounded-full flex items-center justify-center font-bold text-white mx-auto mb-1.5"
          style={{
            width: avatarSize,
            height: avatarSize,
            fontSize: avatarFontSize,
            background: color,
          }}
        >
          {initial}
        </div>

        {/* Agent name */}
        <div className="text-xs font-medium" style={{ color: '#7a6e5e', fontSize: 11 }}>
          {agentName}
        </div>

        {/* Action code */}
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: actionFontSize,
            letterSpacing: 2,
            lineHeight: 1.1,
            color: isActive ? '#c8841a' : isPending ? '#9e9484' : '#2a2018',
          }}
        >
          {station.action_code}
        </div>

        {/* Duration */}
        <div
          className="mt-1"
          style={{
            fontSize: 11,
            color: isActive ? '#c8841a' : '#7a6e5e',
            fontWeight: isActive ? 600 : 400,
          }}
        >
          {formatDuration(station.duration_ms)}
        </div>

        {/* Session count badge */}
        {sessionCount > 1 && (
          <div
            className="inline-block mt-1 rounded-full text-white font-semibold"
            style={{
              fontSize: 9,
              padding: '1px 7px',
              background: '#7a6e5e',
            }}
          >
            {sessionCount} sessions
          </div>
        )}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline (exported)
// ---------------------------------------------------------------------------

function WorkflowPipeline({
  workflow,
  type,
  selectedStation,
  onStationClick,
}: WorkflowPipelineProps) {
  const stations = workflow.stations;
  const configs = type.stations;

  return (
    <div className="overflow-x-auto" style={{ padding: '16px 0 24px' }}>
      <div className="flex items-start">
        {stations.map((station, i) => {
          const config = configs.find((c) => c.position === station.position) ?? {
            position: station.position,
            action_code: station.action_code,
            role: station.action_code,
            identity: null,
            requires_fresh_session: false,
            can_spawn_subagents: false,
            backtrack_target: false,
          };

          return (
            <div key={station.position} className="flex items-start">
              <StationNode
                station={station}
                config={config}
                isSelected={selectedStation === station.position}
                onClick={() => onStationClick(station.position)}
              />
              {i < stations.length - 1 && (
                <Connector leftState={station.state} rightState={stations[i + 1].state} />
              )}
            </div>
          );
        })}
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}

export default WorkflowPipeline;
