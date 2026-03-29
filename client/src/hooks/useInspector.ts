import { useState, useEffect, useCallback } from 'react';
import type { WorkflowType, ProjectConfig } from '@appystack/shared';

interface InspectorData {
  sharedTypes: string;
  workflowTypes: WorkflowType[];
  projects: ProjectConfig[];
}

export function useInspector() {
  const [data, setData] = useState<InspectorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [typesRes, projectsRes] = await Promise.all([
        fetch('/api/inspector/types'),
        fetch('/api/projects'),
      ]);
      if (!typesRes.ok || !projectsRes.ok) {
        setError('Server returned an error');
        return;
      }
      const [typesJson, projectsJson] = await Promise.all([typesRes.json(), projectsRes.json()]);
      if (typesJson.status === 'ok' && projectsJson.status === 'ok') {
        setData({
          sharedTypes: typesJson.data.sharedTypes,
          workflowTypes: typesJson.data.workflowTypes,
          projects: projectsJson.data.projects,
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
