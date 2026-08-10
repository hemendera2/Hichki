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
- [`NEW_CHAT_MASTER_PROMPT.md`](./NEW_CHAT_MASTER_PROMPT.md) — paste into a new ChatGPT/AI chat when continuing the project.

The existing product and UI are the foundation. Future work must **refine Hichki rather than redesign it into a different app**.

See `FINAL_BUILD_CHECKLIST.md` and `PUSH_SETUP.md` for build configuration.
