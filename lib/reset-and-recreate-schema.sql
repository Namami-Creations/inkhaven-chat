-- 🔥 COMPLETE DATABASE RESET AND RECREATE SCRIPT
-- ⚠️  WARNING: This will DELETE ALL existing data in your Supabase project!
-- Run this ONLY if you want to completely reset your database schema

-- Step 1: Drop all existing policies (RLS)
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Anonymous sessions are publicly readable" ON public.anonymous_sessions;
DROP POLICY IF EXISTS "Anyone can create anonymous sessions" ON public.anonymous_sessions;
DROP POLICY IF EXISTS "Messages readable by session participants" ON public.messages;
DROP POLICY IF EXISTS "Messages insertable by session participants" ON public.messages;
DROP POLICY IF EXISTS "Chat rooms are publicly readable" ON public.chat_rooms;
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Interests are publicly readable" ON public.interests;
DROP POLICY IF EXISTS "Room participants publicly readable" ON public.room_participants;
DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;

-- Step 2: Drop all existing functions
DROP FUNCTION IF EXISTS delete_old_messages();
DROP FUNCTION IF EXISTS delete_old_sessions();

-- Step 3: Drop all existing indexes
DROP INDEX IF EXISTS idx_messages_session_id;
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_anonymous_sessions_started_at;
DROP INDEX IF EXISTS idx_chat_rooms_category;
DROP INDEX IF EXISTS idx_room_participants_room_id;

-- Step 4: Drop all existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS public.room_participants CASCADE;
DROP TABLE IF EXISTS public.chat_rooms CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.anonymous_sessions CASCADE;
DROP TABLE IF EXISTS public.interests CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Step 5: Delete existing storage bucket
DELETE FROM storage.buckets WHERE id = 'chat-files';

-- Step 6: Disable RLS on any remaining tables (safety measure)
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.anonymous_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.room_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.interests DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 🎯 NOW RECREATE THE NEW SCHEMA
-- ====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (anonymous + registered)
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

-- Interests table for AI matching
CREATE TABLE public.interests (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  popularity_score integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(name, category)
);

-- Anonymous chat sessions
CREATE TABLE public.anonymous_sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  users text[] NOT NULL, -- array of anonymous user IDs
  interests text[] DEFAULT '{}', -- AI-detected interests
  quality_score decimal(3,2) DEFAULT 0.0,
  started_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Messages table (ephemeral, auto-delete after 24h)
CREATE TABLE public.messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id uuid REFERENCES public.anonymous_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id text NOT NULL, -- anonymous user ID
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  file_url text,
  is_moderated boolean DEFAULT false,
  moderation_reason text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Chat rooms (AI-generated)
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

-- Room participants
CREATE TABLE public.room_participants (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id uuid REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id text NOT NULL, -- anonymous user ID
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  left_at timestamp with time zone,
  UNIQUE(room_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_messages_session_id ON public.messages(session_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_anonymous_sessions_started_at ON public.anonymous_sessions(started_at);
CREATE INDEX idx_chat_rooms_category ON public.chat_rooms(category);
CREATE INDEX idx_room_participants_room_id ON public.room_participants(room_id);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;

-- Users: Users can only see their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Anonymous sessions: No restrictions for anonymous access
CREATE POLICY "Anonymous sessions are publicly readable" ON public.anonymous_sessions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create anonymous sessions" ON public.anonymous_sessions
  FOR INSERT WITH CHECK (true);

-- Messages: Part of session can be read by session participants
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

-- Chat rooms: Publicly readable
CREATE POLICY "Chat rooms are publicly readable" ON public.chat_rooms
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create rooms" ON public.chat_rooms
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Interests: Publicly readable
CREATE POLICY "Interests are publicly readable" ON public.interests
  FOR SELECT USING (true);

-- Room participants: Publicly readable for room discovery
CREATE POLICY "Room participants publicly readable" ON public.room_participants
  FOR SELECT USING (true);

-- Functions for auto-cleanup
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

-- Storage bucket for files (encrypted)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files',
  'chat-files',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/*', 'video/*', 'application/pdf']
);

-- Storage policies
CREATE POLICY "Users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their own files" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ====================================================================
-- ✅ SCHEMA RECREATION COMPLETE
-- ====================================================================

-- Optional: Insert some sample interests for testing
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

-- Success message
SELECT '🎉 Database schema successfully reset and recreated!' as status;
