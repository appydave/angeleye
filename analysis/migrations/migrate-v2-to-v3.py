#!/usr/bin/env python3
"""
Migrate session-index.jsonl from v2 (mixed formats) to v3 (unified schema).

v3 schema changes:
  - All predicates (P01-P25) at top level in `predicates` dict
  - All classifiers (C01-C13) at top level in `classifiers` dict
  - All observations (O01-O08) at top level in `observations` dict
  - `backward_pass` becomes metadata-only: {batch, analysed_at} or null
  - `final_pass` block removed — its contents merged into predicates/classifiers/observations
  - `forward_pass` added: {waves, analysis} or null (for entries never forward-analysed)
  - `schema_version` set to 3 on all entries
  - Predicate format normalized to {result: bool|null, justification: str}
  - Classifier format normalized to {value: str, confidence: str}

Input:  session-index.jsonl (924 entries, mixed v1/v2/unversioned)
Output: session-index.jsonl (924 entries, all v3)
Backup: session-index-v2.jsonl.bak
"""

import json
import shutil
from pathlib import Path

ANALYSIS_DIR = Path(__file__).resolve().parent.parent
INDEX_FILE = ANALYSIS_DIR / "session-index.jsonl"
BACKUP_FILE = ANALYSIS_DIR / "session-index-v2.jsonl.bak"


def normalize_predicate(key, value):
    """Normalize a predicate to {result: bool|null, justification: str}."""
    if isinstance(value, dict):
        # Already structured — normalize field names
        result = value.get("result", value.get("value"))
        justification = value.get("justification", value.get("reasoning", ""))
        return {"result": result, "justification": justification}
    elif isinstance(value, bool) or value is None:
        # Bare bool from final_pass (P23-P25)
        return {"result": value, "justification": ""}
    else:
        return {"result": None, "justification": str(value)}


def normalize_classifier(key, value):
    """Normalize a classifier to {value: str, confidence: str}."""
    if isinstance(value, dict):
        return {
            "value": value.get("value", ""),
            "confidence": value.get("confidence", "medium"),
        }
    elif isinstance(value, str):
        # Bare string from final_pass (C12, C13)
        return {"value": value, "confidence": "medium"}
    else:
        return {"value": str(value), "confidence": "medium"}


def normalize_observation(key, value):
    """Normalize an observation to a string."""
    if isinstance(value, str):
        return value
    elif isinstance(value, dict):
        return value.get("value", str(value))
    return str(value)


def migrate_entry(entry):
    """Migrate a single entry to v3 schema."""
    v3 = {}

    # Core identity (always present)
    v3["schema_version"] = 3
    v3["session_id"] = entry["session_id"]
    v3["machine"] = entry.get("machine", "unknown")
    v3["project"] = entry.get("project", "unknown")
    if "project_dir" in entry:
        v3["project_dir"] = entry["project_dir"]

    # --- Forward pass data ---
    had_forward_pass = entry.get("schema_version") in (1, 2) and "shape" in entry

    if had_forward_pass:
        # Preserve forward-analysis metadata
        v3["forward_pass"] = {}
        if "analysis" in entry:
            v3["forward_pass"]["analysis"] = entry["analysis"]
        if "shape" in entry:
            v3["shape"] = entry["shape"]
        if "tools" in entry:
            v3["tools"] = entry["tools"]
        if "notes" in entry:
            v3["notes"] = entry["notes"]
        if "interest_level" in entry:
            v3["interest_level"] = entry["interest_level"]
        if "disposition" in entry:
            v3["disposition"] = entry["disposition"]
        if "registry_type" in entry:
            v3["registry_type"] = entry["registry_type"]
        if "proposed_subtypes" in entry:
            v3["proposed_subtypes"] = entry["proposed_subtypes"]
        if "skills_invoked" in entry:
            v3["skills_invoked"] = entry["skills_invoked"]
        if "derived" in entry:
            v3["derived"] = entry["derived"]
        if "backward_pass_discoveries" in entry:
            v3["backward_pass_discoveries"] = entry["backward_pass_discoveries"]
        if "subtype_correction" in entry:
            v3["subtype_correction"] = entry["subtype_correction"]
    else:
        v3["forward_pass"] = None

    # --- Build unified predicates ---
    predicates = {}

    # 1. Forward-pass predicates (P01-P16) from top-level predicates dict
    if had_forward_pass and "predicates" in entry:
        for k, v in entry["predicates"].items():
            predicates[k] = normalize_predicate(k, v)

    # 2. Backward-pass predicates (P17-P22)
    bp = entry.get("backward_pass")
    bp_meta = None

    if isinstance(bp, dict):
        if "predicates" in bp:
            # BP-only entries: predicates nested inside backward_pass
            for k, v in bp["predicates"].items():
                predicates[k] = normalize_predicate(k, v)
            bp_meta = {
                "batch": bp.get("batch"),
                "analysed_at": bp.get("analysed_at"),
            }
        elif "batch" in bp:
            # Full v2 entries: P17-P22 already at top level, bp is just metadata
            bp_meta = {
                "batch": bp.get("batch"),
                "analysed_at": bp.get("analysed_at"),
            }
            # P17-P22 should already be in top-level predicates (handled above)
    elif isinstance(bp, str):
        # String-only entries: just a batch name, no predicate data
        bp_meta = {"batch": bp, "analysed_at": None}

    # Also grab P17-P22 from top-level predicates if present (v2 entries with bp batch-ref)
    if had_forward_pass and "predicates" in entry:
        for k, v in entry["predicates"].items():
            if k.startswith("P1") and int(k[1:3]) >= 17:
                predicates[k] = normalize_predicate(k, v)

    # 3. Final-pass predicates (P23-P25)
    fp = entry.get("final_pass", {})
    if fp:
        for k, v in fp.items():
            if k.startswith("P"):
                predicates[k] = normalize_predicate(k, v)

    v3["predicates"] = predicates

    # --- Build unified classifiers ---
    classifiers = {}

    # Forward-pass classifiers (C01-C07)
    if had_forward_pass and "classifiers" in entry:
        for k, v in entry["classifiers"].items():
            classifiers[k] = normalize_classifier(k, v)

    # Backward-pass classifiers (C08-C11)
    if isinstance(bp, dict) and "classifiers" in bp:
        for k, v in bp["classifiers"].items():
            classifiers[k] = normalize_classifier(k, v)
    elif had_forward_pass and "classifiers" in entry:
        # C08-C11 may already be at top level
        for k, v in entry["classifiers"].items():
            if k.startswith("C") and int(k[1:3]) >= 8:
                classifiers[k] = normalize_classifier(k, v)

    # Final-pass classifiers (C12-C13)
    if fp:
        for k, v in fp.items():
            if k.startswith("C"):
                classifiers[k] = normalize_classifier(k, v)

    v3["classifiers"] = classifiers

    # --- Build unified observations ---
    observations = {}

    # Forward-pass observations (O01-O05)
    if had_forward_pass and "observations" in entry:
        for k, v in entry["observations"].items():
            observations[k] = normalize_observation(k, v)

    # Backward-pass observations (O06-O07)
    if isinstance(bp, dict) and "observations" in bp:
        for k, v in bp["observations"].items():
            observations[k] = normalize_observation(k, v)
    elif had_forward_pass and "observations" in entry:
        for k, v in entry["observations"].items():
            if k.startswith("O") and int(k[1:3]) >= 6:
                observations[k] = normalize_observation(k, v)

    # Final-pass observations (O08)
    if fp:
        for k, v in fp.items():
            if k.startswith("O"):
                observations[k] = normalize_observation(k, v)

    v3["observations"] = observations

    # --- Backward pass metadata ---
    v3["backward_pass"] = bp_meta

    return v3


def main():
    # Read all entries
    entries = []
    with open(INDEX_FILE) as f:
        for line in f:
            line = line.strip()
            if line:
                entries.append(json.loads(line))

    print(f"Read {len(entries)} entries from {INDEX_FILE}")

    # Backup
    shutil.copy2(INDEX_FILE, BACKUP_FILE)
    print(f"Backup saved to {BACKUP_FILE}")

    # Migrate
    migrated = []
    for entry in entries:
        migrated.append(migrate_entry(entry))

    # Validate
    v3_count = sum(1 for e in migrated if e["schema_version"] == 3)
    has_fp_null = sum(1 for e in migrated if e["forward_pass"] is None)
    has_fp_data = sum(1 for e in migrated if e["forward_pass"] is not None)

    pred_counts = {}
    for e in migrated:
        for k in e["predicates"]:
            pred_counts[k] = pred_counts.get(k, 0) + 1

    clf_counts = {}
    for e in migrated:
        for k in e["classifiers"]:
            clf_counts[k] = clf_counts.get(k, 0) + 1

    obs_counts = {}
    for e in migrated:
        for k in e["observations"]:
            obs_counts[k] = obs_counts.get(k, 0) + 1

    print(f"\n=== Migration Summary ===")
    print(f"Total entries: {len(migrated)}")
    print(f"All schema_version=3: {v3_count == len(migrated)}")
    print(f"Forward-analysed: {has_fp_data}")
    print(f"Backward-pass-only (forward_pass=null): {has_fp_null}")

    print(f"\nPredicate coverage:")
    for k in sorted(pred_counts.keys()):
        print(f"  {k}: {pred_counts[k]}/{len(migrated)}")

    print(f"\nClassifier coverage:")
    for k in sorted(clf_counts.keys()):
        print(f"  {clf_counts[k]}/{len(migrated)} — {k}")

    print(f"\nObservation coverage:")
    for k in sorted(obs_counts.keys()):
        print(f"  {obs_counts[k]}/{len(migrated)} — {k}")

    # Write
    with open(INDEX_FILE, "w") as f:
        for entry in migrated:
            f.write(json.dumps(entry, separators=(",", ":")) + "\n")

    print(f"\nWrote {len(migrated)} v3 entries to {INDEX_FILE}")


if __name__ == "__main__":
    main()
