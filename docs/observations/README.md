# Workflow Observations

Real-world session logs captured by David while running BMAD workflows. These are first-person observations of the multi-agent workflow lifecycle — timing, friction, what worked, what didn't.

**Purpose**: Feed AngelEye's design with ground-truth data about how workflows actually feel to operate. These logs capture things that telemetry alone can't: idle-agent frustration, handoff friction, missing notifications, persona visibility gaps.

**Format**: One file per story session, named `story-{id}-{date}.md`. Each contains a timeline table, key observations, and pattern notes.

**Expect more**: David will add these incrementally during workflow sessions. They are append-only audit records — never edit or delete existing entries.

**How AngelEye uses these**:

- Friction points become feature requirements (e.g., "no notifications between steps" drives the ambient awareness feature)
- Timing data validates station duration estimates in workflow configs
- Pattern notes inform classifier rules (e.g., SAT single-window vs two-window pattern)
