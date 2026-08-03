#!/usr/bin/env python3
"""
Migration: session-index.jsonl v1 → v2

Reads v1 entries from session-index.jsonl and enriches them with structured
data extracted from findings markdown files and index JSON files.

v2 adds: shape, tools, classifiers, predicates, observations, analysis traceability.

Usage:
    python3 migrate-v1-to-v2.py

Reads:
    - ~/dev/ad/brains/angeleye/analysis/session-index.jsonl (v1)
    - ~/dev/ad/apps/angeleye/docs/planning/angeleye-analysis-1/index-w*.json
    - ~/dev/ad/apps/angeleye/docs/planning/angeleye-analysis-1/findings-w*.md

Writes:
    - ~/dev/ad/brains/angeleye/analysis/session-index-v2.jsonl
"""

import json
import glob
import os
import re
import sys
from pathlib import Path

ANALYSIS_DIR = Path.home() / "dev/ad/brains/angeleye/analysis"
CAMPAIGN_DIR = Path.home() / "dev/ad/apps/angeleye/docs/planning/angeleye-analysis-1"

V1_FILE = ANALYSIS_DIR / "session-index.jsonl"
V2_FILE = ANALYSIS_DIR / "session-index-v2.jsonl"


def load_v1_entries():
    """Load v1 entries from session-index.jsonl."""
    entries = []
    with open(V1_FILE) as f:
        for line in f:
            line = line.strip()
            if not line or not line.startswith("{"):
                continue
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return entries


def load_index_files():
    """Load all index-w*.json files, keyed by session_id."""
    index_map = {}
    for path in glob.glob(str(CAMPAIGN_DIR / "index-w*.json")):
        try:
            with open(path) as f:
                data = json.load(f)
            sid = data.get("session_id")
            if sid:
                data["_index_file"] = os.path.basename(path)
                index_map[sid] = data
        except (json.JSONDecodeError, KeyError):
            pass
    return index_map


def find_findings_file(wave_id):
    """Find the findings markdown file for a given wave ID (e.g., 'W4-15')."""
    pattern = f"findings-w{wave_id[1].lower()}-{wave_id[3:5]}*.md"
    matches = glob.glob(str(CAMPAIGN_DIR / pattern))
    return matches[0] if matches else None


def extract_wave_id_from_index_file(filename):
    """Extract wave ID from index filename like 'index-w4-15.json' → 'W4-15'."""
    m = re.match(r"index-w(\d+)-(\d+)\.json", filename)
    if m:
        return f"W{m.group(1)}-{m.group(2)}"
    return None


def parse_tool_counts_from_findings(filepath):
    """Best-effort extraction of tool counts from findings markdown."""
    if not filepath or not os.path.exists(filepath):
        return {}

    with open(filepath) as f:
        content = f.read()

    tools = {}

    # Pattern 1: "Tool (count)" or "Tool: count" or "Tool x count" or "Tool ×count"
    for match in re.finditer(r"(\w+(?:__\w+)*)\s*(?:×|x|\:)\s*(\d+)", content):
        tool_name = match.group(1)
        count = int(match.group(2))
        if tool_name in ("Read", "Write", "Edit", "Bash", "Grep", "Glob", "Agent",
                         "Skill", "ToolSearch", "CronCreate", "CronDelete", "TaskCreate",
                         "TaskStop", "TaskOutput", "WebFetch", "WebSearch",
                         "AskUserQuestion") or tool_name.startswith("mcp__"):
            tools[tool_name] = max(tools.get(tool_name, 0), count)

    # Pattern 2: Table rows "| Tool | Count |" or "| Tool | Count | % |"
    for match in re.finditer(r"\|\s*(\w+(?:__\w+)*)\s*\|\s*(\d+)\s*\|", content):
        tool_name = match.group(1)
        count = int(match.group(2))
        if tool_name[0].isupper() or tool_name.startswith("mcp__"):
            tools[tool_name] = max(tools.get(tool_name, 0), count)

    return tools


def parse_numeric_field(content, patterns):
    """Extract a numeric value using multiple regex patterns."""
    for pattern in patterns:
        m = re.search(pattern, content)
        if m:
            try:
                return int(m.group(1))
            except (ValueError, IndexError):
                pass
    return None


def parse_findings_metadata(filepath):
    """Extract structured metadata from findings markdown."""
    if not filepath or not os.path.exists(filepath):
        return {}

    with open(filepath) as f:
        content = f.read()

    meta = {}

    # User prompt count
    meta["user_prompt_count"] = parse_numeric_field(content, [
        r"(\d+)\s*user[_ ]?prompt",
        r"user[_ ]?prompt(?:s)?(?:\s*count)?:\s*(\d+)",
        r"(\d+)\s*(?:real\s+)?user\s+prompts",
    ])

    # Tool use count
    meta["tool_use_count"] = parse_numeric_field(content, [
        r"(\d+)\s*tool[_ ]?use",
        r"tool[_ ]?use(?:\s*count)?:\s*(\d+)",
    ])

    # Duration
    duration_match = re.search(r"~?(\d+)h\s*(\d+)?m", content)
    if duration_match:
        hours = int(duration_match.group(1))
        mins = int(duration_match.group(2)) if duration_match.group(2) else 0
        meta["duration_minutes"] = hours * 60 + mins

    # Context compactions
    meta["context_compactions"] = parse_numeric_field(content, [
        r"(\d+)\s*context\s*(?:window\s*)?(?:compaction|continuation|handover)",
        r"context\s*(?:compaction|continuation)s?:\s*(\d+)",
    ])

    # Skills invoked
    skills = re.findall(r"/(\w[\w\-:]+)", content)
    # Filter to likely skill names (not file paths)
    skill_names = [s for s in skills if not s.startswith("Users") and
                   not s.startswith("dev") and len(s) < 30]
    if skill_names:
        meta["skills_invoked"] = list(set(skill_names))

    # Classification challenged
    if re.search(r"(?:challenged|reclassif|BUILD is wrong|classification.*wrong)", content, re.I):
        meta["classification_challenged"] = True
    else:
        meta["classification_challenged"] = False

    # Frustration signals
    frustration_patterns = re.findall(
        r"frustrat|\"(?:This is shit|fuck|No, it isn|What.s going on|I asked this)",
        content, re.I
    )
    meta["has_frustration_signals"] = len(frustration_patterns) > 0

    # Playwright calls
    playwright_count = 0
    for match in re.finditer(r"mcp__playwright\w*\s*(?:×|x|\:|\|)\s*(\d+)", content):
        playwright_count += int(match.group(1))
    if playwright_count == 0:
        playwright_match = re.search(r"Playwright.*?(\d+)\s*(?:events|calls|MCP)", content)
        if playwright_match:
            playwright_count = int(playwright_match.group(1))
    meta["playwright_event_count"] = playwright_count

    # Multi-phase
    phase_mentions = re.findall(r"(?:Phase \d|phase \d|three.*phases|multi.?phase|distinct phases)", content, re.I)
    meta["is_multi_phase"] = len(phase_mentions) > 0

    return meta


def infer_opening_style(notes, findings_meta):
    """Infer opening style from available data."""
    notes_lower = (notes or "").lower()
    if "skill" in notes_lower and "invoc" in notes_lower:
        return "skill_invocation"
    if "paste" in notes_lower and ("handover" in notes_lower or "briefing" in notes_lower):
        return "paste_handover"
    if "bare" in notes_lower and "task" in notes_lower:
        return "bare_task_ref"
    if "conceptual" in notes_lower or "question" in notes_lower and "open" in notes_lower:
        return "conceptual_question"
    if "form" in notes_lower and "field" in notes_lower:
        return "form_field_paste"
    if "keyword" in notes_lower:
        return "keyword_orientation"
    return None


def infer_tool_profile(tools):
    """Infer tool profile from tool counts."""
    if not tools:
        return None

    total = sum(tools.values())
    if total == 0:
        return "conversational"

    bash_pct = tools.get("Bash", 0) / total
    edit_pct = tools.get("Edit", 0) / total
    read_pct = (tools.get("Read", 0) + tools.get("Glob", 0) + tools.get("Grep", 0)) / total
    write_count = tools.get("Write", 0)
    playwright_count = sum(v for k, v in tools.items() if k.startswith("mcp__playwright"))
    playwright_pct = playwright_count / total

    if playwright_pct > 0.20:
        return "ui_audit"
    if edit_pct > 0.30:
        return "build_focused"
    if bash_pct > 0.50 and edit_pct < 0.10:
        if write_count <= 1:
            return "operational_scripting"
        return "debug_loop"
    if read_pct > 0.50 and write_count > 0 and write_count <= 5:
        return "synthesis"
    if read_pct > 0.60 and write_count == 0:
        return "read_only"
    if tools.get("Agent", 0) > 5 or tools.get("TaskCreate", 0) > 5:
        return "agent_orchestration"
    search_count = (tools.get("Grep", 0) + tools.get("Glob", 0) +
                    sum(v for k, v in tools.items() if "search" in k.lower()))
    if search_count / total > 0.40:
        return "search_heavy"

    return None


def infer_session_scale(event_count, compactions):
    """Infer session scale from metrics."""
    if event_count is None:
        return None
    if (compactions or 0) >= 3:
        return "marathon"
    if event_count < 10:
        return "micro"
    if event_count < 50:
        return "light"
    if event_count < 200:
        return "moderate"
    if event_count < 500:
        return "heavy"
    return "marathon"


def parse_session_type(analysed_type):
    """Split session_type_analysed into parent and subtype."""
    if not analysed_type:
        return None, None

    # Clean up common formats
    cleaned = analysed_type.strip()

    # Handle "PARENT / subtype" format
    if " / " in cleaned:
        parts = cleaned.split(" / ", 1)
        parent = parts[0].strip().upper()
        subtype = parts[1].strip()
        return parent, subtype

    # Handle "parent.subtype" format
    if "." in cleaned:
        parts = cleaned.split(".", 1)
        parent = parts[0].strip().upper()
        subtype = parts[1].strip()
        return parent, subtype

    # Handle "MIXED (...)" format
    if cleaned.startswith("MIXED"):
        return "MIXED", cleaned

    # Handle bare parent type
    return cleaned.upper(), None


def migrate_entry(v1_entry, index_data, findings_meta, tools):
    """Convert a v1 entry to v2."""
    sid = v1_entry["session_id"]
    notes = v1_entry.get("notes", "")
    analysed_type = v1_entry.get("session_type_analysed") or (
        index_data.get("session_type_analysed") if index_data else None
    )

    parent_type, subtype = parse_session_type(analysed_type)

    # Merge event_count from v1, index, or findings
    event_count = (
        index_data.get("event_count") if index_data else None
    ) or v1_entry.get("event_count")

    user_prompt_count = (
        (index_data.get("user_prompt_count") if index_data else None) or
        (findings_meta.get("user_prompt_count") if findings_meta else None)
    )

    tool_use_count = (
        (index_data.get("tool_use_count") if index_data else None) or
        (findings_meta.get("tool_use_count") if findings_meta else None)
    )

    context_compactions = (
        findings_meta.get("context_compactions") if findings_meta else None
    )

    duration_minutes = (
        findings_meta.get("duration_minutes") if findings_meta else None
    )

    classification_challenged = (
        index_data.get("classification_challenged") if index_data else None
    ) or (findings_meta.get("classification_challenged") if findings_meta else False)

    challenge_reason = (
        index_data.get("challenge_reason") if index_data else None
    )

    # Build wave ID from index file name
    wave_id = None
    findings_file = None
    if index_data and "_index_file" in index_data:
        wave_id = extract_wave_id_from_index_file(index_data["_index_file"])
        if wave_id:
            findings_pattern = f"findings-w{wave_id[1].lower()}-{wave_id[3:5]}*.md"
            matches = glob.glob(str(CAMPAIGN_DIR / findings_pattern))
            if matches:
                findings_file = os.path.basename(matches[0])

    tool_profile = infer_tool_profile(tools)
    session_scale = infer_session_scale(event_count, context_compactions)
    opening_style = infer_opening_style(notes, findings_meta)

    # Determine project attribution quality
    project_dir = v1_entry.get("project_dir", "")
    project_attribution = None
    if project_dir.endswith("/brains") or project_dir == "/Users/davidcruwys":
        if findings_meta and findings_meta.get("classification_challenged"):
            project_attribution = "incidental"
        else:
            project_attribution = "unreliable"
    elif project_dir.endswith("/dev/ad"):
        project_attribution = "unreliable"

    # Predicate: has_frustration_signals
    has_frustration = (
        findings_meta.get("has_frustration_signals", False) if findings_meta else None
    )

    # Predicate: is_multi_phase
    is_multi_phase = (
        findings_meta.get("is_multi_phase", False) if findings_meta else None
    )

    # Predicate: has_playwright_calls
    playwright_count = (
        findings_meta.get("playwright_event_count", 0) if findings_meta else 0
    )
    has_playwright = playwright_count > 0

    # Predicate: is_feature_construction
    is_feature = None
    if parent_type == "BUILD":
        is_feature = True
    elif parent_type in ("DEBUG", "SYSOPS", "RESEARCH", "ORIENTATION", "META",
                          "KNOWLEDGE", "BRAND", "REVIEW", "SKILL", "SETUP"):
        is_feature = False

    # Predicate: has_brain_file_writes
    has_brain_writes = None
    if "brains" in project_dir:
        if parent_type == "KNOWLEDGE" and subtype in ("brain_update", "brain_curation",
                                                        "brain_synthesis", "brain_ingestion",
                                                        "survey_and_implement"):
            has_brain_writes = True
        elif parent_type in ("BRAND", "RESEARCH"):
            has_brain_writes = False

    # Skills
    skills = findings_meta.get("skills_invoked", []) if findings_meta else []

    # Build v2 entry
    v2 = {
        "schema_version": 2,
        "session_id": sid,
        "machine": v1_entry.get("machine", "m4-mini"),
        "project": v1_entry.get("project"),
        "project_dir": v1_entry.get("project_dir"),

        "shape": {
            "file_size_bytes": v1_entry.get("file_size_bytes"),
            "event_count": event_count,
            "user_prompt_count": user_prompt_count,
            "tool_use_count": tool_use_count,
            "duration_minutes": duration_minutes,
            "active_minutes": None,  # Not reliably extractable from findings
            "context_compactions": context_compactions,
        },

        "tools": tools if tools else None,

        "classifiers": {
            "session_type": {
                "value": parent_type,
                "subtype": subtype,
                "confidence": index_data.get("confidence") if index_data else None,
                "reasoning": challenge_reason,
            } if parent_type else None,
            "opening_style": {
                "value": opening_style,
                "confidence": None,
                "reasoning": None,
            } if opening_style else None,
            "closing_style": None,  # Not reliably extractable
            "tool_profile": {
                "value": tool_profile,
                "confidence": "medium",
                "reasoning": "Inferred from tool counts",
            } if tool_profile else None,
            "project_attribution": {
                "value": project_attribution,
                "confidence": "medium",
                "reasoning": None,
            } if project_attribution else None,
            "session_scale": {
                "value": session_scale,
                "confidence": "high",
                "reasoning": f"event_count={event_count}, compactions={context_compactions}",
            } if session_scale else None,
        },

        "predicates": {
            "is_feature_construction": {
                "result": is_feature,
                "justification": f"Parent type is {parent_type}",
            } if is_feature is not None else None,
            "has_frustration_signals": {
                "result": has_frustration,
                "justification": "Detected in findings analysis",
            } if has_frustration is not None else None,
            "is_multi_phase": {
                "result": is_multi_phase,
                "justification": "Phase mentions found in findings",
            } if is_multi_phase is not None else None,
            "has_brain_file_writes": {
                "result": has_brain_writes,
                "justification": f"Inferred from subtype {subtype}",
            } if has_brain_writes is not None else None,
            "has_playwright_calls": {
                "result": has_playwright,
                "justification": f"{playwright_count} Playwright events detected",
            } if has_playwright is not None else None,
            "has_cross_session_refs": None,  # Not reliably extractable
            "has_skill_gap_signal": None,  # Not reliably extractable
            "has_unauthorized_edits": None,  # Not reliably extractable
            "is_compaction_resume": {
                "result": (context_compactions or 0) > 0,
                "justification": f"{context_compactions} compaction(s) detected",
            } if context_compactions is not None else None,
            "is_cwd_incidental": {
                "result": project_attribution == "incidental",
                "justification": f"project_dir={project_dir}",
            } if project_attribution else None,
        },

        "observations": {
            "frustration_analysis": None,  # Requires backward pass
            "phase_breakdown": None,
            "session_chain": None,
            "cwd_mismatch": None,
            "skill_gap": None,
        },

        "analysis": {
            "wave": wave_id,
            "findings_file": findings_file,
            "analysed_at": v1_entry.get("analysed_at"),
        },

        "registry_type": v1_entry.get("session_type_registry"),
        "proposed_subtypes": [f"{parent_type.lower()}.{subtype}"] if parent_type and subtype else [],
        "skills_invoked": skills if skills else None,
        "disposition": v1_entry.get("disposition"),
        "interest_level": v1_entry.get("interest_level"),
        "notes": v1_entry.get("notes"),
    }

    return v2


def main():
    print("Loading v1 entries...")
    v1_entries = load_v1_entries()
    print(f"  Found {len(v1_entries)} v1 entries")

    print("Loading index files...")
    index_map = load_index_files()
    print(f"  Found {len(index_map)} index files")

    # Build a combined set: v1 entries + any index files not in v1
    v1_sids = {e["session_id"] for e in v1_entries}
    missing_from_v1 = []
    for sid, idx in index_map.items():
        if sid not in v1_sids:
            # Create a synthetic v1 entry from the index file
            synthetic = {
                "schema_version": 1,
                "session_id": sid,
                "machine": idx.get("machine", "m4-mini"),
                "project": idx.get("project"),
                "project_dir": idx.get("project_dir"),
                "session_type_registry": idx.get("session_type_registry"),
                "session_type_analysed": idx.get("session_type_analysed"),
                "file_size_bytes": idx.get("file_size_bytes"),
                "event_count": idx.get("event_count"),
                "disposition": idx.get("disposition", "active"),
                "interest_level": idx.get("interest_level"),
                "notes": idx.get("notes", ""),
                "analysed_at": idx.get("analysed_at"),
            }
            missing_from_v1.append(synthetic)

    all_entries = v1_entries + missing_from_v1
    print(f"  Combined: {len(v1_entries)} from v1 + {len(missing_from_v1)} from index files = {len(all_entries)} total")

    print("Migrating to v2...")
    v2_entries = []
    stats = {"tools_found": 0, "findings_found": 0, "nulls": 0}

    for v1 in all_entries:
        sid = v1["session_id"]
        index_data = index_map.get(sid)

        # Find findings file for this session
        findings_file = None
        findings_meta = {}
        tools = {}

        if index_data and "_index_file" in index_data:
            wave_id = extract_wave_id_from_index_file(index_data["_index_file"])
            if wave_id:
                findings_pattern = f"findings-w{wave_id[1].lower()}-{wave_id[3:5]}*.md"
                matches = glob.glob(str(CAMPAIGN_DIR / findings_pattern))
                if matches:
                    findings_file = matches[0]
                    findings_meta = parse_findings_metadata(findings_file)
                    tools = parse_tool_counts_from_findings(findings_file)
                    stats["findings_found"] += 1
                    if tools:
                        stats["tools_found"] += 1

        # Also check if index file has tool_breakdown
        if index_data and "tool_breakdown" in index_data:
            tools = index_data["tool_breakdown"]
            stats["tools_found"] += 1

        v2 = migrate_entry(v1, index_data, findings_meta, tools)
        v2_entries.append(v2)

    # Write v2
    with open(V2_FILE, "w") as f:
        for entry in v2_entries:
            f.write(json.dumps(entry) + "\n")

    print(f"\nMigration complete:")
    print(f"  Entries migrated: {len(v2_entries)}")
    print(f"  Tool counts extracted: {stats['tools_found']}/{len(v2_entries)}")
    print(f"  Findings metadata extracted: {stats['findings_found']}/{len(v2_entries)}")
    print(f"  Output: {V2_FILE}")

    # Summary of field coverage
    fields_present = {
        "tools": sum(1 for e in v2_entries if e.get("tools")),
        "user_prompt_count": sum(1 for e in v2_entries if e["shape"].get("user_prompt_count")),
        "duration_minutes": sum(1 for e in v2_entries if e["shape"].get("duration_minutes")),
        "context_compactions": sum(1 for e in v2_entries if e["shape"].get("context_compactions")),
        "session_type": sum(1 for e in v2_entries if e["classifiers"].get("session_type")),
        "tool_profile": sum(1 for e in v2_entries if e["classifiers"].get("tool_profile")),
        "opening_style": sum(1 for e in v2_entries if e["classifiers"].get("opening_style")),
        "is_feature_construction": sum(1 for e in v2_entries if e["predicates"].get("is_feature_construction")),
        "has_frustration_signals": sum(1 for e in v2_entries if e["predicates"].get("has_frustration_signals")),
    }
    print("\nField coverage:")
    for field, count in fields_present.items():
        pct = count * 100 / len(v2_entries) if v2_entries else 0
        print(f"  {field}: {count}/{len(v2_entries)} ({pct:.0f}%)")


if __name__ == "__main__":
    main()
