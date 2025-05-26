import { supabase, supabaseAdmin } from './supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'customer' | 'driver';
  status: 'active' | 'inactive';
  created_at?: string;
  assigned_route?: string;
}

export type CreateUserData = Omit<User, 'id' | 'created_at' >;
export type UpdateUserData = Partial<Omit<User, 'id' | 'created_at'>>;

/**
 * Fetch all users from the database
 */
export async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
  
  return data as User[];
}

/**
 * Fetch a single user by ID
 */
export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching user ${id}:`, error);
    throw error;
  }
  
  return data as User;
}

/**
 * Create a new user
 */
export async function createUser(userData: CreateUserData & { password: string }) {
  const { email, password, name, phone, role, status, assigned_route } = userData;

  // Input validation
  if (!email) throw new Error('Email is required');
  if (!password) throw new Error('Password is required');
  if (!name) throw new Error('Name is required');
  if (password.length < 6) throw new Error('Password must be at least 6 characters long');
  
  try {
    // Step 1: Create user in Supabase Auth
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (signUpError) {
      console.error('Error creating auth user:', signUpError);
      throw signUpError;
    }

    const userId = authData.user?.id;
    if (!userId) throw new Error('User ID not returned from Supabase Auth');

    // Step 2: Insert additional data into users table
    const { data, error } = await supabase.from('users').insert([
      {
        id: userId,
        email,
        name,
        phone,
        role: role || 'customer', // Default to customer if not specified
        status: status || 'active', // Default to active if not specified
        created_at: new Date().toISOString(),
        assigned_route // Include assigned_route if provided
      },
    ])
    .select();

    if (error) {
      console.error('Error inserting user metadata:', error);
      
      // Try to clean up the auth user if metadata insertion fails
      try {
        // This is a cleanup attempt - if it fails, we still want to report the original error
        await supabase.auth.admin.deleteUser(userId);
      } catch (cleanupError) {
        console.error('Failed to clean up auth user after metadata insertion failure:', cleanupError);
      }
      
      throw error;
    }

    return data?.[0] as User;
  } catch (err) {
    console.error('Create user failed:', err);
    throw err;
  }
}

/**
 * Update an existing user
 */
export async function updateUser(id: string, userData: UpdateUserData) {
  const { data, error } = await supabase
    .from('users')
    .update(userData)
    .eq('id', id)
    .select();

  if (error) {
    console.error(`Error updating user ${id}:`, error);
    throw error;
  }
  
  return data?.[0] as User;
}

/**
 * Delete a user
 */
export async function deleteUser(id: string) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting user ${id}:`, error);
    throw error;
  }
  
  return true;
}

/**
 * Toggle a user's status (active/inactive)
 */
export async function toggleUserStatus(id: string, currentStatus: 'active' | 'inactive') {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  
  return updateUser(id, { status: newStatus });
}

/**
 * Search users by name or email
 */
export async function searchUsers(query: string) {
  // Convert query to lowercase for case-insensitive search
  const searchQuery = query.toLowerCase();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);

  if (error) {
    console.error('Error searching users:', error);
    throw error;
  }
  
  return data as User[];
}

/**
 * Get users with pagination
 */
export async function getPaginatedUsers(
  page: number, 
  pageSize: number, 
  sortField: keyof User = 'name', 
  sortDirection: 'asc' | 'desc' = 'asc',
  filter?: string,
  roleFilter?: User['role']
) {
  let query = supabase
    .from('users')
    .select('*', { count: 'exact' });
  
  // Apply role filter if provided
  if (roleFilter) {
    query = query.eq('role', roleFilter);
  }
  
  // Apply filter if provided
  if (filter) {
    query = query.or(`name.ilike.%${filter}%,email.ilike.%${filter}%`);
  }
  
  // Apply sorting
  query = query.order(sortField, { ascending: sortDirection === 'asc' });
  
  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);
  
  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching paginated users:', error);
    throw error;
  }
  console.log('data', data);
  return { 
    users: data as User[], 
    totalCount: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  };
}

/**
 * Update a user's password (admin only)
 */
export async function updateUserPassword(id: string, password: string) {
  // Input validation
  if (!password) throw new Error('Password is required');
  if (password.length < 6) throw new Error('Password must be at least 6 characters long');
  
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    id,
    { password }
  );

  if (error) {
    console.error(`Error updating password for user ${id}:`, error);
    throw error;
  }
  
  return data;
} 