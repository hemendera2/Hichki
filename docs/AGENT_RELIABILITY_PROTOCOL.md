# Hichki Agent Reliability Protocol

Status: `MANDATORY`

Purpose: make Hichki resumable across chats without hallucinated progress, stale branch work, repeated tool loops, false runtime claims or loss of source/runtime truth.

## 1. Canonical source and branch

Repository: `hemendera2/Hichki`.

Current engineering completion branch: `feat/hichki-completion-20260908-final` until a later explicit repository checkpoint supersedes it. `main` is the release baseline, not permission to discard newer completion-branch work.

At the start of every fresh session:

1. resolve current branch HEAD again;
2. confirm the intended branch before writing;
3. read `AGENTS.md`;
4. read `HICHKI_MASTER_PROJECT_CONTEXT.md`, `PROJECT_STATUS.md`, `SECURITY_STATUS.md`, `NEW_CHAT_MASTER_PROMPT.md` and focused implementation evidence;
5. inspect actual source/tests/config for the active blocker.

An old chat SHA is only a checkpoint. Never call it current without re-resolution.

## 2. Truth hierarchy

1. exact current-branch source/config/migrations/tests;
2. executable exact-source verification;
3. live Supabase/Netlify/Socket runtime evidence obtained in the current session or explicitly labeled historical;
4. current project status/security/context documents;
5. prior chat summaries.

Chat memory never overrides contradictory repository/runtime evidence.

## 3. Evidence labels

Use precise labels:

- `SOURCE-CONFIRMED`: exact source inspected.
- `TEST-PASS`: named command actually ran and passed against the claimed source.
- `RUNTIME-PASS`: real runtime behavior was exercised and passed.
- `DEPLOYED`: a concrete deployment ID/URL corresponds to the claimed source.
- `NOT-RUN`: gate was not executed.
- `HISTORICAL`: evidence is retained from an older checkpoint and not freshly reverified.
- `BLOCKED`: a named dependency prevents execution.

Never promote source inspection to runtime verification. Never describe the old manual Netlify deploy as containing newer branch source.

## 4. Hichki architecture invariants

- Supabase remains Auth + durable Postgres/RLS + private Storage authority.
- Socket.IO is realtime transport/fan-out, not an authorization bypass or alternate source of durable truth.
- The Socket server must validate the caller JWT and respect membership/authorization boundaries.
- Browser/mobile clients never receive `service_role` credentials.
- Durable message creation remains idempotent with stable client identifiers.
- Dual Socket.IO/Supabase delivery must deduplicate deterministically.
- Maintain one authoritative offline retry queue; do not reintroduce competing retry systems.
- Delivered/read receipts, typing and presence must remain membership-scoped.
- Private media access must remain owner/member scoped.
- Notes/Music sharing must not silently weaken chat authorization or persistence semantics.
- Backup/export must not expose private signing/auth secrets.

A test may not be weakened merely to make CI green.

## 5. Anti-hallucination rules

Never invent or assume:

- branch/HEAD state;
- build output;
- Supabase migration state;
- Netlify deployment source;
- Socket.IO endpoint availability;
- authenticated users;
- mobile build success;
- test counts;
- CI results;
- commit/push success.

If evidence is absent, use `UNKNOWN`, `NOT-RUN` or `BLOCKED` and obtain evidence when tools permit it.

Do not say "implemented", "saved", "fixed", "verified", "deployed", "complete" or "production-ready" unless the corresponding durable evidence exists.

## 6. User-command interpretation

The owner may give short Hinglish/voice-input commands.

- Normalize obvious spelling mistakes when the intent is clear.
- `resume`, `continue`, `pending complete` means inspect current repo state and continue; do not restart or scaffold a replacement app.
- Do not ask the owner to repeat history recoverable from repository/context.
- Ask one concise clarification only when ambiguity materially affects security, money, destructive changes, branch/release policy or product behavior.

## 7. Anti-stuck / anti-loop behavior

If the same essential failure happens twice without new evidence:

1. classify it (`AUTH`, `NETWORK`, `TOOL_LIMIT`, `MISSING_RUNTIME`, `SOURCE_DEFECT`, `TEST_DEFECT`, `ENVIRONMENT`);
2. stop repeating the same path;
3. use another exact-source/runtime route if available;
4. continue another independent blocker when possible;
5. record the unresolved blocker in project status/context.

Do not repeatedly retry unavailable git clone, hosted runtime, local mobile SDK, browser automation or provider access when meaningful independent source work remains.

## 8. Progress visibility

For substantial work use concise, truthful notices:

- `WORKING — <specific task>`
- `BLOCKED — <specific dependency>`
- `TASK COMPLETE — <batch>` only after durable evidence exists.

At batch completion include commit SHA, checks actually run, gates not run, remaining blocker and next action.

Never use progress notices to imply a tool is still running after it has already failed.

## 9. Verification gates

Before source-batch completion, run the relevant available checks, including syntax/source-integrity/build guards and focused tests. For production claims additionally require, as relevant:

- Supabase migration/RLS/grant verification;
- authenticated two-user chat acceptance;
- Socket.IO relay + Supabase fallback + duplicate suppression;
- receipts, typing, presence and offline retry;
- Notes/Music share flows;
- production web build from exact source;
- Netlify deployment/source match;
- Android/iOS build and acceptance.

Anything not executed remains `NOT-RUN`.

## 10. Release discipline

Do not merge to `main`, deploy production, mutate customer data or execute provider actions requiring approval unless explicitly authorized under current repository rules.

A request to continue implementation is not automatic release authorization.

## 11. Checkpoint contract

Before ending meaningful unfinished work, update durable project status with:

- repo/branch/HEAD;
- what changed;
- exact commit(s);
- verification actually run;
- gates not run;
- blocker/root cause;
- next dependency order;
- deployment/provider/production mutation status.

A new chat must be able to resume from repository state without the owner re-explaining the project.

## 12. End-of-batch self-check

Before reporting `TASK COMPLETE`, verify internally:

1. current source was inspected;
2. branch/HEAD was resolved;
3. claimed tests actually ran;
4. unrun gates are labeled;
5. no stale deploy/runtime is presented as current;
6. no parallel retry/offline path was accidentally reintroduced;
7. security/RLS/service-role invariants remain intact;
8. project status was reconciled;
9. the next action is explicit enough for a fresh chat to continue.

If any answer is no, the batch is not complete.