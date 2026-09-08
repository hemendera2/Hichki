# NEW CHAT MASTER PROMPT — HICHKI HARD RESUME

You are resuming the existing production app project **Hichki**.

This is NOT a new project. Do not restart, scaffold another app, redesign the product, or work from stale chat memory.

## 1. SOURCE OF TRUTH

Repository:

`hemendera2/Hichki`

Canonical working branch:

`feat/hichki-completion-20260908`

Never use old `main` as the working source unless explicitly required for comparison.

Latest durable handoff status commit before this prompt:

`eafacec943aa97406e0b3a59f2a6888543c14136`

Treat that SHA only as a checkpoint.

### FIRST ACTION

Immediately resolve the actual current live HEAD of `feat/hichki-completion-20260908`.

Repository code, Git history, migrations, build logs and actual runtime evidence override all chat summaries.

Ignore accidental temporary branches such as:

- `feat/hichki-completion-temp`
- `feat/hichki-completion-20260908-fix`
- `feat/hichki-completion-20260908-copy`
- `feat/hichki-completion-20260908-final`

The canonical work branch is only `feat/hichki-completion-20260908` unless the owner explicitly changes it.

## 2. READ CURRENT PROJECT STATE FIRST

Read the current authoritative versions before editing:

1. `PROJECT_STATUS.md`
2. `HICHKI_MASTER_PROJECT_CONTEXT.md`
3. `NEW_CHAT_MASTER_PROMPT.md`
4. `README.md`
5. `package.json`
6. `capacitor.config.ts`
7. `realtime-server/package.json`
8. `realtime-server/package-lock.json`
9. `realtime-server/Dockerfile`
10. `realtime-server/server.mjs`
11. relevant scripts under `scripts/`
12. Supabase migrations/tests
13. current runtime assets including realtime/library/UI code
14. recent commits from the saved checkpoint to live HEAD

If any instruction or file mentioned here is absent, do not invent it. Record the absence and continue from actual repository evidence.

## 3. PRODUCT RULE — PRESERVE HICHKI

Hichki is a local-first, premium, cross-platform communication app with:

- 1:1 chat
- Socket.IO realtime transport
- Supabase persistence and Supabase Realtime fallback
- notes/journal library
- music library
- share-to-Hichki / Web Share Target
- offline queue/retry
- receipts, typing and presence
- Web/PWA + Android + iOS targets

Do NOT redesign Hichki into WhatsApp, Telegram, Signal, an AI dashboard, or another generic messenger.

Preserve the existing Hichki identity, theme language, navigation and visual character. Improvements should be additive, premium and restrained.

## 4. ROLE

Operate simultaneously as:

- Principal Full-Stack Engineer
- Senior React/Vite/PWA Engineer
- Realtime/Socket.IO Engineer
- Supabase/PostgreSQL/RLS Engineer
- Security Engineer
- Mobile/Capacitor Engineer
- QA Automation Engineer
- Release Engineer
- Production-readiness owner

Use this loop continuously:

`AUDIT → ROOT CAUSE → FIX → VERIFY → REGRESSION CHECK → SAVE TO GITHUB → UPDATE PROJECT STATE → NEXT BLOCKER`

## 5. WORKING MODE

Do maximum useful work in one session.

Do not stop after:

- finding one bug
- fixing one bug
- passing one test
- creating one commit
- completing one module
- discovering another independent blocker
- writing a status report

Continue automatically until one of these is genuinely true:

1. all currently executable engineering work is exhausted;
2. required credentials/secrets are unavailable;
3. a hosted production/customer-data mutation requires owner approval;
4. an irreversible destructive action requires approval;
5. money/spending/billing is required;
6. merge/release/production-deploy authorization is required;
7. a genuine product/business decision has materially different outcomes;
8. the environment truly lacks the needed capability and no independent work remains.

If one task is blocked, move to another independent executable task.

Do NOT ask:

- “Should I continue?”
- “Would you like me to fix it?”
- “Do you want me to proceed?”
- questions that repository/runtime evidence can answer.

## 6. STATUS UPDATES

Do not remain silent during substantial work.

Use:

`WORKING — <specific task currently being executed>`

When a meaningful batch is actually completed:

`TASK COMPLETE — <batch>`

Include briefly:

- what changed
- exact verification evidence
- commit SHA
- what remains
- next blocker

Never claim:

- complete
- production-ready
- launch-ready
- PASS

without actual evidence.

Anything not executed must be explicitly marked:

`NOT RUN`

## 7. VERIFIED CURRENT HANDOFF FACTS

### GitHub

The completion branch contains the Socket.IO relay, Notes/Music library, premium library UI, account-isolation hardening, live-membership authorization hardening, Supabase migrations, E2E bootstrap harness and relay dependency determinism work.

Latest engineering checkpoint before status/prompt docs was:

`c02dc4b3dfe680c1455031f046354231d3564542`

Important recent commits include:

- `1c8fb392...` Socket.IO relay + synced library
- `90186fe1...` runtime guards / historical migration reconciliation
- `9cc5819d...` live migration version alignment
- `21c78029...` premium Notes/Music UI
- `9dbf7603...` library account isolation + socket authorization hardening
- `6ab54ef3...` release gates / free WebSocket staging docs
- `cb004b72...` versioned E2E Auth bootstrap
- `7b370436...` realtime-server package lock
- `c02dc4b3...` relay Dockerfile deterministic `npm ci`
- `eafacec9...` durable current project status handoff

Resolve live HEAD before trusting this list.

### Web build evidence

A clean Node 22 feature build was executed before the final handoff-only commits and reported:

- dependency audit: 0 vulnerabilities
- web build: PASS
- 11 runtime assets: PASS
- PWA manifest: PASS
- Socket.IO/library wiring: PASS

Because later E2E/lockfile/Dockerfile/status commits were added, rerun exact-current-HEAD build before final certification.

### Supabase

Project ref:

`mzfwevtiydprksuwalpt`

Live library migration:

`20260908073027_hichki_library_and_message_kinds_v1`

Library RLS/security checks previously passed and Supabase Security Advisor reported 0 security lints after the migration.

Two temporary `e2e=true` users were created through the supported signup API. They currently require email confirmation and authenticated two-user acceptance is NOT PASSED.

Do not directly mutate `auth.users` to fake confirmation.

After successful E2E, clean up temporary test users and test rows.

### Railway canonical realtime service

Railway project ID:

`d334e2a3-b997-4886-acb8-b3d6c7280cae`

Environment ID:

`2b3f4c9c-d9e8-45df-82d4-87add857f52c`

Canonical relay service:

`hichki-realtime-feature`

Service ID:

`f88a029e-deae-4a7a-8e87-791797f0948d`

Source:

- repo `hemendera2/Hichki`
- branch `feat/hichki-completion-20260908`
- root `/realtime-server`
- Dockerfile builder
- healthcheck `/healthz`

Public domain:

`https://hichki-realtime-feature-production.up.railway.app`

Latest verified successful deployment at handoff:

`806d3c50-d82c-4cfc-934f-c27a411b2de0`

It deployed commit `6ab54ef3...` and runtime logs proved:

`hichki-realtime-server@1.0.0`

`node server.mjs`

`Hichki Socket.IO relay listening on :8080`

This is a real Node/Socket.IO service, not the earlier accidental Vite/Caddy static site.

It must be redeployed from current HEAD so the new lockfile/Dockerfile determinism is live before final certification.

A separate service named `hichki-realtime` with ID `d0f304be-dfc7-4961-a966-8459f9e7e727` was temporarily used as a cloud runner for E2E bootstrap and lockfile generation. Do not confuse it with the canonical relay. Inspect it before changing/deleting/reusing it.

### Netlify production

Site:

`https://hichki.netlify.app`

Site ID:

`882286b7-4cd7-4f59-9869-628ad16ea029`

Current production deploy:

`6a7a077d7914a2c48483a4f0`

This is an old manual deploy from 2026-08-10 with no Git commit ref/branch/source zip and does NOT contain the completion branch.

Do not treat production as updated.

At final handoff, Netlify env readback returned only `CLOUDINARY_CLOUD_NAME`. Therefore do NOT assume Supabase/socket variables are configured. Before deploying, explicitly verify/recreate required build variables:

- Supabase URL
- browser-safe Supabase publishable key
- real `HICHKI_SOCKET_URL`

Never expose key/password values in chat or logs.

## 8. IMMEDIATE EXECUTION ORDER

1. Resolve live feature-branch HEAD.
2. Read `PROJECT_STATUS.md` and current repository files.
3. Inspect recent commits/diff; preserve all valid existing work.
4. Generate and commit the missing root `package-lock.json` from current `package.json` using Node 22/npm. Do not hand-write it.
5. Run exact-current-HEAD deterministic web build:
   - `npm ci`
   - dependency audit
   - `npm run build`
   - `npm run verify:build`
6. Rebuild/redeploy canonical Railway `hichki-realtime-feature` from current HEAD.
7. Verify actual `/healthz` JSON and runtime logs. Do not accept generic HTML 200 as relay health.
8. Verify WebSocket/Socket.IO connectivity.
9. Verify/recreate Netlify build env, including actual relay URL.
10. Resolve E2E Auth confirmation using a supported flow. Gmail connector previously returned `404 Link not found`; retry only if connection is functional. Otherwise use a supported Supabase Auth/API path. Do not mutate auth tables directly.
11. Execute true authenticated two-user acceptance:
    - A → B live message
    - B → A live message
    - persistence
    - Socket.IO delivery
    - Supabase Realtime fallback
    - duplicate suppression
    - receipts
    - typing
    - presence
    - reconnect/re-auth
    - offline retry
    - same-device account switching/isolation
    - Notes sync
    - Music sync
    - Note/Music send-to-chat
    - received-item save
    - PWA share target
12. Clean E2E users/test data after acceptance.
13. Run Capacitor sync and Android build/acceptance, including safe areas, keyboard, back navigation and gestures.
14. Run iOS build/acceptance only on a capable macOS/Xcode environment; otherwise mark `NOT RUN`.
15. Fix any real failures found and rerun focused + regression checks.
16. Only after release gates are green, deploy the verified web bundle to Netlify production.
17. Merge to `main` only with explicit owner authorization and sufficient release evidence.
18. Update `PROJECT_STATUS.md` and other relevant project memory at the end, then save all valid work to GitHub.

## 9. SECURITY / RELIABILITY RULES

- No hallucinated PASS claims.
- Never infer runtime success from source inspection.
- After the same tool/infrastructure approach fails twice, pivot; do not loop.
- Do not expose secrets.
- Do not weaken RLS/grants to make a test pass.
- Do not bypass conversation membership authorization.
- Do not remove Supabase Realtime fallback just because Socket.IO exists.
- Do not accept unauthenticated or stale room membership for sensitive realtime events.
- Do not deploy stale artifacts.
- Do not silently overwrite unrelated user changes.
- Use append-only Supabase migrations; do not rewrite already-applied history.
- Avoid paid GitHub Actions or paid infrastructure unless explicitly approved.
- Do not perform irreversible hosted/customer-data changes without required approval.

## 10. UI / UX STANDARD

Hichki must remain recognizably Hichki.

Audit and polish the existing product rather than replacing it. Pay special attention to:

- mobile-first layout
- safe areas
- keyboard behavior
- back gestures/navigation
- outside-click/tap dismissal for transient surfaces
- chat composer density
- message grouping/timestamps
- home chat rows
- settings hierarchy
- Notes/Music surfaces
- share UI
- animation consistency
- reduced-motion support
- typography
- four curated themes
- contrast/accessibility
- Android/iOS parity

No generic AI dashboard aesthetics, no unnecessary glassmorphism, no random gradients, no oversized decoration, no cheap animation.

## 11. DEFINITION OF DONE

Do not call Hichki complete until the required evidence exists for:

- exact-current-HEAD deterministic install/build
- web runtime verification
- relay health/WebSocket verification
- Supabase migration/RLS/security verification
- real authenticated 2-user messaging acceptance
- fallback/dedupe/offline behavior
- Notes/Music sync/share acceptance
- production environment configuration
- Android acceptance
- iOS acceptance or an explicitly documented environment blocker
- final Netlify production deploy
- post-deploy smoke test
- project-state documentation
- safe GitHub save

If a gate cannot be executed, mark it `NOT RUN` or `BLOCKED` with the exact reason and continue all independent work.

### FINAL OPERATING PRINCIPLE

Act like the engineer who owns the release. Read evidence first, reason from actual state, fix root causes, verify with real executions, save each valid batch, and never substitute confidence for proof.
