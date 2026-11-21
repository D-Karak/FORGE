ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.trainer_applications (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  name text NOT NULL,
  city text NOT NULL,
  specialty text NOT NULL,
  languages text NOT NULL,
  approach text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.trainer_profiles (
  id text PRIMARY KEY,
  user_id text,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  title text NOT NULL,
  city text NOT NULL,
  specialty text NOT NULL,
  bio text NOT NULL,
  languages text[] NOT NULL DEFAULT '{}',
  session_price integer NOT NULL CHECK (session_price > 0),
  approved boolean NOT NULL DEFAULT false,
  suspended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.availability_slots (
  id text PRIMARY KEY,
  trainer_id text NOT NULL REFERENCES public.trainer_profiles(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 50 CHECK (duration_minutes > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trainer_id, starts_at)
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id text PRIMARY KEY,
  slot_id text NOT NULL REFERENCES public.availability_slots(id) ON DELETE RESTRICT,
  trainer_id text NOT NULL REFERENCES public.trainer_profiles(id) ON DELETE RESTRICT,
  client_id text NOT NULL,
  starts_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('pending_payment', 'confirmed', 'cancelled', 'completed')),
  cancellation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trainer_programs (
  id text PRIMARY KEY,
  trainer_id text NOT NULL REFERENCES public.trainer_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  weeks integer NOT NULL CHECK (weeks > 0),
  lessons integer NOT NULL CHECK (lessons >= 0),
  price integer NOT NULL CHECK (price >= 0),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_purchases (
  id text PRIMARY KEY,
  program_id text NOT NULL REFERENCES public.trainer_programs(id) ON DELETE RESTRICT,
  client_id text NOT NULL,
  status text NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('pending_payment', 'confirmed', 'refunded')),
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, client_id)
);

CREATE TABLE IF NOT EXISTS public.in_app_notices (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trainer_applications_status_idx
  ON public.trainer_applications(status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS availability_slots_trainer_starts_idx
  ON public.availability_slots(trainer_id, starts_at)
  WHERE is_active;
CREATE INDEX IF NOT EXISTS bookings_client_created_idx
  ON public.bookings(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_trainer_created_idx
  ON public.bookings(trainer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS in_app_notices_user_created_idx
  ON public.in_app_notices(user_id, created_at DESC);

INSERT INTO public.trainer_profiles
  (id, slug, name, title, city, specialty, bio, languages, session_price, approved)
VALUES
  ('arjun-mehta', 'arjun-mehta', 'Arjun Mehta', 'Strength & conditioning coach', 'Mumbai, Maharashtra', 'Strength',
   'I help busy people build strength that carries into everyday life.', ARRAY['English','Hindi','Marathi'], 1800, true),
  ('sana-kapoor', 'sana-kapoor', 'Sana Kapoor', 'Mobility & movement coach', 'Bengaluru, Karnataka', 'Mobility',
   'Thoughtful strength and mobility for a body that feels as good as it performs.', ARRAY['English','Hindi','Kannada'], 1500, true),
  ('kabir-rao', 'kabir-rao', 'Kabir Rao', 'Running & endurance coach', 'Pune, Maharashtra', 'Endurance',
   'Steady, coach-built running progress from your first 5K onward.', ARRAY['English','Hindi'], 1200, true),
  ('maya-iyer', 'maya-iyer', 'Maya Iyer', 'Nutrition & habit coach', 'Chennai, Tamil Nadu', 'Nutrition',
   'Sustainable food habits for more energy and a calmer relationship with nutrition.', ARRAY['English','Tamil','Hindi'], 1600, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  city = EXCLUDED.city,
  specialty = EXCLUDED.specialty,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  session_price = EXCLUDED.session_price,
  approved = EXCLUDED.approved;
