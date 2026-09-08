# Hichki

Hichki is a local-first 1:1 chat, journal/notes and music app for web, Android and iOS from one codebase.

## Product rule

The existing Hichki product/UI remains the source product. Engineering work is additive: improve and complete the existing app rather than replacing it with a generic messenger or a parallel UI.

## Communication stack

The current source provides:

- Supabase Auth/session persistence
- authenticated 1:1 conversation creation through JWT-protected `hichki-conversation-v3`
- durable messages with per-sender `client_id` deduplication
- Socket.IO as the preferred low-latency relay when `HICHKI_SOCKET_URL` is configured
- Supabase Realtime as the durable fallback for messages, presence and typing
- delivered/read receipts
- IndexedDB offline outbox with reconnect retry
- Android/iOS + Web Push registration paths
- RLS scoped to conversation membership

Socket.IO does not replace database authorization. A message is persisted to Supabase first, then the relay re-reads the canonical row under the sender's JWT before broadcasting it. This prevents the socket layer from becoming a parallel unauthorised write path.

## Notes and Music library

`hichki-library.js` adds a local-first Notes/Music library backed by IndexedDB and an owner-scoped Supabase `library_items` table. It supports cloud sync, note/music sharing into 1:1 chat, saving a received library item, native/Web Share export and PWA share-target ingestion of shared text/URLs.

`hichki-music.js` continues to play local/user-owned audio and legitimate stream URLs with Media Session controls. Hichki does not download or redistribute copyrighted catalogues.

## PWA sharing

The production manifest is post-processed with a Web Share Target entry. Installed Hichki PWAs can receive shared titles, text and URLs from supported apps/platforms; Hichki classifies common music links as Music items and other shared content as Notes.

## Socket.IO service

The deployable server lives in `realtime-server/`. It requires a persistent WebSocket-capable Node 22 host and a Supabase publishable/anon key. It intentionally does not use a service-role key. The static Netlify site cannot itself host the persistent Socket.IO process.

## Build architecture

The original frontend source is still not fully checked into this repository. The build pipeline recovers the currently deployed Hichki web artifact, then injects the maintained runtime bridges, premium theme/gesture polish, library/share-target wiring and native/PWA assets before Vite builds the final output.

Required browser build configuration:

- `HICHKI_SUPABASE_URL`
- `HICHKI_SUPABASE_ANON_KEY` (or compatible publishable configuration used by the existing build)
- optional `HICHKI_VAPID_PUBLIC_KEY`
- optional `HICHKI_SOCKET_URL`

## Verification

Repository guards syntax-check the browser bridges, Socket.IO server and Edge Functions, validate JSON, verify required migrations/runtime assets, protect against browser service-role leakage, and verify the built PWA includes the library runtime and share target.

The live Supabase migration `hichki_library_and_message_kinds_v1` was applied on 2026-09-08 and the post-migration structural security guard passed. Supabase Security Advisor reported zero security lints after the change. Authenticated multi-user runtime acceptance still requires test/user accounts, and Socket.IO production activation still requires a persistent WebSocket endpoint.
