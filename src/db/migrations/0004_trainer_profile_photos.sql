ALTER TABLE public.trainer_applications
  ADD COLUMN IF NOT EXISTS profile_photo text;

ALTER TABLE public.trainer_profiles
  ADD COLUMN IF NOT EXISTS profile_photo text;
