# Data-Driven Extraction Registry

A living index of every place in the AngelEye codebase where rules, taxonomies, or
values are currently **code-embedded** but should one day be **data-driven** — read
from config files (YAML / JSON / CSV) so users can adapt AngelEye to their own
domain without forking the code.

**Why this exists**
AngelEye is currently shaped around David's environment (paths under `~/dev/ad/`,
brain files under `/brains/`, Paperclip agent, OMI ingestion, etc.). For other
users, every one of these would need to be different. Extracting now would be
premature generalisation. Extracting **later** without a registry means hunting
through 1000+ lines of code to find what to externalise. This doc is the registry.

**How to use it**

- When you embed a new rule or list in code, add it here.
- Mark the location in code with a `// DATA: <key>` comment so it's grep-able.
- When the time comes to extract, run `grep -r "// DATA:" .` and you have the
  full punch list.

---

## Extraction points

### 1. Subtype taxonomy

**Where**: `shared/src/angeleye.ts` — the `SessionSubtype` union (~50 string literals).
**Marker**: `// DATA: taxonomy.subtypes`
**Why config**: every domain has different work patterns. A copywriter doesn't have
`build.refactor`. A devops engineer doesn't have `knowledge.loom_capture`.
**Proposed shape** (`config/taxonomy.yaml`):

```yaml
families:
  build:
    description: Code production
    subtypes:
      shipped: Edit-heavy + git outcome
      bug_fix: Fix/bug/broken in prompt
      refactor: Refactor/rename/extract
      # ...
  knowledge:
    description: Brain and documentation work
    subtypes:
      brain_capture: Capturing new findings
      # ...
```

The `SessionSubtype` TypeScript type would become `string` with runtime validation,
or be code-generated from the YAML.

---

### 2. Built-in slash commands (excluded from build.campaign)

**Where**: `server/src/services/classifier.service.ts` — `BUILTIN_COMMANDS` set.
**Marker**: `// DATA: classifier.builtin_commands`
**Why config**: Claude Code's built-in commands change over time (new versions add
new ones). Plus, plugin-prefixed commands like `/appydave:ralphy` are a hardcoded
exception that needs to know what counts as a plugin.
**Proposed shape** (`config/builtin-commands.yaml`):

```yaml
claude_code_builtins:
  - clear
  - compact
  - help
  - skills
  # ...
plugin_prefixes:
  - appydave
  - brand-dave
```

---

### 3. Brain file path detector

**Where**: `server/src/services/classifier.service.ts` — `detectHasBrainFileWrites`.
**Marker**: `// DATA: detectors.brain_paths`
**Why config**: `/brains/` is David's convention. Others might use `/notes/`,
`/knowledge/`, `/zettel/`, or store knowledge in Notion/Obsidian instead of files.
**Proposed shape** (`config/path-patterns.yaml`):

```yaml
brain_writes:
  patterns: ['**/brains/**', '**/knowledge-base/**']
  tools: [Edit, Write, MultiEdit]
```

---

### 4. Paperclip agent detector

**Where**: `server/src/services/classifier.service.ts` — `detectIsPaperclipAgent`.
**Marker**: `// DATA: detectors.custom_agents`
**Why config**: Paperclip is one specific agent in David's stack. The mechanism
(detecting agent-initiated sessions by signature) is generic, the agent name is not.
**Proposed shape** (`config/agents.yaml`):

```yaml
custom_agents:
  - name: paperclip
    detector:
      first_event: tool_use
      tool: Bash
      command_pattern: "paperclip|^/run\\s"
    subtype: operations.poem_execution
```

---

### 5. Test file extension list

**Where**: `server/src/services/classifier.service.ts` — `detectSessionSubtype`,
the test file edit detector.
**Marker**: `// DATA: detectors.test_files`
**Why config**: TypeScript projects use `.test.ts` / `.spec.ts`. Python uses
`test_*.py`. Go uses `_test.go`. Ruby uses `_spec.rb`. Hardcoding TS-only excludes
everyone else.
**Proposed shape** (`config/file-patterns.yaml`):

```yaml
test_files:
  - '*.test.ts'
  - '*.test.tsx'
  - '*.spec.ts'
  - 'test_*.py'
  - '*_test.go'
```

---

### 6. Markdown / advisory file paths

**Where**: `server/src/services/classifier.service.ts` — `knowledge.advisory_refinement`
detector (`.md` files outside `/brains/`).
**Marker**: `// DATA: detectors.advisory_files`
**Why config**: AngelEye assumes advisory content lives in `.md` files outside the
brain directory. Others might use `.mdx`, `.org`, `.txt`, or have a different
convention for what counts as "advisory" vs "knowledge".

---

### 7. Subtype detection rules (the if/else chains)

**Where**: `server/src/services/classifier.service.ts` — `detectSessionSubtype`
function body. The whole decision tree.
**Marker**: `// DATA: classifier.rules`
**Why config**: this is the largest extraction. The rules are essentially a
decision tree mapping signals → subtype. Every rule encodes an assumption about
how work is done.
**Proposed shape** (`config/classifier-rules.yaml`):

```yaml
rules:
  - subtype: build.shipped
    conditions:
      session_type: BUILD
      tool_pattern: edit-heavy
      session_scale: [moderate, heavy, marathon]
      has_git_outcome: true
  - subtype: build.bug_fix
    conditions:
      session_type: BUILD
      first_real_prompt_matches: '\b(fix|bug|broken|error)s?\b'
  # ...
```

This is a real DSL design problem and not trivial. Defer until there's a second
user with concrete different rules.

---

### 8. Confidence value ladder

**Where**: `scripts/migrate-session-tags.ts`, `scripts/demote-stale-llm-tags.ts`,
the `enrich-subtypes` skill.
**Marker**: `// DATA: confidence.ladder`
**Why config**: 0.50 / 0.55 / 0.75 / 0.85 / 0.95 are arbitrary. Some users might
want a coarser scale (just "low / medium / high"), others might want decimals
calibrated to their own quality bar.
**Proposed shape** (`config/confidence.yaml`):

```yaml
levels:
  fallback: 0.50 # rule-based default, no signal
  heuristic_only: 0.55 # rule-based, agreed by tightened heuristic
  weak_llm: 0.65 # LLM with one corroborating signal
  good_llm: 0.75 # LLM with multiple signals
  strong_llm: 0.85 # LLM with clear, unambiguous evidence
  unambiguous: 0.95 # ghost session, accidental, etc.
```

---

### 9. Skill enrichment targets

**Where**: `.claude/skills/enrich-subtypes/SKILL.md` — "Valid targets" list and
the entire taxonomy reference inline in the skill.
**Marker**: `<!-- DATA: skill.enrichment_targets -->`
**Why config**: the skill duplicates the taxonomy from `shared/src/angeleye.ts`.
Two sources of truth = drift. Should read from the same config.

---

### 10. Storage paths

**Where**: hardcoded throughout — `~/.claude/angeleye/registry.json`,
`~/.claude/angeleye/sessions/`, `~/.claude/angeleye/archive/`.
**Marker**: `// DATA: paths.storage`
**Why config**: `~/.claude/` is the Claude Code convention but the angeleye
subdirectory is ours. Multi-machine setups might want shared/synced storage.
Already partially configurable via `DATA_DIR` env var on server side; not on
script side.

---

## Format choice (for whenever we extract)

- **YAML** for human-edited config (rules, taxonomies, paths)
- **JSON** for machine-generated or schema-strict files (registry data is already JSON)
- **CSV** only if there's clear tabular use (probably not)

Schema validation: use Zod. There's already a Zod env validator at
`server/src/config/env.ts`.

---

## When to actually extract

Triggers:

1. A second concrete user appears with different needs
2. The classifier rules need to change frequently and code edits are the bottleneck
3. Someone wants to package AngelEye as an installable product

Until any of those is true, code-embedded is fine. Just keep this doc current.

---

**Last updated**: 2026-05-03
