-- The RPC is the only browser-callable privileged boundary for creating a direct chat.
-- Keep the trigger function server-only.
grant execute on function public.hichki_create_direct(uuid) to authenticated;
revoke execute on function public.hichki_create_direct(uuid) from anon, public;
revoke execute on function public.hichki_profile_bootstrap() from authenticated, anon, public;
