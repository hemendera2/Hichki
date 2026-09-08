# Hichki Agent Instructions

## Mission

Continue and finish the existing Hichki product. Do not restart, scaffold a replacement, or redesign it into a generic messenger.

Hichki is a local-first personal communication product spanning 1:1 realtime chat, journal/notes, music, Web/PWA, Android and iOS while preserving its existing identity.

## Canonical repository state

Repository: `hemendera2/Hichki`.

Current engineering completion branch: `feat/hichki-completion-20260908-final` until superseded by a newer explicit repository checkpoint. `main` is the release baseline and is not automatically the newest implementation source.

Every fresh chat/session must resolve the live branch HEAD again before making source claims or writes.

Read in this order before implementation:

1. `docs/AGENT_RELIABILITY_PROTOCOL.md`
2. `HICHKI_MASTER_PROJECT_CONTEXT.md`
3. `PROJECT_STATUS.md`
4. `SECURITY_STATUS.md`
5. `NEW_CHAT_MASTER_PROMPT.md`
6. current `README.md` and `package.json`
7. focused source, migrations, workflows and tests for the active task.

Repository code/runtime evidence override old chat summaries. An old SHA is a checkpoint, never proof of the current HEAD.

## Operating loop

Continuously execute:

`AUDIT → ROOT CAUSE → FIX → VERIFY → REGRESSION CHECK → UPDATE PROJECT STATE → NEXT BLOCKER`

Do maximum safe executable work without asking for repeated permission.

Ask only when required for credentials, spending, destructive/customer-data/provider mutation, merge/deploy/release authorization, or a genuine product decision with materially different outcomes.

If one task is blocked, continue another independent executable blocker.

## Reliability contract

`docs/AGENT_RELIABILITY_PROTOCOL.md` is mandatory. It defines exact-source evidence labels, anti-hallucination behavior, anti-loop/stuck handling, progress visibility, checkpoint discipline and completion gates.

Never claim `PASS`, `fixed`, `complete`, `deployed`, `saved`, `production-ready` or a test count without the corresponding evidence.

For substantial work report concise status:

- `WORKING — <specific task>`
- `BLOCKED — <specific dependency>`
- `TASK COMPLETE — <batch>` only after durable evidence exists.

## Repository skills — mandatory routing

Use Hichki-only skills under `.agents/skills` when their domain applies. They supplement this file and never override stronger security/release constraints.

- `.agents/skills/hichki-reliability/SKILL.md` — **always apply at the start of every fresh/resumed Hichki engineering session** and whenever stale context, hallucinated progress, branch confusion, tool loops or cross-project contamination are possible.
- `.agents/skills/hichki-realtime-security/SKILL.md` — apply to chat, Socket.IO, Supabase Realtime, auth, RLS, receipts, typing, presence, offline retry, private media and Notes/Music sharing.
- `.agents/skills/hichki-mobile-release/SKILL.md` — apply to Web/PWA, service worker, Capacitor Android/iOS, native bridge/share target, keyboard/safe areas/gestures, build workflows, Netlify and release readiness.

Never import or use Stock Munim or another project's repository skills for Hichki work.

## Architecture invariants

- Supabase is the authentication, durable database/RLS and private-storage authority.
- Socket.IO is the primary realtime transport where configured, not an authorization bypass or alternate durable source of truth.
- Supabase Realtime may remain fallback transport where the current architecture defines it.
- Caller JWT and conversation membership must be validated for server relay paths.
- Never expose Supabase `service_role` credentials to browser/mobile bundles or Socket clients.
- Stable message/client identifiers must preserve idempotency and dual-transport deduplication.
- Maintain one authoritative offline retry queue.
- Delivered/read receipts, typing and presence must remain membership-scoped.
- Private media remains owner/member scoped.
- Notes/Music sharing cannot bypass conversation authorization or persistence rules.
- Backup/export cannot leak private signing/auth material.

## Product/UI invariants

Preserve Hichki's existing logo, visual language, information architecture and warm/artistic identity.

Do not turn it into WhatsApp, Telegram, Signal, a generic AI dashboard or an unrelated redesign.

Refine weak spacing, interaction, motion, typography, themes, safe areas, keyboard handling, gestures and mobile accessibility while preserving the recognizable product.

No fake/static realtime data when real infrastructure exists.

## Testing and evidence

Static/source checks are not runtime proof.

Use explicit states:

- `SOURCE-CONFIRMED`
- `TEST-PASS`
- `RUNTIME-PASS`
- `DEPLOYED`
- `NOT-RUN`
- `HISTORICAL`
- `BLOCKED`

Relevant release evidence includes source/build checks, Supabase RLS/grants/migrations, authenticated two-user messaging, Socket.IO + fallback behavior, deduplication, receipts, typing/presence, offline retry, Notes/Music sharing, exact-source production web build, Netlify source/deploy match and Android/iOS acceptance.

Do not weaken tests to obtain green CI.

## Branch/release safety

- Keep engineering work on the active completion branch until release gates and owner authorization permit merge.
- Do not merge to `main` merely because source work is complete.
- Do not deploy production or perform destructive/provider/customer-data mutations without explicit authorization where required.
- A request to continue coding is not deploy/merge authorization.

## Resume/checkpoint rule

Before ending a meaningful unfinished batch, update durable project state with exact repo/branch/HEAD, changed files, verification run, gates not run, blocker/root cause and next action.

A new chat must be able to resume from repository evidence without asking the owner to repeat project history.
