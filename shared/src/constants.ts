/** HTTP route paths used by both server and client. */
export const ROUTES = {
  HEALTH: '/health',
  API_INFO: '/api/info',
  API_SESSIONS: '/api/sessions',
} as const;

/** Socket.io event name constants shared between client and server. */
export const SOCKET_EVENTS = {
  CLIENT_PING: 'client:ping',
  SERVER_PONG: 'server:pong',
  ANGELEYE_EVENT: 'angeleye:event',
  ANGELEYE_REGISTRY: 'angeleye:registry',
} as const;

/** AngelEye event type name constants. */
export const ANGELEYE_EVENTS = {
  SESSION_START: 'session_start',
  USER_PROMPT: 'user_prompt',
  TOOL_USE: 'tool_use',
  STOP: 'stop',
  SESSION_END: 'session_end',
  SUBAGENT_START: 'subagent_start',
  SUBAGENT_STOP: 'subagent_stop',
  // Wave 11 — full hook coverage
  TOOL_FAILURE: 'tool_failure',
  STOP_FAILURE: 'stop_failure',
  WORKTREE_CREATE: 'worktree_create',
  WORKTREE_REMOVE: 'worktree_remove',
  CWD_CHANGED: 'cwd_changed',
  PRE_TOOL_USE: 'pre_tool_use',
  INSTRUCTIONS_LOADED: 'instructions_loaded',
  PRE_COMPACT: 'pre_compact',
  POST_COMPACT: 'post_compact',
  PERMISSION_REQUEST: 'permission_request',
  NOTIFICATION: 'notification',
  TEAMMATE_IDLE: 'teammate_idle',
  TASK_COMPLETED: 'task_completed',
  CONFIG_CHANGE: 'config_change',
  ELICITATION: 'elicitation',
  ELICITATION_RESULT: 'elicitation_result',
  FILE_CHANGED: 'file_changed',
  // v2.1.84+ — added 2026-05-13
  TASK_CREATED: 'task_created',
  PERMISSION_DENIED: 'permission_denied',
  // v2.1.167 canonical reconcile — added 2026-06-07
  SETUP: 'setup',
  USER_PROMPT_EXPANSION: 'user_prompt_expansion',
  POST_TOOL_BATCH: 'post_tool_batch',
  MESSAGE_DISPLAY: 'message_display',
} as const;
