# Hichki — Current Project Status

_Last verified against GitHub/Supabase: 2026-08-11_

## Current implementation

Hichki is a local-first 1:1 chat, journal and music app targeting web, Android and iOS from one codebase.

The repository contains Auth/session persistence, authenticated direct-chat creation, durable message deduplication, Realtime messages/presence/typing, delivered/read receipts, IndexedDB offline retry, profile bootstrap, push-token registration, FCM/Web Push paths, service-worker notification handling, membership-scoped RLS, server-mediated conversation creation, and local music playback.

## Security work completed in this continuation

- Audited the live Hichki Supabase project `mzfwevtiydprksuwalpt`.
- Found and closed the legacy `public.messages` Data API surface: its `anon`/`authenticated` table privileges are now revoked and its permissive policies are absent.
- Removed `TRUNCATE`, `REFERENCES`, and `TRIGGER` table privileges from browser roles on the active Hichki tables.
- Removed client-side `DELETE` privilege from `push_devices` and anonymous `DELETE` privilege from `push_subscriptions`.
- Rechecked the live database after the migration: no `TRUNCATE`/`REFERENCES`/`TRIGGER` grants remain for `anon` or `authenticated` on the Hichki application tables, and `public.messages` has no client-role grants or policies.
- The current `hichki-conversation-v3` Edge Function remains ACTIVE and JWT-protected; it authenticates the caller, rejects self-recipient requests, verifies the recipient through the admin API, and invokes the actor-bound conversation RPC.

## Production verification

The production build verifier validates required runtime files, runtime wiring, service-worker assets/notification handling, manifest icons, and build diagnostics.

GitHub Actions results for the current revision are not available through the connected GitHub workflow-run API, so a green CI result cannot be claimed.

## Remaining completion gates

1. Reconcile the live Supabase migration history with the repository migration set so schema state is reproducible from Git.
2. Obtain a successful production build/integrity/static verification run.
3. Verify the recovered frontend and injected runtime integrations as the intended Hichki product.
4. Exercise authenticated chat, offline retry, Realtime, receipts, presence/typing and push paths with runtime evidence.
5. Verify Android/iOS native builds for supported targets.

Status: **security hardening advanced; production completion not yet proven**.
