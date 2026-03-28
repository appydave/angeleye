import { useEffect, useRef, useState } from 'react';
import type { GitSyncStatus, GitPullResult } from '@appystack/shared';

interface GitSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: GitSyncStatus;
  onPull: () => void;
  pulling: boolean;
  pullResult: GitPullResult | null;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.round((now - then) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

type FileGroup = { label: string; files: { path: string; status: string }[] };

function groupDirtyFiles(dirtyFiles: string[]): FileGroup[] {
  const categoryMap: Record<string, { path: string; status: string }[]> = {};

  for (const line of dirtyFiles) {
    const statusCode = line.slice(0, 2).trim();
    const filePath = line.slice(3).trim();

    let status = 'Modified';
    if (statusCode === '??' || statusCode === 'A') status = 'Added';
    else if (statusCode === 'D') status = 'Deleted';
    else if (statusCode === 'R') status = 'Renamed';

    let category = 'Other';
    if (filePath.includes('/components/') || filePath.includes('/pages/')) category = 'Components';
    else if (filePath.includes('/styles/') || filePath.endsWith('.css')) category = 'Styles';
    else if (
      filePath.includes('/config/') ||
      filePath.endsWith('.json') ||
      filePath.endsWith('.env')
    )
      category = 'Config';
    else if (filePath.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)) category = 'Images';
    else if (filePath.match(/\.(ts|tsx|js|jsx)$/)) category = 'Source';
    else if (filePath.startsWith('data/')) category = 'Data';

    if (!categoryMap[category]) categoryMap[category] = [];
    categoryMap[category].push({ path: filePath, status });
  }

  const order = ['Source', 'Components', 'Styles', 'Config', 'Data', 'Images', 'Other'];
  return order
    .filter((label) => categoryMap[label]?.length)
    .map((label) => ({ label, files: categoryMap[label] }));
}

const statusBadgeColors: Record<string, string> = {
  Added: 'bg-green-100 text-green-800',
  Modified: 'bg-amber-100 text-amber-800',
  Deleted: 'bg-red-100 text-red-800',
  Renamed: 'bg-blue-100 text-blue-800',
};

export default function GitSyncModal({
  isOpen,
  onClose,
  status,
  onPull,
  pulling,
  pullResult,
}: GitSyncModalProps) {
  const [filesExpanded, setFilesExpanded] = useState(false);
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSuccess = pullResult?.success === true;
  const isFailure = pullResult?.success === false;

  // Auto-close on success after 3s
  useEffect(() => {
    if (isSuccess && isOpen) {
      autoCloseTimer.current = setTimeout(onClose, 3000);
      return () => {
        if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
      };
    }
  }, [isSuccess, isOpen, onClose]);

  if (!isOpen) return null;

  // Determine which view to show
  if (isSuccess) {
    return (
      <ModalShell pulling={pulling} onClose={onClose}>
        <h2 className="text-lg font-semibold text-green-700 mb-2">Updated successfully</h2>
        <p className="text-sm text-foreground mb-4">
          Pulled {pullResult.commitsPulled} update{pullResult.commitsPulled !== 1 ? 's' : ''}.
          {pullResult.restartTriggered ? ' Restarting\u2026' : ''}
        </p>
      </ModalShell>
    );
  }

  if (isFailure) {
    return (
      <ModalShell pulling={pulling} onClose={onClose}>
        <h2 className="text-lg font-semibold text-red-600 mb-2">Update failed</h2>
        <p className="text-sm text-red-600 mb-4">
          {pullResult.error ?? 'An unexpected error occurred'}
        </p>
        <div className="flex justify-end">
          <CloseButton onClick={onClose} />
        </div>
      </ModalShell>
    );
  }

  if (pulling) {
    return (
      <ModalShell pulling onClose={onClose}>
        <div className="flex items-center gap-3 py-4">
          <Spinner />
          <span className="text-sm text-foreground">Updating\u2026</span>
        </div>
      </ModalShell>
    );
  }

  // State-specific content
  switch (status.state) {
    case 'clean':
      return (
        <ModalShell pulling={false} onClose={onClose}>
          <h2 className="text-lg font-semibold text-foreground mb-2">Everything is up to date</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Last checked {relativeTime(status.lastChecked)}. You&apos;re running the latest version.
          </p>
          <div className="flex justify-end">
            <CloseButton onClick={onClose} />
          </div>
        </ModalShell>
      );

    case 'behind':
      return (
        <ModalShell pulling={false} onClose={onClose}>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {status.behind === 1 ? '1 update available' : `${status.behind} updates available`}
          </h2>
          <CommitList commits={status.behindCommits ?? []} />
          <div className="flex justify-end gap-3 mt-4">
            <CancelButton onClick={onClose} />
            <PullButton onClick={onPull} />
          </div>
        </ModalShell>
      );

    case 'dirty':
      return (
        <ModalShell pulling={false} onClose={onClose}>
          <h2 className="text-lg font-semibold text-foreground mb-2">Local changes detected</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Some files on this machine have changed. This can happen during normal use.
          </p>
          <DirtyFileList
            dirtyFiles={status.dirtyFiles ?? []}
            expanded={filesExpanded}
            onToggle={() => setFilesExpanded(!filesExpanded)}
          />
          <div className="flex justify-end mt-4">
            <CloseButton onClick={onClose} />
          </div>
        </ModalShell>
      );

    case 'diverged':
      return (
        <ModalShell pulling={false} onClose={onClose}>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Updates available + local changes
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            There {status.behind === 1 ? 'is 1 update' : `are ${status.behind} updates`} available.
            Local changes will be safely preserved during the update.
          </p>
          <CommitList commits={status.behindCommits ?? []} />
          <DirtyFileList
            dirtyFiles={status.dirtyFiles ?? []}
            expanded={filesExpanded}
            onToggle={() => setFilesExpanded(!filesExpanded)}
          />
          <div className="flex justify-end gap-3 mt-4">
            <CancelButton onClick={onClose} />
            <PullButton onClick={onPull} />
          </div>
        </ModalShell>
      );

    case 'error':
      return (
        <ModalShell pulling={false} onClose={onClose}>
          <h2 className="text-lg font-semibold text-foreground mb-2">Connection issue</h2>
          <p className="text-sm text-red-600 mb-4">
            {status.error ?? 'Could not check for updates'}
          </p>
          <div className="flex justify-end">
            <CloseButton onClick={onClose} />
          </div>
        </ModalShell>
      );

    case 'ahead':
      return (
        <ModalShell pulling={false} onClose={onClose}>
          <h2 className="text-lg font-semibold text-foreground mb-2">Changes pending</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {status.ahead} local commit{status.ahead !== 1 ? 's' : ''} not yet pushed to remote.
          </p>
          <div className="flex justify-end">
            <CloseButton onClick={onClose} />
          </div>
        </ModalShell>
      );

    default:
      return (
        <ModalShell pulling={false} onClose={onClose}>
          <h2 className="text-lg font-semibold text-foreground mb-2">Sync Status</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Last checked {relativeTime(status.lastChecked)}.
          </p>
          <div className="flex justify-end">
            <CloseButton onClick={onClose} />
          </div>
        </ModalShell>
      );
  }
}

// --- Sub-components ---

function ModalShell({
  children,
  pulling,
  onClose,
}: {
  children: React.ReactNode;
  pulling: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && !pulling) onClose();
      }}
    >
      <div className="bg-card rounded-lg shadow-xl p-6 max-w-md w-full mx-4 max-h-[70vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

function CommitList({
  commits,
}: {
  commits: { sha: string; message: string; author: string; date: string }[];
}) {
  if (commits.length === 0) return null;
  return (
    <ul className="space-y-2 mb-2 max-h-48 overflow-y-auto">
      {commits.slice(0, 10).map((c) => (
        <li key={c.sha} className="text-sm border-b border-border pb-2 last:border-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-foreground truncate">{c.message}</span>
            <span className="text-muted-foreground text-xs whitespace-nowrap">
              {relativeTime(c.date)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">{c.author}</div>
        </li>
      ))}
    </ul>
  );
}

function DirtyFileList({
  dirtyFiles,
  expanded,
  onToggle,
}: {
  dirtyFiles: string[];
  expanded: boolean;
  onToggle: () => void;
}) {
  if (dirtyFiles.length === 0) return null;

  const groups = groupDirtyFiles(dirtyFiles);
  const shouldCollapse = dirtyFiles.length > 6;
  const isExpanded = !shouldCollapse || expanded;

  return (
    <div className="border border-border rounded-md p-3 mt-2">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>
          {dirtyFiles.length} file{dirtyFiles.length !== 1 ? 's' : ''} changed
        </span>
        {shouldCollapse && (
          <svg
            className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      {isExpanded && (
        <div className="mt-2 space-y-3">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                {group.label}
              </div>
              <ul className="space-y-0.5">
                {group.files.map((f) => (
                  <li key={f.path} className="flex items-center justify-between text-xs">
                    <span className="text-foreground truncate mr-2">{f.path}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${statusBadgeColors[f.status] ?? 'bg-gray-100 text-gray-700'}`}
                    >
                      {f.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-amber-600" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 text-sm rounded-md bg-muted-foreground/10 text-foreground hover:bg-muted-foreground/20 transition-colors"
    >
      Close
    </button>
  );
}

function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 text-sm rounded-md bg-muted-foreground/10 text-foreground hover:bg-muted-foreground/20 transition-colors"
    >
      Cancel
    </button>
  );
}

function PullButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 text-sm rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors"
    >
      Get Latest
    </button>
  );
}
