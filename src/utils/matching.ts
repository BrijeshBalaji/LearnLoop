import { supabase } from '../lib/supabase';

export interface MatchResult {
  userId: string;
  skillId: string;
  skillName: string;
  matchType: 'offered' | 'needed';
}

export const findMatches = async (userId: string): Promise<MatchResult[]> => {
  // Get user's skills
  const { data: userSkills } = await supabase
    .from('user_skills')
    .select(`
      *,
      skills (*)
    `)
    .eq('user_id', userId);

  if (!userSkills) {
    return [];
  }

  const myOffered = userSkills.filter(s => s.type === 'offered');
  const myNeeded = userSkills.filter(s => s.type === 'needed');

  if (myOffered.length === 0 || myNeeded.length === 0) {
    return [];
  }

  // Find mutual matches - users who need what I offer AND offer what I need
  const mutualMatches: MatchResult[] = [];

  for (const offeredSkill of myOffered) {
    for (const neededSkill of myNeeded) {
      // Find users who need what I offer
      const { data: needers } = await supabase
        .from('user_skills')
        .select(`
          user_id,
          skill_id,
          skills (*)
        `)
        .eq('skill_id', offeredSkill.skill_id)
        .eq('type', 'needed')
        .neq('user_id', userId);

      if (needers) {
        for (const needer of needers) {
          // Check if this user also offers what I need
          const { data: providers } = await supabase
            .from('user_skills')
            .select('*')
            .eq('user_id', needer.user_id)
            .eq('skill_id', neededSkill.skill_id)
            .eq('type', 'offered');

          if (providers && providers.length > 0) {
            // This is a mutual match!
            mutualMatches.push({
              userId: needer.user_id,
              skillId: offeredSkill.skill_id,
              skillName: offeredSkill.skills.name,
              matchType: 'offered',
            });
          }
        }
      }
    }
  }

  return mutualMatches;
};

export const awardSkillCoins = async (
  userId: string,
  amount: number,
  reason: string
): Promise<boolean> => {
  const { error } = await supabase.rpc('award_skill_coins', {
    user_id: userId,
    amount,
    reason,
  });

  if (error) {
    console.error('Error awarding skill coins:', error);
    return false;
  }

  return true;
};