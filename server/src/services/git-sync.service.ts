import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'path';
import { logger } from '../config/logger.js';
import type { GitSyncState, GitSyncStatus, GitPullResult, CommitSummary } from '@appystack/shared';

const execFileAsync = promisify(execFile);
const REPO_ROOT = path.resolve(process.cwd(), '..');

async function git(args: string[], timeoutMs = 15_000): Promise<string> {
  const { stdout } = await execFileAsync('git', args, {
    cwd: REPO_ROOT,
    timeout: timeoutMs,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
  return stdout.trim();
}

// Promise-chain mutex — prevents concurrent git operations (poll vs pull race)
let lockChain = Promise.resolve();

function withGitLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = lockChain.then(fn, fn);
  lockChain = next.then(
    () => {},
    () => {}
  );
  return next;
}

function deriveState(dirty: boolean, behind: number, ahead: number): GitSyncState {
  if (dirty && behind > 0) return 'diverged';
  if (dirty) return 'dirty';
  if (behind > 0 && ahead > 0) return 'diverged';
  if (behind > 0) return 'behind';
  if (ahead > 0) return 'ahead';
  return 'clean';
}

function parseCommitLog(raw: string): CommitSummary[] {
  if (!raw) return [];
  return raw.split('\n').map((line) => {
    const parts = line.split('|');
    const sha = parts[0];
    const date = parts[parts.length - 1];
    const author = parts[parts.length - 2];
    const message = parts.slice(1, parts.length - 2).join('|');
    return { sha, message, author, date };
  });
}

export function checkStatus(): Promise<GitSyncStatus> {
  return withGitLock(async (): Promise<GitSyncStatus> => {
    const now = new Date().toISOString();

    // 1. git fetch (failure non-fatal → error state)
    try {
      await git(['fetch', '--quiet'], 15_000);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn({ err }, 'git fetch failed');
      return {
        state: 'error',
        branch: '',
        localCommit: '',
        remoteCommit: '',
        behind: 0,
        ahead: 0,
        dirty: false,
        dirtyFiles: [],
        dirtyCount: 0,
        lastChecked: now,
        error: `Fetch failed: ${message}`,
      };
    }

    // 2. branch name
    const branch = await git(['rev-parse', '--abbrev-ref', 'HEAD']);

    // 3. local commit
    const localCommit = await git(['rev-parse', '--short', 'HEAD']);

    // 4. remote commit (no upstream → error)
    let remoteCommit: string;
    try {
      remoteCommit = await git(['rev-parse', '--short', '@{upstream}']);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn({ err }, 'no upstream tracking branch');
      return {
        state: 'error',
        branch,
        localCommit,
        remoteCommit: '',
        behind: 0,
        ahead: 0,
        dirty: false,
        dirtyFiles: [],
        dirtyCount: 0,
        lastChecked: now,
        error: `No upstream: ${message}`,
      };
    }

    // 5. ahead/behind counts
    const revList = await git(['rev-list', '--left-right', '--count', 'HEAD...@{upstream}']);
    const [aheadStr, behindStr] = revList.split(/\s+/);
    const ahead = parseInt(aheadStr, 10) || 0;
    const behind = parseInt(behindStr, 10) || 0;

    // 6. dirty check + file list
    const porcelain = await git(['status', '--porcelain'], 5_000);
    const dirty = porcelain.length > 0;
    const dirtyFiles = dirty ? porcelain.split('\n').filter(Boolean) : [];

    // 7. behind commits
    let behindCommits: CommitSummary[] | undefined;
    if (behind > 0) {
      const logOutput = await git(['log', '--format=%h|%s|%an|%aI', 'HEAD..@{upstream}', '-10']);
      behindCommits = parseCommitLog(logOutput);
    }

    const state = deriveState(dirty, behind, ahead);

    return {
      state,
      branch,
      localCommit,
      remoteCommit,
      behind,
      ahead,
      dirty,
      dirtyFiles,
      dirtyCount: dirtyFiles.length,
      lastChecked: now,
      behindCommits,
    };
  });
}

export function pullUpstream(): Promise<GitPullResult> {
  return withGitLock(async (): Promise<GitPullResult> => {
    const previousCommit = await git(['rev-parse', '--short', 'HEAD']);

    // Auto-stash local changes (including untracked) so pull can proceed
    const porcelain = await git(['status', '--porcelain'], 5_000);
    const wasDirty = porcelain.length > 0;
    if (wasDirty) {
      await git(['stash', 'push', '--include-untracked', '-m', 'auto-stash before pull'], 10_000);
    }

    try {
      await git(['pull', '--rebase'], 120_000);
    } catch (err) {
      // Abort rebase on failure
      try {
        await git(['rebase', '--abort'], 10_000);
      } catch (abortErr) {
        logger.warn({ err: abortErr }, 'rebase --abort failed');
      }
      // Restore stash so nothing is lost
      if (wasDirty) {
        try {
          await git(['stash', 'pop'], 10_000);
        } catch {
          logger.warn('Stash pop had conflicts — local changes preserved in stash');
        }
      }
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err }, 'git pull --rebase failed');
      return {
        success: false,
        previousCommit,
        newCommit: previousCommit,
        commitsPulled: 0,
        error: `Pull failed: ${message}`,
        restartTriggered: false,
      };
    }

    // Restore stashed changes
    if (wasDirty) {
      try {
        await git(['stash', 'pop'], 10_000);
      } catch {
        // Stash pop conflict — stash is still saved, user hasn't lost anything
        logger.warn('Stash pop had conflicts — local changes preserved in stash');
      }
    }

    const newCommit = await git(['rev-parse', '--short', 'HEAD']);
    const countOutput = await git(['rev-list', '--count', `${previousCommit}..HEAD`]);
    const commitsPulled = parseInt(countOutput, 10) || 0;

    // Restart if running under Overmind
    let restartTriggered = false;
    if (process.env.OVERMIND_SOCKET) {
      restartTriggered = true;
      logger.info('Pull complete — scheduling process exit for Overmind restart');
      setTimeout(() => process.exit(0), 2000);
    }

    logger.info(
      { previousCommit, newCommit, commitsPulled, restartTriggered },
      'git pull succeeded'
    );

    return {
      success: true,
      previousCommit,
      newCommit,
      commitsPulled,
      restartTriggered,
    };
  });
}
