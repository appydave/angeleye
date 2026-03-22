# Findings: W2-14 — brains/focus ansible (2ddee32c)

## Classification

- **Registry**: BUILD / bash-heavy
- **Analysed type**: OPERATIONS / ops.machine_provision
- **Confidence**: high
- **Registry override**: yes — BUILD is incorrect. The registry classified on bash-heavy tool pattern, but the session is overwhelmingly about provisioning Jan's Mac Mini via Ansible over Tailscale. While a README edit and a few Ansible config fixes were committed, these are operational documentation and configuration — not product code. The session is a textbook remote machine provisioning event: SSH key exchange, Tailscale networking, Ansible playbook execution, inventory management, Syncthing file sync setup.
- **Reasoning**: David opened with `/focus ansible` to orient on his Ansible brain, then immediately began a live provisioning session for Jan's Mac Mini in the Philippines. The session covers the full provisioning lifecycle: bootstrap documentation, Tailscale VPN onboarding (invite flow failure, auth key workaround), SSH key exchange, Ansible inventory setup (public/private split for PII), running the full site.yml playbook against Jan's machine, debugging Oh My Zsh installer hang, fixing the tailscale role scope, running discovery, verifying installation, setting up Syncthing for file sync, and configuring locale. This is operations work with a human on the other end of a remote connection.

## Session Shape

- Events: 266 lines (mix of tool_use, user_prompt, stop, subagent events)
- Tools used: Bash x~50, Read x~20, Edit x~18, Glob x~4, Grep x~4, Agent x3 (1 background, 1 Explore subagent, 1 general)
- Subagents: 2 — one background agent for PII cleanup (a0972a9f046668ccd, general-purpose), one Explore agent for finding the "live sync tool" (a26c1232e271c6571)
- Duration: ~2 hours wall clock (2026-03-16T06:09 to 2026-03-16T08:05)
- User prompts: ~40 (extremely high cadence — many are short voice-transcribed follow-ups during live troubleshooting with Jan on the other end)
- Opening style: skill invocation (`/focus ansible`)

### Skills

- `/focus` — invoked as first prompt, loaded ansible brain orientation (read `ansible/INDEX.md`)

### Prompt Sequence (abbreviated — 40+ prompts)

1. `/focus ansible` — orientation on ansible brain
2. "Did we end up putting my Ansible repository..." — checking repo status for Jan
3. Questions about Tailscale installation, git chicken-and-egg bootstrap
4. Request to update README with bootstrap steps -> commit + push
5. "How does he run Ansible on his machine?" — Jan provisioning begins
   6-15. Tailscale onboarding sequence: invite flow, identity provider mismatch, auth key generation, VPN configuration
   16-20. SSH key exchange: discovering Jan's username, ssh-copy-id vs GitHub key approach
6. Background agent delegation for PII cleanup (private/public inventory split)
   22-25. Ansible playbook execution against Jan's machine, Oh My Zsh hang, debug
   26-30. Discovery run, installation verification, locale fix, Ecamm discussion
   31-35. Syncthing setup: creating relay folder, exchanging device IDs
   36-40. Final troubleshooting and simplification requests

## Observations

1. **Voice transcription pervasive**: Nearly every prompt shows voice artifacts. "brew still" = "brew install", "Ansel" = "Ansible", "boulder synchronisation" = unclear (turned out to be Syncthing/FreeFileSync), "Chan" = "Jan", "off key" = "auth key", "rjanreybusiness" dictated as email. The session is a voice-first conversation where David is simultaneously talking to Jan (likely via WhatsApp/call) and dictating to Claude.
2. **Live troubleshooting with a human relay**: David is sitting between Jan (physically in the Philippines) and Claude. He pastes terminal output, screenshots, and Tailscale admin console text into Claude, gets instructions, relays them to Jan verbally. This is a three-party interaction pattern where Claude is the technical advisor, David is the relay, and Jan is the operator on the remote machine.
3. **Identity provider mismatch discovery**: The Tailscale invite flow failed because David's tailnet requires `@ideasmen.com.au` Google accounts but Jan has a `@gmail.com` account. Claude correctly identified this from pasted admin console text and pivoted to auth key as the workaround. This is a real-time problem-solving sequence.
4. **PII awareness and public/private repo split**: David noticed sensitive data (Lars' email, team member names, Tailscale IPs) in a public GitHub repo. This triggered a security-conscious inventory split pattern: public repo with sanitized templates, private local inventory with real values. A background agent handled the cleanup while David continued the Tailscale work.
5. **Background agent delegation**: David explicitly asked for the PII cleanup to run as a background task ("Run all that in a background task for me, and let me know when you finish. I'm going to be working on other stuff right now."). The background agent (a0972a9f046668ccd) completed 25 tool uses in ~2 minutes, created inventory-private/, sanitized public files, committed and pushed.
6. **Explore subagent for recall failure**: David remembered installing a "live syncing tool" recently but couldn't name it (voice: "boulder synchronisation"). An Explore subagent searched brains, TIL files, git history, and Ansible configs extensively (20+ tool uses) but couldn't find it. The tool turned out to be Syncthing, which was already in Jan's Ansible discovery output. Later FreeFileSync was also identified from an OMI transcript from a March 13 meetup.
7. **Oh My Zsh installer hang**: The Ansible shell role had a bug where the `--unattended` flag was passed to `sh` instead of the install script. Claude identified and fixed it in `roles/shell/tasks/main.yml`, committed and pushed. This is a real operational bug found during live provisioning.
8. **Tailscale role scope fix**: The tailscale role failed on Jan's machine because it tried to run `sudo` tasks (Enable Remote Login) with an incorrect BECOME password. Claude fixed this by scoping the tailscale role to only run on the `thailand` group (David's local machines), not the `philippines` group. Committed and pushed to `site.yml`.
9. **Session never closes formally**: No closing ceremony. The session trails off with Syncthing setup instructions. David is still actively working through the setup when the session ends — this is a marathon operational session that likely continued in a different session or was completed manually.
10. **Frustration present but productive**: David shows mild frustration ("What have I done wrong?", "That doesn't make any sense", "figure shit out") during the SSH and Tailscale sequences. This is baseline frustration for a multi-hour provisioning session (70-80% rate from framework), not crisis-level.

## Patterns Found

- **Human relay provisioning**: David acts as relay between Claude (advisor) and Jan (remote operator). Claude generates commands, David relays them to Jan via voice/chat, Jan executes, David pastes results back. This is a three-party interaction pattern distinct from both solo provisioning and fully automated deployment.
- **Security-conscious inventory split mid-session**: The PII discovery triggered an unplanned security improvement. This is a session pivot from "provisioning Jan" to "fix the repo security model" and back. The pivot was handled cleanly via background agent delegation — David continued the primary task while the cleanup ran in parallel.
- **Ansible operational bugs surfaced by real use**: Both the Oh My Zsh flag bug and the tailscale role scope bug were only discoverable by actually running the playbook against a real remote machine. Discovery runs and dry-runs would not have caught these. This validates the "provision a real machine" testing pattern.
- **Voice-mediated multi-party debugging**: When David pastes terminal output or admin console screenshots, Claude must parse imperfect input (truncated, sometimes with irrelevant terminal chrome) and provide actionable guidance in real-time. The session demonstrates Claude's role as a live ops advisor.
- **Recall failure -> agent search -> contextual rediscovery**: David's "boulder synchronisation" memory led to an extensive but unsuccessful agent search. The answer (Syncthing) was already visible in the session's own data (Jan's discovery output). Cross-referencing OMI transcripts also surfaced FreeFileSync from a recent meetup. This shows the limits of brain search when the user's recall is fuzzy.

## New Types or Subtypes Proposed

- None — `ops.machine_provision` covers this accurately. The session is the canonical example of what machine provisioning looks like: Ansible playbook execution against a remote target, with all the operational scaffolding (networking, SSH, inventory management) included.

## Subtype Candidates Confirmed

- **ops.machine_provision**: Strong confirmation. Signal: Ansible playbooks, Bash-heavy, SSH commands, remote machine targeting. The session adds a refinement: machine provisioning sessions often include live debugging with a remote human operator, not just unattended automation. The Bash-heavy tool pattern is correct but the BUILD classification from registry is wrong — project_dir is brains but the work targets agent-os/ansible.

## Brain Subfolder

- **ansible** — `/focus ansible` loaded the ansible brain. All operational work targets `~/dev/ad/agent-os/ansible/`. The brains project_dir is misleading; the session's functional directory is the ansible repository.

## Interest Level

medium — The session has moderate visual storytelling value. The three-party human relay pattern (David as intermediary between Claude and Jan across countries) is distinctive and relatable. The Tailscale identity provider mismatch and its auth key resolution is a compact problem-solving arc. The PII discovery and background agent delegation shows sophisticated multi-tasking. However, the extremely high prompt count (40+) and long duration make it unsuitable for condensed video coverage without heavy editing. Best content candidates: the Tailscale auth key workaround sequence, and the background agent delegation for PII cleanup.
