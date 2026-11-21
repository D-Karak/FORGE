ALTER TABLE public.trainer_applications
  ADD COLUMN IF NOT EXISTS badges text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS session_price integer NOT NULL DEFAULT 1500
    CHECK (session_price > 0);

ALTER TABLE public.trainer_profiles
  ADD COLUMN IF NOT EXISTS badges text[] NOT NULL DEFAULT '{}';
