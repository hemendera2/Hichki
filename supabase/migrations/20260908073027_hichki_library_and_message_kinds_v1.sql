-- Hichki synced Notes/Music library + first-class chat sharing kinds.

alter table public.chat_messages
  drop constraint if exists chat_messages_kind_check;

alter table public.chat_messages
  add constraint chat_messages_kind_check
  check (kind in ('text','image','audio','file','system','note','music'));

create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('note','music')),
  title text not null default '' check (char_length(title) between 1 and 200),
  body text not null default '' check (char_length(body) <= 50000),
  url text check (url is null or char_length(url) <= 4096),
  cover_url text check (cover_url is null or char_length(cover_url) <= 4096),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists library_items_owner_updated_idx
  on public.library_items(owner_id, updated_at desc, id);

alter table public.library_items enable row level security;

revoke all on table public.library_items from anon;
revoke all on table public.library_items from authenticated;
grant select, insert, update, delete on table public.library_items to authenticated;

drop policy if exists library_items_select_owner on public.library_items;
create policy library_items_select_owner
  on public.library_items for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists library_items_insert_owner on public.library_items;
create policy library_items_insert_owner
  on public.library_items for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists library_items_update_owner on public.library_items;
create policy library_items_update_owner
  on public.library_items for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists library_items_delete_owner on public.library_items;
create policy library_items_delete_owner
  on public.library_items for delete to authenticated
  using (owner_id = (select auth.uid()));

drop trigger if exists library_items_touch_updated_at on public.library_items;
create trigger library_items_touch_updated_at
  before update on public.library_items
  for each row execute function public.hichki_touch_updated_at();
