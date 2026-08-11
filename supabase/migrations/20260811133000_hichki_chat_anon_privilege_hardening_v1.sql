-- Defense-in-depth for the chat subsystem.
-- Anonymous clients never need table privileges for authenticated chat data.
-- Conversation creation is server-mediated; remove the obsolete direct-insert policy.
drop policy if exists conversations_insert_authenticated on public.conversations;
revoke all on table public.conversations from anon;
revoke all on table public.conversation_members from anon;
revoke all on table public.chat_messages from anon;
revoke all on table public.message_receipts from anon;
revoke all on table public.push_subscriptions from anon;
