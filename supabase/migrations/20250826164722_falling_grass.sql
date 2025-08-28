/*
  # LearnLoop Database Schema

  1. New Tables
    - `profiles` - User profiles with bio and preferences
    - `skills` - Available skills in the platform
    - `user_skills` - Junction table for users' offered and needed skills
    - `swaps` - Skill swap requests and matches
    - `rewards` - SkillCoins and badges earned by users
    - `conversations` - Chat conversations between matched users
    - `messages` - Individual chat messages

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Public read access for skills and leaderboards
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  skill_coins integer DEFAULT 0,
  total_swaps_completed integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create user_skills table
CREATE TABLE IF NOT EXISTS user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  skill_id uuid REFERENCES skills(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('offered', 'needed')),
  proficiency_level text DEFAULT 'beginner' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, skill_id, type)
);

-- Create swaps table
CREATE TABLE IF NOT EXISTS swaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  provider_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  skill_id uuid REFERENCES skills(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  message text DEFAULT '',
  scheduled_at timestamptz,
  completed_at timestamptz,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('skill_coins', 'badge')),
  amount integer DEFAULT 0,
  badge_name text DEFAULT '',
  badge_description text DEFAULT '',
  earned_for text NOT NULL,
  swap_id uuid REFERENCES swaps(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_id uuid REFERENCES swaps(id) ON DELETE CASCADE NOT NULL,
  participant_1 uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  participant_2 uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_message text DEFAULT '',
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert sample skills
INSERT INTO skills (name, category, description) VALUES
  ('JavaScript', 'Programming', 'Web development programming language'),
  ('Python', 'Programming', 'Versatile programming language'),
  ('React', 'Web Development', 'JavaScript library for building user interfaces'),
  ('Spanish', 'Languages', 'Spanish language conversation and grammar'),
  ('French', 'Languages', 'French language conversation and grammar'),
  ('Guitar', 'Music', 'Acoustic and electric guitar playing'),
  ('Piano', 'Music', 'Piano playing and music theory'),
  ('Calculus', 'Mathematics', 'Advanced mathematics and calculus concepts'),
  ('Statistics', 'Mathematics', 'Statistical analysis and probability'),
  ('Photography', 'Arts', 'Digital photography and photo editing'),
  ('Design', 'Arts', 'Graphic design and visual arts'),
  ('Cooking', 'Life Skills', 'Cooking techniques and recipes'),
  ('Writing', 'Academic', 'Creative and academic writing skills'),
  ('Public Speaking', 'Communication', 'Presentation and public speaking skills'),
  ('Marketing', 'Business', 'Digital marketing and strategy');

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Skills policies (public read)
CREATE POLICY "Anyone can view skills" ON skills FOR SELECT TO authenticated USING (true);

-- User skills policies
CREATE POLICY "Users can view all user skills" ON user_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own skills" ON user_skills FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Swaps policies
CREATE POLICY "Users can view swaps they're involved in" ON swaps FOR SELECT TO authenticated 
  USING (auth.uid() = requester_id OR auth.uid() = provider_id);
CREATE POLICY "Users can create swap requests" ON swaps FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update swaps they're involved in" ON swaps FOR UPDATE TO authenticated 
  USING (auth.uid() = requester_id OR auth.uid() = provider_id);

-- Rewards policies
CREATE POLICY "Users can view all rewards for leaderboard" ON rewards FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert rewards" ON rewards FOR INSERT TO authenticated WITH CHECK (true);

-- Conversations policies
CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT TO authenticated 
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "System can create conversations" ON conversations FOR INSERT TO authenticated WITH CHECK (true);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
  ));
CREATE POLICY "Users can send messages to their conversations" ON messages FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
  ) AND auth.uid() = sender_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id ON user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_swaps_requester_id ON swaps(requester_id);
CREATE INDEX IF NOT EXISTS idx_swaps_provider_id ON swaps(provider_id);
CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);