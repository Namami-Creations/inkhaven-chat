-- 🔥 ULTIMATE DATABASE RESET SCRIPT - SAFE VERSION
-- This script safely drops everything and recreates the schema
-- Run this in Supabase SQL Editor

-- Disable all RLS first to avoid conflicts
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN ('users', 'anonymous_sessions', 'messages', 'chat_rooms', 'room_participants', 'interests')
    LOOP
        EXECUTE 'ALTER TABLE public.' || table_name || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- Drop all policies safely
DO $$
DECLARE
    policy_record record;
BEGIN
    FOR policy_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON ' || policy_record.schemaname || '.' || policy_record.tablename;
    END LOOP;
END $$;

-- Drop functions
DROP FUNCTION IF EXISTS delete_old_messages() CASCADE;
DROP FUNCTION IF EXISTS delete_old_sessions() CASCADE;

-- Drop indexes
DROP INDEX IF EXISTS idx_messages_session_id CASCADE;
DROP INDEX IF EXISTS idx_messages_created_at CASCADE;
DROP INDEX IF EXISTS idx_anonymous_sessions_started_at CASCADE;
DROP INDEX IF EXISTS idx_chat_rooms_category CASCADE;
DROP INDEX IF EXISTS idx_room_participants_room_id CASCADE;

-- Drop storage policies
DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;

-- Delete storage bucket
DELETE FROM storage.buckets WHERE id = 'chat-files';

-- Drop tables in dependency order
DROP TABLE IF EXISTS public.room_participants CASCADE;
DROP TABLE IF EXISTS public.chat_rooms CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.anonymous_sessions CASCADE;
DROP TABLE IF EXISTS public.interests CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ====================================================================
-- ✅ CLEANUP COMPLETE - NOW RECREATE
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables in dependency order
CREATE TABLE public.users (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  anonymous_id text UNIQUE,
  email text UNIQUE,
  display_name text,
  avatar_url text,
  preferences jsonb DEFAULT '{}'::jsonb,
  is_registered boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.interests (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  popularity_score integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(name, category)
);

CREATE TABLE public.anonymous_sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  users text[] NOT NULL,
  interests text[] DEFAULT '{}',
  quality_score decimal(3,2) DEFAULT 0.0,
  started_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id uuid REFERENCES public.anonymous_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id text NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  file_url text,
  is_moderated boolean DEFAULT false,
  moderation_reason text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.chat_rooms (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  is_ai_generated boolean DEFAULT true,
  participant_count integer DEFAULT 0,
  max_participants integer DEFAULT 50,
  interests text[] DEFAULT '{}',
  moderation_rules jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.room_participants (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id uuid REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id text NOT NULL,
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  left_at timestamp with time zone,
  UNIQUE(room_id, user_id)
);

-- Create indexes
CREATE INDEX idx_messages_session_id ON public.messages(session_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_anonymous_sessions_started_at ON public.anonymous_sessions(started_at);
CREATE INDEX idx_chat_rooms_category ON public.chat_rooms(category);
CREATE INDEX idx_room_participants_room_id ON public.room_participants(room_id);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anonymous sessions are publicly readable" ON public.anonymous_sessions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create anonymous sessions" ON public.anonymous_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Messages readable by session participants" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.anonymous_sessions
      WHERE id = messages.session_id
      AND array[auth.jwt() ->> 'sub'] <@ users
    )
  );

CREATE POLICY "Messages insertable by session participants" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.anonymous_sessions
      WHERE id = messages.session_id
      AND array[auth.jwt() ->> 'sub'] <@ users
    )
  );

CREATE POLICY "Chat rooms are publicly readable" ON public.chat_rooms
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create rooms" ON public.chat_rooms
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Interests are publicly readable" ON public.interests
  FOR SELECT USING (true);

CREATE POLICY "Room participants publicly readable" ON public.room_participants
  FOR SELECT USING (true);

-- Create functions
CREATE OR REPLACE FUNCTION delete_old_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM public.messages
  WHERE created_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_old_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.anonymous_sessions
  WHERE started_at < now() - interval '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files',
  'chat-files',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/*', 'video/*', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their own files" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Insert sample interests
INSERT INTO public.interests (name, category, popularity_score) VALUES
  ('programming', 'Technology', 85),
  ('gaming', 'Entertainment', 72),
  ('music', 'Arts', 68),
  ('travel', 'Lifestyle', 61),
  ('cooking', 'Food', 55),
  ('sports', 'Health', 49),
  ('books', 'Education', 43),
  ('movies', 'Entertainment', 38),
  ('fitness', 'Health', 35),
  ('art', 'Arts', 29)
ON CONFLICT (name, category) DO NOTHING;

-- Success confirmation
SELECT
  '🎉 Database successfully reset and recreated!' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tables_created,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as policies_created;
