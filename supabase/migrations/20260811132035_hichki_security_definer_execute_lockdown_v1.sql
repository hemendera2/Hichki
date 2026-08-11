-- Security-definer RPCs are only invoked through trusted server-side paths or triggers.
-- Do not expose them through the Supabase Data API roles.
revoke execute on function public.hichki_handle_new_user() from public, anon, authenticated;
revoke execute on function public.hichki_create_direct(uuid) from public, anon, authenticated;
revoke execute on function public.hichki_profile_bootstrap() from public, anon, authenticated;
revoke execute on function public.hichki_create_direct_for_actor(uuid, uuid) from public, anon, authenticated;
