CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id text PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('client', 'trainer')),
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
