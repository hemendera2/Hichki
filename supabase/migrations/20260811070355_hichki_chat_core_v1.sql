create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Hichki user' check (char_length(display_name) between 1 and 80),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'direct' check (kind = 'direct'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists conversation_members_user_idx on public.conversation_members(user_id, conversation_id);
create index if not exists conversations_updated_idx on public.conversations(updated_at desc);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  content text not null check (char_length(content) between 1 and 10000),
  kind text not null default 'text' check (kind in ('text','image','audio','file','system')),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  unique(sender_id, client_id)
);

create index if not exists chat_messages_conversation_created_idx on public.chat_messages(conversation_id, created_at asc, id asc);
create index if not exists chat_messages_sender_idx on public.chat_messages(sender_id, created_at desc);

create table if not exists public.push_subscriptions (
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null check (char_length(device_id) between 8 and 128),
  platform text not null check (platform in ('android','ios','web')),
  token text not null check (char_length(token) between 20 and 4096),
  updated_at timestamptz not null default now(),
  primary key (user_id, device_id)
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

create or replace function public.hichki_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.hichki_touch_updated_at();
drop trigger if exists conversations_touch_updated_at on public.conversations;
create trigger conversations_touch_updated_at before update on public.conversations for each row execute function public.hichki_touch_updated_at();
drop trigger if exists push_subscriptions_touch_updated_at on public.push_subscriptions;
create trigger push_subscriptions_touch_updated_at before update on public.push_subscriptions for each row execute function public.hichki_touch_updated_at();

create or replace function public.hichki_is_member(p_conversation_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = p_conversation_id
      and cm.user_id = (select auth.uid())
  );
$$;

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.chat_messages enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated on public.profiles for select to authenticated using (true);
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists conversations_select_member on public.conversations;
create policy conversations_select_member on public.conversations for select to authenticated using (public.hichki_is_member(id));
drop policy if exists conversations_insert_authenticated on public.conversations;
create policy conversations_insert_authenticated on public.conversations for insert to authenticated with check (true);
drop policy if exists conversations_update_member on public.conversations;
create policy conversations_update_member on public.conversations for update to authenticated using (public.hichki_is_member(id)) with check (public.hichki_is_member(id));

drop policy if exists conversation_members_select_member on public.conversation_members;
create policy conversation_members_select_member on public.conversation_members for select to authenticated using (public.hichki_is_member(conversation_id));
drop policy if exists conversation_members_insert_self on public.conversation_members;
create policy conversation_members_insert_self on public.conversation_members for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists chat_messages_select_member on public.chat_messages;
create policy chat_messages_select_member on public.chat_messages for select to authenticated using (public.hichki_is_member(conversation_id));
drop policy if exists chat_messages_insert_member_sender on public.chat_messages;
create policy chat_messages_insert_member_sender on public.chat_messages for insert to authenticated with check (sender_id = (select auth.uid()) and public.hichki_is_member(conversation_id));
drop policy if exists chat_messages_update_sender on public.chat_messages;
create policy chat_messages_update_sender on public.chat_messages for update to authenticated using (sender_id = (select auth.uid()) and public.hichki_is_member(conversation_id)) with check (sender_id = (select auth.uid()) and public.hichki_is_member(conversation_id));
drop policy if exists chat_messages_delete_sender on public.chat_messages;
create policy chat_messages_delete_sender on public.chat_messages for delete to authenticated using (sender_id = (select auth.uid()) and public.hichki_is_member(conversation_id));

drop policy if exists push_subscriptions_select_self on public.push_subscriptions;
create policy push_subscriptions_select_self on public.push_subscriptions for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists push_subscriptions_insert_self on public.push_subscriptions;
create policy push_subscriptions_insert_self on public.push_subscriptions for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists push_subscriptions_update_self on public.push_subscriptions;
create policy push_subscriptions_update_self on public.push_subscriptions for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists push_subscriptions_delete_self on public.push_subscriptions;
create policy push_subscriptions_delete_self on public.push_subscriptions for delete to authenticated using (user_id = (select auth.uid()));

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages'
     ) then
    execute 'alter publication supabase_realtime add table public.chat_messages';
  end if;
end $$;
