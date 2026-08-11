# Hichki — Current Project Status

_Last verified against GitHub `main` and the connected Hichki Supabase project: 2026-08-11_

## Current revision

- Latest GitHub commit: `81d66716c2d81ba1b0656bbc1c3731dd1c3e4edd`
- Repository: `hemendera2/Hichki`
- Default branch: `main`
- Visibility: public
- Open PRs: none returned by the connected GitHub search

## Product scope present in the repository

Hichki is defined as a local-first 1:1 chat, journal and music app for web, Android and iOS from one codebase.

The repository contains integration/security layers for:

- Supabase Auth/session persistence
- authenticated 1:1 conversation creation and messaging
- durable message deduplication
- Realtime messages, presence and typing
- delivered/read receipts
- offline IndexedDB outbox and retry
- profile bootstrap and query helpers
- Android/iOS push-token registration
- FCM push delivery path
- browser Web Push path
- service-worker notification click/deep-link handling
- Postgres RLS scoped to conversation membership
- server-mediated conversation creation
- local/user-owned music playback with Media Session support

## Security work completed in this continuation

- Strengthened production build-output verification.
- Added explicit project completion gates.
- Audited the connected Hichki Supabase project (`mzfwevtiydprksuwalpt`).
- Confirmed PostgreSQL 17.6 and all eight current public application tables have RLS enabled.
- Confirmed the active chat tables use membership-scoped policies and self-scoped receipt/profile/push policies.
- Found a legacy `public.messages` table with public `Allow all inserts` and `Allow all selects` policies. This was a real security defect in the connected database state.
- Added repository migration `20260811105000_hichki_legacy_messages_lockdown_v1.sql` to revoke `anon`/`authenticated` access and remove those legacy policies. The migration is committed to GitHub but was deliberately **not applied to the live Supabase project**, because production mutation requires explicit authorization under the project's execution rules.
- Supabase security advisor currently reports no security lints.
- Supabase performance advisor reports only INFO-level unused-index candidates; no correctness/security failure was reported.

## Source / migration drift

The connected Supabase project has migrations through `20260811080242_hichki_chat_anon_privilege_hardening_v1`, while the repository's migration set does not contain that exact migration file. This is a source-of-truth drift that must be reconciled before declaring schema state reproducible from Git alone.

## Build/source architecture

The original Hichki frontend is not checked into `main`. The build recovers the currently deployed web artifact into `vendor/hichki-web/`, then preserves that recovered source through the Vite build rather than replacing the product with a newly invented frontend.

This remains the principal source-integrity limitation: the canonical editable frontend source is external to the repository.

## Verification state

The repository has dedicated integrity, static-verification and production-build workflows. The production verifier was strengthened in commit `dffc7ecfb1cc30d5348379d960401bb124f1165d` to validate:

- required production runtime files
- runtime script wiring in `dist/index.html`
- service-worker cached runtime assets and notification handling
- required manifest icons
- build output diagnostics

The connected GitHub Actions query returns no workflow-run records for the current commits, so a green GitHub Actions result is **not verified** from the available tooling.

## Completion gate

Do not label the project fully production-complete until all of the following are evidenced:

1. GitHub Actions integrity/static/build workflows execute successfully on the current revision.
2. Production build output passes the repository-owned verifier.
3. The deployed/recovered frontend is confirmed to contain the intended current Hichki product UI and all injected runtime integrations.
4. Supabase migration/function state is reconciled with the repository and the legacy `messages` lockdown is applied through an authorized migration path.
5. End-to-end authenticated chat, offline retry, realtime delivery, receipts, presence/typing and push paths receive runtime evidence.
6. Android/iOS native build workflows are green for the supported targets.

Until those gates are evidenced, the project status is **implementation substantially advanced, verification incomplete**. No false completion claim is recorded.
