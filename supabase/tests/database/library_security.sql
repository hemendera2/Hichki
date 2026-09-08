-- Structural regression guard for Hichki library security and chat sharing kinds.
DO $$
DECLARE
  rls_enabled boolean;
  anon_select boolean;
  auth_select boolean;
  policy_count integer;
  kind_constraint text;
BEGIN
  SELECT c.relrowsecurity
    INTO rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND c.relname = 'library_items';

  IF NOT coalesce(rls_enabled, false) THEN
    RAISE EXCEPTION 'public.library_items must have RLS enabled';
  END IF;

  SELECT has_table_privilege('anon', 'public.library_items', 'SELECT') INTO anon_select;
  SELECT has_table_privilege('authenticated', 'public.library_items', 'SELECT') INTO auth_select;
  IF anon_select OR NOT auth_select THEN
    RAISE EXCEPTION 'library_items Data API privileges are not owner-authenticated only';
  END IF;

  SELECT count(*) INTO policy_count
    FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'library_items'
     AND policyname IN (
       'library_items_select_owner',
       'library_items_insert_owner',
       'library_items_update_owner',
       'library_items_delete_owner'
     );
  IF policy_count <> 4 THEN
    RAISE EXCEPTION 'expected four explicit library_items owner policies, found %', policy_count;
  END IF;

  SELECT pg_get_constraintdef(oid)
    INTO kind_constraint
    FROM pg_constraint
   WHERE conrelid = 'public.chat_messages'::regclass
     AND conname = 'chat_messages_kind_check';
  IF kind_constraint IS NULL OR kind_constraint NOT LIKE '%note%' OR kind_constraint NOT LIKE '%music%' THEN
    RAISE EXCEPTION 'chat_messages kind constraint does not allow note/music';
  END IF;
END $$;
