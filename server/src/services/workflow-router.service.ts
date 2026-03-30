import type {
  RegistryEntry,
  StationConfig,
  WorkflowType,
  WorkflowInstance,
  StationInstance,
} from '@appystack/shared';
import { logger } from '../config/logger.js';
import { readRegistry } from './registry.service.js';
import { getWorkflowType } from './workflow-type.service.js';
import { readWorkflows, createWorkflow, updateWorkflow } from './workflow.service.js';

// ── Result type ────────────────────────────────────────────────────────────

export interface SeedResult {
  workflows_created: number;
  workflows_updated: number;
  sessions_routed: number;
  sessions_unroutable: number;
  unroutable_reasons: Array<{ session_id: string; reason: string }>;
}

// ── Internal types ─────────────────────────────────────────────────────────

interface ParsedAction {
  actionCode: string;
  storyId: string | null;
}

interface RoutableSession {
  session_id: string;
  role: string;
  actionCode: string;
  storyId: string;
}

// ── Parsing ────────────────────────────────────────────────────────────────

function parseAction(action: string | null | undefined): ParsedAction | null {
  if (!action) return null;
  const trimmed = action.trim();
  if (trimmed.length === 0) return null;

  // "wn" or "WN" -> gatekeeper, no story
  if (trimmed.toLowerCase() === 'wn') return { actionCode: 'WN', storyId: null };

  // "DS 2.2" -> actionCode=DS, storyId=2.2
  const parts = trimmed.split(/\s+/, 2);
  if (parts.length === 2) return { actionCode: parts[0]!.toUpperCase(), storyId: parts[1]! };

  // Single token that's not "wn" — could be just a story id like "2.3" with no action
  // If it looks numeric (e.g. "2.3"), it's a story id without an action code
  if (/^\d/.test(trimmed)) return null;

  // Otherwise treat as action code without story
  return { actionCode: trimmed.toUpperCase(), storyId: null };
}

// ── Station map builder ────────────────────────────────────────────────────

function buildStationMap(type: WorkflowType): Map<string, StationConfig> {
  const map = new Map<string, StationConfig>();
  for (const station of type.stations) {
    // Standard: role:action_code
    map.set(`${station.role}:${station.action_code}`, station);
    // For SAT-* stations, also map role:suffix (e.g. tester:CS for SAT-CS)
    if (station.action_code.startsWith('SAT-')) {
      const suffix = station.action_code.slice(4);
      map.set(`${station.role}:${suffix}`, station);
    }
    // For shipper, also map role alone (sessions may have null action)
    if (station.role === 'shipper') {
      map.set(`${station.role}:`, station);
    }
  }
  return map;
}

function lookupStation(
  stationMap: Map<string, StationConfig>,
  role: string,
  actionCode: string
): StationConfig | undefined {
  // Primary: role:actionCode
  const primary = stationMap.get(`${role}:${actionCode}`);
  if (primary) return primary;
  // Fallback: role-less catch (shipper pattern)
  const roleFallback = stationMap.get(`${role}:`);
  if (roleFallback) return roleFallback;
  // Last resort: scan for actionCode match ignoring role (e.g. CU from bmad-sat routes to advisor:CU)
  for (const [key, config] of stationMap) {
    if (key.endsWith(`:${actionCode}`)) {
      logger.warn(
        { role, actionCode, matchedKey: key },
        'lookupStation: action-code fallback — role mismatch'
      );
      return config;
    }
  }
  return undefined;
}

// ── Options ────────────────────────────────────────────────────────────────

export interface SeedOptions {
  dryRun?: boolean;
}

// ── Concurrency guard ─────────────────────────────────────────────────────

let seedInProgress = false;

// ── Main seed function ─────────────────────────────────────────────────────

export async function seedWorkflowsFromRegistry(options: SeedOptions = {}): Promise<SeedResult> {
  if (seedInProgress) {
    throw new Error('Seed already in progress');
  }
  seedInProgress = true;

  try {
    return await _seedWorkflowsFromRegistryImpl(options);
  } finally {
    seedInProgress = false;
  }
}

async function _seedWorkflowsFromRegistryImpl(options: SeedOptions): Promise<SeedResult> {
  const { dryRun = false } = options;
  const result: SeedResult = {
    workflows_created: 0,
    workflows_updated: 0,
    sessions_routed: 0,
    sessions_unroutable: 0,
    unroutable_reasons: [],
  };

  // Step 1: Read registry and workflow type config
  const registry = await readRegistry();
  const workflowType = await getWorkflowType('regular_story');

  if (!workflowType) {
    throw new Error('Workflow type "regular_story" not found — check server/src/config/workflows/');
  }

  const stationMap = buildStationMap(workflowType);
  const entries = Object.values(registry) as RegistryEntry[];

  // Step 2: Filter to BMAD sessions and classify
  const routable: RoutableSession[] = [];

  for (const entry of entries) {
    const cmd = entry.trigger_command;
    if (!cmd || !cmd.startsWith('bmad')) continue;

    // Must have a workflow_action
    if (!entry.workflow_action) {
      result.sessions_unroutable++;
      result.unroutable_reasons.push({
        session_id: entry.session_id,
        reason: `bmad session with null workflow_action (command: ${cmd})`,
      });
      continue;
    }

    const parsed = parseAction(entry.workflow_action);

    if (!parsed) {
      result.sessions_unroutable++;
      result.unroutable_reasons.push({
        session_id: entry.session_id,
        reason: `action code missing (workflow_action: ${entry.workflow_action})`,
      });
      continue;
    }

    // Must have a story id to be associated with a workflow instance
    if (!parsed.storyId) {
      if (parsed.actionCode === 'WN') {
        // WN is a gatekeeper query — it discovers the next story ID.
        // Cannot associate with a specific workflow yet. Log separately.
        result.sessions_unroutable++;
        result.unroutable_reasons.push({
          session_id: entry.session_id,
          reason: `gatekeeper session (WN) — pending workflow association`,
        });
      } else {
        result.sessions_unroutable++;
        result.unroutable_reasons.push({
          session_id: entry.session_id,
          reason: `no story id (actionCode: ${parsed.actionCode})`,
        });
      }
      continue;
    }

    // Must have a role to disambiguate station
    const role = entry.workflow_role;
    if (!role) {
      result.sessions_unroutable++;
      result.unroutable_reasons.push({
        session_id: entry.session_id,
        reason: `no workflow_role for station disambiguation`,
      });
      continue;
    }

    // Must resolve to a known station
    const station = lookupStation(stationMap, role, parsed.actionCode);
    if (!station) {
      result.sessions_unroutable++;
      result.unroutable_reasons.push({
        session_id: entry.session_id,
        reason: `no station found for role=${role} actionCode=${parsed.actionCode}`,
      });
      continue;
    }

    routable.push({
      session_id: entry.session_id,
      role,
      actionCode: parsed.actionCode,
      storyId: parsed.storyId,
    });
  }

  // Step 3: Group by storyId
  const byStory = new Map<string, RoutableSession[]>();
  for (const session of routable) {
    const existing = byStory.get(session.storyId);
    if (existing) {
      existing.push(session);
    } else {
      byStory.set(session.storyId, [session]);
    }
  }

  // Step 4: Find or create workflow instances, associate sessions
  const existingWorkflows = await readWorkflows();
  const workflowsByItemId = new Map<string, WorkflowInstance>();
  for (const wf of existingWorkflows) {
    workflowsByItemId.set(wf.work_item_id, wf);
  }

  for (const [storyId, sessions] of byStory) {
    const workItemId = storyId;
    let workflow = workflowsByItemId.get(workItemId);
    let isNew = false;

    if (!workflow) {
      if (dryRun) {
        // In dry-run mode, count but don't persist
        result.workflows_created++;
        // Count all sessions for this story as routed
        for (const session of sessions) {
          const sc = lookupStation(stationMap, session.role, session.actionCode);
          if (sc) result.sessions_routed++;
        }
        continue;
      }
      // Create new workflow instance
      workflow = await createWorkflow({
        workflow_type_id: 'regular_story',
        work_item_id: workItemId,
        work_item_label: `Story ${storyId}`,
        stations: workflowType.stations.map((s) => ({
          position: s.position,
          action_code: s.action_code,
        })),
      });
      workflowsByItemId.set(workItemId, workflow);
      result.workflows_created++;
      isNew = true;
    }

    // Associate sessions with stations
    let workflowModified = false;
    const stations = [...workflow.stations];

    for (const session of sessions) {
      const stationConfig = lookupStation(stationMap, session.role, session.actionCode);
      if (!stationConfig) continue; // already validated above, but guard

      const stationIdx = stations.findIndex((s) => s.position === stationConfig.position);
      if (stationIdx === -1) continue;

      const station: StationInstance = {
        ...stations[stationIdx]!,
        session_ids: [...stations[stationIdx]!.session_ids],
      };

      // Idempotency: don't add duplicate session_ids
      if (station.session_ids.includes(session.session_id)) continue;

      // If station had no sessions, mark it in_progress
      if (station.session_ids.length === 0) {
        station.state = 'in_progress';
        station.started_at = new Date().toISOString();
      }

      station.session_ids = [...station.session_ids, session.session_id];
      stations[stationIdx] = station;
      workflowModified = true;
      result.sessions_routed++;
    }

    // Check if stations should be marked completed
    for (const station of stations) {
      if (station.state === 'in_progress' && station.session_ids.length > 0) {
        const allEnded = station.session_ids.every((sid) => {
          const entry = registry[sid];
          return entry && entry.status === 'ended';
        });
        if (allEnded) {
          station.state = 'completed';
          station.completed_at = station.completed_at ?? new Date().toISOString();
          workflowModified = true;
          // Compute duration from first started_at to last session's last_active
          if (station.started_at && !station.duration_ms) {
            const lastActive = station.session_ids
              .map((sid) => registry[sid]?.last_active)
              .filter(Boolean)
              .sort()
              .pop();
            if (lastActive) {
              station.duration_ms =
                new Date(lastActive).getTime() - new Date(station.started_at).getTime();
            }
          }
        }
      }
    }

    // Check if workflow should be closed:
    // All populated stations must be completed AND either:
    // - The final station (highest position) has sessions, OR
    // - At least half of all stations have sessions (substantial coverage)
    const populatedStations = stations.filter((s) => s.session_ids.length > 0);
    const allPopulatedComplete =
      populatedStations.length > 0 && populatedStations.every((s) => s.state === 'completed');
    const highestPosition = Math.max(...stations.map((s) => s.position));
    const highestStation = stations.find((s) => s.position === highestPosition);
    const highestStationPopulated = highestStation ? highestStation.session_ids.length > 0 : false;
    const substantialCoverage = populatedStations.length >= Math.ceil(stations.length / 2);
    if (allPopulatedComplete && (highestStationPopulated || substantialCoverage)) {
      workflow.status = 'closed';
    }

    if (workflowModified && !dryRun) {
      // Compute current_station: highest in-progress or completed position
      let currentStation = 0;
      for (const station of stations) {
        if (station.state === 'in_progress' || station.state === 'completed') {
          if (station.position > currentStation) {
            currentStation = station.position;
          }
        }
      }

      // Update workflow status
      const status = workflow.status === 'not_started' ? 'in_progress' : workflow.status;

      await updateWorkflow(workflow.instance_id, {
        stations,
        current_station: currentStation,
        status,
      });

      if (!isNew) {
        result.workflows_updated++;
      }
    }
  }

  logger.info(
    {
      created: result.workflows_created,
      updated: result.workflows_updated,
      routed: result.sessions_routed,
      unroutable: result.sessions_unroutable,
    },
    'workflow-router: seed complete'
  );

  return result;
}
