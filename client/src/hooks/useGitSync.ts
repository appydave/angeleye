import { useState, useEffect, useCallback, useRef } from 'react';
import type { GitSyncStatus, GitPullResult } from '@appystack/shared';

const DEFAULT_POLL_MS = 120_000;

export function useGitSync() {
  const [status, setStatus] = useState<GitSyncStatus | null>(null);
  const [pulling, setPulling] = useState(false);
  const [pullResult, setPullResult] = useState<GitPullResult | null>(null);
  const mountedRef = useRef(true);
  const healthPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    async function getPollInterval(): Promise<number> {
      try {
        const res = await fetch('/api/info');
        const json = await res.json();
        if (json.status === 'ok' && typeof json.data?.gitSyncPollMs === 'number') {
          return json.data.gitSyncPollMs;
        }
      } catch {
        /* server down — use default */
      }
      return DEFAULT_POLL_MS;
    }

    async function check() {
      try {
        const res = await fetch('/api/git-sync/status');
        const json = await res.json();
        if (mountedRef.current && json.status === 'ok') setStatus(json.data);
      } catch {
        /* server down — ignore */
      }
    }

    async function start() {
      const pollMs = await getPollInterval();
      if (!mountedRef.current) return;
      await check();
      if (!mountedRef.current) return;
      intervalId = setInterval(check, pollMs);
    }

    start();

    return () => {
      mountedRef.current = false;
      if (intervalId) clearInterval(intervalId);
      if (healthPollRef.current) {
        clearInterval(healthPollRef.current);
        healthPollRef.current = null;
      }
    };
  }, []);

  const pull = useCallback(async (): Promise<GitPullResult | null> => {
    setPulling(true);
    setPullResult(null);
    try {
      const res = await fetch('/api/git-sync/pull', { method: 'POST' });
      const json = await res.json();
      if (!mountedRef.current) return null;
      const result = json.data as GitPullResult;
      setPullResult(result);

      if (result.restartTriggered) {
        // Poll /health until server returns, then reload page
        healthPollRef.current = setInterval(async () => {
          try {
            const h = await fetch('/health');
            if (h.ok) {
              if (healthPollRef.current) clearInterval(healthPollRef.current);
              healthPollRef.current = null;
              window.location.reload();
            }
          } catch {
            /* still restarting */
          }
        }, 2000);
      } else {
        // Re-check status after pull
        try {
          const sr = await fetch('/api/git-sync/status');
          const sj = await sr.json();
          if (mountedRef.current && sj.status === 'ok') setStatus(sj.data);
        } catch {
          /* ignore */
        }
      }
      return result;
    } catch {
      return null;
    } finally {
      if (mountedRef.current) setPulling(false);
    }
  }, []);

  const clearPullResult = useCallback(() => setPullResult(null), []);

  return { status, pulling, pullResult, pull, clearPullResult };
}
