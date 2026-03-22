# Findings: W3-14 — ansible / mac provisioning failure + debug (d5fa9524)

## Classification

- **Registry**: BUILD / mixed
- **Analysed type**: operations.provisioning_debug
- **Confidence**: high
- **Reclassification**: yes — BUILD is wrong; correct top-level type is OPERATIONS
- **Reasoning**: The registry classified this as BUILD/mixed because the session is in the `ansible` project and involves editing playbook files. But the core activity is not building Ansible infrastructure — it is diagnosing and repairing a broken provisioning run against real machines. David is SSHing to a mac-mini-m2, running `ansible-playbook site.yml`, watching it fail, interrogating the gaps (Claude not installed, Node not available, wrong Node version across machines), having the agent read and patch playbook files, then re-running the playbook to verify. This is operations work: maintaining live machine state. The edit and read tool calls are diagnostic edits to fix a broken operational system, not construction of new infrastructure. A single feature addition (`add tmux to ansible so it's on all machines`) appears at the end and is minor — it does not shift the session type. The correct classification is `operations.provisioning_debug`.

## Session Shape

- **Events**: 33 total non-progress events (14 user_prompt, 19 tool_use)
- **Total tool invocations**: 19
- **Read tools**: Read x9 (47.4% of tool events)
- **Edit tools**: Edit x4 (21.1%)
- **Bash tools**: Bash x4 (21.1%)
- **Other tools**: Glob x1, Skill x1 (commit skill)
- **Duration**: ~43 minutes active work (2026-02-23T02:11 to 02:54), then resumed next day 2026-02-24T02:54 for a single commit
- **Real user prompts**: 14 (high — driven by iterative run/fail/ask cycles)
- **Context continuations**: 0
- **Opening style**: voice-transcribed — pastes SSH terminal output then asks "Why is this happening?"
- **cwd**: `/Users/davidcruwys/dev/ad/agent-os/ansible` throughout — no cwd shift

### Tools Breakdown

| Tool  | Count | %     |
| ----- | ----- | ----- |
| Read  | 9     | 47.4% |
| Edit  | 4     | 21.1% |
| Bash  | 4     | 21.1% |
| Glob  | 1     | 5.3%  |
| Skill | 1     | 5.3%  |

### Skills

- `commit` skill invoked once at the end of the session (2026-02-24T02:54), committing the playbook changes.

### Phase Structure

The session has four clear phases:

1. **SSH + Claude install failure (02:11–02:12)**: David SSHs to mac-mini-m2 and runs `claude --dangerously-skip-permissions`. It fails with `zsh: command not found: claude`. He pastes the output and asks why. This is the triggering incident — the operational baseline (Claude available on all machines) is broken.

2. **Ansible interrogation + frustration burst (02:12–02:15)**: David fires four rapid short prompts in succession, each frustrated: "What's wrong with our ansible", "Why can't I trust you? Why can't I trust this system?", "Don't even have Node available." The agent reads multiple playbook files (Read x3, Glob x1) to diagnose what the provisioning is supposed to install.

3. **Playbook diagnosis and patching (02:15–02:38)**: The main repair work. Agent reads more files, edits playbooks to fix the provisioning gaps (likely PATH, Node version pinning, Homebrew install sequence). David runs `ansible-playbook site.yml` with various flags (`--limit mac-mini-m2`, `--tags homebrew`) and pastes output back. Agent edits again. David asks about Node version discrepancy (M4 has 24.13.0, M2 has 22.14.0) — a concrete machine state divergence. Agent reads and edits to address version pinning. Session also records David asking how to run the playbook on M4 (he forgot the command) and how to SSH into machines and use them — indicating he is operating across machines during the session.

4. **Feature addition + commit (02:35–02:54 + next day)**: David asks to add tmux to ansible so it's on all machines. Agent reads two files, makes two edits. David runs the playbook again with `--tags homebrew` to verify. Then ~2 hours later asks for a session summary ("what is a list of a few different points about what this conversation is actually about"). The session closes the next day (2026-02-24T02:54) with "commit this" — the commit skill is invoked.

## Observations

1. **OPERATIONS not BUILD**: Ansible is a machine provisioning project that can produce two very different session types. A session where David is designing or scaffolding playbook structure from scratch would be BUILD. This session is reacting to machines being in a broken state — `claude` not found, Node version wrong, tools missing. That is operations work. The distinguishing signal: David is running playbooks against live machines and pasting failure output, not designing playbook structure.

2. **High prompt count driven by run/fail/ask cycle**: 14 user prompts in 43 minutes is above average. The pattern is characteristic of operational debugging: run → fail → paste output → ask → patch → rerun → partial success → ask again. Each paste of `ansible-playbook` output is its own prompt. This cycle is distinct from a BUILD session where prompts tend to be longer requirement descriptions.

3. **Frustration arc as operational-failure signal**: The second phase (02:12–02:15) shows four rapid short prompts in ~3 minutes: "What's wrong with our ansible", "Why when we run normal fucking installs of those playbooks does this not fucking work?", "Why can't I trust you? Why can't I trust this system?", "Don't even have Node available." This is a frustration burst triggered by a system that was supposed to be reliable but isn't. AngelEye could detect this pattern — multiple short angry prompts in rapid succession after a paste of failure output — as a strong `operations.provisioning_debug` signal.

4. **Machine state divergence as a diagnostic pattern**: The Node version discrepancy (M4: 24.13.0 vs M2: 22.14.0) is a concrete cross-machine state divergence. David notices it and asks about it. This pattern — "machine A has X, machine B has Y, why?" — is a classic multi-machine operations concern. It appears because the provisioning was not pinning versions and different machines had been provisioned at different times.

5. **Session summary prompt as a new pattern**: At 04:42, ~2 hours after the active work ended, David asks twice: "I list a few different points about what this conversation is actually about" and then "what is a list of a few different points about what this conversation is actually about." This is an unusual late-session behaviour — asking Claude to summarise the session after the operational work is complete. It may indicate David was documenting what happened (perhaps for Ansible notes or a brain file). AngelEye should treat this as a post-session reflection prompt, not a new operational turn.

6. **Commit skill at end**: The session closes with a commit — `commit this` at 2026-02-24T02:54, a full day after the main session. This suggests the changes were left uncommitted overnight and David returned specifically to commit. The Skill, Bash x4 pattern at the end is the commit skill running `git add`, `git diff`, `git status`, `git commit`.

7. **No assistant entries visible**: The JSONL (as extracted by AngelEye) contains only `user_prompt` and `tool_use` events — no `assistant` entries. This is the AngelEye transcript format (trimmed from the full Claude Code JSONL). The assistant responses are not captured in the session file, so analysis depends entirely on the tool call sequence and user prompts.

## Patterns Found

- **Provisioning run/fail/paste cycle**: Repeated `ansible-playbook` invocations pasted into user prompts is a strong classifier signal for `operations.provisioning_debug`. The pattern: user_prompt contains `ansible-playbook site.yml` + BECOME password + PLAY output. This is distinct from reading playbook files to understand them (which would be BUILD or RESEARCH).
- **Frustration burst cluster**: Multiple short angry prompts in 2–3 minutes after a failure is a signal of operational pain. This pattern differs from single-prompt frustration seen in other sessions because it is rapid-fire and each prompt escalates: "What's wrong with ansible" → "Why can't I trust this system?"
- **Post-session summary prompt**: Late prompts asking "what is this conversation about" are a new pattern. Distinct from mid-session clarification. They appear to be reflection or documentation prompts.
- **Cross-machine state divergence question**: "On the M4 I've got X, on the M2 I've got Y, why?" is a multi-machine operations concern pattern. Useful as a secondary signal for OPERATIONS classification in infrastructure projects.
- **Next-day commit**: Operational sessions may end with uncommitted changes that are committed in a follow-up session. The commit prompt "commit this" with no surrounding context is a minimal return session.

## New Types or Subtypes Proposed

- **operations.provisioning_debug (confirmed candidate)**: Sessions where the primary activity is running provisioning tools (Ansible, Chef, Puppet, shell scripts) against live machines, diagnosing failures, patching playbooks, and re-running. Distinguishing signals: (a) `cwd` is an infrastructure/provisioning project, (b) user prompts contain pasted playbook run output, (c) frustration prompts about unreliable automation, (d) cross-machine state divergence questions, (e) Edit/Read tools used on config files not code files. Distinct from BUILD because the machines already exist — David is not creating new infrastructure, he is repairing broken operational state.

## Subtype Candidates Confirmed

- **operations (top-level)**: The `ansible` project should have a dedicated top-level OPERATIONS bucket in AngelEye's classifier alongside BUILD, RESEARCH, DEBUG, etc. Ansible sessions can be: `operations.provisioning_debug` (this session), `operations.provisioning_build` (designing new playbooks), or `operations.machine_config` (tweaking config on running machines). The current BUILD classification for all ansible sessions is too coarse.

## Interest Level

medium — This session is a clean example of a provisioning-debug session being misclassified as BUILD. It is structurally clear (run/fail/paste cycle, frustration burst, machine state divergence question, post-session summary), short enough to analyse in full, and provides good classifier training signals for the OPERATIONS type. The tmux feature addition at the end is a minor BUILD moment but does not overwhelm the operational character of the session. Primary AngelEye value: (1) demonstrating that `ansible` project sessions split into BUILD vs OPERATIONS, (2) the run/fail/paste cycle as a strong `operations.provisioning_debug` fingerprint, (3) frustration bursts as operational-failure signals, (4) post-session summary prompt as a new pattern class.
