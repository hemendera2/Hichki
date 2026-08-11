# Hichki — Current Project Status

_Last verified against GitHub/Supabase: 2026-08-11_

## Current implementation

Hichki is a local-first 1:1 chat, journal and music app targeting web, Android and iOS from one codebase.

The repository contains Auth/session persistence, authenticated direct-chat creation, durable message deduplication, Realtime messages/presence/typing, delivered/read receipts, IndexedDB offline retry, profile bootstrap, push-token registration, FCM/Web Push paths, service-worker notification handling, membership-scoped RLS, server-mediated conversation creation, and local music playback.

## Security work

The active chat path is `chat_messages`; the legacy `public.messages` table has a repository migration intended to revoke Data API privileges and remove its permissive policies. The migration is present in GitHub but its live-application state must be verified independently before treating the legacy surface as closed.

The live Supabase inspection also confirmed that the current database has the expected `chat_messages`, `conversations`, `conversation_members`, `message_receipts`, `profiles`, `push_devices`, and `push_subscriptions` policy families. The live inspection exposed legacy `public.messages` grants in the current database, so this remains a security migration verification item until the migration is applied and rechecked.

The current `hichki-conversation-v3` Edge Function is ACTIVE and JWT-protected. It authenticates the caller, rejects self-recipient requests, verifies the recipient through the admin API, and invokes the actor-bound conversation RPC.

## Production verification

The production build verifier validates required runtime files, runtime wiring, service-worker assets/notification handling, manifest icons, and build diagnostics.

GitHub Actions results for the current revision are not available through the connected GitHub workflow-run API, so a green CI result cannot be claimed.

## Remaining completion gates

1. Apply and verify the legacy `public.messages` lockdown migration against the intended Supabase project.
2. Verify no unintended public/anonymous chat data path remains.
3. Obtain a successful production build/integrity/static verification run.
4. Verify the recovered frontend and injected runtime integrations as the intended Hichki product.
5. Exercise authenticated chat, offline retry, Realtime, receipts, presence/typing and push paths with runtime evidence.
6. Verify Android/iOS native builds for supported targets.

Status: **implementation advanced; production completion not yet proven**.
