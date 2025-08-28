import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, Settings, Users, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Profile } from '../../lib/supabase';

interface VideoCallInterfaceProps {
  matchedUser: Profile;
  onClose: () => void;
}

export const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({
  matchedUser,
  onClose,
}) => {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Initialize local video stream
    initializeLocalVideo();
    
    // Simulate connection after 2 seconds
    const connectTimer = setTimeout(() => {
      setIsConnected(true);
      startCallTimer();
    }, 2000);

    return () => {
      clearTimeout(connectTimer);
      stopLocalVideo();
    };
  }, []);

  const initializeLocalVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera/microphone:', error);
    }
  };

  const stopLocalVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
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

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
      }
    }
  };

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn);
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioOn;
      }
    }
  };

  const endCall = () => {
    stopLocalVideo();
    onClose();
  };

  return (
    <div className="flex-1 bg-gray-900 relative overflow-hidden">
      {/* Video Streams */}
      <div className="absolute inset-0">
        {/* Remote Video (Main) */}
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          {isConnected ? (
            <video
              ref={remoteVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
            />
          ) : (
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">
                  {matchedUser.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-white text-xl font-bold mb-2">{matchedUser.full_name}</h3>
              <div className="flex items-center justify-center space-x-2 text-purple-300">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="ml-2">Connecting...</span>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-xl overflow-hidden shadow-2xl border-2 border-white"
        >
          {isVideoOn ? (
            <video
              ref={localVideoRef}
              className="w-full h-full object-cover transform scale-x-[-1]"
              autoPlay
              playsInline
              muted
            />
          ) : (
            <div className="w-full h-full bg-gray-600 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </motion.div>
      </div>

      {/* Call Info */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full backdrop-blur-sm"
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm font-medium">{formatDuration(callDuration)}</span>
          </div>
        </motion.div>
      )}

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2"
      >
        <div className="flex items-center space-x-4 bg-black bg-opacity-50 backdrop-blur-sm rounded-2xl px-6 py-4">
          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              isVideoOn
                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              isAudioOn
                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Chat Toggle */}
          <button
            onClick={() => setShowChat(!showChat)}
            className="w-12 h-12 rounded-full bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center transition-all duration-200"
          >
            <MessageCircle className="w-5 h-5" />
          </button>

          {/* Settings */}
          <button className="w-12 h-12 rounded-full bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center transition-all duration-200">
            <Settings className="w-5 h-5" />
          </button>

          {/* End Call */}
          <button
            onClick={endCall}
            className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all duration-200"
          >
            <Phone className="w-5 h-5 transform rotate-[135deg]" />
          </button>
        </div>
      </motion.div>

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
              <h3 className="font-bold text-gray-900">Chat</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-sm text-gray-700">Video call started</p>
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