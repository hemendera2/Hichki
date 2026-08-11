-- Final security state: the SECURITY DEFINER direct-chat primitive is internal-only.
revoke execute on function public.hichki_create_direct(uuid) from authenticated;
revoke execute on function public.hichki_create_direct(uuid) from anon;
revoke execute on function public.hichki_create_direct(uuid) from public;
revoke execute on function public.hichki_profile_bootstrap() from authenticated;
revoke execute on function public.hichki_profile_bootstrap() from anon;
revoke execute on function public.hichki_profile_bootstrap() from public;
