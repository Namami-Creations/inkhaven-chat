-- =============================================================================
-- SUPABASE STORAGE SETUP FOR INKHAVEN CHAT
-- Simplified storage policies that work with Supabase permissions
-- =============================================================================

-- Create voice-messages storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'voice-messages',
    'voice-messages',
    false, -- Private bucket for security
    10485760, -- 10MB limit per file
    ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'] -- Audio formats only
)
ON CONFLICT (name) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create chat-attachments storage bucket (images, audio, video, docs, archives)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chat-attachments',
    'chat-attachments',
    false,
    31457280, -- 30MB per file
    ARRAY[
        'image/png', 'image/jpeg', 'image/webp', 'image/gif',
        'audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg',
        'video/mp4', 'video/webm', 'video/quicktime',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'application/zip'
    ]
)
ON CONFLICT (name) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================================================
-- STORAGE SECURITY POLICIES
-- Using standard PostgreSQL RLS policies on storage.objects
-- =============================================================================

-- NOTE:
-- In many Supabase projects, the SQL role you connect with may NOT be the owner of
-- `storage.objects`, which means ALTER TABLE / CREATE POLICY will fail.
-- Buckets are the main requirement for this app; policy tweaks are best-effort.

DO $$
BEGIN
    -- Enable RLS on storage.objects (best-effort)
    BEGIN
        EXECUTE 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping: ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY (insufficient_privilege)';
    END;

    -- Policies (best-effort)
    BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "voice_messages_upload_policy" ON storage.objects';
        EXECUTE 'DROP POLICY IF EXISTS "voice_messages_read_policy" ON storage.objects';
        EXECUTE 'DROP POLICY IF EXISTS "voice_messages_update_policy" ON storage.objects';
        EXECUTE 'DROP POLICY IF EXISTS "voice_messages_delete_policy" ON storage.objects';
        EXECUTE 'DROP POLICY IF EXISTS "voice_messages_service_role_policy" ON storage.objects';
        EXECUTE 'DROP POLICY IF EXISTS "chat_attachments_upload_policy" ON storage.objects';
        EXECUTE 'DROP POLICY IF EXISTS "chat_attachments_read_policy" ON storage.objects';
        EXECUTE 'DROP POLICY IF EXISTS "chat_attachments_update_policy" ON storage.objects';
        EXECUTE 'DROP POLICY IF EXISTS "chat_attachments_delete_policy" ON storage.objects';
        EXECUTE 'DROP POLICY IF EXISTS "chat_attachments_service_role_policy" ON storage.objects';

        EXECUTE 'CREATE POLICY "voice_messages_service_role_policy" ON storage.objects FOR ALL TO service_role USING (bucket_id = ''voice-messages'') WITH CHECK (bucket_id = ''voice-messages'')';
        EXECUTE 'CREATE POLICY "chat_attachments_service_role_policy" ON storage.objects FOR ALL TO service_role USING (bucket_id = ''chat-attachments'') WITH CHECK (bucket_id = ''chat-attachments'')';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping: storage.objects policy setup (insufficient_privilege)';
    END;

    -- Basic grants (best-effort)
    BEGIN
        EXECUTE 'GRANT USAGE ON SCHEMA storage TO authenticated';
        EXECUTE 'GRANT SELECT ON storage.buckets TO authenticated';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping: storage grants (insufficient_privilege)';
    END;
END $$;