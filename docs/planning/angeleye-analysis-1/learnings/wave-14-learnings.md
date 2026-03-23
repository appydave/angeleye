# Wave 14 Learnings

**Date**: 2026-03-23
**Sessions analysed**: 110 (bringing total to 910/910 = 100%)
**Agents**: 9 parallel (W14-01 through W14-09)
**Duration**: ~5-8 minutes per agent
**First wave on M4 Pro machine** — all sessions accessed via `ssh macbook-pro-m4` (Tailscale)

## Application Learnings

### M4 Pro has a distinct machine character

The M4 Pro is David's primary field/interactive machine, based in Chiang Mai. It differs fundamentally from the M4 Mini:

| Dimension            | M4 Pro                                      | M4 Mini                          |
| -------------------- | ------------------------------------------- | -------------------------------- |
| Role                 | Field/mobile, primary interactive           | Secondary/server, headless work  |
| Usage pattern        | Evening mega-sprints, multi-topic marathons | More focused, sustained sessions |
| Infrastructure       | Hub for 5-machine fleet (SSH, Ansible)      | Managed, not manager             |
| Personal integration | Joy Juice business, Thai visa, meetups      | Less personal                    |
| Voice dictation      | 7-9 of 12 sessions per batch                | Less prevalent                   |
| CWD reliability      | brains/ almost always incidental            | More varied                      |
| Frustration signals  | More frequent, stronger language            | Less documented                  |

### Paperclip/JJ Agent is a production autonomous system

The Paperclip agent "JJ" (UUID `27231022-d305-4069-a16a-472c98259e33`) is observed across all 9 batches, running on joy-juice and beauty-and-joy projects. ~15-20 sessions total.

**Session subtypes within the pattern**:

1. **Marathon** (3f66732c): 952 events, 54 prompts, 680 min, 8 compactions. Largest autonomous session ever.
2. **Work bursts**: Single prompt triggers 65 tool calls in 13 minutes with actual writes/edits.
3. **Polling** (85e61d58): 21 identical hourly prompts, 20 idle gaps of exactly 60 minutes, 6 active minutes across 21+ hours.
4. **Micro pings**: Single "Respond with hello." prompt, zero tools — liveness checks.

**Fingerprint**: Prompt contains "You are agent 27231022-d305-4069-a16a-472c98259e33 (JJ). Continue your Paperclip work." — machine-initiated, not human-typed.

**Classification**: Registry marks all as BUILD. Correct classification is `operations.paperclip_agent` for automated runs, `build.autonomous_agent_work` only when writes/edits occur.

### Registry BUILD accuracy 17-33% on M4 Pro

| Agent  | Sessions | Correct BUILD | Accuracy |
| ------ | -------- | ------------- | -------- |
| W14-01 | 13       | ~6            | ~46%     |
| W14-02 | 13       | 3             | 23%      |
| W14-03 | 12       | 3             | 25%      |
| W14-04 | 12       | 2             | 17%      |
| W14-05 | 12       | ~0            | ~0%      |
| W14-06 | 12       | 3             | 25%      |
| W14-07 | 12       | ~3            | ~25%     |
| W14-08 | 12       | 4             | 33%      |
| W14-09 | 12       | 3             | 25%      |

Root cause: the M4 Pro registry defaults to BUILD for everything. The classifier lacks discrimination for SYSOPS, RESEARCH, MIXED, ORIENTATION, META, BRAND, and DEBUG. Sessions with zero writes/edits/tools are systematically misclassified.

### New projects discovered on M4 Pro

Projects not seen on M4 Mini:

- **joy-juice** (15 sessions) — real Thai juice bar business. Thai/farang/Chinese market segments, bilingual menus, GrabFood (30% commission), 20+ Mochaccino mockups.
- **appydave.com** (9 sessions) — website prototyping burst (3 sessions started within 90 seconds).
- **beauty-and-joy** (6 sessions) — Joy's brand, parent project for joy-juice.
- **voice-agent** (Rust) — fn key processor experiment. First appearance.
- **flideck** (6 sessions) — Ralphy campaign execution with Playwright QA.

### CWD=brains/ is the most unreliable project signal in the entire dataset

Across all 9 batches, the majority of brains/ CWD sessions were doing something else entirely: Ansible provisioning, SSH lookups, alias generation, support tickets, personal assistance. Any classifier must treat brains/ CWD as nearly meaningless for project attribution.

### "Agents in the Wild" meetup generates knowledge.meetup_capture sessions

Recurring Friday event in Chiang Mai. 2 instances found (March 20 in W14-07, another in W14-08). Pattern: real-time brain writes during the talk about orchestration frameworks. New subtype: `knowledge.meetup_capture`.

### Unauthorized edit anti-pattern confirmed in production

W14-08 session bd82fee9: David explicitly called out "why did you update something, I asked a question I did not give a directive." Real-world occurrence of the `unauthorized_edit_before_prompt` detection pattern.

### Command center pattern — single session dispatching parallel agents

W14-03 session 93fe2159: 45 prompts, 9 parallel background agents dispatched from one session. 95K char first prompt (compaction resume). This is orchestration-at-scale, not BUILD.

### Skill gap discovery

W14-09: David discovered Adapt, Animate, and Polish skill names don't actually exist. Only `frontend-design` and `impeccable` are valid design skills. Need for a skill inventory discovery mechanism.

### ~60+ new subtypes proposed

Notable additions to the taxonomy:

- `operations.paperclip_agent` — automated Paperclip runs (N=15+)
- `operations.scheduled_agent` — hourly polling loops (N=3+)
- `operations.agent_ping` — liveness checks (N=2+)
- `build.autonomous_agent_work` — machine-initiated work bursts
- `build.ralphy_campaign` — Ralphy with parallel agents and quality audit
- `build.prototype` — single-prompt worktree prototype
- `knowledge.meetup_capture` — real-time meetup note-taking (N=2)
- `sysops.remote_provisioning` — Ansible-driven machine setup
- `sysops.fleet_management` — 5-machine SSH/Ansible orchestration
- `research.tool_evaluation` — Blotato, OpenClaw, RTK evaluation
- `mixed.research_then_knowledge_then_skill` — multi-phase brain+skill sessions
- `brand.design_review` — Playwright visual loop + HTML iteration

### Voice dictation artifacts (~20 new)

- "nvideo nemoclaw" = NVIDIA NemoClaw
- "papwerclip" = Paperclip
- "AngelLie" = AngelEye
- "Tailwindow" = Tailwind
- "m4-minii" = m4-mini
- "angents" = agents
- "fetsch" / "fetsh" = fetch
- "cooordination" = coordination

M4 Pro voice dictation rate: 7-9 of 12 sessions per batch — higher than M4 Mini.

### PII incidents

- Joy Juice: girlfriend Sutaksina ("Joy"), business location near CMU facing 7-Eleven
- DTV Thailand visa: Chiang Khong-Laos border crossing details
- Fleet management: SSH keys distributed to Jan and Mary's machines
- Meetup attendance: AI meetup location/schedule
- Strong frustration language logged in transcripts

## Loop Meta-Learnings

### 9 parallel agents, zero conflicts (wave 14)

910 entries, 0 duplicates. Append-only pattern continues bulletproof on the first remote-machine wave.

### SSH access worked seamlessly

Pre-computed shapes eliminated most SSH needs. Agents only used SSH for moderate/heavy sessions needing deeper JSONL reads. No timeouts, no connection failures.

### M4 Pro sessions are richer than expected

110 sessions yielded ~60+ new subtypes (0.55/session). The new projects (joy-juice, appydave.com, voice-agent) and the Paperclip agent pattern produced genuinely new taxonomy entries not seen in 800 M4 Mini sessions.

### Discovery rate rebounded

0.55/session (up from 0.32 in wave 13). New machine = new projects = new patterns. Confirms that taxonomy saturation was a scale effect in waves 12-13, not true exhaustion.

### Total subtypes: ~500+ across 24+ parent types from 910 sessions
