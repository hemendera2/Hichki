---
name: hichki-realtime-security
description: Use when changing Hichki chat, Socket.IO, Supabase Realtime, message persistence, receipts, typing, presence, offline retry, private media, Notes/Music sharing, auth, RLS or conversation membership.
---

# Hichki Realtime Security Skill

## Core architecture

- Supabase Auth is caller identity.
- Supabase Postgres/RLS is durable authorization and state authority.
- Supabase private Storage remains private-media authority.
- Socket.IO is realtime transport/fan-out, never an authorization bypass or alternate durable database.
- Supabase Realtime may remain fallback transport when defined by current source.

## Mandatory invariants

1. Validate the caller JWT on server-mediated realtime paths.
2. Verify conversation membership before joining rooms, relaying events, reading messages or mutating receipts.
3. Never expose `service_role` secrets in browser/mobile bundles or Socket clients.
4. Durable message creation must remain idempotent using stable client/message identifiers.
5. Socket.IO + Supabase dual delivery must deduplicate deterministically.
6. Maintain one authoritative offline retry queue; do not reintroduce competing queues.
7. Reconnect must not duplicate or silently lose messages.
8. Delivered/read receipt changes must be membership-scoped and tied to persisted messages.
9. Typing/presence must not disclose non-member user activity.
10. Private media access must be owner/member scoped and use private storage semantics.
11. Notes/Music sharing must go through the same conversation authorization and persistence boundaries as normal chat content.
12. Backup/export paths must not expose auth tokens, private signing material or service credentials.

## Change procedure

For every realtime/security change:

`TRACE ACTOR → AUTHENTICATE → AUTHORIZE MEMBERSHIP → VALIDATE PAYLOAD → DURABLE WRITE → RELAY → DEDUP → RECEIPT/STATE VERIFY → FAILURE/RECONNECT CHECK`

Inspect all relevant paths before editing:

- browser/PWA client;
- native bridge where applicable;
- Socket.IO server;
- Supabase Edge Function/RPC;
- RLS/grants/migrations;
- offline queue;
- service worker/share target;
- tests/workflows.

## Negative-path verification

Add or retain evidence for:

- unauthenticated caller denied;
- non-member denied;
- wrong conversation denied;
- duplicate client ID does not duplicate durable message;
- reconnect/double transport does not duplicate UI delivery;
- stale/invalid JWT fails closed;
- receipt mutation for another user's inaccessible message denied;
- private media URL/data inaccessible to non-members;
- service-role string/secret leakage guards remain green.

## Evidence discipline

Source guards are not runtime proof. Use `SOURCE-CONFIRMED`, `TEST-PASS`, `RUNTIME-PASS`, `NOT-RUN`, `HISTORICAL`, `BLOCKED` accurately.

Do not weaken RLS, grants, membership checks, deduplication or negative tests merely to obtain green CI.