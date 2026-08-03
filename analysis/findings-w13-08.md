---
type: analysis
title: 'Findings W13-08'
description: 'Wave 13 analysis findings from March-April 2026 analysis campaign'
tags: [analysis-campaign, wave-series, session-intelligence]
timestamp: 2026-03-28
created: 2026-03-24
function: content
---

# Findings — W13-08

**Wave**: W13-08 (final wave)
**Agent**: W13-08
**Machine**: m4-mini
**Sessions analysed**: 14
**Date**: 2026-03-23

## Batch Summary

All 14 sessions in this batch are **empty/accidental** sessions. Every session has:

- 1-2 events (session_start + session_end only)
- 0 user prompts
- 0 tool calls
- 0 active minutes
- No first_real_prompt

All 14 were already marked `is_junk: true` in the registry. All classified as `META / meta.accidental`.

## Session Inventory

| Session ID (short) | CWD Project              | Events | Duration | Registry Type |
| ------------------ | ------------------------ | ------ | -------- | ------------- |
| aa748935           | appydave-plugins         | 2      | 0min     | BUILD         |
| eccb9ccf           | brains                   | 2      | 0min     | unknown       |
| f30e43ff           | app.supportsignal.com.au | 2      | 0min     | unknown       |
| b62152af           | app.supportsignal.com.au | 2      | 0min     | unknown       |
| 24c523fc           | brains                   | 2      | 1min     | unknown       |
| 207cbdc1           | brains                   | 2      | 413min\* | unknown       |
| f574cf47           | app.supportsignal.com.au | 2      | 4min     | unknown       |
| ecdcd46c           | app.supportsignal.com.au | 2      | 1min     | unknown       |
| 11ffa799           | app.supportsignal.com.au | 2      | 0min     | unknown       |
| dceb6cc5           | app.supportsignal.com.au | 2      | 0min     | unknown       |
| 908d8fc3           | app.supportsignal.com.au | 2      | 0min     | unknown       |
| 5f442fb7           | angeleye                 | 1      | 0min     | unknown       |
| c9244768           | angeleye                 | 1      | 0min     | unknown       |
| 6466af5d           | angeleye                 | 1      | 0min     | unknown       |

\*207cbdc1 has a 413-minute gap between session_start and session_end — the session was left open idle overnight, but zero interaction occurred.

## Observations

### 1. CWD distribution of empty sessions

- **app.supportsignal.com.au**: 7/14 (50%) — SupportSignal is the most common terminal location for accidental session starts
- **brains**: 3/14 (21%)
- **angeleye**: 3/14 (21%) — likely from the analysis campaign itself (session starts that were immediately abandoned)
- **appydave-plugins**: 1/14 (7%)

### 2. The one BUILD misclassification

Session aa748935 was classified BUILD in the registry despite being completely empty (0 prompts, 0 tools). This reinforces the rule: zero tool calls = never BUILD.

### 3. Phantom duration in 207cbdc1

This session shows 413 minutes of "duration" but 0 active minutes. The session_start hook fired at 02:50 and session_end at 09:43 — a 7-hour gap with zero interaction between. This is a terminal left open overnight. The `duration_minutes` field is misleading for empty sessions; `active_minutes: 0` is the accurate signal.

### 4. Single-event sessions (angeleye)

Three angeleye sessions (5f442fb7, c9244768, 6466af5d) have only 1 event — a session_start with no corresponding session_end. These occurred within 30 minutes of each other on 2026-03-15, suggesting rapid session start/stop cycles during initial project setup.

## Campaign-Level Note

This batch represents the absolute tail of the session distribution — sessions with no analytical content whatsoever. Their value is purely statistical: they confirm that ~2-3% of all sessions are accidental empty starts, concentrated in the user's most frequently used terminal locations (SupportSignal, brains).
