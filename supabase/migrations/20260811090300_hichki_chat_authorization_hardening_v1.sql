create or replace function public.hichki_create_direct(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := (select auth.uid());
  conversation_id uuid;
begin
  if me is null then raise exception 'not_authenticated' using errcode='42501'; end if;
  if p_other_user_id is null or p_other_user_id = me then raise exception 'invalid_recipient' using errcode='22023'; end if;
  if not exists(select 1 from auth.users where id=p_other_user_id) then raise exception 'recipient_not_found' using errcode='22023'; end if;

  select c.id into conversation_id
  from public.conversations c
  where c.kind='direct'
    and exists(select 1 from public.conversation_members m where m.conversation_id=c.id and m.user_id=me)
    and exists(select 1 from public.conversation_members m where m.conversation_id=c.id and m.user_id=p_other_user_id)
    and (select count(*) from public.conversation_members m where m.conversation_id=c.id)=2
  order by c.created_at asc limit 1;

  if conversation_id is not null then return conversation_id; end if;
  insert into public.conversations(kind) values('direct') returning id into conversation_id;
  insert into public.conversation_members(conversation_id,user_id) values(conversation_id,me),(conversation_id,p_other_user_id);
  return conversation_id;
end;
$$;

revoke all on function public.hichki_create_direct(uuid) from public,anon;
grant execute on function public.hichki_create_direct(uuid) to authenticated;

create or replace function public.hichki_conversation_creator(p_conversation_id uuid)
returns uuid
language sql stable security invoker set search_path=public
as $$ select min(user_id) from public.conversation_members where conversation_id=p_conversation_id; $$;

-- Membership insertion is no longer a general self-insert primitive. Direct chats are created atomically by hichki_create_direct.
drop policy if exists conversation_members_insert_self on public.conversation_members;

create or replace function public.hichki_profile_bootstrap()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  insert into public.profiles(id,display_name)
  values(new.id,coalesce(nullif(new.raw_user_meta_data->>'display_name',''),'Hichki user'))
  on conflict(id) do update set display_name=excluded.display_name, updated_at=now();
  return new;
end;
$$;

drop trigger if exists hichki_auth_profile_bootstrap on auth.users;
create trigger hichki_auth_profile_bootstrap after insert on auth.users for each row execute function public.hichki_profile_bootstrap();
