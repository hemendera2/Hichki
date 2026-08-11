# Hichki

Hichki is a local-first 1:1 chat, journal and music app designed for web, Android and iOS from one codebase.

## Product rule

The existing Hichki product/UI is the source product. Engineering work is additive: improve the existing app rather than replacing it with a different UI or parallel product.

## Current communication stack

The repository contains UI-neutral production integration layers for:

- Supabase Auth/session persistence
- authenticated 1:1 conversations through the JWT-protected `hichki-conversation-v2` Edge Function
- server-only actor-bound conversation creation primitive
- durable messages with per-sender client-id deduplication
- Supabase Realtime message delivery
- Realtime presence/online state
- typing indicators through Realtime Broadcast
- delivered/read receipts
- offline IndexedDB outbox and reconnect retry
- conversation/message/profile query helpers
- Android/iOS push-token registration
- FCM push delivery function (`hichki-push-v3`) when FCM credentials are configured
- browser Web Push registration and delivery (`hichki-web-push-v1`) when VAPID credentials are configured
- notification click/deep-link handling in the PWA service worker
- automatic profile bootstrap after Auth signup
- RLS scoped to conversation membership

The legacy message/push tables remain untouched for compatibility. The obsolete legacy `hichki-push` and `hichki-push-v2` endpoints are now fail-closed (HTTP 410); current clients use the authorized v3 push path.

## Music

`hichki-music.js` provides a zero-cost player adapter for local/user-owned audio and legitimate stream URLs, including Media Session controls. Hichki does not download or redistribute copyrighted catalogues.

## Security

The chat core uses Postgres RLS. Browser clients cannot directly insert conversations or conversation-membership rows; conversation creation is server-mediated. The obsolete direct conversation-insert policy has been removed and anonymous privileges on chat tables have been revoked as defense in depth. Privileged database functions are not exposed to `anon` or `authenticated`. Browser assets contain no service-role credentials. The connected Supabase project's current security advisor reports **0 security lints**. Performance advisor notices are informational unused-index candidates and are retained while the chat workload is still being established.

## Push configuration

Push delivery is deliberately fail-closed when provider credentials are absent. No paid provider is activated automatically.

- Android/iOS FCM requires FCM project credentials in the Supabase Edge Function environment.
- Browser Web Push requires a VAPID public/private key pair and subject in the `hichki-web-push-v1` Edge Function environment.

The repository never stores those private credentials.

## Source-integrity and build status

The repository can automatically recover the currently deployed Hichki web artifact into a build-local `vendor/hichki-web/` tree when that source is missing. `scripts/ensure-vendored-source.mjs` preserves the complete recovered asset tree during the Vite build, and `scripts/local-netlify-fetch.mjs` lets the existing `prepare-web` logic consume that vendored source without duplicating or redesigning the frontend.

The original frontend is still not checked into the repository at the time of this commit; source recovery is therefore automated rather than replaced with a newly invented UI.

## Verification

- `.github/workflows/hichki-integrity.yml` validates JavaScript/Edge Function syntax, JSON, required product assets, server-only chat migrations, and browser-side service-role-secret leakage on every push/PR to `main`.
- `.github/workflows/hichki-static-verify.yml` performs repository-only syntax, manifest and asset validation without depending on a nonexistent lockfile.
- `.github/workflows/hichki-build.yml` performs dependency installation, source recovery, syntax gates, production build, and output checks.
- The source-recovery workflow is manual/scheduled and publishes a recovery artifact rather than trying to push generated source back into `main`.

A GitHub Actions green run is still required before claiming the repository build itself has passed; the current GitHub connector does not expose push-run results for the latest commits.
