# Findings: W3-13 — ansible / operations.mac_provisioning (a4dd0a45)

## Classification

- **Registry**: BUILD / mixed
- **Analysed type**: operations.mac_provisioning
- **Confidence**: high
- **Reclassification**: yes — BUILD is wrong; this is OPERATIONS
- **Reasoning**: The registry classified this as BUILD/mixed, but nothing is being built in the software sense. The entire session is about configuring and running Ansible playbooks to provision macOS machines (an M4 Mac Pro, an M4 Mac Mini, and an M2 Mac). David is writing Ansible task files and group_vars, running `ansible-playbook` against live hosts, and troubleshooting a failed provisioning run. This is infrastructure management — machine state is being driven toward a desired configuration. The session fits the OPERATIONS type precisely: it concerns ongoing operational activity (managing a fleet of developer machines), not the creation of a software product. The mixed tool pattern (Read + Edit + Task together) is consistent with OPERATIONS work: reading existing playbook files, editing them, and using the Task tool to execute shell commands or subagent actions. `ansible` is explicitly called out in the campaign brief as "could be BUILD or OPERATIONS" — this session resolves clearly to OPERATIONS.

## Session Shape

- **Events**: 49 total (9 user_prompt, 40 tool_use, 0 progress skipped)
- **Total tool invocations**: 40
- **File reading tools**: Read x14 (35.0% of all events)
- **File editing tools**: Edit x14 (35.0%)
- **Orchestration tools**: Task x10 (25.0%)
- **File discovery tools**: Glob x2 (5.0%)
- **Duration**: ~7h 18m wall clock (2026-02-22T18:40 to 2026-02-23T01:58), with a large gap of ~6h 34m between prompt 5 (19:13) and prompt 6 (01:47 next day)
- **Real user prompts**: 9
- **Context continuations**: 0
- **Opening style**: direct question — "how do I check all the mac settings on this computer with ansible"
- **cwd**: `/Users/davidcruwys/dev/ad/agent-os/ansible` throughout — no cwd shift

### Tools Breakdown

| Tool | Count | %     |
| ---- | ----- | ----- |
| Read | 14    | 35.0% |
| Edit | 14    | 35.0% |
| Task | 10    | 25.0% |
| Glob | 2     | 5.0%  |

### Skills

- None invoked via `/skill` mechanism.

### Phase Structure

The active session spans roughly 33 minutes (18:40–19:13), then resumes ~6.5 hours later for a 12-minute troubleshooting burst (01:47–01:58).

**Phase 1 — macOS discovery (18:40–18:43)**
David asks how to check all mac settings via Ansible. Agent reads existing playbooks (Glob x1, Read x2), then adds macOS defaults collection to `discovery.yml` (Edit x2).

**Phase 2 — cross-machine domain dump and gap analysis (18:44–18:58)**
David asks about doing a full domain dump on both the M4 Mac Pro and M4 Mac Mini to compare configurations. Agent orchestrates this via the Task tool (Task x7 over this phase), reads and edits playbook files (Read x4, Edit x7) — building out the discovery and comparison playbook capability. David confirms adding missing keys to `group_vars/all.yml` including `en_AU` locale.

**Phase 3 — provisioning run validation (19:13)**
David pastes a terminal snippet showing an `ansible-m2` run and asks if the install went OK. The output shows BECOME password prompted and a PLAY starting — suggesting provisioning actually executed. Agent reads back the results (one read-heavy turn).

**Phase 4 — Claude Code as a managed application (01:47–01:58)**
After a ~6.5h gap, David returns with a question about whether Claude Code is part of the Ansible provisioning for the Mac M2. He notes it "has more in common with infrastructure apps than traditional applications." After discussion, David attempts the actual provisioning run (ansible-playbook with `--limit mac-mini-m2 --tags applications --check --diff`) but aborts it with Ctrl+C (BECOME password prompt → [ERROR]: User interrupted execution visible in the final prompt).

## Observations

1. **OPERATIONS not BUILD**: The deliverable of this session is not a software artifact — it is the desired state of two physical machines. Playbook files are created and edited as a means to that end (the same way an ops engineer writes a config file before deploying it). The value is in the provisioned machines, not the playbook code itself. AngelEye should classify sessions in `agent-os/ansible` as OPERATIONS by default, with BUILD reserved only if someone is developing the Ansible tooling itself as a product.

2. **Task tool as subagent orchestration**: Task is used 10 times, which is high relative to the small number of user prompts (9). This suggests the agent is dispatching subagent calls to execute shell commands or run analysis tasks rather than doing everything inline. The Task/user_prompt ratio of 1.1:1 is a useful signal for OPERATIONS sessions where multiple actions fan out from a single user intent.

3. **Large time gap mid-session**: There is a ~6.5h gap between prompt 5 (19:13:10) and prompt 6 (01:47:24 next day). The session stayed open overnight. This is a long-running session artefact — the machine probably wasn't closed. For AngelEye, this means `last_active` is not a reliable indicator of actual work duration; real work time was approximately 33 minutes (phase 1–3) plus 12 minutes (phase 4).

4. **Aborted provisioning run**: The final event is David pasting a terminal snippet showing an interrupted ansible-playbook run. This is a common OPERATIONS pattern: attempting to apply configuration, hitting a friction point (BECOME password, check/diff mode), and aborting. The session ends without successful provisioning — the work is incomplete.

5. **Infrastructure classification by project path**: The `cwd` of `agent-os/ansible` is a strong OPERATIONS signal by project name alone. "agent-os" is Project Theodore — a 3-Mac agentic OS managed via Ansible. Any session in this directory is infrastructure management unless the prompts are clearly about developing Ansible plugins or modules (which these are not).

6. **Scope creep toward application management**: Phase 4 shows an interesting expansion — David is now managing Claude Code (a desktop app) as if it were infrastructure. He frames it as "infrastructure app." This reflects a real operations concern: how do you track and provision applications that don't behave like standard Homebrew casks? This is an operational edge case, not a build task.

7. **Read/Edit symmetry**: Read and Edit each appear exactly 14 times (35.0%). This near-perfect symmetry suggests a highly iterative write-verify cycle: read a file, edit it, repeat. This is characteristic of config authoring — where you need to understand existing structure before changing it — rather than greenfield development where writes dominate reads.

## Patterns Found

- **OPERATIONS fingerprint for ansible sessions**: `agent-os/ansible` cwd + playbook edits + Task tool execution + `ansible-playbook` terminal snippets = OPERATIONS. The registry BUILD label is systematically wrong for this project path. AngelEye should add a project-path-based prior: sessions in `*/ansible*` or `*agent-os*` directories default to OPERATIONS unless strong counter-signals exist.
- **Read/Edit symmetry as config-authoring signal**: When Read count ≈ Edit count and Task is also present, the session is likely config authoring with execution verification (OPERATIONS or DEVOPS), not software BUILD. In BUILD sessions, Edit typically dominates Read (writing new code) or Write tools appear for new file creation.
- **Task-heavy OPERATIONS**: High Task tool usage (25% of events here) reflects subagent orchestration for shell execution — a distinct OPERATIONS signal. BUILD sessions typically use Bash directly or Write/Edit without needing Task orchestration.
- **Multi-machine context**: References to M4 Mac Pro, M4 Mac Mini, and Mac M2 (three distinct machines) within a single session confirm this is fleet management / OPERATIONS. BUILD sessions refer to a single target environment.
- **Overnight session gap artefact**: The 6.5h gap between phase 3 and phase 4 with no close event is consistent with a session left open while the developer went about other work. This creates inflated `last_active` timestamps. AngelEye should measure effective session duration by identifying gaps > 2h and treating them as session boundaries for duration calculations.

## New Types or Subtypes Proposed

- **operations.mac_provisioning (new candidate)**: Sessions where Ansible (or similar) is used to drive desired state on macOS machines. Distinguishing signals: (a) cwd in ansible/agent-os project, (b) playbook files edited (discovery.yml, site.yml, group_vars/), (c) terminal output from ansible-playbook pasted back as prompts, (d) references to specific machines by hostname or model (mac-mini-m2, mac-pro-m4), (e) Task tool used for execution. Distinct from `operations.deployment` (web app deployment) and `operations.monitoring` (observability work).
- **operations.infrastructure_as_code (broader candidate)**: A parent subtype covering any session where the output is configuration files (Ansible, Terraform, Ansible roles, dotfiles) that drive machine or service state. `operations.mac_provisioning` would nest under this as a macOS-specific variant.

## Subtype Candidates Confirmed

- **operations.mac_provisioning**: Confirmed viable. The session maps cleanly to this subtype with no ambiguity. The prompt content (domain dump, macOS defaults, gap analysis between machines), the file targets (discovery.yml, group_vars/all.yml, site.yml), and the execution feedback loop (ansible-playbook terminal snippets) are all consistent.
- **BUILD is wrong for ansible**: Confirmed. No software artifact is produced. The playbook files are operational configuration, not product code. Any classifier that sees `Edit` + `Read` + `Bash/Task` and defaults to BUILD will misclassify ansible infrastructure sessions.

## Interest Level

high — This session is a clean, unambiguous example of OPERATIONS misclassified as BUILD, making it a high-value classifier training case. The three-phase structure (discovery → configuration → execution) mirrors a canonical OPERATIONS workflow. The phase 4 pattern (managing a desktop app as infrastructure) is an interesting edge case for the OPERATIONS/application boundary. The Read/Edit symmetry finding and the Task-as-orchestration pattern are both generalizable to other OPERATIONS sessions. The overnight gap artefact is useful for duration-calculation heuristics.
