export type GitSyncState =
  | 'clean'
  | 'behind'
  | 'dirty'
  | 'ahead'
  | 'diverged'
  | 'error'
  | 'pulling';

export interface CommitSummary {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface GitSyncStatus {
  state: GitSyncState;
  branch: string;
  localCommit: string;
  remoteCommit: string;
  behind: number;
  ahead: number;
  dirty: boolean;
  dirtyFiles: string[];
  dirtyCount: number;
  lastChecked: string;
  error?: string;
  behindCommits?: CommitSummary[];
}

export interface GitPullResult {
  success: boolean;
  previousCommit: string;
  newCommit: string;
  commitsPulled: number;
  error?: string;
  restartTriggered: boolean;
}
