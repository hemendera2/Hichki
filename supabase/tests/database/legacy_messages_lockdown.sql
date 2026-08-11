-- Regression guard for the legacy public.messages surface.
-- This test is intentionally schema-level and does not require user credentials.

DO $$
DECLARE
  anon_insert boolean;
  anon_select boolean;
  auth_insert boolean;
  auth_select boolean;
BEGIN
  SELECT has_table_privilege('anon', 'public.messages', 'INSERT') INTO anon_insert;
  SELECT has_table_privilege('anon', 'public.messages', 'SELECT') INTO anon_select;
  SELECT has_table_privilege('authenticated', 'public.messages', 'INSERT') INTO auth_insert;
  SELECT has_table_privilege('authenticated', 'public.messages', 'SELECT') INTO auth_select;

  IF anon_insert OR anon_select OR auth_insert OR auth_select THEN
    RAISE EXCEPTION 'legacy public.messages remains accessible through Data API roles';
  END IF;
END $$;
