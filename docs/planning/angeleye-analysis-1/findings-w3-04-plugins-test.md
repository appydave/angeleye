# Findings: W3-04 — appydave-plugins (54577c11)

## Classification

- **Registry**: TEST / playwright-heavy
- **Analysed type**: SKILL / skill.creation
- **Confidence**: high
- **Reasoning**: The registry label TEST/playwright-heavy is wrong on both counts. There is no testing here — no assertions, no test harness, no verification loop. Playwright is used instrumentally: first to navigate and scrape a live web app (sola.day), then to fill forms and create a calendar event on that site. The session's primary deliverable is a new Claude Code skill file (Claude Lab Events / 4Cs) authored via the Skill tool and written to disk with Bash and Write. The session is a skill-authoring workflow where a Playwright session was used to gather the source material and demonstrate the flow before encoding it into a skill. This is SKILL/skill.creation.

## Session Shape

- Events: 60 (50 tool_use, 10 user_prompt)
- Tools used: mcp**playwright**browser_navigate x5, mcp**playwright**browser_click x12, mcp**playwright**browser_type x6, mcp**playwright**browser_fill_form x1, mcp**playwright**browser_snapshot x2, mcp**playwright**browser_take_screenshot x1, mcp**playwright**browser_triple_click x1, ToolSearch x1, Skill x1, Bash x5, Write x3, Read x1
- Total tool invocations: 50
- Duration: ~17 minutes (2026-03-12 13:45 to 14:02)
- User prompts: 10 (mix of voice-transcribed and typed)
- Opening style: direct question — "Are you able to open up Playwright MCP and go to this URL?"

### Prompt Timeline

| #   | Time  | Prompt (summary)                                                                                                                                                                                                                        | Gap    |
| --- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | 13:45 | "Are you able to open up Playwright MCP and go to this URL? https://app.sola.day/event/detail/17788"                                                                                                                                    | --     |
| 2   | 13:49 | "If so, I'm in as me. I'm David at Ideasmen to come to the" (voice, cut off)                                                                                                                                                            | 3 min  |
| 3   | 13:49 | "david@ideasmen.com.au" (email typed separately as follow-up)                                                                                                                                                                           | <1 min |
| 4   | 13:50 | "Can you read my last calendar event? It should be for the 12th of March"                                                                                                                                                               | 1 min  |
| 5   | 13:51 | "I'm talking about on the website you just opened. That's my calendar event." (correction)                                                                                                                                              | 1 min  |
| 6   | 13:52 | "I've already done the six-digit code. You're actually signed in; you're on the page."                                                                                                                                                  | 1 min  |
| 7   | 13:52 | "What I want you to do is scrape all the information because it's all about me and just put it into a clean format. In the conversation"                                                                                                | <1 min |
| 8   | 13:53 | Long prompt: create a skill called "Claude Lab Events" triggered by "4Cs event" / "Claude Lab Thursday night" — navigate the site, document how to create a recurring event, and create the event for David rather than instructing him | 1 min  |
| 9   | 13:58 | "Can you create a skill for this, please? using skill creator"                                                                                                                                                                          | 5 min  |
| 10  | 14:02 | "No, I think we've already created the event. I think it's like" (voice, trailing off — session ends)                                                                                                                                   | 4 min  |

### Tool Phases

**Phase 1: Navigation and login (events 2–9, ~13:46–13:50)**

- ToolSearch to find Playwright tools
- navigate to sola.day event URL
- navigate + fill_form + type + click for login flow (email entry, button press)

**Phase 2: Scrape and event creation (events 10–48, ~13:50–13:58)**

- snapshot to read the current page state after login
- navigate x3 to reach event creation area
- click x8 + type x3 + triple_click x1 to fill event creation form (title, description, date/time fields)
- take_screenshot to capture form state

**Phase 3: Skill authoring (events 50–59, ~13:58–14:00)**

- Skill tool invoked (skill creator)
- Bash to find existing skill templates or directories
- Write x3 to write skill files (SKILL.md, likely index/frontmatter files)
- Read to check existing skill format
- Bash x4 for file registration or ls verification

### CWD Distribution

- `/Users/davidcruwys/dev/ad/appydave-plugins`: all 60 events (100%)

## Observations

1. **Misclassified as TEST**: There is no testing activity in this session. The playwright-heavy tool pattern triggered the TEST label, but playwright here is a scraping and automation tool, not a test runner. The distinction matters: TEST sessions have assertions, verification loops, or fix-rerun cycles. This session has none of those.
2. **Live web app automation**: David asked Claude to operate his logged-in sola.day account — navigating the calendar app, filling an event creation form, and creating a recurring event on his behalf. This is a real-world web automation task, not a local dev environment.
3. **Voice-transcribed prompts with artefacts**: Prompts 2 ("I'm David at Ideasmen to come to the"), 10 ("No, I think we've already created the event. I think it's like") are clearly cut-off voice-to-text. Prompt 3 (just an email address) was a follow-up to finish the incomplete prior prompt.
4. **Login delegation**: David told Claude "I've already done the six-digit code" — indicating he completed a MFA/magic-link step manually while Claude was waiting. This is a hybrid human+AI login flow: Claude drives the browser, David handles the auth gate that Claude cannot access.
5. **Skill naming intent**: The skill trigger vocabulary is specific — "4Cs event", "Claude Lab", "Claude Lab Thursday night". This suggests the sola.day event being created (and scraped) is the Claude Lab Thursday night meetup. The skill encodes the workflow for creating this recurring event on sola.day.
6. **Prompt 8 is the real pivot**: The session pivots from "scrape this event" to "create the event AND encode this into a skill" in a single prompt. David specified that Claude should create the event for him (not just document how), document as it goes, and produce a skill at the end. This is concurrent automation + documentation.
7. **Short session, complete arc**: At 17 minutes and 60 events, this session has a complete arc — navigate, authenticate, scrape, automate, skill-author. The trailing final prompt suggests David was satisfied with the outcome and moved on without a formal closing.
8. **Appydave-plugins as skill home**: The cwd is appydave-plugins throughout, confirming this repo is David's skill repository. The skill files were written directly here.

## Patterns Found

- **playwright_as_scraper**: Playwright used to read and extract content from a live authenticated web app (sola.day) into conversational output. Not for testing — for information extraction. Distinct from playwright_test and playwright_automation.
- **playwright_live_automation**: Claude operates a real logged-in web app to complete a task on the user's behalf (create a calendar event). Human-in-the-loop for auth gates (MFA step handled by David). This is distinct from headless scraping — Claude is acting as the user's proxy in a real web session.
- **skill_from_live_session**: A skill is authored immediately after Claude demonstrates the workflow in a live browser session. The Playwright session is both the proof-of-concept and the source material for the skill's step-by-step instructions. The skill crystallises what Claude just learned by doing.
- **voice_trailing_cutoff**: Multiple prompts end mid-sentence (voice STT drops). Pattern: short correction or follow-up prompt immediately follows. Cluster of 2-3 very short prompts at session start (prompts 1-3) is a common voice-input signature.

## New Types or Subtypes Proposed

- **playwright_as_scraper**: Should be distinguished from playwright_test and playwright_automation in the tool_pattern taxonomy. Signal: snapshot + navigate to extract content to conversation, no assertions.
- **playwright_live_automation**: Live web app proxy — Claude acts as the user's hands in a real authenticated browser session. Human handles auth gates, Claude handles everything else.

## Subtype Candidates Confirmed

- **skill.creation**: Confirmed. Session ends with Skill tool invocation + Write calls that produce a new skill file. The entire Playwright workflow feeds into the skill being authored. This is the canonical signal for skill.creation.

## Type Correction

- **Registry said**: TEST / playwright-heavy
- **Actual**: SKILL / skill.creation
- **Why**: TEST is wrong — no assertions, no test loop, no verification cycle. The playwright-heavy tool pattern is real but misleading as a type signal: playwright here is an automation and scraping tool, not a test framework. The primary session output is a new skill file (Claude Lab Events). SKILL/skill.creation is the correct classification. The registry needs a signal rule: playwright-heavy alone does not imply TEST; look for the presence of Skill + Write tool calls to distinguish skill.creation.

## Interest Level

medium — The session is short (17 min, 60 events) and self-contained. Its interest lies in two patterns: (1) skill.creation from a live Playwright session — Claude learns by doing then encodes the workflow, which is a high-leverage skill-authoring pattern, and (2) playwright_live_automation where Claude proxies for the user in a real authenticated web session with human-in-the-loop auth handoff. Neither pattern has appeared in prior waves. The misclassification (TEST vs SKILL) is also a useful signal-quality finding for the AngelEye classifier.
