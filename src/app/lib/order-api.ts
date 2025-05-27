import { supabase } from './supabase';
import { Product, batchDecreaseStock, restoreStockFromOrder } from './product-api';
import { PostgrestError } from '@supabase/supabase-js';
import { getAppSettings } from './settings-api';
import { getUser } from './auth';
import { getUserById } from './users-api';

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: Product;
}

export interface Order {
  id?: string;
  user_id?: string;
  delivery_address?: string;
  order_date: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  notes?: string;
  items: OrderItem[];
  created_at?: string;
  updated_at?: string;
  assigned_driver_id?: string;
  customer?: {
    id: string;
    email?: string;
    name?: string;
    phone?: string;
    profile_image?: string;
    address?: string;
  };
}

export type CreateOrderData = Omit<Order, 'id' | 'created_at' | 'updated_at'>;
export type UpdateOrderData = Partial<Omit<Order, 'id' | 'created_at' | 'updated_at'>>;

export interface OrderQueryParams {
  status?: Order['status'];
  payment_status?: Order['payment_status'];
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
  sortBy?: keyof Order;
  sortDirection?: 'asc' | 'desc';
  search?: string;
}

/**
 * Create a new order in the database
 */
export async function createOrder(orderData: CreateOrderData): Promise<Order> {
  try {
    // First, check stock availability for all items
    const stockItems = orderData.items.map(item => ({
      productId: item.product_id,
      quantity: item.quantity
    }));
    
    // Decrease stock for all items (this will throw an error if insufficient stock)
    await batchDecreaseStock(stockItems);
    
    // If stock decrease successful, proceed with order creation
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: orderData.user_id,
        delivery_address: orderData.delivery_address,
        order_date: new Date().toISOString(),
        total_amount: orderData.total_amount,
        status: orderData.status || 'pending',
        payment_status: orderData.payment_status || 'pending',
        notes: orderData.notes
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      // If order creation fails, restore the stock
      await restoreStockFromOrder(orderData.items);
      throw orderError;
    }

    // Then, insert the order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error adding order items:', itemsError);
      // If order items creation fails, restore the stock and delete the order
      await restoreStockFromOrder(orderData.items);
      await supabase.from('orders').delete().eq('id', order.id);
      throw itemsError;
    }

    console.log(`Order ${order.id} created successfully with stock decreased for ${orderData.items.length} products`);

    // Return the created order with items
    return {
      ...order,
      items: orderData.items
    };
  } catch (err) {
    console.error('Create order failed:', err);
    throw err;
  }
}

/**
 * Get orders for a specific user
 */
export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    // First, get the orders with user information
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        customer:users!user_id(
          id,
          email,
          name,
          phone,
          address
        )
      `)
      .eq('user_id', userId)
      .order('order_date', { ascending: false });

    if (ordersError) {
      console.error('Error fetching user orders:', ordersError);
      throw ordersError;
    }

    // For each order, get the order items
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('*, product:product_id(*)')
          .eq('order_id', order.id);

        if (itemsError) {
          console.error(`Error fetching order items for order ${order.id}:`, itemsError);
          throw itemsError;
        }

        return {
          ...order,
          items: items as OrderItem[]
        };
      })
    );

    return ordersWithItems;
  } catch (err) {
    console.error('Get user orders failed:', err);
    throw err;
  }
}

/**
 * Create a guest order (no user account)
 */
export async function createGuestOrder(orderData: Omit<CreateOrderData, 'user_id'>): Promise<Order> {
  return createOrder({
    ...orderData,
    user_id: undefined
  });
}

/**
 * Get order details including items with product information
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    // Get the order with user information
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        customer:users!user_id(
          id,
          email,
          name,
          phone,
          address
        )
      `)
      .eq('id', orderId)
      .single();
    
    if (orderError) {
      if (orderError.code === 'PGRST116') {  // Not found
        return null;
      }
      console.error(`Error fetching order ${orderId}:`, orderError);
      throw orderError;
    }
    
    // Get order items with product details
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        product:products(*)
      `)
      .eq('order_id', orderId);
    
    if (itemsError) {
      console.error(`Error fetching order items for ${orderId}:`, itemsError);
      throw itemsError;
    }
    
    return {
      ...order,
      items: items as OrderItem[]
    };
  } catch (err) {
    console.error(`Get order by ID failed for ${orderId}:`, err);
    throw err;
  }
}

/**
 * Get all orders with pagination and filtering options
 */
export async function getAllOrders(params: OrderQueryParams = {}) {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        customer:users!user_id(
          id,
          email,
          name,
          phone,
          address
        )
      `, { count: 'exact' });
    
    // Apply filters
    if (params.status) {
      query = query.eq('status', params.status);
    }
    
    if (params.payment_status) {
      query = query.eq('payment_status', params.payment_status);
    }
    
    if (params.fromDate) {
      query = query.gte('order_date', params.fromDate);
    }
    
    if (params.toDate) {
      query = query.lte('order_date', params.toDate);
    }
    
    // Apply search if provided
    if (params.search) {
      const keyword = params.search.toLowerCase();
      
      // First, find matching customer IDs
      const { data: matchingUsers } = await supabase
        .from('users')
        .select('id')
        .or(`email.ilike.*${keyword}*,name.ilike.*${keyword}*,phone.ilike.*${keyword}*`);
      
      const matchingUserIds = matchingUsers?.map(user => user.id) || [];
      
      // Build search conditions
      let searchConditions = [
        `id.ilike.*${keyword}*`,
        `delivery_address.ilike.*${keyword}*`,
        `notes.ilike.*${keyword}*`
      ];
      
      // Add user_id filter if we found matching customers
      if (matchingUserIds.length > 0) {
        searchConditions.push(`user_id.in.(${matchingUserIds.join(',')})`);
      }
      
      // Apply the combined search filter
      query = query.or(searchConditions.join(','));
    }
    
    // Apply sorting
    const sortField = params.sortBy || 'order_date';
    const sortDir = params.sortDirection || 'desc';
    query = query.order(sortField, { ascending: sortDir === 'asc' });
    
    // Apply pagination
    if (params.limit !== undefined && params.offset !== undefined) {
      query = query.range(params.offset, params.offset + params.limit - 1);
    }
    
    // Execute query
    const { data: orders, error, count } = await query;
    
    if (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
    
    // Get items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        try {
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);
          
          return {
            ...order,
            items: items || []
          };
        } catch (err) {
          console.error(`Error fetching items for order ${order.id}:`, err);
          return {
            ...order,
            items: []
          };
        }
      })
    );
    
    return { 
      orders: ordersWithItems, 
      count: count || 0,
      limit: params.limit,
      offset: params.offset
    };
  } catch (err) {
    console.error('Get all orders failed:', err);
    throw err;
  }
}

/**
 * Update order status with email notifications
 */
export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<Order> {
  try {
    // Get current order details before update
    const currentOrder = await getOrderById(orderId);
    
    if (!currentOrder) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    // If changing status to cancelled, restore stock
    if (status === 'cancelled' && currentOrder.status !== 'cancelled') {
      try {
        await restoreStockFromOrder(currentOrder.items);
        console.log(`Stock restored for cancelled order ${orderId}`);
      } catch (stockError) {
        console.error(`Failed to restore stock for cancelled order ${orderId}:`, stockError);
        // Don't fail the status update if stock restoration fails, but log the error
      }
    }
    
    // Update the order status
    const updatedOrder = await updateOrder(orderId, { status });
    
    // Send email notifications if order is completed
    if (status === 'completed' && currentOrder?.assigned_driver_id) {
      try {
        // Get order details with items and customer info
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            items:order_items(*),
            customer:user_id(id, email, name, phone)
          `)
          .eq('id', orderId)
          .single();
        
        if (!orderError && order) {
          // Get driver details
          const driver = await getUserById(currentOrder.assigned_driver_id);
          
          // Get admin users
          const { data: admins, error: adminError } = await supabase
            .from('users')
            .select('id, email, name')
            .eq('role', 'admin')
            .eq('status', 'active');

          // Get app settings
          const appSettings = await getAppSettings();
          
          if (driver) {
            const emailPromises: Promise<Response>[] = [];

            // Send email to customer if we have customer email
            const customerEmail = order.customer?.email;

            if (customerEmail) {
              emailPromises.push(
                fetch('/api/send-email', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    type: 'order_completion_customer',
                    orderId,
                    to: customerEmail,
                    orderData: order,
                    driverData: driver,
                    appSettings: {
                      companyName: appSettings?.company_name || 'B2B Vegetable',
                      logoUrl: appSettings?.logo_url || '',
                      supportEmail: appSettings?.support_email || '',
                      supportPhone: appSettings?.support_phone || '',
                      currency: appSettings?.default_currency || 'USD'
                    }
                  })
                })
              );
            }

            // Send emails to all active admins
            if (admins && admins.length > 0) {
              for (const admin of admins) {
                emailPromises.push(
                  fetch('/api/send-email', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      type: 'order_completion_admin',
                      orderId,
                      to: admin.email,
                      orderData: order,
                      driverData: driver,
                      adminData: admin,
                      appSettings: {
                        companyName: appSettings?.company_name || 'B2B Vegetable',
                        logoUrl: appSettings?.logo_url || '',
                        supportEmail: appSettings?.support_email || '',
                        supportPhone: appSettings?.support_phone || '',
                        currency: appSettings?.default_currency || 'USD'
                      }
                    })
                  })
                );
              }
            }

            // Wait for all emails to be sent
            const results = await Promise.allSettled(emailPromises);
            
            // Check results and log
            const failedCount = results.filter(result => result.status === 'rejected').length;
            const successCount = results.length - failedCount;
            
            if (failedCount === 0) {
              console.log(`All order completion emails sent successfully for order ${orderId}`);
            } else {
              console.warn(`${successCount} emails sent, ${failedCount} failed for order ${orderId}`);
            }
          }
        }
      } catch (emailError) {
        console.error(`Failed to send completion emails for order ${orderId}:`, emailError);
        // Don't fail the status update if email fails
      }
    }
    
    return updatedOrder;
  } catch (err) {
    console.error(`Update order status failed for ${orderId}:`, err);
    throw err;
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: Order['payment_status']
): Promise<Order> {
  return updateOrder(orderId, { payment_status: paymentStatus });
}

/**
 * Assign driver to order with email notification
 */
export async function assignDriverToOrder(
  orderId: string,
  driverId: string
): Promise<Order> {
  try {
    // Get current user (admin) for email notification
    let adminId: string | undefined;
    try {
      const currentUser = await getUser();
      adminId = currentUser?.id;
    } catch (err) {
      console.warn('Could not get current user for driver assignment email:', err);
    }
    
    // Update the order with assigned driver
    const updatedOrder = await updateOrder(orderId, { assigned_driver_id: driverId });
    
    // Send email notification to driver by calling /api/send-email directly
    try {
      // Get order details with items and customer info
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*),
          customer:user_id(id, email, name, phone)
        `)
        .eq('id', orderId)
        .single();
      
      if (!orderError && order) {
        // Get driver details
        const driver = await getUserById(driverId);
        
        // Get admin details if available
        let admin = null;
        if (adminId) {
          try {
            admin = await getUserById(adminId);
          } catch (err) {
            console.warn('Could not fetch admin details:', err);
          }
        }
        
        // Get app settings
        const appSettings = await getAppSettings();
        
        if (driver) {
          // Call /api/send-email directly
          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'driver_assignment',
              orderId,
              to: driver.email,
              orderData: order,
              driverData: driver,
              adminData: admin,
              appSettings: {
                companyName: appSettings?.company_name || 'B2B Vegetable',
                logoUrl: appSettings?.logo_url || '',
                supportEmail: appSettings?.support_email || '',
                supportPhone: appSettings?.support_phone || '',
                currency: appSettings?.default_currency || 'USD'
              }
            })
          });
          
          const result = await response.json();
          
          if (response.ok) {
            console.log(`Driver assignment email sent for order ${orderId} to driver ${driverId}`);
          } else {
            console.error(`Failed to send driver assignment email for order ${orderId}:`, result.message);
          }
        }
      }
    } catch (emailError) {
      console.error(`Failed to send driver assignment email for order ${orderId}:`, emailError);
      // Don't fail the assignment if email fails
    }
    
    return updatedOrder;
  } catch (err) {
    console.error(`Assign driver to order failed for ${orderId}:`, err);
    throw err;
  }
}

/**
 * Update order details
 */
export async function updateOrder(
  orderId: string,
  orderData: UpdateOrderData
): Promise<Order> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        ...orderData,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating order ${orderId}:`, error);
      throw error;
    }
    
    // Get the updated order with items
    const order = await getOrderById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found after update`);
    }
    
    return order;
  } catch (err) {
    console.error(`Update order failed for ${orderId}:`, err);
    throw err;
  }
}

/**
 * Delete an order (for admin use only)
 */
export async function deleteOrder(orderId: string): Promise<boolean> {
  try {
    // First delete order items
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);
    
    if (itemsError) {
      console.error(`Error deleting items for order ${orderId}:`, itemsError);
      throw itemsError;
    }
    
    // Then delete the order
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);
    
    if (error) {
      console.error(`Error deleting order ${orderId}:`, error);
      throw error;
    }
    
    return true;
  } catch (err) {
    console.error(`Delete order failed for ${orderId}:`, err);
    throw err;
  }
}

/**
 * Get orders assigned to a specific driver
 */
export async function getDriverOrders(driverId: string): Promise<Order[]> {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:users!user_id(
          id,
          email,
          name,
          phone,
          address
        )
      `)
      .eq('assigned_driver_id', driverId)
      .order('order_date', { ascending: false });
    
    if (error) {
      console.error(`Error fetching driver orders for ${driverId}:`, error);
      throw error;
    }
    
    // Get items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            *,
            product:products(*)
          `)
          .eq('order_id', order.id);
        
        if (itemsError) {
          console.error(`Error fetching items for driver order ${order.id}:`, itemsError);
          throw itemsError;
        }
        
        return {
          ...order,
          items: items || []
        };
      })
    );
    
    return ordersWithItems;
  } catch (err) {
    console.error(`Get driver orders failed for ${driverId}:`, err);
    throw err;
  }
}

/**
 * Cancel an order
 * @param orderId - The ID of the order to cancel
 * @param reason - The reason for cancellation
 * @returns The updated order
 */
export async function cancelOrder(orderId: string, reason: string): Promise<Order> {
  try {
    // First get the current order to check if it's already cancelled
    const currentOrder = await getOrderById(orderId);
    
    if (!currentOrder) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    // If already cancelled, don't restore stock again
    if (currentOrder.status === 'cancelled') {
      console.log(`Order ${orderId} is already cancelled`);
      return currentOrder;
    }
    
    // Restore stock for all items in the order
    try {
      await restoreStockFromOrder(currentOrder.items);
      console.log(`Stock restored for cancelled order ${orderId}`);
    } catch (stockError) {
      console.error(`Failed to restore stock for cancelled order ${orderId}:`, stockError);
      // Don't fail the cancellation if stock restoration fails, but log the error
    }
    
    // Update the order status
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled by customer',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
    
    // Get order items with product details to return the complete order
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        product:products(*)
      `)
      .eq('order_id', orderId);
    
    if (itemsError) {
      console.error(`Error fetching order items for ${orderId}:`, itemsError);
      throw itemsError;
    }
    
    return {
      ...order,
      items: items as OrderItem[]
    };
  } catch (err) {
    console.error(`Cancel order failed for ${orderId}:`, err);
    throw err;
  }
}

/**
 * Generate an invoice for an order
 * @param orderId - The ID of the order to generate an invoice for
 * @returns A URL to download the invoice
 */
export async function generateInvoice(orderId: string): Promise<string> {
  try {
    // Get the complete order details
    const order = await getOrderById(orderId);
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    // Get app settings for invoice branding and VAT
    const appSettings = await getAppSettings();
    
    // In a real app, you would generate a PDF invoice here
    // including the following information from app settings:
    // - Company logo (appSettings.logo_url)
    // - Company name (appSettings.company_name)
    // - VAT percentage (appSettings.vat_percentage)
    // - Currency (appSettings.default_currency)
    // - Support contact (appSettings.support_email, appSettings.support_phone)
    
    // Calculate VAT if applicable
    let totalAmount = order.total_amount;
    let vatAmount = 0;
    
    if (appSettings?.vat_percentage) {
      vatAmount = (order.total_amount * appSettings.vat_percentage) / 100;
      totalAmount += vatAmount;
    }
    
    // Log invoice generation with settings used
    console.log(`Invoice generated for order ${orderId} with settings:`, {
      companyName: appSettings?.company_name || 'Default Company',
      currency: appSettings?.default_currency || 'USD',
      vatPercentage: appSettings?.vat_percentage || 0,
      vatAmount,
      totalAmount,
      orderDate: order.order_date,
      customerEmail: order.customer?.email
    });
    
    // You could call a serverless function or external API to generate the PDF
    // Then return a URL to download it
    
    // Simulate an API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return a fake download URL (in a real app, this would be a real URL)
    return `/api/invoices/${orderId}`;
  } catch (err) {
    console.error(`Generate invoice failed for ${orderId}:`, err);
    throw err;
  }
} 