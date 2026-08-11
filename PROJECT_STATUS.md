# Hichki — Current Project Status

_Last verified against GitHub `main`: 2026-08-11_

## Current revision

- HEAD: `dffc7ecfb1cc30d5348379d960401bb124f1165d`
- Repository: `hemendera2/Hichki`
- Default branch: `main`
- Visibility: public
- Open PRs: none returned by the connected GitHub search

## Product scope present in the repository

Hichki is defined as a local-first 1:1 chat, journal and music app for web, Android and iOS from one codebase.

The repository currently contains integration/security layers for:

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

## Security state recorded in the repository

- Direct conversation insertion from browser clients is disabled.
- Conversation creation is server-mediated and actor-bound.
- Privileged database functions are not intended to be exposed to `anon` or `authenticated`.
- Legacy push endpoints are fail-closed; current clients use the v3 path.
- Browser assets are guarded against service-role credential leakage by CI.
- Push provider credentials are environment configuration and are not stored in the repository.

## Build/source architecture

The original Hichki frontend is not checked into `main`. The build recovers the currently deployed web artifact into `vendor/hichki-web/`, then preserves that recovered source through the Vite build rather than replacing the product with a newly invented frontend.

This is intentional in the current architecture, but it is also the principal source-integrity limitation: the canonical editable frontend source is external to the repository.

## Verification state

The repository has dedicated integrity, static-verification and production-build workflows. The production verifier was strengthened in commit `dffc7ecfb1cc30d5348379d960401bb124f1165d` to validate:

- required production runtime files
- runtime script wiring in `dist/index.html`
- service-worker cached runtime assets and notification handling
- required manifest icons
- build output diagnostics

The connected GitHub Actions query currently returns no workflow-run records for the latest commit, so a green GitHub Actions result is **not verified** from the available tooling.

## Completion gate

Do not label the project fully production-complete until all of the following are evidenced:

1. GitHub Actions integrity/static/build workflows execute successfully on the current revision.
2. Production build output passes the repository-owned verifier.
3. The deployed/recovered frontend is confirmed to contain the intended current Hichki product UI and all injected runtime integrations.
4. Supabase migration/function state is validated against the intended production project without exposing secrets.
5. End-to-end authenticated chat, offline retry, realtime delivery, receipts, presence/typing and push paths receive runtime evidence.
6. Android/iOS native build workflows are green for the supported targets.

Until those gates are evidenced, the project status is **implementation substantially advanced, verification incomplete** rather than falsely marked complete.
