create or replace function public.hichki_create_direct_for_actor(p_actor_id uuid,p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  conversation_id uuid;
begin
  if p_actor_id is null or p_other_user_id is null or p_actor_id = p_other_user_id then raise exception 'invalid_recipient' using errcode='22023'; end if;
  if not exists(select 1 from auth.users where id=p_actor_id) then raise exception 'actor_not_found' using errcode='22023'; end if;
  if not exists(select 1 from auth.users where id=p_other_user_id) then raise exception 'recipient_not_found' using errcode='22023'; end if;
  select c.id into conversation_id
  from public.conversations c
  where c.kind='direct'
    and exists(select 1 from public.conversation_members m where m.conversation_id=c.id and m.user_id=p_actor_id)
    and exists(select 1 from public.conversation_members m where m.conversation_id=c.id and m.user_id=p_other_user_id)
    and (select count(*) from public.conversation_members m where m.conversation_id=c.id)=2
  order by c.created_at asc limit 1;
  if conversation_id is not null then return conversation_id; end if;
  insert into public.conversations(kind,created_by) values('direct',p_actor_id) returning id into conversation_id;
  insert into public.conversation_members(conversation_id,user_id) values(conversation_id,p_actor_id),(conversation_id,p_other_user_id);
  return conversation_id;
end;
$$;
revoke execute on function public.hichki_create_direct_for_actor(uuid,uuid) from public,anon,authenticated;
grant execute on function public.hichki_create_direct_for_actor(uuid,uuid) to service_role;
