-- Keep conversation ordering/activity accurate when messages change.
create or replace function public.hichki_touch_conversation_activity()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.conversations
     set updated_at = now()
   where id = coalesce(new.conversation_id, old.conversation_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists chat_messages_touch_conversation_activity on public.chat_messages;
create trigger chat_messages_touch_conversation_activity
after insert or update or delete on public.chat_messages
for each row execute function public.hichki_touch_conversation_activity();
