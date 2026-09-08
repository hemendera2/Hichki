-- Structural regression guard for Hichki private conversation media storage.
DO $$
DECLARE
  bucket_public boolean;
  bucket_limit bigint;
  policy_count integer;
  kind_constraint text;
  helper_anon boolean;
  helper_auth boolean;
BEGIN
  SELECT public, file_size_limit
    INTO bucket_public, bucket_limit
    FROM storage.buckets
   WHERE id = 'hichki-chat-media';

  IF bucket_public IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'hichki-chat-media bucket must exist and remain private';
  END IF;
  IF bucket_limit IS DISTINCT FROM 26214400 THEN
    RAISE EXCEPTION 'hichki-chat-media file size limit must remain 25 MiB';
  END IF;

  SELECT count(*) INTO policy_count
    FROM pg_policies
   WHERE schemaname = 'storage'
     AND tablename = 'objects'
     AND policyname IN (
       'hichki_chat_media_select_member',
       'hichki_chat_media_insert_member_owner',
       'hichki_chat_media_delete_owner'
     );
  IF policy_count <> 3 THEN
    RAISE EXCEPTION 'expected three private media object policies, found %', policy_count;
  END IF;

  SELECT has_function_privilege('anon', 'public.hichki_media_conversation_id(text)', 'EXECUTE') INTO helper_anon;
  SELECT has_function_privilege('authenticated', 'public.hichki_media_conversation_id(text)', 'EXECUTE') INTO helper_auth;
  IF helper_anon OR NOT helper_auth THEN
    RAISE EXCEPTION 'media conversation helper execute privileges are incorrect';
  END IF;

  SELECT pg_get_constraintdef(oid)
    INTO kind_constraint
    FROM pg_constraint
   WHERE conrelid = 'public.chat_messages'::regclass
     AND conname = 'chat_messages_kind_check';
  IF kind_constraint IS NULL
     OR kind_constraint NOT LIKE '%image%'
     OR kind_constraint NOT LIKE '%video%'
     OR kind_constraint NOT LIKE '%audio%'
     OR kind_constraint NOT LIKE '%file%'
     OR kind_constraint NOT LIKE '%note%'
     OR kind_constraint NOT LIKE '%music%' THEN
    RAISE EXCEPTION 'chat message kind constraint is missing supported media/library kinds';
  END IF;
END $$;
