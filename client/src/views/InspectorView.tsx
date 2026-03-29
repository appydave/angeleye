import { useState } from 'react';
import { useInspector } from '../hooks/useInspector.js';
import SchemaTab from '../components/inspector/SchemaTab.js';
import DataTab from '../components/inspector/DataTab.js';

type TabKey = 'schema' | 'data';

export default function InspectorView() {
  const { data, loading, error, refresh } = useInspector();
  const [activeTab, setActiveTab] = useState<TabKey>('schema');

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Sticky header with tabs */}
      <div className="border-b border-border bg-surface px-4 py-2 flex items-center gap-4 shrink-0">
        <h1 className="font-bebas text-3xl tracking-wider text-primary">INSPECTOR</h1>
        <div className="flex items-center gap-1 ml-4">
          {(['schema', 'data'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                activeTab === tab
                  ? 'bg-card text-heading font-medium'
                  : 'text-body hover:text-heading'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        {!loading && !error && (
          <div className="ml-auto">
            <button
              onClick={refresh}
              className="text-xs px-3 py-1 text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary rounded"
            >
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center flex-1 text-muted-foreground text-sm">
          Loading inspector data...
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-sm">
          <span className="text-destructive">{error}</span>
          <button
            onClick={refresh}
            className="text-xs px-3 py-1 text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary rounded"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'schema' && data ? (
            <SchemaTab
              sharedTypes={data.sharedTypes}
              workflowTypes={data.workflowTypes}
              projects={data.projects}
            />
          ) : (
            <DataTab />
          )}
        </div>
      )}
    </div>
  );
}
