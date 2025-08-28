import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Swap } from '../lib/supabase';
import { Calendar, MessageCircle, CheckCircle, Clock, X, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { CommunicationHub } from '../components/Communication/CommunicationHub';

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'active' | 'completed'>('incoming');
  const [rating, setRating] = useState(5);
  const [selectedSwapForRating, setSelectedSwapForRating] = useState<string | null>(null);
  const [selectedUserForChat, setSelectedUserForChat] = useState<any>(null);
  const [showCommunication, setShowCommunication] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchSwaps();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const fetchSwaps = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('swaps')
        .select(`
          *,
          requester:profiles!swaps_requester_id_fkey(*),
          provider:profiles!swaps_provider_id_fkey(*),
          skills(*)
        `)
        .or(`requester_id.eq.${profile.id},provider_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching swaps:', error);
        return;
      }

      setSwaps(data || []);
    } catch (error) {
      console.error('Error fetching swaps:', error);
      setSwaps([]);
    } finally {
      setLoading(false);
    }
  };

  const updateSwapStatus = async (swapId: string, status: string) => {
    const { error } = await supabase
      .from('swaps')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {})
      })
      .eq('id', swapId);

    if (error) {
      toast.error('Error updating swap status');
      console.error('Error updating swap status:', error);
      return;
    }

    // If completing a swap, award SkillCoins
    if (status === 'completed') {
      const swap = swaps.find(s => s.id === swapId);
      if (swap) {
        // Award coins to both participants
        const participants = [swap.requester_id, swap.provider_id];
        
        for (const participantId of participants) {
          await supabase.rpc('award_skill_coins', {
            user_id: participantId,
            amount: 10,
            reason: `Completed skill swap: ${swap.skills.name}`
          });

          // Add reward record
          await supabase
            .from('rewards')
            .insert([{
              user_id: participantId,
              type: 'skill_coins',
              amount: 10,
              earned_for: `Completed skill swap: ${swap.skills.name}`,
              swap_id: swapId
            }]);
        }
      }
    }

    toast.success(`Swap ${status === 'accepted' ? 'accepted' : status === 'completed' ? 'completed' : 'cancelled'}!`);
    fetchSwaps();
  };

  const submitRating = async (swapId: string) => {
    const { error } = await supabase
      .from('swaps')
      .update({ rating })
      .eq('id', swapId);

    if (error) {
      toast.error('Error submitting rating');
      console.error('Error submitting rating:', error);
      return;
    }

    toast.success('Rating submitted!');
    setSelectedSwapForRating(null);
    fetchSwaps();
  };

  const getFilteredSwaps = () => {
    if (!profile) return [];

    switch (activeTab) {
      case 'incoming':
        return swaps.filter(s => s.provider_id === profile.id && s.status === 'pending');
      case 'outgoing':
        return swaps.filter(s => s.requester_id === profile.id && s.status === 'pending');
      case 'active':
        return swaps.filter(s => (s.requester_id === profile.id || s.provider_id === profile.id) && ['accepted', 'in_progress'].includes(s.status));
      case 'completed':
        return swaps.filter(s => (s.requester_id === profile.id || s.provider_id === profile.id) && s.status === 'completed');
      default:
        return [];
    }
  };

  const getTabCount = (tab: string) => {
    if (!profile) return 0;

    switch (tab) {
      case 'incoming':
        return swaps.filter(s => s.provider_id === profile.id && s.status === 'pending').length;
      case 'outgoing':
        return swaps.filter(s => s.requester_id === profile.id && s.status === 'pending').length;
      case 'active':
        return swaps.filter(s => (s.requester_id === profile.id || s.provider_id === profile.id) && ['accepted', 'in_progress'].includes(s.status)).length;
      case 'completed':
        return swaps.filter(s => (s.requester_id === profile.id || s.provider_id === profile.id) && s.status === 'completed').length;
      default:
        return 0;
    }
  };

  const filteredSwaps = getFilteredSwaps();

  const tabs = [
    { id: 'incoming', name: 'Incoming', icon: Calendar, color: 'text-blue-600' },
    { id: 'outgoing', name: 'Outgoing', icon: Clock, color: 'text-orange-600' },
    { id: 'active', name: 'Active', icon: MessageCircle, color: 'text-green-600' },
    { id: 'completed', name: 'Completed', icon: CheckCircle, color: 'text-purple-600' },
  ];

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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Work Exchange Dashboard</h1>
            <p className="text-xl text-gray-600">Manage your skill swaps and work exchanges</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {tabs.map((tab) => (
              <div key={tab.id} className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                  tab.id === 'incoming' ? 'bg-blue-100' :
                  tab.id === 'outgoing' ? 'bg-orange-100' :
                  tab.id === 'active' ? 'bg-green-100' : 'bg-purple-100'
                }`}>
                  <tab.icon className={`w-6 h-6 ${tab.color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {getTabCount(tab.id)}
                </div>
                <div className="text-sm text-gray-600">{tab.name} Swaps</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } transition-all duration-200`}
                  >
                    <div className="flex items-center space-x-2">
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.name}</span>
                      {getTabCount(tab.id) > 0 && (
                        <span className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full">
                          {getTabCount(tab.id)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading swaps...</p>
                </div>
              ) : filteredSwaps.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">No Swaps Found</h3>
                  <p className="text-gray-600 mb-8">
                    {activeTab === 'incoming' && "You haven't received any swap requests yet."}
                    {activeTab === 'outgoing' && "You haven't sent any swap requests yet."}
                    {activeTab === 'active' && "No active swaps at the moment."}
                    {activeTab === 'completed' && "No completed swaps yet."}
                  </p>
                  {(activeTab === 'incoming' || activeTab === 'outgoing') && (
                    <a
                      href="/match"
                      className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                    >
                      Find Matches
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSwaps.map((swap, index) => {
                    const isProvider = swap.provider_id === profile.id;
                    const otherUser = isProvider ? swap.requester : swap.provider;
                    
                    return (
                      <motion.div
                        key={swap.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        className="border border-gray-200 rounded-xl p-6"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                          <div className="flex-1">
                            <div className="flex items-start space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-sm">
                                  {otherUser.full_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900">
                                  {swap.skills.name} with {otherUser.full_name}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">
                                  {isProvider ? 'They need your work' : 'You need their work'}
                                </p>
                                {swap.message && (
                                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mb-2">
                                    "{swap.message}"
                                  </p>
                                )}
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span>
                                    Created: {new Date(swap.created_at).toLocaleDateString()}
                                  </span>
                                  {swap.completed_at && (
                                    <span>
                                      Completed: {new Date(swap.completed_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            {/* Status badge */}
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              swap.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              swap.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                              swap.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                              swap.status === 'completed' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {swap.status.charAt(0).toUpperCase() + swap.status.slice(1).replace('_', ' ')}
                            </span>

                            {/* Action buttons */}
                            {activeTab === 'incoming' && swap.status === 'pending' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => updateSwapStatus(swap.id, 'accepted')}
                                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => updateSwapStatus(swap.id, 'cancelled')}
                                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
                                >
                                  Decline
                                </button>
                              </div>
                            )}

                            {activeTab === 'active' && ['accepted', 'in_progress'].includes(swap.status) && (
                              <div className="flex space-x-2">
                                {swap.status === 'accepted' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedUserForChat(otherUser);
                                        setShowCommunication(true);
                                      }}
                                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                                    >
                                      Chat
                                    </button>
                                    <button
                                      onClick={() => updateSwapStatus(swap.id, 'in_progress')}
                                      className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors duration-200"
                                    >
                                      Start Working
                                    </button>
                                  </>
                                )}
                                {swap.status === 'in_progress' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedUserForChat(otherUser);
                                        setShowCommunication(true);
                                      }}
                                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                                    >
                                      Chat
                                    </button>
                                    <button
                                      onClick={() => updateSwapStatus(swap.id, 'completed')}
                                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
                                    >
                                      Mark Complete
                                    </button>
                                  </>
                                )}
                              </div>
                            )}

                            {activeTab === 'completed' && swap.status === 'completed' && !swap.rating && (
                              <div className="flex items-center space-x-2">
                                {selectedSwapForRating === swap.id ? (
                                  <div className="flex items-center space-x-2">
                                    <div className="flex space-x-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          onClick={() => setRating(star)}
                                          className={`${rating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                                        >
                                          <Star className="w-5 h-5 fill-current" />
                                        </button>
                                      ))}
                                    </div>
                                    <button
                                      onClick={() => submitRating(swap.id)}
                                      className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-purple-700"
                                    >
                                      Submit
                                    </button>
                                    <button
                                      onClick={() => setSelectedSwapForRating(null)}
                                      className="text-gray-500 hover:text-gray-700"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setSelectedSwapForRating(swap.id)}
                                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors duration-200"
                                  >
                                    Rate
                                  </button>
                                )}
                              </div>
                            )}

                            {swap.rating && (
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-medium">{swap.rating}/5</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Communication Hub */}
      {showCommunication && selectedUserForChat && (
        <CommunicationHub
          matchedUser={selectedUserForChat}
          onClose={() => {
            setShowCommunication(false);
            setSelectedUserForChat(null);
          }}
        />
      )}
    </div>
  );
};