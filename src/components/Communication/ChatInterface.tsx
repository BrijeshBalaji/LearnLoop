import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Paperclip, Phone, Video } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_name?: string;
}

interface ChatInterfaceProps {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  onStartVideoCall?: () => void;
  onStartAudioCall?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  otherUserId,
  otherUserName,
  onStartVideoCall,
  onStartAudioCall
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const emojis = ['😊', '😂', '❤️', '👍', '👎', '😢', '😮', '😡', '🎉', '🔥', '💯', '🚀'];

  useEffect(() => {
    fetchMessages();
    subscribeToMessages();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages = data.map(msg => ({
        ...msg,
        sender_name: msg.sender?.full_name || 'Unknown User'
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Fetch sender info
          const { data: senderData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newMessage.sender_id)
            .single();

          setMessages(prev => [...prev, {
            ...newMessage,
            sender_name: senderData?.full_name || 'Unknown User'
          }]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;

      // Update conversation last message
      await supabase
        .from('conversations')
        .update({
          last_message: newMessage.trim(),
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div>
          <h3 className="font-semibold text-gray-900">{otherUserName}</h3>
          <p className="text-sm text-gray-500">Online</p>
        </div>
        <div className="flex space-x-2">
          {onStartAudioCall && (
            <button
              onClick={onStartAudioCall}
              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-100 rounded-full transition-colors"
            >
              <Phone className="w-5 h-5" />
            </button>
          )}
          {onStartVideoCall && (
            <button
              onClick={onStartVideoCall}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
            >
              <Video className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender_id === user?.id
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.sender_id === user?.id ? 'text-purple-100' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        {showEmojiPicker && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-6 gap-2">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => addEmoji(emoji)}
                  className="text-xl hover:bg-gray-200 rounded p-1 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
          >
            <Smile className="w-5 h-5" />
          </button>
          
          <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

export { ChatInterface }