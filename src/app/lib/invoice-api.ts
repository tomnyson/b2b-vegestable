import { supabase } from './supabase';

export interface Invoice {
  id: string;
  user_id: string;
  path: string;
  notes: string | null;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  user: {
    name: string;
    email: string;
  };
}

export interface Customer {
  id: string;
  name: string;
  email: string;
}

export interface InvoiceFilters {
  searchTerm?: string;
  statusFilter?: Invoice['status'] | 'all';
  sortField?: 'created_at' | 'status' | 'user.name';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  itemsPerPage?: number;
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  totalCount: number;
  totalPages: number;
}

export interface CreateInvoiceData {
  user_id: string;
  notes: string;
  status: Invoice['status'];
  file: File;
}

export interface UpdateInvoiceData {
  user_id: string;
  notes: string;
  status: Invoice['status'];
}

/**
 * Fetch invoices with filtering, sorting, and pagination
 */
export async function getInvoices(filters: InvoiceFilters = {}): Promise<InvoiceListResponse> {
  const {
    searchTerm = '',
    statusFilter = 'all',
    sortField = 'created_at',
    sortDirection = 'desc',
    page = 1,
    itemsPerPage = 10
  } = filters;

  try {
    // Build the query
    let query = supabase
      .from('invoices')
      .select('*', { count: 'exact' });

    // Apply search filter if searchTerm exists
    if (searchTerm) {
      query = query.or(`user.name.ilike.%${searchTerm}%,user.email.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    // Apply sorting
    if (sortField === 'user.name') {
      query = query.order('user.name', { ascending: sortDirection === 'asc' });
    } else {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }

    // Apply pagination
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    query = query.range(from, to);

    const { data: invoicesData, error: invoicesError, count } = await query;

    if (invoicesError) throw invoicesError;

    if (!invoicesData || invoicesData.length === 0) {
      return {
        invoices: [],
        totalCount: 0,
        totalPages: 1
      };
    }

    // Get unique user IDs
    const userIds = Array.from(new Set(invoicesData.map(invoice => invoice.user_id)));

    // Fetch user data for all user IDs
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', userIds);

    if (usersError) throw usersError;

    // Create a map of user data for quick lookup
    const usersMap = new Map(usersData?.map(user => [user.id, user]) || []);

    // Combine invoices with user data
    const invoicesWithUsers = invoicesData.map(invoice => ({
      ...invoice,
      user: usersMap.get(invoice.user_id) || {
        name: 'Unknown User',
        email: 'unknown@example.com'
      }
    }));

    return {
      invoices: invoicesWithUsers,
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / itemsPerPage)
    };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw new Error('Failed to fetch invoices');
  }
}

/**
 * Fetch all customers (users with customer role)
 */
export async function getCustomers(): Promise<Customer[]> {
  try {
    const { data: customers, error } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'customer')
      .order('name');

    if (error) throw error;
    return customers || [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw new Error('Failed to fetch customers');
  }
}

/**
 * Create a new invoice
 */
export async function createInvoice(invoiceData: CreateInvoiceData): Promise<Invoice> {
  try {
    const { user_id, notes, status, file } = invoiceData;

    // Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Create invoice record
    const { data: createdInvoice, error: dbError } = await supabase
      .from('invoices')
      .insert([{
        user_id,
        path: filePath,
        notes,
        status
      }])
      .select('*')
      .single();

    if (dbError) throw dbError;

    // Fetch user data for the created invoice
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', user_id)
      .single();

    if (userError) throw userError;

    return {
      ...createdInvoice,
      user: userData || { name: 'Unknown User', email: 'unknown@example.com' }
    };
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw new Error('Failed to create invoice');
  }
}

/**
 * Update an existing invoice
 */
export async function updateInvoice(invoiceId: string, updateData: UpdateInvoiceData): Promise<Invoice> {
  try {
    const { user_id, notes, status } = updateData;

    const { data: invoiceData, error: updateError } = await supabase
      .from('invoices')
      .update({
        user_id,
        notes,
        status
      })
      .eq('id', invoiceId)
      .select('*')
      .single();

    if (updateError) throw updateError;

    // Fetch user data for the updated invoice
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', user_id)
      .single();

    if (userError) throw userError;

    return {
      ...invoiceData,
      user: userData || { name: 'Unknown User', email: 'unknown@example.com' }
    };
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw new Error('Failed to update invoice');
  }
}

/**
 * Delete an invoice
 */
export async function deleteInvoice(invoiceId: string): Promise<void> {
  try {
    // First get the invoice to get the file path
    const { data: invoice, error: getError } = await supabase
      .from('invoices')
      .select('path')
      .eq('id', invoiceId)
      .single();

    if (getError) throw getError;

    // Delete the file from storage
    if (invoice?.path) {
      const { error: storageError } = await supabase.storage
        .from('products')
        .remove([invoice.path]);

      if (storageError) throw storageError;
    }

    // Delete the invoice record
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (deleteError) throw deleteError;
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw new Error('Failed to delete invoice');
  }
}

/**
 * Download an invoice file
 */
export async function downloadInvoice(path: string, fileName: string): Promise<void> {
  try {
    const { data, error } = await supabase.storage
      .from('products')
      .download(path);

    if (error) throw error;

    // Create blob URL and trigger download
    const blob = new Blob([data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error('Failed to download invoice');
  }
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(invoiceId: string): Promise<Invoice> {
  try {
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError) throw invoiceError;

    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', invoiceData.user_id)
      .single();

    if (userError) throw userError;

    return {
      ...invoiceData,
      user: userData || { name: 'Unknown User', email: 'unknown@example.com' }
    };
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw new Error('Failed to fetch invoice');
  }
} 