-- Remove the foreign key constraint that links profiles.user_id to auth.users
-- This is needed because the app uses custom OTP authentication, not Supabase Auth
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;