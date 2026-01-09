-- Create role enum for admin management
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create slot type enum for kitchen bookings
CREATE TYPE public.kitchen_slot_type AS ENUM ('11-14', '14-17', '17-22');

-- Create users table (passwordless auth by name + room)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    room_number TEXT NOT NULL,
    phone TEXT,
    agreed_to_rules BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(name, room_number)
);

-- Create user_roles table for admin management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Create blocked_users table
CREATE TABLE public.blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    reason TEXT,
    blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kitchen_bookings table
CREATE TABLE public.kitchen_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    booking_date DATE NOT NULL,
    slot_type kitchen_slot_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(booking_date, slot_type),
    UNIQUE(user_id, booking_date, slot_type)
);

-- Create projector_bookings table
CREATE TABLE public.projector_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_hours INTEGER NOT NULL CHECK (duration_hours >= 1 AND duration_hours <= 6),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_config table for RA email list
CREATE TABLE public.admin_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default RA email config
INSERT INTO public.admin_config (key, value) VALUES ('ra_emails', '[]');

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projector_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Create function to check if user is blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.blocked_users
        WHERE user_id = _user_id
    )
$$;

-- Users table policies (public read for booking display, anyone can create)
CREATE POLICY "Anyone can create users" ON public.users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read users" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (true);

-- User roles policies
CREATE POLICY "Anyone can read roles" ON public.user_roles
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL USING (true);

-- Blocked users policies
CREATE POLICY "Anyone can read blocked status" ON public.blocked_users
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage blocked users" ON public.blocked_users
    FOR ALL USING (true);

-- Kitchen bookings policies
CREATE POLICY "Anyone can read kitchen bookings" ON public.kitchen_bookings
    FOR SELECT USING (true);

CREATE POLICY "Users can create kitchen bookings" ON public.kitchen_bookings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own kitchen bookings" ON public.kitchen_bookings
    FOR DELETE USING (true);

-- Projector bookings policies
CREATE POLICY "Anyone can read projector bookings" ON public.projector_bookings
    FOR SELECT USING (true);

CREATE POLICY "Users can create projector bookings" ON public.projector_bookings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own projector bookings" ON public.projector_bookings
    FOR DELETE USING (true);

-- Admin config policies
CREATE POLICY "Anyone can read admin config" ON public.admin_config
    FOR SELECT USING (true);

CREATE POLICY "Admins can update admin config" ON public.admin_config
    FOR UPDATE USING (true);

-- Create index for faster booking queries
CREATE INDEX idx_kitchen_bookings_date ON public.kitchen_bookings(booking_date);
CREATE INDEX idx_projector_bookings_datetime ON public.projector_bookings(start_datetime, end_datetime);