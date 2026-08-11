-- Lock down the legacy `public.messages` table.
-- Hichki's active chat path uses `chat_messages`; the legacy table must not remain
-- anonymously readable/writable through the Supabase Data API.
revoke all on table public.messages from anon, authenticated;
drop policy if exists "Allow all inserts" on public.messages;
drop policy if exists "Allow all selects" on public.messages;

-- Remove table-level privileges that are unnecessary for browser clients and can
-- bypass the intended RLS authorization boundary (notably TRUNCATE).
revoke truncate, references, trigger on table public.chat_messages from anon, authenticated;
revoke truncate, references, trigger on table public.conversation_members from anon, authenticated;
revoke truncate, references, trigger on table public.conversations from anon, authenticated;
revoke truncate, references, trigger on table public.message_receipts from anon, authenticated;
revoke truncate, references, trigger on table public.profiles from anon, authenticated;
revoke truncate, references, trigger on table public.push_devices from anon, authenticated;
revoke truncate, references, trigger on table public.push_subscriptions from anon, authenticated;
revoke delete on table public.push_devices from anon, authenticated;
revoke delete on table public.push_subscriptions from anon;

-- Legacy push-device registration intentionally remains insertable by anon;
-- rows are not readable through the Data API.
