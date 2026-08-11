-- Canonical source record for the live migration version generated while making
-- the retired legacy messages table explicitly fail-closed under RLS.
drop policy if exists legacy_messages_deny_all on public.messages;
create policy legacy_messages_deny_all on public.messages as restrictive for all to public using (false) with check (false);
