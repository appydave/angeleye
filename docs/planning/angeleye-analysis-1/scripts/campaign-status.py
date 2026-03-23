#!/usr/bin/env python3
"""
Campaign status tool — live view of analysis campaign progress.

Joins the AngelEye registry (all sessions) with session-index.jsonl (analysed)
to give a real-time picture of what's done, what's pending, and what's next.

Usage:
    python3 campaign-status.py                    # Summary status (local machine)
    python3 campaign-status.py --machine m4-pro   # Summary status (remote machine)
    python3 campaign-status.py --machine all      # Summary across all machines
    python3 campaign-status.py --pending          # List all pending session IDs
    python3 campaign-status.py --next-batch N     # Emit next N session IDs for processing
    python3 campaign-status.py --breakdown        # Detailed breakdown by project/scale

The --machine flag works with all commands:
    python3 campaign-status.py --machine m4-pro --next-batch 80 > wave-ids.txt
    python3 compute-session-shape.py --batch wave-ids.txt --machine m4-pro
"""

import json
import sys
import os
import subprocess
from collections import Counter
from pathlib import Path


# Machine SSH aliases — matches ~/.ssh/config
MACHINE_SSH = {
    "m4-mini": None,       # local machine, no SSH needed
    "m4-pro": "macbook-pro-m4",
}

INDEX_PATH = Path.home() / "dev/ad/brains/angeleye/analysis/session-index.jsonl"

SKIP_IDS = {"test-debug-001"}


def load_registry(machine="m4-mini"):
    """Load all sessions from the AngelEye registry (local or remote)."""
    ssh_host = MACHINE_SSH.get(machine)
    if ssh_host:
        remote_path = "/Users/davidcruwys/.claude/angeleye/registry.json"
        result = subprocess.run(
            ["ssh", ssh_host, f"cat {remote_path}"],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode != 0:
            print(f"Error reading registry from {ssh_host}: {result.stderr}", file=sys.stderr)
            return {}
        return json.loads(result.stdout)
    else:
        registry_path = Path.home() / ".claude/angeleye/registry.json"
        with open(registry_path) as f:
            return json.load(f)


def load_analysed():
    """Load session IDs and wave info from the analysis index."""
    analysed = {}
    with open(INDEX_PATH) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            entry = json.loads(line)
            sid = entry["session_id"]
            wave = entry.get("analysis", {}).get("wave", "unknown")
            analysed[sid] = {"wave": wave}
    return analysed


def get_event_count_local(session_id):
    """Count events in a local session JSONL file."""
    for subpath in [".claude/angeleye/sessions", ".claude/angeleye/archive"]:
        path = Path.home() / subpath / f"session-{session_id}.jsonl"
        if path.exists():
            with open(path) as f:
                return sum(1 for _ in f), path
    return 0, None


# Cache for remote event counts (fetched once per machine per run)
_remote_event_counts = {}


def fetch_remote_event_counts(ssh_host):
    """Fetch event counts for ALL sessions on a remote machine in one SSH call."""
    if ssh_host in _remote_event_counts:
        return _remote_event_counts[ssh_host]

    home = "/Users/davidcruwys"
    # Single SSH call: wc -l on all session files, parse output
    script = (
        f'for dir in {home}/.claude/angeleye/sessions {home}/.claude/angeleye/archive; do '
        f'[ -d "$dir" ] && for f in "$dir"/session-*.jsonl; do '
        f'[ -f "$f" ] && echo "$(basename "$f") $(wc -l < "$f" | tr -d " ")"; '
        f'done; done'
    )
    try:
        result = subprocess.run(
            ["ssh", ssh_host, script],
            capture_output=True, text=True, timeout=60
        )
        counts = {}
        if result.stdout.strip():
            for line in result.stdout.strip().split("\n"):
                if not line.strip():
                    continue
                parts = line.strip().split()
                if len(parts) == 2:
                    filename, count = parts
                    # Extract session ID from "session-{id}.jsonl"
                    sid = filename.replace("session-", "").replace(".jsonl", "")
                    counts[sid] = int(count)
        _remote_event_counts[ssh_host] = counts
        return counts
    except subprocess.TimeoutExpired:
        print(f"SSH timeout fetching event counts from {ssh_host}", file=sys.stderr)
        _remote_event_counts[ssh_host] = {}
        return {}


def get_event_count(session_id, machine="m4-mini"):
    """Count events in the AngelEye JSONL file for a session."""
    ssh_host = MACHINE_SSH.get(machine)
    if ssh_host:
        counts = fetch_remote_event_counts(ssh_host)
        count = counts.get(session_id, 0)
        return count, f"ssh://{ssh_host}/session-{session_id}.jsonl" if count else None
    else:
        return get_event_count_local(session_id)


def classify_scale(event_count):
    """Classify session scale by event count."""
    if event_count == 0:
        return "empty"
    elif event_count < 5:
        return "trivial"
    elif event_count < 10:
        return "micro"
    elif event_count < 60:
        return "light"
    elif event_count < 200:
        return "moderate"
    elif event_count < 500:
        return "heavy"
    else:
        return "marathon"


def build_full_view(machine="m4-mini"):
    """Build the joined view of registry + index + event counts."""
    machines = list(MACHINE_SSH.keys()) if machine == "all" else [machine]
    analysed = load_analysed()

    sessions = []
    for m in machines:
        registry = load_registry(m)
        # For remote machines, batch the event counts to avoid per-session SSH
        # For now, use SSH wc -l per session (acceptable for 409 sessions)
        for sid, entry in registry.items():
            if sid in SKIP_IDS:
                continue
            # Skip if already seen from another machine
            if any(s["session_id"] == sid for s in sessions):
                continue
            event_count, ae_path = get_event_count(sid, m)
            scale = classify_scale(event_count)
            status = "done" if sid in analysed else "pending"

            sessions.append({
                "session_id": sid,
                "status": status,
                "wave": analysed[sid]["wave"] if sid in analysed else None,
                "event_count": event_count,
                "scale": scale,
                "project": entry.get("project", "unknown"),
                "source": entry.get("source", "unknown"),
                "session_type": entry.get("session_type"),
                "is_junk": entry.get("is_junk", False),
                "has_prompt": bool(entry.get("first_real_prompt")),
                "ae_path": str(ae_path) if ae_path else None,
                "started_at": entry.get("started_at", ""),
                "machine": m,
            })

    return sessions


def cmd_status(sessions, machine="m4-mini"):
    """Print summary status."""
    done = [s for s in sessions if s["status"] == "done"]
    pending = [s for s in sessions if s["status"] == "pending"]

    machine_label = machine.upper() if machine != "all" else "ALL MACHINES"
    print(f"=== Campaign Status ({machine_label}) ===")
    print(f"Total sessions:  {len(sessions)}")
    print(f"Analysed (done): {len(done)}")
    print(f"Pending:         {len(pending)}")
    if len(sessions) > 0:
        print(f"Progress:        {len(done)*100//len(sessions)}%")
    print()

    # Machine breakdown (if multi-machine)
    machines_in_view = set(s.get("machine", "m4-mini") for s in sessions)
    if len(machines_in_view) > 1:
        print(f"By machine:")
        for m in sorted(machines_in_view):
            m_total = sum(1 for s in sessions if s.get("machine") == m)
            m_done = sum(1 for s in done if s.get("machine") == m)
            m_pending = sum(1 for s in pending if s.get("machine") == m)
            print(f"  {m:10s}: {m_done}/{m_total} done, {m_pending} pending")
        print()

    # Pending breakdown by scale
    scales = Counter(s["scale"] for s in pending)
    print(f"Pending by scale:")
    for scale in ["empty", "trivial", "micro", "light", "moderate", "heavy", "marathon"]:
        if scales.get(scale, 0) > 0:
            print(f"  {scale:10s}: {scales[scale]}")

    # Pending breakdown by project (top 10)
    projects = Counter(s["project"] for s in pending)
    print(f"\nPending by project (top 10):")
    for proj, count in projects.most_common(10):
        print(f"  {proj:40s}: {count}")

    # Pending with real content vs empty/trivial
    substantive = [s for s in pending if s["event_count"] >= 5]
    trivial = [s for s in pending if s["event_count"] < 5]
    print(f"\nPending substantive (5+ events): {len(substantive)}")
    print(f"Pending trivial (<5 events):     {len(trivial)}")

    # Waves completed
    waves = Counter(s["wave"] for s in done if s["wave"])
    print(f"\nCompleted waves:")
    for wave in sorted(waves.keys()):
        print(f"  {wave}: {waves[wave]} sessions")


def cmd_pending(sessions):
    """List all pending session IDs."""
    pending = [s for s in sessions if s["status"] == "pending"]
    for s in sorted(pending, key=lambda x: x["event_count"], reverse=True):
        print(s["session_id"])


def cmd_next_batch(sessions, count):
    """Emit the next N session IDs for processing, sorted by richness."""
    pending = [s for s in sessions if s["status"] == "pending"]

    # Sort: substantive first (by event count desc), then trivial
    pending.sort(key=lambda x: x["event_count"], reverse=True)

    batch = pending[:count]
    for s in batch:
        print(s["session_id"])

    # Summary to stderr so stdout is clean for piping
    scales = Counter(s["scale"] for s in batch)
    print(f"\n# Batch: {len(batch)} sessions", file=sys.stderr)
    for scale, c in sorted(scales.items(), key=lambda x: x[1], reverse=True):
        print(f"#   {scale}: {c}", file=sys.stderr)


def cmd_breakdown(sessions):
    """Detailed breakdown of all sessions."""
    done = [s for s in sessions if s["status"] == "done"]
    pending = [s for s in sessions if s["status"] == "pending"]

    print(f"=== Full Breakdown ===\n")

    # By project
    all_projects = sorted(set(s["project"] for s in sessions))
    print(f"{'Project':40s} {'Done':>6s} {'Pending':>8s} {'Total':>6s}")
    print("-" * 65)
    for proj in all_projects:
        d = sum(1 for s in done if s["project"] == proj)
        p = sum(1 for s in pending if s["project"] == proj)
        print(f"{proj:40s} {d:6d} {p:8d} {d+p:6d}")

    print()

    # By scale
    all_scales = ["empty", "trivial", "micro", "light", "moderate", "heavy", "marathon"]
    print(f"{'Scale':10s} {'Done':>6s} {'Pending':>8s} {'Total':>6s}")
    print("-" * 35)
    for scale in all_scales:
        d = sum(1 for s in done if s["scale"] == scale)
        p = sum(1 for s in pending if s["scale"] == scale)
        if d + p > 0:
            print(f"{scale:10s} {d:6d} {p:8d} {d+p:6d}")


def main():
    # Parse --machine flag from anywhere in argv
    machine = "m4-mini"
    args = list(sys.argv[1:])
    if "--machine" in args:
        idx = args.index("--machine")
        machine = args[idx + 1]
        args.pop(idx)  # remove --machine
        args.pop(idx)  # remove value

    if not args:
        sessions = build_full_view(machine)
        cmd_status(sessions, machine)
        return

    cmd = args[0]

    if cmd == "--pending":
        sessions = build_full_view(machine)
        cmd_pending(sessions)
    elif cmd == "--next-batch":
        count = int(args[1]) if len(args) > 1 else 80
        sessions = build_full_view(machine)
        cmd_next_batch(sessions, count)
    elif cmd == "--breakdown":
        sessions = build_full_view(machine)
        cmd_breakdown(sessions)
    elif cmd == "--help":
        print(__doc__)
    else:
        print(f"Unknown command: {cmd}", file=sys.stderr)
        print("Use --help for usage", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
