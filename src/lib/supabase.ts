import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  skill_coins: number;
  total_swaps_completed: number;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  description: string;
  created_at: string;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_id: string;
  type: 'offered' | 'needed';
  proficiency_level: 'beginner' | 'intermediate' | 'advanced';
  created_at: string;
  skills: Skill;
}

export interface Swap {
  id: string;
  requester_id: string;
  provider_id: string;
  skill_id: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  message: string;
  scheduled_at?: string;
  completed_at?: string;
  rating?: number;
  created_at: string;
  updated_at: string;
  requester: Profile;
  provider: Profile;
  skills: Skill;
}

export interface Reward {
  id: string;
  user_id: string;
  type: 'skill_coins' | 'badge';
  amount: number;
  badge_name: string;
  badge_description: string;
  earned_for: string;
  swap_id?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  swap_id: string;
  participant_1: string;
  participant_2: string;
  last_message: string;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender: Profile;
}