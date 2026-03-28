/**
 * Mock-views service — reads real AngelEye data and reshapes it
 * into view-model objects that Mochaccino HTML mockups can render.
 *
 * These are proof-of-concept / prosperity APIs, not production-grade.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { RegistryEntry, AffinityGroup, WorkspaceEntry } from '@appystack/shared';
import { readRegistry, getDataDir } from './registry.service.js';
import { readWorkspaces } from './workspace.service.js';
import { getSessionEvents } from './sessions.service.js';
// logger available via '../config/logger.js' if needed

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function shortId(sessionId: string): string {
  return sessionId.slice(0, 8);
}

function collapsePath(dir: string): string {
  const home = process.env.HOME ?? '/Users/davidcruwys';
  return dir.startsWith(home) ? '~' + dir.slice(home.length) : dir;
}

function nonJunkSessions(registry: Record<string, RegistryEntry>): RegistryEntry[] {
  return Object.values(registry)
    .filter((e) => !e.is_junk)
    .sort((a, b) => new Date(b.last_active).getTime() - new Date(a.last_active).getTime());
}

async function readAffinityGroups(): Promise<AffinityGroup[]> {
  try {
    const raw = await readFile(join(getDataDir(), 'affinity-groups.json'), 'utf-8');
    return JSON.parse(raw) as AffinityGroup[];
  } catch {
    return [];
  }
}

async function readLastSync(): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readFile(join(getDataDir(), 'last-sync.json'), 'utf-8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ── Observer View ────────────────────────────────────────────────────────────

export async function getObserverView() {
  const registry = await readRegistry();
  const sessions = nonJunkSessions(registry);
  const active = sessions.filter((s) => s.status === 'active');
  const ended = sessions.filter((s) => s.status === 'ended');

  return {
    activeCount: active.length,
    totalCount: sessions.length,
    activeSessions: active.slice(0, 20).map(toObserverRow),
    endedSessions: ended.slice(0, 30).map(toObserverRow),
  };
}

function toObserverRow(e: RegistryEntry) {
  return {
    sessionId: shortId(e.session_id),
    fullSessionId: e.session_id,
    userAssignedName: e.name,
    projectSlug: e.project || 'unknown',
    status: e.status,
    path: collapsePath(e.project_dir || ''),
    lastActiveRelative: relativeTime(e.last_active),
    tags: e.tags ?? [],
  };
}

// ── Organiser View ───────────────────────────────────────────────────────────

export async function getOrganiserView() {
  const registry = await readRegistry();
  const sessions = nonJunkSessions(registry);
  const workspaces = await readWorkspaces();

  const assigned = new Set<string>();
  const workspaceViews = workspaces.map((ws: WorkspaceEntry) => {
    const wsSessions = sessions
      .filter((s) => s.workspace_id === ws.id)
      .slice(0, 10)
      .map(toOrganiserRow);
    wsSessions.forEach((s) => assigned.add(s.fullSessionId));
    return { name: ws.name, id: ws.id, sessions: wsSessions };
  });

  const inbox = sessions
    .filter((s) => !assigned.has(s.session_id) && !s.workspace_id)
    .slice(0, 20)
    .map(toOrganiserRow);

  return {
    activeCount: sessions.filter((s) => s.status === 'active').length,
    totalCount: sessions.length,
    inbox: { unassignedCount: inbox.length, sessions: inbox },
    workspaces: workspaceViews,
  };
}

function toOrganiserRow(e: RegistryEntry) {
  return {
    sessionId: shortId(e.session_id),
    fullSessionId: e.session_id,
    userAssignedName: e.name,
    projectSlug: e.project || 'unknown',
    status: e.status,
    lastActiveRelative: relativeTime(e.last_active),
    tags: e.tags ?? [],
  };
}

// ── Named Rows View ──────────────────────────────────────────────────────────

export async function getNamedRowsView() {
  const registry = await readRegistry();
  const sessions = nonJunkSessions(registry);

  return {
    totalCount: sessions.length,
    sessions: sessions.slice(0, 50).map((e) => ({
      sessionId: shortId(e.session_id),
      fullSessionId: e.session_id,
      userAssignedName: e.name,
      projectSlug: e.project || 'unknown',
      lastPromptSnippet: e.first_real_prompt ?? '',
      sessionType: e.session_type ?? null,
      status: e.status,
      whenRelative: relativeTime(e.last_active),
      pulseMinutes: e.status === 'active' ? minutesSince(e.last_active) : null,
      isStarred: (e.tags ?? []).includes('starred'),
      isNamed: e.name !== null,
      toolPattern: e.tool_pattern ?? null,
      sessionScale: e.session_scale ?? null,
    })),
  };
}

function minutesSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

// ── Chat Panel View ──────────────────────────────────────────────────────────

export async function getChatPanelView(selectedSessionId?: string) {
  const registry = await readRegistry();
  const sessions = nonJunkSessions(registry);

  const sessionList = sessions.slice(0, 50).map((e) => ({
    sessionId: shortId(e.session_id),
    fullSessionId: e.session_id,
    projectSlug: e.project || 'unknown',
    userAssignedName: e.name,
    sessionType: e.session_type ?? null,
    status: e.status,
    elapsedRelative: relativeTime(e.last_active),
  }));

  let selectedSession = null;
  const targetId = selectedSessionId ?? sessions[0]?.session_id;
  if (targetId) {
    const entry = registry[targetId];
    const events = await getSessionEvents(targetId);

    const messages = events
      .filter((ev) => ev.event === 'user_prompt' || ev.event === 'stop')
      .slice(0, 30)
      .map((ev) => ({
        role: ev.event === 'user_prompt' ? 'user' : 'claude',
        timestamp: relativeTime(ev.ts),
        text:
          ev.event === 'user_prompt'
            ? (ev.prompt ?? '').slice(0, 500)
            : (ev.last_message ?? '').slice(0, 500),
      }));

    const toolCalls = events
      .filter((ev) => ev.event === 'tool_use')
      .slice(-20)
      .map((ev) => ({
        timestamp: relativeTime(ev.ts),
        tool: ev.tool ?? 'unknown',
        summary: ev.tool_summary ? JSON.stringify(ev.tool_summary).slice(0, 100) : '',
      }));

    selectedSession = {
      sessionId: shortId(targetId),
      fullSessionId: targetId,
      userAssignedName: entry?.name ?? null,
      projectSlug: entry?.project ?? 'unknown',
      sessionType: entry?.session_type ?? null,
      messages,
      toolCalls,
      eventCount: events.length,
    };
  }

  return { totalCount: sessions.length, sessions: sessionList, selectedSession };
}

// ── Sync UX View ─────────────────────────────────────────────────────────────

export async function getSyncView() {
  const registry = await readRegistry();
  const sessions = nonJunkSessions(registry);
  const lastSync = await readLastSync();

  const byProject = new Map<string, { count: number; types: Map<string, number> }>();
  for (const s of sessions) {
    const proj = s.project || 'unknown';
    if (!byProject.has(proj)) byProject.set(proj, { count: 0, types: new Map() });
    const entry = byProject.get(proj)!;
    entry.count++;
    const t = s.session_type ?? 'unclassified';
    entry.types.set(t, (entry.types.get(t) ?? 0) + 1);
  }

  const projectBreakdown = [...byProject.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20)
    .map(([slug, data]) => {
      const dominantType = [...data.types.entries()].sort((a, b) => b[1] - a[1])[0];
      return {
        projectSlug: slug,
        sessionCount: data.count,
        dominantType: dominantType?.[0] ?? null,
      };
    });

  const unclassified = sessions.filter((s) => !s.session_type).length;
  const classified = sessions.filter((s) => s.session_type).length;

  return {
    totalSessions: sessions.length,
    classified,
    unclassified,
    totalProjects: byProject.size,
    lastSync: lastSync
      ? {
          timestamp: lastSync.timestamp,
          imported: lastSync.imported,
          classified: lastSync.classified,
        }
      : null,
    projectBreakdown,
  };
}

// ── Chain Sprint Board View ──────────────────────────────────────────────────

export async function getChainSprintBoardView() {
  const registry = await readRegistry();
  const groups = await readAffinityGroups();
  const sessions = nonJunkSessions(registry);

  // Only story_unit groups for the board
  const storyGroups = groups.filter((g) => g.group_type === 'story_unit');

  // Group stories by epic
  const epicMap = new Map<string, typeof storyGroups>();
  for (const g of storyGroups) {
    const epicId = String((g.metadata as Record<string, unknown>)?.epic_id ?? '0');
    if (!epicMap.has(epicId)) epicMap.set(epicId, []);
    epicMap.get(epicId)!.push(g);
  }

  const epics = [...epicMap.entries()].map(([epicId, stories]) => ({
    epicId,
    epicTitle: `Epic ${epicId}`,
    stories: stories.map((g) => {
      const meta = (g.metadata ?? {}) as Record<string, unknown>;
      const chainSteps = (meta.chain_steps as string[]) ?? [];
      const agents = (meta.agents as string[]) ?? [];
      const backtracks = (meta.backtracks as number) ?? 0;
      const storySessions = g.session_ids
        .map((id) => registry[id])
        .filter(Boolean) as RegistryEntry[];
      const lastStep = chainSteps[chainSteps.length - 1] ?? 'unknown';

      return {
        storyId: meta.story_id ?? g.label,
        title: g.label,
        groupId: g.group_id,
        confidence: g.confidence,
        sessionCount: g.session_ids.length,
        agents,
        chainSteps,
        backtracks,
        currentStep: lastStep,
        status: inferStoryStatus(storySessions, chainSteps),
      };
    }),
  }));

  return { totalSessions: sessions.length, epics };
}

function inferStoryStatus(
  sessions: RegistryEntry[],
  chainSteps: string[]
): 'active' | 'complete' | 'waiting' {
  const hasActive = sessions.some((s) => s.status === 'active');
  if (hasActive) return 'active';
  const lastStep = chainSteps[chainSteps.length - 1];
  if (lastStep === 'shipper' || lastStep === 'observer') return 'complete';
  return 'waiting';
}

// ── Chain Story Pipeline View ────────────────────────────────────────────────

export async function getChainStoryPipelineView(groupId: string) {
  const registry = await readRegistry();
  const groups = await readAffinityGroups();
  const group = groups.find((g) => g.group_id === groupId);

  if (!group) return null;

  const meta = (group.metadata ?? {}) as Record<string, unknown>;
  const chainSteps = (meta.chain_steps as string[]) ?? [];
  const agents = (meta.agents as string[]) ?? [];
  const backtracks = (meta.backtracks as number) ?? 0;
  const backtrackDetails = (meta.backtrack_details as string[]) ?? [];

  const steps = chainSteps.map((role, i) => {
    const sessionId = group.session_ids[i];
    const entry = sessionId ? registry[sessionId] : undefined;
    const isLast = i === chainSteps.length - 1;
    const hasActive = entry?.status === 'active';

    return {
      position: i + 1,
      role,
      agentName: agents[i] ?? null,
      sessionId: sessionId ? shortId(sessionId) : null,
      fullSessionId: sessionId ?? null,
      state: hasActive ? 'active' : isLast && !hasActive ? 'pending' : 'done',
      projectSlug: entry?.project ?? null,
      sessionType: entry?.session_type ?? null,
      durationLabel: entry ? relativeTime(entry.last_active) : null,
    };
  });

  // Parse backtrack arrows from details like "planner@2"
  const backtrackArrows = backtrackDetails.map((detail) => {
    const match = detail.match(/^(\w+)@(\d+)$/);
    if (!match) return { fromStep: 0, toStep: 0, label: detail };
    const targetPos = parseInt(match[2], 10);
    // Find where this role appears after targetPos (the backtrack source)
    const sourcePos = chainSteps.findIndex((r, i) => i > targetPos && r === match[1]);
    return {
      fromStep: sourcePos >= 0 ? sourcePos + 1 : chainSteps.length,
      toStep: targetPos,
      label: detail,
    };
  });

  return {
    groupId: group.group_id,
    label: group.label,
    groupType: group.group_type,
    confidence: group.confidence,
    domain: group.domain_overlay ?? null,
    storyId: meta.story_id ?? group.label,
    epicId: meta.epic_id ?? null,
    totalSteps: chainSteps.length,
    agents,
    backtracks,
    backtrackArrows,
    steps,
  };
}

// ── Chain Session Detail View ────────────────────────────────────────────────

export async function getChainSessionDetailView(sessionId: string) {
  const registry = await readRegistry();
  const entry = registry[sessionId];
  if (!entry) return null;

  const events = await getSessionEvents(sessionId);
  const groups = await readAffinityGroups();
  const sessionGroups = groups.filter((g) => g.session_ids.includes(sessionId));

  // Count tools
  const toolCounts = new Map<string, number>();
  let totalTools = 0;
  for (const ev of events) {
    if (ev.event === 'tool_use' && ev.tool) {
      toolCounts.set(ev.tool, (toolCounts.get(ev.tool) ?? 0) + 1);
      totalTools++;
    }
  }

  const toolProfile = [...toolCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tool, count]) => ({
      tool,
      count,
      percent: totalTools > 0 ? Math.round((count / totalTools) * 100) : 0,
    }));

  const userPrompts = events.filter((ev) => ev.event === 'user_prompt').length;
  const SKIP_EVENTS = new Set([
    'pre_tool_use',
    'post_tool_use',
    'tool_failure',
    'progress',
    'cwd_changed',
  ]);
  const recentEvents = events
    .filter((ev) => !SKIP_EVENTS.has(ev.event))
    .slice(-10)
    .map((ev) => ({
      timestamp: relativeTime(ev.ts),
      eventType: ev.event,
      detail: ev.tool ?? ev.prompt?.slice(0, 80) ?? ev.event,
    }));

  // Predicates
  const predicates = [
    { code: 'P05', name: 'has_playwright_calls', fired: !!entry.has_playwright_calls },
    { code: 'P09', name: 'is_compaction_resume', fired: !!entry.is_compaction_resume },
    { code: 'P12', name: 'is_machine_initiated', fired: !!entry.is_machine_initiated },
    { code: 'P17', name: 'has_handover_context', fired: !!entry.has_handover_context },
    { code: 'P18', name: 'has_cross_project_reads', fired: !!entry.has_cross_project_reads },
    { code: 'P19', name: 'has_web_research', fired: !!entry.has_web_research },
    {
      code: 'P20',
      name: 'has_parallel_subagent_bursts',
      fired: !!entry.has_parallel_subagent_bursts,
    },
    { code: 'P21', name: 'has_task_orchestration', fired: !!entry.has_task_orchestration },
    { code: 'P22', name: 'has_git_outcome', fired: !!entry.has_git_outcome },
    { code: 'P34', name: 'has_skill_created', fired: !!entry.has_skill_created },
    { code: 'P35', name: 'has_skill_modified', fired: !!entry.has_skill_modified },
  ];

  return {
    session: {
      sessionId: shortId(sessionId),
      fullSessionId: sessionId,
      userAssignedName: entry.name,
      status: entry.status,
      projectSlug: entry.project || 'unknown',
      projectDir: collapsePath(entry.project_dir || ''),
      startedAt: entry.started_at,
      lastActive: entry.last_active,
      lastActiveRelative: relativeTime(entry.last_active),
    },
    classification: {
      sessionType: entry.session_type ?? null,
      sessionScale: entry.session_scale ?? null,
      toolPattern: entry.tool_pattern ?? null,
    },
    workflowContext: {
      role: entry.workflow_role ?? null,
      identity: entry.workflow_identity ?? null,
      action: entry.workflow_action ?? null,
      triggerCommand: entry.trigger_command ?? null,
      triggerArguments: entry.trigger_arguments ?? null,
      groupIds: entry.group_ids ?? [],
    },
    predicates,
    toolProfile,
    metrics: {
      totalEvents: events.length,
      toolCalls: totalTools,
      userPrompts,
      autonomyRatio: userPrompts > 0 ? Math.round((totalTools / userPrompts) * 10) / 10 : 0,
    },
    affinityGroups: sessionGroups.map((g) => ({
      groupId: g.group_id,
      label: g.label,
      groupType: g.group_type,
      confidence: g.confidence,
    })),
    recentEvents,
  };
}

// ── Story Chains View ─────────────────────────────────────────────────────
// Presents complete BMAD story chains: WN (kickoff) → CS/VS → DS → DR → SAT → CU → Ship
// Correlates ship and WN sessions by temporal proximity to affinity groups.

/** BMAD agent action labels for display */
const ACTION_LABELS: Record<string, string> = {
  planner: 'Plan',
  builder: 'Build',
  reviewer: 'Review',
  tester: 'Test',
  advisor: 'Curate',
  shipper: 'Ship',
  observer: 'Observe',
};

/** Map workflow_action prefix to a display label */
function actionLabel(action: string | null | undefined, role: string): string {
  if (!action) return ACTION_LABELS[role] ?? role;
  const prefix = action.split(/\s+/)[0]?.toUpperCase() ?? '';
  const labels: Record<string, string> = {
    WN: "What's Next",
    CS: 'Create Story',
    VS: 'Validate Story',
    DS: 'Dev Story',
    DR: 'Delivery Review',
    RA: 'Re-Acceptance',
    CU: 'Curate',
  };
  return labels[prefix] ?? ACTION_LABELS[role] ?? role;
}

interface ChainSession {
  position: number;
  sessionId: string;
  fullSessionId: string;
  role: string;
  agentName: string | null;
  action: string;
  actionLabel: string;
  triggerCommand: string | null;
  triggerArguments: string | null;
  status: string;
  startedAt: string;
  lastActive: string;
  lastActiveRelative: string;
  isBacktrack: boolean;
  /** Whether this session is part of the core affinity group or was correlated by proximity */
  correlation: 'affinity' | 'temporal';
}

interface StoryChainView {
  storyId: string;
  epicId: string;
  groupId: string;
  label: string;
  confidence: string;
  domainOverlay: string | null;
  status: 'active' | 'complete' | 'waiting';
  totalSteps: number;
  backtracks: number;
  backtrackDetails: string[];
  /** The core pipeline chain sessions in chronological order */
  chain: ChainSession[];
  /** WN (What's Next) session that preceded this story, if found */
  kickoff: ChainSession | null;
  /** Ship session that followed the last chain step, if found */
  ship: ChainSession | null;
  /** Notes about missing or anomalous data */
  notes: string[];
}

/**
 * Find a ship session temporally close to (and after) the last session in a story chain.
 * Ship sessions use `/bmad-ship` with no story ID, so we rely on proximity.
 */
function findTemporalShip(
  lastChainTime: number,
  shipSessions: RegistryEntry[],
  usedShipIds: Set<string>
): RegistryEntry | null {
  const MAX_GAP_MS = 90 * 60 * 1000; // 90 minutes
  let best: RegistryEntry | null = null;
  let bestGap = Infinity;

  for (const ship of shipSessions) {
    if (usedShipIds.has(ship.session_id)) continue;
    const shipTime = new Date(ship.started_at).getTime();
    const gap = shipTime - lastChainTime;
    if (gap > 0 && gap < MAX_GAP_MS && gap < bestGap) {
      best = ship;
      bestGap = gap;
    }
  }

  return best;
}

/**
 * Find a WN (What's Next) session that preceded the first session in a story chain.
 * WN sessions use `/bmad-sm wn` with no story ID.
 */
function findTemporalKickoff(
  firstChainTime: number,
  wnSessions: RegistryEntry[],
  usedWnIds: Set<string>
): RegistryEntry | null {
  const MAX_GAP_MS = 90 * 60 * 1000; // 90 minutes
  let best: RegistryEntry | null = null;
  let bestGap = Infinity;

  for (const wn of wnSessions) {
    if (usedWnIds.has(wn.session_id)) continue;
    const wnTime = new Date(wn.started_at).getTime();
    const gap = firstChainTime - wnTime;
    if (gap > 0 && gap < MAX_GAP_MS && gap < bestGap) {
      best = wn;
      bestGap = gap;
    }
  }

  return best;
}

function toChainSession(
  entry: RegistryEntry,
  position: number,
  isBacktrack: boolean,
  correlation: 'affinity' | 'temporal'
): ChainSession {
  const role = entry.workflow_role ?? entry.trigger_command ?? 'unknown';
  return {
    position,
    sessionId: shortId(entry.session_id),
    fullSessionId: entry.session_id,
    role,
    agentName: entry.workflow_identity ?? null,
    action: entry.workflow_action ?? entry.trigger_arguments ?? role,
    actionLabel: actionLabel(entry.workflow_action ?? entry.trigger_arguments, role),
    triggerCommand: entry.trigger_command ?? null,
    triggerArguments: entry.trigger_arguments ?? null,
    status: entry.status,
    startedAt: entry.started_at,
    lastActive: entry.last_active,
    lastActiveRelative: relativeTime(entry.last_active),
    isBacktrack,
    correlation,
  };
}

export async function getStoryChainsView() {
  const registry = await readRegistry();
  const groups = await readAffinityGroups();
  const allEntries = Object.values(registry);

  // Story groups only
  const storyGroups = groups.filter((g) => g.group_type === 'story_unit');

  // Collect ship sessions (bmad-ship command, no story ID in args)
  const shipSessions = allEntries.filter((e) => e.trigger_command === 'bmad-ship' && !e.is_junk);

  // Collect WN sessions (bmad-sm with args containing 'wn', no story ID)
  const wnSessions = allEntries.filter((e) => {
    if (e.is_junk || e.trigger_command !== 'bmad-sm') return false;
    const args = (e.trigger_arguments ?? '').toLowerCase().trim();
    return args === 'wn';
  });

  // Track used ship/WN IDs so each is assigned to at most one story
  const usedShipIds = new Set<string>();
  const usedWnIds = new Set<string>();

  // Sort stories by epic then story number for stable output
  storyGroups.sort((a, b) => {
    const aStory = String((a.metadata as Record<string, unknown>)?.story_id ?? '');
    const bStory = String((b.metadata as Record<string, unknown>)?.story_id ?? '');
    return aStory.localeCompare(bStory, undefined, { numeric: true });
  });

  const stories: StoryChainView[] = [];

  for (const group of storyGroups) {
    const meta = (group.metadata ?? {}) as Record<string, unknown>;
    const storyId = String(meta.story_id ?? group.label);
    const epicId = String(meta.epic_id ?? storyId.split('.')[0]);
    const backtrackDetails = (meta.backtrack_details as string[]) ?? [];
    const backtracks = (meta.backtracks as number) ?? 0;

    // Build the chain from affinity group sessions
    const chainEntries = group.session_ids
      .map((id) => registry[id])
      .filter((e): e is RegistryEntry => e != null);

    // Sort chronologically
    chainEntries.sort((a, b) => a.started_at.localeCompare(b.started_at));

    // Detect backtracks: same role + same action repeated = retry.
    // Same role + different action = normal pipeline step (e.g., Bob CS then Bob VS
    // are intentionally separate windows with fresh context, not a backtrack).
    const seenSteps = new Set<string>();
    const chain: ChainSession[] = chainEntries.map((entry, i) => {
      const role = entry.workflow_role ?? entry.trigger_command ?? 'unknown';
      const actionPrefix =
        (entry.trigger_arguments ?? entry.workflow_action ?? '')
          .trim()
          .split(/\s+/)[0]
          ?.toUpperCase() ?? '_none_';
      const stepKey = `${role}:${actionPrefix}`;
      const isBacktrack = seenSteps.has(stepKey);
      seenSteps.add(stepKey);
      return toChainSession(entry, i + 1, isBacktrack, 'affinity');
    });

    const notes: string[] = [];

    // Find temporally correlated ship session
    // Use started_at (not last_active) — last_active can be hours later due to compactions
    const lastChainEntry = chainEntries[chainEntries.length - 1];
    let ship: ChainSession | null = null;
    if (lastChainEntry) {
      const lastTime = new Date(lastChainEntry.started_at).getTime();
      const shipEntry = findTemporalShip(lastTime, shipSessions, usedShipIds);
      if (shipEntry) {
        usedShipIds.add(shipEntry.session_id);
        ship = toChainSession(shipEntry, chain.length + 1, false, 'temporal');
      }
    }

    // Find temporally correlated WN (kickoff) session
    const firstChainEntry = chainEntries[0];
    let kickoff: ChainSession | null = null;
    if (firstChainEntry) {
      const firstTime = new Date(firstChainEntry.started_at).getTime();
      const wnEntry = findTemporalKickoff(firstTime, wnSessions, usedWnIds);
      if (wnEntry) {
        usedWnIds.add(wnEntry.session_id);
        kickoff = toChainSession(wnEntry, 0, false, 'temporal');
      }
    }

    // Check for expected roles that are missing
    const chainRoles = new Set(chain.map((s) => s.role));
    if (!chainRoles.has('advisor')) {
      notes.push(
        `Missing CU (advisor/Lisa) session — possibly not yet run or not captured by hooks`
      );
    }
    if (!ship && chainRoles.has('advisor')) {
      notes.push(`No ship session found within 90m of last chain step`);
    }

    // Determine status
    const hasActive = chainEntries.some((e) => e.status === 'active');
    let status: 'active' | 'complete' | 'waiting' = 'waiting';
    if (hasActive) {
      status = 'active';
    } else if (ship || chainRoles.has('observer')) {
      status = 'complete';
    } else if (chainRoles.has('advisor')) {
      status = 'complete'; // curated but not shipped is still effectively complete
    }

    stories.push({
      storyId,
      epicId,
      groupId: group.group_id,
      label: group.label,
      confidence: group.confidence,
      domainOverlay: group.domain_overlay ?? null,
      status,
      totalSteps: chain.length + (kickoff ? 1 : 0) + (ship ? 1 : 0),
      backtracks,
      backtrackDetails,
      chain,
      kickoff,
      ship,
      notes,
    });
  }

  // Group by epic
  const epicMap = new Map<string, StoryChainView[]>();
  for (const story of stories) {
    if (!epicMap.has(story.epicId)) epicMap.set(story.epicId, []);
    epicMap.get(story.epicId)!.push(story);
  }

  const epics = [...epicMap.entries()].map(([epicId, epicStories]) => ({
    epicId,
    epicTitle: `Epic ${epicId}`,
    storyCount: epicStories.length,
    completedCount: epicStories.filter((s) => s.status === 'complete').length,
    stories: epicStories,
  }));

  return {
    totalStories: stories.length,
    totalEpics: epics.length,
    epics,
  };
}
