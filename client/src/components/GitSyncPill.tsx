import { useState, useCallback } from 'react';
import { useGitSync } from '../hooks/useGitSync.js';
import GitSyncModal from './GitSyncModal.js';
import type { GitSyncStatus } from '@appystack/shared';

interface PillStyle {
  bg: string;
  text: string;
  label: string;
  animation?: string;
}

function getPillStyle(status: GitSyncStatus, pulling: boolean): PillStyle {
  if (pulling) {
    return { bg: 'bg-amber-500/15', text: 'text-amber-700', label: 'Updating\u2026' };
  }
  switch (status.state) {
    case 'clean':
      return { bg: 'bg-green-600/15', text: 'text-green-700', label: 'Up to date' };
    case 'behind':
      return {
        bg: 'bg-amber-500',
        text: 'text-white',
        label: status.behind === 1 ? 'Update available' : `${status.behind} updates available`,
        animation: 'sync-pulse',
      };
    case 'dirty':
      return {
        bg: 'bg-muted-foreground/10',
        text: 'text-muted-foreground',
        label: 'Local changes detected',
      };
    case 'ahead':
      return { bg: 'bg-blue-500/15', text: 'text-blue-700', label: 'Changes pending' };
    case 'diverged':
      return {
        bg: 'bg-purple-500/15',
        text: 'text-purple-700',
        label: 'Needs attention',
        animation: 'sync-pulse',
      };
    case 'error':
      return {
        bg: 'bg-muted-foreground/10',
        text: 'text-muted-foreground',
        label: 'Connection issue',
      };
    default:
      return { bg: 'bg-muted-foreground/10', text: 'text-muted-foreground', label: 'Unknown' };
  }
}

export default function GitSyncPill() {
  const { status, pulling, pullResult, pull, clearPullResult } = useGitSync();
  const [modalOpen, setModalOpen] = useState(false);

  const handleClick = useCallback(() => {
    clearPullResult();
    setModalOpen(true);
  }, [clearPullResult]);

  const handleClose = useCallback(() => {
    setModalOpen(false);
    clearPullResult();
  }, [clearPullResult]);

  if (!status) return null;

  const style = getPillStyle(status, pulling);

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${style.bg} ${style.text} cursor-pointer hover:opacity-80 transition-opacity`}
        style={
          style.animation ? { animation: `${style.animation} 2s ease-in-out infinite` } : undefined
        }
      >
        {pulling && (
          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
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
        {style.label}
      </button>

      <GitSyncModal
        isOpen={modalOpen}
        onClose={handleClose}
        status={status}
        onPull={pull}
        pulling={pulling}
        pullResult={pullResult}
      />
    </>
  );
}
