# Hichki

Hichki is a local-first 1:1 chat, journal and music app designed for web, Android and iOS from one codebase.

## v2.5 native UX update
- Supabase Realtime 1:1 messaging
- Presence-based live status
- Offline-first message queue
- Native Android/iOS shell via Capacitor
- Safe-area aware UI for notch/home-indicator devices
- Gesture navigation: left-edge swipe back, upward swipe focuses the chat composer, downward swipe dismisses the keyboard
- Android native back handling
- PWA/service-worker support
- Push registration hooks for FCM/APNs

## Project source of truth

- [`HICHKI_MASTER_PROJECT_CONTEXT.md`](./HICHKI_MASTER_PROJECT_CONTEXT.md) — canonical product, UX, engineering and quality requirements.
- [`NEW_CHAT_MASTER_PROMPT.md`](./NEW_CHAT_MASTER_PROMPT.md) — continuation operating instructions.

The existing product and UI are the foundation. Future work must **refine Hichki rather than redesign it into a different app**.

## Backend progress — 2026-08-11

The connected Supabase project `Hichki` now contains a separate secure chat-core schema for the real person-to-person architecture:

- authenticated profiles
- direct conversations and conversation membership
- durable `chat_messages` with client-id deduplication
- Row Level Security scoped to conversation membership
- Realtime publication for `chat_messages`
- per-user push subscriptions
- secure direct-conversation creation RPC
- authenticated `hichki-push-v3` Edge Function for Android/iOS push delivery through FCM when the required FCM secrets are configured

The legacy `public.messages` / `push_devices` path remains untouched for compatibility while the actual Hichki web source is recovered into the repository. The new secure path is intentionally additive so the existing product is not broken by a backend migration that the current source tree cannot yet consume.

## Current source-integrity blocker

The repository's current `scripts/prepare-web.mjs` still downloads the Hichki web application from `https://hichki.netlify.app` at build time. The actual web application source is therefore not yet fully vendored into this repository. Until that source is recovered, frontend integration of the new authenticated chat core cannot be honestly claimed as complete.

## Build configuration

- `FINAL_BUILD_CHECKLIST.md` contains the native build checklist.
- Push delivery configuration is documented by the `hichki-push-v3` function source and its environment requirements.
