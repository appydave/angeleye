#!/usr/bin/env python3
"""
Campaign status tool — live view of analysis campaign progress.

Joins the AngelEye registry (all sessions) with session-index.jsonl (analysed)
to give a real-time picture of what's done, what's pending, and what's next.

Usage:
    python3 campaign-status.py                    # Summary status
    python3 campaign-status.py --pending          # List all pending session IDs
    python3 campaign-status.py --next-batch N     # Emit next N session IDs for processing
    python3 campaign-status.py --breakdown        # Detailed breakdown by project/scale
    python3 campaign-status.py --mark-done WAVE   # Read stdin session IDs, record as done

The --next-batch output is directly usable by compute-session-shape.py --batch:
    python3 campaign-status.py --next-batch 80 > wave-ids.txt
    python3 compute-session-shape.py --batch wave-ids.txt
"""

import json
import sys
import os
from collections import Counter
from pathlib import Path


REGISTRY_PATH = Path.home() / ".claude/angeleye/registry.json"
INDEX_PATH = Path.home() / "dev/ad/brains/angeleye/analysis/session-index.jsonl"
AE_SESSIONS_DIR = Path.home() / ".claude/angeleye/sessions"
AE_ARCHIVE_DIR = Path.home() / ".claude/angeleye/archive"

SKIP_IDS = {"test-debug-001"}


def load_registry():
    """Load all sessions from the AngelEye registry."""
    with open(REGISTRY_PATH) as f:
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


def get_event_count(session_id):
    """Count events in the AngelEye JSONL file for a session."""
    for d in [AE_SESSIONS_DIR, AE_ARCHIVE_DIR]:
        path = d / f"session-{session_id}.jsonl"
        if path.exists():
            with open(path) as f:
                return sum(1 for _ in f), path
    return 0, None


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


def build_full_view():
    """Build the joined view of registry + index + event counts."""
    registry = load_registry()
    analysed = load_analysed()

    sessions = []
    for sid, entry in registry.items():
        if sid in SKIP_IDS:
            continue
        event_count, ae_path = get_event_count(sid)
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
        })

    return sessions


def cmd_status(sessions):
    """Print summary status."""
    done = [s for s in sessions if s["status"] == "done"]
    pending = [s for s in sessions if s["status"] == "pending"]

    print(f"=== Campaign Status ===")
    print(f"Total sessions:  {len(sessions)}")
    print(f"Analysed (done): {len(done)}")
    print(f"Pending:         {len(pending)}")
    print(f"Progress:        {len(done)*100//len(sessions)}%")
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
    if len(sys.argv) < 2:
        sessions = build_full_view()
        cmd_status(sessions)
        return

    cmd = sys.argv[1]

    if cmd == "--pending":
        sessions = build_full_view()
        cmd_pending(sessions)
    elif cmd == "--next-batch":
        count = int(sys.argv[2]) if len(sys.argv) > 2 else 80
        sessions = build_full_view()
        cmd_next_batch(sessions, count)
    elif cmd == "--breakdown":
        sessions = build_full_view()
        cmd_breakdown(sessions)
    elif cmd == "--help":
        print(__doc__)
    else:
        print(f"Unknown command: {cmd}", file=sys.stderr)
        print("Use --help for usage", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
