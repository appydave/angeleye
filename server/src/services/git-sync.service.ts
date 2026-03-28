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
  if (dirty) return 'dirty';
  if (behind > 0 && ahead > 0) return 'diverged';
  if (behind > 0) return 'behind';
  if (ahead > 0) return 'ahead';
  return 'clean';
}

function parseCommitLog(raw: string): CommitSummary[] {
  if (!raw) return [];
  return raw.split('\n').map((line) => {
    const [sha, message, author, date] = line.split('|');
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
        lastChecked: now,
        error: `No upstream: ${message}`,
      };
    }

    // 5. ahead/behind counts
    const revList = await git(['rev-list', '--left-right', '--count', 'HEAD...@{upstream}']);
    const [aheadStr, behindStr] = revList.split(/\s+/);
    const ahead = parseInt(aheadStr, 10) || 0;
    const behind = parseInt(behindStr, 10) || 0;

    // 6. dirty check
    const porcelain = await git(['status', '--porcelain'], 5_000);
    const dirty = porcelain.length > 0;

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
      lastChecked: now,
      behindCommits,
    };
  });
}

export function pullUpstream(): Promise<GitPullResult> {
  return withGitLock(async (): Promise<GitPullResult> => {
    // 1. Refuse on dirty tree
    const porcelain = await git(['status', '--porcelain'], 5_000);
    if (porcelain.length > 0) {
      return {
        success: false,
        previousCommit: '',
        newCommit: '',
        commitsPulled: 0,
        error: 'Uncommitted changes detected — commit or stash before pulling',
        restartTriggered: false,
      };
    }

    // 2. Record previous commit
    const previousCommit = await git(['rev-parse', '--short', 'HEAD']);

    // 3. git pull --rebase
    try {
      await git(['pull', '--rebase'], 120_000);
    } catch (err) {
      // 4. Abort rebase on failure
      try {
        await git(['rebase', '--abort'], 10_000);
      } catch (abortErr) {
        logger.warn({ err: abortErr }, 'rebase --abort failed');
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

    // 5. Record new commit + count
    const newCommit = await git(['rev-parse', '--short', 'HEAD']);
    const countOutput = await git(['rev-list', '--count', `${previousCommit}..HEAD`]);
    const commitsPulled = parseInt(countOutput, 10) || 0;

    // 6. Restart logic — only if running under Overmind
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
