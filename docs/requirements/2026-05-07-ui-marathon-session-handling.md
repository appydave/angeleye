---
id: req-2026-05-07-ui-marathon-session-handling
title: Verify and handle marathon-scale sessions (1000+ events) in UI
category: ui
status: open
created_at: 2026-05-07T00:45:00.000Z
evidence_sessions:
  - 22349636-c8bb-46f8-89f5-2898007ef65f
  - 129a06a1-f648-4d95-a67c-ef51c784dc07
---

## Proposed Change

Two-step investigation + fix:

1. **Verify behaviour on a marathon session.** Open session `22349636-c8bb-46f8-89f5-2898007ef65f` (1299 events) in the AngelEye UI. Confirm:
   - Session detail page loads without freezing the browser
   - Event list renders without hanging
   - Network/JSON parse times are acceptable
   - Tool count summaries don't overflow

2. **If problems exist:** add virtualisation or pagination to the event list view (`client/src/pages/SessionDetailPage.tsx` or wherever the events list is rendered). Consider a default truncation (e.g. show first 50 + last 20, with "show all" expander) similar to how IDEs handle large files.

## Why

The corpus now contains sessions with 1299 events (`22349636`, an als-workflows marathon) and 996 events (`129a06a1`, a Ralphy Playwright campaign). These will only get more common as workflows mature and Ralphy/BMAD orchestrations become routine.

Most session UIs are designed around tens-to-hundreds of events. Without verification, we don't know if the existing UI handles 1000+ events gracefully or grinds to a halt. Better to find out now, when fixing it is cheap, than when David tries to inspect a session and the browser hangs.

## Evidence

| Session                                | Observation                                                                                                                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `22349636-c8bb-46f8-89f5-2898007ef65f` | als-workflows marathon, 1299 filtered events, 666 Bash + 173 Read + 137 Write + 77 Agent calls. The largest session in the corpus to date.                                  |
| `129a06a1-f648-4d95-a67c-ef51c784dc07` | Ralphy E2E campaign, 996 filtered events. 155 browser_click + 150 browser_snapshot + 110 screenshots. Multiple Playwright tools per event would inflate raw counts further. |

## Acceptance Criteria

- [ ] Session `22349636` opens cleanly in the UI within 5 seconds, no browser freeze
- [ ] Event list scrolls smoothly with 1000+ entries
- [ ] If virtualisation is needed: `react-window` or similar applied to the events list
- [ ] If pagination is the answer: default view shows top + bottom slice with explicit "load all" action
- [ ] Tool count summaries (e.g. `Bash:666`) display without layout overflow
