-- Grant admin access to the first user (for testing)
-- This will grant admin role to any existing user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM public.users
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;
