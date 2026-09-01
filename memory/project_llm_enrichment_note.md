---
name: Local LLM enrichment — future opportunity
description: Tier 3 semantic fields flagged as candidates for local small language models rather than cloud API
type: project
---

Fields that "genuinely need LLM re-reading every time" are likely candidates for small language models running locally on-device in future (not cloud API):

- `frustration_analysis`, `phase_breakdown`, `autonomy_profile` — free-text observations
- `delegation_style` — requires reading actual conversation rhythm
- Predicates P01-P03, P07, P13-P16 — semantic judgments

**Why:** These fields require reading session content semantically but don't need GPT-4 class models. A local model (Ollama, MLX on M4) could run these cheaply at batch time with no API cost.

**How to apply:** When designing the Tier 3 enrichment pipeline, don't assume cloud API. Design for a pluggable inference backend so local models can be swapped in when available.
