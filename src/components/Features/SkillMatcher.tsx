import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, UserSkill, Profile } from '../../lib/supabase';
import { Search, Users, Zap, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface PotentialMatch {
  user: Profile;
  skill: {
    id: string;
    name: string;
    category: string;
  };
  compatibility: number;
}

export const SkillMatcher: React.FC = () => {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<PotentialMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      findAdvancedMatches();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const findAdvancedMatches = async () => {
    if (!profile) return;

    try {
      // Get user's skills
      const { data: userSkills } = await supabase
        .from('user_skills')
        .select(`
          *,
          skills (*)
        `)
        .eq('user_id', profile.id);

      const myOffered = userSkills?.filter(s => s.type === 'offered') || [];
      const myNeeded = userSkills?.filter(s => s.type === 'needed') || [];

      if (myOffered.length === 0 && myNeeded.length === 0) {
        setLoading(false);
        return;
      }

      // Find users who need what I offer or offer what I need
      const potentialMatches: PotentialMatch[] = [];

      // Users who need what I offer
      for (const offeredSkill of myOffered) {
        const { data: needers } = await supabase
          .from('user_skills')
          .select(`
            user_id,
            skill_id,
            proficiency_level,
            profiles (*),
            skills (*)
          `)
          .eq('skill_id', offeredSkill.skill_id)
          .eq('type', 'needed')
          .neq('user_id', profile.id);

        if (needers) {
          for (const needer of needers) {
            const compatibility = calculateCompatibility(
              offeredSkill.proficiency_level,
              needer.proficiency_level
            );

            potentialMatches.push({
              user: needer.profiles,
              skill: needer.skills,
              compatibility,
            });
          }
        }
      }

      // Users who offer what I need
      for (const neededSkill of myNeeded) {
        const { data: providers } = await supabase
          .from('user_skills')
          .select(`
            user_id,
            skill_id,
            proficiency_level,
            profiles (*),
            skills (*)
          `)
          .eq('skill_id', neededSkill.skill_id)
          .eq('type', 'offered')
          .neq('user_id', profile.id);

        if (providers) {
          for (const provider of providers) {
            const compatibility = calculateCompatibility(
              provider.proficiency_level,
              neededSkill.proficiency_level
            );

            // Check if this user is already in matches to avoid duplicates
            const existingMatch = potentialMatches.find(m => m.user.id === provider.user_id);
            if (!existingMatch || existingMatch.compatibility < compatibility) {
              if (existingMatch) {
                // Remove the existing match and add the better one
                const index = potentialMatches.indexOf(existingMatch);
                potentialMatches.splice(index, 1);
              }

              potentialMatches.push({
                user: provider.profiles,
                skill: provider.skills,
                compatibility,
              });
            }
          }
        }
      }

      // Sort by compatibility and remove duplicates
      const uniqueMatches = potentialMatches
        .filter((match, index, self) => 
          index === self.findIndex(m => m.user.id === match.user.id)
        )
        .sort((a, b) => b.compatibility - a.compatibility)
        .slice(0, 12); // Limit to top 12 matches

      setMatches(uniqueMatches);
    } catch (error) {
      console.error('Error finding matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompatibility = (
    teacherLevel: string,
    learnerLevel: string
  ): number => {
    const levels = { beginner: 1, intermediate: 2, advanced: 3 };
    const teacherScore = levels[teacherLevel as keyof typeof levels] || 1;
    const learnerScore = levels[learnerLevel as keyof typeof levels] || 1;

    // Best match when teacher is 1-2 levels above learner
    const levelDiff = teacherScore - learnerScore;
    if (levelDiff >= 1 && levelDiff <= 2) return 100;
    if (levelDiff === 0) return 80;
    if (levelDiff === 3) return 60;
    return 40;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Finding your perfect matches...</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">No matches found</h3>
        <p className="text-gray-600 mb-6">Add some skills to your profile to find matches!</p>
        <a
          href="/profile"
          className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
        >
          Update Profile
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Perfect Work Partners for You</h2>
        <p className="text-gray-600">Our algorithm found {matches.length} mutual work exchange opportunities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map((match, index) => (
          <motion.div
            key={`${match.user.id}-${match.skill.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">
                  {match.user.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{match.user.full_name}</h3>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    match.compatibility >= 90 ? 'bg-green-500' :
                    match.compatibility >= 70 ? 'bg-yellow-500' : 'bg-orange-500'
                  }`}></div>
                  <span className="text-sm text-gray-600">
                    {match.compatibility}% match
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2 mb-1">
                <Target className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">Mutual Exchange</span>
              </div>
              <p className="font-semibold text-gray-900">You ↔ {match.user.full_name}</p>
              <p className="text-sm text-gray-600">Perfect skill match for work exchange</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-600">
                  {match.user.skill_coins} SkillCoins
                </span>
              </div>
              <button
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                onClick={() => {
                  // Navigate to detailed match view or send request
                  window.location.href = '/match';
                }}
              >
                Connect
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};