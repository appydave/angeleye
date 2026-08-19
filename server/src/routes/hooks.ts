import { Router } from 'express';
import type { Server } from 'socket.io';
import type { AngelEyeEvent, AngelEyeEventType } from '@appystack/shared';
import { SOCKET_EVENTS } from '@appystack/shared';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import { appendFile } from 'node:fs/promises';
import {
  writeEvent,
  getSessionEvents,
  archiveSession,
  backupUpstreamJSONL,
} from '../services/sessions.service.js';
import { readRegistry, updateRegistry, _unknownHooksPath } from '../services/registry.service.js';
import { classifySession, findFirstRealPrompt } from '../services/classifier.service.js';
import { auditPayload } from '../services/schema-auditor.service.js';
import { detectTeammate } from '../services/teammate-detection.service.js';
import { detectSubprocess } from '../services/subprocess-detection.service.js';
import {
  computeSessionClass,
  detectMachineSignalFromCwd,
  canonicalProjectFromCwd,
} from '../services/session-class.service.js';

const EVENT_MAP: Record<string, AngelEyeEventType> = {
  // Original 7
  SessionStart: 'session_start',
  UserPromptSubmit: 'user_prompt',
  PostToolUse: 'tool_use',
  Stop: 'stop',
  SessionEnd: 'session_end',
  SubagentStart: 'subagent_start',
  SubagentStop: 'subagent_stop',
  // Wave 11 + v2.1.167 canonical reconcile — full hook coverage (21 new, 30 total)
  PostToolUseFailure: 'tool_failure',
  StopFailure: 'stop_failure',
  WorktreeCreate: 'worktree_create',
  WorktreeRemove: 'worktree_remove',
  CwdChanged: 'cwd_changed',
  PreToolUse: 'pre_tool_use',
  InstructionsLoaded: 'instructions_loaded',
  PreCompact: 'pre_compact',
  PostCompact: 'post_compact',
  PermissionRequest: 'permission_request',
  Notification: 'notification',
  TeammateIdle: 'teammate_idle',
  TaskCompleted: 'task_completed',
  ConfigChange: 'config_change',
  Elicitation: 'elicitation',
  ElicitationResult: 'elicitation_result',
  FileChanged: 'file_changed',
  // v2.1.84+ — added 2026-05-13
  TaskCreated: 'task_created',
  PermissionDenied: 'permission_denied',
  // v2.1.167 canonical reconcile — added 2026-06-07
  Setup: 'setup',
  UserPromptExpansion: 'user_prompt_expansion',
  PostToolBatch: 'post_tool_batch',
  // display-only (per-message-render); high-volume — candidate for sampling/exclusion if event volume becomes a problem
  MessageDisplay: 'message_display',
  // v2.1.219 canonical reconcile — added 2026-07-25 (31st event).
  // Workspace SCOPE change: the session's root set grew via /add-dir (source:
  // "slash_command") or the SDK register_repo_root control request (source:
  // "register_repo_root"). Non-blocking; payload carries `directory` + `source`.
  DirectoryAdded: 'directory_added',
};

// Events the server CAN receive (all of EVENT_MAP) but that must NOT be wired as
// passthrough command hooks in settings.json. The /api/hooks/supported endpoint
// surfaces these so the angeleye-install skill never re-registers them. EVENT_MAP
// deliberately keeps them — the mapping is harmless and lets the server ingest the
// event if it ever arrives via another mechanism.
const HOOK_REGISTRATION_EXCLUSIONS: Record<string, { reason: string; optional: boolean }> = {
  // HARD exclude (optional:false) — registering this breaks worktree creation.
  // WorktreeCreate REPLACES git's worktree workflow: Claude Code reads the hook's
  // stdout as the worktree path, so a `curl … || true` hook feeds the response body
  // ("{"continue":true}") in as a path → ENOENT, breaking bg-isolated sessions.
  // There is no observer-only mode. Verified 2026-05-19. See docs/architecture/hook-transport.md.
  WorktreeCreate: {
    reason:
      'Replaces git worktree creation entirely; a passthrough command hook makes Claude Code read the curl response body as the worktree path (ENOENT). No observer-only mode — never register.',
    optional: false,
  },
  // SOFT exclude (optional:true) — safe to register, but opt-in only.
  // Fires on every assistant-message render (highest-frequency hook) and is
  // display-only, so it duplicates the assistant text already captured at Stop.
  MessageDisplay: {
    reason:
      'Fires per message render (highest frequency, display-only) and duplicates assistant text already captured at Stop. Opt-in only to avoid per-render curl overhead.',
    optional: true,
  },
};

// Size-bounded deep copy for anything we persist from a raw hook payload.
//
// The previous guard only truncated TOP-LEVEL strings (`typeof v === 'string' && v.length > 500`),
// which is no guard at all for `tool_response` — a Read of a large file arrives as a big string
// nested one level down and would have been written to the session JSONL whole. Bound depth,
// array length and string length together so one pathological event cannot blow up the store.
const MAX_DEPTH = 6;
const MAX_ARRAY_ITEMS = 50;

function boundValue(value: unknown, maxString: number, depth = 0): unknown {
  if (typeof value === 'string') {
    return value.length > maxString
      ? `${value.slice(0, maxString)}…[+${value.length - maxString}]`
      : value;
  }
  if (value === null || typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return '[truncated: max depth]';
  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_ARRAY_ITEMS).map((v) => boundValue(v, maxString, depth + 1));
    if (value.length > MAX_ARRAY_ITEMS) items.push(`[+${value.length - MAX_ARRAY_ITEMS} more]`);
    return items;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([k, v]) => [
      k,
      boundValue(v, maxString, depth + 1),
    ])
  );
}

function summariseTool(
  toolName: string,
  toolInput: Record<string, unknown>
): Record<string, unknown> {
  if (toolName === 'Bash') return { command: String(toolInput.command ?? '').slice(0, 300) };
  if (toolName === 'Write')
    return {
      file: toolInput.file_path,
      lines: String(toolInput.content ?? '').split('\n').length,
    };
  if (toolName === 'Read') return { file: toolInput.file_path };
  if (toolName === 'Edit' || toolName === 'MultiEdit') return { file: toolInput.file_path };
  if (toolName.startsWith('mcp__')) {
    const parts = toolName.split('__');
    return { mcp_server: parts[1], mcp_tool: parts.slice(2).join('__') };
  }
  return { keys: Object.keys(toolInput).slice(0, 5) };
}

export function createHooksRouter(io: Server): Router {
  const router = Router();

  // Source-of-truth endpoint — the angeleye-install skill calls this to learn
  // which hook events to subscribe Claude Code to. Eliminates the parallel-list
  // problem (skill + EVENT_MAP + AngelEyeEventType all kept in sync by hand).
  // Skill falls back to its embedded list if this endpoint is unreachable.
  router.get('/api/hooks/supported', (_req, res) => {
    const events = Object.keys(EVENT_MAP);
    // `register` is the set the install skill should wire as command hooks:
    // everything the server handles MINUS the registration exclusions above.
    const register = events.filter((e) => !(e in HOOK_REGISTRATION_EXCLUSIONS));
    res.json({
      events, // all events the server can ingest (backward compatible)
      count: events.length, // backward compatible
      register, // events SAFE to wire as command hooks (use this for install)
      excluded: HOOK_REGISTRATION_EXCLUSIONS, // event -> { reason, optional }
      transport_url_template: `http://localhost:${env.PORT}/hooks/{event}`,
    });
  });

  router.post('/hooks/:event', async (req, res) => {
    try {
      const body = req.body as Record<string, unknown>;

      // Stop hook guard — MUST be checked first to prevent infinite loops
      if (body.stop_hook_active === true) {
        res.status(200).json({ continue: true });
        return;
      }

      const hookEventName =
        typeof body.hook_event_name === 'string' ? body.hook_event_name : req.params.event;

      const eventType = EVENT_MAP[hookEventName];
      if (!eventType) {
        logger.warn({ hookEventName }, 'Unknown hook event name — ignoring');
        const entry = {
          hook_event_name: hookEventName,
          seen_at: new Date().toISOString(),
          payload_keys: Object.keys(body).slice(0, 20),
          session_id: typeof body.session_id === 'string' ? body.session_id : 'unknown',
        };
        appendFile(_unknownHooksPath(), JSON.stringify(entry) + '\n', 'utf-8').catch(() => {});
        res.status(200).json({ continue: true });
        return;
      }

      const sessionId = typeof body.session_id === 'string' ? body.session_id : 'unknown';
      const ts = new Date().toISOString();
      const cwd = typeof body.cwd === 'string' ? body.cwd : undefined;
      const agentId = typeof body.agent_id === 'string' ? body.agent_id : undefined;
      // Turn-correlation key — Claude Code stamps this on 14 events since 2026-07-24.
      const promptId = typeof body.prompt_id === 'string' ? body.prompt_id : undefined;
      // Claude Code's own session title (SessionStart + UserPromptSubmit).
      const sessionTitle = typeof body.session_title === 'string' ? body.session_title : undefined;

      const event: AngelEyeEvent = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        ts,
        source: 'hook',
        event: eventType,
        ...(cwd !== undefined && { cwd }),
        ...(agentId !== undefined && { agent_id: agentId }),
        ...(promptId !== undefined && { prompt_id: promptId }),
        ...(sessionTitle !== undefined && { session_title: sessionTitle }),
      };

      // Attach event-specific payload fields
      if (eventType === 'user_prompt') {
        const promptText =
          typeof body.prompt === 'string'
            ? body.prompt
            : typeof body.user_prompt === 'string'
              ? body.user_prompt
              : undefined;
        if (promptText !== undefined) event.prompt = promptText;
      }

      if (eventType === 'tool_use') {
        if (typeof body.tool_name === 'string') {
          event.tool = body.tool_name;
        }
        if (typeof body.tool_use_id === 'string') {
          event.tool_use_id = body.tool_use_id;
        }
        const toolInput =
          body.tool_input !== null &&
          typeof body.tool_input === 'object' &&
          !Array.isArray(body.tool_input)
            ? (body.tool_input as Record<string, unknown>)
            : {};
        if (typeof body.tool_name === 'string') {
          event.tool_summary = summariseTool(body.tool_name, toolInput);
        }
        // Claude Code sends `tool_response`, NOT `tool_result` — the old read was wrong from
        // Wave 1 and measured 0/17,108 populated. `tool_response` is usually an object; some
        // tools send a string. Bounded harder than the residual payload because it is the most
        // valuable field on the highest-volume event.
        if (body.tool_response !== undefined && body.tool_response !== null) {
          event.tool_response = boundValue(body.tool_response, 2000);
        }
        if (typeof body.duration_ms === 'number') {
          event.duration_ms = body.duration_ms;
        }
      }

      if (eventType === 'stop' || eventType === 'subagent_stop') {
        // No `reason` here — Stop does not carry one (measured 0/191). It is a SessionEnd field,
        // handled below. Stop's real payload (background_tasks, session_crons, effort) now
        // survives via the residual-payload capture.
        if (typeof body.last_assistant_message === 'string') {
          event.last_message = body.last_assistant_message;
        }
      }

      // SessionEnd is where `reason` actually lives (780 observations in the schema audit).
      if (eventType === 'session_end' && typeof body.reason === 'string') {
        event.reason = body.reason;
      }

      if (eventType === 'subagent_start' || eventType === 'subagent_stop') {
        if (typeof body.agent_type === 'string') {
          event.agent_type = body.agent_type;
        }
      }

      // Residual payload capture — everything the promoted fields above did not claim.
      //
      // This used to be skipped entirely for the seven Wave-1 events, on the assumption that their
      // promoted fields covered the payload. Claude Code has added fields since: `effort`,
      // `background_tasks`, `session_crons` and `prompt_id` all arrive on Stop, and every one was
      // being dropped on the floor. The carve-out now strips only what is genuinely already stored,
      // so new upstream fields survive by default instead of needing a code change to be noticed.
      // See docs/architecture/staleness-review.md#a1-4, #a1-5, #a1-6.
      const STRIP_FROM_PAYLOAD = new Set([
        // envelope — already first-class on the event
        'session_id',
        'cwd',
        'hook_event_name',
        'transcript_path',
        'permission_mode',
        'agent_id',
        'agent_type',
        'stop_hook_active',
        'prompt_id',
        'session_title',
        // promoted above AND large — duplicating these would double the store
        'prompt',
        'user_prompt',
        'tool_response',
        'last_assistant_message',
        // promoted above and cheap, but stripped because they are pure duplicates
        'tool_name',
        'tool_use_id',
        'duration_ms',
        // NOTE: `reason` and `error` are deliberately NOT stripped. They are short, and they are
        // promoted only on the events where they are known to appear (SessionEnd / *_failure).
        // Leaving them in the residual means an unexpected appearance elsewhere is captured
        // rather than silently dropped — which is the failure this whole block exists to fix.
        // already condensed into tool_summary; the raw form is the biggest field on the
        // highest-volume event and adds nothing the summary does not carry
        'tool_input',
      ]);
      const residual = Object.fromEntries(
        Object.entries(body)
          .filter(([k]) => !STRIP_FROM_PAYLOAD.has(k))
          .map(([k, v]) => [k, boundValue(v, 500)])
      );
      if (Object.keys(residual).length > 0) event.payload = residual;

      if (eventType === 'tool_failure' || eventType === 'stop_failure') {
        if (typeof body.error === 'string') event.error = body.error;
        if (typeof body.duration_ms === 'number') event.duration_ms = body.duration_ms;
      }

      // Non-blocking schema audit (runs for all 31 events)
      auditPayload(hookEventName, eventType, body).catch(() => {});

      await writeEvent(event);

      if (eventType === 'session_start') {
        // Project name: canonicalise harness-hosted sessions (Paperclip, ALS
        // delamain) so they don't accumulate as UUID/hex pseudo-projects.
        // Fall through to the default last-path-segment derivation otherwise.
        const defaultProject =
          cwd !== undefined && cwd.length > 0 ? (cwd.split('/').filter(Boolean).pop() ?? cwd) : '';
        const project = canonicalProjectFromCwd(cwd) ?? defaultProject;
        // Detect Mechanism B subagents (Agent Teams). Best-effort at SessionStart —
        // the JSONL may not yet contain the teammate-message line. Backfill script
        // catches misses. See known-issues.md#subagent-detection.
        const teammate = detectTeammate(sessionId, cwd);
        // Initial session_class — default to 'dialog' so stale-active sessions
        // (where session_end never fires) still have a usable class. session_end
        // refinement upgrades to 'agent_run' or 'machine_signal' with full event
        // context. Deterministic cases (subagent leg, Paperclip cwd) are set
        // here at session_start so they're never wrong even if session_end runs.
        const initial_class = teammate.is_subagent
          ? ('subagent_leg' as const)
          : detectMachineSignalFromCwd(cwd)
            ? ('machine_signal' as const)
            : ('dialog' as const);
        await updateRegistry(sessionId, {
          session_id: sessionId,
          project,
          project_dir: cwd ?? '',
          started_at: ts,
          last_active: ts,
          name: null,
          tags: [],
          workspace_id: null,
          status: 'active',
          source: 'hook',
          session_kind: teammate.is_subagent ? 'subagent' : 'main',
          ...(teammate.teammate_id !== undefined && { teammate_id: teammate.teammate_id }),
          session_class: initial_class,
        });
      } else if (eventType === 'stop') {
        const allEvents = await getSessionEvents(sessionId);
        const classification = classifySession(allEvents, sessionId, cwd ?? '');
        // Re-detect teammate in case SessionStart fired before the wrapper was in JSONL.
        // Then, if not a teammate, check for headless skill subprocess (Mechanism C).
        // See known-issues.md#subprocess-session-mechanism-3
        const registry = await readRegistry();
        const existing = registry[sessionId];
        const kindUpdate: {
          session_kind?: 'subagent' | 'subprocess';
          teammate_id?: string | null;
        } = {};
        if (existing?.session_kind === undefined || existing.session_kind === 'main') {
          const t = detectTeammate(sessionId, cwd);
          if (t.is_subagent) {
            kindUpdate.session_kind = 'subagent';
            kindUpdate.teammate_id = t.teammate_id ?? null;
          } else if (detectSubprocess(allEvents).is_subprocess) {
            kindUpdate.session_kind = 'subprocess';
          }
        }
        await updateRegistry(sessionId, {
          last_active: ts,
          ...(cwd !== undefined && { project_dir: cwd }),
          ...classification,
          ...kindUpdate,
        });
      } else if (eventType === 'session_end') {
        const allEvents = await getSessionEvents(sessionId);
        const classification = classifySession(allEvents, sessionId, cwd ?? '');
        // Silent-session filter: no user_prompt → mark junk + override subtype.
        // Catches T3/OpenCode capability probes, human-opened-and-closed, scheduler
        // pings — anything where Claude started but no user actually interacted.
        const hasNoUserPrompt = !allEvents.some((e) => e.event === 'user_prompt');
        const silentOverride = hasNoUserPrompt
          ? { is_junk: true, session_subtype: 'meta.silent_session' }
          : {};
        // Compute final session_class with full event context. computeSessionClass
        // returns 'machine_signal' for zero-prompt sessions, so it stays consistent
        // with the silent_session override above.
        const registryNow = await readRegistry();
        const existingNow = registryNow[sessionId];
        const session_class = computeSessionClass({
          events: allEvents,
          cwd,
          session_kind: existingNow?.session_kind,
          trigger_command: classification.trigger_command,
        });
        await updateRegistry(sessionId, {
          status: 'ended',
          last_active: ts,
          ...classification,
          session_class,
          ...silentOverride,
        });
        await archiveSession(sessionId);
        // Back up upstream JSONL before Claude Code purges it — fire-and-forget.
        // Skip for machine_signal: zero-prompt sessions (AppyCtrl probes etc.)
        // have no upstream JSONL to back up; the call would just emit "not found"
        // warnings every ~5 min, drowning real failures in the logs.
        if (session_class !== 'machine_signal') {
          backupUpstreamJSONL(sessionId, cwd ?? '').catch((err) =>
            logger.warn({ err, sessionId }, 'backupUpstreamJSONL failed (non-fatal)')
          );
        }
      } else {
        await updateRegistry(sessionId, {
          last_active: ts,
          ...(cwd !== undefined && { project_dir: cwd }),
        });

        // On user_prompt: capture first_real_prompt early if not yet set
        if (eventType === 'user_prompt') {
          const registry = await readRegistry();
          const existing = registry[sessionId];
          if (!existing?.first_real_prompt) {
            const result = findFirstRealPrompt([event]);
            if (result !== undefined) {
              await updateRegistry(sessionId, { first_real_prompt: result });
            }
          }
        }
      }

      io.emit(SOCKET_EVENTS.ANGELEYE_EVENT, event);

      res.status(200).json({ continue: true });
    } catch (err) {
      logger.error({ err }, 'Unexpected error in hooks endpoint — returning continue anyway');
      res.status(200).json({ continue: true });
    }
  });

  return router;
}
