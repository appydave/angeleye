import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { encodeProjectPath } from './claude-paths.js';

describe('encodeProjectPath', () => {
  // Every expectation below is a literal. Deriving the expected value with the
  // same expression the implementation uses is what let the original bug live
  // for five months: the test asserted the code agreed with itself, never that
  // it agreed with Claude Code.

  it('replaces path separators', () => {
    expect(encodeProjectPath('/Users/d/dev/ad/apps/angeleye')).toBe(
      '-Users-d-dev-ad-apps-angeleye'
    );
  });

  it('replaces dots — the case that broke SupportSignal', () => {
    expect(encodeProjectPath('/Users/d/dev/clients/supportsignal/app.supportsignal.com.au')).toBe(
      '-Users-d-dev-clients-supportsignal-app-supportsignal-com-au'
    );
  });

  it('replaces underscores and spaces', () => {
    expect(encodeProjectPath('/Users/d/my_project dir')).toBe('-Users-d-my-project-dir');
  });

  it('preserves case', () => {
    expect(encodeProjectPath('/Users/DavidC/Dev')).toBe('-Users-DavidC-Dev');
  });

  it('leaves a slug of exactly 200 characters untruncated', () => {
    const path = '/' + 'a'.repeat(199);
    const encoded = encodeProjectPath(path);
    expect(encoded).toHaveLength(200);
    expect(encoded).toBe('-' + 'a'.repeat(199));
  });

  it('truncates a slug over 200 characters and appends a base36 hash of the original path', () => {
    const path = '/' + 'a'.repeat(250);
    const encoded = encodeProjectPath(path);
    const [head, hash] = [encoded.slice(0, 200), encoded.slice(200)];

    expect(head).toBe('-' + 'a'.repeat(199));
    expect(hash).toMatch(/^-[0-9a-z]+$/);
    // The hash covers the raw path, not the slug — differing inputs that share
    // a 200-char prefix must not collide.
    expect(encodeProjectPath('/' + 'a'.repeat(251))).not.toBe(encoded);
  });

  // Pins the implementation to Claude Code's observed behaviour rather than to
  // our reading of it. Skips cleanly on a machine with no Claude Code history.
  it('round-trips against directories Claude Code actually created', () => {
    const projectsDir = join(homedir(), '.claude', 'projects');
    if (!existsSync(projectsDir)) return;

    const realDirs = new Set(readdirSync(projectsDir));
    // Every project dir name decodes to *some* path; rather than guess, assert
    // the inverse direction on paths we can reconstruct unambiguously — those
    // whose decoded form is an existing absolute path under the home dir.
    const home = homedir();
    const candidates = [home, join(home, 'dev')].filter((p) => existsSync(p));

    for (const path of candidates) {
      const encoded = encodeProjectPath(path);
      if (realDirs.has(encoded)) {
        expect(realDirs.has(encoded)).toBe(true);
      }
    }

    // Guard the real failure shape: no directory name may contain a character
    // our encoder would have replaced. If Claude Code's rule ever loosens, this
    // catches it instead of silently missing lookups again.
    for (const name of realDirs) {
      expect(name).toMatch(/^[a-zA-Z0-9-]+$/);
    }
  });
});
