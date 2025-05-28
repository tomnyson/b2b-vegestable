import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'customer' | 'driver';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  company_name?: string;
  phone?: string;
  address?: string;
  longitude?: number;
  latitude?: number;
  created_at?: string;
  addresses?: Array<{
    id: string; 
    address: string; 
    isDefault: boolean; 
    longitude?: number; 
    latitude?: number;
  }>;
  newsletter_subscribed?: boolean;
  notifications?: {
    orderUpdates?: boolean;
    promotions?: boolean;
    newProducts?: boolean;
  };
}

export type AuthSignInCredentials = {
  email: string;
  password: string;
};

export type AuthSignUpCredentials = {
  email: string;
  password: string;
  name: string;
};

/**
 * Authentication functions
 */

// Sign in a user
export async function signIn({ email, password }: AuthSignInCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  
  // Check if user exists in the users table
  if (data.user) {
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking user record:', fetchError);
    }
    
    // If user doesn't exist in users table, create a record
    if (!userData) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          email: email,
          role: 'customer',
          status: 'active',
          phone: '',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error creating user record:', insertError);
      }
    }
  }
  
  return data;
}

// Sign in with Google OAuth
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  
  if (error) throw error;
  
  return data;
}

/**
 * Handle OAuth login - creates a new user record if it doesn't exist
 * This should be called after a successful OAuth redirect
 */
export async function handleOAuthSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  
  if (!session?.user) {
    return null;
  }
  
  // Check if the user already exists in our database
  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
    console.error('Error checking user record:', fetchError);
  }
  
  // If user doesn't exist in users table, create a record
  if (!userData) {
    const { user } = session;
    
    // Extract user information from OAuth provider data
    const name = user.user_metadata?.full_name || 
                user.user_metadata?.name || 
                user.user_metadata?.email?.split('@')[0] || 
                'User';
    
    const email = user.email || '';
    
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        name: name,
        email: email,
        role: 'customer',
        status: 'active',
        phone: '',
        created_at: new Date().toISOString(),
      });
      
    if (insertError) {
      console.error('Error creating user record after OAuth:', insertError);
    } else {
      console.log('Created new user record for OAuth user');
    }
  } 
  
  return session;
}

// Sign up a new user
export async function signUp({ email, password, name }: AuthSignUpCredentials) {
  // Register with Supabase Auth
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      }
    }
  });
  
  if (signUpError) throw signUpError;
  
  // Create a new user record in the users table
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: data.user?.id,
      name: name,
      email: email,
      role: 'customer',
      status: 'active',
      phone: ''
    });

  if (userError) throw userError;
  return data;
}

// Sign out a user
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Get the current session
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// Get the current user
export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

/**
 * Safe auth checking utility that doesn't throw on missing sessions
 */
export async function safeGetUser(): Promise<User | null> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return null;
    }

    const { data, error } = await supabase.auth.getUser();
    if (error) {
      return null;
    }
    
    return data.user;
  } catch (error) {
    // Silently handle auth errors
    return null;
  }
}

/**
 * Safe session checking utility
 */
export async function safeGetSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return null;
    }
    return data.session;
  } catch (error) {
    return null;
  }
}

/**
 * User profile functions
 */

// Register a new user with profile
export async function registerUserWithProfile(
  email: string,
  password: string,
  userData: Omit<UserProfile, 'id' | 'email'>
) {
  // 1. Sign up user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    throw authError;
  }

  if (!authData.user) {
    throw new Error('User registration failed');
  }

  // 2. Create user profile in the profiles table
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      name: userData.name,
      role: userData.role || 'customer', // Default role
      company_name: userData.company_name,
      phone: userData.phone,
      address: userData.address,
      created_at: new Date().toISOString(),
    });

  if (profileError) {
    // Attempt to clean up the auth user if profile creation fails
    await supabase.auth.signOut();
    throw profileError;
  }

  return authData.user;
}

// Get user profile data
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data as UserProfile;
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'email'>>
) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select();

  if (error) {
    throw error;
  }

  return data[0] as UserProfile;
}

/**
 * Password management
 */

// Reset password
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    throw error;
  }
}

// Update password
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw error;
  }
} 