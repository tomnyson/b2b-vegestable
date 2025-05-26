export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'customer' | 'driver';
  status: 'active' | 'inactive';
  assigned_route?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
  image_url?: string;
  category: string;
  inventory_count: number;
  status: 'active' | 'inactive';
}

export interface Order {
  id: number;
  customer_id: number;
  driver_id?: number;
  status: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled';
  created_at: string;
  delivery_date: string;
  delivery_address: string;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'failed';
  notes?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface OrderWithDetails extends Order {
  items: (OrderItem & { product: Product })[];
  customer: User;
  driver?: User;
} 

export interface ProductFormData {
  name: string;
  name_vi?: string;
  name_tr?: string;
  description?: string;
  price: number;
  unit: string;
  sku: string;
  image?: File | null;
  image_url?: string;
  category?: string;
  is_active: boolean;
  stock?: number;
} 