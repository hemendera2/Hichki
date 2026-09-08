-- Private, conversation-scoped media storage for Hichki chat.
-- Source migration only until explicitly applied to the hosted project.

alter table public.chat_messages
  drop constraint if exists chat_messages_kind_check;

alter table public.chat_messages
  add constraint chat_messages_kind_check
  check (kind in ('text','image','video','audio','file','system','note','music'));

create or replace function public.hichki_media_conversation_id(object_name text)
returns uuid
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  first_segment text;
begin
  first_segment := split_part(coalesce(object_name, ''), '/', 1);
  if first_segment !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return null;
  end if;
  return first_segment::uuid;
end;
$$;

revoke all on function public.hichki_media_conversation_id(text) from public, anon;
grant execute on function public.hichki_media_conversation_id(text) to authenticated, service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hichki-chat-media',
  'hichki-chat-media',
  false,
  26214400,
  array[
    'image/*',
    'video/*',
    'audio/*',
    'application/pdf',
    'text/plain',
    'application/zip',
    'application/json',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]::text[]
)
on conflict (id) do update set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists hichki_chat_media_select_member on storage.objects;
create policy hichki_chat_media_select_member
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'hichki-chat-media'
    and public.hichki_media_conversation_id(name) is not null
    and public.hichki_is_member(public.hichki_media_conversation_id(name))
  );

drop policy if exists hichki_chat_media_insert_member_owner on storage.objects;
create policy hichki_chat_media_insert_member_owner
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'hichki-chat-media'
    and public.hichki_media_conversation_id(name) is not null
    and public.hichki_is_member(public.hichki_media_conversation_id(name))
    and split_part(name, '/', 2) = (select auth.uid())::text
    and split_part(name, '/', 3) <> ''
  );

drop policy if exists hichki_chat_media_delete_owner on storage.objects;
create policy hichki_chat_media_delete_owner
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'hichki-chat-media'
    and public.hichki_media_conversation_id(name) is not null
    and public.hichki_is_member(public.hichki_media_conversation_id(name))
    and split_part(name, '/', 2) = (select auth.uid())::text
  );
