# Hichki

Hichki is a local-first 1:1 chat, journal/notes and music app for web, Android and iOS from one codebase.

## Product rule

Keep the existing Hichki identity and information architecture. Engineering changes are additive completion work, not a generic messenger redesign.

## Communication stack

- Supabase Auth/session persistence
- JWT-protected 1:1 conversation creation through `hichki-conversation-v3`
- durable messages with per-sender `client_id` deduplication
- Socket.IO preferred low-latency relay when `HICHKI_SOCKET_URL` is configured
- Supabase Realtime fallback for messages/presence/typing
- delivered/read receipts
- IndexedDB offline outbox with reconnect retry
- Android/iOS + Web Push registration paths
- RLS scoped to current conversation membership

Socket.IO is not a second database write path. Hichki persists a message/receipt to Supabase first; the relay authenticates the Supabase JWT, rechecks current membership and re-reads the canonical row before broadcasting it.

## Notes and Music

`hichki-library.js` provides account-isolated local-first data and owner-scoped Supabase sync. `hichki-library-ui.js` exposes a premium additive surface with:

- create/edit/delete Notes
- save legitimate music/audio links
- play compatible user-owned/direct audio through the Hichki music engine
- share externally with Web Share/clipboard fallback
- send a Note/Music item to an existing 1:1 Hichki chat
- save received library metadata through the library API
- receive shared titles/text/URLs through the installed PWA's Web Share Target

Hichki does not download or redistribute copyrighted music catalogues.

## Realtime service

`realtime-server/` is a Node 22 Socket.IO relay with `/healthz`, Docker support, CORS allowlisting, JWT authentication, current-membership checks and basic per-socket rate limiting.

A static Netlify deployment cannot itself be the persistent Socket.IO process. `render.yaml` provides a current free Render web-service staging path. Render free services may sleep when inactive, so Supabase Realtime remains a mandatory fallback rather than treating free Socket.IO hosting as a single point of failure.

Runtime variables for the relay:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` (browser-safe publishable/anon credential, never `service_role`)
- `ALLOWED_ORIGINS`

Browser build variables:

- `HICHKI_SUPABASE_URL`
- `HICHKI_SUPABASE_ANON_KEY` (legacy variable name; a publishable key is accepted)
- optional `HICHKI_VAPID_PUBLIC_KEY`
- optional `HICHKI_SOCKET_URL`

## Build architecture

The original frontend source is still not fully checked into this repository. The build pipeline recovers the currently deployed Hichki web artifact, injects maintained realtime/offline/library/native/PWA assets and theme/gesture polish, then Vite produces the final build.

This recovery architecture is a known maintainability constraint. Do not claim a full clean-source frontend rewrite unless the actual frontend source is first recovered and checked in.

## Verification state

Supabase library migration, structural authorization checks and Security Advisor have been verified. Key new Socket.IO/library files pass independent Node syntax parsing. Full dependency install/web build, authenticated two-user acceptance, production Netlify update and native build certification are still release gates documented in `PROJECT_STATUS.md`.
