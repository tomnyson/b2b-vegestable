import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../app/lib/supabase';
import { UserProfile, getUser, getUserProfile, signOut, safeGetUser, safeGetSession, signIn } from '../app/lib/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userData: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing session and update auth state
  useEffect(() => {
    async function loadUserSession() {
      setIsLoading(true);
      try {
        // Get current user safely
        const currentUser = await safeGetUser();
        setUser(currentUser);

        // If user exists, fetch their profile
        if (currentUser) {
          const userProfile = await getUserProfile(currentUser.id);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error loading user session:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    }

    // Initial load
    loadUserSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        
        if (session?.user) {
          try {
            const userProfile = await getUserProfile(session.user.id);
            setProfile(userProfile);
          } catch (error) {
            console.error('Error fetching user profile:', error);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await signIn({ email, password });
      
      // Role-based redirection
      if (result.userProfile?.role === 'driver') {
        router.push('/driver');
      } else if (result.userProfile?.role === 'admin') {
        router.push('/dashboard');
      } else {
        // Customers go to store
        router.push('/store');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (email: string, password: string, userData: Partial<UserProfile>) => {
    setIsLoading(true);
    try {
      // Create auth user
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            role: userData.role || 'customer',
          },
        },
      });
      
      if (error) throw error;

      // The profile will be created in a database trigger or function
      // New users are customers by default, so redirect to store
      router.push('/store');
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user) {
      const userProfile = await getUserProfile(user.id);
      setProfile(userProfile);
    }
  };

  const value = {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 