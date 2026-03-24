#!/usr/bin/env python3
"""Backward pass processor for bp-batch-02.json — adds new predicates, classifiers, observations."""

import json
import os
from datetime import datetime, timezone
from collections import Counter

INPUT = os.path.join(os.path.dirname(__file__), "precomputed", "bp-batch-02.json")
OUT_JSONL = os.path.expanduser("~/dev/ad/brains/angeleye/analysis/bp-batch-02.jsonl")
OUT_MD = os.path.expanduser("~/dev/ad/brains/angeleye/analysis/bp-findings-02.md")


def safe_list(v):
    return v if isinstance(v, list) else []


def safe_dict(v):
    return v if isinstance(v, dict) else {}


def has_cross_project_reads(sd, cwd):
    """Check if file reads go outside CWD project."""
    if not cwd:
        return None, "no CWD available"
    reads = safe_list(safe_dict(sd.get("file_paths")).get("read"))
    if not reads:
        # No file paths captured — check if Read tool used at all
        tools = safe_dict(sd.get("tools"))
        if tools.get("Read", 0) > 0:
            return None, "Read tool used but paths not captured"
        return False, "no Read tool usage"
    # Normalize cwd
    cwd_norm = cwd.rstrip("/")
    cross = []
    for r in reads:
        # Skip common non-project paths
        if r.startswith("/Users/davidcruwys/.claude/"):
            continue
        if not r.startswith(cwd_norm + "/"):
            # Check if it's a different project under ~/dev/ad/
            if r.startswith("/Users/davidcruwys/dev/") or r.startswith("/Users/davidcruwys/"):
                cross.append(r)
    if cross:
        # Summarize which projects
        projects = set()
        for c in cross:
            parts = c.replace("/Users/davidcruwys/dev/ad/", "").split("/")
            if len(parts) > 0:
                projects.add(parts[0])
        return True, f"reads from: {', '.join(sorted(projects)[:3])}"
    return False, "all reads within CWD"


def has_web_research(sd):
    """Check for WebSearch, WebFetch, brave-search tools."""
    tools = safe_dict(sd.get("tools"))
    web_tools = ["WebSearch", "WebFetch"]
    for t in tools:
        if t in web_tools or "brave" in t.lower():
            return True, f"uses {t}"
    # Also check bash for curl/wget as web research proxy
    return False, "no web tools used"


def has_parallel_subagent_bursts(sd):
    """Check for 3+ subagents started within 60 seconds."""
    subs = safe_list(sd.get("subagents"))
    if len(subs) < 3:
        return False, f"only {len(subs)} subagents total"

    starts = []
    for s in subs:
        ts = s.get("started_at")
        if ts:
            try:
                if ts.endswith("Z"):
                    ts = ts.replace("Z", "+00:00")
                starts.append(datetime.fromisoformat(ts))
            except (ValueError, TypeError):
                pass

    starts.sort()
    # Sliding window of 60s
    for i in range(len(starts) - 2):
        window = (starts[i + 2] - starts[i]).total_seconds()
        if window <= 60:
            return True, f"burst of 3+ subagents in {window:.0f}s"
    return False, "no parallel bursts detected"


def has_task_orchestration(sd):
    """TaskCreate/TaskUpdate/CronCreate tools used."""
    tools = safe_dict(sd.get("tools"))
    orch_tools = ["TaskCreate", "TaskUpdate", "CronCreate"]
    found = [t for t in orch_tools if t in tools]
    if found:
        counts = {t: tools[t] for t in found}
        return True, f"uses {', '.join(f'{t}({c})' for t,c in counts.items())}"
    return False, "no task/cron tools"


def has_git_outcome(sd):
    """Check bash commands for git commit/push."""
    cmds = safe_list(sd.get("bash_commands_sample"))
    git_actions = []
    for c in cmds:
        if "git commit" in c:
            git_actions.append("commit")
        if "git push" in c:
            git_actions.append("push")
        if "git merge" in c:
            git_actions.append("merge")
    if git_actions:
        return True, f"git {', '.join(set(git_actions))}"
    return False, "no git commit/push in sample"


def has_handover_context(sd):
    """First prompt is structured handover doc or large context paste (>2000 chars)."""
    frp = safe_dict(sd.get("first_real_prompt"))
    length = frp.get("full_length", 0) or 0
    text = frp.get("text", "") or ""
    if length > 2000:
        return True, f"first prompt {length} chars"
    # Check for structured markers
    if any(marker in text.lower() for marker in ["## ", "### ", "context:", "handover", "background:"]):
        if length > 500:
            return True, f"structured prompt {length} chars"
    return False, f"first prompt {length} chars, not handover"


def classify_delegation_style(sd, ee):
    """conversational / directive / orchestrated / autonomous"""
    tools = safe_dict(sd.get("tools"))
    shape = safe_dict(sd.get("shape"))
    prompts = shape.get("user_prompt_count", 0) or 0
    tool_count = shape.get("tool_use_count", 0) or 0
    agent_count = tools.get("Agent", 0)
    task_create = tools.get("TaskCreate", 0)

    if agent_count > 5 and task_create > 0:
        return "orchestrated", "high", "agent+task orchestration"
    if agent_count > 10:
        return "orchestrated", "high", f"{agent_count} agent dispatches"

    if prompts == 0:
        return "autonomous", "medium", "no user prompts"

    ratio = tool_count / max(prompts, 1)
    if ratio > 20:
        return "autonomous", "high", f"tool/prompt ratio {ratio:.0f}"
    if ratio > 8:
        return "directive", "high", f"tool/prompt ratio {ratio:.0f}"
    if ratio < 2:
        return "conversational", "high", f"tool/prompt ratio {ratio:.1f}"
    return "directive", "medium", f"tool/prompt ratio {ratio:.1f}"


def classify_session_continuity(sd, ee):
    """fresh / compaction / handover_paste / recall / skill_launcher"""
    det = safe_dict(sd.get("detections"))
    comp = safe_dict(det.get("compaction_resume"))
    frp = safe_dict(sd.get("first_real_prompt"))
    text = frp.get("text", "") or ""
    length = frp.get("full_length", 0) or 0

    if comp.get("detected"):
        return "compaction", "high", f"{comp.get('count', 0)} compactions"

    if text.startswith("/") and len(text) < 50:
        return "skill_launcher", "high", f"starts with {text[:30]}"

    if length > 2000:
        return "handover_paste", "high", f"first prompt {length} chars"

    # Check for recall signals
    recall_words = ["did we", "last time", "continue", "resume", "pick up", "where we left"]
    if any(w in text.lower() for w in recall_words):
        return "recall", "medium", "recall language in first prompt"

    return "fresh", "medium", "no continuity signals"


def classify_output_type(sd, ee):
    """code_changes / new_artifacts / knowledge_synthesis / conversation_only / mixed"""
    fp = safe_dict(sd.get("file_paths"))
    writes = safe_list(fp.get("write"))
    edits = safe_list(fp.get("edit"))
    tools = safe_dict(sd.get("tools"))

    write_count = len(writes) + len(edits)

    # Tool counts as fallback when file_paths are empty
    write_tool_count = tools.get("Write", 0)
    edit_tool_count = tools.get("Edit", 0)
    total_write_tools = write_tool_count + edit_tool_count

    if write_count == 0 and total_write_tools == 0:
        if tools.get("Bash", 0) > 0:
            return "conversation_only", "medium", "no file writes, some bash"
        return "conversation_only", "high", "no file writes"

    # If we have file paths, use them for detailed classification
    all_writes = writes + edits
    if all_writes:
        code_exts = {".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go", ".rs", ".css", ".html", ".svelte", ".vue"}
        doc_exts = {".md", ".txt", ".json", ".yaml", ".yml", ".toml"}
        code_files = sum(1 for f in all_writes if any(f.endswith(e) for e in code_exts))
        doc_files = sum(1 for f in all_writes if any(f.endswith(e) for e in doc_exts))

        if code_files > 0 and doc_files > 0:
            return "mixed", "high", f"{code_files} code + {doc_files} doc files"
        if code_files > 0:
            return "code_changes", "high", f"{code_files} code files modified"
        if doc_files > 0:
            brain_writes = sum(1 for f in all_writes if "/brains/" in f)
            if brain_writes > 0:
                return "knowledge_synthesis", "high", f"{brain_writes} brain file writes"
            analysis_writes = sum(1 for f in all_writes if any(k in f for k in ["findings", "analysis", "learnings", "index-"]))
            if analysis_writes > 0:
                return "new_artifacts", "high", f"{analysis_writes} analysis artifacts"
            return "new_artifacts", "medium", f"{doc_files} doc files created"
        return "mixed", "low", "unclear output mix"

    # Fallback: file_paths empty but tool counts exist — infer from existing classifiers
    session_type = safe_dict(ee.get("classifiers")).get("session_type", {}).get("value", "")
    if session_type in ("BUILD", "build"):
        if edit_tool_count > write_tool_count:
            return "code_changes", "medium", f"Edit({edit_tool_count})+Write({write_tool_count}) tools, paths unavailable"
        return "mixed", "medium", f"Write({write_tool_count})+Edit({edit_tool_count}) tools, paths unavailable"
    if session_type in ("KNOWLEDGE", "knowledge"):
        return "knowledge_synthesis", "medium", f"Write({write_tool_count})+Edit({edit_tool_count}) tools, knowledge session"
    if session_type in ("RESEARCH", "research"):
        if total_write_tools <= 3:
            return "conversation_only", "medium", f"minimal writes ({total_write_tools}), research session"
        return "knowledge_synthesis", "medium", f"Write({write_tool_count})+Edit({edit_tool_count}), research output"
    if session_type in ("OPERATIONS", "operations", "SYSOPS", "sysops"):
        return "code_changes", "medium", f"Write({write_tool_count})+Edit({edit_tool_count}), ops session"
    # Generic fallback
    if total_write_tools > 5:
        return "mixed", "low", f"Write({write_tool_count})+Edit({edit_tool_count}), type unclear"
    if total_write_tools > 0:
        return "code_changes", "low", f"Write({write_tool_count})+Edit({edit_tool_count}), minimal"
    return "conversation_only", "medium", "no file modifications detected"


def classify_initiation_source(sd, ee):
    """user_typed / skill_invoked / voice_dictated / agent_dispatched / handover_paste"""
    frp = safe_dict(sd.get("first_real_prompt"))
    text = frp.get("text", "") or ""
    length = frp.get("full_length", 0) or 0

    if text.startswith("/"):
        return "skill_invoked", "high", f"starts with {text[:30]}"

    if length > 2000:
        return "handover_paste", "high", f"first prompt {length} chars"

    # Voice dictation heuristics: short, informal, missing punctuation, typos
    if length < 200 and length > 5:
        lower = text.lower()
        voice_signals = sum([
            not any(c in text for c in ".,;:!?"),  # no punctuation
            "?" not in text and lower.startswith(("can you", "did we", "how do", "what", "where", "show me")),
            text[0].islower() if text else False,  # starts lowercase
        ])
        if voice_signals >= 2 and length < 100:
            return "voice_dictated", "low", "informal short prompt, no punctuation"

    return "user_typed", "medium", "standard typed prompt"


def compute_autonomy_profile(sd, ee):
    """Brief note on human-agent dynamic."""
    shape = safe_dict(sd.get("shape"))
    tools = safe_dict(sd.get("tools"))
    prompts = shape.get("user_prompt_count", 0) or 0
    tool_count = shape.get("tool_use_count", 0) or 0
    agents = tools.get("Agent", 0)
    duration = shape.get("duration_minutes", 0) or 0

    if prompts == 0:
        return "fully autonomous — no human interaction"

    ratio = tool_count / max(prompts, 1)

    if agents > 10:
        return f"orchestrator pattern — {agents} subagents, {prompts} human turns"
    if ratio > 15:
        return f"high autonomy — {ratio:.0f}:1 tool/prompt ratio over {duration}min"
    if ratio > 5:
        return f"moderate autonomy — human guides, agent executes ({ratio:.0f}:1)"
    if ratio < 2:
        return f"conversational — tight human-agent loop ({prompts} turns, {tool_count} tools)"
    return f"balanced — {prompts} prompts, {tool_count} tools in {duration}min"


def compute_machine_character(sd, machine):
    """Machine-specific patterns."""
    if machine == "m4-pro":
        tools = safe_dict(sd.get("tools"))
        if tools.get("Agent", 0) > 20:
            return "m4-pro heavy orchestration"
        return None
    return None


def fill_missing_subtype(ee, sd):
    """Fill MISSING subtypes with best guess from shape_data."""
    cl = safe_dict(ee.get("classifiers"))
    st = cl.get("session_subtype", cl.get("session_type", {}))
    val = st.get("value", "")

    if val in ("MISSING", "?", ""):
        # Try to infer from shape
        tools = safe_dict(sd.get("tools"))
        shape = safe_dict(sd.get("shape"))
        prompts = shape.get("user_prompt_count", 0) or 0
        tool_count = shape.get("tool_use_count", 0) or 0
        fp = safe_dict(sd.get("file_paths"))
        writes = safe_list(fp.get("write"))

        if tool_count == 0 and prompts <= 1:
            return "meta.accidental", "medium"
        if any("/brains/" in w for w in writes):
            return "knowledge.brain_update", "low"
        if tools.get("Edit", 0) > 5 or tools.get("Write", 0) > 5:
            return "build.iterative", "low"
        return "unknown", "low"
    return None, None


def discover_new_patterns(sd, ee):
    """Look for patterns not captured by existing predicates/classifiers."""
    discoveries = []
    tools = safe_dict(sd.get("tools"))
    shape = safe_dict(sd.get("shape"))
    det = safe_dict(sd.get("detections"))
    cmds = safe_list(sd.get("bash_commands_sample"))
    fp = safe_dict(sd.get("file_paths"))
    writes = safe_list(fp.get("write"))

    # Pattern: memory writes (auto-memory)
    memory_writes = [w for w in writes if "/memory/" in w or "MEMORY.md" in w]
    if memory_writes:
        discoveries.append(("memory_write", f"{len(memory_writes)} auto-memory writes"))

    # Also check existing entry notes for memory references
    notes = ee.get("notes", "")
    if not memory_writes and "memory" in notes.lower() and "auto-memory" in notes.lower():
        discoveries.append(("memory_write", "mentioned in notes"))

    # Pattern: STEERING.md interaction
    reads = safe_list(fp.get("read"))
    steering = any("STEERING.md" in r for r in reads) or any("STEERING.md" in w for w in writes)
    if not steering:
        # Check bash commands for STEERING references
        for c in cmds:
            if "STEERING" in c:
                steering = True
                break
    if steering:
        discoveries.append(("steering_interaction", "reads/writes STEERING.md"))

    # Pattern: ralphy mode
    ralphy = safe_dict(det.get("ralphy_mode"))
    if ralphy.get("detected") or ralphy.get("has_ralphy_skill"):
        discoveries.append(("ralphy_campaign", "ralphy skill/mode detected"))

    # Pattern: form filling
    if safe_dict(det.get("form_filling")).get("detected"):
        discoveries.append(("form_filling", "structured form completion detected"))

    # Pattern: npm/package operations
    npm_ops = [c for c in cmds if "npm " in c or "bun " in c or "pnpm " in c]
    if npm_ops:
        discoveries.append(("package_manager_ops", f"{len(npm_ops)} package manager commands"))

    # Pattern: test execution
    test_cmds = [c for c in cmds if "test" in c.lower() or "vitest" in c.lower() or "jest" in c.lower()]
    if test_cmds:
        discoveries.append(("test_execution", f"{len(test_cmds)} test-related commands"))

    # Pattern: gh CLI usage
    gh_cmds = [c for c in cmds if c.strip().startswith("gh ")]
    if gh_cmds:
        discoveries.append(("github_cli", f"{len(gh_cmds)} gh commands"))

    return discoveries


def process_session(entry):
    sd = entry["shape_data"]
    ee = dict(entry["existing_entry"])  # copy
    cwd = sd.get("cwd", "")
    machine = entry.get("machine", "")

    # === NEW PREDICATES ===
    p17_result, p17_just = has_handover_context(sd)
    p18_result, p18_just = has_cross_project_reads(sd, cwd)
    p19_result, p19_just = has_web_research(sd)
    p20_result, p20_just = has_parallel_subagent_bursts(sd)
    p21_result, p21_just = has_task_orchestration(sd)
    p22_result, p22_just = has_git_outcome(sd)

    preds = safe_dict(ee.get("predicates"))
    preds["P17_has_handover_context"] = {"result": p17_result, "justification": p17_just}
    preds["P18_has_cross_project_reads"] = {"result": p18_result, "justification": p18_just}
    preds["P19_has_web_research"] = {"result": p19_result, "justification": p19_just}
    preds["P20_has_parallel_subagent_bursts"] = {"result": p20_result, "justification": p20_just}
    preds["P21_has_task_orchestration"] = {"result": p21_result, "justification": p21_just}
    preds["P22_has_git_outcome"] = {"result": p22_result, "justification": p22_just}
    ee["predicates"] = preds

    # === NEW CLASSIFIERS ===
    c08_val, c08_conf, c08_reason = classify_delegation_style(sd, ee)
    c09_val, c09_conf, c09_reason = classify_session_continuity(sd, ee)
    c10_val, c10_conf, c10_reason = classify_output_type(sd, ee)
    c11_val, c11_conf, c11_reason = classify_initiation_source(sd, ee)

    classifiers = safe_dict(ee.get("classifiers"))
    classifiers["C08_delegation_style"] = {"value": c08_val, "confidence": c08_conf, "reasoning": c08_reason}
    classifiers["C09_session_continuity"] = {"value": c09_val, "confidence": c09_conf, "reasoning": c09_reason}
    classifiers["C10_output_type"] = {"value": c10_val, "confidence": c10_conf, "reasoning": c10_reason}
    classifiers["C11_initiation_source"] = {"value": c11_val, "confidence": c11_conf, "reasoning": c11_reason}
    ee["classifiers"] = classifiers

    # === NEW OBSERVATIONS ===
    obs = safe_dict(ee.get("observations"))
    obs["O06_autonomy_profile"] = compute_autonomy_profile(sd, ee)
    machine_char = compute_machine_character(sd, machine)
    obs["O07_machine_character"] = machine_char
    ee["observations"] = obs

    # === FILL MISSING SUBTYPES ===
    new_subtype, new_conf = fill_missing_subtype(ee, sd)
    if new_subtype:
        classifiers = ee["classifiers"]
        if "session_subtype" in classifiers:
            classifiers["session_subtype"]["value"] = new_subtype
            classifiers["session_subtype"]["confidence"] = new_conf
            classifiers["session_subtype"]["reasoning"] = "backward pass inference"

    # === DISCOVER NEW PATTERNS ===
    discoveries = discover_new_patterns(sd, ee)
    if discoveries:
        ee["backward_pass_discoveries"] = discoveries

    # Add backward pass metadata
    ee["backward_pass"] = {
        "batch": "bp-batch-02",
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "version": 1
    }

    return ee


def generate_findings(results, data):
    """Generate findings markdown."""
    lines = []
    lines.append("# Backward Pass Findings — Batch 02")
    lines.append("")
    lines.append(f"**Sessions processed**: {len(results)}")
    lines.append(f"**Processed at**: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    lines.append("")

    # Predicate distributions
    lines.append("## Predicate Distributions")
    lines.append("")
    pred_names = ["P17_has_handover_context", "P18_has_cross_project_reads", "P19_has_web_research",
                  "P20_has_parallel_subagent_bursts", "P21_has_task_orchestration", "P22_has_git_outcome"]
    for pname in pred_names:
        counts = Counter()
        for r in results:
            p = r.get("predicates", {}).get(pname, {})
            counts[p.get("result")] += 1
        lines.append(f"**{pname}**: true={counts.get(True,0)}, false={counts.get(False,0)}, null={counts.get(None,0)}")
    lines.append("")

    # Classifier distributions
    lines.append("## Classifier Distributions")
    lines.append("")

    cls_names = ["C08_delegation_style", "C09_session_continuity", "C10_output_type", "C11_initiation_source"]
    for cname in cls_names:
        counts = Counter()
        for r in results:
            c = r.get("classifiers", {}).get(cname, {})
            counts[c.get("value", "?")] += 1
        lines.append(f"### {cname}")
        for val, cnt in counts.most_common():
            pct = cnt / len(results) * 100
            lines.append(f"- {val}: {cnt} ({pct:.0f}%)")
        lines.append("")

    # Discovery patterns
    lines.append("## Discovered Patterns")
    lines.append("")
    disc_counts = Counter()
    for r in results:
        for d in r.get("backward_pass_discoveries", []):
            disc_counts[d[0]] += 1
    for pattern, cnt in disc_counts.most_common():
        pct = cnt / len(results) * 100
        lines.append(f"- **{pattern}**: {cnt} sessions ({pct:.0f}%)")
    lines.append("")

    # Machine breakdown
    lines.append("## Machine Breakdown")
    lines.append("")
    machine_counts = Counter()
    for entry in data:
        machine_counts[entry["machine"]] += 1
    for m, c in machine_counts.most_common():
        lines.append(f"- {m}: {c} sessions")
    lines.append("")

    # Autonomy profile samples
    lines.append("## Autonomy Profile Samples")
    lines.append("")
    for r in results[:10]:
        ap = r.get("observations", {}).get("O06_autonomy_profile", "?")
        sid = r.get("session_id", "?")[:12]
        proj = r.get("project", "?")
        lines.append(f"- `{sid}` ({proj}): {ap}")
    lines.append("")

    # Notable handover sessions
    lines.append("## Handover Context Sessions (P17=true)")
    lines.append("")
    for r in results:
        p17 = r.get("predicates", {}).get("P17_has_handover_context", {})
        if p17.get("result"):
            sid = r.get("session_id", "?")[:12]
            proj = r.get("project", "?")
            lines.append(f"- `{sid}` ({proj}): {p17.get('justification', '')}")
    lines.append("")

    # Orchestrated sessions
    lines.append("## Orchestrated Sessions (C08=orchestrated)")
    lines.append("")
    for r in results:
        c08 = r.get("classifiers", {}).get("C08_delegation_style", {})
        if c08.get("value") == "orchestrated":
            sid = r.get("session_id", "?")[:12]
            proj = r.get("project", "?")
            lines.append(f"- `{sid}` ({proj}): {c08.get('reasoning', '')}")
    lines.append("")

    # New pattern candidates
    lines.append("## New Predicate/Classifier Candidates")
    lines.append("")
    lines.append("Based on discovered patterns across this batch:")
    lines.append("")
    if disc_counts.get("steering_interaction", 0) > 5:
        lines.append("- **P_has_steering_interaction**: session reads/writes STEERING.md (coordination pattern)")
    if disc_counts.get("memory_write", 0) > 3:
        lines.append("- **P_has_memory_write**: session writes auto-memory files (learning signal)")
    if disc_counts.get("test_execution", 0) > 5:
        lines.append("- **P_has_test_execution**: session runs test commands")
    if disc_counts.get("package_manager_ops", 0) > 5:
        lines.append("- **P_has_package_ops**: npm/bun/pnpm operations (setup/dependency work)")
    if disc_counts.get("github_cli", 0) > 3:
        lines.append("- **P_has_github_ops**: gh CLI usage (PR/issue/secret management)")
    if disc_counts.get("ralphy_campaign", 0) > 1:
        lines.append("- **C_campaign_mode**: ralphy-driven batch analysis pattern")
    lines.append("")

    return "\n".join(lines)


def main():
    with open(INPUT) as f:
        data = json.load(f)

    results = []
    for entry in data:
        if "shape_data" not in entry:
            # No shape data — carry forward existing entry with minimal backward pass metadata
            ee = dict(entry["existing_entry"])
            ee["backward_pass"] = {
                "batch": "bp-batch-02",
                "processed_at": datetime.now(timezone.utc).isoformat(),
                "version": 1,
                "skipped": "no shape_data available"
            }
            results.append(ee)
            continue
        result = process_session(entry)
        results.append(result)

    # Write JSONL
    with open(OUT_JSONL, "w") as f:
        for r in results:
            f.write(json.dumps(r, default=str) + "\n")

    # Write findings
    findings = generate_findings(results, data)
    with open(OUT_MD, "w") as f:
        f.write(findings)

    print(f"Processed {len(results)} sessions")
    print(f"JSONL: {OUT_JSONL}")
    print(f"Findings: {OUT_MD}")


if __name__ == "__main__":
    main()
