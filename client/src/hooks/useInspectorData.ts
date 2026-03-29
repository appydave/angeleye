import { useState, useEffect, useCallback } from 'react';
import type { WorkflowInstance, AffinityGroup } from '@appystack/shared';

interface InspectorSummary {
  sessions: {
    total: number;
    byType: Record<string, number>;
    byProject: Record<string, number>;
  };
  workflows: {
    total: number;
    byStatus: Record<string, number>;
  };
}

interface InspectorData {
  summary: InspectorSummary;
  workflows: WorkflowInstance[];
  affinityGroups: AffinityGroup[];
}

export function useInspectorData() {
  const [data, setData] = useState<InspectorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, workflowsRes, affinityRes] = await Promise.all([
        fetch('/api/inspector/summary'),
        fetch('/api/workflows'),
        fetch('/api/affinity-groups'),
      ]);
      if (!summaryRes.ok || !workflowsRes.ok || !affinityRes.ok) {
        setError('Server returned an error');
        return;
      }
      const [summaryJson, workflowsJson, affinityJson] = await Promise.all([
        summaryRes.json(),
        workflowsRes.json(),
        affinityRes.json(),
      ]);
      if (
        summaryJson.status === 'ok' &&
        workflowsJson.status === 'ok' &&
        affinityJson.status === 'ok'
      ) {
        setData({
          summary: summaryJson.data,
          workflows: workflowsJson.data.workflows,
          affinityGroups: affinityJson.data.groups,
        });
      } else {
        setError('Unexpected response from server');
      }
    } catch {
      setError('Failed to load inspector data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
