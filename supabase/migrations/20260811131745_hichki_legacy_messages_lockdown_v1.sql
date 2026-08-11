-- Canonical source record for the live migration version generated while applying
-- the legacy public.messages lockdown to the Hichki Supabase project.
revoke all on table public.messages from anon, authenticated;
drop policy if exists "Allow all inserts" on public.messages;
drop policy if exists "Allow all selects" on public.messages;

revoke truncate, references, trigger on table public.chat_messages from anon, authenticated;
revoke truncate, references, trigger on table public.conversation_members from anon, authenticated;
revoke truncate, references, trigger on table public.conversations from anon, authenticated;
revoke truncate, references, trigger on table public.message_receipts from anon, authenticated;
revoke truncate, references, trigger on table public.profiles from anon, authenticated;
revoke truncate, references, trigger on table public.push_devices from anon, authenticated;
revoke truncate, references, trigger on table public.push_subscriptions from anon, authenticated;
revoke delete on table public.push_devices from anon, authenticated;
revoke delete on table public.push_subscriptions from anon;
