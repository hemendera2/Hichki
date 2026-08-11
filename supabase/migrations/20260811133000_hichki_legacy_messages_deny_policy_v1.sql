-- Keep RLS explicitly fail-closed on the retired legacy messages table.
-- No client role has table privileges, and the active chat path uses chat_messages.
create policy legacy_messages_deny_all on public.messages as restrictive for all to public using (false) with check (false);
