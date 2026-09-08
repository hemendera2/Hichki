---
name: hichki-reliability
description: Use at the start of every Hichki coding/resume/debugging session and whenever stale context, hallucinated progress, repeated tool loops, branch confusion, false runtime claims, or cross-project contamination are possible.
---

# Hichki Reliability Skill

Use this skill before implementation in every fresh Hichki session.

## Scope lock

Repository: `hemendera2/Hichki`
Active engineering branch: resolve from current `PROJECT_STATUS.md`, then resolve its live HEAD again.
Product: **Hichki only**.

Never import Stock Munim, digital-card, restaurant, trading, personal, or any other project's state, requirements, commits, tests, deployments, credentials, screenshots, Supabase/Netlify evidence or prompts into Hichki.

A mixed chat is not a mixed project. Extract only the Hichki-specific instruction relevant to this repository.

## Mandatory bootstrap

1. Resolve the live HEAD of the active Hichki engineering branch.
2. Read root `AGENTS.md`.
3. Read `docs/AGENT_RELIABILITY_PROTOCOL.md`.
4. Read `HICHKI_MASTER_PROJECT_CONTEXT.md`, `PROJECT_STATUS.md`, `SECURITY_STATUS.md`, `NEW_CHAT_MASTER_PROMPT.md`.
5. Inspect exact current source/tests/config for the active blocker.
6. Preserve unrelated work; do not silently fall back to `main`.

Old chat SHAs and old Netlify deploys are `HISTORICAL` until revalidated.

## Evidence contract

Use explicit states:

- `SOURCE-CONFIRMED`
- `TEST-PASS`
- `RUNTIME-PASS`
- `DEPLOYED`
- `NOT-RUN`
- `HISTORICAL`
- `BLOCKED`

Never convert source inspection to runtime proof.
Never describe a stale/manual Netlify deployment as containing newer branch source.
Never claim test counts, CI status, deploy state, Socket endpoint availability, mobile build success or completion without exact evidence.

## Anti-stuck / anti-loop

After the same essential failure twice without new evidence:

1. classify `AUTH`, `NETWORK`, `TOOL_LIMIT`, `MISSING_RUNTIME`, `SOURCE_DEFECT`, `TEST_DEFECT` or `ENVIRONMENT`;
2. stop repeating the same path;
3. pivot to another exact-source/runtime route;
4. continue another independent blocker when possible;
5. record the unresolved blocker durably.

## Working loop

`AUDIT → ROOT CAUSE → FIX → VERIFY → REGRESSION CHECK → UPDATE PROJECT STATE → NEXT BLOCKER`

Use concise truthful progress:

- `WORKING — <specific task>`
- `BLOCKED — <specific dependency>`
- `TASK COMPLETE — <batch>` only after durable evidence exists.

## Completion gate

Before `TASK COMPLETE`, verify:

1. current source and branch were resolved;
2. claimed tests actually ran;
3. unrun gates are labeled;
4. no stale deploy/runtime is presented as current;
5. no other project's state was imported;
6. Hichki security/realtime invariants remain intact;
7. project status was reconciled;
8. next action is explicit enough for a fresh chat to resume without owner re-explaining history.

If any answer is no, the batch is not complete.