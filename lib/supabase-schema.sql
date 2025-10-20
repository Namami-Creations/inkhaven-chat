-- Supabase Database Schema for Ultimate Anonymous Chat Platform
-- Clean, consolidated version without duplicates

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- User tiers enum
create type user_tier as enum ('anonymous', 'registered_free', 'premium');

-- Subscription status enum
create type subscription_status as enum ('active', 'inactive', 'cancelled', 'past_due', 'trialing');

-- Users table (enhanced with freemium features)
create table public.users (
  id uuid default uuid_generate_v4() primary key,
  anonymous_id text unique,
  email text unique,
  display_name text,
  avatar_data jsonb default '{}'::jsonb, -- AI-generated avatar configuration
  bio text,
  interests text[] default '{}',
  personality_traits jsonb default '{}'::jsonb, -- AI personality analysis
  preferences jsonb default '{}'::jsonb,
  user_tier user_tier default 'anonymous',
  is_registered boolean default false,
  is_verified boolean default false,
  join_date date default current_date,
  total_messages_sent integer default 0,
  total_time_online interval default '0 hours',
  reputation_score integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User subscriptions table
create table public.user_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  paypal_subscription_id text unique,
  status subscription_status default 'trialing',
  tier text not null, -- 'premium', 'pro', etc.
  amount decimal(10,2) not null,
  currency text default 'USD',
  interval text default 'month', -- 'month', 'year'
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  trial_end timestamp with time zone,
  cancel_at_period_end boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User achievements/badges
create table public.user_achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  achievement_type text not null, -- 'time_based', 'activity_based', 'special'
  achievement_key text not null, -- 'newbie', 'veteran', 'social_butterfly', etc.
  title text not null,
  description text,
  icon_url text,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  progress integer default 100, -- percentage or count
  unique(user_id, achievement_key)
);

-- User usage tracking for limits
create table public.user_usage (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  feature_type text not null, -- 'giphy', 'ai_features', 'group_creation', etc.
  usage_count integer default 0,
  limit_count integer not null,
  reset_date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, feature_type, reset_date)
);

-- Premium entertainment results
create table public.user_entertainment (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  entertainment_type text not null, -- 'horoscope', 'animal_identity', 'iq_test', etc.
  result_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default timezone('utc'::text, now()) + interval '30 days'
);

-- Interests table for AI matching
create table public.interests (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text not null,
  popularity_score integer default 0,
  emoji text,
  color text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(name, category)
);

-- Anonymous chat sessions
create table public.anonymous_sessions (
  id uuid default uuid_generate_v4() primary key,
  users text[] not null, -- array of anonymous user IDs
  interests text[] default '{}', -- AI-detected interests
  quality_score decimal(3,2) default 0.0,
  ai_generated_name text, -- AI-generated session name
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages table (enhanced with premium features)
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.anonymous_sessions(id) on delete cascade,
  room_id uuid references public.chat_rooms(id) on delete cascade,
  user_id text not null, -- anonymous user ID
  content text not null,
  message_type text default 'text' check (message_type in ('text', 'image', 'file', 'voice', 'giphy')),
  file_url text,
  giphy_data jsonb, -- GIPHY sticker/gif data
  reactions jsonb default '{}'::jsonb, -- emoji reactions
  is_moderated boolean default false,
  moderation_reason text,
  ai_enhanced boolean default false, -- AI-enhanced message
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Ensure message belongs to either session or room, not both
  check (
    (session_id is not null and room_id is null) or
    (session_id is null and room_id is not null)
  )
);

-- Chat rooms (enhanced with freemium limits)
create table public.chat_rooms (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text not null,
  category text not null,
  is_ai_generated boolean default true,
  is_premium_only boolean default false,
  participant_count integer default 0,
  max_participants integer default 100, -- Free tier limit
  current_participants integer default 0,
  interests text[] default '{}',
  moderation_rules jsonb default '{}'::jsonb,
  room_avatar_data jsonb default '{}'::jsonb,
  created_by uuid references public.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Room participants (enhanced)
create table public.room_participants (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.chat_rooms(id) on delete cascade not null,
  user_id text not null, -- anonymous user ID
  user_tier user_tier default 'anonymous',
  role text default 'member' check (role in ('member', 'moderator', 'admin')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  left_at timestamp with time zone,
  last_activity timestamp with time zone default timezone('utc'::text, now()),
  unique(room_id, user_id)
);

-- PayPal webhook logs
create table public.paypal_webhooks (
  id uuid default uuid_generate_v4() primary key,
  webhook_id text unique not null,
  event_type text not null,
  resource_type text not null,
  resource_id text not null,
  resource_data jsonb not null,
  processed boolean default false,
  processed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index idx_messages_session_id on public.messages(session_id);
create index idx_messages_room_id on public.messages(room_id);
create index idx_messages_created_at on public.messages(created_at);
create index idx_anonymous_sessions_started_at on public.anonymous_sessions(started_at);
create index idx_chat_rooms_category on public.chat_rooms(category);
create index idx_room_participants_room_id on public.room_participants(room_id);
create index idx_user_subscriptions_user_id on public.user_subscriptions(user_id);
create index idx_user_subscriptions_status on public.user_subscriptions(status);
create index idx_user_achievements_user_id on public.user_achievements(user_id);
create index idx_user_usage_user_id on public.user_usage(user_id);
create index idx_user_entertainment_user_id on public.user_entertainment(user_id);

-- Row Level Security (RLS) policies
alter table public.users enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.user_achievements enable row level security;
alter table public.user_usage enable row level security;
alter table public.user_entertainment enable row level security;
alter table public.anonymous_sessions enable row level security;
alter table public.messages enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.room_participants enable row level security;
alter table public.interests enable row level security;
alter table public.paypal_webhooks enable row level security;

-- Users policies
create policy "Users can view own data" on public.users
  for select using (auth.uid() = id or user_tier = 'anonymous');

create policy "Users can update own data" on public.users
  for update using (auth.uid() = id or user_tier = 'anonymous');

create policy "Users can insert own data" on public.users
  for insert with check (true);

-- User subscriptions policies
create policy "Users can view own subscriptions" on public.user_subscriptions
  for select using (auth.uid() = user_id);

create policy "Users can update own subscriptions" on public.user_subscriptions
  for update using (auth.uid() = user_id);

-- User achievements policies
create policy "Users can view own achievements" on public.user_achievements
  for select using (auth.uid() = user_id);

-- User usage policies
create policy "Users can view own usage" on public.user_usage
  for select using (auth.uid() = user_id);

-- User entertainment policies (premium only)
create policy "Premium users can view own entertainment" on public.user_entertainment
  for select using (
    auth.uid() = user_id and
    exists (
      select 1 from public.users
      where id = auth.uid() and user_tier = 'premium'
    )
  );

-- Anonymous sessions: No restrictions for anonymous access
create policy "Anonymous sessions are publicly readable" on public.anonymous_sessions
  for select using (true);

create policy "Anyone can create anonymous sessions" on public.anonymous_sessions
  for insert with check (true);

create policy "Anyone can update anonymous sessions" on public.anonymous_sessions
  for update using (true);

-- Messages: Part of session can be read by session participants
create policy "Messages readable by session/room participants" on public.messages
  for select using (
    exists (
      select 1 from public.anonymous_sessions
      where id = messages.session_id
      and (array[auth.uid()::text] <@ users or array['anonymous'] <@ users)
    ) or
    exists (
      select 1 from public.room_participants
      where room_id = messages.room_id
      and (user_id = auth.uid()::text or user_id = 'anonymous')
    ) or
    user_id = 'anonymous'
  );

create policy "Messages insertable by session/room participants" on public.messages
  for insert with check (true);

-- Chat rooms: Publicly readable with freemium restrictions
create policy "Chat rooms are publicly readable" on public.chat_rooms
  for select using (
    not is_premium_only or
    exists (
      select 1 from public.users
      where id = auth.uid() and user_tier = 'premium'
    ) or
    is_premium_only = false
  );

create policy "Authenticated users can create rooms" on public.chat_rooms
  for insert with check (true);

-- Room participants: Publicly readable for room discovery
create policy "Room participants publicly readable" on public.room_participants
  for select using (true);

create policy "Users can join rooms" on public.room_participants
  for insert with check (true);

-- Interests: Publicly readable
create policy "Interests are publicly readable" on public.interests
  for select using (true);

create policy "Anyone can insert interests" on public.interests
  for insert with check (true);

-- PayPal webhooks: Service role only
create policy "Service role can manage webhooks" on public.paypal_webhooks
  for all using (auth.role() = 'service_role');

-- Functions for usage limits and achievements
create or replace function check_feature_limit(
  p_user_id uuid,
  p_feature_type text,
  p_limit integer default null
) returns boolean as $$
declare
  v_usage_count integer;
  v_limit_count integer;
begin
  -- Get current usage for today
  select usage_count, limit_count into v_usage_count, v_limit_count
  from public.user_usage
  where user_id = p_user_id
    and feature_type = p_feature_type
    and reset_date = current_date;

  -- If no record exists, create one
  if v_usage_count is null then
    insert into public.user_usage (user_id, feature_type, limit_count)
    values (p_user_id, p_feature_type, coalesce(p_limit, 10));
    return true;
  end if;

  -- Check if under limit
  return v_usage_count < v_limit_count;
end;
$$ language plpgsql security definer;

create or replace function increment_usage(p_user_id uuid, p_feature_type text) returns void as $$
begin
  insert into public.user_usage (user_id, feature_type, usage_count, limit_count)
  values (p_user_id, p_feature_type, 1, 10)
  on conflict (user_id, feature_type, reset_date)
  do update set usage_count = user_usage.usage_count + 1;
end;
$$ language plpgsql security definer;

-- Function to award achievements
create or replace function award_achievement(
  p_user_id uuid,
  p_achievement_key text,
  p_title text,
  p_description text default null,
  p_icon_url text default null
) returns void as $$
begin
  insert into public.user_achievements (
    user_id, achievement_type, achievement_key, title, description, icon_url
  ) values (
    p_user_id, 'activity_based', p_achievement_key, p_title, p_description, p_icon_url
  ) on conflict (user_id, achievement_key) do nothing;
end;
$$ language plpgsql security definer;

-- Storage bucket for files (enhanced)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-files',
  'chat-files',
  false,
  104857600, -- 100MB for premium
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/*', 'video/*', 'application/pdf']
);

-- Storage policies (enhanced)
create policy "Users can upload files based on tier" on storage.objects
  for insert with check (
    bucket_id = 'chat-files' and
    auth.role() = 'authenticated' and
    (
      -- Free tier: 10MB limit
      (select user_tier from public.users where id = auth.uid()) = 'anonymous' and
      (storage.foldername(name))[2]::bigint <= 10485760
    ) or
    (
      -- Premium: 100MB limit
      (select user_tier from public.users where id = auth.uid()) = 'premium' and
      (storage.foldername(name))[2]::bigint <= 104857600
    )
  );

create policy "Users can view their own files" on storage.objects
  for select using (bucket_id = 'chat-files' and auth.uid()::text = (storage.foldername(name))[1]);

-- Realtime subscriptions
-- These will be configured in the application code
