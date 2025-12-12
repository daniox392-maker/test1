-- Drop the security definer view and recreate with proper security
DROP VIEW IF EXISTS public.public_profiles;

-- Create view with security_invoker = true (default in newer postgres, but let's be explicit)
CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  username,
  description,
  avatar_url,
  created_at,
  is_banned
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;