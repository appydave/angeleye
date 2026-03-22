# Findings: W4-09 — brains / KNOWLEDGE / read-heavy (58f43cdd)

## Classification

- **Registry**: KNOWLEDGE / read-heavy
- **Analysed type**: not_knowledge — reclassify to **brand.speaker_submission**
- **Confidence**: high
- **Reasoning**: Despite `project_dir = brains` and a read-heavy tool pattern, this session does no knowledge work. David is completing a speaker application form for the Digital Stage Summit (March 17–19, 2026). Claude reads brand-dave brain files to gather bio material, then acts as a copywriter — iterating session titles, bio drafts, session descriptions, bullet-point takeaways, and promotional blurbs. The only Edit calls correct factual errors in live session output (wrong BMAD attribution, wrong name usage). No brain files are durably updated. No new knowledge is organised or filed. The output is speaker-submission copy, not a brain artifact. The read-heavy pattern is real but serves brand copywriting, not knowledge curation.

## Reclassification

- **From**: KNOWLEDGE / read-heavy
- **To**: BRAND / read-heavy (brand.speaker_submission)
- **Why**: The `project_dir = brains` is a false positive trigger — the session is launched from the brains directory because Claude needs the brand-dave brain as background context, but the actual work is producing speaker submission copy for an external event. No brain file is the output target. The work is closer to `brand.copywriting` or `brand.speaker_submission` — a new subtype not currently in the taxonomy. The closest existing type is BUILD but even that doesn't fit; this is neither product nor infrastructure. A BRAND top-level type (or CONTENT) with subtype `speaker_submission` is the most accurate home.

## Session Shape

- Events: 48 (angeleye JSONL — all non-progress entries)
- Tools used: Read (12), Glob (3), Bash (2), AskUserQuestion (2), Edit (2)
- Duration: ~50 min (11:52–12:42 UTC, 2026-03-01)
- Active turn count: 27 user prompts
- Opening style: location keyword (`agentic-os`) — orientation prompt to load brain context
- Skills invoked: none

## Observations

1. **Two-phase structure**: Phase 1 (entries 0–20) is context loading — David says "absorb this transcript for now, we're not doing anything yet" and pastes a full Project Theodore video transcript (5,577 chars). Claude reads brand-dave brain files (Read ×12, Glob ×3, Bash ×2) to build up David's background. Phase 2 (entries 21–47) is the submission form — David pastes each form field and Claude drafts answers, with David iterating via short steering prompts.
2. **Speaker form pasted field by field**: David did not share the full form at once. He pasted the form intro (entry 3, 8,270 chars), then each subsequent field as a new prompt: session description, bio, 300-character bio, bullet takeaways, product/service promotion, free resource. This field-by-field pasting is a distinct pattern — the session is a long form-filling assistant, not a planning or coding session.
3. **Two factual corrections via Edit**: Entry 22 catches Claude saying David has "two decades" of experience (1990–2026 = 36 years). Entry 22 also catches "creator of the BMAD Method" — David teaches BMAD, he did not create it. Both corrections triggered Read + Edit pairs to fix the relevant brain file. These are data-quality corrections, not knowledge additions.
4. **Name correction — "Stop calling me David Cruwys. I'm AppyDave."**: Entry 43. The brain files use "David Cruwys" as the formal name, but in the context of this speaker form and community persona, David wants AppyDave. This triggers an Edit (entry 44) to update the preferred name convention in the brain. The only durable brain change in the session is this identity preference, not subject-matter knowledge.
5. **Social links pasted manually**: Entry 6 is six bare URLs (appydave.com, YouTube, LinkedIn, X, Skool) pasted as a prompt. This suggests Claude's initial Read of the brand-dave brain did not surface the accounts-and-platforms file, and David corrected this by pasting the links directly. A missed Glob or Read call is the likely cause.
6. **Iterative bio compression**: Entries 29–35 show David iterating a speaker bio through multiple character-count constraints (300 words → 300 characters → custom phrasing). The session acts as a live copyeditor with constraint satisfaction. Each iteration is a new user prompt, not a tool call — the model is the working memory.
7. **Session outline for the talk itself**: Entries 39–42 describe what David actually wants to present — second brain demo, librarian agent, micro-app vibe-coded live using AppyStack, architecture slides (10–18). This planning content is not filed anywhere; it lives only in the session transcript.

## Brain Subfolder

- **Primary context source**: `brand-dave` — `/Users/davidcruwys/dev/ad/brains/brand-dave/brand-assets/` (social-pitch, accounts-and-platforms, founder-brand-manifesto, dent-origin-vision-mission likely read)
- **Secondary context source**: `agentic-os` — brand context for Project Theodore loaded from the initial transcript paste, not from a brain file read directly
- **Output target**: None — all output is conversational. The speaker submission copy was not filed to any brain file. A `summits/digital-stage-2026/` brain folder does exist (created later, 2026-03-17) but was not created in this session.
- **Durable brain change**: One Edit to a brand-dave brain file correcting the preferred name (AppyDave over David Cruwys) — minor identity preference, not subject-matter knowledge.

## Patterns Found

- **Form-filling assistant pattern**: David pastes each field of an external form as a sequential prompt. Claude acts as a specialist copywriter with brand context. This is a recurring use case (speaker bios, event submissions, profile pages) that produces no internal artifact — the output goes to the external form, not the brain. Sessions of this type are invisible to brain-file diff analysis.
- **Context-loading transcript paste**: Pasting a full video transcript as a "just absorb this" prompt before starting work. The transcript is not filed; it serves as working context for the session. This pattern bypasses the brain (no Read of an existing brain file about the topic) and instead injects raw source material directly.
- **Iterative constraint satisfaction**: Multiple short prompts applying tightening character or word constraints to the same text ("must be fewer than 300 words", "300 characters", "fewer than 80 characters"). Each iteration is a compression turn. The model holds the prior draft in context and trims. No tools are called between iterations.
- **Social link injection via paste**: When Claude fails to surface platform links from the brain, David pastes them as bare URLs. This is a brain-miss recovery pattern — the user fills the gap manually rather than asking Claude to search again.
- **AskUserQuestion for form scope clarification**: Two AskUserQuestion calls (entries 4 and 40) where Claude paused to ask what David wanted before drafting. Entry 4 asked about the speaker bio scope after the form was pasted; entry 40 asked about the talk format after David said "I think I want to talk about second brain." This is conservative behaviour — gathering intent before generating output. Appropriate for open-ended creative work.

## New Types or Subtypes Proposed

- **brand.speaker_submission**: Sessions where Claude acts as a brand-aware copywriter to complete an external speaker, conference, or media submission form. Distinguishing features: form fields pasted sequentially, character/word-count constraints applied iteratively, no tool writes, output goes to an external system. Separate from `brand.copywriting` because the structure is imposed by the external form, not by David's creative intent.
- **BRAND top-level type**: The current taxonomy (KNOWLEDGE, BUILD, OPS, etc.) has no home for sessions that are purely brand and content work. A BRAND or CONTENT type would cover speaker submissions, profile copywriting, social media drafting, YouTube description generation, and similar sessions — all of which run from the brains directory with read-heavy tool patterns but produce no brain or code artifact.

## Subtype Candidates Confirmed

- None from the existing taxonomy — this session reveals a gap. The closest existing subtype is `knowledge.brain_curation` but the session does not curate the brain; it consumes it as a reference for external copywriting.

## Classifier Learning

- **`project_dir = brains` is a noisy signal**: This is the third session in this analysis campaign where `project_dir = brains` produces a false positive KNOWLEDGE classification. The actual discriminator is whether any file inside `project_dir` is written or durably edited. Read-only access to brain files for background context is a different pattern from knowledge curation.
- **Transcript paste as context injection**: When the first real user action after the opening keyword is a large paste beginning with a timestamp (`0:00 In this video...`), the session is likely a context-loading + task session, not a knowledge session. Transcript ingestion without a subsequent Write or Edit to a brain file should lower KNOWLEDGE confidence.
- **Form-shaped prompts**: Prompts containing form boilerplate ("Provide 3-5 clear and concise bullet points...", "If you have a product or service that aligns...") are strong signals that the session is responding to an external form, not doing internal knowledge work. Detecting this pattern would flag form-filling sessions for a BRAND or CONTENT classification.
- **Short iterative prompts after a long paste**: The pattern of one long paste (8,000+ chars) followed by many short prompts (< 100 chars each: "yes", "300 characters", "less then 600 characters") is characteristic of iterative copywriting, not knowledge analysis or coding.

## Interest Level

medium — The classification is a clear false positive (KNOWLEDGE when it is actually brand copywriting) and illustrates a recurring gap in the taxonomy. The session itself is straightforward: David completed a speaker application for the Digital Stage Summit with Claude as copywriter. The interest is primarily taxonomic: this session, combined with earlier false positives, makes a strong case for a BRAND or CONTENT top-level session type. The talk outline (second brain demo + librarian agent + live AppyStack micro-app vibe-code) is potentially notable for AngelEye content planning but is not filed anywhere.
