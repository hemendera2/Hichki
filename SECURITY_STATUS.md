# Hichki Security Status

## Verified findings — 2026-08-11

The connected Supabase project was inspected directly.

### Active chat authorization

The `chat_messages` surface has authenticated membership-scoped SELECT/INSERT/UPDATE/DELETE policies. Message receipts are likewise constrained to the authenticated user and conversation membership.

### Legacy chat surface

A legacy `public.messages` table was still carrying broad `public`/Data API access in the inspected database. Hichki's active chat contract uses `chat_messages`, so this legacy surface is now explicitly locked down in the repository migrations:

- `20260811105000_hichki_legacy_messages_lockdown_v1.sql`
- `20260811105500_hichki_legacy_messages_privilege_guard_v1.sql`
- regression test: `supabase/tests/database/legacy_messages_lockdown.sql`

**Important:** the migration files are committed to GitHub. Applying DDL to the live Supabase project requires the repository migration runner/CI path; no direct destructive DDL was executed here merely to make the repository appear complete.

### Push functions

The inspected project currently exposes active v3 push and conversation functions with JWT verification enabled. The current conversation v3 function authenticates the caller before invoking the actor-bound database RPC.

## Remaining verification gates

- Apply and verify the new legacy-table migration in the intended project through the canonical migration path.
- Execute the database regression suite.
- Verify production build and GitHub Actions results.
- Exercise authenticated chat/realtime/offline/receipt/push flows end-to-end.

Do not represent these gates as passed until actual evidence exists.
