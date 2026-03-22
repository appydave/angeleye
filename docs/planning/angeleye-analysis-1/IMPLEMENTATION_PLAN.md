# IMPLEMENTATION_PLAN.md — angeleye-analysis-1

**Goal**: Systematically analyse Claude Code session data across two machines (M4 Mini: 773+, M4 Pro: 409+) to expand the conversation analysis framework with new semantic types, patterns, examples, and detection rules.

**Started**: 2026-03-22
**Target**: Diminishing returns — keep iterating until new passes stop producing novel semantic types and patterns.

**Campaign type**: Analysis (not code build). Work units are session batches, not features. Output is curated knowledge in `~/dev/ad/brains/angeleye/analysis/`.

**Scaling**: Start with 5-8 sessions per wave. Increase logarithmically each round based on human feedback and context window limits. Consider file sizes, not just session count — large JSONL files consume more context.

**Schema evolution**: After every wave, evaluate whether the session index schema needs expansion. Flag to human before changing — back-migration and re-pass may be required.

## Summary

- Total: 268 | Complete: 268 | In Progress: 0 | Pending: 0 | Failed: 0

## In Progress

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
