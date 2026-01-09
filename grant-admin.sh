#!/bin/bash

# This script grants admin access to the first user in your database
# Make sure you have your Supabase credentials set up

# You need to have the Supabase CLI installed and configured
# Run: supabase db push

# Or manually run this SQL in your Supabase SQL Editor:
# INSERT INTO public.user_roles (user_id, role)
# SELECT id, 'admin'::app_role FROM public.users
# LIMIT 1
# ON CONFLICT (user_id, role) DO NOTHING;

echo "To grant admin access, please:"
echo "1. Go to https://app.supabase.com"
echo "2. Open your project"
echo "3. Go to SQL Editor"
echo "4. Create a new query and paste this:"
echo ""
echo "INSERT INTO public.user_roles (user_id, role)"
echo "SELECT id, 'admin'::app_role FROM public.users"
echo "LIMIT 1"
echo "ON CONFLICT (user_id, role) DO NOTHING;"
echo ""
echo "5. Click Run"
echo "6. Then refresh your browser at http://localhost:8081/admin"
