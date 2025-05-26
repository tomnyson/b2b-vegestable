import { Product, ProductFormData } from './types';

// Base API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Helper function for making API requests
 */
async function fetchAPI<T>(
  endpoint: string, 
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'An error occurred');
  }

  return response.json();
}

/**
 * Product API Functions
 */

// Get all products with optional filters
export async function getProducts(
  filters?: {
    category?: string;
    is_active?: boolean;
    search?: string;
    sort?: string;
  }
): Promise<{ products: Product[], count: number }> {
  // Build query string from filters
  const queryParams = new URLSearchParams();
  
  if (filters?.category) {
    queryParams.append('category', filters.category);
  }
  
  if (filters?.is_active !== undefined) {
    queryParams.append('is_active', String(filters.is_active));
  }
  
  if (filters?.search) {
    queryParams.append('search', filters.search);
  }
  
  if (filters?.sort) {
    queryParams.append('sort', filters.sort);
  }
  
  const queryString = queryParams.toString();
  const endpoint = `/api/products${queryString ? `?${queryString}` : ''}`;
  
  return fetchAPI<{ success: true, products: Product[], count: number }>(endpoint)
    .then(res => ({ products: res.products, count: res.count }));
}

// Get a single product by ID
export async function getProduct(id: string): Promise<Product> {
  return fetchAPI<{ success: true, product: Product }>(`/api/products/${id}`)
    .then(res => res.product);
}

// Create a new product
export async function createProduct(productData: ProductFormData): Promise<Product> {
  return fetchAPI<{ success: true, product: Product }>('/api/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  }).then(res => res.product);
}

// Update an existing product
export async function updateProduct(id: string, updates: Partial<ProductFormData>): Promise<Product> {
  return fetchAPI<{ success: true, product: Product }>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }).then(res => res.product);
}

// Delete a product
export async function deleteProduct(id: string): Promise<void> {
  return fetchAPI<{ success: true }>(`/api/products/${id}`, {
    method: 'DELETE',
  }).then(() => undefined);
}

// Upload product image
export async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch(`${API_URL}/api/products/upload-image`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error uploading image');
  }
  
  const data = await response.json();
  return data.url;
} 