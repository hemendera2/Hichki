-- Defense-in-depth: the legacy messages table is not part of Hichki's active
-- chat contract. Keep Data API roles unable to use it even if stale policies
-- are recreated accidentally.
revoke all on table public.messages from public;
revoke all on table public.messages from anon, authenticated;
