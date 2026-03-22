# Findings: w4-18 — davidcruwys / BUILD (challenged)

**Session ID**: `0aabff8e-6ca4-4e8a-8eaf-96de6b418e29`
**Registry classification**: BUILD / bash-heavy
**Analysed classification**: SYSOPS / multi-machine-sync
**Date range**: 2026-02-28T13:45 – 2026-03-01T03:55 (14h 09m wall-clock)
**Project dir**: `/Users/davidcruwys` (home directory, not a project repo)
**File size**: 96,828 bytes
**Event count**: 50 (25 user_prompt, 25 tool_use — no progress events)

---

## Classification Challenge

The registry labels this BUILD. That is wrong.

No code was written, no feature was implemented, no library was built. The session was about **machine synchronisation** — auditing git repositories across two Macs (M4 Mini and M4 Pro/MacBook Pro), deleting stale local repos that no longer exist on the source-of-truth machine, and pulling/copying repos that existed on Pro but were missing on the M4.

The only non-Bash tool call was a single `Write` — almost certainly a generated shell script (a repo-removal script), not a source file.

Recommended classification: **SYSOPS** with subtype `multi-machine-sync`.

---

## What Happened in This Session

### Phase 1 — Gap Analysis (13:45–14:00)

David asked Claude to do a "gap analysis" between the M4 Mini (current machine) and the M4 Pro (source of truth). The first prompt pasted the Claude Code startup banner confirming the session started in `~/dev/ad/brains`. Claude ran audit tooling (`~/dev/ad/utils/repo-audit/bin/audit-repos`) to produce a side-by-side repo comparison table showing M4 vs Pro status.

David had already done some manual sync work and said to skip issue #1. The focus shifted to repos present on Pro but missing or stale on the M4.

### Phase 2 — Removal of Stale M4 Repos (13:54–14:35)

David asked Claude to:

1. Identify M4 folders that no longer exist on Pro
2. Generate a removal script (the single `Write` tool call at 13:59)
3. Run it (Bash at 14:04)
4. Re-audit to confirm

A burst of Bash calls between 14:17–14:18 ran inside `/Users/davidcruwys/dev/kgems/rails_app_generator/a/addons/r7_view_component` — this is where `rails_app_generator` lived and was being inspected/deleted. David explicitly named repos to delete: `voice-agent`, `b12-aider-chat-modes`, `ito`, `klue-admin`, `remotion-hello-world`, `chatgpt-tutorial`, and later `rails_app_generator`. All were removed.

`transcript_whisperer2` was noted as having divergent commits (ahead 19, behind 11) and handled separately.

### Phase 3 — Pull/Copy from Pro (14:45–15:00)

David set the rule: "repository or Pro is considered the source of truth — this machine should try to pull and if failure copy." Claude ran git pulls for repos that existed on Pro but were behind on M4. For repos that couldn't be pulled cleanly (local-only or divergent), it copied from Pro via SSH (`MacBook-Pro.local`).

Three repos needed deletion (local-only, not on Pro); David confirmed. Others were rsynced from Pro.

Final audit runs confirmed the M4 was substantially cleaner and more aligned with Pro.

### Phase 4 — Context Shift: Hardware Setup (03:35–03:55, next day)

After a 12.6-hour gap, the session resumed with unrelated questions:

- Bluetooth mouse setup (Logitech MX Master)
- Samsung monitor resolution (32" and 27" verticals)
- Scaling vs resolution on macOS

This is a classic long-running home-directory session where David uses Claude as a general assistant across an entire day. The final prompt asked whether the monitor/Ansible config needed updating — bridging hardware and infrastructure concerns.

---

## Key Observations

### Why davidcruwys home dir?

The `project_dir` is `/Users/davidcruwys` (not a repo). This is the pattern for sessions that span the whole machine — sysadmin work, multi-repo operations, general AI assistance. Claude Code starts here when there's no specific project context. AngelEye should treat this as a **machine-management** or **ambient** session, not a project session.

### Tool Pattern

24 Bash calls + 1 Write. No reads, no edits. Highly consistent with operational/scripting work rather than feature development. The `bash-heavy` tag is accurate; `BUILD` is not.

### Session Duration vs Active Duration

14 hours wall-clock but only ~1h 15m of actual activity in Phase 1-3, then a 12.6h gap before Phase 4 (~20 min). The session was left open across most of the day. This is a long-idle, multi-topic session — common for home-dir sessions.

### Script Generation Pattern

The Write tool generated a removal script, then Bash ran it. This generate-then-execute pattern is distinct from iterative code development. It is operational scripting, not software construction.

### Repos Deleted

- `voice-agent`
- `b12-aider-chat-modes`
- `ito`
- `klue-admin`
- `remotion-hello-world`
- `chatgpt-tutorial`
- `rails_app_generator` (deleted in a second pass)
- Three unnamed local-only repos

### Ansible Reference

The session ended with a question about whether the monitor configuration changes required Ansible updates — indicating David uses Ansible for machine provisioning (`agent-os/ansible`) and thinks about config changes in that context even during ad-hoc sessions.

---

## Classification Verdict

| Dimension      | Registry                                                                                                                                  | Corrected            |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Type           | BUILD                                                                                                                                     | SYSOPS               |
| Subtype        | —                                                                                                                                         | multi-machine-sync   |
| Tool pattern   | bash-heavy                                                                                                                                | bash-heavy (correct) |
| Interest level | medium                                                                                                                                    | medium               |
| Notes          | Generated + executed removal script; multi-Mac repo sync; day-long session with hardware-help tail; home-dir = machine-management context |

---

## Signals for AngelEye

1. **Home-dir sessions are sysops/ambient, not project work.** When `project_dir` == `/Users/<username>`, default classification should lean SYSOPS or AMBIENT, not BUILD.
2. **Write + immediate Bash = script-generate-and-run pattern.** Single Write followed by Bash is operational scripting. Multiple Writes interleaved with reads/edits is BUILD.
3. **12+ hour gaps in a session indicate multi-topic or kept-open behaviour.** Phase changes across large gaps should be treated as distinct activity clusters.
4. **`rails_app_generator` appears in kgems.** Mid-session cwd drift to `/dev/kgems/rails_app_generator/...` shows Claude navigating into the repo being deleted to inspect it before removal — not editing it.
