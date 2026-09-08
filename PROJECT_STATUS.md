# Hichki — Current Project Status

_Last reconciled: 2026-09-08. Repository/runtime evidence overrides older chat summaries._

## Source of truth

- Repository: `hemendera2/Hichki`
- Active completion branch: `feat/hichki-completion-20260908`
- Main remains on the older product state and MUST NOT be used as the working source.
- Latest engineering checkpoint immediately before this status commit: `c02dc4b3dfe680c1455031f046354231d3564542`
- Commit message: `chore: make relay installs deterministic`
- Always resolve the live branch HEAD again at the start of a new session.

## Implemented and saved on the completion branch

- Socket.IO realtime relay added while preserving Supabase Realtime as fallback.
- JWT-authenticated relay with live conversation-membership authorization.
- Durable Supabase persistence before relay and caller-scoped re-read before broadcast.
- Duplicate suppression, reconnect/re-auth behavior, typing/presence/receipts support and offline queue integration.
- Local-first Notes/Music library with IndexedDB + Supabase sync.
- Account-scoped local library isolation and remote deletion reconciliation.
- Premium additive Notes/Music UI with create/edit/delete, playback, external share, recipient picker, send-to-chat and received-item save support.
- PWA Web Share Target ingestion for shared text/URLs.
- `note` and `music` chat message kinds.
- Live Supabase migration `20260908073027_hichki_library_and_message_kinds_v1` applied.
- Historical live migration `20260811080242_hichki_chat_anon_privilege_hardening_v1` recovered into Git.
- Library structural RLS/grants/chat-kind guard previously passed; Supabase Security Advisor returned 0 security lints after migration.
- Relay runtime dependencies are pinned in `realtime-server/package.json`.
- Relay `package-lock.json` is now committed (`7b370436...`).
- Relay Dockerfile now copies the lockfile and uses deterministic `npm ci --omit=dev` (`c02dc4b...`).
- Versioned E2E Auth bootstrap harness added at `scripts/e2e-auth-bootstrap.mjs` (`cb004b72...`) instead of fragile inline shell JavaScript.

## Build / verification evidence

A clean Node 22 feature build was executed during this continuation before the final handoff-only commits:

- dependency audit: 0 vulnerabilities
- web build: PASS
- runtime asset verification: 11 assets PASS
- PWA manifest verification: PASS
- Socket.IO/library wiring verification: PASS

Because the branch later received the E2E bootstrap script, relay lockfile and relay Dockerfile determinism commits, the exact current HEAD should still receive one fresh end-to-end `npm ci && npm run build && npm run verify:build` before release certification. Those later commits do not intentionally modify the web UI bundle, but do not label current HEAD fully certified until rerun.

## Railway realtime staging — verified facts

Canonical staging relay service:

- Railway project: `Hichki`
- project ID: `d334e2a3-b997-4886-acb8-b3d6c7280cae`
- environment ID: `2b3f4c9c-d9e8-45df-82d4-87add857f52c`
- service: `hichki-realtime-feature`
- service ID: `f88a029e-deae-4a7a-8e87-791797f0948d`
- source branch: `feat/hichki-completion-20260908`
- root: `/realtime-server`
- builder: Dockerfile
- healthcheck: `/healthz`
- public domain: `hichki-realtime-feature-production.up.railway.app`
- latest successful deployed commit currently reported by Railway: `6ab54ef3c8da48630941eadea67a1ebb68184faf`
- deployment: `806d3c50-d82c-4cfc-934f-c27a411b2de0`
- runtime logs verified: `hichki-realtime-server@1.0.0`, `node server.mjs`, `Hichki Socket.IO relay listening on :8080`

The service is therefore a real Node/Socket.IO relay, not the earlier accidental Vite/Caddy static-site deployment. It still needs a fresh redeploy from current branch HEAD so the new lockfile/Dockerfile determinism is live before final certification.

There is also a separate `hichki-realtime` service (`d0f304be-dfc7-4961-a966-8459f9e7e727`) that was temporarily used as an isolated cloud runner for E2E bootstrap and lockfile generation. Do NOT treat it as the canonical relay. Inspect its current config before reusing or deleting it.

## Supabase Auth / 2-user acceptance

Two temporary E2E users were created through the supported Supabase signup API with `e2e=true` metadata. Both currently have `email_confirmed_at = NULL`; no authenticated session was returned.

Gmail connector reads failed with `404 Link not found`, so confirmation links could not be safely opened in this session. Direct mutation of `auth.users` was intentionally NOT used.

Therefore authenticated two-user acceptance is NOT PASSED yet. Next session must either:

1. confirm those temporary E2E users through the normal email-confirmation flow, or
2. use another supported Supabase Auth Admin/API path if available,

then run real two-user chat/library acceptance and clean up the temporary users/test rows afterward.

Never claim this gate passed from source inspection alone.

## Netlify production — verified current state

- Site: `https://hichki.netlify.app`
- site ID: `882286b7-4cd7-4f59-9869-628ad16ea029`
- current production deploy ID: `6a7a077d7914a2c48483a4f0`
- manual deploy created 2026-08-10
- `commit_ref = null`
- `branch = null`
- `has_source_zip = false`
- no functions / edge functions

This production deploy is stale and does NOT contain the completion branch.

Current Netlify environment-variable readback in this handoff returned only `CLOUDINARY_CLOUD_NAME`. Do not assume previous Supabase/socket env writes are still present. Before any new production deploy, explicitly verify/recreate the required build variables (Supabase URL, browser-safe publishable key, and `HICHKI_SOCKET_URL`) without exposing secret values.

Do NOT deploy stale or unverified output to production.

## Dependency/reproducibility state

- `realtime-server/package-lock.json`: DONE and committed.
- root web `package-lock.json`: still pending. A cloud runner successfully generated it, but the full root lockfile was not safely extracted/committed during this session. Generate it from current `package.json` with Node 22/npm, verify it, and commit it before final release if possible.

## Remaining release gates — ordered

1. Resolve live HEAD and re-read this file plus `HICHKI_MASTER_PROJECT_CONTEXT.md` and `NEW_CHAT_MASTER_PROMPT.md`.
2. Inspect Git diff/history from `c02dc4b...` forward and preserve all current branch work.
3. Generate/commit the root `package-lock.json`; use deterministic `npm ci` in final build paths.
4. Fresh exact-current-HEAD web build: `npm ci`, audit, `npm run build`, `npm run verify:build`.
5. Redeploy canonical Railway `hichki-realtime-feature` from current HEAD and verify real `/healthz` JSON + runtime logs/WebSocket path.
6. Verify Netlify build env contains Supabase URL, publishable key and actual `HICHKI_SOCKET_URL`.
7. Complete real authenticated two-user acceptance: persistence, bidirectional Socket.IO, Supabase fallback, dedupe, receipts, typing, presence, reconnect, offline retry, account switching, Notes/Music sync/share/save and PWA share target.
8. Clean up temporary E2E users/data after acceptance.
9. Run Android Capacitor sync/build/acceptance and Android back/keyboard/safe-area checks.
10. Run iOS Capacitor sync/build/acceptance where a capable macOS/Xcode runner exists. If not executable, mark NOT RUN; do not fake it.
11. Only after all relevant gates are green: deploy the verified web bundle to Netlify production.
12. Merge to `main` only with explicit owner authorization and after release evidence is sufficient.

## Working rules for the next session

- No hallucinated PASS/complete claims.
- Anything not actually executed is `NOT RUN`.
- Fix root causes, not symptoms.
- After the same tool/infrastructure method fails twice, pivot instead of looping.
- Do not spend money or enable paid infrastructure without approval.
- Do not expose Supabase keys or passwords.
- Do not mutate real customer/production data without required approval.
- Keep Hichki's existing identity; additive premium refinement only, no generic messenger redesign.
- Save valid work to the canonical feature branch and update project state before stopping.

Status: **source implementation is advanced, realtime staging exists, but release certification/production deployment is intentionally still incomplete.**
