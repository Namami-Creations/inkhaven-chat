-- Migration: Add type column to messages table
-- Date: 2026-01-04

-- Add type column to messages table with default 'text'
ALTER TABLE messages ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'voice'));

-- Update existing rows to have type 'text' (though they should already have default)
UPDATE messages SET type = 'text' WHERE type IS NULL;

-- Add comment
COMMENT ON COLUMN messages.type IS 'Message type: text or voice';