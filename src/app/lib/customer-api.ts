import { supabase } from './supabase';
import { User, getUserById } from './users-api';
import { UserProfile, getUserProfile } from './auth';

export interface CustomerDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  company_name?: string;
  default_payment_method?: string;
  created_at?: string;
  newsletter_subscribed?: boolean;
  notifications?: {
    orderUpdates?: boolean;
    promotions?: boolean;
    newProducts?: boolean;
  };
  addresses?: Array<{
    id: string;
    address: string;
    isDefault: boolean;
    longitude?: number;
    latitude?: number;
  }>;
}

/**
 * Get comprehensive customer details by combining data from auth, users, and profiles tables
 */
export async function getCustomerDetailsByUserId(userId: string): Promise<CustomerDetails | null> {
  try {
    // Try to get the user data from users table
    let userDetails: Partial<CustomerDetails> = {};
    
    try {
      const userData = await getUserById(userId);
      userDetails = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        created_at: userData.created_at
      };
    } catch (err) {
      console.warn('Could not fetch user details from users table:', err);
    }
    
    // Try to get profile data from profiles table
    try {
      const profileData = await getUserProfile(userId);
      if (profileData) {
        userDetails = {
          ...userDetails,
          name: profileData.name || userDetails.name || '',
          email: profileData.email || userDetails.email || '',
          phone: profileData.phone || userDetails.phone || '',
          address: profileData.address || '',
          company_name: profileData.company_name,
          addresses: profileData.addresses
        };
      }
    } catch (err) {
      console.warn('Could not fetch user profile:', err);
    }
    
    // Try to get additional customer details from customers table if it exists
    try {
      const { data: customerData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (customerData) {
        userDetails = {
          ...userDetails,
          address: customerData.address || userDetails.address || '',
          phone: customerData.phone || userDetails.phone || '',
          default_payment_method: customerData.default_payment_method
        };
      }
    } catch (err) {
      // Customers table might not exist, so just log a debug message
      console.debug('Could not fetch from customers table:', err);
    }
    
    // Check if we have enough data to return
    if (userDetails.id) {
      return userDetails as CustomerDetails;
    }
    
    return null;
  } catch (err) {
    console.error(`Error fetching customer details for user ${userId}:`, err);
    return null;
  }
}

/**
 * Get customer details by email
 */
export async function getCustomerDetailsByEmail(email: string): Promise<CustomerDetails | null> {
  try {
    // First try to find the user ID from the users table
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (error || !data) {
      console.warn('User not found with email:', email);
      return null;
    }
    
    // Then use the user ID to get complete customer details
    return getCustomerDetailsByUserId(data.id);
  } catch (err) {
    console.error(`Error fetching customer details for email ${email}:`, err);
    return null;
  }
}

/**
 * Get customer details from auth user data
 */
export async function getCustomerDetailsFromAuth(authUser: any): Promise<CustomerDetails | null> {
  if (!authUser) return null;
  
  // Try to get by ID first
  const customerDetails = await getCustomerDetailsByUserId(authUser.id);
  if (customerDetails) return customerDetails;
  
  // Fall back to email
  if (authUser.email) {
    return getCustomerDetailsByEmail(authUser.email);
  }
  
  return null;
}

/**
 * Get user addresses
 */
export async function getUserAddresses(userId: string): Promise<Array<{
  id: string;
  address: string;
  isDefault: boolean;
  longitude?: number;
  latitude?: number;
}> | null> {
  try {
    // First try to get the user profile which may contain addresses
    const profileData = await getUserProfile(userId);
    
    if (profileData?.addresses && profileData.addresses.length > 0) {
      return profileData.addresses;
    }
    
    // If no addresses in the profile but there is a main address, create an entry for it
    if (profileData?.address) {
      return [{
        id: '1',
        address: profileData.address,
        isDefault: true,
        longitude: profileData.longitude,
        latitude: profileData.latitude
      }];
    }
    
    // No addresses found
    return [];
  } catch (err) {
    console.error(`Error fetching addresses for user ${userId}:`, err);
    return null;
  }
} 