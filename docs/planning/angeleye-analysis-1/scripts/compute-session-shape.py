#!/usr/bin/env python3
"""
Pre-processing script: compute structured session shape from JSONL.

No LLM needed — pure computation from event data. Outputs a JSON object
with raw metrics, tool counts, file paths touched, detected patterns,
and timing data that analysis agents can use directly.

Usage:
    python3 compute-session-shape.py <session-jsonl-path>
    python3 compute-session-shape.py --batch <session-id-list.txt>

The output JSON matches the v2 schema's shape/tools/detectors sections.
"""

import json
import sys
import os
import re
import subprocess
from datetime import datetime, timezone
from collections import Counter
from pathlib import Path


# Machine SSH aliases — matches ~/.ssh/config
MACHINE_SSH = {
    "m4-mini": None,       # local machine, no SSH needed
    "m4-pro": "macbook-pro-m4",
}

SESSIONS_SUBPATH = ".claude/angeleye/sessions"
ARCHIVE_SUBPATH = ".claude/angeleye/archive"


def parse_timestamp(ts_str):
    """Parse ISO8601 timestamp to datetime."""
    try:
        return datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


def load_session_events(filepath):
    """Load all events from a session JSONL file (local path)."""
    events = []
    with open(filepath) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return events


def load_session_events_ssh(ssh_host, session_id):
    """Load events from a remote session JSONL file via SSH."""
    home = "/Users/davidcruwys"
    for subpath in [SESSIONS_SUBPATH, ARCHIVE_SUBPATH]:
        remote_path = f"{home}/{subpath}/session-{session_id}.jsonl"
        try:
            result = subprocess.run(
                ["ssh", ssh_host, f"cat {remote_path}"],
                capture_output=True, text=True, timeout=30
            )
            if result.returncode == 0 and result.stdout.strip():
                events = []
                for line in result.stdout.strip().split("\n"):
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        events.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass
                if events:
                    return events
        except subprocess.TimeoutExpired:
            print(f"SSH timeout reading {session_id} from {ssh_host}", file=sys.stderr)
    return []


def compute_shape(events):
    """Compute raw shape metrics from events."""
    if not events:
        return {"error": "no events"}

    # Categorise events
    user_prompts = [e for e in events if e.get("event") == "user_prompt"]
    tool_uses = [e for e in events if e.get("event") == "tool_use"]
    stops = [e for e in events if e.get("event") == "stop"]
    subagent_starts = [e for e in events if e.get("event") == "subagent_start"]
    subagent_stops = [e for e in events if e.get("event") == "subagent_stop"]
    session_starts = [e for e in events if e.get("event") == "session_start"]
    session_ends = [e for e in events if e.get("event") == "session_end"]

    # Timestamps
    timestamps = [parse_timestamp(e.get("ts")) for e in events]
    timestamps = [t for t in timestamps if t]

    first_ts = min(timestamps) if timestamps else None
    last_ts = max(timestamps) if timestamps else None
    duration_minutes = None
    if first_ts and last_ts:
        duration_minutes = int((last_ts - first_ts).total_seconds() / 60)

    # Active minutes: sum of gaps < 30min between consecutive events
    active_minutes = 0
    if len(timestamps) > 1:
        sorted_ts = sorted(timestamps)
        for i in range(1, len(sorted_ts)):
            gap = (sorted_ts[i] - sorted_ts[i - 1]).total_seconds() / 60
            if gap < 30:
                active_minutes += gap
    active_minutes = int(active_minutes)

    # Idle gaps > 1 hour
    idle_gaps = []
    if len(timestamps) > 1:
        sorted_ts = sorted(timestamps)
        for i in range(1, len(sorted_ts)):
            gap_minutes = (sorted_ts[i] - sorted_ts[i - 1]).total_seconds() / 60
            if gap_minutes >= 60:
                idle_gaps.append({
                    "start": sorted_ts[i - 1].isoformat(),
                    "end": sorted_ts[i].isoformat(),
                    "gap_minutes": int(gap_minutes),
                })

    return {
        "event_count": len(events),
        "user_prompt_count": len(user_prompts),
        "tool_use_count": len(tool_uses),
        "stop_count": len(stops),
        "subagent_start_count": len(subagent_starts),
        "subagent_stop_count": len(subagent_stops),
        "first_event_ts": first_ts.isoformat() if first_ts else None,
        "last_event_ts": last_ts.isoformat() if last_ts else None,
        "duration_minutes": duration_minutes,
        "active_minutes": active_minutes,
        "idle_gaps_over_1h": len(idle_gaps),
        "idle_gap_details": idle_gaps if idle_gaps else None,
    }


def compute_tools(events):
    """Count tool calls by tool name."""
    tool_uses = [e for e in events if e.get("event") == "tool_use"]
    counts = Counter(e.get("tool", "unknown") for e in tool_uses)
    return dict(counts.most_common())


def extract_file_paths(events):
    """Extract all file paths touched by Read/Write/Edit tools."""
    paths = {"read": [], "write": [], "edit": []}
    for e in events:
        if e.get("event") != "tool_use":
            continue
        tool = e.get("tool", "")
        summary = e.get("tool_summary", {})
        filepath = summary.get("file")
        if not filepath:
            continue
        if tool == "Read":
            paths["read"].append(filepath)
        elif tool == "Write":
            paths["write"].append(filepath)
        elif tool == "Edit":
            paths["edit"].append(filepath)

    # Deduplicate while preserving order
    for key in paths:
        seen = set()
        deduped = []
        for p in paths[key]:
            if p not in seen:
                seen.add(p)
                deduped.append(p)
        paths[key] = deduped

    return paths


def extract_bash_commands(events):
    """Extract Bash commands from tool_summary."""
    commands = []
    for e in events:
        if e.get("event") == "tool_use" and e.get("tool") == "Bash":
            summary = e.get("tool_summary", {})
            cmd = summary.get("command")
            if cmd:
                commands.append(cmd)
    return commands


def extract_skill_invocations(events):
    """Extract skill invocations from Skill tool_use events."""
    skills = []
    for e in events:
        if e.get("event") == "tool_use" and e.get("tool") == "Skill":
            summary = e.get("tool_summary", {})
            # Skill name might be in summary or in the tool_use_id context
            skills.append(summary)
    return skills if skills else None


def extract_first_real_prompt(events):
    """Get the first user_prompt that looks like genuine intent (not system/noise)."""
    for e in events:
        if e.get("event") != "user_prompt":
            continue
        prompt = e.get("prompt", "")
        # Skip compaction resumes
        if "This session is being continued from a previous conversation" in prompt:
            continue
        # Skip very short noise
        if len(prompt.strip()) < 3:
            continue
        return {
            "text": prompt[:500],  # First 500 chars
            "full_length": len(prompt),
            "ts": e.get("ts"),
        }
    return None


def extract_subagents(events):
    """Extract subagent activity."""
    agents = []
    for e in events:
        if e.get("event") == "subagent_start":
            agents.append({
                "agent_id": e.get("agent_id"),
                "agent_type": e.get("agent_type"),
                "started_at": e.get("ts"),
            })
        elif e.get("event") == "subagent_stop":
            # Match to existing start
            aid = e.get("agent_id")
            for a in agents:
                if a["agent_id"] == aid and "stopped_at" not in a:
                    a["stopped_at"] = e.get("ts")
                    break
    return agents if agents else None


def detect_patterns(events, tools, shape):
    """Detect known event-sequence patterns (no LLM needed)."""
    detections = {}

    user_prompts = [e for e in events if e.get("event") == "user_prompt"]
    tool_uses = [e for e in events if e.get("event") == "tool_use"]

    # D01: Compaction resume
    compaction_count = 0
    for e in user_prompts:
        prompt = e.get("prompt", "")
        if "This session is being continued from a previous conversation" in prompt:
            compaction_count += 1
    detections["compaction_resume"] = {
        "detected": compaction_count > 0,
        "count": compaction_count,
    }

    # D02: Loop runaway (>90% stop events with identical-ish prompts)
    stops = [e for e in events if e.get("event") == "stop"]
    if len(stops) > 10 and shape.get("user_prompt_count", 0) > 0:
        stop_ratio = len(stops) / len(events)
        detections["loop_runaway"] = {
            "detected": stop_ratio > 0.7,
            "stop_ratio": round(stop_ratio, 2),
        }
    else:
        detections["loop_runaway"] = {"detected": False}

    # D03: Write-then-open (Write followed by Bash containing 'open')
    write_then_open = 0
    for i in range(len(events) - 1):
        if (events[i].get("event") == "tool_use" and events[i].get("tool") == "Write"):
            # Check next few events for Bash with 'open'
            for j in range(i + 1, min(i + 4, len(events))):
                if (events[j].get("event") == "tool_use" and
                        events[j].get("tool") == "Bash"):
                    cmd = events[j].get("tool_summary", {}).get("command", "")
                    if cmd.startswith("open ") or " open " in cmd:
                        write_then_open += 1
                        break
    detections["write_then_open"] = {
        "detected": write_then_open > 0,
        "count": write_then_open,
    }

    # D04: Unauthorized edit (Edit before first user instruction)
    first_prompt_ts = None
    for e in events:
        if e.get("event") == "user_prompt":
            first_prompt_ts = parse_timestamp(e.get("ts"))
            break
    edits_before_prompt = 0
    if first_prompt_ts:
        for e in events:
            if e.get("event") == "tool_use" and e.get("tool") == "Edit":
                edit_ts = parse_timestamp(e.get("ts"))
                if edit_ts and edit_ts < first_prompt_ts:
                    edits_before_prompt += 1
    detections["unauthorized_edit_before_prompt"] = {
        "detected": edits_before_prompt > 0,
        "count": edits_before_prompt,
    }

    # D05: Search with no results (Grep/Glob burst with no subsequent Read)
    # Simplified: count Grep/Glob sequences not followed by Read within 3 events
    search_no_read = 0
    for i, e in enumerate(events):
        if (e.get("event") == "tool_use" and
                e.get("tool") in ("Grep", "Glob")):
            has_read = False
            for j in range(i + 1, min(i + 4, len(events))):
                if (events[j].get("event") == "tool_use" and
                        events[j].get("tool") == "Read"):
                    has_read = True
                    break
            if not has_read:
                search_no_read += 1
    detections["search_without_read"] = {
        "detected": search_no_read > 3,
        "count": search_no_read,
    }

    # D06: Ralphy mode (Skill with ralphy + Agent/Task calls + IMPLEMENTATION_PLAN.md reads)
    has_ralphy = False
    has_impl_plan = False
    has_agents = tools.get("Agent", 0) > 0 or tools.get("TaskCreate", 0) > 0
    for e in events:
        if e.get("event") == "tool_use":
            summary = e.get("tool_summary", {})
            if e.get("tool") == "Skill":
                if "ralphy" in json.dumps(summary).lower():
                    has_ralphy = True
            if e.get("tool") in ("Read", "Edit"):
                filepath = summary.get("file", "")
                if "IMPLEMENTATION_PLAN" in filepath:
                    has_impl_plan = True
    detections["ralphy_mode"] = {
        "detected": has_ralphy and has_agents,
        "has_ralphy_skill": has_ralphy,
        "has_impl_plan": has_impl_plan,
        "has_agent_calls": has_agents,
    }

    # D07: Form-filling (1 long paste then many short prompts)
    if len(user_prompts) >= 5:
        lengths = [len(e.get("prompt", "")) for e in user_prompts]
        if lengths[0] > 2000 and len(lengths) > 5:
            short_after = sum(1 for l in lengths[1:] if l < 200)
            ratio = short_after / (len(lengths) - 1)
            detections["form_filling"] = {
                "detected": ratio > 0.6,
                "first_prompt_length": lengths[0],
                "short_prompt_ratio": round(ratio, 2),
            }
        else:
            detections["form_filling"] = {"detected": False}
    else:
        detections["form_filling"] = {"detected": False}

    # D08: CronCreate/CronDelete pairs (background polling)
    cron_creates = tools.get("CronCreate", 0)
    cron_deletes = tools.get("CronDelete", 0)
    detections["cron_polling"] = {
        "detected": cron_creates > 0,
        "creates": cron_creates,
        "deletes": cron_deletes,
    }

    return detections


def infer_project_from_paths(file_paths, cwd):
    """Infer actual project from file paths touched, not CWD."""
    edit_write_paths = file_paths.get("edit", []) + file_paths.get("write", [])
    if not edit_write_paths:
        return {"inferred_project": None, "cwd_reliable": None}

    # Extract common path prefix
    if len(edit_write_paths) == 1:
        project_path = os.path.dirname(edit_write_paths[0])
    else:
        project_path = os.path.commonpath(edit_write_paths)

    cwd_matches = project_path.startswith(cwd) or cwd.startswith(project_path)

    return {
        "inferred_project": project_path,
        "cwd_reliable": cwd_matches,
        "edit_write_count": len(edit_write_paths),
    }


def process_session(filepath):
    """Process a single session JSONL file and return computed shape."""
    events = load_session_events(filepath)
    if not events:
        return {"error": f"No events in {filepath}"}

    session_id = events[0].get("session_id", "unknown")
    cwd = events[0].get("cwd", "")

    shape = compute_shape(events)
    tools = compute_tools(events)
    file_paths = extract_file_paths(events)
    bash_commands = extract_bash_commands(events)
    first_prompt = extract_first_real_prompt(events)
    subagents = extract_subagents(events)
    skill_invocations = extract_skill_invocations(events)
    detections = detect_patterns(events, tools, shape)
    project_inference = infer_project_from_paths(file_paths, cwd)

    return {
        "session_id": session_id,
        "source_file": str(filepath),
        "cwd": cwd,
        "shape": shape,
        "tools": tools,
        "file_paths": {
            "read": file_paths["read"][:20],  # Cap at 20 unique paths
            "write": file_paths["write"],
            "edit": file_paths["edit"][:20],
        },
        "bash_commands_sample": bash_commands[:10],  # First 10
        "first_real_prompt": first_prompt,
        "skill_invocations": skill_invocations,
        "subagents": subagents,
        "detections": detections,
        "project_inference": project_inference,
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 compute-session-shape.py <session.jsonl>")
        print("       python3 compute-session-shape.py --batch <id-list.txt> [--machine m4-pro]")
        sys.exit(1)

    # Parse --machine flag from anywhere in argv
    machine = "m4-mini"
    args = list(sys.argv[1:])
    if "--machine" in args:
        idx = args.index("--machine")
        machine = args[idx + 1]
        args.pop(idx)  # remove --machine
        args.pop(idx)  # remove value

    ssh_host = MACHINE_SSH.get(machine)

    if args[0] == "--batch":
        # Batch mode: read session IDs from file, find and process each
        id_file = args[1]
        sessions_dir = Path.home() / SESSIONS_SUBPATH
        archive_dir = Path.home() / ARCHIVE_SUBPATH

        with open(id_file) as f:
            session_ids = [line.strip() for line in f if line.strip()]

        results = []
        for sid in session_ids:
            if ssh_host:
                # Remote machine — fetch via SSH
                events = load_session_events_ssh(ssh_host, sid)
                if not events:
                    results.append({"session_id": sid, "error": "file not found on remote"})
                    continue
                # Process from events directly
                cwd = events[0].get("cwd", "")
                shape = compute_shape(events)
                tools = compute_tools(events)
                file_paths = extract_file_paths(events)
                bash_commands = extract_bash_commands(events)
                first_prompt = extract_first_real_prompt(events)
                subagents = extract_subagents(events)
                skill_invocations = extract_skill_invocations(events)
                detections = detect_patterns(events, tools, shape)
                project_inference = infer_project_from_paths(file_paths, cwd)
                results.append({
                    "session_id": sid,
                    "source_file": f"ssh://{ssh_host}/session-{sid}.jsonl",
                    "machine": machine,
                    "cwd": cwd,
                    "shape": shape,
                    "tools": tools,
                    "file_paths": {
                        "read": file_paths["read"][:20],
                        "write": file_paths["write"],
                        "edit": file_paths["edit"][:20],
                    },
                    "bash_commands_sample": bash_commands[:10],
                    "first_real_prompt": first_prompt,
                    "skill_invocations": skill_invocations,
                    "subagents": subagents,
                    "detections": detections,
                    "project_inference": project_inference,
                })
            else:
                # Local machine
                path = sessions_dir / f"session-{sid}.jsonl"
                if not path.exists():
                    path = archive_dir / f"session-{sid}.jsonl"
                if not path.exists():
                    results.append({"session_id": sid, "error": "file not found"})
                    continue
                results.append(process_session(str(path)))

        print(json.dumps(results, indent=2))
    else:
        # Single file mode
        result = process_session(args[0])
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
