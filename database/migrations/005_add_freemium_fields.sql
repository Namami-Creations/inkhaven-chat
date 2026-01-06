-- Migration: Add freemium fields to profiles table
-- Date: 2026-01-04

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS karma INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS achievements TEXT[] DEFAULT '{}';

-- Update existing rows
UPDATE profiles SET karma = reputation WHERE karma = 0;
UPDATE profiles SET is_premium = (plan = 'premium');

-- Create user_usage table for tracking limits
CREATE TABLE IF NOT EXISTS user_usage (
  user_id TEXT PRIMARY KEY,
  video_minutes_used INTEGER DEFAULT 0,
  bottle_messages_used INTEGER DEFAULT 0,
  story_mode_used INTEGER DEFAULT 0,
  last_reset DATE DEFAULT CURRENT_DATE
);

-- Create karma_log table
CREATE TABLE IF NOT EXISTS karma_log (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  action TEXT,
  points INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_usage_reset ON user_usage(last_reset);
CREATE INDEX IF NOT EXISTS idx_karma_log_user ON karma_log(user_id, created_at DESC);

-- RLS
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE karma_log ENABLE ROW LEVEL SECURITY;

-- Policies for user_usage
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

-- Policies for karma_log
DROP POLICY IF EXISTS karma_log_select ON karma_log;
CREATE POLICY karma_log_select ON karma_log
FOR SELECT USING (auth.role() = 'service_role' OR user_id = app.current_user_id());

DROP POLICY IF EXISTS karma_log_insert ON karma_log;
CREATE POLICY karma_log_insert ON karma_log
FOR INSERT WITH CHECK (auth.role() = 'service_role' OR user_id = app.current_user_id());