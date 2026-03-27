# Mochaccino Brief — Predicate & Enrichment UI

**Purpose**: Spec for 5 mockup views to be built with `/mochaccino`. These explore how predicates, classifiers, and the enrichment pipeline surface in the AngelEye UI.

**Created**: 2026-03-25

**Audience**: David (developer building AngelEye). Future: users configuring their own predicate sets.

**Design context**: AngelEye uses the AppyStack template (React 19, TailwindCSS v4, dark warm palette from existing Settings/Observer/Organiser views). Mockups should match the existing aesthetic.

---

## Existing App Structure

```
Views currently in the app:
- ObserverView   — live session monitoring
- OrganiserView  — workspace/session management
- MockupsView    — design exploration
- SettingsView   — sync, configuration (screenshot the user shared)
```

The predicate/enrichment UI lives in the **system/settings area** — it's configuration and pipeline management, not day-to-day session browsing.

---

## Mockup 1: Predicate Registry

**What it shows**: All 25 predicates listed with their tier (deterministic / partial / LLM), detection status, and coverage.

**Key elements**:

- Table or card grid: one row per predicate
- Columns: ID, Name, Tier badge (green=deterministic, amber=partial, purple=LLM), Status (implemented/pending), Coverage (e.g., "894/894" or "0/894")
- Tier filter tabs at top: All | Deterministic | Partial | LLM
- Visual indication of which predicates are live in the sync pipeline vs only in the analysis campaign data
- Same layout repeated below for Classifiers (C01-C13) and Observations (O02-O08)

**Purpose**: Answer "what can AngelEye detect today?" and "what's the gap?"

**Notes for Mochaccino**: This is a developer-facing configuration view. Dense information is fine. Think VS Code settings panel, not consumer dashboard.

---

## Mockup 2: Session Enrichment Detail

**What it shows**: A single session's full predicate/classifier/observation profile.

**Key elements**:

- Session header: ID, project, type, scale, started_at
- Three sections: Predicates, Classifiers, Observations
- Each predicate shown as: name + result (true/false/null) + justification text + tier badge
- Each classifier shown as: name + value + confidence (high/medium/low) + tier badge
- Each observation shown as: name + free-text content
- Visual coding: green checkmark (true), red X (false), grey dash (null/not yet evaluated)
- "Enrich" button per section or per predicate — triggers LLM evaluation for that item

**Purpose**: Answer "what do we know about this specific session?"

**Notes for Mochaccino**: This could be a slide-out panel from the Observer or Organiser view, or a dedicated detail page. Show both a session with full v3 data (from the campaign) and one with only Tier 1+2 data (sync-only) to illustrate the difference.

---

## Mockup 3: Enrichment Pipeline Dashboard

**What it shows**: Pipeline status — how many sessions are at each enrichment level, what's queued, what's running.

**Key elements**:

- Summary cards at top:
  - Total sessions: 894
  - Tier 1+2 complete: N
  - Tier 3 complete (full enrichment): N
  - Unprocessed: N
  - Campaign data available (from session-index.jsonl): 924
- Progress bar showing enrichment coverage
- Breakdown by project (which projects have the most unenriched sessions)
- Breakdown by session type (are BUILD sessions better enriched than RESEARCH?)
- "Run Enrichment" section with options:
  - Tier 1+2 only (deterministic — instant, no cost)
  - Tier 3 via Claude SDK (uses Max subscription)
  - Tier 3 via Codex (uses OpenAI budget)
  - Generate Ralphy batch (outputs wave definition for `/ralphy`)
- Batch size selector (10, 20, 50, 100, all)
- Last enrichment run timestamp and results

**Purpose**: Answer "where are we in the enrichment process?" and "what do I click to make progress?"

**Notes for Mochaccino**: This replaces or extends the current "Session Sync" card on the Settings page. The sync card would remain for basic backfill, but enrichment is a separate (bigger) concept.

---

## Mockup 4: Predicate Heatmap / Grid View

**What it shows**: All sessions × all predicates in a dense grid, showing patterns across the dataset.

**Key elements**:

- Y-axis: sessions (grouped by project or session type)
- X-axis: predicates P01-P25
- Cells: colored by result — green (true), red (false), grey (null/unevaluated)
- Row summary: count of true predicates per session
- Column summary: count of true results per predicate across all sessions
- Click a cell to see the justification
- Filter controls: by project, by session type, by date range, by enrichment tier
- Sortable by any column

**Purpose**: Answer "what patterns exist across sessions?" and "which predicates are most/least common?"

**Notes for Mochaccino**: This is a power-user view. It should handle 894 rows without performance issues (virtualized scrolling). Think Excel conditional formatting or GitHub's contribution graph, but for session analysis.

---

## Mockup 5: Enrichment Configuration

**What it shows**: Settings for how enrichment runs — which predicates are enabled, which engine to use, prompt templates.

**Key elements**:

- Predicate toggle list: enable/disable individual predicates for enrichment runs
- Per-predicate configuration:
  - Tier override (e.g., force a Tier 2 predicate to use LLM for higher accuracy)
  - Custom detection regex (for Tier 2 predicates)
  - LLM prompt template (for Tier 3 predicates) — editable text area showing the prompt that will be sent
- Engine configuration:
  - Claude SDK: model selector (Sonnet/Opus), max tokens, auth token status
  - Codex: API key status, model selector
  - Ralphy: batch size default, output directory
- Schema version indicator: "v3 — 25 predicates, 13 classifiers, 7 observations"
- "Add Custom Predicate" button — for v4 schema expansion
- Import/export schema as JSON

**Purpose**: Answer "how do I tune the enrichment pipeline?" and "how do I add new predicates?"

**Notes for Mochaccino**: This is the most developer-facing view. It's where David would configure a new predicate before running it across all sessions. Think of it as the "schema editor" for the enrichment system.

---

## Design Constraints

- Match existing AngelEye aesthetic (warm dark palette, clean typography)
- All mockups are standalone HTML (Mochaccino pattern)
- Include both light and dark states if the app supports theme switching
- Data should be realistic — use actual predicate names, plausible session counts
- Mobile-responsive is not required (this is a developer tool on desktop)

---

## How to Generate

```
/mochaccino
```

Then provide this brief as context. Generate all 5 mockups. Each should be a self-contained HTML file.

Output location: `/Users/davidcruwys/dev/ad/apps/angeleye/docs/planning/enrichment-pipeline/mockups/`

---

**Related docs**:

- Predicate tiers: `/Users/davidcruwys/dev/ad/apps/angeleye/docs/planning/enrichment-pipeline/predicate-tier-reference.md`
- Data architecture: `/Users/davidcruwys/dev/ad/apps/angeleye/docs/planning/enrichment-pipeline/data-architecture.md`
- Execution paths: `/Users/davidcruwys/dev/ad/apps/angeleye/docs/planning/enrichment-pipeline/execution-paths.md`
