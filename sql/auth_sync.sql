
-- 1. IDENTIFY DISCREPANCIES
-- Find users who exist in Auth but are missing from the Profiles management table
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 2. ONE-TIME BACKFILL
-- Insert missing profile rows for existing auth users
INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)) as full_name,
    'user' as role,
    'https://ui-avatars.com/api/?name=' || COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)) || '&background=random&color=fff' as avatar_url
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 3. PERMANENT AUTOMATION (Trigger + Function)
-- This ensures any future user sign-up automatically creates a profile entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'user',
    'https://ui-avatars.com/api/?name=' || urlencode(COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))) || '&background=random&color=fff'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution after auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. RLS POLICY FOR ADMINS
-- Ensure admins can see all profiles while standard users only see their own
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  OR
  id = auth.uid()
);
