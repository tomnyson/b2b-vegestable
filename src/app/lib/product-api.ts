import { supabase } from './supabase';
import { uploadImage } from './storage-utils';

export interface Product {
  id: string;
  name_en: string;
  name_vi?: string;
  name_tr?: string;
  description?: string;
  price: number;
  unit: string;
  sku: string;
  image_url?: string;
  // category?: string; // Removed - column doesn't exist in database
  is_active: boolean;
  stock: number;
  created_at?: string;
  updated_at?: string;
}

export type CreateProductData = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
export type UpdateProductData = Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>;

/**
 * Fetch all products from the database
 */
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
  
  return data as Product[];
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
  
  return data as Product;
}

/**
 * Create a new product
 * @param productData The product data
 * @param imageFile Optional image file to upload
 */
export async function createProduct(
  productData: CreateProductData,
  imageFile?: File | null
): Promise<Product> {
  try {
    let image_url = productData.image_url;
    
    // Upload image if provided
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile, 'products');
      if (uploadedUrl) {
        image_url = uploadedUrl;
      }
    }
    
    const { data, error } = await supabase
      .from('products')
      .insert([{ ...productData, image_url }])
      .select();

    if (error) {
      console.error('Error creating product:', error);
      throw error;
    }

    return data?.[0] as Product;
  } catch (err) {
    console.error('Create product failed:', err);
    throw err;
  }
}

/**
 * Update an existing product
 * @param id Product ID
 * @param productData Updated product data
 * @param imageFile Optional new image file
 */
export async function updateProduct(
  id: string, 
  productData: UpdateProductData,
  imageFile?: File | null
): Promise<Product> {
  try {
    let updatedData = { ...productData };
    
    // Upload new image if provided
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile, 'products');
      if (uploadedUrl) {
        updatedData.image_url = uploadedUrl;
      }
    }
    
    const { data, error } = await supabase
      .from('products')
      .update(updatedData)
      .eq('id', id)
      .select();

    if (error) {
      console.error(`Error updating product ${id}:`, error);
      throw error;
    }
    
    return data?.[0] as Product;
  } catch (err) {
    console.error(`Update product failed for ${id}:`, err);
    throw err;
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
  
  return true;
}

/**
 * Toggle a product's active status
 */
export async function toggleProductStatus(id: string, currentStatus: boolean): Promise<Product> {
  return updateProduct(id, { is_active: !currentStatus });
}

/**
 * Batch create multiple products (for CSV import)
 * @param productsData Array of product data to create
 */
export async function batchCreateProducts(
  productsData: CreateProductData[]
): Promise<{ success: Product[]; errors: Array<{ index: number; error: string; data: CreateProductData }> }> {
  const result = { 
    success: [] as Product[], 
    errors: [] as Array<{ index: number; error: string; data: CreateProductData }> 
  };
  
  // Process products in batches of 10 to avoid overwhelming the database
  const batchSize = 10;
  for (let i = 0; i < productsData.length; i += batchSize) {
    const batch = productsData.slice(i, i + batchSize);
    
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(batch)
        .select();
      
      if (error) {
        // If batch insert fails, try individual inserts to identify specific errors
        for (let j = 0; j < batch.length; j++) {
          try {
            const { data: singleData, error: singleError } = await supabase
              .from('products')
              .insert([batch[j]])
              .select();
            
            if (singleError) {
              result.errors.push({ 
                index: i + j, 
                error: singleError.message, 
                data: batch[j] 
              });
            } else if (singleData?.[0]) {
              result.success.push(singleData[0] as Product);
            }
          } catch (singleErr: any) {
            result.errors.push({ 
              index: i + j, 
              error: singleErr.message || 'Unknown error', 
              data: batch[j] 
            });
          }
        }
      } else if (data) {
        result.success.push(...(data as Product[]));
      }
    } catch (batchErr: any) {
      // If batch processing fails entirely, mark all items in this batch as errors
      for (let j = 0; j < batch.length; j++) {
        result.errors.push({ 
          index: i + j, 
          error: batchErr.message || 'Batch processing failed', 
          data: batch[j] 
        });
      }
    }
  }
  
  return result;
}

/**
 * Get paginated products with optional filters
 */
export async function getPaginatedProducts(
  page: number, 
  pageSize: number, 
  sortField: keyof Product = 'name_en', 
  sortDirection: 'asc' | 'desc' = 'asc',
  filter?: string
  // categoryFilter?: string // Removed - category column doesn't exist in database
) {
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' });
  
  // Apply category filter if provided
  // if (categoryFilter) {
  //   query = query.eq('category', categoryFilter);
  // }
  
  // Apply search filter if provided
  if (filter) {
    query = query.or(`name_en.ilike.%${filter}%,name_vi.ilike.%${filter}%,name_tr.ilike.%${filter}%,sku.ilike.%${filter}%`);
  }
  
  // Apply sorting
  query = query.order(sortField, { ascending: sortDirection === 'asc' });
  
  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);
  
  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching paginated products:', error);
    throw error;
  }
  
  return { 
    products: data as Product[], 
    totalCount: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  };
}

/**
 * Update product stock quantity after an order is placed
 * @param productId Product ID
 * @param quantityPurchased Quantity purchased in the order
 */
export async function updateProductStock(productId: string, quantityPurchased: number): Promise<boolean> {
  try {
    // First get current product to check stock
    const product = await getProductById(productId);
    
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }
    
    // Calculate new stock
    const newStock = Math.max(0, product.stock - quantityPurchased);
    
    // Update the product with new stock
    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId);
    
    if (error) {
      console.error(`Error updating stock for product ${productId}:`, error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating stock for product ${productId}:`, error);
    throw error;
  }
}

/**
 * Decrease product stock (when order is placed/confirmed)
 * @param productId Product ID
 * @param quantity Quantity to decrease
 */
export async function decreaseProductStock(productId: string, quantity: number): Promise<boolean> {
  try {
    // Get current product to check stock
    const product = await getProductById(productId);
    
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }
    
    // Check if we have enough stock
    if (product.stock < quantity) {
      throw new Error(`Insufficient stock for product ${productId}. Available: ${product.stock}, Requested: ${quantity}`);
    }
    
    // Calculate new stock
    const newStock = product.stock - quantity;
    
    // Update the product with new stock
    const { error } = await supabase
      .from('products')
      .update({ 
        stock: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);
    
    if (error) {
      console.error(`Error decreasing stock for product ${productId}:`, error);
      throw error;
    }
    
    console.log(`Stock decreased for product ${productId}: ${product.stock} -> ${newStock} (decreased by ${quantity})`);
    return true;
  } catch (error) {
    console.error(`Error decreasing stock for product ${productId}:`, error);
    throw error;
  }
}

/**
 * Increase product stock (when order is cancelled)
 * @param productId Product ID
 * @param quantity Quantity to increase
 */
export async function increaseProductStock(productId: string, quantity: number): Promise<boolean> {
  try {
    // Get current product
    const product = await getProductById(productId);
    
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }
    
    // Calculate new stock
    const newStock = product.stock + quantity;
    
    // Update the product with new stock
    const { error } = await supabase
      .from('products')
      .update({ 
        stock: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);
    
    if (error) {
      console.error(`Error increasing stock for product ${productId}:`, error);
      throw error;
    }
    
    console.log(`Stock increased for product ${productId}: ${product.stock} -> ${newStock} (increased by ${quantity})`);
    return true;
  } catch (error) {
    console.error(`Error increasing stock for product ${productId}:`, error);
    throw error;
  }
}

/**
 * Batch decrease stock for multiple products (when order is placed)
 * @param items Array of {productId, quantity} objects
 */
export async function batchDecreaseStock(items: { productId: string; quantity: number }[]): Promise<boolean> {
  try {
    // Process each item sequentially to maintain data consistency
    for (const item of items) {
      await decreaseProductStock(item.productId, item.quantity);
    }
    
    console.log(`Batch stock decrease completed for ${items.length} products`);
    return true;
  } catch (error) {
    console.error('Error in batch stock decrease:', error);
    throw error;
  }
}

/**
 * Batch increase stock for multiple products (when order is cancelled)
 * @param items Array of {productId, quantity} objects
 */
export async function batchIncreaseStock(items: { productId: string; quantity: number }[]): Promise<boolean> {
  try {
    // Process each item sequentially to maintain data consistency
    for (const item of items) {
      await increaseProductStock(item.productId, item.quantity);
    }
    
    console.log(`Batch stock increase completed for ${items.length} products`);
    return true;
  } catch (error) {
    console.error('Error in batch stock increase:', error);
    throw error;
  }
}

/**
 * Restore stock from order items (when order is cancelled)
 * @param orderItems Array of order items with product_id and quantity
 */
export async function restoreStockFromOrder(orderItems: { product_id: string; quantity: number }[]): Promise<boolean> {
  try {
    const stockItems = orderItems.map(item => ({
      productId: item.product_id,
      quantity: item.quantity
    }));
    
    await batchIncreaseStock(stockItems);
    console.log(`Stock restored for ${orderItems.length} products from cancelled order`);
    return true;
  } catch (error) {
    console.error('Error restoring stock from order:', error);
    throw error;
  }
}

/**
 * Get popular products based on order history
 * Returns a list of product IDs that are frequently ordered
 */
export async function getPopularProductIds(limit: number = 10): Promise<string[]> {
  try {
    // Query to get order items with product information
    const { data, error } = await supabase
      .from('order_items')
      .select('product_id, quantity');
    
    if (error) {
      console.error('Error fetching popular products:', error);
      throw error;
    }
    
    // Count total quantity ordered for each product
    const productQuantities: Record<string, number> = {};
    
    data?.forEach(item => {
      const productId = item.product_id;
      if (!productQuantities[productId]) {
        productQuantities[productId] = 0;
      }
      productQuantities[productId] += item.quantity;
    });
    
    // Sort products by total quantity ordered
    const sortedProducts = Object.entries(productQuantities)
      .sort(([, qtyA], [, qtyB]) => qtyB - qtyA)
      .slice(0, limit)
      .map(([productId]) => productId);
    
    return sortedProducts;
  } catch (error) {
    console.error('Error getting popular products:', error);
    return [];
  }
} 