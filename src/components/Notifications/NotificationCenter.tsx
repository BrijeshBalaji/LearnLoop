import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Bell, Check, X, MessageCircle, Trophy, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'swap_request' | 'swap_accepted' | 'swap_completed' | 'new_match' | 'reward_earned';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any;
}

export const NotificationCenter: React.FC = () => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchNotifications();
      // Set up real-time subscription for new notifications
      setupNotificationSubscription();
    }
  }, [profile]);

  const fetchNotifications = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      // For demo purposes, we'll simulate notifications based on user activity
      // In a real app, you'd have a notifications table
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'swap_request',
          title: 'New Swap Request',
          message: 'Someone wants to learn JavaScript from you!',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: '2',
          type: 'reward_earned',
          title: 'SkillCoins Earned!',
          message: 'You earned 10 SkillCoins for completing a swap',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          id: '3',
          type: 'swap_completed',
          title: 'Swap Completed',
          message: 'Your React learning session was marked complete',
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupNotificationSubscription = () => {
    // In a real app, you would subscribe to database changes
    // For now, we'll simulate with periodic updates
    const interval = setInterval(() => {
      // Simulate new notifications randomly
      if (Math.random() > 0.95) {
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: 'new_match',
          title: 'New Match Found!',
          message: 'We found someone who can teach you Python',
          read: false,
          created_at: new Date().toISOString(),
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        toast.success('New match found!');
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'swap_request':
      case 'swap_accepted':
      case 'swap_completed':
        return MessageCircle;
      case 'reward_earned':
        return Trophy;
      case 'new_match':
        return Users;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'swap_request':
        return 'from-blue-500 to-blue-600';
      case 'swap_accepted':
        return 'from-green-500 to-green-600';
      case 'swap_completed':
        return 'from-purple-500 to-purple-600';
      case 'reward_earned':
        return 'from-yellow-500 to-orange-500';
      case 'new_match':
        return 'from-pink-500 to-red-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-purple-600 transition-colors duration-200"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border z-50 max-h-96 overflow-hidden"
            >
              <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-y-auto max-h-80">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-600">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification, index) => {
                      const Icon = getNotificationIcon(notification.type);
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                            !notification.read ? 'bg-purple-50' : ''
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getNotificationColor(notification.type)} flex items-center justify-center flex-shrink-0`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                  {notification.title}
                                </h4>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(notification.created_at).toLocaleDateString()} at{' '}
                                {new Date(notification.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>

                            {!notification.read && (
                              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};