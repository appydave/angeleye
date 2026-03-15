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
} as const;
