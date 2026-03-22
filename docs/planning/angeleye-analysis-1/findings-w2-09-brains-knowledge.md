# Findings: W2-09 — brains (904f0069)

## Classification

- **Registry**: KNOWLEDGE / read-heavy
- **Analysed type**: not_knowledge — reclassify to **build.surgical**
- **Confidence**: high
- **Reasoning**: Despite running in the `brains` project directory, this session performs zero knowledge work. It invokes the `/rename-images` skill to batch-rename 14 downloaded PNG files from `~/Downloads/`. No brain files are read, written, or edited. No documentation is created. The session's output is renamed image files on the filesystem — a file utility operation, not a knowledge artifact. The tool pattern is read-heavy because the skill visually inspects each image via the Read tool (14 image reads), but the reads serve image classification, not knowledge consumption. The `build.surgical` subtype fits best: Edit-equivalent output (filesystem renames via Bash `mv`), few tools beyond Read, no agents. An argument could be made for `ops.repo_maintenance` but the files are personal downloads, not repo assets.

## Reclassification

- **From**: KNOWLEDGE / read-heavy
- **To**: BUILD / read-heavy (build.surgical)
- **Why**: The `project_dir = brains` triggered the KNOWLEDGE classification, but no brain-related work occurred. This is a false positive from the composite classifier rule `IF Bash dominant AND project_dir contains brains → KNOWLEDGE_WORK`. The session happens to be launched from the brains directory but operates entirely on `~/Downloads/`. The classifier needs a guard: if no files in `project_dir` are read or written, `project_dir` should not be used as a classification signal.

## Session Shape

- Events: 32 (from angeleye JSONL) / 112 entries (raw JSONL including tool results, progress, system)
- Tools used: Read (28), Bash (4), ToolSearch (2)
- Duration: ~6 min active time (00:09-00:14 UTC, 2026-03-08)
- Opening style: skill invocation (`/rename-images`)
- Skills invoked: rename-images (explicit, first prompt)

## Observations

1. **"yes and yes" is a response, not a first prompt**: The skill's first action is to ask two setup questions (sequential prefixes? which folder?). David's "yes and yes" answers both. The angeleye hook captured this as `first_real_prompt` because the skill invocation (`/rename-images`) was a command message, not a user prompt. This is a known pattern — skill invocations that ask setup questions make the actual first human utterance look like a fragment.
2. **Image inspection via Read tool**: The session reads 14 PNG images visually using Claude's multimodal capability. This is why the tool pattern is "read-heavy" — 28 of 34 tool uses are Read calls. The first batch (7 reads) fails due to incorrect filename escaping (parentheses), prompting a second batch with correct filenames.
3. **Ecamm Live presentation slides**: All 14 images are slides from a presentation about reverse-engineering Ecamm Live's hidden API. The session identifies this narrative arc and names files accordingly (title slide through conclusion).
4. **User correction — "reverse order"**: David's second prompt asks for reverse order. The skill had defaulted to newest-first (ls -lt order), but David wanted story order (oldest-first). This is a minor steering correction, not frustration.
5. **Single mv command**: All 14 renames execute in a single chained Bash command. Clean, no errors, no retries.
6. **Session ends with /exit**: Explicit closure via command, not abandonment.

## Patterns Found

- **Skill-as-session**: The entire session is one skill invocation with minimal user steering (3 real prompts: "yes and yes", "reverse order", "approve"). The skill drives the workflow; the user just confirms. This pattern produces sessions where the skill name IS the session purpose.
- **Multimodal Read for classification**: Using Claude's image understanding to generate descriptive filenames. The Read tool doubles as a visual inspection tool, not just a text reader. This makes Read-heavy sessions ambiguous — the same tool pattern means "reading code" in one session and "inspecting images" in another.
- **False positive from project_dir**: Launching a utility skill from an unrelated project directory produces a misleading `project_dir` signal. The classifier trusted `project_dir = brains` but the session never touched the brains directory.

## New Types or Subtypes Proposed

- **build.utility_operation**: Sessions where a utility skill performs a filesystem operation (rename, move, organize) that produces no code or knowledge artifact. Alternatively, this could be `ops.file_management`. The current taxonomy does not have a clean home for "batch rename files in Downloads" — it is not BUILD (no product), not KNOWLEDGE (no documentation), not OPS (no infrastructure). For now, `build.surgical` is the closest fit by analogy (small, targeted, Edit-equivalent).

## Subtype Candidates Confirmed

- None confirmed — this session reveals a gap in the taxonomy for utility/file-management operations.

## Classifier Learning

- **Guard needed**: The composite rule `IF project_dir contains brains → KNOWLEDGE_WORK` needs an additional condition: at least one Read, Edit, or Write must target a file inside `project_dir`. Without this guard, any session launched from the brains terminal will be misclassified as KNOWLEDGE regardless of actual work.
- **Skill name as strong signal**: When a session's first event is a skill invocation, the skill name (`rename-images`) is a stronger classification signal than `project_dir`. A lookup table mapping skill names to likely session types would improve accuracy for skill-driven sessions.

## Interest Level

low — The session itself is straightforward (one skill, three prompts, done). The classification learning (false positive from project_dir) is the primary value. The multimodal Read pattern for image inspection is a minor but noteworthy observation.
