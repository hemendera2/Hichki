create table if not exists public.message_receipts (
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  delivered_at timestamptz,
  read_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (message_id,user_id)
);

create index if not exists message_receipts_user_message_idx on public.message_receipts(user_id,message_id);

alter table public.message_receipts enable row level security;

create policy message_receipts_select_member on public.message_receipts
for select to authenticated
using (
  exists (
    select 1 from public.chat_messages m
    join public.conversation_members cm on cm.conversation_id=m.conversation_id
    where m.id=message_receipts.message_id and cm.user_id=(select auth.uid())
  )
);

create policy message_receipts_insert_self on public.message_receipts
for insert to authenticated
with check (
  user_id=(select auth.uid()) and
  exists (
    select 1 from public.chat_messages m
    join public.conversation_members cm on cm.conversation_id=m.conversation_id
    where m.id=message_receipts.message_id and cm.user_id=(select auth.uid())
  )
);

create policy message_receipts_update_self on public.message_receipts
for update to authenticated
using (user_id=(select auth.uid()))
with check (user_id=(select auth.uid()));
