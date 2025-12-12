-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a view for public profile data (without sensitive info)
CREATE OR REPLACE VIEW public.public_profiles AS
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

-- Create new restrictive policy - users can only see their own email
-- Everyone can see basic profile data through the view
CREATE POLICY "Users can view own full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Allow public/anon to see profiles but we'll use the view for public access
CREATE POLICY "Public can view profiles without sensitive data"
ON public.profiles
FOR SELECT
TO anon
USING (false);  -- Anon users should use the public_profiles view instead