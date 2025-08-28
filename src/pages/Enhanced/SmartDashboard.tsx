import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Swap } from '../../lib/supabase';
import { SkillMatcher } from '../../components/Features/SkillMatcher';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle, 
  Star,
  Calendar,
  MessageCircle,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStats {
  totalSwaps: number;
  activeSwaps: number;
  completedThisWeek: number;
  skillCoinsEarned: number;
  averageRating: number;
  streakDays: number;
}

export const SmartDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalSwaps: 0,
    activeSwaps: 0,
    completedThisWeek: 0,
    skillCoinsEarned: 0,
    averageRating: 0,
    streakDays: 0,
  });
  const [recentSwaps, setRecentSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    if (!profile) return;

    try {
      // Fetch user's swaps
      const { data: swaps } = await supabase
        .from('swaps')
        .select(`
          *,
          requester:profiles!swaps_requester_id_fkey(*),
          provider:profiles!swaps_provider_id_fkey(*),
          skills(*)
        `)
        .or(`requester_id.eq.${profile.id},provider_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (swaps) {
        setRecentSwaps(swaps.slice(0, 5));

        // Calculate stats
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const completedSwaps = swaps.filter(s => s.status === 'completed');
        const completedThisWeek = completedSwaps.filter(
          s => new Date(s.completed_at || s.updated_at) > oneWeekAgo
        ).length;

        const ratings = swaps.filter(s => s.rating).map(s => s.rating);
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
          : 0;

        setStats({
          totalSwaps: swaps.length,
          activeSwaps: swaps.filter(s => ['accepted', 'in_progress'].includes(s.status)).length,
          completedThisWeek,
          skillCoinsEarned: profile.skill_coins,
          averageRating: Math.round(averageRating * 10) / 10,
          streakDays: calculateStreak(completedSwaps),
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (completedSwaps: Swap[]): number => {
    // Simple streak calculation - consecutive days with completed swaps
    const completionDates = completedSwaps
      .map(s => new Date(s.completed_at || s.updated_at).toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort();

    let streak = 0;
    let currentDate = new Date();
    
    for (let i = completionDates.length - 1; i >= 0; i--) {
      const completionDate = new Date(completionDates[i]);
      const daysDiff = Math.floor(
        (currentDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysDiff <= streak + 1) {
        streak++;
        currentDate = completionDate;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const statCards = [
    {
      title: 'Total Swaps',
      value: stats.totalSwaps,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Swaps',
      value: stats.activeSwaps,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'This Week',
      value: stats.completedThisWeek,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'SkillCoins',
      value: stats.skillCoinsEarned,
      icon: Award,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Avg Rating',
      value: stats.averageRating || 0,
      icon: Star,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      suffix: '/5',
    },
    {
      title: 'Streak',
      value: stats.streakDays,
      icon: TrendingUp,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      suffix: ' days',
    },
  ];

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome back, {profile.full_name}!
            </h1>
            <p className="text-xl text-gray-600">Here's your learning journey at a glance</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`${stat.bgColor} rounded-2xl p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}{stat.suffix || ''}
                </div>
                <div className="text-sm text-gray-600">{stat.title}</div>
              </motion.div>
            ))}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                  Recent Activity
                </h2>
                
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : recentSwaps.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">No recent activity</p>
                    <a
                      href="/match"
                      className="inline-block mt-3 text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      Find matches →
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentSwaps.map((swap, index) => {
                      const otherUser = swap.requester_id === profile.id ? swap.provider : swap.requester;
                      return (
                        <motion.div
                          key={swap.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">
                              {otherUser.full_name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 font-medium truncate">
                              {swap.skills.name} with {otherUser.full_name}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                swap.status === 'completed' ? 'bg-green-100 text-green-800' :
                                swap.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                swap.status === 'accepted' ? 'bg-purple-100 text-purple-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {swap.status.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(swap.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Smart Matches */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <SkillMatcher />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};