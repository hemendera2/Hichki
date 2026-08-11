# Hichki — Current Project Status

_Last verified against GitHub/Supabase: 2026-08-11_

## Current implementation

Hichki is a local-first 1:1 chat, journal and music app targeting web, Android and iOS from one codebase.

The repository contains Auth/session persistence, authenticated direct-chat creation, durable message deduplication, Realtime messages/presence/typing, delivered/read receipts, IndexedDB offline retry, profile bootstrap, push-token registration, FCM/Web Push paths, service-worker notification handling, membership-scoped RLS, server-mediated conversation creation, and local music playback.

## Security and integration work completed in this continuation

- Audited the live Hichki Supabase project `mzfwevtiydprksuwalpt`.
- Closed the retired `public.messages` Data API surface: `anon`/`authenticated` have no table privileges and the old permissive policies are gone.
- Added an explicit restrictive deny-all RLS policy to the retired table; Supabase security advisor is now clean with no security lints.
- Removed `TRUNCATE`, `REFERENCES`, and `TRIGGER` table privileges from browser roles on the active Hichki tables.
- Removed client-side `DELETE` privilege from `push_devices` and anonymous `DELETE` privilege from `push_subscriptions`.
- Removed Data API execution privileges from the security-definer direct-chat/profile RPCs; live verification shows no `public`/`anon`/`authenticated` execute grants on those definer functions.
- Recorded the live-generated migration versions in the repository, including `20260811131745_hichki_legacy_messages_lockdown_v1`, `20260811131930_hichki_legacy_messages_deny_policy_v1`, and `20260811132035_hichki_security_definer_execute_lockdown_v1`.
- Fixed a real client integration mismatch: the browser realtime bridge was still invoking `hichki-conversation-v2`; both root and public bridge copies now route direct-chat creation through the active JWT-protected `hichki-conversation-v3` function.
- The current `hichki-conversation-v3` Edge Function remains ACTIVE and JWT-protected; it authenticates the caller, rejects self-recipient requests, verifies the recipient through the admin API, and invokes the actor-bound conversation RPC.

## Production verification

The production build verifier validates required runtime files, runtime wiring, service-worker assets/notification handling, manifest icons, and build diagnostics.

GitHub Actions results for the current revision are not available through the connected GitHub workflow-run API, so a green CI result cannot be claimed. The repository workflows do include `workflow_dispatch`, but the connected GitHub toolset does not expose a workflow-dispatch action.

The build source remains externally recovered from the deployed Hichki web artifact, so a reproducible production build still depends on that remote source being reachable.

## Remaining completion gates

1. Reconcile the older live migration `20260811080242_hichki_chat_anon_privilege_hardening_v1` with its repository source so the full database history is reproducible from Git.
2. Obtain a successful production build/integrity/static verification run.
3. Verify the recovered frontend and injected runtime integrations as the intended Hichki product.
4. Exercise authenticated chat, offline retry, Realtime, receipts, presence/typing and push paths with runtime evidence.
5. Verify Android/iOS native builds for supported targets.

Status: **security/integration hardening materially advanced; production completion not yet proven**.
