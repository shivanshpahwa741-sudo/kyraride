-- Create bookings table to store ride history
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_phone TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  drop_address TEXT NOT NULL,
  distance_km NUMERIC(6,2) NOT NULL,
  selected_days TEXT[] NOT NULL,
  pickup_time TEXT NOT NULL,
  start_date TEXT NOT NULL,
  per_ride_fare INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  payment_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sessions table for persistent login
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phone TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Bookings policies (users can view their own bookings, insert via edge function)
CREATE POLICY "Users can view their own bookings"
ON public.bookings FOR SELECT
USING (user_phone = current_setting('app.current_user_phone', true));

CREATE POLICY "Bookings can be inserted via edge function"
ON public.bookings FOR INSERT
WITH CHECK (true);

-- Sessions policies (no direct client access - managed via edge functions)
CREATE POLICY "No direct client access to sessions"
ON public.user_sessions FOR ALL
USING (false)
WITH CHECK (false);

-- Trigger for updated_at on bookings
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_bookings_user_phone ON public.bookings(user_phone);
CREATE INDEX idx_bookings_payment_id ON public.bookings(payment_id);
CREATE INDEX idx_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON public.user_sessions(expires_at);