import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Reward } from '../lib/supabase';
import { Trophy, Coins, Award, Star, Users, Target, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardUser {
  id: string;
  full_name: string;
  skill_coins: number;
  total_swaps_completed: number;
  avatar_url?: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  requirement: number;
  earned?: boolean;
}

export const Rewards: React.FC = () => {
  const { profile } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'badges'>('overview');

  const badges: Badge[] = [
    {
      id: 'first_swap',
      name: 'First Exchange',
      description: 'Complete your first work swap',
      icon: Star,
      color: 'from-yellow-400 to-orange-500',
      requirement: 1,
    },
    {
      id: 'skill_master',
      name: 'Exchange Master',
      description: 'Complete 10 work swaps',
      icon: Trophy,
      color: 'from-purple-500 to-pink-500',
      requirement: 10,
    },
    {
      id: 'knowledge_seeker',
      name: 'Work Seeker',
      description: 'Get 5 different types of work done',
      icon: BookOpen,
      color: 'from-blue-500 to-teal-500',
      requirement: 5,
    },
    {
      id: 'mentor',
      name: 'Service Provider',
      description: 'Help 15 different professionals',
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      requirement: 15,
    },
    {
      id: 'coin_collector',
      name: 'Coin Collector',
      description: 'Earn 100 SkillCoins',
      icon: Coins,
      color: 'from-yellow-500 to-amber-500',
      requirement: 100,
    },
    {
      id: 'champion',
     name: 'Exchange Champion',
     description: 'Complete 25 work swaps',
      icon: Award,
      color: 'from-red-500 to-pink-500',
      requirement: 25,
    },
  ];

  useEffect(() => {
    if (profile) {
      fetchRewards();
      fetchLeaderboard();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const fetchRewards = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching rewards:', error);
        return;
      }

      setRewards(data || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      setRewards([]);
    } finally {
      // Don't set loading false here, wait for leaderboard
    }
  }

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, skill_coins, total_swaps_completed, avatar_url')
      .order('skill_coins', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return;
    }

    setLeaderboard(data || []);
    setLoading(false);
  };

  const getBadgeProgress = (badge: Badge) => {
    if (!profile) return 0;
    
    switch (badge.id) {
      case 'first_swap':
      case 'skill_master':
      case 'champion':
        return profile.total_swaps_completed;
      case 'coin_collector':
        return profile.skill_coins;
      case 'knowledge_seeker':
      case 'mentor':
        return profile.total_swaps_completed; // Simplified for demo
      default:
        return 0;
    }
  };

  const isEarned = (badge: Badge) => {
    return getBadgeProgress(badge) >= badge.requirement;
  };

  const getUserRank = () => {
    if (!profile) return 0;
    return leaderboard.findIndex(user => user.id === profile.id) + 1;
  };

  const totalSkillCoins = profile?.skill_coins || 0;
  const totalRewards = rewards.length;
  const earnedBadges = badges.filter(badge => isEarned(badge)).length;

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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Rewards & Achievements</h1>
            <p className="text-xl text-gray-600">Track your progress and celebrate your work exchange milestones</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 mb-1">SkillCoins</p>
                  <p className="text-3xl font-bold">{totalSkillCoins}</p>
                </div>
                <Coins className="w-12 h-12 text-yellow-100" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 mb-1">Badges Earned</p>
                  <p className="text-3xl font-bold">{earnedBadges}</p>
                </div>
                <Award className="w-12 h-12 text-purple-100" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 mb-1">Leaderboard Rank</p>
                  <p className="text-3xl font-bold">#{getUserRank() || '—'}</p>
                </div>
                <Trophy className="w-12 h-12 text-blue-100" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 mb-1">Swaps Completed</p>
                  <p className="text-3xl font-bold">{profile.total_swaps_completed}</p>
                </div>
                <Target className="w-12 h-12 text-green-100" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-xl">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {[
                  { id: 'overview', name: 'Recent Rewards', icon: Award },
                  { id: 'leaderboard', name: 'Leaderboard', icon: Trophy },
                  { id: 'badges', name: 'Badges', icon: Star },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } transition-all duration-200`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Recent Rewards Tab */}
              {activeTab === 'overview' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Rewards</h2>
                  {rewards.length === 0 ? (
                    <div className="text-center py-12">
                      <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No rewards yet</h3>
                      <p className="text-gray-600 mb-6">Complete your first skill swap to start earning rewards!</p>
                      <a
                        href="/match"
                        className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                      >
                        Find Matches
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {rewards.map((reward, index) => (
                        <motion.div
                          key={reward.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                          className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100"
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              reward.type === 'skill_coins'
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                                : 'bg-gradient-to-r from-purple-500 to-pink-500'
                            }`}>
                              {reward.type === 'skill_coins' ? (
                                <Coins className="w-6 h-6 text-white" />
                              ) : (
                                <Award className="w-6 h-6 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900">
                                {reward.type === 'skill_coins' 
                                  ? `+${reward.amount} SkillCoins`
                                  : reward.badge_name
                                }
                              </h3>
                              <p className="text-gray-600 text-sm">{reward.earned_for}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(reward.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Leaderboard Tab */}
              {activeTab === 'leaderboard' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">SkillCoins Leaderboard</h2>
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading leaderboard...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {leaderboard.map((user, index) => {
                        const isCurrentUser = user.id === profile.id;
                        return (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.05 }}
                            className={`flex items-center space-x-4 p-4 rounded-xl ${
                              isCurrentUser
                                ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300'
                                : 'bg-gray-50 hover:bg-gray-100'
                            } transition-all duration-200`}
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                              index === 0
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                                : index === 1
                                ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white'
                                : index === 2
                                ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white'
                                : isCurrentUser
                                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                                : 'bg-gray-300 text-gray-700'
                            }`}>
                              {index + 1}
                            </div>
                            
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {user.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>

                            <div className="flex-1">
                              <h3 className={`font-bold ${isCurrentUser ? 'text-purple-900' : 'text-gray-900'}`}>
                                {user.full_name} {isCurrentUser && '(You)'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {user.total_swaps_completed} swaps completed
                              </p>
                            </div>

                            <div className="text-right">
                              <div className="flex items-center space-x-1">
                                <Coins className="w-5 h-5 text-yellow-500" />
                                <span className="font-bold text-lg">{user.skill_coins}</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Badges Tab */}
              {activeTab === 'badges' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Achievement Badges</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {badges.map((badge, index) => {
                      const earned = isEarned(badge);
                      const progress = getBadgeProgress(badge);
                      const progressPercentage = Math.min((progress / badge.requirement) * 100, 100);

                      return (
                        <motion.div
                          key={badge.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                          className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                            earned
                              ? 'bg-white border-green-300 shadow-lg transform hover:scale-105'
                              : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {earned && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <Award className="w-3 h-3 text-white" />
                            </div>
                          )}

                          <div className={`w-16 h-16 rounded-2xl mb-4 flex items-center justify-center bg-gradient-to-r ${badge.color} ${
                            earned ? 'opacity-100' : 'opacity-50'
                          }`}>
                            <badge.icon className="w-8 h-8 text-white" />
                          </div>

                          <h3 className={`text-lg font-bold mb-2 ${earned ? 'text-gray-900' : 'text-gray-500'}`}>
                            {badge.name}
                          </h3>
                          <p className={`text-sm mb-4 ${earned ? 'text-gray-700' : 'text-gray-500'}`}>
                            {badge.description}
                          </p>

                          <div className="mb-2">
                            <div className="flex justify-between text-sm mb-1">
                              <span className={earned ? 'text-green-600 font-medium' : 'text-gray-600'}>
                                Progress
                              </span>
                              <span className={earned ? 'text-green-600 font-medium' : 'text-gray-600'}>
                                {progress}/{badge.requirement}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  earned
                                    ? 'bg-gradient-to-r from-green-400 to-green-600'
                                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
                                }`}
                                style={{ width: `${progressPercentage}%` }}
                              ></div>
                            </div>
                          </div>

                          {earned && (
                            <div className="text-center">
                              <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                Earned!
                              </span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};