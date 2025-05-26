import { supabase } from './supabase';
import { User } from './types';

export type Driver = User;
export type CreateDriverData = Omit<User, 'id' | 'status'> & { license_number?: string; vehicle_type?: string; };
export type UpdateDriverData = Partial<Omit<User, 'id'>> & { license_number?: string; vehicle_type?: string; };

/**
 * Get all drivers
 */
export async function getDrivers(): Promise<Driver[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'driver')
      .eq('status', 'active')
      .order('name');
      
    if (error) throw error;
    return data as Driver[];
  } catch (err) {
    console.error('Error fetching drivers:', err);
    throw err;
  }
}

/**
 * Get a single driver by ID
 */
export async function getDriverById(id: string): Promise<Driver | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('role', 'driver')
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return data as Driver;
  } catch (err) {
    console.error(`Error fetching driver ${id}:`, err);
    throw err;
  }
}

/**
 * Get drivers by assigned route
 */
export async function getDriversByRoute(route: string): Promise<Driver[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'driver')
      .eq('assigned_route', route)
      .eq('status', 'active')
      .order('name');
      
    if (error) throw error;
    return data as Driver[];
  } catch (err) {
    console.error(`Error fetching drivers for route ${route}:`, err);
    throw err;
  }
}

/**
 * Create a new driver
 */
export async function createDriver(driverData: CreateDriverData): Promise<Driver> {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        ...driverData,
        role: 'driver',
        status: 'active'
      })
      .select()
      .single();
      
    if (error) throw error;
    return data as Driver;
  } catch (err) {
    console.error('Error creating driver:', err);
    throw err;
  }
}

/**
 * Update a driver
 */
export async function updateDriver(id: string, driverData: UpdateDriverData): Promise<Driver> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(driverData)
      .eq('id', id)
      .eq('role', 'driver')
      .select()
      .single();
      
    if (error) throw error;
    return data as Driver;
  } catch (err) {
    console.error(`Error updating driver ${id}:`, err);
    throw err;
  }
}

/**
 * Delete a driver
 */
export async function deleteDriver(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .eq('role', 'driver');
      
    if (error) throw error;
    return true;
  } catch (err) {
    console.error(`Error deleting driver ${id}:`, err);
    throw err;
  }
}

/**
 * Deactivate a driver instead of deleting
 */
export async function deactivateDriver(id: string): Promise<Driver> {
  return updateDriver(id, { status: 'inactive' });
}

/**
 * Assign route to driver
 */
export async function assignRouteToDriver(id: string, route: string): Promise<Driver> {
  return updateDriver(id, { assigned_route: route });
}

/**
 * Find available drivers (active drivers who are not assigned to a route)
 */
export async function findAvailableDrivers(): Promise<Driver[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'driver')
      .eq('status', 'active')
      .is('assigned_route', null)
      .order('name');
      
    if (error) throw error;
    return data as Driver[];
  } catch (err) {
    console.error('Error finding available drivers:', err);
    throw err;
  }
} 