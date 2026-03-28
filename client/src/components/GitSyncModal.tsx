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

export default function GitSyncModal({
  isOpen,
  onClose,
  status,
  onPull,
  pulling,
  pullResult,
}: GitSyncModalProps) {
  if (!isOpen) return null;

  const commits = status.behindCommits ?? [];
  const isSuccess = pullResult?.success === true;
  const isFailure = pullResult?.success === false;

  // Auto-close on success after 3s
  if (isSuccess) {
    setTimeout(onClose, 3000);
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && !pulling) onClose();
      }}
    >
      <div className="bg-card rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        {/* Header */}
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Pull {status.behind} commit{status.behind !== 1 ? 's' : ''}?
        </h2>

        {/* Commit list */}
        {commits.length > 0 && !pullResult && (
          <ul className="space-y-2 mb-4 max-h-64 overflow-y-auto">
            {commits.slice(0, 10).map((c) => (
              <li key={c.sha} className="text-sm border-b border-border pb-2 last:border-0">
                <div className="flex items-baseline gap-2">
                  <code className="text-xs font-mono text-primary">{c.sha}</code>
                  <span className="text-muted-foreground text-xs">{relativeTime(c.date)}</span>
                </div>
                <div className="text-foreground truncate">{c.message}</div>
                <div className="text-xs text-muted-foreground">{c.author}</div>
              </li>
            ))}
          </ul>
        )}

        {/* Success message */}
        {isSuccess && (
          <p className="text-green-700 text-sm mb-4">
            Pulled {pullResult.commitsPulled} commit{pullResult.commitsPulled !== 1 ? 's' : ''}.
            {pullResult.restartTriggered ? ' Server restarting\u2026' : ''}
          </p>
        )}

        {/* Failure message */}
        {isFailure && (
          <p className="text-red-600 text-sm mb-4">{pullResult.error ?? 'Pull failed'}</p>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3">
          {isFailure ? (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md bg-muted-foreground/10 text-foreground hover:bg-muted-foreground/20 transition-colors"
            >
              Close
            </button>
          ) : isSuccess ? null : (
            <>
              <button
                onClick={onClose}
                disabled={pulling}
                className="px-4 py-2 text-sm rounded-md bg-muted-foreground/10 text-foreground hover:bg-muted-foreground/20 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onPull}
                disabled={pulling}
                className="px-4 py-2 text-sm rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {pulling && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                )}
                {pulling ? 'Pulling\u2026' : 'Pull Now'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
