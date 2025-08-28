import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create it
          console.log('Profile not found, creating new profile...');
          await createProfile(userId);
          return;
        } else {
          console.error('Error fetching profile:', error);
          // Create fallback profile if fetch fails
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setProfile({
              id: userId,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || 'User',
              bio: '',
              avatar_url: '',
              skill_coins: 0,
              total_swaps_completed: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Always provide a fallback profile to prevent infinite loading
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setProfile({
          id: userId,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || 'User',
          bio: '',
          avatar_url: '',
          skill_coins: 0,
          total_swaps_completed: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (userId: string) => {
    try {
      // Get user email from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
            bio: '',
            avatar_url: '',
            skill_coins: 0,
            total_swaps_completed: 0,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        // Create a temporary profile to prevent blocking
        setProfile({
          id: userId,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || 'New User',
          bio: '',
          avatar_url: '',
          skill_coins: 0,
          total_swaps_completed: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        setProfile(data);
        toast.success('Welcome to LearnLoop! Please complete your profile.');
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      // Create a fallback profile to prevent infinite loading
      if (user) {
        setProfile({
          id: userId,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || 'New User',
          bio: '',
          avatar_url: '',
          skill_coins: 0,
          total_swaps_completed: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success('Welcome back!');
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    if (data.user && data.user.email_confirmed_at) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email,
            full_name: fullName,
            bio: '',
            avatar_url: '',
            skill_coins: 0,
            total_swaps_completed: 0,
          },
        ]);

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Don't throw error, profile will be created on first login
        console.log('Profile will be created on first login');
      }
    }

    if (data.user) {
      toast.success('Account created successfully! Please check your email to verify your account.');
    } else {
      toast.success('Account created successfully! You can now sign in.');
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      throw error;
    }
    toast.success('Signed out successfully');
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      toast.error('Error updating profile');
      throw error;
    }

    await fetchProfile(user.id);
    toast.success('Profile updated successfully!');
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};