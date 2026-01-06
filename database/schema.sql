-- InkHaven Chat core schema with RLS
-- Generated on 2026-01-02

-- Required extensions and helper schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SCHEMA IF NOT EXISTS app;

-- Helper to resolve current user id from either session context or auth.uid()
CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT coalesce(current_setting('app.current_user_id', true), auth.uid()::text);
$$;

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION app.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Interest overlap score helper
CREATE OR REPLACE FUNCTION app.shared_interest_count(a text[], b text[])
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT count(*)::int
  FROM (
    SELECT unnest(coalesce(a, '{}'::text[]))
    INTERSECT
    SELECT unnest(coalesce(b, '{}'::text[]))
  ) t;
$$;

-- Atomic match-making (prevents double-matching and race conditions)
-- NOTE: Supabase RPC endpoints are exposed from the public schema.
CREATE OR REPLACE FUNCTION public.matchmake(
  p_user_id text,
  p_interests text[],
  p_language text,
  p_age_group text,
  p_mood text DEFAULT NULL
)
RETURNS TABLE(
  success boolean,
  status text,
  session_id text,
  partner_user_id text,
  partner_interests text[],
  partner_language text
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_candidate record;
  v_session_id text;
BEGIN
  -- Keep matching fresh
  DELETE FROM waiting_users
  WHERE created_at < now() - interval '10 minutes';

  -- Lock the best candidate row so two requests can't match the same person
  -- Prioritize mood matches, then interest matches
  SELECT
    wu.user_id,
    wu.interests,
    wu.language,
    wu.mood,
    CASE
      WHEN wu.mood = p_mood AND p_mood IS NOT NULL THEN 100 + app.shared_interest_count(wu.interests, p_interests)
      ELSE app.shared_interest_count(wu.interests, p_interests)
    END AS score
  INTO v_candidate
  FROM waiting_users wu
  WHERE wu.user_id <> p_user_id
    AND wu.language = p_language
    AND wu.age_group = p_age_group
  ORDER BY score DESC, wu.created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF FOUND AND v_candidate.score > 0 THEN
    v_session_id := concat('sess_', replace(gen_random_uuid()::text, '-', ''));

    DELETE FROM waiting_users
    WHERE user_id IN (p_user_id, v_candidate.user_id);

    INSERT INTO anonymous_sessions (id, user1_id, user2_id, status)
    VALUES (v_session_id, p_user_id, v_candidate.user_id, 'active');

    success := true;
    status := 'matched';
    session_id := v_session_id;
    partner_user_id := v_candidate.user_id;
    partner_interests := v_candidate.interests;
    partner_language := v_candidate.language;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Put requester into the queue (idempotent)
  INSERT INTO waiting_users (user_id, interests, language, age_group, mood, created_at)
  VALUES (p_user_id, coalesce(p_interests, '{}'::text[]), p_language, p_age_group, p_mood, now())
  ON CONFLICT (user_id) DO UPDATE
    SET interests = excluded.interests,
        language = excluded.language,
        age_group = excluded.age_group,
        mood = excluded.mood,
        created_at = excluded.created_at;

  success := false;
  status := 'waiting';
  session_id := null;
  partner_user_id := null;
  partner_interests := null;
  partner_language := null;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION app.shared_interest_count(text[], text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.shared_interest_count(text[], text[]) TO service_role;

REVOKE ALL ON FUNCTION public.matchmake(text, text[], text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.matchmake(text, text[], text, text, text) TO service_role;

-- Sessions between two anonymous users
CREATE TABLE IF NOT EXISTS anonymous_sessions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user1_id text NOT NULL,
  user2_id text NOT NULL,
  status text NOT NULL DEFAULT 'active', -- active | ended | reported | dropped
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

-- Waiting users queued for matching
CREATE TABLE IF NOT EXISTS waiting_users (
  user_id text PRIMARY KEY,
  interests text[] NOT NULL DEFAULT '{}',
  language text NOT NULL,
  age_group text NOT NULL,
  mood text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'voice')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- WebRTC / call signaling payloads
CREATE TABLE IF NOT EXISTS call_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
  from_user_id text NOT NULL,
  to_user_id text NOT NULL,
  signal_type text NOT NULL,
  signal_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);

-- Voice message metadata
CREATE TABLE IF NOT EXISTS voice_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  file_path text NOT NULL,
  file_url text NOT NULL,
  duration numeric NOT NULL,
  file_size bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

-- Abuse reports
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id text NOT NULL,
  reported_user_id text,
  session_id text,
  reason text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User profiles (optional persistent identity and plan)
CREATE TABLE IF NOT EXISTS profiles (
  user_id text PRIMARY KEY,
  ink_id text UNIQUE,
  display_name text,
  plan text DEFAULT 'free',
  reputation integer DEFAULT 50,
  interests text[] DEFAULT '{}',
  mood text,
  is_premium boolean DEFAULT false,
  premium_until timestamptz,
  karma integer DEFAULT 0,
  achievements text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;

CREATE TRIGGER trg_profiles_updated
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();

-- User usage tracking for freemium limits
CREATE TABLE IF NOT EXISTS user_usage (
  user_id text PRIMARY KEY,
  video_minutes_used integer DEFAULT 0,
  bottle_messages_used integer DEFAULT 0,
  story_mode_used integer DEFAULT 0,
  last_reset date DEFAULT CURRENT_DATE
);

-- Karma log for achievements
CREATE TABLE IF NOT EXISTS karma_log (
  id serial PRIMARY KEY,
  user_id text,
  action text,
  points integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Bottle messages for random delivery
CREATE TABLE IF NOT EXISTS bottle_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  content text NOT NULL,
  delivered boolean DEFAULT false,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Story mode sessions
CREATE TABLE IF NOT EXISTS story_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participants text[] NOT NULL DEFAULT '{}',
  current_turn integer DEFAULT 0,
  story_parts text[] DEFAULT '{}',
  status text DEFAULT 'active', -- active | completed
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Themed rooms
CREATE TABLE IF NOT EXISTS themed_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL, -- general, night_owls, gaming, philosophy, book_club, etc.
  is_premium boolean DEFAULT false,
  active_users integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Collaborative canvas drawings
CREATE TABLE IF NOT EXISTS canvas_drawings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  canvas_id text NOT NULL, -- session_id or room_id
  points jsonb NOT NULL, -- array of {x, y} coordinates
  color text NOT NULL DEFAULT '#000000',
  brush_size integer NOT NULL DEFAULT 2,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Music sync sessions
CREATE TABLE IF NOT EXISTS music_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  current_track jsonb, -- {id, title, artist, url, duration}
  is_playing boolean NOT NULL DEFAULT false,
  current_time float NOT NULL DEFAULT 0,
  volume float NOT NULL DEFAULT 0.7,
  participants text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Time capsules for future message delivery
CREATE TABLE IF NOT EXISTS time_capsules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id text NOT NULL,
  recipient_id text NOT NULL,
  content text NOT NULL,
  delivery_date timestamptz NOT NULL,
  is_delivered boolean NOT NULL DEFAULT false,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- File attachments (images, audio, video, docs, archives, other)
CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  file_path text NOT NULL,
  file_url text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint NOT NULL,
  file_kind text NOT NULL CHECK (file_kind IN ('image','audio','video','document','archive','other')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_status ON anonymous_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_users ON anonymous_sessions(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_waiting_users_created ON waiting_users(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_signals_session ON call_signals(session_id);
CREATE INDEX IF NOT EXISTS idx_call_signals_expires ON call_signals(expires_at);
CREATE INDEX IF NOT EXISTS idx_voice_messages_session ON voice_messages(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_messages_expires ON voice_messages(expires_at);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_session ON reports(session_id);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_reputation ON profiles(reputation);
CREATE INDEX IF NOT EXISTS idx_user_usage_reset ON user_usage(last_reset);
CREATE INDEX IF NOT EXISTS idx_karma_log_user ON karma_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bottle_messages_delivered ON bottle_messages(delivered);
CREATE INDEX IF NOT EXISTS idx_bottle_messages_created ON bottle_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_story_sessions_participants ON story_sessions USING GIN(participants);
CREATE INDEX IF NOT EXISTS idx_story_sessions_status ON story_sessions(status);
CREATE INDEX IF NOT EXISTS idx_themed_rooms_category ON themed_rooms(category);
CREATE INDEX IF NOT EXISTS idx_themed_rooms_premium ON themed_rooms(is_premium);
CREATE INDEX IF NOT EXISTS idx_attachments_session ON attachments(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_expires ON attachments(expires_at);

-- Enable RLS
ALTER TABLE anonymous_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE karma_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottle_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE themed_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies

-- Sessions: participants can read, only service role can write lifecycle changes
DROP POLICY IF EXISTS sessions_select ON anonymous_sessions;
CREATE POLICY sessions_select ON anonymous_sessions
FOR SELECT USING (
  auth.role() = 'service_role' OR user1_id = app.current_user_id() OR user2_id = app.current_user_id()
);

DROP POLICY IF EXISTS sessions_insert ON anonymous_sessions;
CREATE POLICY sessions_insert ON anonymous_sessions
FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS sessions_update ON anonymous_sessions;
CREATE POLICY sessions_update ON anonymous_sessions
FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Waiting users: owners only
DROP POLICY IF EXISTS waiting_users_select ON waiting_users;
CREATE POLICY waiting_users_select ON waiting_users
FOR SELECT USING (auth.role() = 'service_role' OR user_id = app.current_user_id());

DROP POLICY IF EXISTS waiting_users_insert ON waiting_users;
CREATE POLICY waiting_users_insert ON waiting_users
FOR INSERT WITH CHECK (auth.role() = 'service_role' OR user_id = app.current_user_id());

DROP POLICY IF EXISTS waiting_users_update ON waiting_users;
CREATE POLICY waiting_users_update ON waiting_users
FOR UPDATE USING (auth.role() = 'service_role' OR user_id = app.current_user_id())
WITH CHECK (auth.role() = 'service_role' OR user_id = app.current_user_id());

DROP POLICY IF EXISTS waiting_users_delete ON waiting_users;
CREATE POLICY waiting_users_delete ON waiting_users
FOR DELETE USING (auth.role() = 'service_role' OR user_id = app.current_user_id());

-- Messages: session participants
DROP POLICY IF EXISTS messages_select ON messages;
CREATE POLICY messages_select ON messages
FOR SELECT USING (
  auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM anonymous_sessions s
    WHERE s.id = session_id AND (s.user1_id = app.current_user_id() OR s.user2_id = app.current_user_id())
  )
);

DROP POLICY IF EXISTS messages_insert ON messages;
CREATE POLICY messages_insert ON messages
FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM anonymous_sessions s
    WHERE s.id = session_id AND (s.user1_id = app.current_user_id() OR s.user2_id = app.current_user_id())
  )
);

-- Call signals: session participants
DROP POLICY IF EXISTS call_signals_select ON call_signals;
CREATE POLICY call_signals_select ON call_signals
FOR SELECT USING (
  auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM anonymous_sessions s
    WHERE s.id = session_id AND (s.user1_id = app.current_user_id() OR s.user2_id = app.current_user_id())
  )
);

DROP POLICY IF EXISTS call_signals_insert ON call_signals;
CREATE POLICY call_signals_insert ON call_signals
FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM anonymous_sessions s
    WHERE s.id = session_id AND (s.user1_id = app.current_user_id() OR s.user2_id = app.current_user_id())
  )
);

DROP POLICY IF EXISTS call_signals_delete ON call_signals;
CREATE POLICY call_signals_delete ON call_signals
FOR DELETE USING (auth.role() = 'service_role');

-- Voice messages: session participants
DROP POLICY IF EXISTS voice_messages_select ON voice_messages;
CREATE POLICY voice_messages_select ON voice_messages
FOR SELECT USING (
  auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM anonymous_sessions s
    WHERE s.id = session_id AND (s.user1_id = app.current_user_id() OR s.user2_id = app.current_user_id())
  )
);

DROP POLICY IF EXISTS voice_messages_insert ON voice_messages;
CREATE POLICY voice_messages_insert ON voice_messages
FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM anonymous_sessions s
    WHERE s.id = session_id AND (s.user1_id = app.current_user_id() OR s.user2_id = app.current_user_id())
  )
);

DROP POLICY IF EXISTS voice_messages_delete ON voice_messages;
CREATE POLICY voice_messages_delete ON voice_messages
FOR DELETE USING (auth.role() = 'service_role');

-- Reports: reporter or service role
DROP POLICY IF EXISTS reports_select ON reports;
CREATE POLICY reports_select ON reports
FOR SELECT USING (auth.role() = 'service_role' OR reporter_user_id = app.current_user_id());

DROP POLICY IF EXISTS reports_insert ON reports;
CREATE POLICY reports_insert ON reports
FOR INSERT WITH CHECK (auth.role() = 'service_role' OR reporter_user_id = app.current_user_id());

-- Profiles: owner or service role
DROP POLICY IF EXISTS profiles_select ON profiles;
CREATE POLICY profiles_select ON profiles
FOR SELECT USING (auth.role() = 'service_role' OR user_id = app.current_user_id());

DROP POLICY IF EXISTS profiles_insert ON profiles;
CREATE POLICY profiles_insert ON profiles
FOR INSERT WITH CHECK (auth.role() = 'service_role' OR user_id = app.current_user_id());

DROP POLICY IF EXISTS profiles_update ON profiles;
CREATE POLICY profiles_update ON profiles
FOR UPDATE USING (auth.role() = 'service_role' OR user_id = app.current_user_id())
WITH CHECK (auth.role() = 'service_role' OR user_id = app.current_user_id());

-- User usage: owner or service role
DROP POLICY IF EXISTS user_usage_select ON user_usage;
CREATE POLICY user_usage_select ON user_usage
FOR SELECT USING (auth.role() = 'service_role' OR user_id = app.current_user_id());

DROP POLICY IF EXISTS user_usage_insert ON user_usage;
CREATE POLICY user_usage_insert ON user_usage
FOR INSERT WITH CHECK (auth.role() = 'service_role' OR user_id = app.current_user_id());

DROP POLICY IF EXISTS user_usage_update ON user_usage;
CREATE POLICY user_usage_update ON user_usage
FOR UPDATE USING (auth.role() = 'service_role' OR user_id = app.current_user_id())
WITH CHECK (auth.role() = 'service_role' OR user_id = app.current_user_id());

-- Karma log: owner or service role
DROP POLICY IF EXISTS karma_log_select ON karma_log;
CREATE POLICY karma_log_select ON karma_log
FOR SELECT USING (auth.role() = 'service_role' OR user_id = app.current_user_id());

DROP POLICY IF EXISTS karma_log_insert ON karma_log;
CREATE POLICY karma_log_insert ON karma_log
FOR INSERT WITH CHECK (auth.role() = 'service_role' OR user_id = app.current_user_id());

-- Bottle messages: owner can insert, service role can read/update for delivery
DROP POLICY IF EXISTS bottle_messages_select ON bottle_messages;
CREATE POLICY bottle_messages_select ON bottle_messages
FOR SELECT USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS bottle_messages_insert ON bottle_messages;
CREATE POLICY bottle_messages_insert ON bottle_messages
FOR INSERT WITH CHECK (auth.role() = 'service_role' OR user_id = app.current_user_id());

DROP POLICY IF EXISTS bottle_messages_update ON bottle_messages;
CREATE POLICY bottle_messages_update ON bottle_messages
FOR UPDATE USING (auth.role() = 'service_role');

-- Story sessions: participants can read/write
DROP POLICY IF EXISTS story_sessions_select ON story_sessions;
CREATE POLICY story_sessions_select ON story_sessions
FOR SELECT USING (auth.role() = 'service_role' OR user_id = ANY(participants));

DROP POLICY IF EXISTS story_sessions_insert ON story_sessions;
CREATE POLICY story_sessions_insert ON story_sessions
FOR INSERT WITH CHECK (auth.role() = 'service_role' OR user_id = ANY(participants));

DROP POLICY IF EXISTS story_sessions_update ON story_sessions;
CREATE POLICY story_sessions_update ON story_sessions
FOR UPDATE USING (auth.role() = 'service_role' OR user_id = ANY(participants));

-- Themed rooms: all can read, service role manages
DROP POLICY IF EXISTS themed_rooms_select ON themed_rooms;
CREATE POLICY themed_rooms_select ON themed_rooms
FOR SELECT USING (true);

DROP POLICY IF EXISTS themed_rooms_insert ON themed_rooms;
CREATE POLICY themed_rooms_insert ON themed_rooms
FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS themed_rooms_update ON themed_rooms;
CREATE POLICY themed_rooms_update ON themed_rooms
FOR UPDATE USING (auth.role() = 'service_role');

-- Canvas drawings: session participants can read/write
DROP POLICY IF EXISTS canvas_drawings_select ON canvas_drawings;
CREATE POLICY canvas_drawings_select ON canvas_drawings
FOR SELECT USING (
  auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM anonymous_sessions s
    WHERE s.id = canvas_id AND (s.user1_id = app.current_user_id() OR s.user2_id = app.current_user_id())
  )
);

DROP POLICY IF EXISTS canvas_drawings_insert ON canvas_drawings;
CREATE POLICY canvas_drawings_insert ON canvas_drawings
FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR (
    user_id = app.current_user_id() AND EXISTS (
      SELECT 1 FROM anonymous_sessions s
      WHERE s.id = canvas_id AND (s.user1_id = app.current_user_id() OR s.user2_id = app.current_user_id())
    )
  )
);

DROP POLICY IF EXISTS canvas_drawings_delete ON canvas_drawings;
CREATE POLICY canvas_drawings_delete ON canvas_drawings
FOR DELETE USING (
  auth.role() = 'service_role' OR user_id = app.current_user_id()
);

-- Music sessions: session participants can read/write
DROP POLICY IF EXISTS music_sessions_select ON music_sessions;
CREATE POLICY music_sessions_select ON music_sessions
FOR SELECT USING (
  auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM anonymous_sessions s
    WHERE s.id = session_id AND (s.user1_id = app.current_user_id() OR s.user2_id = app.current_user_id())
  )
);

DROP POLICY IF EXISTS music_sessions_insert ON music_sessions;
CREATE POLICY music_sessions_insert ON music_sessions
FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR session_id IN (
    SELECT id FROM anonymous_sessions
    WHERE user1_id = app.current_user_id() OR user2_id = app.current_user_id()
  )
);

DROP POLICY IF EXISTS music_sessions_update ON music_sessions;
CREATE POLICY music_sessions_update ON music_sessions
FOR UPDATE USING (
  auth.role() = 'service_role' OR session_id IN (
    SELECT id FROM anonymous_sessions
    WHERE user1_id = app.current_user_id() OR user2_id = app.current_user_id()
  )
);

-- Time capsules: sender can read, recipient gets delivered messages
DROP POLICY IF EXISTS time_capsules_select ON time_capsules;
CREATE POLICY time_capsules_select ON time_capsules
FOR SELECT USING (
  auth.role() = 'service_role' OR
  sender_id = app.current_user_id() OR
  (recipient_id = app.current_user_id() AND is_delivered = true)
);

DROP POLICY IF EXISTS time_capsules_insert ON time_capsules;
CREATE POLICY time_capsules_insert ON time_capsules
FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR sender_id = app.current_user_id()
);

DROP POLICY IF EXISTS time_capsules_update ON time_capsules;
CREATE POLICY time_capsules_update ON time_capsules
FOR UPDATE USING (auth.role() = 'service_role');

-- Attachments: session participants
DROP POLICY IF EXISTS attachments_select ON attachments;
CREATE POLICY attachments_select ON attachments
FOR SELECT USING (
  auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM anonymous_sessions s
    WHERE s.id = session_id AND (s.user1_id = app.current_user_id() OR s.user2_id = app.current_user_id())
  )
);

DROP POLICY IF EXISTS attachments_insert ON attachments;
CREATE POLICY attachments_insert ON attachments
FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM anonymous_sessions s
    WHERE s.id = session_id AND (s.user1_id = app.current_user_id() OR s.user2_id = app.current_user_id())
  )
);

DROP POLICY IF EXISTS attachments_delete ON attachments;
CREATE POLICY attachments_delete ON attachments
FOR DELETE USING (auth.role() = 'service_role');

-- Retention helpers: consider jobs to purge expired rows
-- DELETE FROM call_signals WHERE expires_at < now();
-- DELETE FROM voice_messages WHERE expires_at < now();
-- DELETE FROM attachments WHERE expires_at < now();

-- =============================================================================
-- SUPABASE REALTIME
-- The frontend uses `postgres_changes` subscriptions for:
--   - messages
--   - voice_messages
--   - call_signals
-- Ensure the tables are configured for logical replication.
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER TABLE public.messages REPLICA IDENTITY FULL;
    ALTER TABLE public.voice_messages REPLICA IDENTITY FULL;
    ALTER TABLE public.call_signals REPLICA IDENTITY FULL;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN duplicate_object THEN
      -- already added
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_messages;
    EXCEPTION WHEN duplicate_object THEN
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;
    EXCEPTION WHEN duplicate_object THEN
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.canvas_drawings;
    EXCEPTION WHEN duplicate_object THEN
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.music_sessions;
    EXCEPTION WHEN duplicate_object THEN
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.time_capsules;
    EXCEPTION WHEN duplicate_object THEN
    END;
  END IF;
END $$;
