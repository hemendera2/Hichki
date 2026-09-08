# Hichki — Current Project Status

_Last verified against GitHub, Supabase and Netlify: 2026-09-08_

## Current source checkpoint

- Authoritative repository: `hemendera2/Hichki`
- Main checkpoint before this continuation: `da78edc35a1703723dc08e884bf342a542e1f7f6`
- Active engineering completion branch: `feat/hichki-completion-20260908-final`
- Completion source checkpoint before reliability hardening: `90186fe16d28899bc89d1ea9a6d1ae691c558c11`
- Reliability/skills checkpoint immediately before this status update: `39b45ca8dec6304add03bc9cf892694ba8ecc18c`
- Mandatory agent instructions: `AGENTS.md`
- Mandatory reliability protocol: `docs/AGENT_RELIABILITY_PROTOCOL.md`
- Repository-local skills:
  - `.agents/skills/hichki-reliability/SKILL.md`
  - `.agents/skills/hichki-realtime-security/SKILL.md`
  - `.agents/skills/hichki-mobile-release/SKILL.md`

The working branch is intentionally separate from `main` so engineering verification can continue without misrepresenting incomplete work as a release. Other temporary/copy completion branch names are historical working artifacts and must not be selected merely because their names look newer. Resolve this active branch HEAD again at the start of every session.

## Agent reliability / project isolation hardening

Hichki now has repository-level mandatory agent instructions, an anti-hallucination/recovery protocol and three Hichki-specific repository skills. New sessions must resolve current HEAD, read repository state before chat summaries, use explicit `SOURCE-CONFIRMED / TEST-PASS / RUNTIME-PASS / DEPLOYED / NOT-RUN / HISTORICAL / BLOCKED` evidence labels, pivot after two equivalent failed approaches, and checkpoint enough state for a new chat to resume without asking the owner to repeat history.

Project isolation is explicit: Stock Munim, digital-card and unrelated project state/evidence must not be imported into Hichki even when multiple projects are discussed in the same ChatGPT conversation.

Skill routing is explicit in root `AGENTS.md`:

- `hichki-reliability` for every fresh/resumed session;
- `hichki-realtime-security` for chat/Socket.IO/Supabase/Auth/RLS/offline/private-media paths;
- `hichki-mobile-release` for Web/PWA/Capacitor/native/build/Netlify/release work.

This hardening is project-process protection. It does not itself certify any remaining runtime/release gate.

## Completed in this continuation

- Restored the paused Hichki Supabase project; it returned to `ACTIVE_HEALTHY`.
- Added an authenticated Socket.IO relay server while retaining Supabase Realtime as the fallback transport.
- Added client-side dual-transport deduplication so the same message delivered by Socket.IO and Supabase is not surfaced twice.
- Kept Supabase as the durable write/authorization source; the Socket.IO server re-reads persisted messages/receipts under the caller JWT before relay.
- Added local-first Notes/Music library support with IndexedDB + owner-scoped Supabase sync.
- Added `note` and `music` chat message kinds and share-to-chat metadata.
- Added Web Share/PWA share-target ingestion for shared text and URLs.
- Added build/runtime guards for the new library asset and share target.
- Recovered the exact missing live migration `20260811080242_hichki_chat_anon_privilege_hardening_v1` from Supabase migration history into Git source.
- Applied live migration `hichki_library_and_message_kinds_v1` and ran a structural RLS/grants/chat-kind regression guard: PASS.
- Supabase Security Advisor after the migration: 0 security lints.

## Verified deployment state

Netlify production is still the older manual deploy `6a7a077d7914a2c48483a4f0`, created 2026-08-10. It is not the new working-branch source and must not be described as updated.

The Netlify site is a static/manual deploy and has no persistent functions capable of acting as the Socket.IO server. `realtime-server/` therefore needs a separate persistent WebSocket-capable endpoint before the production web build can set `HICHKI_SOCKET_URL`.

## Remaining completion gates

1. Obtain/attach a persistent zero-cost WebSocket-capable Node endpoint for `realtime-server/`, then configure `HICHKI_SOCKET_URL`.
2. Run authenticated two-user acceptance for message persistence, Socket.IO relay, Supabase fallback, duplicate suppression, receipts, typing, presence, offline retry and Notes/Music sharing. The live Auth project currently has no users, so this test cannot be truthfully claimed yet.
3. Produce and verify a fresh production web build from the working source and update Netlify only after that build passes.
4. Run Android and iOS build/acceptance paths against the updated web bundle.
5. Merge to `main` only after the above release gates are satisfied or explicitly accepted.

Status: **major source/backend completion advanced; production release is not yet certified**.
