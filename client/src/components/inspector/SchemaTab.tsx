import { useState } from 'react';
import type { WorkflowType, ProjectConfig } from '@appystack/shared';

interface SchemaTabProps {
  sharedTypes: string;
  workflowTypes: WorkflowType[];
  projects: ProjectConfig[];
}

function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2 bg-surface text-heading font-medium text-sm hover:bg-surface-hover transition-colors"
      >
        <span>{title}</span>
        <span className="text-xs text-body">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

export default function SchemaTab({ sharedTypes, workflowTypes, projects }: SchemaTabProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Shared Types */}
      <CollapsibleSection title="Shared Types">
        <pre className="bg-card rounded-lg p-4 overflow-x-auto text-xs leading-relaxed">
          <code className="font-mono text-body">{sharedTypes}</code>
        </pre>
      </CollapsibleSection>

      {/* Workflow Types */}
      <CollapsibleSection title="Workflow Types">
        {workflowTypes.length === 0 ? (
          <p className="text-body text-sm opacity-60">No workflow types configured.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-body text-xs">
                  <th className="px-3 py-2 font-medium">ID</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Domain</th>
                  <th className="px-3 py-2 font-medium">Ceremony Level</th>
                  <th className="px-3 py-2 font-medium text-center">Station Count</th>
                </tr>
              </thead>
              <tbody>
                {workflowTypes.map((wt) => (
                  <tr
                    key={wt.id}
                    className="border-b border-border hover:bg-surface-hover transition-colors"
                  >
                    <td className="px-3 py-2 font-mono text-xs text-heading">{wt.id}</td>
                    <td className="px-3 py-2 text-heading">{wt.name}</td>
                    <td className="px-3 py-2 text-body">{wt.domain}</td>
                    <td className="px-3 py-2 text-body">{wt.ceremony_level}</td>
                    <td className="px-3 py-2 text-center text-body">{wt.stations.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleSection>

      {/* Project Configs */}
      <CollapsibleSection title="Project Configs">
        {projects.length === 0 ? (
          <p className="text-body text-sm opacity-60">No projects configured.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-body text-xs">
                  <th className="px-3 py-2 font-medium">ID</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Path</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 font-medium">Tags</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border hover:bg-surface-hover transition-colors"
                  >
                    <td className="px-3 py-2 font-mono text-xs text-heading">{p.id}</td>
                    <td className="px-3 py-2 text-heading">{p.name}</td>
                    <td className="px-3 py-2 font-mono text-xs text-body">{p.path}</td>
                    <td className="px-3 py-2 text-body">{p.description}</td>
                    <td className="px-3 py-2 text-body">
                      {p.tags?.length ? p.tags.join(', ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
