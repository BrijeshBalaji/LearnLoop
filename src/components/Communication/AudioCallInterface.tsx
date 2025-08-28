import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Phone, Volume2, VolumeX, MessageCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Profile } from '../../lib/supabase';

interface AudioCallInterfaceProps {
  matchedUser: Profile;
  onClose: () => void;
}

export const AudioCallInterface: React.FC<AudioCallInterfaceProps> = ({
  matchedUser,
  onClose,
}) => {
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Initialize audio stream
    initializeAudio();
    
    // Simulate connection after 2 seconds
    const connectTimer = setTimeout(() => {
      setIsConnected(true);
      startCallTimer();
    }, 2000);

    // Simulate audio level animation
    const audioLevelTimer = setInterval(() => {
      if (isConnected && isAudioOn) {
        setAudioLevel(Math.random() * 100);
      } else {
        setAudioLevel(0);
      }
    }, 200);

    return () => {
      clearTimeout(connectTimer);
      clearInterval(audioLevelTimer);
      stopAudio();
    };
  }, [isConnected, isAudioOn]);

  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true 
      });
      
      // In a real app, you would handle the audio stream here
      console.log('Audio stream initialized');
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopAudio = () => {
    // Stop audio stream
    console.log('Audio stream stopped');
  };

  const startCallTimer = () => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn);
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  const endCall = () => {
    stopAudio();
    onClose();
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 transform rotate-12 scale-150"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
        {/* User Avatar */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-8"
        >
          <div className="w-48 h-48 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
            <User className="w-24 h-24 text-white" />
          </div>
          
          {/* Audio Level Indicator */}
          {isConnected && isAudioOn && (
            <motion.div
              animate={{ scale: 1 + (audioLevel / 200) }}
              transition={{ duration: 0.1 }}
              className="absolute inset-0 border-4 border-white border-opacity-30 rounded-full"
            />
          )}
          
          {/* Connection Status */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              isConnected 
                ? 'bg-green-500 text-white' 
                : 'bg-yellow-500 text-black'
            }`}>
              {isConnected ? 'Connected' : 'Connecting...'}
            </div>
          </div>
        </motion.div>

        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-2">{matchedUser.full_name}</h2>
          <p className="text-purple-200">Audio Call</p>
          {isConnected && (
            <p className="text-purple-300 mt-2">{formatDuration(callDuration)}</p>
          )}
        </motion.div>

        {/* Audio Visualizer */}
        {isConnected && isAudioOn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-1 mb-8"
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  height: Math.random() * (audioLevel / 2) + 10,
                  opacity: 0.3 + (Math.random() * 0.7)
                }}
                transition={{ duration: 0.1 }}
                className="w-1 bg-white rounded-full"
                style={{ minHeight: '10px' }}
              />
            ))}
          </motion.div>
        )}

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center space-x-6"
        >
          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
              isAudioOn
                ? 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isAudioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          {/* Speaker Toggle */}
          <button
            onClick={toggleSpeaker}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
              isSpeakerOn
                ? 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white'
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
          >
            {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>

          {/* Chat Toggle */}
          <button
            onClick={() => setShowChat(!showChat)}
            className="w-16 h-16 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white flex items-center justify-center transition-all duration-200 shadow-lg"
          >
            <MessageCircle className="w-6 h-6" />
          </button>

          {/* End Call */}
          <button
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all duration-200 shadow-lg"
          >
            <Phone className="w-6 h-6 transform rotate-[135deg]" />
          </button>
        </motion.div>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl"
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-bold text-gray-900">Chat during call</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-sm text-gray-700">Audio call started</p>
                  <span className="text-xs text-gray-500">Just now</span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  Send
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};