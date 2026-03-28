import { randomUUID } from 'node:crypto';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type {
  AffinityGroup,
  AffinityConfidence,
  AffinityGroupType,
  RegistryEntry,
} from '@appystack/shared';
import { getDataDir, updateRegistry } from './registry.service.js';
import { join } from 'node:path';
import { logger } from '../config/logger.js';

// ── Story ID extraction ────────────────────────────────────────────────────

const STORY_ID_PATTERN = /(\d+\.\d+)/;

/**
 * Extract a story ID (e.g., "2.4") from trigger_arguments text.
 * Handles patterns like "DS 2.4", "2.4", "Story 2.4", "story-2.4", "DR 2.4".
 */
export function extractStoryId(triggerArguments: string | null | undefined): string | null {
  if (!triggerArguments) return null;
  const match = triggerArguments.match(STORY_ID_PATTERN);
  return match ? match[1]! : null;
}

// ── Candidate group from a signal ──────────────────────────────────────────

interface CandidateGroup {
  session_ids: string[];
  confidence: AffinityConfidence;
  group_type: AffinityGroupType;
  label: string;
  domain_overlay?: string;
  metadata: Record<string, unknown>;
}

// ── Signal 1: Shared story ID in trigger_arguments ─────────────────────────

function signalStoryId(entries: RegistryEntry[]): CandidateGroup[] {
  // Group sessions by story ID, only those with trigger_arguments containing a story ID
  const byStoryId = new Map<string, RegistryEntry[]>();

  for (const entry of entries) {
    const storyId = extractStoryId(entry.trigger_arguments);
    if (!storyId) continue;

    const existing = byStoryId.get(storyId) ?? [];
    existing.push(entry);
    byStoryId.set(storyId, existing);
  }

  const candidates: CandidateGroup[] = [];

  for (const [storyId, sessions] of byStoryId) {
    if (sessions.length < 2) continue;

    // Sort by started_at
    sessions.sort((a, b) => a.started_at.localeCompare(b.started_at));

    // Only group sessions within 7 days of each other
    const clusters = clusterByTimeGap(sessions, 7 * 24 * 60 * 60 * 1000);

    for (const cluster of clusters) {
      if (cluster.length < 2) continue;

      // Collect agent names from workflow_identity
      const agents = cluster
        .map((s) => s.workflow_identity)
        .filter((id): id is string => id != null && id.length > 0);
      const uniqueAgents = [...new Set(agents)];

      // Detect the domain overlay (use the first one found)
      const overlayEntry = cluster.find(
        (s) => s.workflow_role != null && s.workflow_role.length > 0
      );

      candidates.push({
        session_ids: cluster.map((s) => s.session_id),
        confidence: 'deterministic',
        group_type: 'story_unit',
        label: `Story ${storyId}`,
        domain_overlay: overlayEntry ? detectDomainFromEntry(overlayEntry) : undefined,
        metadata: {
          story_id: storyId,
          epic_id: storyId.split('.')[0],
          agents: uniqueAgents,
        },
      });
    }
  }

  return candidates;
}

// ── Signal 2: Temporal proximity with same domain overlay ──────────────────

function signalTemporalProximity(entries: RegistryEntry[]): CandidateGroup[] {
  // Filter to sessions that have a workflow role (i.e., resolved by an overlay)
  const overlayEntries = entries.filter(
    (e) => e.workflow_role != null && e.workflow_role.length > 0
  );

  if (overlayEntries.length < 2) return [];

  // Sort by started_at
  overlayEntries.sort((a, b) => a.started_at.localeCompare(b.started_at));

  // Cluster by 4-hour gaps
  const clusters = clusterByTimeGap(overlayEntries, 4 * 60 * 60 * 1000);

  const candidates: CandidateGroup[] = [];

  for (const cluster of clusters) {
    if (cluster.length < 2) continue;

    // Skip if this cluster would be fully covered by a story_unit group
    // (let Signal 1 handle those)
    const hasStoryIds = cluster.every((s) => extractStoryId(s.trigger_arguments) != null);
    if (hasStoryIds) continue;

    const agents = cluster
      .map((s) => s.workflow_identity)
      .filter((id): id is string => id != null && id.length > 0);
    const uniqueAgents = [...new Set(agents)];

    // Label from the earliest trigger command
    const firstCommand = cluster[0]!.trigger_command ?? 'unknown';
    const label = `Workflow cluster: ${firstCommand}`;

    candidates.push({
      session_ids: cluster.map((s) => s.session_id),
      confidence: 'heuristic',
      group_type: 'ad_hoc',
      label,
      domain_overlay: detectDomainFromEntry(cluster[0]!),
      metadata: {
        agents: uniqueAgents,
      },
    });
  }

  return candidates;
}

// ── Signal 3: Cross-project file access ────────────────────────────────────

function signalCrossProjectAccess(entries: RegistryEntry[]): CandidateGroup[] {
  // Sessions with cross_project_reads might be linked to sessions in the read project
  const crossReaders = entries.filter((e) => e.has_cross_project_reads === true);
  if (crossReaders.length === 0) return [];

  const candidates: CandidateGroup[] = [];

  // Build a map from project_dir to sessions
  const byProjectDir = new Map<string, RegistryEntry[]>();
  for (const entry of entries) {
    if (!entry.project_dir) continue;
    const existing = byProjectDir.get(entry.project_dir) ?? [];
    existing.push(entry);
    byProjectDir.set(entry.project_dir, existing);
  }

  for (const reader of crossReaders) {
    const readerTime = new Date(reader.started_at).getTime();

    // Check if any other sessions in different project dirs are within 4 hours
    for (const [dir, dirSessions] of byProjectDir) {
      if (dir === reader.project_dir) continue;

      const nearby = dirSessions.filter((s) => {
        const sTime = new Date(s.started_at).getTime();
        return Math.abs(sTime - readerTime) <= 4 * 60 * 60 * 1000;
      });

      if (nearby.length === 0) continue;

      const sessionIds = [reader.session_id, ...nearby.map((s) => s.session_id)];
      // Deduplicate
      const unique = [...new Set(sessionIds)];
      if (unique.length < 2) continue;

      candidates.push({
        session_ids: unique,
        confidence: 'heuristic',
        group_type: 'ad_hoc',
        label: `Cross-project: ${reader.project ?? 'unknown'} <-> ${nearby[0]!.project ?? 'unknown'}`,
        metadata: {
          source_project: reader.project_dir,
          target_project: dir,
        },
      });
    }
  }

  return candidates;
}

// ── Clustering helper ──────────────────────────────────────────────────────

function clusterByTimeGap(sorted: RegistryEntry[], gapMs: number): RegistryEntry[][] {
  if (sorted.length === 0) return [];

  const clusters: RegistryEntry[][] = [[sorted[0]!]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]!.started_at).getTime();
    const curr = new Date(sorted[i]!.started_at).getTime();

    if (curr - prev > gapMs) {
      clusters.push([sorted[i]!]);
    } else {
      clusters[clusters.length - 1]!.push(sorted[i]!);
    }
  }

  return clusters;
}

// ── Domain detection helper ────────────────────────────────────────────────

function detectDomainFromEntry(entry: RegistryEntry): string | undefined {
  // We infer domain from the trigger command pattern
  const cmd = entry.trigger_command;
  if (!cmd) return undefined;
  if (cmd.startsWith('bmad-') || cmd.startsWith('/bmad-')) return 'bmad-v6';
  return undefined;
}

// ── Action prefix extraction ────────────────────────────────────────────────

/**
 * Extract the action prefix from trigger_arguments (e.g., "CS 0.1" → "CS", "wn" → "WN").
 * Used to distinguish pipeline steps: Bob CS and Bob VS are different steps,
 * but Bob CS appearing twice is a backtrack (retry).
 */
function extractActionPrefix(args: string | null | undefined): string {
  if (!args) return '_none_';
  const first = args.trim().split(/\s+/)[0] ?? '';
  return first.toUpperCase() || '_none_';
}

// ── Chain ordering + backtrack detection ────────────────────────────────────

function addChainMetadata(
  group: AffinityGroup,
  entries: Map<string, RegistryEntry>
): AffinityGroup {
  const sessions = group.session_ids
    .map((id: string) => entries.get(id))
    .filter((e): e is RegistryEntry => e != null);

  sessions.sort((a: RegistryEntry, b: RegistryEntry) => a.started_at.localeCompare(b.started_at));

  const chainSteps: string[] = [];
  const seenSteps = new Set<string>();
  const backtracks: string[] = [];

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i]!;
    const role = s.workflow_role ?? s.trigger_command ?? 'unknown';
    chainSteps.push(role);

    // Backtrack = same role + same action repeated (e.g., Nate DR twice = retry).
    // Same role + different action is a normal pipeline step (e.g., Bob CS then Bob VS
    // are intentionally run in separate windows with fresh context).
    const action = extractActionPrefix(s.trigger_arguments ?? s.workflow_action);
    const stepKey = `${role}:${action}`;

    if (seenSteps.has(stepKey)) {
      backtracks.push(`${role}:${action}@${i + 1}`);
    }
    seenSteps.add(stepKey);
  }

  return {
    ...group,
    session_ids: sessions.map((s) => s.session_id),
    metadata: {
      ...group.metadata,
      chain_steps: chainSteps,
      backtracks: backtracks.length,
      backtrack_details: backtracks.length > 0 ? backtracks : undefined,
    },
  };
}

// ── Merge overlapping candidate groups ─────────────────────────────────────

const CONFIDENCE_RANK: Record<AffinityConfidence, number> = {
  deterministic: 3,
  heuristic: 2,
  inferred: 1,
};

function mergeCandidates(candidates: CandidateGroup[]): CandidateGroup[] {
  if (candidates.length <= 1) return candidates;

  // Build a union-find over candidate indices
  const parent = candidates.map((_, i) => i);

  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]!]!;
      x = parent[x]!;
    }
    return x;
  }

  function union(a: number, b: number): void {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  }

  // Build session -> candidate indices map
  const sessionToCandidates = new Map<string, number[]>();
  for (let i = 0; i < candidates.length; i++) {
    for (const sid of candidates[i]!.session_ids) {
      const existing = sessionToCandidates.get(sid) ?? [];
      existing.push(i);
      sessionToCandidates.set(sid, existing);
    }
  }

  // Merge candidates that share 2+ sessions — but only within the same group_type.
  // Story units should never merge with ad_hoc temporal clusters, even if they
  // share sessions. Without this guard, Signal 2 temporal clusters act as bridges
  // that incorrectly merge separate story groups together.
  for (const [, indices] of sessionToCandidates) {
    if (indices.length >= 2) {
      for (let i = 1; i < indices.length; i++) {
        const a = candidates[find(indices[0]!)]!;
        const b = candidates[find(indices[i]!)]!;

        // Only merge groups of the same type
        if (a.group_type !== b.group_type) continue;

        // Check overlap count
        const aSet = new Set(a.session_ids);
        const bSessions = b.session_ids;
        const overlap = bSessions.filter((s) => aSet.has(s)).length;
        if (overlap >= 2) {
          union(indices[0]!, indices[i]!);
        }
      }
    }
  }

  // Group by root
  const groups = new Map<number, CandidateGroup[]>();
  for (let i = 0; i < candidates.length; i++) {
    const root = find(i);
    const existing = groups.get(root) ?? [];
    existing.push(candidates[i]!);
    groups.set(root, existing);
  }

  // Merge each group
  const merged: CandidateGroup[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      merged.push(group[0]!);
      continue;
    }

    // Use the highest confidence candidate as the base
    group.sort(
      (a, b) => (CONFIDENCE_RANK[b.confidence] ?? 0) - (CONFIDENCE_RANK[a.confidence] ?? 0)
    );
    const base = group[0]!;

    // Merge all session IDs
    const allSessionIds = new Set<string>();
    for (const g of group) {
      for (const sid of g.session_ids) {
        allSessionIds.add(sid);
      }
    }

    // Merge metadata
    const mergedMeta: Record<string, unknown> = {};
    for (const g of group) {
      if (g.metadata) {
        Object.assign(mergedMeta, g.metadata);
      }
    }

    merged.push({
      ...base,
      session_ids: [...allSessionIds],
      metadata: mergedMeta,
    });
  }

  return merged;
}

// ── Main correlator entry point ────────────────────────────────────────────

export interface CorrelationResult {
  groups: AffinityGroup[];
  session_group_map: Record<string, string[]>;
}

export function correlateAffinityGroups(entries: RegistryEntry[]): CorrelationResult {
  // Filter to entries that have classification data (E01/E02/C14-C16 or P18)
  const workflowEntries = entries.filter(
    (e) =>
      !e.is_junk &&
      (e.trigger_command != null ||
        e.trigger_arguments != null ||
        e.workflow_role != null ||
        e.has_cross_project_reads === true)
  );

  if (workflowEntries.length === 0) {
    return { groups: [], session_group_map: {} };
  }

  // Run all signals — Signal 1 first so we can exclude its sessions from Signal 2
  const signal1 = signalStoryId(workflowEntries);

  // Collect session IDs already covered by story groups — exclude from temporal clustering
  const storySessionIds = new Set<string>();
  for (const group of signal1) {
    for (const sid of group.session_ids) {
      storySessionIds.add(sid);
    }
  }
  const nonStoryEntries = workflowEntries.filter((e) => !storySessionIds.has(e.session_id));
  const signal2 = signalTemporalProximity(nonStoryEntries);
  const signal3 = signalCrossProjectAccess(workflowEntries);

  // Merge overlapping candidates
  const allCandidates = [...signal1, ...signal2, ...signal3];
  const merged = mergeCandidates(allCandidates);

  // Build entry lookup for chain metadata
  const entryMap = new Map<string, RegistryEntry>();
  for (const e of entries) {
    entryMap.set(e.session_id, e);
  }

  // Convert candidates to AffinityGroups
  const now = new Date().toISOString();
  const groups: AffinityGroup[] = merged.map((candidate) => {
    const group: AffinityGroup = {
      group_id: randomUUID(),
      group_type: candidate.group_type,
      label: candidate.label,
      session_ids: candidate.session_ids,
      confidence: candidate.confidence,
      domain_overlay: candidate.domain_overlay,
      created_at: now,
      metadata: candidate.metadata,
    };

    // Add chain ordering metadata
    return addChainMetadata(group, entryMap);
  }) as AffinityGroup[];

  // Build session -> group_ids map
  const session_group_map: Record<string, string[]> = {};
  for (const group of groups) {
    for (const sid of group.session_ids) {
      if (!session_group_map[sid]) {
        session_group_map[sid] = [];
      }
      session_group_map[sid]!.push(group.group_id);
    }
  }

  return { groups, session_group_map };
}

// ── Storage ────────────────────────────────────────────────────────────────

function affinityGroupsPath(): string {
  return join(getDataDir(), 'affinity-groups.json');
}

export async function loadAffinityGroups(): Promise<AffinityGroup[]> {
  const filePath = affinityGroupsPath();
  if (!existsSync(filePath)) return [];

  try {
    const raw = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as AffinityGroup[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    logger.warn({ err }, 'Could not read affinity-groups.json, returning empty');
    return [];
  }
}

export async function saveAffinityGroups(groups: AffinityGroup[]): Promise<void> {
  const filePath = affinityGroupsPath();
  const tmp = filePath + '.tmp';
  await writeFile(tmp, JSON.stringify(groups, null, 2), 'utf-8');
  await rename(tmp, filePath);
}

export async function updateSessionGroupIds(
  sessionGroupMap: Record<string, string[]>
): Promise<void> {
  for (const [sessionId, groupIds] of Object.entries(sessionGroupMap)) {
    await updateRegistry(sessionId, { group_ids: groupIds } as Partial<RegistryEntry>);
  }
}
