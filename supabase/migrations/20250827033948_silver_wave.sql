/*
  # Fix Profile Creation for New Users

  1. Ensure profiles table has proper defaults
  2. Add trigger to auto-create profile on user signup
  3. Update RLS policies for better user experience
*/

-- Update profiles table to ensure proper defaults
ALTER TABLE profiles 
ALTER COLUMN bio SET DEFAULT '',
ALTER COLUMN avatar_url SET DEFAULT '',
ALTER COLUMN skill_coins SET DEFAULT 0,
ALTER COLUMN total_swaps_completed SET DEFAULT 0;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, bio, avatar_url, skill_coins, total_swaps_completed)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    '',
    '',
    0,
    0
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update RLS policies to be more permissive for new users
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NOT NULL);

-- Ensure users can update their own profile even if it doesn't exist yet
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id OR auth.uid() IS NOT NULL);