-- Browser clients never create conversation rows directly; the authenticated Edge Function does it with service-role access.
revoke insert on table public.conversations from authenticated, anon;
revoke insert on table public.conversation_members from authenticated, anon;
