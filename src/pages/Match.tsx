import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, UserSkill, Profile } from '../lib/supabase';
import { Search, MessageCircle, User, BookOpen, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { CommunicationHub } from '../components/Communication/CommunicationHub';

interface MatchedUser extends Profile {
  offered_skills: UserSkill[];
  needed_skills: UserSkill[];
  matching_skill?: UserSkill;
}

export const Match: React.FC = () => {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<MatchedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMatch, setSelectedMatch] = useState<MatchedUser | null>(null);
  const [showCommunication, setShowCommunication] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchMatches();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const fetchMatches = async () => {
    if (!profile) return;

    try {
      // Get current user's skills
      const { data: mySkills, error: mySkillsError } = await supabase
        .from('user_skills')
        .select(`
          *,
          skills (*)
        `)
        .eq('user_id', profile.id);

      if (mySkillsError) {
        console.error('Error fetching my skills:', mySkillsError);
        return;
      }

      const myOfferedSkillIds = mySkills?.filter(s => s.type === 'offered').map(s => s.skill_id) || [];
      const myNeededSkillIds = mySkills?.filter(s => s.type === 'needed').map(s => s.skill_id) || [];

      if (myOfferedSkillIds.length === 0 && myNeededSkillIds.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      // Find potential matches
      const { data: potentialMatches, error: matchError } = await supabase
        .from('user_skills')
        .select(`
          user_id,
          skill_id,
          type,
          skills (*),
          profiles (*)
        `)
        .neq('user_id', profile.id)
        .in('skill_id', [...myOfferedSkillIds, ...myNeededSkillIds]);

      if (matchError) {
        console.error('Error fetching potential matches:', matchError);
        return;
      }

      // Group by user and find matches
      const userMap = new Map<string, MatchedUser>();

      potentialMatches?.forEach((match) => {
        const userId = match.user_id;
        
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            ...match.profiles,
            offered_skills: [],
            needed_skills: [],
          });
        }

        const user = userMap.get(userId)!;
        
        if (match.type === 'offered') {
          user.offered_skills.push(match as UserSkill);
        } else {
          user.needed_skills.push(match as UserSkill);
        }

        // Check if this creates a match
        const isMatch = (
          (match.type === 'needed' && myOfferedSkillIds.includes(match.skill_id)) ||
          (match.type === 'offered' && myNeededSkillIds.includes(match.skill_id))
        );

        if (isMatch && !user.matching_skill) {
          user.matching_skill = match as UserSkill;
        }
      });

      // Filter to only include actual matches
      const matchedUsers = Array.from(userMap.values()).filter(user => user.matching_skill);

      setMatches(matchedUsers);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const sendSwapRequest = async (providerId: string, skillId: string) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('swaps')
        .insert([
          {
            requester_id: profile.id,
            provider_id: providerId,
            skill_id: skillId,
            message: `Hi! I'd love to learn ${matches.find(m => m.id === providerId)?.matching_skill?.skills.name} from you.`,
          },
        ]);

      if (error) {
        toast.error('Error sending swap request');
        console.error('Error sending swap request:', error);
        return;
      }

      toast.success('Swap request sent successfully!');
      
      // Show communication options after successful swap request
      const matchedUser = matches.find(m => m.id === providerId);
      if (matchedUser) {
        setSelectedMatch(matchedUser);
        setShowCommunication(true);
      }
    } catch (error) {
      toast.error('Error sending swap request');
      console.error('Error sending swap request:', error);
    }
  };

  const filteredMatches = matches.filter(match => {
    const matchesSearch = match.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         match.matching_skill?.skills.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
                           match.matching_skill?.skills.category.toLowerCase() === selectedCategory.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(matches.map(m => m.matching_skill?.skills.category).filter(Boolean))];

  if (!profile) {
    return null; // Let the app-level auth handle this
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Find Your Perfect Work Partner</h1>
            <p className="text-xl text-gray-600">Connect with professionals who need what you offer and can provide what you need</p>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name or skill..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Finding matches...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Matches Found</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {matches.length === 0 
                  ? "Add some skills to your profile to find matches!"
                  : "Try adjusting your search or category filter."
                }
              </p>
              {matches.length === 0 && (
                <a
                  href="/profile"
                  className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                >
                  Update Profile
                </a>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{match.full_name}</h3>
                        <p className="text-sm text-gray-600">{match.skill_coins} SkillCoins</p>
                      </div>
                    </div>

                    {match.bio && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{match.bio}</p>
                    )}

                    {/* Matching Skill */}
                    {match.matching_skill && (
                      <div className="mb-4">
                        <div className={`p-3 rounded-lg ${
                          match.matching_skill.type === 'offered' 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-blue-50 border border-blue-200'
                        }`}>
                          <div className="flex items-center space-x-2 mb-1">
                            {match.matching_skill.type === 'offered' ? (
                              <BookOpen className="w-4 h-4 text-green-600" />
                            ) : (
                              <Target className="w-4 h-4 text-blue-600" />
                            )}
                            <span className={`text-sm font-medium ${
                              match.matching_skill.type === 'offered' ? 'text-green-700' : 'text-blue-700'
                            }`}>
                              {match.matching_skill.type === 'offered' ? 'Can offer' : 'Needs done'}
                            </span>
                          </div>
                          <p className="font-semibold text-gray-900">
                            {match.matching_skill.skills.name}
                          </p>
                          <p className="text-xs text-gray-600 capitalize mt-1">
                            {match.matching_skill.proficiency_level} level
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Other Skills */}
                    <div className="space-y-3 mb-6">
                      {match.offered_skills.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Also offers:</p>
                          <div className="flex flex-wrap gap-1">
                            {match.offered_skills.slice(0, 3).map((skill) => (
                              <span
                                key={skill.id}
                                className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                              >
                                {skill.skills.name}
                              </span>
                            ))}
                            {match.offered_skills.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{match.offered_skills.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {match.needed_skills.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Needs done:</p>
                          <div className="flex flex-wrap gap-1">
                            {match.needed_skills.slice(0, 3).map((skill) => (
                              <span
                                key={skill.id}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                              >
                                {skill.skills.name}
                              </span>
                            ))}
                            {match.needed_skills.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{match.needed_skills.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => match.matching_skill && sendSwapRequest(match.id, match.matching_skill.skill_id)}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Request Swap</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Communication Hub */}
      {showCommunication && selectedMatch && (
        <CommunicationHub
          matchedUser={selectedMatch}
          onClose={() => {
            setShowCommunication(false);
            setSelectedMatch(null);
          }}
        />
      )}
    </div>
  );
};