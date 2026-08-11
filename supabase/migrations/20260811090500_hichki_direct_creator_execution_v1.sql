-- The direct-chat RPC is an internal privileged primitive used only by the trusted Edge Function.
-- It must never be exposed as /rest/v1/rpc to browser-authenticated users.
revoke execute on function public.hichki_create_direct(uuid) from authenticated, anon, public;
revoke execute on function public.hichki_profile_bootstrap() from authenticated, anon, public;
