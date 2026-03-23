# IMPLEMENTATION_PLAN.md — angeleye-analysis-1

**Goal**: Systematically analyse Claude Code session data across two machines (M4 Mini: 773+, M4 Pro: 409+) to expand the conversation analysis framework with new semantic types, patterns, examples, and detection rules.

**Started**: 2026-03-22
**Target**: Diminishing returns — keep iterating until new passes stop producing novel semantic types and patterns.

**Campaign type**: Analysis (not code build). Work units are session batches, not features. Output is curated knowledge in `~/dev/ad/brains/angeleye/analysis/`.

**Scaling**: Start with 5-8 sessions per wave. Increase logarithmically each round based on human feedback and context window limits. Consider file sizes, not just session count — large JSONL files consume more context.

**Schema evolution**: After every wave, evaluate whether the session index schema needs expansion. Flag to human before changing — back-migration and re-pass may be required.

## Summary

- Total: 910 | Complete: 910 | In Progress: 0 | Pending: 0 | Failed: 0
- M4 Mini: 800/800 complete | M4 Pro: 110/110 complete

## Complete

### Wave 14 — 110 sessions across 9 agents (M4 Pro, all pending sessions) ✓

**First wave on M4 Pro machine**. Sessions accessed via `ssh macbook-pro-m4`. Mix of scales: 1 marathon, 5 heavy, 35 moderate, 40 light, 14 micro, 15 trivial. New projects not seen on M4 Mini: joy-juice (15), appydave.com (9), beauty-and-joy (6), flideck (6), davidcruwys (6).

**Agent W14-01** — 13 sessions (952-1 events, includes marathon)
**Agent W14-02** — 13 sessions (343-1 events)
**Agent W14-03** — 12 sessions (282-2 events)
**Agent W14-04** — 12 sessions (223-2 events)
**Agent W14-05** — 12 sessions (209-2 events)
**Agent W14-06** — 12 sessions (207-2 events)
**Agent W14-07** — 12 sessions (185-2 events)
**Agent W14-08** — 12 sessions (174-1 events)
**Agent W14-09** — 12 sessions (169-1 events)

### Wave 10 — 80 sessions across 9 agents (campaign-status.py selected, 76 moderate + 4 heavy)

**First wave using campaign-status.py** for batch selection — no more ad-hoc ID files. Heavy/moderate sessions dominating (all lighter sessions processed in waves 8-9).

**Agent W10-01** — 9 sessions | angeleye, app.supportsignal.com.au, appystack, brains, prompt.supportsignal.com.au

- [x] W10-33bbe033 — `33bbe033-aee1-43bd-afb0-db15e16cd137` angeleye / heavy
- [x] W10-b95a97be — `b95a97be-79f3-4020-990e-21d01b396bed` brains / moderate
- [x] W10-77d71fc4 — `77d71fc4-eddb-4a15-a4f8-4646767b4e79` appystack / moderate
- [x] W10-656018b4 — `656018b4-0c07-48a7-b33c-d346f75956b7` app.supportsignal.com.au / moderate
- [x] W10-59c75fd2 — `59c75fd2-a0c6-48eb-8763-47d7cc8bd387` brains / moderate
- [x] W10-67dfdd2e — `67dfdd2e-6f4f-4261-8e07-14a39218de1b` brains / moderate
- [x] W10-77764bc1 — `77764bc1-fd56-4be6-8c57-d1abbf1878a3` brains / moderate
- [x] W10-1432e6e9 — `1432e6e9-4a76-405b-b49e-9245466986d3` brains / moderate
- [x] W10-866cd7ea — `866cd7ea-de05-48ac-9348-95869963356b` prompt.supportsignal.com.au / moderate

**Agent W10-02** — 9 sessions | app.supportsignal.com.au, brains, prompt.supportsignal.com.au

- [x] W10-da040e73 — `da040e73-4313-41f3-acd5-5ecc28980858` prompt.supportsignal.com.au / heavy
- [x] W10-580c428a — `580c428a-89f8-401f-a0ad-5e7949e9761a` brains / moderate
- [x] W10-f7951cc3 — `f7951cc3-69f0-4f7a-a08c-be0cb924c857` brains / moderate
- [x] W10-77148c1f — `77148c1f-c5f2-4b4e-a569-41335c68109c` prompt.supportsignal.com.au / moderate
- [x] W10-b82395cd — `b82395cd-7330-444a-8716-f16d0a47d08f` app.supportsignal.com.au / moderate
- [x] W10-8eb0eb2c — `8eb0eb2c-0fea-4332-bfaf-19e827fd17e7` brains / moderate
- [x] W10-5942ce2f — `5942ce2f-2d26-4d5a-946b-0d7524380541` brains / moderate
- [x] W10-5ea99ae9 — `5ea99ae9-1a5f-4237-b552-cbdc740070fb` brains / moderate
- [x] W10-c4961eaa — `c4961eaa-37af-4a71-bfd3-fc642acb88ce` brains / moderate

**Agent W10-03** — 9 sessions | angeleye, appydave-plugins, brains, prompt.supportsignal.com.au

- [x] W10-18665260 — `18665260-13b3-4eb6-84ba-65bb0403ca58` angeleye / heavy
- [x] W10-192c4cbc — `192c4cbc-3130-4d4c-bf1a-92e7e3c4e0ea` angeleye / moderate
- [x] W10-d5e19d58 — `d5e19d58-d841-43fc-992c-7b6ef71b6046` appydave-plugins / moderate
- [x] W10-3d481502 — `3d481502-eda4-47dc-b4d8-9c50778b7b98` brains / moderate
- [x] W10-a88bb8a6 — `a88bb8a6-4a2a-47c9-9e8b-558dac25bdec` prompt.supportsignal.com.au / moderate
- [x] W10-a6fee7b2 — `a6fee7b2-54f8-4cc5-a720-45272e1cf600` prompt.supportsignal.com.au / moderate
- [x] W10-f8a2bdb2 — `f8a2bdb2-59e6-408c-b3cc-702189d908df` brains / moderate
- [x] W10-febf22a3 — `febf22a3-edf0-455d-bfe7-b5d78cdf576a` brains / moderate
- [x] W10-9d7c9ad6 — `9d7c9ad6-74ea-4874-84ce-d446d0310a89` brains / moderate

**Agent W10-04** — 9 sessions | angeleye, app.supportsignal.com.au, appystack, brains, prompt.supportsignal.com.au

- [x] W10-6ee31b28 — `6ee31b28-d01e-445b-9799-be9998ba5e6d` angeleye / heavy
- [x] W10-7e7a8e58 — `7e7a8e58-5814-4be7-9308-22d17655fbef` prompt.supportsignal.com.au / moderate
- [x] W10-cee4b2b0 — `cee4b2b0-b3b9-44c3-b63b-fdd695165739` prompt.supportsignal.com.au / moderate
- [x] W10-c160da46 — `c160da46-09bd-49e5-a8c1-2a00bbb2d3f4` prompt.supportsignal.com.au / moderate
- [x] W10-6f12067a — `6f12067a-3095-4494-aa4f-6fd804ad7947` appystack / moderate
- [x] W10-bfa26edf — `bfa26edf-92da-4858-9054-672e8fc165f4` appystack / moderate
- [x] W10-de0f46f6 — `de0f46f6-e8db-4a9d-bbf7-54c5cc750c7c` prompt.supportsignal.com.au / moderate
- [x] W10-b4041152 — `b4041152-c196-4d2d-9e33-22ae2a0d3eb1` brains / moderate
- [x] W10-cc357cb4 — `cc357cb4-e34d-4791-92f6-62eac990ebd6` app.supportsignal.com.au / moderate

**Agent W10-05** — 9 sessions | brains, prompt.supportsignal.com.au

- [x] W10-c9a2f3a2 — `c9a2f3a2-bc24-4be0-809e-3032760c4a7c` brains / moderate
- [x] W10-983d70b0 — `983d70b0-95a2-400b-95b2-68e7ad053de3` brains / moderate
- [x] W10-f75655f0 — `f75655f0-466d-4f81-b209-b80201e74c1e` prompt.supportsignal.com.au / moderate
- [x] W10-802ae066 — `802ae066-1dec-4a7b-8106-80ee3d6053eb` brains / moderate
- [x] W10-d3a8db00 — `d3a8db00-1965-49e6-8cf5-c3d87394703e` brains / moderate
- [x] W10-880e197b — `880e197b-7869-410c-b471-28779ae0c319` brains / moderate
- [x] W10-733f8cd4 — `733f8cd4-feca-421a-88b0-1e5958618e8f` brains / moderate
- [x] W10-49d66aad — `49d66aad-9971-4686-886a-179e9c023d8a` brains / moderate
- [x] W10-335e73af — `335e73af-e519-4775-866b-80633d8da511` prompt.supportsignal.com.au / moderate

**Agent W10-06** — 9 sessions | brains, prompt.supportsignal.com.au

- [x] W10-be47bbd8 — `be47bbd8-fc50-49fd-b457-3e48789e7278` brains / moderate
- [x] W10-8e5e717d — `8e5e717d-6517-409b-ac09-41dcc4aa55b2` prompt.supportsignal.com.au / moderate
- [x] W10-84e401ee — `84e401ee-2730-4711-ac6e-97bd42c9674d` brains / moderate
- [x] W10-521221f0 — `521221f0-2c25-4fd5-9a4a-263d818054a2` brains / moderate
- [x] W10-49ef67ad — `49ef67ad-de89-43ab-b9ff-a7334757cf6f` prompt.supportsignal.com.au / moderate
- [x] W10-460a1312 — `460a1312-037a-4bd1-827f-b42f4f23881a` prompt.supportsignal.com.au / moderate
- [x] W10-612e20d9 — `612e20d9-9bcc-4d05-9b99-9c972f46192a` prompt.supportsignal.com.au / moderate
- [x] W10-7263fd75 — `7263fd75-d00d-40b6-b11e-5f84a97252bf` brains / moderate
- [x] W10-86a9a3bc — `86a9a3bc-88c1-4929-8b1f-86920ac2bd83` prompt.supportsignal.com.au / moderate

**Agent W10-07** — 9 sessions | brains, prompt.supportsignal.com.au

- [x] W10-649c95af — `649c95af-8201-4ad1-889c-e9f99b6575e9` prompt.supportsignal.com.au / moderate
- [x] W10-c0ee8c35 — `c0ee8c35-d361-42e1-8cc6-004817b886d7` brains / moderate
- [x] W10-b97f2b6d — `b97f2b6d-cefa-4f66-8ea8-5423b9886caa` prompt.supportsignal.com.au / moderate
- [x] W10-a796e02a — `a796e02a-3e3f-40fe-a1d3-57f061d812c2` prompt.supportsignal.com.au / moderate
- [x] W10-f95e4fb0 — `f95e4fb0-b633-43e2-bb11-846009a5c10b` prompt.supportsignal.com.au / moderate
- [x] W10-7370d999 — `7370d999-f989-4260-976e-c58c8610ba82` prompt.supportsignal.com.au / moderate
- [x] W10-0661821b — `0661821b-5c37-4b80-b4a9-e84e49f46cc1` brains / moderate
- [x] W10-d0af1944 — `d0af1944-a3c4-4ecf-83de-9f255f459228` prompt.supportsignal.com.au / moderate
- [x] W10-31054316 — `31054316-e8ec-4af5-bf01-d85e19cfdc24` brains / moderate

**Agent W10-08** — 9 sessions | angeleye, appystack, brains, prompt.supportsignal.com.au

- [x] W10-ea0cafc6 — `ea0cafc6-3d8e-409a-b6e7-28bbbdc77cd9` prompt.supportsignal.com.au / moderate
- [x] W10-d129cfba — `d129cfba-1368-4ac7-a291-6edda50aaca7` prompt.supportsignal.com.au / moderate
- [x] W10-b56e1aef — `b56e1aef-1fed-4809-9e72-a26c42be3af2` brains / moderate
- [x] W10-39d9224e — `39d9224e-53e3-4949-b696-b4c44ec0a291` appystack / moderate
- [x] W10-4479d525 — `4479d525-0ba3-4998-b5c6-0ec121a39e6e` prompt.supportsignal.com.au / moderate
- [x] W10-ea6a9a87 — `ea6a9a87-235c-44a9-8762-79b3cf6ad85a` appystack / moderate
- [x] W10-7d20393a — `7d20393a-381f-47c2-ad53-fc8f12c5ac4b` angeleye / moderate
- [x] W10-9d63797d — `9d63797d-4185-477c-aac0-39c8c3d47ead` brains / moderate
- [x] W10-eb5b1d43 — `eb5b1d43-3002-4a2b-9a9d-dd34bac21fee` prompt.supportsignal.com.au / moderate

**Agent W10-09** — 8 sessions | app.supportsignal.com.au, appystack, brains, prompt.supportsignal.com.au

- [x] W10-e9fb0466 — `e9fb0466-cfb8-419c-8b00-f83e3a1ad0cf` prompt.supportsignal.com.au / moderate
- [x] W10-8f220d36 — `8f220d36-e911-4602-891e-22550b4650d0` appystack / moderate
- [x] W10-73dad405 — `73dad405-a10e-4cd8-a373-e3e646063d4c` brains / moderate
- [x] W10-4ff362fe — `4ff362fe-60d3-4dae-90a0-eb2c5f7e4eb7` appystack / moderate
- [x] W10-c9349da5 — `c9349da5-18d3-41b1-b4c3-7cb2a7e8a170` brains / moderate
- [x] W10-4f7716c8 — `4f7716c8-6573-4fd2-b10b-1d159f5db378` brains / moderate
- [x] W10-134e47bc — `134e47bc-4a83-49d4-a9fe-ba98f5fb8912` app.supportsignal.com.au / moderate
- [x] W10-26171bb1 — `26171bb1-1a1a-4ce7-bb08-b53afa1b7186` brains / moderate

### Wave 13 — 133 sessions across 9 agents (final wave — all remaining trivial/micro/light)

**Final wave**. Processed every remaining session: 71 trivial + 39 micro + 23 light. BUILD accuracy 0% across entire wave. 28% of sessions were non-human junk (ghost sessions, accidental opens, agent warmups). Registry grew from 799→800 during processing; 1 session remains pending.

**Agent W13-01** — 15 sessions (2 micro, 13 light) — [x] all complete
**Agent W13-02** — 15 sessions (all micro) — [x] all complete
**Agent W13-03** — 15 sessions (all micro) — [x] all complete
**Agent W13-04** — 15 sessions (all micro, all brains/ CWD) — [x] all complete
**Agent W13-05** — 15 sessions (all micro) — [x] all complete
**Agent W13-06** — 15 sessions (all micro, exactly 3 events each) — [x] all complete
**Agent W13-07** — 15 sessions (7 ghost, 7 micro with prompts, 1 empty) — [x] all complete
**Agent W13-08** — 14 sessions (all empty/accidental) — [x] all complete
**Agent W13-09** — 14 sessions (all single-event junk) — [x] all complete

133/133 sessions analysed. Plus 1 late-arriving session (00befc58) processed separately.
800/800 sessions analysed. 800 unique entries in session-index.jsonl, 0 duplicates.

### Wave 12 — 80 sessions across 9 agents (campaign-status.py selected, all light scale)

**Third wave using campaign-status.py**. 100% light scale, mostly brains/ CWD. BUILD accuracy 2.5% — lowest of any wave. Discovery rate 0.63/session.

**Agents W12-01 through W12-09** — 80 sessions total, all [x] complete.
666 unique entries in session-index.jsonl after wave, 0 duplicates.

### Wave 11 — 80 sessions across 9 agents (campaign-status.py selected, all light/micro/trivial)

**Second wave using campaign-status.py**. All remaining substantive sessions after moderate/heavy were consumed in waves 8-10. BUILD accuracy dropped to ~12% as expected for lighter sessions.

**Agent W11-01** — 9 sessions | brains, prompt.supportsignal.com.au

- [x] W11-01-bfe3e2e1 — `bfe3e2e1-eb45-4fb4-afd4-53d421069eb4` prompt.supportsignal.com.au / light
- [x] W11-01-ce3de2cd — `ce3de2cd-82e9-443f-a35b-9b37c7b9cd3e` brains / light
- [x] W11-01-ab707b60 — `ab707b60-575f-4984-9efc-2c6e60f21ec8` prompt.supportsignal.com.au / light
- [x] W11-01-b2c6988b — `b2c6988b-31e3-46a4-b10b-dfd30884938d` prompt.supportsignal.com.au / light
- [x] W11-01-8efb371e — `8efb371e-90e2-424c-9aac-8f495311751a` brains / light
- [x] W11-01-9d0485d5 — `9d0485d5-adec-4d20-a3d8-72f608dc259b` prompt.supportsignal.com.au / light
- [x] W11-01-a2dd3f2d — `a2dd3f2d-bd45-45b4-9644-fb6d161edd20` prompt.supportsignal.com.au / light
- [x] W11-01-377e6d56 — `377e6d56-e8d9-4713-8c6e-a66cbd762aee` brains / light
- [x] W11-01-248480a0 — `248480a0-a5b3-4e09-96e7-673c6ccdf2e9` brains / light

**Agent W11-02** — 9 sessions | appystack, brains, prompt.supportsignal.com.au

- [x] W11-02-b76d267b — `b76d267b-bdd9-4a92-87c5-6ed851b477b8` brains / light
- [x] W11-02-3a66b975 — `3a66b975-a7f4-4e4b-b2a5-0dcf6ac61773` prompt.supportsignal.com.au / light
- [x] W11-02-df50ec48 — `df50ec48-5378-451f-b196-107336cb9ae7` prompt.supportsignal.com.au / light
- [x] W11-02-52b9a192 — `52b9a192-f958-4fe3-b598-50b8ed336e38` brains / light
- [x] W11-02-dfc912b1 — `dfc912b1-1d0b-4925-a701-78ded66f74b3` brains / light
- [x] W11-02-17f663ad — `17f663ad-faaa-4533-99d6-90a4d68aafa3` appystack / light
- [x] W11-02-9d1d85be — `9d1d85be-3a95-42fc-acf8-3aac53005c08` brains / light
- [x] W11-02-9182b9b9 — `9182b9b9-fe49-4867-a303-e21b5737a71d` brains / light
- [x] W11-02-13b51e25 — `13b51e25-9587-45b5-b71a-e1f1c47d1fc1` brains / light

**Agent W11-03** — 9 sessions | appystack, brains, prompt.supportsignal.com.au

- [x] W11-03-cd9616ed — `cd9616ed-2d0a-49a6-b7d6-75f118a82e2d` brains / light
- [x] W11-03-ba8b5426 — `ba8b5426-ef58-42f4-b2ec-82122821e05c` appystack / light
- [x] W11-03-f9a5c85d — `f9a5c85d-b506-4742-ae8b-6a65dbfb82e6` prompt.supportsignal.com.au / light
- [x] W11-03-5723519d — `5723519d-d05a-4d45-a2f6-a168a93c087b` brains / light
- [x] W11-03-ef02ac0f — `ef02ac0f-f640-48bb-b89c-6d38690e98dd` brains / light
- [x] W11-03-5ce05994 — `5ce05994-935c-41f3-9ab9-ef1239c8c96e` prompt.supportsignal.com.au / light
- [x] W11-03-d1961749 — `d1961749-4379-4fa4-8144-15cf30cc0667` brains / light
- [x] W11-03-5f57d757 — `5f57d757-4172-4a28-b692-8ddc15ce673f` brains / light
- [x] W11-03-bfaf7605 — `bfaf7605-d7aa-43a7-99ca-9ca0f000d910` brains / light

**Agent W11-04** — 9 sessions | appystack, brains, prompt.supportsignal.com.au

- [x] W11-04-9d04778f — `9d04778f-64ee-4e2a-abca-40d272d6d849` prompt.supportsignal.com.au / light
- [x] W11-04-5fb45f56 — `5fb45f56-a066-4753-8514-00a1206e0b05` prompt.supportsignal.com.au / light
- [x] W11-04-2c28f388 — `2c28f388-3ac4-41d8-8fbe-039fae5aac80` brains / light
- [x] W11-04-5e18711f — `5e18711f-14c0-4b6b-918d-2bd11e686b0d` prompt.supportsignal.com.au / light
- [x] W11-04-4dbdeb60 — `4dbdeb60-a5ad-47c0-a0da-5c6f00ec37e2` brains / light
- [x] W11-04-8bf22f75 — `8bf22f75-c034-4572-af6c-06b762ab244b` brains / light
- [x] W11-04-4ad6aae9 — `4ad6aae9-f9b1-4d2c-ac26-e023f0f8b807` brains / light
- [x] W11-04-8790b0c4 — `8790b0c4-a0ed-4fd9-92a2-51bf61695b85` brains / light
- [x] W11-04-a2fdbf5b — `a2fdbf5b-733a-4db4-9d59-07917d61c0fd` appystack / light

**Agent W11-05** — 9 sessions | brains, prompt.supportsignal.com.au

- [x] W11-05-c1bb9b58 — `c1bb9b58-0ed4-41c0-a289-85c800a2518e` prompt.supportsignal.com.au / light
- [x] W11-05-f78f14d7 — `f78f14d7-920d-4b43-987a-bb92a29396a7` brains / light
- [x] W11-05-3651f99e — `3651f99e-e425-4088-b5f1-e72eda4ef06a` prompt.supportsignal.com.au / light
- [x] W11-05-de769e18 — `de769e18-8eca-4895-bc93-d9f12c0b28de` brains / light
- [x] W11-05-15c34b92 — `15c34b92-5c7f-4ed8-96e9-29b403d77a2f` brains / light
- [x] W11-05-aebac8d2 — `aebac8d2-ab93-40f2-9f15-91ba1f7a223b` brains / light
- [x] W11-05-551bdcf8 — `551bdcf8-e165-4310-8957-07776f8d0297` brains / light
- [x] W11-05-9ec9aa64 — `9ec9aa64-d947-4f02-8ccc-f4d6fcedb894` brains / light
- [x] W11-05-5794a3f6 — `5794a3f6-a43a-41a0-ac59-3df6a33d047f` brains / light

**Agent W11-06** — 9 sessions | brains, prompt.supportsignal.com.au

- [x] W11-06-689892a5 — `689892a5-0811-4f66-91d6-946f48ccafb1` brains / light
- [x] W11-06-f4b02724 — `f4b02724-3891-4135-ba9f-2abba01a2e27` brains / light
- [x] W11-06-ddd63cda — `ddd63cda-622a-487c-9086-d6be95e2bb50` prompt.supportsignal.com.au / light
- [x] W11-06-ed94c847 — `ed94c847-4df9-4106-9fff-3a9871088635` prompt.supportsignal.com.au / light
- [x] W11-06-4f494a9c — `4f494a9c-edb6-45c4-b6c2-b2dc3521cbbc` brains / light
- [x] W11-06-cb90d421 — `cb90d421-4da4-4fcc-9ead-8d9406b3b168` brains / light
- [x] W11-06-5ab3c274 — `5ab3c274-44b0-41f0-8614-dcecc05b3cd1` brains / light
- [x] W11-06-b3fcbf07 — `b3fcbf07-ef79-4eb8-ae0b-063a3d5505da` brains / light
- [x] W11-06-83734245 — `83734245-1e13-4e69-9a89-86b73c5c32e1` brains / light

**Agent W11-07** — 9 sessions | brains, prompt.supportsignal.com.au

- [x] W11-07-8b021832 — `8b021832-b3c8-4a81-b883-4f58034fa58b` brains / light
- [x] W11-07-5ba8b355 — `5ba8b355-8ee6-4b5d-9460-1667fbc562d0` brains / light
- [x] W11-07-aedc4c79 — `aedc4c79-2e87-419b-9b0e-def3ddeea0ac` brains / light
- [x] W11-07-59e26047 — `59e26047-c727-4d60-aff7-87e9557a811e` prompt.supportsignal.com.au / light
- [x] W11-07-a7b6b827 — `a7b6b827-0e1c-4b53-af01-c93984803d44` brains / light
- [x] W11-07-41b69014 — `41b69014-470e-45ab-a16f-91f89d2ef751` brains / light
- [x] W11-07-98c9150d — `98c9150d-92a3-4f4b-a48e-d073793c9ff5` brains / light
- [x] W11-07-3df09cf3 — `3df09cf3-dd2e-4627-bd2f-f23845f8a89b` brains / light
- [x] W11-07-ce158a14 — `ce158a14-8d66-4907-99f8-1c04dd3211e3` brains / light

**Agent W11-08** — 9 sessions | brains, prompt.supportsignal.com.au

- [x] W11-08-d8a72400 — `d8a72400-50d2-49df-8a40-5edfaa8a755c` prompt.supportsignal.com.au / light
- [x] W11-08-b4a33efb — `b4a33efb-e9c0-4689-8882-71a2746d6c8c` brains / light
- [x] W11-08-8ee65d81 — `8ee65d81-f644-4f94-be48-df31b11f4e71` brains / light
- [x] W11-08-c05895fc — `c05895fc-9753-4e89-a60b-727b637a4b38` prompt.supportsignal.com.au / light
- [x] W11-08-f3f48d9f — `f3f48d9f-7135-465e-9a4c-672636f6d313` brains / light
- [x] W11-08-ae9475ba — `ae9475ba-1225-4c9d-b328-334e1852c14d` brains / light
- [x] W11-08-d22cbb1c — `d22cbb1c-e8e7-4178-8682-0b2a658400f4` prompt.supportsignal.com.au / light
- [x] W11-08-c3b01cb4 — `c3b01cb4-364c-4604-a598-1a83c57a55de` brains / light
- [x] W11-08-31ad7630 — `31ad7630-0760-4fa2-94bd-292599907e62` prompt.supportsignal.com.au / light

**Agent W11-09** — 8 sessions | brains, prompt.supportsignal.com.au

- [x] W11-09-e05f8858 — `e05f8858-db03-4fd3-ae9b-7b96e6e04d06` prompt.supportsignal.com.au / light
- [x] W11-09-6a182630 — `6a182630-c9d0-46e9-afd5-a2155117ad8e` prompt.supportsignal.com.au / light
- [x] W11-09-c2460616 — `c2460616-5e34-40fc-9c67-a2d153aa3237` brains / light
- [x] W11-09-f0a50528 — `f0a50528-a363-4157-8bc5-a90db0f054a4` prompt.supportsignal.com.au / light
- [x] W11-09-f5e0d853 — `f5e0d853-1ea2-48a5-b4f5-79fb910c1d4b` brains / light
- [x] W11-09-8e27eff4 — `8e27eff4-da08-4348-8ec6-c7e521de0a76` brains / light
- [x] W11-09-339a580a — `339a580a-4150-4715-aa3c-ecc1a358d389` brains / light
- [x] W11-09-c15e692a — `c15e692a-b502-4503-ac54-3eb156fb350a` brains / light

### Wave 8 — 79 sessions across 9 agents (20 distinct projects, /insights-informed predicates)

**Improvements over wave 7**: Micro sessions back in rotation (120 available), all 11 heavy sessions selected (rare/high-value), new predicates P13-P16 (friction decomposition) trialled from /insights comparison.

**Agent W8-01** — 9 sessions | brains(2), signal-studio(1), app.supportsignal.com.au(1), appystack(1), kgems(1), flihub(1), ad(1), flivoice(1)

- [x] W8-79c7317b — `79c7317b-2efb-49cd-806f-aeb076ddad30` signal-studio / heavy
- [x] W8-042f3f13 — `042f3f13-98ae-4c86-8d01-00abffd54910` app.supportsignal.com.au / moderate
- [x] W8-085f085c — `085f085c-d4a5-4ce5-b7d2-413ef98b24c5` brains / moderate
- [x] W8-cfc63f23 — `cfc63f23-ba4b-4467-9522-4d3d8e86d550` appystack / moderate
- [x] W8-895ef55e — `895ef55e-5dfc-49dc-ba35-f6327f796a00` kgems / moderate
- [x] W8-72b40144 — `72b40144-7a61-4311-8104-943d5deee011` flihub / light
- [x] W8-0c47ba35 — `0c47ba35-bbdc-4020-9c41-40a954246c30` brains / light
- [x] W8-379ecf4c — `379ecf4c-ce3d-4484-b08d-19f270d0e756` ad / light
- [x] W8-0bd1e0d7 — `0bd1e0d7-3bc9-45a0-bd02-6e87aa4604e9` flivoice / micro

**Agent W8-02** — 8 sessions | signal-studio(2), flihub(1), brains(1), prompt.supportsignal.com.au(1), v-appydave(1), voz(1), poem(1)

- [x] W8-0e6fe5b8 — `0e6fe5b8-875e-47b8-b2ab-9bbd063ca99b` signal-studio / heavy
- [x] W8-849e7e62 — `849e7e62-7848-44d7-8546-3cb3cfe5762c` flihub / moderate
- [x] W8-12c159ac — `12c159ac-6d56-4858-9a6b-f0c9b6c5e964` signal-studio / moderate
- [x] W8-0115fcb4 — `0115fcb4-66af-4700-8c2c-6747e6108143` brains / moderate
- [x] W8-31ffb14e — `31ffb14e-e775-434b-821b-ad275f4df570` prompt.supportsignal.com.au / moderate
- [x] W8-5f04c048 — `5f04c048-f051-445d-80e1-7cc077696fe4` v-appydave / light
- [x] W8-7115c088 — `7115c088-d7b6-4278-a916-b5095c91e7fc` voz / light
- [x] W8-e53117f9 — `e53117f9-1b00-4848-9b8b-4cb8a452b4d1` poem / micro

**Agent W8-03** — 9 sessions | appystack(2), digital-stage-summit-2026(1), poem(1), deckhand(1), signal-studio(1), angeleye(1), prompt.supportsignal.com.au(1), ad(1)

- [x] W8-05ff3ec4 — `05ff3ec4-1a63-4386-848e-45738a1de454` digital-stage-summit-2026 / heavy
- [x] W8-02a273f8 — `02a273f8-a3b3-4570-b6bf-f4d674e749bc` poem / moderate
- [x] W8-1af0ff41 — `1af0ff41-d66d-4f96-bdf9-35d74473b7bb` deckhand / moderate
- [x] W8-1f948dc1 — `1f948dc1-bca3-4829-8945-3a7bbab57881` appystack / moderate
- [x] W8-170f2ec1 — `170f2ec1-bc96-452d-8129-269fac13be2e` signal-studio / moderate
- [x] W8-0ae7df7c — `0ae7df7c-19de-455d-8156-d06335136e2c` appystack / light
- [x] W8-651ffc0f — `651ffc0f-ca7c-4898-8cdb-af7b4bbb9d13` angeleye / light
- [x] W8-074e257f — `074e257f-6ff9-4db1-81a5-a1d27cc5f6bb` prompt.supportsignal.com.au / light
- [x] W8-9c0419b7 — `9c0419b7-7f35-4c14-8f63-732d40191990` ad / micro

**Agent W8-04** — 9 sessions | flideck(1), angeleye(1), brains(1), v-appydave(1), appystack(1), signal-studio(1), v-voz(1), appydave-plugins(1), apps(1)

- [x] W8-557fd04a — `557fd04a-7cfc-492f-8b1e-693fbd5c521a` flideck / heavy
- [x] W8-68c33d9f — `68c33d9f-b0da-41c7-97e8-001689315cd8` angeleye / moderate
- [x] W8-03127725 — `03127725-f0c7-411b-9584-5e8b84675487` brains / moderate
- [x] W8-1b4cb19a — `1b4cb19a-2c2c-486f-844c-9996b27dbd3b` v-appydave / moderate
- [x] W8-2238b9f1 — `2238b9f1-d4c3-49db-a74d-db8312a8d61f` appystack / moderate
- [x] W8-21d6ffaf — `21d6ffaf-30ec-4a34-bdbf-0450be5c583f` signal-studio / light
- [x] W8-13d25fdf — `13d25fdf-7420-4b25-9d33-349f4eca4d01` v-voz / light
- [x] W8-8447409a — `8447409a-666b-4d52-aa56-4a6242b72f13` appydave-plugins / light
- [x] W8-885eb51c — `885eb51c-8fe7-468b-a435-142b7f09c4a6` apps / micro

**Agent W8-05** — 9 sessions | prompt.supportsignal.com.au(3), angeleye(1), supportsignal(1), flihub(1), brains(1), signal-studio(1), fligen(1)

- [x] W8-c9d68534 — `c9d68534-3304-4f4c-af64-ed9cf364af7a` prompt.supportsignal.com.au / heavy
- [x] W8-26e20d70 — `26e20d70-6110-444e-bd22-807b1e28b628` angeleye / moderate
- [x] W8-95f33c73 — `95f33c73-667b-4a98-8ee0-d19b28a13866` supportsignal / moderate
- [x] W8-0057da96 — `0057da96-30b5-4ec3-9ceb-c0eea49826d1` prompt.supportsignal.com.au / moderate
- [x] W8-1793e80e — `1793e80e-f324-4202-8d64-cd645764d234` flihub / moderate
- [x] W8-027ffbfe — `027ffbfe-af16-434c-9e5a-d907c32e57d5` prompt.supportsignal.com.au / light
- [x] W8-0b728ed0 — `0b728ed0-6340-4369-b58e-a0289e6b4e33` brains / light
- [x] W8-41346d6a — `41346d6a-5a9a-4af8-9e0f-26b5edcff7d4` signal-studio / light
- [x] W8-0f7ea98d — `0f7ea98d-3d3b-450e-af34-54c76b16a92b` fligen / micro

**Agent W8-06** — 9 sessions | app.supportsignal.com.au(3), flivideo(1), signal-studio(1), v-appydave(1), supportsignal(1), storyline-app(1), ad(1)

- [x] W8-3eedefa5 — `3eedefa5-bf46-41b5-9d04-efecbabfbeba` flivideo / heavy
- [x] W8-11553e41 — `11553e41-d6bb-407f-8f03-3f6119edd8d5` app.supportsignal.com.au / moderate
- [x] W8-1cd5963d — `1cd5963d-c263-4a80-a8bb-691d7ea4a3a6` signal-studio / moderate
- [x] W8-53e79368 — `53e79368-2d35-44e5-9bca-2188911c41fd` v-appydave / moderate
- [x] W8-959a8309 — `959a8309-b887-4393-8ef9-76763cbc551a` app.supportsignal.com.au / moderate
- [x] W8-5a04f602 — `5a04f602-d9df-4583-b132-663037e94448` app.supportsignal.com.au / light
- [x] W8-07cdb085 — `07cdb085-b38f-4cc4-ba06-c24ff86967d5` supportsignal / light
- [x] W8-5cc3079e — `5cc3079e-25cd-4a0c-bdd7-a051ea9aa68c` storyline-app / light
- [x] W8-51c6e510 — `51c6e510-6464-4e24-b191-d9636b142980` ad / micro

**Agent W8-07** — 8 sessions | signal-studio(1), deckhand(1), angeleye(1), klueless(1), prompt.supportsignal.com.au(1), v-appydave(1), appydave-plugins(1), v-aitldr(1)

- [x] W8-7b2157e9 — `7b2157e9-6e98-4e56-9d3d-6b16028024a0` signal-studio / heavy
- [x] W8-e3c9e049 — `e3c9e049-46b5-4537-93e0-8cda15c3f513` deckhand / heavy
- [x] W8-201aec50 — `201aec50-56a8-449c-b619-8f8dafe71fe2` angeleye / moderate
- [x] W8-0248f3ad — `0248f3ad-a518-4aa4-98cd-047ccbcfd3de` klueless / moderate
- [x] W8-0daf8585 — `0daf8585-2151-4a8c-ae36-3380185e2c1e` prompt.supportsignal.com.au / moderate
- [x] W8-5309922c — `5309922c-ffc1-4e64-b54e-c574b92bb471` v-appydave / moderate
- [x] W8-78dd3b7f — `78dd3b7f-be2f-4341-b03f-4b0ddd5c0de6` appydave-plugins / light
- [x] W8-e7b6060d — `e7b6060d-b0a6-481a-b1fd-c33a9875372f` v-aitldr / micro

**Agent W8-08** — 9 sessions | brains(2), flihub(2), appystack(2), app.supportsignal.com.au(1), angeleye(1), flideck(1)

- [x] W8-3fa5e03b — `3fa5e03b-f5ef-4f44-8a48-13251a9e4e99` brains / heavy
- [x] W8-61cb8a2b — `61cb8a2b-0bf3-43e6-ac2b-ac8836fd73de` flihub / moderate
- [x] W8-1258366a — `1258366a-99ab-422e-9fee-251dda4e9521` brains / moderate
- [x] W8-47015dde — `47015dde-cb28-44b4-a81d-fdd8052eb844` flihub / moderate
- [x] W8-06c69d58 — `06c69d58-0402-4f73-90cf-5c18620a1f2c` appystack / moderate
- [x] W8-19e974c6 — `19e974c6-0021-4d1c-b477-91a26244a49c` appystack / light
- [x] W8-47852ec4 — `47852ec4-6368-420d-9e40-70852d34ca75` app.supportsignal.com.au / light
- [x] W8-2faac85b — `2faac85b-e8f8-43d0-b342-8d9035c0283e` angeleye / light
- [x] W8-4666a543 — `4666a543-74f6-4bc8-82b3-cf5652236737` flideck / micro

**Agent W8-09** — 9 sessions | brains(2), supportsignal-v2-planning(1), deckhand(1), app.supportsignal.com.au(1), flihub(1), poem(1), video-projects(1), voz(1)

- [x] W8-8e8dac5b — `8e8dac5b-6c14-4f83-9159-da97e6b71a71` brains / heavy
- [x] W8-febc6280 — `febc6280-cd80-4512-b1da-6de160ebf762` brains / heavy
- [x] W8-9fe901a0 — `9fe901a0-981f-49d4-aee4-343aec48fcf1` supportsignal-v2-planning / moderate
- [x] W8-0af58053 — `0af58053-907e-4fe5-b507-893ea68ade6d` deckhand / moderate
- [x] W8-392ad41e — `392ad41e-1999-4706-bc94-f1cda41058d9` app.supportsignal.com.au / moderate
- [x] W8-bc7f7f7a — `bc7f7f7a-f402-43ba-9e3e-51d615473002` flihub / light
- [x] W8-e726cab1 — `e726cab1-bd0d-400a-a5d1-cbae1dbe0574` poem / light
- [x] W8-1b0559b7 — `1b0559b7-e299-486a-aa73-6ee358d0028c` video-projects / light
- [x] W8-a22e8c1a — `a22e8c1a-6457-408c-a0dd-10d1fe18c5ce` voz / micro

### Wave 9 — 79 sessions across 9 agents (lighter wave: no heavy/marathon, 49% micro)

**Pool shift**: All heavy/marathon sessions consumed in waves 1-8. Remaining pool is 49% micro, 44% light, 7% moderate. Dominated by brains (59%) and prompt.supportsignal (24%). P13-P16 now permanent predicates.

**Agent W9-01** — 7 sessions | appystack(2), brains(2), signal-studio(1), app.supportsignal.com.au(1), prompt.supportsignal.com.au(1)

- [x] W9-63ea6186 — `63ea6186-cf11-44fd-829e-741f7dd6fde6` signal-studio / moderate
- [x] W9-c12fa493 — `c12fa493-6aab-47b1-892b-66feb81781b8` appystack / light
- [x] W9-d1fed7ab — `d1fed7ab-9cdf-4266-bb69-845fa173be4d` app.supportsignal.com.au / light
- [x] W9-fa148947 — `fa148947-4b0c-46fb-b28c-684dc6d06aea` appystack / micro
- [x] W9-39bd6350 — `39bd6350-8f8e-48cd-b178-876aff820050` brains / micro
- [x] W9-6634407e — `6634407e-6972-485a-8942-6ea1e14a32a9` brains / micro
- [x] W9-d5844007 — `d5844007-4eb1-4528-8aef-ce878165ba9f` prompt.supportsignal.com.au / micro

**Agent W9-02** — 9 sessions | appystack(2), prompt.supportsignal.com.au(2), brains(2), signal-studio(1), flihub(1), app.supportsignal.com.au(1)

- [x] W9-b0b9ca8d — `b0b9ca8d-a342-45ef-8a93-28d5ec3dd661` signal-studio / moderate
- [x] W9-60bc9223 — `60bc9223-c007-44bc-a88a-e32e598a9023` flihub / light
- [x] W9-eb6cbbe3 — `eb6cbbe3-f540-4ccb-9303-00251de9af39` appystack / light
- [x] W9-c10ebc70 — `c10ebc70-f558-4481-89d5-a8697571cffb` app.supportsignal.com.au / light
- [x] W9-63fa0330 — `63fa0330-465f-4003-b522-889aa39c43f0` appystack / micro
- [x] W9-3016dfad — `3016dfad-1cc1-4953-9b56-3ef80e9c6a87` prompt.supportsignal.com.au / micro
- [x] W9-2efc01af — `2efc01af-79aa-4514-9041-3dd935e6d4f5` brains / micro
- [x] W9-8e9252e0 — `8e9252e0-aa15-4220-a55c-f8028357ea62` prompt.supportsignal.com.au / micro
- [x] W9-fb5dada6 — `fb5dada6-8dc8-4425-a299-e987fe23b235` brains / micro

**Agent W9-03** — 9 sessions | brains(2), prompt.supportsignal.com.au(2), signal-studio(1), appydave-plugins(1), appystack(1), app.supportsignal.com.au(1), angeleye(1)

- [x] W9-7e7da3b8 — `7e7da3b8-2a1d-4c15-a649-49ac551b3607` signal-studio / moderate
- [x] W9-c121ef35 — `c121ef35-1a54-46c0-be05-5bbebbb8cfec` appydave-plugins / light
- [x] W9-2738f3e0 — `2738f3e0-2bba-4f42-8918-ba7dc5df1d97` appystack / light
- [x] W9-71d5df75 — `71d5df75-2724-4655-b78c-561686648271` app.supportsignal.com.au / light
- [x] W9-123b11a5 — `123b11a5-f91a-4009-8955-ac6756cd0895` angeleye / micro
- [x] W9-4344a6bd — `4344a6bd-03a2-4c97-b5c8-5e10fc956fd3` brains / micro
- [x] W9-2cba7b11 — `2cba7b11-bd15-4362-ac90-8b533a83231f` prompt.supportsignal.com.au / micro
- [x] W9-9287d18d — `9287d18d-39f0-4976-b509-77a1e4081368` brains / micro
- [x] W9-d81b6338 — `d81b6338-8f8b-441d-bbd7-86911a02a6ad` prompt.supportsignal.com.au / micro

**Agent W9-04** — 9 sessions | appystack(2), prompt.supportsignal.com.au(2), v-appydave(1), angeleye(1), app.supportsignal.com.au(1), appydave-plugins(1), v-voz(1)

- [x] W9-81523aec — `81523aec-8804-410e-9c66-052c2a4b465a` v-appydave / moderate
- [x] W9-dac8662a — `dac8662a-8549-4269-abe0-2fbccd1449b4` angeleye / light
- [x] W9-bdd8313a — `bdd8313a-3feb-4f84-be4e-a9c144265d0d` app.supportsignal.com.au / light
- [x] W9-e17bce3d — `e17bce3d-c030-4e8b-b1c2-7ff1a1cace1d` appydave-plugins / light
- [x] W9-96f1f5c7 — `96f1f5c7-59aa-4b4c-aee9-3d358479e4c3` v-voz / light
- [x] W9-73f4a83e — `73f4a83e-446f-4534-bc76-93eb0f9b926b` appystack / micro
- [x] W9-edba69e5 — `edba69e5-9336-46fe-84ac-6c212d1d6754` appystack / micro
- [x] W9-b00b08e1 — `b00b08e1-717c-458e-ac34-f52ced1093e9` prompt.supportsignal.com.au / micro
- [x] W9-e564df88 — `e564df88-a765-4b0d-adad-b6d6b5bb1134` prompt.supportsignal.com.au / micro

**Agent W9-05** — 9 sessions | brains(2), signal-studio(1), voz(1), app.supportsignal.com.au(1), appydave-plugins(1), v-appydave(1), angeleye(1), prompt.supportsignal.com.au(1)

- [x] W9-7c8f91e4 — `7c8f91e4-d34f-4599-9512-25403579a2ae` signal-studio / moderate
- [x] W9-dd804b93 — `dd804b93-0ae9-4c20-ae0f-776b8e1048c8` voz / light
- [x] W9-eddd4bbb — `eddd4bbb-d8a8-43dd-8380-41492fc226eb` app.supportsignal.com.au / light
- [x] W9-8f7420da — `8f7420da-fa7f-4afb-8302-2af7445922bb` appydave-plugins / light
- [x] W9-9debb0ee — `9debb0ee-9915-4f35-a7c2-d91a2e564818` v-appydave / light
- [x] W9-bfd7fd99 — `bfd7fd99-004c-4b3c-a1b7-d076841c284e` angeleye / micro
- [x] W9-3d6ee983 — `3d6ee983-6bec-4877-ab15-d4bf6f016284` prompt.supportsignal.com.au / micro
- [x] W9-66b88531 — `66b88531-27df-440a-a36d-94018ff4f526` brains / micro
- [x] W9-ae92065b — `ae92065b-62f1-4c92-9332-8fb44cf0f430` brains / micro

**Agent W9-06** — 9 sessions | appystack(3), app.supportsignal.com.au(2), v-appydave(2), brains(1), prompt.supportsignal.com.au(1)

- [x] W9-e8b25fc5 — `e8b25fc5-b4a7-4df3-a431-1958a7327a74` app.supportsignal.com.au / moderate
- [x] W9-eea00425 — `eea00425-8e4d-40f8-97e0-edd6933c16b1` v-appydave / light
- [x] W9-d844716d — `d844716d-6450-4746-94a6-5854c96cc091` app.supportsignal.com.au / light
- [x] W9-8ca94a94 — `8ca94a94-2076-420b-bdd9-c1248fa5b947` appystack / light
- [x] W9-e5687c61 — `e5687c61-2c22-46e1-ba7e-e05c6a9cee59` appystack / light
- [x] W9-36ea26e4 — `36ea26e4-209d-4ee3-8212-e15adc1fc1f9` v-appydave / micro
- [x] W9-2be6a6d2 — `2be6a6d2-626f-49b5-965c-722c3c9eb621` appystack / micro
- [x] W9-5fe1e918 — `5fe1e918-db7a-47bb-b5c5-f8c8083a48c9` brains / micro
- [x] W9-b61e8341 — `b61e8341-e99c-477d-8e1a-d54a0e4c4242` prompt.supportsignal.com.au / micro

**Agent W9-07** — 9 sessions | appystack(2), brains(2), signal-studio(1), app.supportsignal.com.au(1), flihub(1), angeleye(1), prompt.supportsignal.com.au(1)

- [x] W9-a8e8a27e — `a8e8a27e-caaa-43a9-9cdd-2cad3bdfd8c8` signal-studio / moderate
- [x] W9-1f23c692 — `1f23c692-b266-41ab-8438-14bfca8022c7` app.supportsignal.com.au / light
- [x] W9-d9348668 — `d9348668-cf36-4208-a641-5df937a2b0a1` flihub / light
- [x] W9-e154b011 — `e154b011-a9d5-423f-b61c-ae513878711b` angeleye / light
- [x] W9-d2750b5f — `d2750b5f-1bdc-4359-ad6a-f24f0ddce47f` appystack / light
- [x] W9-3c42e049 — `3c42e049-fc28-4f8f-b4fc-a84abb5c0c11` appystack / micro
- [x] W9-2102ddd1 — `2102ddd1-f45b-4848-84b0-6b4fded956b2` brains / micro
- [x] W9-943cab68 — `943cab68-fa0f-49ed-a04c-269e82f24d9f` prompt.supportsignal.com.au / micro
- [x] W9-bf6e01af — `bf6e01af-edd9-4b50-ad0b-4d44d3e11ead` brains / micro

**Agent W9-08** — 9 sessions | app.supportsignal.com.au(3), v-appydave(2), prompt.supportsignal.com.au(2), signal-studio(1), brains(1)

- [x] W9-88e68402 — `88e68402-6d62-4ee2-a71c-9045d7e5a93b` v-appydave / moderate
- [x] W9-9b34fa2f — `9b34fa2f-707f-4134-9bd6-6a32aac419c4` app.supportsignal.com.au / light
- [x] W9-a7b733ff — `a7b733ff-271a-4e28-b9c1-47ff09dc0854` signal-studio / light
- [x] W9-dc3ef96a — `dc3ef96a-3a20-4c0a-a443-17d12587baf9` v-appydave / light
- [x] W9-dca77664 — `dca77664-1b2d-4ab3-ba39-6e9c68850e60` app.supportsignal.com.au / light
- [x] W9-2cc722f0 — `2cc722f0-cebc-4c19-941e-dc2c16136e03` app.supportsignal.com.au / micro
- [x] W9-47bbfd78 — `47bbfd78-6df6-4a58-a472-84e06d19375c` brains / micro
- [x] W9-8926fda8 — `8926fda8-6926-4a53-b157-f454d24b3e54` prompt.supportsignal.com.au / micro
- [x] W9-d4eb3b4a — `d4eb3b4a-047f-4858-ac24-40aceb8c44b1` prompt.supportsignal.com.au / micro

**Agent W9-09** — 9 sessions | app.supportsignal.com.au(2), appydave-plugins(2), brains(2), v-appydave(1), appystack(1), prompt.supportsignal.com.au(1)

- [x] W9-e34013a3 — `e34013a3-adfc-42eb-bd9f-cac7017dd322` v-appydave / moderate
- [x] W9-ed786725 — `ed786725-eb80-4937-a9c9-3d8fc8f3e5ed` app.supportsignal.com.au / moderate
- [x] W9-0d6cbb83 — `0d6cbb83-2762-419f-af6f-1c1aa6b0d3d1` appydave-plugins / light
- [x] W9-9e97e108 — `9e97e108-ca50-4a74-99d9-3f44a6dfa44e` app.supportsignal.com.au / light
- [x] W9-bfaa39a7 — `bfaa39a7-1f60-478c-8f2f-8859590e8b2d` appydave-plugins / light
- [x] W9-9de68412 — `9de68412-dead-4853-9ed2-9261bc22ff33` appystack / micro
- [x] W9-6344adc1 — `6344adc1-c197-4da3-b1f4-edebffc1b690` prompt.supportsignal.com.au / micro
- [x] W9-75c10afe — `75c10afe-2bda-44e4-8a62-e8d4a2ffa400` brains / micro
- [x] W9-ccd2223e — `ccd2223e-bed9-4b2c-a202-2643abac191c` brains / micro

## Pending

### Wave 7 — 80 sessions across 9 agents (new projects: brain-dynamous, deckhand, thumbrack, kgems, ansible, voz, template, competent-golick)

**Improvements over wave 6**: 30+ projects represented (up from ~8), micro bucket nearly exhausted (5/5 remaining), marathon sessions include 900+ and 1100+ event sessions.

**Agent W7-01** — 9 sessions | brain-dynamous(2), signal-studio(0), davidcruwys(1), v-appydave(1), appystack(1), lars(1), apps(1), flideck(1), brains(1)

- [x] W7-df728ece — `df728ece-225d-44e0-b5fa-49bef627ef1d` brain-dynamous / micro
- [x] W7-f2117010 — `f2117010-90d5-4930-bcbc-f8ee70560f8c` brain-dynamous / light
- [x] W7-5145c4cb — `5145c4cb-52d6-4b79-afd1-4033f5225307` davidcruwys / light
- [x] W7-d43bcb1a — `d43bcb1a-4e25-4605-9972-c697bb9e5de4` v-appydave / moderate
- [x] W7-649b08de — `649b08de-8ac9-432d-8581-c65562e2c0ef` appystack / moderate
- [x] W7-a1ebdd28 — `a1ebdd28-7dd6-4ed1-a756-135f579f5973` lars / moderate
- [x] W7-d876db56 — `d876db56-8ba2-417b-b367-593f0b6712cd` apps / heavy
- [x] W7-9d791f83 — `9d791f83-4054-482b-aef4-f89d0346d9bd` flideck / heavy
- [x] W7-59c2d164 — `59c2d164-15c6-4fc5-813e-d807001bd174` brains / marathon

**Agent W7-02** — 9 sessions | brain-dynamous(1), ad(1), signal-studio(1), deckhand(1), thumbrack(1), v-voz(1), lars(1), supportsignal-v2-planning(1), prompt.supportsignal.com.au(1)

- [x] W7-b198584c — `b198584c-3b85-4e5d-85cc-b29aa65562f5` brain-dynamous / micro
- [x] W7-aca9259c — `aca9259c-d0a2-42d1-858a-ba5b057134bc` ad / light
- [x] W7-fb3b3aa3 — `fb3b3aa3-54bf-4cb7-911e-e6a9e5fe0f7c` signal-studio / light
- [x] W7-752b7415 — `752b7415-2a0d-4d08-8619-ee7d238b7a7c` deckhand / moderate
- [x] W7-b0215876 — `b0215876-3ee9-46dd-ae7d-221f691972d8` thumbrack / moderate
- [x] W7-bda59a13 — `bda59a13-915c-488f-a833-81e2485d95d6` v-voz / moderate
- [x] W7-9e87b170 — `9e87b170-2335-45c2-a751-6b80e626e5dc` lars / heavy
- [x] W7-b2dbcddd — `b2dbcddd-8186-4893-98ae-8e40f3d6f177` supportsignal-v2-planning / heavy
- [x] W7-779fef13 — `779fef13-a5d9-4e01-94fd-11691221654b` prompt.supportsignal.com.au / marathon

**Agent W7-03** — 9 sessions | brains(1), ansible(1), custom(1), appydave-plugins(1), voz(1), apps(1), deckhand(1), flihub(1), app.supportsignal.com.au(1)

- [x] W7-38579dc4 — `38579dc4-2aa7-422c-adbc-d2ffc122d4d2` brains / micro
- [x] W7-a9605418 — `a9605418-1b2b-4852-b33f-7099b5b13c5d` ansible / light
- [x] W7-24adc102 — `24adc102-7a6c-444a-95f2-adb299cc4019` custom / light
- [x] W7-ac9d117b — `ac9d117b-17a2-4e33-bad2-1dbb3ea83720` appydave-plugins / moderate
- [x] W7-fd6cb997 — `fd6cb997-823d-4b65-a85a-3bd12e30fdb8` voz / moderate
- [x] W7-ca8ef6a7 — `ca8ef6a7-66d5-4119-99b5-34cdf6642a29` apps / moderate
- [x] W7-c3bae9c6 — `c3bae9c6-7b6a-4cfc-b028-2b30fba9ef73` deckhand / heavy
- [x] W7-7a146e68 — `7a146e68-a489-4e90-a80d-d15da3755b73` flihub / heavy
- [x] W7-1dda164f — `1dda164f-d7c1-4908-afb3-8eeda00efa0f` app.supportsignal.com.au / marathon

**Agent W7-04** — 9 sessions | brains(1), deckhand(1), v-appydave(1), appydave-plugins(1), flihub(1), template(1), appystack(1), signal-studio(1), v-appydave(1)

- [x] W7-acd93d50 — `acd93d50-0d12-4d3e-9997-f4f8c04a8d54` brains / micro
- [x] W7-69486e50 — `69486e50-8afa-452d-a875-a2eba6b7fb48` deckhand / light
- [x] W7-3e2ce636 — `3e2ce636-6bbf-4ecd-afe6-3b5e9afd3fb6` v-appydave / light
- [x] W7-f1183f53 — `f1183f53-dc53-4ecc-8f9a-a1f9fab80753` appydave-plugins / moderate
- [x] W7-2e0518ac — `2e0518ac-b149-4f48-a995-1fcd86423962` flihub / moderate
- [x] W7-abf3549a — `abf3549a-f9df-477b-9e42-4df322f1ad6b` template / moderate
- [x] W7-3335c76f — `3335c76f-88c0-4325-931a-2715e89b2b51` appystack / heavy
- [x] W7-3bfcf4c7 — `3bfcf4c7-964e-4e9e-b7ad-edbe7a2f7cd7` signal-studio / heavy
- [x] W7-5648cb84 — `5648cb84-ea49-455f-ab66-7b29c8ba1801` v-appydave / marathon

**Agent W7-05** — 9 sessions | brains(1), angeleye(1), flihub-transcripts(1), app.supportsignal.com.au(1), signal-studio(1), deckhand(1), app.supportsignal.com.au(1), custom(1), flihub(1)

- [x] W7-96e6b501 — `96e6b501-4f1b-42e3-8bdf-c56fa7295fb6` brains / micro
- [x] W7-ed6b5327 — `ed6b5327-592c-430e-881a-57f3575a8635` angeleye / light
- [x] W7-6b8898c1 — `6b8898c1-10f6-4a79-8bd4-0c91dc6a8f47` flihub-transcripts / light
- [x] W7-6d25d5ae — `6d25d5ae-e2be-4605-8cda-369ca87f57b5` app.supportsignal.com.au / moderate
- [x] W7-520b517b — `520b517b-06d0-4f42-acb1-1ed8db1aa4c2` signal-studio / moderate
- [x] W7-86ad9f30 — `86ad9f30-f9a3-4227-aa17-d2a4ae5617c7` deckhand / moderate
- [x] W7-95d99e79 — `95d99e79-806e-4b23-9aad-31862a0ca203` app.supportsignal.com.au / heavy
- [x] W7-4debdac5 — `4debdac5-1fa5-4a8f-8431-14e80e5c6ff0` custom / heavy
- [x] W7-21e58810 — `21e58810-9d69-4a56-93c1-2bb26da55c65` flihub / marathon

**Agent W7-06** — 9 sessions | prompt.supportsignal.com.au(1), supportsignal(1), voz(1), ansible(1), supportsignal(1), brains(1), flihub(1), deckhand(1), deckhand(1)

- [x] W7-28e1aa8a — `28e1aa8a-95d5-467d-96bd-71a07ac0727c` prompt.supportsignal.com.au / light
- [x] W7-1006c135 — `1006c135-6980-40de-9b4c-0ff434aeb10b` supportsignal / light
- [x] W7-c54a8113 — `c54a8113-8f23-46e0-9a80-578533f60598` voz / light
- [x] W7-5d25755b — `5d25755b-d35d-43cc-aae1-762d69de6e7f` ansible / moderate
- [x] W7-368e5eb8 — `368e5eb8-07a8-455a-9b3c-ed1575296fd2` supportsignal / moderate
- [x] W7-2df59d61 — `2df59d61-85fd-44c5-89ea-083a1514fda3` brains / heavy
- [x] W7-3aa4e5aa — `3aa4e5aa-6034-40d4-a379-fe95e42d3468` flihub / heavy
- [x] W7-f9485f8c — `f9485f8c-de30-46d9-a6a0-8f9e9ba6261b` deckhand / heavy
- [x] W7-a84d4902 — `a84d4902-f1f8-444f-b252-d45a0b6abdea` deckhand / marathon

**Agent W7-07** — 9 sessions | appystack(1), flideck(1), appydave-plugins(1), kgems(1), flideck(1), davidcruwys(1), v-appydave(1), angeleye(1), flideck(1)

- [x] W7-f628ab01 — `f628ab01-059d-4d1f-a6df-0c8b563327bb` appystack / light
- [x] W7-57e70ac1 — `57e70ac1-c9e3-4042-a383-5c54d35d0d40` flideck / light
- [x] W7-794eef99 — `794eef99-5f38-4b35-8096-4745e0fcd3e0` appydave-plugins / light
- [x] W7-144ccb81 — `144ccb81-04cd-4b12-95ea-6b19e418a0a3` kgems / moderate
- [x] W7-b822b11f — `b822b11f-be6e-414d-b9af-930a42e1cce2` flideck / moderate
- [x] W7-6e540b21 — `6e540b21-73ac-468f-b112-2ec5134b65f5` davidcruwys / heavy
- [x] W7-b4b6c7d5 — `b4b6c7d5-f8f2-4e69-9edf-a251c6bdd3d9` v-appydave / heavy
- [x] W7-08fbfe17 — `08fbfe17-f1c4-41ff-a713-4bdd3c7983f1` angeleye / heavy
- [x] W7-15ae666d — `15ae666d-d03e-46b6-9295-b4b3871c2776` flideck / marathon

**Agent W7-08** — 9 sessions | apps(1), competent-golick(1), brains(1), brain-dynamous(1), supportsignal-v2-planning(1), prompt.supportsignal.com.au(1), appystack(1), appystack(1), thumbrack(1)

- [x] W7-1e0c8237 — `1e0c8237-adc1-419f-bfa4-e88143a8b2a9` apps / light
- [x] W7-4b624fee — `4b624fee-aa1a-4269-acf9-9b259b40a389` competent-golick / light
- [x] W7-030059a0 — `030059a0-cf01-4f33-b596-76a0f6eca4ed` brains / moderate
- [x] W7-2ae4ea98 — `2ae4ea98-cf1f-4bd3-a5c2-7d319596539f` brain-dynamous / moderate
- [x] W7-6c42dbf4 — `6c42dbf4-76d2-494e-831f-5c709e36dbd1` supportsignal-v2-planning / moderate
- [x] W7-f12c0a0b — `f12c0a0b-8839-4b22-906a-ca457266cd67` prompt.supportsignal.com.au / heavy
- [x] W7-4905b3ee — `4905b3ee-ad2f-406d-a6b7-7db02f6bd22f` appystack / heavy
- [x] W7-19643e68 — `19643e68-fab8-4912-86a1-9e7aa0088260` appystack / marathon
- [x] W7-db533df6 — `db533df6-bbc4-4ecc-b3ad-0025fff20d69` thumbrack / marathon

**Agent W7-09** — 8 sessions | brains(1), lars(1), prompt.supportsignal.com.au(1), appystack(1), angeleye(1), appydave-plugins(1), app.supportsignal.com.au(1), signal-studio(1)

- [x] W7-328f8ad5 — `328f8ad5-7b7e-4d31-ae2e-954f32294f0c` brains / light
- [x] W7-a785d086 — `a785d086-c823-4b09-84d8-60a48b4fc11b` lars / light
- [x] W7-5e587cc8 — `5e587cc8-c516-4c2b-bdf1-360c2c8a570d` prompt.supportsignal.com.au / moderate
- [x] W7-55a6468b — `55a6468b-a1e9-4bf1-afbc-d7bcdc06b487` appystack / moderate
- [x] W7-9ef7a313 — `9ef7a313-a853-44b1-baf9-7c481912f24e` angeleye / moderate
- [x] W7-65dec077 — `65dec077-7451-4e5f-a807-a7ed6cbf979a` appydave-plugins / heavy
- [x] W7-31f38fde — `31f38fde-7347-4c12-95d3-be8e0717e1c8` app.supportsignal.com.au / heavy
- [x] W7-4bb89879 — `4bb89879-b501-4c63-aa1b-ae2699781249` signal-studio / marathon

### Wave 6 — Scale-up: 80 sessions across 9 agents (organized by event count)

**Improvements over wave 5**: 80 sessions (up from 40), organized by event count not project group, C08 session_chain_role + P11 is_machine_initiated, explicit classifier key format.

**Agent micro-1** — 23 sessions, 1-8 events | signal-studio(10), appydave-plugins(5), flihub(5), app.supportsignal.com.au(3)

- [x] W6-2eee3b5e — `2eee3b5e-3e1c-4925-a393-20472d7c8124` signal-studio / 1 events
- [x] W6-f2854c94 — `f2854c94-d9ad-4816-addc-b762c84afdbf` signal-studio / 1 events
- [x] W6-13e77111 — `13e77111-cbd4-47bb-8339-fa7e8b87255a` app.supportsignal.com.au / 1 events
- [x] W6-2a918928 — `2a918928-6a55-4d15-8546-522fbc1e5b31` signal-studio / 2 events
- [x] W6-71d89f95 — `71d89f95-6199-444f-91e3-869f147d8766` appydave-plugins / 2 events
- [x] W6-d09d6492 — `d09d6492-6f1c-4ee0-8728-35754fdb2b93` appydave-plugins / 2 events
- [x] W6-a9d80a30 — `a9d80a30-b958-4cd1-befd-05e809df361f` flihub / 3 events
- [x] W6-5ab618e0 — `5ab618e0-77e5-4973-a947-0335601ec988` app.supportsignal.com.au / 3 events
- [x] W6-3ea8cded — `3ea8cded-fb4f-441b-bcec-aa0da34e4970` signal-studio / 3 events
- [x] W6-50cfaae9 — `50cfaae9-3995-4284-ad92-1d90f0caec6b` app.supportsignal.com.au / 4 events
- [x] W6-00184225 — `00184225-bb2e-4563-8bc1-41bf86115743` flihub / 4 events
- [x] W6-3971ea12 — `3971ea12-45d6-4064-8db4-3f1a05d37c7c` signal-studio / 4 events
- [x] W6-8bde85c9 — `8bde85c9-6b8e-40f0-986f-2e00bfe0d2b8` signal-studio / 4 events
- [x] W6-04a70e36 — `04a70e36-d55e-42c6-b002-85bbd0f8b89c` signal-studio / 4 events
- [x] W6-75192ff9 — `75192ff9-616d-4bde-a355-34dfbc92ad52` signal-studio / 7 events
- [x] W6-b887e434 — `b887e434-2e2d-4292-80d8-a71f587e6312` appydave-plugins / 7 events
- [x] W6-7601e97d — `7601e97d-422a-4a11-8881-bee870005a55` appydave-plugins / 7 events
- [x] W6-2f65c956 — `2f65c956-8072-41a2-812b-5c8ab8137f89` signal-studio / 7 events
- [x] W6-6739f1c0 — `6739f1c0-8e94-4ae6-8d70-b5233f1ffd85` flihub / 7 events
- [x] W6-962b823c — `962b823c-4823-4540-a360-e4a6405f9e36` flihub / 7 events
- [x] W6-1c8733c9 — `1c8733c9-55c7-4e9d-a073-b8027b52b6e4` signal-studio / 7 events
- [x] W6-3f580ad1 — `3f580ad1-f68b-4122-abd8-0858183bea3d` flihub / 7 events
- [x] W6-61c7cef6 — `61c7cef6-03aa-4b00-8fb6-7dd4e8b18fd4` appydave-plugins / 8 events

**Agent light-1** — 12 sessions, 12-24 events | prompt.supportsignal.com.au(3), appydave-plugins(3), app.supportsignal.com.au(2), signal-studio(2), flihub(1), brains(1)

- [x] W6-f9c4d2e6 — `f9c4d2e6-4f3b-4608-81d7-22432c1bb597` prompt.supportsignal.com.au / 12 events
- [x] W6-d0799256 — `d0799256-83cd-42a8-89b9-9c67fd024b70` app.supportsignal.com.au / 13 events
- [x] W6-e5198554 — `e5198554-a9dc-4adb-9799-0e76339fb162` appydave-plugins / 13 events
- [x] W6-ce19a727 — `ce19a727-8fd6-4a97-a486-260021d2d5f6` flihub / 14 events
- [x] W6-1422b159 — `1422b159-8224-4053-b1fb-1f1bc6b5abfb` appydave-plugins / 15 events
- [x] W6-44d74deb — `44d74deb-f687-421a-9fa5-27bf52a9f04c` prompt.supportsignal.com.au / 19 events
- [x] W6-87ea6053 — `87ea6053-b5a2-45a8-b394-c6bc5d96e89f` signal-studio / 20 events
- [x] W6-4278b993 — `4278b993-017c-462f-ade6-66a9867b3f49` brains / 20 events
- [x] W6-04fd1cd3 — `04fd1cd3-d9b7-40ab-a212-cef5231e174b` app.supportsignal.com.au / 21 events
- [x] W6-1727cafa — `1727cafa-987d-426b-bb9c-8001bb9ea138` appydave-plugins / 21 events
- [x] W6-b5368be3 — `b5368be3-7de6-4b51-81df-3f6a4524b4cc` prompt.supportsignal.com.au / 21 events
- [x] W6-b06245d7 — `b06245d7-64b0-4c3d-883d-a23b6c4d4a0a` signal-studio / 24 events

**Agent light-2** — 12 sessions, 26-56 events | brains(4), app.supportsignal.com.au(3), flihub(2), appydave-plugins(1), signal-studio(1), prompt.supportsignal.com.au(1)

- [x] W6-fe34a87a — `fe34a87a-38cc-49da-ba1c-946d12b6ae43` brains / 26 events
- [x] W6-30ac4f13 — `30ac4f13-7e3a-4680-9942-05c7e3954258` app.supportsignal.com.au / 27 events
- [x] W6-f5d141ee — `f5d141ee-2d95-47fe-8b27-3ff0d434f3e6` brains / 28 events
- [x] W6-a2e0133d — `a2e0133d-171f-45e0-8cf4-920a68ec0247` brains / 30 events
- [x] W6-8a7c8853 — `8a7c8853-ea0d-4533-916a-6d7d5fbd86f8` appydave-plugins / 32 events
- [x] W6-a9f68828 — `a9f68828-ef25-4169-8c4c-bb3f4c2273f2` flihub / 33 events
- [x] W6-03736413 — `03736413-0712-4fb1-b470-7083e3bb5375` app.supportsignal.com.au / 35 events
- [x] W6-5b6065f9 — `5b6065f9-5c3b-4af9-8f4f-9b373154b2a1` app.supportsignal.com.au / 38 events
- [x] W6-6305b5a1 — `6305b5a1-e14f-4afd-91cd-e2af59ac85ab` flihub / 41 events
- [x] W6-efb535fb — `efb535fb-b7ba-4e7b-990c-ae0ac2c1b6f7` brains / 46 events
- [x] W6-91d6c2cd — `91d6c2cd-6d5b-4615-b3a5-1499923a1963` signal-studio / 52 events
- [x] W6-6feb59a6 — `6feb59a6-6582-4aef-b8d2-a51ada6b9b42` prompt.supportsignal.com.au / 56 events

**Agent moderate-1** — 8 sessions, 61-92 events | app.supportsignal.com.au(3), prompt.supportsignal.com.au(2), flihub(1), appydave-plugins(1), brains(1)

- [x] W6-e3f78527 — `e3f78527-fe9c-4067-ae38-43f522453111` app.supportsignal.com.au / 61 events
- [x] W6-8b8e5899 — `8b8e5899-ed39-40a0-85ca-2c324d24e5a5` app.supportsignal.com.au / 67 events
- [x] W6-0510f9c2 — `0510f9c2-321d-43d4-ad5c-b1e2d8f2580c` flihub / 71 events
- [x] W6-8eb3a9dc — `8eb3a9dc-f307-4769-a6b0-4228d3aa0a22` appydave-plugins / 71 events
- [x] W6-3722bf8e — `3722bf8e-d944-4a85-84c1-9af8d1d50633` app.supportsignal.com.au / 78 events
- [x] W6-e40cfecd — `e40cfecd-363d-476a-b052-d3bb9c8c7bfb` prompt.supportsignal.com.au / 80 events
- [x] W6-5abfd4f1 — `5abfd4f1-4704-4465-99df-504763d76cb6` prompt.supportsignal.com.au / 88 events
- [x] W6-33f0048e — `33f0048e-db26-436a-a1a8-77b3b31f0d1f` brains / 92 events

**Agent moderate-2** — 8 sessions, 95-117 events | signal-studio(2), prompt.supportsignal.com.au(2), brains(2), flihub(1), app.supportsignal.com.au(1)

- [x] W6-69424780 — `69424780-cac4-4277-91f7-8c5470fc17d7` signal-studio / 95 events
- [x] W6-e560d248 — `e560d248-8091-46b6-9046-a1c79a70315b` prompt.supportsignal.com.au / 96 events
- [x] W6-03c0efb5 — `03c0efb5-7875-40a6-9836-31ea33192809` brains / 97 events
- [x] W6-27e99b38 — `27e99b38-753f-4679-9e67-5833a85ab712` flihub / 99 events
- [x] W6-64410d3b — `64410d3b-b25a-4b0e-8018-cd50ac77222e` prompt.supportsignal.com.au / 100 events
- [x] W6-08152bc4 — `08152bc4-48eb-4395-b42b-518db6f20297` app.supportsignal.com.au / 106 events
- [x] W6-de52510d — `de52510d-64e0-40d9-9357-3d2eb087d394` brains / 106 events
- [x] W6-698ddfb2 — `698ddfb2-3e45-4e5a-98dc-6685b1d42bb3` signal-studio / 117 events

**Agent moderate-3** — 6 sessions, 121-190 events | signal-studio(2), app.supportsignal.com.au(2), brains(1), flihub(1)

- [x] W6-95575dbb — `95575dbb-7d6a-4014-9fa3-0d8225da18a6` signal-studio / 121 events
- [x] W6-23582e93 — `23582e93-bb18-42a3-9450-c1444a759891` signal-studio / 129 events
- [x] W6-150882c0 — `150882c0-ea28-4e62-9e7c-bf42af9081b4` app.supportsignal.com.au / 149 events
- [x] W6-50fbca33 — `50fbca33-b254-466f-87f0-bdfa560863a6` app.supportsignal.com.au / 162 events
- [x] W6-171ad14c — `171ad14c-96be-483e-8c24-840c320d38be` brains / 165 events
- [x] W6-410fcd3f — `410fcd3f-cfe6-4eb7-9a27-8a0b2a4abaf2` flihub / 190 events

**Agent heavy-1** — 5 sessions, 229-247 events | flihub(1), signal-studio(1), brains(1), app.supportsignal.com.au(1), angeleye(1)

- [x] W6-cda1edc2 — `cda1edc2-12ce-4b99-bd89-f791ce07a6e7` flihub / 229 events
- [x] W6-233c15fd — `233c15fd-751e-49f4-8987-8e294c5a32f1` signal-studio / 229 events
- [x] W6-120c7392 — `120c7392-b065-4e92-891c-18e46e5e04fc` brains / 238 events
- [x] W6-3701e9b8 — `3701e9b8-8004-4ecb-8865-68c6f5b2b968` app.supportsignal.com.au / 239 events
- [x] W6-ae9b4bb4 — `ae9b4bb4-b3cd-43e6-992d-f7c7698af398` angeleye / 247 events

**Agent heavy-2** — 5 sessions, 261-318 events | signal-studio(2), prompt.supportsignal.com.au(1), brains(1), flihub(1)

- [x] W6-65f77723 — `65f77723-c8a2-49a5-a597-0e6d3a1ed85a` signal-studio / 261 events
- [x] W6-24d71c92 — `24d71c92-b59c-4617-8c8b-191533ecb3fc` signal-studio / 263 events
- [x] W6-76e2b0c7 — `76e2b0c7-86ea-4174-bad5-bc9a07b60850` prompt.supportsignal.com.au / 266 events
- [x] W6-f1ee6fea — `f1ee6fea-0f86-4bca-92e6-c887599d957d` brains / 283 events
- [x] W6-26d4475f — `26d4475f-8673-443f-a8f7-8e6ac22d0c06` flihub / 318 events

**Agent marathon-1** — 1 sessions, 536-536 events | angeleye(1)

- [x] W6-99574b7a — `99574b7a-1ff1-489c-a699-da08cb1df7d5` angeleye / 536 events

### Wave 5 — Scale-up: 40 sessions across 4 groups (v2 schema + pre-computed shapes + analysis lenses)

**Improvements over wave 4**: Pre-computed session shapes (compute-session-shape.py), v2 schema with structured classifiers/predicates/observations, analysis lenses catalog, 40 sessions per wave.

**Group A: brains (diverse tool patterns)** — 287 unanalysed brains sessions. Sample 10 with mixed/bash-heavy/edit-heavy patterns.

- [x] W5-A01 — `c6f3306c` brains / micro → ORIENTATION.project_inventory_query. Quick "What projects do I have?" voice question.
- [x] W5-A02 — `2cda33b1` brains / micro → RESEARCH.asset_search. "Do we have Dynamous transcripts?" Glob+Bash search.
- [x] W5-A03 — `0adf7bf5` brains / micro → ORIENTATION.quick_utility. Value Canvas timezone conversion. CWD incidental.
- [x] W5-A04 — `7cf5cc25` brains / 41 events → RESEARCH.architecture_comparison. Cole Medin dynamous-engine exploration. Failed /focu skill typo.
- [x] W5-A05 — `71f1b899` brains / micro → ORIENTATION.project_path_lookup. Voice "AI-gentive" = AIgentive folder lookup.
- [x] W5-A06 — `66b802a7` brains / 11 events → DEBUG.tool_install. Debugging `claude skill install` hanging. CWD incidental.
- [x] W5-A07 — `4e3b83f7` brains / 130 events → KNOWLEDGE.brain_curation. Brain-librarian-checklist process doc. 777min wall.
- [x] W5-A08 — `d0d48243` brains / 49 events → KNOWLEDGE.architecture_planning. Voice-dictated agentic-os vertical slice design.
- [x] W5-A09 — `41024780` brains / 55 events → KNOWLEDGE.brain_synthesis. Kie-ai brain authoring with Playwright web research. 706min wall.
- [x] W5-A10 — `3646e49e` brains / 10 events → KNOWLEDGE.til_entry. TIL about Android share_to intent. Efficient micro session.

**Group B: prompt.supportsignal (diverse tool patterns)** — 126 unanalysed. Sample 10.

- [x] W5-B01 — `b3ae2275` prompt.supportsignal / 74 events → MIXED. AWB round-22 review + live Angela meeting support + moments-theme design.
- [x] W5-B02 — `827700ca` prompt.supportsignal / micro → META.smoke_test. "What is 2+2?" CWD incidental.
- [x] W5-B03 — `18f1a890` prompt.supportsignal / micro → RESEARCH.conceptual_learning. Voice worktree question. CWD incidental.
- [x] W5-B04 — `116f3f7c` prompt.supportsignal / 83 events → MIXED. `*execute 105` POEM executor run then architecture design pivot.
- [x] W5-B05 — `32fbfde9` prompt.supportsignal / 84 events → BUILD. WUI architecture docs + Ralphy plan + Oscar build. 398min wall.
- [x] W5-B06 — `78a153a0` prompt.supportsignal / 53 events → OPERATIONS. Cross-project POEM OS architecture cleanup across 3 repos.
- [x] W5-B07 — `37256037` prompt.supportsignal / 66 events → OPERATIONS.poem_execution. `*run 106` verification after severity bug fixes.
- [x] W5-B08 — `92ea2610` prompt.supportsignal / 69 events → OPERATIONS.poem_execution. First `*run 106` — discovered severity pass-through bugs.
- [x] W5-B09 — `c313d9f7` prompt.supportsignal / 21 events → KNOWLEDGE.post_mortem_analysis. Oscar behavioral analysis across rounds 105-107.
- [x] W5-B10 — `439bd71d` prompt.supportsignal / 59 events → BUILD.prompt_engineering. Severity classifier design + Q&A integration.

**Group C: Never-seen projects** — one session from each new project.

- [x] W5-C01 — `a24496e0` ad / 40 events → SKILL.skill_authoring. Creating capture-context skill. CWD incidental (monorepo root).
- [x] W5-C02 — `4a151d10` ad-agent_architecture / micro → ORIENTATION.startup_command_lookup. "How do I run bin server" voice question.
- [x] W5-C03 — `e868366b` angeleye / 1678 events → BUILD.campaign (marathon). Meta-recursive: AngelEye analysing itself via Ralphy. 5 waves, 71 subagents, 3 compactions.
- [x] W5-C04 — `b34be0e9` ansible / 131 events → OPERATIONS.mac_provisioning. Homebrew cask/formula provisioning across 3 Macs. 936min wall.
- [x] W5-C05 — `cfa7f6a3` apps / 238 events → BUILD.full_lifecycle_build. ThumbRack: BA → naming → AppyStack scaffold → Ralphy plan+build → Playwright UAT.
- [x] W5-C06 — `b81e4057` appydave.com / 103 events → BRAND.design_exploration. Mochaccino 10 design variants with 5 parallel subagents + Playwright review.
- [x] W5-C07 — `e27dd3c2` beauty-and-joy / 103 events → BRAND.brand_knowledge_capture. Joy Juice shop: menu recipes, pricing, branding.json, taglines.
- [x] W5-C08 — `48465caa` brain-cowork-upgrade / 87 events → PLANNING.brain_migration. Evaluating Anthropic Cowork vs brains/ system. Copy scripts + gap analysis.
- [x] W5-C09 — `1d35b92b` brain-dynamous / micro → META.automated_heartbeat. Dynamous HEARTBEAT check with Gmail/Calendar/Asana/Slack context.
- [x] W5-C10 — `eef93c68` clients / 12 events → OPERATIONS.repo_setup. Creating private repos for client directories.

**Group D: Structural oddballs** — davidcruwys, ad root, unknown, dev, tmp, worktrees.

- [x] W5-D01 — `02437ab7` davidcruwys / 61 events → SYSOPS.drive_maintenance. External drive dedup/cleanup. Voice-dictated.
- [x] W5-D02 — `4053fd5c` davidcruwys / 21 events → OPERATIONS.tool_configuration. Claude Code trust/permissions config. "director" = "directory" voice artifact.
- [x] W5-D03 — `22b1033f` ad / 8 events → RESEARCH.hardware_research. M5 Mini release date web search. CWD monorepo root incidental.
- [x] W5-D04 — `2aa2b5d7` ad / 16 events → ORIENTATION.project_inventory. Brand Dave ecosystem exploration. CWD monorepo root incidental.
- [x] W5-D05 — `bbc86dc1` angeleye / 77 events → META.self_referential. AngelEye skill restructuring + observer fixes. "Unknown" project label was wrong.
- [x] W5-D06 — `ebd170c5` angeleye / 8 events → SETUP.settings_configuration. Claude Code settings.json tweak. "Unknown" project label was wrong.
- [x] W5-D07 — `32566acd` dev / 9 events → SYSOPS.git_configuration. Global gitignore setup. User pastes commands.
- [x] W5-D08 — `67c6f182` dev / 32 events → OPERATIONS.cross_machine_sync. Sites directory missing, cross-machine rsync. Frustration detected.
- [x] W5-D09 — `7536c619` tmp / 1 event → META.accidental_launch. Single "x" from /tmp. Junk.
- [x] W5-D10 — `ae3beefe` worktrees / 23 events → REVIEW.mock_data_review. SupportSignal NDIS mock data review. CWD worktree artifact, incidental.

**Wave 5 focus areas**:

1. Brains BUILD misclassification rate — do more brains sessions confirm 0% accuracy?
2. prompt.supportsignal task-heavy pattern — what are `*run 106` / `*execute 105` sessions?
3. Never-seen project diversity — what types emerge from beauty-and-joy, apps, appydave.com?
4. Structural oddball patterns — what happens in home dir, monorepo root, /tmp, worktrees?
5. Micro session taxonomy — are 1-4 event sessions junk, orientation, or something else?
6. Pre-computed shape effectiveness — do agents produce better classifications with shape data?

### Wave 4 — Type exhaustion + signal-studio depth (20 sessions)

**Group A: ORIENTATION sessions** — only 3 analysed so far. 20 remaining, all read-heavy. Take the 8 largest to build subtype variety.

- [x] W4-01 — `724b1165` prompt.supportsignal / ORIENTATION confirmed → orientation.artifact_retrieval. Oscar `*run 107` orchestration: 3 agent waves (question gen → predicate eval → observation). Context compaction mid-run. 18h gap then stale revival.
- [x] W4-02 — `c3bd8d95` v-appydave / ORIENTATION confirmed → orientation.requirements. Third session in textarea failure arc (links W3-20, W4-07). Cross-project reference read. Explicit "don't act on this" context injection.
- [x] W4-03 — `ecaced22` prompt.supportsignal / ORIENTATION confirmed → orientation.bookend. 2-prompt, 3-min cross-project verification. Prior session output pasted as briefing. Zero mutations.
- [x] W4-04 — `f6581769` app.supportsignal / ORIENTATION confirmed → orientation.cold_start. Pre-prompt autonomous burst (17 tools before first message). Prompt is bare `11.0` task ref. "Deal with it" delegation pattern.
- [x] W4-05 — `38a1c160` prompt.supportsignal / ORIENTATION confirmed → orientation.artifact_retrieval. Terminology probe opener. Documentation archaeology across AWB/POEM docs. 20h gap then 3-min bookend close.
- [x] W4-06 — `48b3197d` app.supportsignal / ORIENTATION confirmed → orientation.artifact_retrieval. 3-min session, single `11.0` prompt. Cold_start → skill-driven parallel reads → single Write.
- [x] W4-07 — `c67c4aac` v-appydave / ORIENTATION confirmed → orientation.artifact_retrieval. x-ui-rows gap identification. Precursor to W3-20 unauthorised edit. Cold-context Skill recovery after 19.5h gap.
- [x] W4-08 — `1604fbd4` prompt.supportsignal / ORIENTATION confirmed → orientation.artifact_retrieval. POEM recipe `*run 106`. Codex MCP for recipe resolution. 5 Task agents dispatched in 51s — launch-pad pattern.

**Group B: KNOWLEDGE sessions** — only 4 analysed. 17 remaining, all brains/read-heavy. Take the 5 largest.

- [x] W4-09 — `58f43cdd` brains / KNOWLEDGE → brand.speaker_submission reclassified. Digital Stage Summit speaker application form. Claude as brand copywriter. No brain files updated. Form-filling assistant pattern. New parent type proposed: BRAND.
- [x] W4-10 — `62b18cd4` brains / KNOWLEDGE confirmed → knowledge.brain_curation. Ansible companion run: Ansible execution + brain file reading + drift documentation. Brain: ansible.
- [x] W4-11 — `6a2cef50` brains / KNOWLEDGE confirmed → knowledge.brain_synthesis. NotebookLM dataset assembly: 3 deliverables produced. Write+Bash(open) delivery pattern. Skill-gap signal (ToolSearch for missing Gather skill). Brain: ansible.
- [x] W4-12 — `b6c11972` brains / KNOWLEDGE confirmed → knowledge.survey_and_implement. 36-brain taxonomy survey + category implementation via Task agent. 13h gap then commit close.
- [x] W4-13 — `9476dfb9` brains / KNOWLEDGE → knowledge.personal_advisory. Philippines monitor purchase for family. Brain search found nothing → Playwright live e-commerce browsing. No brain files written. Classifier signals: Playwright=external_research, personal names+consumer topic, empty search=knowledge gap.

**Group C: signal-studio BUILD** — 44 remaining, 0 analysed as BUILD. Take 3 with different tool patterns.

- [x] W4-14 — `9fe2fca6` signal-studio / BUILD confirmed → build.campaign. 6h product dev: entity CRUD edit flows, relationship filtering, dashboard live counts. 106 Edit + 28 Write. 2 context-limit handovers.
- [x] W4-15 — `da13f544` signal-studio / BUILD → debug.e2e_campaign reclassified. 14h E2E debugging marathon. 182 Bash, 24 Agent spawns, 7 CronCreate/Delete pairs, 3 context continuations. Heavy user frustration. No feature code written.
- [x] W4-16 — `f9a685e2` signal-studio / BUILD partially correct → MIXED (BUILD + UI_REVIEW + DESIGN_EXPLORATION). 19.5h multi-phase: AWB integration build → Playwright visual audit (101 MCP events) → 17 landing page design variants. New parent types: UI_REVIEW, DESIGN_EXPLORATION.

**Group D: Oddball projects** — "ad" root, "davidcruwys" personal dir, remaining RESEARCH.

- [x] W4-17 — `e73d7fc7` ad / BUILD → research.external_intake reclassified. Zero tool calls, 2 prompts. Pasted failed git clone + full Dynamous Engine README. Monorepo root + zero tools = not BUILD.
- [x] W4-18 — `0aabff8e` davidcruwys / BUILD → sysops.multi_machine_sync reclassified. Cross-Mac repo gap analysis + sync. 24 Bash + 1 Write (removal script). 12.6h gap then hardware Q&A tail. Home-dir = sysops signal.
- [x] W4-19 — `bb290809` brains / RESEARCH confirmed → research.quick_lookup. Single-prompt Loom lookup. 1 user_prompt + 2 brave_web_search + 3 WebFetch. cwd=brains incidental.
- [x] W4-20 — `fddf773a` prompt.supportsignal / RESEARCH confirmed → research.status_check. 3-min Anthropic uptime check. WebFetch×2 + brave_news_search×2 in 6-second burst. cwd=prompt.ss incidental.

**Wave 4 focus areas**:

1. ORIENTATION subtype variety — are they all cold_start, or are there distinct patterns?
2. KNOWLEDGE subtypes for brains sessions — brain_update vs advisory vs ingestion vs something new?
3. Signal-studio BUILD accuracy — does BUILD hold up on the primary product app?
4. What happens at the monorepo root ("ad") and personal dir ("davidcruwys")?
5. Exhaust remaining RESEARCH and ORIENTATION pools

### Wave 3 — Gap filling (20 sessions, underrepresented types and unseen projects)

**Group A: TEST sessions** — only 1 TEST session analysed so far (W1-07). All 4 remaining are playwright-heavy. Are they all UAT, or are there subtypes?

- [x] W3-01 — `798c3fc6` signal-studio / TEST confirmed → test.uat_with_inline_debug. Full UAT arc: handover → CronCreate monitoring → Playwright UAT → bug discovery → code fixes → retest. 474 events, 4 context compactions in 48min.
- [x] W3-02 — `ee880a6a` signal-studio / TEST confirmed → test.uat_playwright_sequential. 8 workflow narratives run sequentially. 36-min autonomous gap. Loop observability failure flagged. 9 backlog items found.
- [x] W3-03 — `1fe96bc7` signal-studio / TEST confirmed → test.uat_narrative. Claude reads workflow narratives and executes step-by-step via Playwright. "Stop and wait" protocol articulated.
- [x] W3-04 — `54577c11` appydave-plugins / TEST → skill.creation reclassified. Playwright used to scrape sola.day calendar + automate event creation, then encoded as new skill. Not testing at all.

**Group B: RESEARCH sessions** — only 1 RESEARCH session analysed (W1-04). All remaining are websearch-heavy. Different from W1-04's read-only Bash research.

- [x] W3-05 — `1c87debe` brains / RESEARCH confirmed → research.operational. Philippines hardware procurement research. No artifacts produced. cwd=brains is false project signal.
- [x] W3-06 — `b9d30d9f` brains / RESEARCH confirmed → research.knowledge_capture. Web research on Agent SDK/loop → brain file + CLAUDE.md write. Brain: anthropic-claude/claude-code.
- [x] W3-07 — `3a24ba02` signal-studio / RESEARCH confirmed → research.dev_env_troubleshooting. Copilot removal + Ecamm camera fix. False project attribution — cwd=signal-studio but zero project files touched.

**Group C: Unseen projects** — 5 projects never analysed. Do they show the same BUILD over-classification?

- [x] W3-08 — `4c858f8a` appystack / BUILD confirmed → build.template_maintenance. Nodemon/data-dir fix propagated to CLI generator + npm publish. Cross-paste injection (100KB deckhand transcript in prompt). Voice: "dots" = "CLAUDE.md".
- [x] W3-09 — `2421e5c5` appystack / BUILD confirmed → build.audit_publish. Three phases: gap analysis → Ralphy campaign in worktree → npm publish with OTP friction. Context rollover detection marker found.
- [x] W3-10 — `d363ca82` appydave-plugins / BUILD → skill.design reclassified. Ralphy 4-mode taxonomy established. David pastes live Ralphy transcripts for analysis. All edits target SKILL.md. "Black box" discoverability problem articulated.
- [x] W3-11 — `55dde42d` appydave-plugins / BUILD → skill.migration reclassified. Ralphy migrated from global ~/.claude/skills/ to plugin repo. Brain-to-plugin sync audit. Hallucination correction pattern.
- [x] W3-12 — `c17de345` v-appydave / BUILD confirmed → build.config. POEM YLO workflow YAML + 20 JSON schemas. 6 events but 85KB (58KB transcript embedded in single prompt).
- [x] W3-13 — `a4dd0a45` ansible / BUILD → operations.mac_provisioning reclassified. Ansible playbooks for 3 macOS machines. Read/Edit symmetry = config authoring signal. ansible/\* should default OPERATIONS.
- [x] W3-14 — `d5fa9524` ansible / BUILD → operations.provisioning_debug reclassified. Run/fail/paste cycle debugging mac-mini-m2. Frustration burst cluster (4 prompts in 3min). Next-day commit.
- [x] W3-15 — `830bd3ac` brain-dynamous / BUILD confirmed → setup.onboarding_and_integration. Personal AI OS scaffold: bootstrap interview → OAuth wiring → heartbeat test. SOUL.md/USER.md identity files.
- [x] W3-16 — `8fe1e952` brain-dynamous / BUILD → meta.compaction_flush reclassified. Single event: pre-compaction memory flush. Zero real prompts, 15-second session. Classifier must detect flush events early.

**Group D: prompt.supportsignal breadth + v-appydave** — 131 prompt.ss sessions, only 1 analysed. Pick 4 with different tool patterns.

- [x] W3-17 — `72977bff` prompt.supportsignal / BUILD confirmed → build.debug_loop. 7h POEM Executor debugging. 53 prompts, paste-error→fix→rerun cycle. No planning artifacts. Fixes not sticking across attempts.
- [x] W3-18 — `65e82b48` prompt.supportsignal / BUILD confirmed → build.dsl_refinement. POEM executor output bugs (nested JSON vs flat strings). 71 Edits, 64 Bash. Cross-session paste from POEM Alex agent.
- [x] W3-19 — `05ce5c2a` prompt.supportsignal / BUILD corrected → build.iterative_design. bash-heavy was inflated by worktree/git overhead. Voice-driven UX feedback. Design constraints lost across compaction — explicit frustration.
- [x] W3-20 — `bb54ff44` v-appydave / BUILD → review.refine reclassified. YLO workflow audit + targeted fixes. Unauthorised edit pattern: Claude edited before being asked.

**Wave 3 focus areas**:

1. TEST subtype variety — is everything `test.uat_debug_hybrid` or are there pure automation, regression, integration subtypes?
2. RESEARCH subtypes — websearch-heavy vs read-heavy (W1-04). Different workflows?
3. Unseen project BUILD accuracy — does BUILD hold up on appystack, plugins, ansible?
4. prompt.supportsignal is the largest unanalysed project (131 sessions). What types are hiding in there?
5. Continue updating subtype candidate counts

### Wave 2 — Broader sample (20 sessions, targeted gaps)

**Group A: Ralphy sessions** — can we detect plan/build/extend modes?

- [x] W2-01 — `d08d1b10` flihub / BUILD confirmed → build.campaign. Ralphy Build mode, 2 campaign cycles, 21 background agents. Post-build quality audit reflex.
- [x] W2-02 — `699cab47` digital-stage-summit / BUILD confirmed → build.campaign. Ralphy Extend→Build, 4 parallel agents, quality gate failure caught by user.
- [x] W2-03 — `99b75591` digital-stage-summit / BUILD confirmed → build.campaign. Full Ralphy lifecycle. Task-notification callbacks counted as prompts (shouldn't be). Agent visibility confusion.
- [x] W2-04 — `3461a2ff` digital-stage-summit / BUILD confirmed → build.campaign. Voice brain dump opening, provenance chain teaching moment, /ralphy invoked mid-session.
- [x] W2-05 — `79cfee06` angeleye / BUILD confirmed → build.campaign. Cleanest Ralphy Build: 5 features, 3 waves, 5 worktree agents. Meta: AngelEye building itself.

**Group B: Brains sessions** — confirm misclassification, detect which brain subfolder

- [x] W2-06 — `4e8c5897` brains / BUILD → knowledge.brain_update + advisory pivot. 4-day session: brain refresh → John PM advisory → Sally UX advisory → meta-reflection. Canonical Sally/Advisor pattern. 101 user prompts. Brain: bmad-method.
- [x] W2-07 — `2ed25517` brains / TEST → research.web_scraping. 466 Playwright calls for Circle login + Zoom transcript download, not UAT. Brain: cole-medin. Novel "brain discoverability eval loop" pattern. Context exhausted 9 times.
- [x] W2-08 — `057682ee` brains / BUILD → knowledge.brain_ingestion. Agentic-os brain update via 5 Task agents + 28 Edits. project_dir=brains confirms BUILD override.
- [x] W2-09 — `904f0069` brains / KNOWLEDGE → reclassified. /rename-images skill renaming Ecamm PNGs in Downloads. No brain files touched. project_dir false positive — needs file-touch guard.
- [x] W2-10 — `40c44dee` brains / BUILD → knowledge.brain_update. Port registry consolidation across multiple brains. Voice artifacts: "answer ball"=AngelEye.

**Group C: Skill-invocation sessions** — skill name as type signal

- [x] W2-11 — `4693345b` flihub / BUILD confirmed → build.campaign. /flivideo:dev opener + handover batch execution + /ralphy Project Heal tail. 34 Edits, 3 commits.
- [x] W2-12 — `dc3e550b` app.supportsignal / BUILD → knowledge.skill_authoring. /bmad-help → /bmad-create-prd 12-step PRD creation. All 42 Edits target markdown, not code. "Session-as-bookmark" reuse days later.
- [x] W2-13 — `28779669` app.supportsignal / BUILD → knowledge.pattern_design. /bmad-architect → /bmad-create-epics. Multi-persona (Winston→Bob) with invisible handoff. 48% correction rate.
- [x] W2-14 — `2ddee32c` brains / BUILD → ops.machine_provision. /focus ansible → 2h live provisioning Jan's Mac Mini over Tailscale. Brain: ansible. "Human relay" pattern (David between Claude and Jan).
- [x] W2-15 — `73dff618` app.supportsignal / BUILD → orientation.requirements. /bmad-sprint-status → /bmad-create-story. Abridge override pattern. Story spec produced, not code.

**Group D: Unseen projects** — breadth across the ecosystem

- [x] W2-16 — `7bef7cb3` deckhand / JUNK → orientation.loop_runaway. /loop cron fired every 60s for 10h generating ASCII art comedy. 6MB of zero-productive output. Registry correctly flagged is_junk.
- [x] W2-17 — `59aedbad` prompt.supportsignal / BUILD confirmed → build.iterative_design. AWA UI iteration with Playwright visual verification, voice-driven design critique, 3 context compactions. Build-then-heal tail.
- [x] W2-18 — `b61d5adf` outputs / BUILD confirmed → build.content_production. Digital Stage Summit talk variants: 15 HTML mockups via 12 subagents, Playwright visual QA, JSON-canonical data pattern. Brain: summits/digital-stage-2026.
- [x] W2-19 — `d154c0ef` supportsignal-v2-planning / BUILD → planning.decision_writeback. Pure planning repo. Strategic decisions + BMAD PRD cross-reference + explicit writeback to planning docs. Dual-session verification pattern.
- [x] W2-20 — `d7ca10ed` flideck / BUILD confirmed → build.migration. 519-slide harness migration, strongest Ralphy Mode 3 example. 4 context compactions, pixel-diff Playwright pipeline, 47h wall clock.

**Wave 2 focus areas**:

1. Ralphy mode detection (plan vs build vs extend)
2. Which brain subfolder — not just "brains"
3. Skill name as classification signal (cross-ref skill-usage-audit.json)
4. Do unseen projects show the same BUILD over-classification?
5. Update subtype candidate counts

## In Progress

## Complete

### Wave 1a — calibration (smaller sessions)

- [x] W1-05 — `30391e74` lars / ORIENTATION confirmed → orientation.cold_start. Bookend session pattern (context prep → real-world meeting → memory capture). Proposed subtype: orientation.bookend.
- [x] W1-08 — `11553588` angeleye / BUILD → ORIENTATION reclassified. 77-second artifact retrieval. Read-only Bash fooled classifier. Proposed: Bash read/write split, orientation.artifact_retrieval subtype.
- [x] W1-02 — `78f31f8c` brains / BUILD → ORIENTATION reclassified. Morning triage: /focus + /radar + OMI ingestion. Zero build execution. project_dir=brains should block BUILD. Proposed: orientation.morning_triage subtype.
- [x] W1-07 — `a080427c` thumbrack / BUILD → TEST reclassified. UAT debug loop with 58 Playwright + 33 reactive Edits. Regression loop, escalating frustration. Proposed: test.uat_debug_hybrid subtype.

### Wave 1b — larger sessions

- [x] W1-01 — `59a8f9ac` brains / BUILD → KNOWLEDGE reclassified. Genesis session for analysis campaign. Designed methodology, schema versioning, brain-app split. Proposed: knowledge.methodology_design subtype.
- [x] W1-06 — `bb44829b` signal-studio / BUILD confirmed. Wave 25 schema migration with worktree parallel agents + Playwright verification. Proposed: build.migration subtype.
- [x] W1-04 — `6ba65a37` app.supportsignal / BUILD → RESEARCH reclassified. 72/73 Bash read-only. 6 background subagents scanning 3 codebases. Produced BMAD Relay design doc. Proposed: research.workflow_design subtype.
- [x] W1-03 — `a4fd902a` app.supportsignal / ORIENTATION → KNOWLEDGE reclassified. Multi-day BMAD oversight advisor. Pastes from other Claude sessions for review. 504KB driven by subagent MCP reports. Proposed: knowledge.advisory subtype.

## Failed / Needs Retry

## Notes & Decisions

- Session data read from source machines, never copied. M4 Mini: `~/.claude/angeleye/sessions/`. M4 Pro: `ssh MacBook-Pro.local` same path.
- Knowledge output → `~/dev/ad/brains/angeleye/analysis/`
- Session index → `~/dev/ad/brains/angeleye/analysis/session-index.jsonl`
- Existing conversation-analysis-framework.md used as seed reference, not locked structure. Goal is to produce a more advanced replacement.
- 662/777 sessions classified BUILD (85%) — investigate whether this is overclassification
- Archived sessions (size -1) need to be read from `~/.claude/angeleye/archive/` instead
