create or replace function public.hichki_get_or_create_direct(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := (select auth.uid());
  existing_id uuid;
  new_id uuid;
begin
  if me is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if p_other_user_id is null or p_other_user_id = me then
    raise exception 'invalid_recipient' using errcode = '22023';
  end if;
  if not exists (select 1 from auth.users where id = p_other_user_id) then
    raise exception 'recipient_not_found' using errcode = '22023';
  end if;

  select c.id into existing_id
  from public.conversations c
  where c.kind = 'direct'
    and exists (select 1 from public.conversation_members a where a.conversation_id=c.id and a.user_id=me)
    and exists (select 1 from public.conversation_members b where b.conversation_id=c.id and b.user_id=p_other_user_id)
    and (select count(*) from public.conversation_members m where m.conversation_id=c.id)=2
  order by c.created_at asc
  limit 1;

  if existing_id is not null then
    return existing_id;
  end if;

  insert into public.conversations(kind) values ('direct') returning id into new_id;
  insert into public.conversation_members(conversation_id,user_id)
  values (new_id,me),(new_id,p_other_user_id);
  return new_id;
end;
$$;

revoke all on function public.hichki_get_or_create_direct(uuid) from public, anon;
grant execute on function public.hichki_get_or_create_direct(uuid) to authenticated;
