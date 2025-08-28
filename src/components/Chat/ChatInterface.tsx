import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Message, Conversation } from '../../lib/supabase';
import { Send, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface ChatInterfaceProps {
  swapId: string;
  otherUserId: string;
  otherUserName: string;
  onClose: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  swapId,
  otherUserId,
  otherUserName,
  onClose,
}) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile) {
      initializeChat();
    }
  }, [profile, swapId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let subscription: any = null;

    if (conversation) {
      // Subscribe to new messages
      subscription = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversation.id}`,
          },
          (payload) => {
            const newMessage = payload.new as Message;
            // Add sender info
            if (newMessage.sender_id === profile?.id) {
              newMessage.sender = profile;
            } else {
              newMessage.sender = {
                id: otherUserId,
                full_name: otherUserName,
              } as any;
            }
            setMessages((prev) => [...prev, newMessage]);
          }
        )
        .subscribe();
    }

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [conversation, profile, otherUserId, otherUserName]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    if (!profile) return;

    try {
      // Check if conversation exists
      let { data: existingConversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('swap_id', swapId)
        .single();

      if (convError && convError.code !== 'PGRST116') {
        console.error('Error fetching conversation:', convError);
        return;
      }

      // Create conversation if it doesn't exist
      if (!existingConversation) {
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert([
            {
              swap_id: swapId,
              participant_1: profile.id,
              participant_2: otherUserId,
            },
          ])
          .select()
          .single();

        if (createError) {
          console.error('Error creating conversation:', createError);
          toast.error('Failed to initialize chat');
          return;
        }

        existingConversation = newConversation;
      }

      setConversation(existingConversation);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(id, full_name)
        `)
        .eq('conversation_id', existingConversation.id)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return;
      }

      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation || !profile || sending) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversation.id,
            sender_id: profile.id,
            content: messageText,
          },
        ]);

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
        setNewMessage(messageText); // Restore message
        return;
      }

      // Update conversation last_message
      await supabase
        .from('conversations')
        .update({
          last_message: messageText,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  if (!profile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg h-96 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold">{otherUserName}</h3>
                <p className="text-sm text-purple-100">Chat</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-center">
              <div>
                <p className="mb-2">No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((message, index) => {
                const isOwnMessage = message.sender_id === profile.id;
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        isOwnMessage
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-purple-100' : 'text-gray-500'
                        }`}
                      >
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={sendMessage} className="border-t p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-2 rounded-full hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};