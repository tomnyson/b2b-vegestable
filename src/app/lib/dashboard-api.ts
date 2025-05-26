import { supabase } from './supabase';
import { Order } from './order-api';
import { Product } from './product-api';

// Get count of orders by status
export async function getOrderCountsByStatus(): Promise<{ status: string; count: number }[]> {
  try {
    // Try to use the count_orders_by_status function if it exists
    const { data, error } = await supabase.rpc('count_orders_by_status');
    
    if (error) {
      console.error('Error calling count_orders_by_status:', error);
      
      // Fall back to manual counting if the function doesn't exist
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('status');
      
      if (ordersError) throw ordersError;
      
      // Count manually
      const statusCounts: Record<string, number> = {};
      orders.forEach(order => {
        const status = order.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      return Object.entries(statusCounts).map(([status, count]) => ({ 
        status, 
        count: count as number 
      }));
    }
    
    return data || [];
  } catch (err) {
    console.error('Failed to fetch order counts:', err);
    throw err;
  }
}

// Get orders history grouped by date (for time-series chart)
export async function getOrdersHistory(
  days: number = 30
): Promise<{ date: string; count: number; total: number }[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('orders')
      .select('order_date, total_amount')
      .gte('order_date', startDate.toISOString());
    
    if (error) {
      console.error('Error fetching orders history:', error);
      throw error;
    }
    
    // Group orders by date and calculate totals
    const groupedByDate = (data || []).reduce<Record<string, { count: number; total: number }>>(
      (acc, order) => {
        const dateStr = new Date(order.order_date).toISOString().split('T')[0];
        
        if (!acc[dateStr]) {
          acc[dateStr] = { count: 0, total: 0 };
        }
        
        acc[dateStr].count += 1;
        acc[dateStr].total += order.total_amount || 0;
        
        return acc;
      },
      {}
    );
    
    // Convert to array and fill in missing dates
    const result = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      result.push({
        date: dateStr,
        count: groupedByDate[dateStr]?.count || 0,
        total: groupedByDate[dateStr]?.total || 0,
      });
    }
    
    return result;
  } catch (err) {
    console.error('Failed to fetch orders history:', err);
    throw err;
  }
}

// Get top selling products
export async function getTopSellingProducts(
  limit: number = 5
): Promise<{ product_id: string; product_name: string; total_quantity: number }[]> {
  try {
    // Try to use the get_top_selling_products function if it exists
    const { data, error } = await supabase.rpc('get_top_selling_products', { limit_count: limit });
    
    if (error) {
      console.error('Error calling get_top_selling_products:', error);
      
      // Fall back to manual aggregation if the function doesn't exist
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity
        `)
        .limit(100); // Limit for performance
      
      if (itemsError) throw itemsError;
      
      // Get product data for names
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name_en');
      
      if (productsError) throw productsError;
      
      // Convert to map for easy lookup
      const productMap = new Map();
      products.forEach(product => {
        productMap.set(product.id, product.name_en);
      });

      // Aggregate by product
      const productSales = new Map<string, { product_id: string; product_name: string; total_quantity: number }>();
      
      orderItems.forEach(item => {
        const id = item.product_id;
        const name = productMap.get(id) || `Product ${id}`;
        const quantity = item.quantity || 0;
        
        if (!productSales.has(id)) {
          productSales.set(id, { product_id: id, product_name: name, total_quantity: 0 });
        }
        
        const product = productSales.get(id)!;
        product.total_quantity += quantity;
      });
      
      return Array.from(productSales.values())
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, limit);
    }
    
    return data || [];
  } catch (err) {
    console.error('Failed to fetch top selling products:', err);
    throw err;
  }
}

// Get summary statistics for the dashboard
export async function getDashboardSummary(): Promise<{
  total_orders: number;
  total_revenue: number;
  total_customers: number;
  total_products: number;
}> {
  try {
    // Get total orders and revenue
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('id, total_amount')
      .match({ status: 'completed' });
    
    if (orderError) throw orderError;
    
    // Get total customers
    const { count: customerCount, error: customerError } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
      .match({ role: 'customer' });
    
    if (customerError) throw customerError;
    
    // Get total products
    const { count: productCount, error: productError } = await supabase
      .from('products')
      .select('id', { count: 'exact' });
    
    if (productError) throw productError;
    
    // Calculate revenue from completed orders
    const totalRevenue = orderData.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    
    return {
      total_orders: orderData.length,
      total_revenue: totalRevenue,
      total_customers: customerCount || 0,
      total_products: productCount || 0,
    };
  } catch (err) {
    console.error('Failed to fetch dashboard summary:', err);
    throw err;
  }
}

// Get today's orders with timezone support
export async function getTodaysOrders(timezone: string = 'UTC'): Promise<{
  hour: number;
  count: number;
  revenue: number;
}[]> {
  try {
    // Get today's date in the specified timezone
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    // Fetch today's orders
    const { data, error } = await supabase
      .from('orders')
      .select('created_at, total_amount')
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());
    
    if (error) {
      console.error('Error fetching today\'s orders:', error);
      throw error;
    }

    // Group by hour
    const hourlyData: Record<number, { count: number; revenue: number }> = {};
    
    // Initialize all hours with zero values
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { count: 0, revenue: 0 };
    }
    
    // Group orders by hour
    (data || []).forEach(order => {
      const orderDate = new Date(order.created_at);
      // Adjust for timezone
      const userTime = new Date(orderDate.toLocaleString('en-US', { timeZone: timezone }));
      const hour = userTime.getHours();
      
      hourlyData[hour].count += 1;
      hourlyData[hour].revenue += order.total_amount || 0;
    });
    
    // Convert to array format
    return Object.entries(hourlyData).map(([hour, data]) => ({
      hour: parseInt(hour),
      count: data.count,
      revenue: data.revenue
    })).sort((a, b) => a.hour - b.hour);
  } catch (err) {
    console.error('Failed to fetch today\'s orders:', err);
    throw err;
  }
} 