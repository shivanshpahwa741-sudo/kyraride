-- Add pin column to profiles table for 4-digit PIN authentication
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pin_hash text;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.pin_hash IS 'Hashed 4-digit PIN for quick login';