/**
 * Claude Code path encoding — the single source of truth for turning a cwd
 * into a `~/.claude/projects/<encoded>/` directory name.
 *
 * Transcribed from the Claude Code 2.1.235 bundle (verified 2026-08-19):
 *
 *   function $Do(e){ return e.replace(/[^a-zA-Z0-9]/g,"-") }
 *   function ir_(e){ return Math.abs(gct(e)).toString(36) }
 *   function gct(e){ let t=0; for(let r=0;r<e.length;r++) t=(t<<5)-t+e.charCodeAt(r)|0; return t }
 *   function KV(e){ let t=$Do(e); if(t.length<=wie) return t; return `${t.slice(0,wie)}-${ir_(e)}` }
 *   var wie = 200
 *   function HD(e){ return path.join(join(claudeDir(),"projects"), FF(e)) }
 *
 * Two rules, both of which AngelEye previously got wrong:
 *
 *  1. EVERY non-alphanumeric character becomes `-`, not just `/`. Dots and
 *     underscores included. The old `replace(/\//g, '-')` produced
 *     `…-supportsignal-app.supportsignal.com.au` for a directory Claude Code
 *     actually names `…-supportsignal-app-supportsignal-com-au`, so every
 *     lookup for a dotted project path missed. 386 registry rows were affected
 *     (238 of them SupportSignal). See docs/architecture/staleness-review.md#a1-2.
 *
 *  2. Slugs longer than 200 characters are truncated to 200 and given a
 *     `-<base36 hash of the ORIGINAL path>` suffix. Note the hash is computed
 *     over the raw path, not over the slug.
 *
 * Not modelled here: Claude Code's `LQc()` override (`FF(e) = LQc() ?? KV(e)`),
 * which replaces the derived name entirely when a custom Claude config dir is
 * configured. AngelEye reads the default location only.
 */

/** Max slug length before truncation. Claude Code's `wie`. */
const MAX_SLUG_LENGTH = 200;

/**
 * Claude Code's `gct` string hash — the classic `h = h * 31 + c` walk written
 * as `(h << 5) - h + c`, forced back to a signed 32-bit int each round by `| 0`.
 * Reproduced exactly, including the overflow behaviour, because the output is
 * part of a filename we have to match byte for byte.
 */
function claudeStringHash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) - h + input.charCodeAt(i)) | 0;
  }
  return h;
}

/**
 * Encode an absolute path the way Claude Code names its project directories.
 *
 * `/Users/d/dev/angeleye`                       → `-Users-d-dev-angeleye`
 * `/Users/d/dev/app.supportsignal.com.au`       → `-Users-d-dev-app-supportsignal-com-au`
 * a path whose slug exceeds 200 chars           → `<first 200 chars>-<base36 hash>`
 */
export function encodeProjectPath(absolutePath: string): string {
  const slug = absolutePath.replace(/[^a-zA-Z0-9]/g, '-');
  if (slug.length <= MAX_SLUG_LENGTH) return slug;
  return `${slug.slice(0, MAX_SLUG_LENGTH)}-${Math.abs(claudeStringHash(absolutePath)).toString(36)}`;
}
