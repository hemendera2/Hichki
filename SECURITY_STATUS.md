# Hichki Security Status

_Last verified: 2026-09-08_

## Database and API

The connected Supabase project `mzfwevtiydprksuwalpt` is `ACTIVE_HEALTHY`.

`chat_messages` remains conversation-membership scoped by RLS. `public.library_items` has RLS enabled, no anonymous table privileges, authenticated CRUD only, and explicit owner policies using `owner_id = auth.uid()`.

The live Notes/Music migration is recorded as `20260908073027_hichki_library_and_message_kinds_v1`, and the Git source now carries that exact version. The previously missing historical migration `20260811080242_hichki_chat_anon_privilege_hardening_v1` was recovered exactly from live migration history.

Post-migration structural security guard: PASS. Supabase Security Advisor: 0 lints.

## Socket.IO authorization

The relay does not trust a client-provided sender identity or message payload as the source of truth.

- Supabase access token is validated during the socket handshake.
- Current conversation membership is re-checked for relay-sensitive events rather than trusted from an old room join.
- Relayed messages/receipts are re-read from Supabase under the caller JWT before broadcast.
- Recipient delivery uses current member user rooms instead of a permanently trusted conversation room.
- No service-role key is required by the browser or relay service.
- Supabase Realtime remains the fallback transport if the Socket.IO service is unavailable.

## Local library privacy

IndexedDB library visibility is account-scoped. Items belonging to another signed-in user are hidden and are not synced into the current account. Anonymous drafts can be claimed by the first authenticated account that syncs them. Synced items deleted remotely are removed locally when the next successful sync confirms they no longer exist.

## Remaining security/runtime evidence

- Authenticated multi-user RLS/runtime acceptance remains pending because live Auth currently has zero users.
- Full Socket.IO end-to-end acceptance needs a running persistent relay URL.
- Native/web production acceptance remains pending because Netlify production still points at the older manual deployment.

Do not label these pending runtime gates as passed without evidence.
