-- Add transfer_date column to transfers table
ALTER TABLE public.transfers 
ADD COLUMN IF NOT EXISTS transfer_date DATE DEFAULT CURRENT_DATE;

-- Add new roles to the enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'kapitan';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'trener';

-- Create role_permissions table for managing what each role can do
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role public.app_role NOT NULL,
  permission TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, permission)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage permissions
CREATE POLICY "Only admins can manage role permissions"
ON public.role_permissions
FOR ALL
USING (is_admin(auth.uid()));

-- Everyone can view permissions
CREATE POLICY "Permissions viewable by everyone"
ON public.role_permissions
FOR SELECT
USING (true);

-- Insert default permissions for admin role
INSERT INTO public.role_permissions (role, permission) VALUES
  ('admin', 'edit_any_profile'),
  ('admin', 'delete_threads'),
  ('admin', 'manage_transfers'),
  ('admin', 'manage_categories'),
  ('admin', 'ban_users'),
  ('admin', 'manage_roles')
ON CONFLICT (role, permission) DO NOTHING;

-- Create function to check if user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id
      AND rp.permission = _permission
  )
$$;