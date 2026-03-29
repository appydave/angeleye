import { useState, useEffect, useCallback } from 'react';
import type { WorkflowInstance, WorkflowType } from '@appystack/shared';

interface WorkflowsData {
  workflows: WorkflowInstance[];
  types: WorkflowType[];
}

export function useWorkflows() {
  const [data, setData] = useState<WorkflowsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wfRes, typeRes] = await Promise.all([
        fetch('/api/workflows'),
        fetch('/api/workflow-types'),
      ]);
      if (!wfRes.ok || !typeRes.ok) {
        setError('Server returned an error');
        return;
      }
      const [wfJson, typeJson] = await Promise.all([wfRes.json(), typeRes.json()]);
      if (wfJson.status === 'ok' && typeJson.status === 'ok') {
        setData({
          workflows: wfJson.data.workflows,
          types: typeJson.data.types,
        });
      } else {
        setError('Unexpected response from server');
      }
    } catch {
      setError('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
