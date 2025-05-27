import { supabase, supabaseAdmin } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  zip_code?: string;
  city?: string;
  role: 'admin' | 'customer' | 'driver';
  status: 'active' | 'inactive';
  created_at?: string;
  assigned_route?: string;
}

export type CreateUserData = Omit<User, 'id' | 'created_at' >;
export type UpdateUserData = Partial<Omit<User, 'id' | 'created_at'>>;

// CSV Import Types
export interface CSVRow {
  name: string;
  email: string;
  role?: string;
  created_at?: string;
  is_active?: string | boolean;
  address?: string;
  phone_number?: string;
  notes?: string;
  city?: string;
  zip_code?: string;
}

export interface ImportResult {
  success: number;
  errors: Array<{ row: number; error: string; data: any }>;
}

export interface BatchImportResult {
  success: any[];
  errors: Array<{ index: number; error: string; data: any }>;
}

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
  const { email, password, name, phone, address, city, zip_code, notes, role, status, assigned_route } = userData;

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
        address,
        city,
        zip_code,
        notes,
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
  // If updating email, also update in Supabase Auth
  if (userData.email) {
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      email: userData.email,
      email_confirm: true
    });

    if (authUpdateError) {
      console.error(`Error updating auth email for user ${id}:`, authUpdateError);
      throw authUpdateError;
    }
  }

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

// CSV Import Functions

/**
 * Generate a random password for imported users
 */
export function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Generate sample CSV template for user import
 */
export function generateSampleCSV(): string {
  return `name,email,role,phone_number,address,notes
John Doe,john@example.com,customer,+1234567890,123 Main St,Regular customer with real email
Jane Smith,,admin,+1234567891,456 Oak Ave,Admin user with dummy email
Bob Wilson,bob@example.com,driver,+1234567892,789 Pine Rd,Delivery driver with real email
Alice Johnson,,customer,+1234567893,321 Elm St,Customer with dummy email`;
}

/**
 * Validate a CSV row for user import
 */
export function validateCSVRow(row: CSVRow, index: number): string | null {
  // Required fields validation
  if (!row.name || !row.name.trim()) {
    return `Row ${index + 1}: Name is required`;
  }
  
  // Email is now optional - if provided, validate format
  if (row.email && row.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email.trim())) {
      return `Row ${index + 1}: Invalid email format`;
    }
  }

  // Role validation (if provided)
  if (row.role && !['admin', 'customer', 'driver'].includes(row.role.toLowerCase())) {
    return `Row ${index + 1}: Invalid role. Must be admin, customer, or driver`;
  }

  return null;
}

/**
 * Convert CSV row to CreateUserData
 */
export function convertCSVRowToUserData(row: CSVRow): CreateUserData & { password: string; address?: string } {
  const hasOriginalEmail = !!(row.email && row.email.trim());
  const originalEmail = hasOriginalEmail ? row.email.trim().toLowerCase() : '';
  
  // Create dummy email if no email provided
  const emailForAuth = hasOriginalEmail ? originalEmail : `user_${uuidv4()}@dummy.email`;
  
  return {
    name: row.name.trim(),
    email: emailForAuth, // Always provide an email for auth
    phone: row.phone_number?.trim() || '',
    role: (row.role?.toLowerCase() as 'admin' | 'customer' | 'driver') || 'customer',
    status: row.is_active === undefined ? 'active' : 
           typeof row.is_active === 'string' ? 
           (row.is_active.toLowerCase() === 'true' ? 'active' : 'inactive') : 
           (row.is_active ? 'active' : 'inactive'),
    address: row.address?.trim() || undefined,
    city: row.city?.trim() || undefined,
    zip_code: row.zip_code?.trim() || undefined,
    notes: row.notes?.trim() || undefined,
    password: generateRandomPassword() // Always generate password since all users get auth accounts
  };
}

/**
 * Batch create users from CSV data
 */
export async function batchCreateUsers(
  usersData: (CreateUserData & { password: string; address?: string })[]
): Promise<BatchImportResult> {
  const result: BatchImportResult = { 
    success: [], 
    errors: [] 
  };
  
  // Process users one by one to avoid overwhelming the auth system
  for (let i = 0; i < usersData.length; i++) {
    try {
      const userData = usersData[i];
      
      // Create user with auth account (all users now have auth accounts)
      const { address, ...userDataForAuth } = userData;
      const createdUser = await createUser(userDataForAuth as CreateUserData & { password: string });
      
      // Update with address if provided
      if (address) {
        await supabase
          .from('users')
          .update({ address })
          .eq('id', createdUser.id);
      }
      
      result.success.push(createdUser);
    } catch (error: any) {
      result.errors.push({ 
        index: i, 
        error: error.message || 'User creation failed', 
        data: usersData[i] 
      });
    }
  }
  
  return result;
}

/**
 * Import users from CSV data
 */
export async function importUsersFromCSV(csvData: CSVRow[]): Promise<ImportResult> {
  const importResult: ImportResult = { success: 0, errors: [] };
  const validUsersData: (CreateUserData & { password: string; address?: string })[] = [];

  // First pass: validate all rows and collect valid users
  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    
    // Validate row
    const validationError = validateCSVRow(row, i);
    if (validationError) {
      importResult.errors.push({ row: i + 1, error: validationError, data: row });
      continue;
    }

    try {
      const userData = convertCSVRowToUserData(row);
      validUsersData.push(userData);
    } catch (error: any) {
      importResult.errors.push({ 
        row: i + 1, 
        error: error.message || 'Data conversion error', 
        data: row 
      });
    }
  }

  // Second pass: batch create all valid users
  if (validUsersData.length > 0) {
    try {
      const batchResult = await batchCreateUsers(validUsersData);
      importResult.success = batchResult.success.length;
      
      // Add any batch creation errors to the import result
      batchResult.errors.forEach(batchError => {
        importResult.errors.push({
          row: batchError.index + 1,
          error: batchError.error,
          data: batchError.data
        });
      });
    } catch (error: any) {
      // If batch creation fails completely, mark all valid users as errors
      validUsersData.forEach((userData, index) => {
        importResult.errors.push({
          row: index + 1,
          error: error.message || 'Batch creation failed',
          data: userData
        });
      });
    }
  }

  return importResult;
} 