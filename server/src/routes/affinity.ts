import { Router } from 'express';
import { apiSuccess, apiFailure } from '../helpers/response.js';
import { readRegistry } from '../services/registry.service.js';
import {
  correlateAffinityGroups,
  loadAffinityGroups,
  saveAffinityGroups,
  updateSessionGroupIds,
} from '../services/correlator.service.js';
import { logger } from '../config/logger.js';

const router = Router();

// GET /api/affinity-groups — list all groups
router.get('/', async (_req, res) => {
  try {
    const groups = await loadAffinityGroups();
    return apiSuccess(res, { groups, total: groups.length });
  } catch (err) {
    logger.error({ err }, 'Failed to list affinity groups');
    return apiFailure(res, 'Failed to list affinity groups', 500);
  }
});

// GET /api/affinity-groups/:groupId — get one group with its sessions
router.get('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const groups = await loadAffinityGroups();
    const group = groups.find((g) => g.group_id === groupId);

    if (!group) {
      return apiFailure(res, 'Affinity group not found', 404);
    }

    // Fetch the registry entries for this group's sessions
    const registry = await readRegistry();
    const sessions = group.session_ids
      .map((id: string) => registry[id])
      .filter((entry): entry is NonNullable<typeof entry> => entry != null);

    return apiSuccess(res, { group, sessions });
  } catch (err) {
    logger.error({ err }, 'Failed to get affinity group');
    return apiFailure(res, 'Failed to get affinity group', 500);
  }
});

// POST /api/affinity-groups/correlate — trigger correlation
router.post('/correlate', async (_req, res) => {
  try {
    const registry = await readRegistry();
    const entries = Object.values(registry);

    const result = correlateAffinityGroups(entries);

    // Save groups
    await saveAffinityGroups(result.groups);

    // Update session group_ids
    await updateSessionGroupIds(result.session_group_map);

    logger.info(
      {
        groupCount: result.groups.length,
        mappedSessions: Object.keys(result.session_group_map).length,
      },
      'Correlation complete'
    );

    return apiSuccess(res, {
      groups_created: result.groups.length,
      sessions_mapped: Object.keys(result.session_group_map).length,
      groups: result.groups,
    });
  } catch (err) {
    logger.error({ err }, 'Correlation failed');
    return apiFailure(res, 'Correlation failed', 500);
  }
});

export default router;
