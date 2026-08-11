-- Lock down the legacy `public.messages` table.
-- Hichki's active chat path uses `chat_messages`; the legacy table must not remain
-- anonymously readable/writable through the Supabase Data API.
revoke all on table public.messages from anon, authenticated;
drop policy if exists "Allow all inserts" on public.messages;
drop policy if exists "Allow all selects" on public.messages;
