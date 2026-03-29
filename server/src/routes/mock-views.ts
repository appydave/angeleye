/**
 * Mock-views routes — proof-of-concept APIs that reshape real AngelEye data
 * into view-model shapes for Mochaccino HTML mockups.
 *
 * All endpoints are read-only GET requests under /api/mock-views/*.
 * When real data is thin or missing, curated sample JSON from
 * .mochaccino/samples/ is served as fallback.
 */

import { Router } from 'express';
import { apiSuccessWithSource, apiFailure } from '../helpers/response.js';
import { logger } from '../config/logger.js';
import { loadSample, loadParamSample } from '../services/sample-data.service.js';
import {
  getObserverView,
  getOrganiserView,
  getNamedRowsView,
  getChatPanelView,
  getSyncView,
  getChainSprintBoardView,
  getChainStoryPipelineView,
  getChainSessionDetailView,
  getStoryChainsView,
  getWorkflowsView,
} from '../services/mock-views.service.js';

const router = Router();

function wantsSample(req: { query: Record<string, unknown> }): boolean {
  return req.query.sample === 'true';
}

router.get('/api/mock-views/observer', async (req, res, next) => {
  try {
    if (!wantsSample(req)) {
      const data = await getObserverView();
      if (data.totalCount > 0) return apiSuccessWithSource(res, data, 'live');
    }
    const sample = await loadSample('observer');
    if (sample) return apiSuccessWithSource(res, sample, 'sample');
    apiSuccessWithSource(res, await getObserverView(), 'live');
  } catch (err) {
    logger.error({ err }, 'mock-views: observer failed');
    next(err);
  }
});

router.get('/api/mock-views/organiser', async (req, res, next) => {
  try {
    if (!wantsSample(req)) {
      const data = await getOrganiserView();
      if (data.totalCount > 0) return apiSuccessWithSource(res, data, 'live');
    }
    const sample = await loadSample('organiser');
    if (sample) return apiSuccessWithSource(res, sample, 'sample');
    apiSuccessWithSource(res, await getOrganiserView(), 'live');
  } catch (err) {
    logger.error({ err }, 'mock-views: organiser failed');
    next(err);
  }
});

router.get('/api/mock-views/named-rows', async (req, res, next) => {
  try {
    if (!wantsSample(req)) {
      const data = await getNamedRowsView();
      if (data.totalCount > 0) return apiSuccessWithSource(res, data, 'live');
    }
    const sample = await loadSample('named-rows');
    if (sample) return apiSuccessWithSource(res, sample, 'sample');
    apiSuccessWithSource(res, await getNamedRowsView(), 'live');
  } catch (err) {
    logger.error({ err }, 'mock-views: named-rows failed');
    next(err);
  }
});

router.get('/api/mock-views/chat-panel', async (req, res, next) => {
  try {
    const sessionId = req.query.session ? String(req.query.session) : undefined;
    if (!wantsSample(req)) {
      const data = await getChatPanelView(sessionId);
      if (data.sessions.length > 0) return apiSuccessWithSource(res, data, 'live');
    }
    const sample = await loadSample('chat-panel');
    if (sample) return apiSuccessWithSource(res, sample, 'sample');
    apiSuccessWithSource(res, await getChatPanelView(sessionId), 'live');
  } catch (err) {
    logger.error({ err }, 'mock-views: chat-panel failed');
    next(err);
  }
});

router.get('/api/mock-views/sync', async (req, res, next) => {
  try {
    if (!wantsSample(req)) {
      const data = await getSyncView();
      if (data.totalSessions > 0) return apiSuccessWithSource(res, data, 'live');
    }
    const sample = await loadSample('sync');
    if (sample) return apiSuccessWithSource(res, sample, 'sample');
    apiSuccessWithSource(res, await getSyncView(), 'live');
  } catch (err) {
    logger.error({ err }, 'mock-views: sync failed');
    next(err);
  }
});

router.get('/api/mock-views/chain-sprint-board', async (req, res, next) => {
  try {
    if (!wantsSample(req)) {
      const data = await getChainSprintBoardView();
      if (data.epics.length > 0) return apiSuccessWithSource(res, data, 'live');
    }
    const sample = await loadSample('chain-sprint-board');
    if (sample) return apiSuccessWithSource(res, sample, 'sample');
    apiSuccessWithSource(res, await getChainSprintBoardView(), 'live');
  } catch (err) {
    logger.error({ err }, 'mock-views: chain-sprint-board failed');
    next(err);
  }
});

router.get('/api/mock-views/chain-story-pipeline/:groupId', async (req, res, next) => {
  try {
    if (!wantsSample(req)) {
      const data = await getChainStoryPipelineView(req.params.groupId);
      if (data) return apiSuccessWithSource(res, data, 'live');
    }
    const sample = await loadParamSample('chain-story-pipeline', req.params.groupId);
    if (sample) return apiSuccessWithSource(res, sample, 'sample');
    return apiFailure(res, 'Affinity group not found', 404);
  } catch (err) {
    logger.error({ err }, 'mock-views: chain-story-pipeline failed');
    next(err);
  }
});

router.get('/api/mock-views/chain-session-detail/:sessionId', async (req, res, next) => {
  try {
    if (!wantsSample(req)) {
      const data = await getChainSessionDetailView(req.params.sessionId);
      if (data) return apiSuccessWithSource(res, data, 'live');
    }
    const sample = await loadParamSample('chain-session-detail', req.params.sessionId);
    if (sample) return apiSuccessWithSource(res, sample, 'sample');
    return apiFailure(res, 'Session not found', 404);
  } catch (err) {
    logger.error({ err }, 'mock-views: chain-session-detail failed');
    next(err);
  }
});

router.get('/api/mock-views/story-chains', async (req, res, next) => {
  try {
    if (!wantsSample(req)) {
      const data = await getStoryChainsView();
      if (data.totalStories > 0) return apiSuccessWithSource(res, data, 'live');
    }
    const sample = await loadSample('story-chains');
    if (sample) return apiSuccessWithSource(res, sample, 'sample');
    apiSuccessWithSource(res, await getStoryChainsView(), 'live');
  } catch (err) {
    logger.error({ err }, 'mock-views: story-chains failed');
    next(err);
  }
});

router.get('/api/mock-views/story-chains/:storyId', async (req, res, next) => {
  try {
    if (!wantsSample(req)) {
      const data = await getStoryChainsView();
      const story = data.epics
        .flatMap((e) => e.stories)
        .find((s) => s.storyId === req.params.storyId);
      if (story) return apiSuccessWithSource(res, story, 'live');
    }
    const sample = await loadParamSample('story-chains', req.params.storyId);
    if (sample) return apiSuccessWithSource(res, sample, 'sample');
    return apiFailure(res, 'Story chain not found', 404);
  } catch (err) {
    logger.error({ err }, 'mock-views: story-chains/:storyId failed');
    next(err);
  }
});

router.get('/api/mock-views/workflows', async (req, res, next) => {
  try {
    if (!wantsSample(req)) {
      const data = await getWorkflowsView();
      if (data.totalCount > 0) return apiSuccessWithSource(res, data, 'live');
    }
    const sample = await loadSample('workflows');
    if (sample) return apiSuccessWithSource(res, sample, 'sample');
    apiSuccessWithSource(res, await getWorkflowsView(), 'live');
  } catch (err) {
    logger.error({ err }, 'mock-views: workflows failed');
    next(err);
  }
});

// Generic catch-all for future sample-only views (no service function needed)
router.get('/api/mock-views/:viewName', async (req, res, next) => {
  try {
    const sample = await loadSample(req.params.viewName);
    if (sample) return apiSuccessWithSource(res, sample, 'sample');
    return apiFailure(res, `Unknown view: ${req.params.viewName}`, 404);
  } catch (err) {
    logger.error({ err }, 'mock-views: generic catch-all failed');
    next(err);
  }
});

export default router;
