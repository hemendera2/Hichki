# Hichki

Hichki is a local-first 1:1 chat, journal and music app designed for web, Android and iOS from one codebase.

## Product rule

The existing Hichki product/UI is the source product. Engineering work is additive: improve the existing app rather than replacing it with a different UI or parallel product.

## Current communication stack

The repository now contains the UI-neutral production bridge for:

- Supabase Auth/session persistence
- authenticated 1:1 conversations
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

The chat core uses Postgres RLS. Direct conversation creation is server-mediated. Browser assets contain no service-role credentials. The connected Supabase project's current security advisor reports **0 security lints**. Performance advisor notices are informational unused-index candidates and are retained while the chat workload is still being established.

## Push configuration

Push delivery is deliberately fail-closed when provider credentials are absent. No paid provider is activated automatically.

- Android/iOS FCM requires FCM project credentials in the Supabase Edge Function environment.
- Browser Web Push requires a VAPID public/private key pair and subject in the `hichki-web-push-v1` Edge Function environment.

The repository never stores those private credentials.

## Source-integrity status

The current `scripts/prepare-web.mjs` still downloads the deployed Hichki web application from `https://hichki.netlify.app` at build time. Therefore the original frontend source is not yet fully vendored into GitHub. The realtime, push, offline, receipt, and music capabilities have been built as UI-neutral integration layers specifically to avoid inventing or replacing the missing Hichki frontend.

This distinction is intentional: backend/integration capability is implemented, but end-to-end visible UI behavior cannot be claimed until the actual Hichki frontend source is available to the repository.

## Verification

`.github/workflows/hichki-integrity.yml` validates JavaScript/Edge Function syntax, JSON, required product assets, and browser-side service-role-secret leakage on every push/PR to `main`.
