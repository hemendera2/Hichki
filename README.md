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

The legacy message/push tables remain untouched for compatibility.

## Music

`hichki-music.js` provides a zero-cost player adapter for local/user-owned audio and legitimate stream URLs, including Media Session controls. Hichki does not download or redistribute copyrighted catalogues.

## Security

The chat core uses Postgres RLS. Browser clients cannot directly insert conversations or conversation-membership rows; conversation creation is server-mediated. Privileged database functions are not exposed to `anon` or `authenticated`. Browser assets contain no service-role credentials. The connected Supabase project's current security advisor reports **0 security lints**. Performance advisor notices are informational unused-index candidates and are retained while the chat workload is still being established.

## Push configuration

Push delivery is deliberately fail-closed when provider credentials are absent. No paid provider is activated automatically.

- Android/iOS FCM requires FCM project credentials in the Supabase Edge Function environment.
- Browser Web Push requires a VAPID public/private key pair and subject in the `hichki-web-push-v1` Edge Function environment.

The repository never stores those private credentials.

## Source-integrity and build status

The repository can automatically recover the currently deployed Hichki web artifact into `vendor/hichki-web/` when that source is missing. `scripts/ensure-vendored-source.mjs` then preserves the complete recovered asset tree during the Vite build instead of dropping deployed JavaScript chunks.

The original frontend is still not checked into the repository at the time of this commit; source recovery is therefore automated rather than replaced with a newly invented UI.

## Verification

- `.github/workflows/hichki-integrity.yml` validates JavaScript/Edge Function syntax, JSON, required product assets, server-only chat migrations, and browser-side service-role-secret leakage on every push/PR to `main`.
- `.github/workflows/hichki-build.yml` performs dependency installation, source recovery, syntax gates, production build, and output checks.

A GitHub Actions green run is still required before claiming the repository build itself has passed; the connector currently exposes no push-run result for the latest commits.
