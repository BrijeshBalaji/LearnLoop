import React, { useState } from 'react';
import { X, MessageCircle, Video, Phone, Calendar, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatInterface } from './ChatInterface';
import { VideoCallInterface } from './VideoCallInterface';
import { AudioCallInterface } from './AudioCallInterface';
import { Profile } from '../../lib/supabase';

interface CommunicationHubProps {
  matchedUser: Profile;
  onClose: () => void;
}

type CommunicationMode = 'chat' | 'video' | 'audio' | 'schedule';

export const CommunicationHub: React.FC<CommunicationHubProps> = ({
  matchedUser,
  onClose,
}) => {
  const [activeMode, setActiveMode] = useState<CommunicationMode>('chat');

  const communicationOptions = [
    {
      id: 'chat' as CommunicationMode,
      name: 'Text Chat',
      icon: MessageCircle,
      color: 'from-blue-500 to-blue-600',
      description: 'Start a conversation',
    },
    {
      id: 'video' as CommunicationMode,
      name: 'Video Call',
      icon: Video,
      color: 'from-green-500 to-green-600',
      description: 'Face-to-face learning',
    },
    {
      id: 'audio' as CommunicationMode,
      name: 'Audio Call',
      icon: Phone,
      color: 'from-purple-500 to-purple-600',
      description: 'Voice conversation',
    },
    {
      id: 'schedule' as CommunicationMode,
      name: 'Schedule',
      icon: Calendar,
      color: 'from-orange-500 to-orange-600',
      description: 'Plan a session',
    },
  ];

  const renderCommunicationInterface = () => {
    switch (activeMode) {
      case 'chat':
        return (
          <ChatInterface
            swapId="temp-swap-id" // In real app, this would be the actual swap ID
            otherUserId={matchedUser.id}
            otherUserName={matchedUser.full_name}
            onClose={onClose}
          />
        );
      case 'video':
        return (
          <VideoCallInterface
            matchedUser={matchedUser}
            onClose={() => setActiveMode('chat')}
          />
        );
      case 'audio':
        return (
          <AudioCallInterface
            matchedUser={matchedUser}
            onClose={() => setActiveMode('chat')}
          />
        );
      case 'schedule':
        return (
          <div className="p-6 text-center">
            <Calendar className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Schedule a Session</h3>
            <p className="text-gray-600 mb-6">
              Coordinate with {matchedUser.full_name} to find the perfect time for your skill swap
            </p>
            <div className="space-y-4">
              <input
                type="datetime-local"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <textarea
                placeholder="Add a note about what you'd like to learn or teach..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200">
                Send Schedule Request
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[600px] flex overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div className="w-80 bg-gradient-to-b from-purple-50 to-blue-50 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Communication</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Matched User Info */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{matchedUser.full_name}</h3>
                <p className="text-sm text-gray-600">{matchedUser.skill_coins} SkillCoins</p>
              </div>
            </div>
          </div>

          {/* Communication Options */}
          <div className="flex-1 p-6">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Choose Communication Method</h4>
            <div className="space-y-3">
              {communicationOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setActiveMode(option.id)}
                  className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                    activeMode === option.id
                      ? 'bg-white shadow-lg border-2 border-purple-200'
                      : 'bg-white bg-opacity-50 hover:bg-white hover:shadow-md border border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${option.color} flex items-center justify-center`}>
                      <option.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">{option.name}</h5>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-4">
              <h5 className="font-medium text-gray-900 mb-2">Quick Tip</h5>
              <p className="text-sm text-gray-700">
                Start with a chat to introduce yourself and plan your skill swap session!
              </p>
            </div>
          </div>
        </div>

        {/* Main Communication Area */}
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              {renderCommunicationInterface()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};