-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_entertainment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paypal_webhooks ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Users can view and update their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Usage tracking
CREATE POLICY "Users can view own usage" ON public.user_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Entertainment (premium only)
CREATE POLICY "Premium users can view own entertainment" ON public.user_entertainment
  FOR SELECT USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND user_tier = 'premium'
    )
  );

-- Anonymous sessions (public)
CREATE POLICY "Anonymous sessions are publicly readable" ON public.anonymous_sessions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create anonymous sessions" ON public.anonymous_sessions
  FOR INSERT WITH CHECK (true);

-- Messages (session/room participants only)
CREATE POLICY "Messages readable by session/room participants" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.anonymous_sessions
      WHERE id = messages.session_id
      AND array[auth.jwt() ->> 'sub'] <@ users
    ) OR
    EXISTS (
      SELECT 1 FROM public.room_participants
      WHERE room_id = messages.room_id
      AND user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Messages insertable by session/room participants" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.anonymous_sessions
      WHERE id = messages.session_id
      AND array[auth.jwt() ->> 'sub'] <@ users
    ) OR
    EXISTS (
      SELECT 1 FROM public.room_participants
      WHERE room_id = messages.room_id
      AND user_id = auth.jwt() ->> 'sub'
    )
  );

-- Chat rooms (premium rooms require premium access)
CREATE POLICY "Chat rooms are publicly readable" ON public.chat_rooms
  FOR SELECT USING (
    not is_premium_only OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND user_tier = 'premium'
    )
  );

CREATE POLICY "Authenticated users can create rooms" ON public.chat_rooms
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Room participants (public)
CREATE POLICY "Room participants publicly readable" ON public.room_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join rooms" ON public.room_participants
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- Interests (public)
CREATE POLICY "Interests are publicly readable" ON public.interests
  FOR SELECT USING (true);

-- PayPal webhooks (service role only)
CREATE POLICY "Service role can manage webhooks" ON public.paypal_webhooks
  FOR ALL USING (auth.role() = 'service_role');
