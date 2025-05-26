import { useState, useCallback, useEffect } from 'react';
import { Product, ProductFormData } from '@/app/lib/types';
import * as api from '@/app/lib/api';
import { uploadProductImage } from '@/app/lib/storage-utils';

interface UseProductsOptions {
  initialFilters?: {
    category?: string;
    is_active?: boolean;
    search?: string;
    sort?: string;
  };
  fetchOnMount?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(options.initialFilters || {});

  // Fetch products with current filters
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { products: fetchedProducts, count } = await api.getProducts(filters);
      setProducts(fetchedProducts);
      setTotalCount(count);
    } catch (err) {
      setError((err as Error).message);
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Create a new product
  const createProduct = async (formData: ProductFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // If there's an image, upload it first
      let image_url = formData.image_url;
      if (formData.image) {
        image_url = await uploadProductImage(formData.image);
      }
      
      // Create the product with the image URL
      const productData = {
        ...formData,
        image_url,
        image: undefined // Remove the image file from the data sent to the API
      };
      
      const newProduct = await api.createProduct(productData);
      
      // Update the local state
      setProducts(prev => [newProduct, ...prev]);
      setTotalCount(prev => prev + 1);
      
      return newProduct;
    } catch (err) {
      setError((err as Error).message);
      console.error('Error creating product:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing product
  const updateProduct = async (id: string, formData: Partial<ProductFormData>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // If there's a new image, upload it first
      let image_url = formData.image_url;
      if (formData.image) {
        image_url = await uploadProductImage(formData.image);
      }
      
      // Update the product with the new image URL if applicable
      const updates = {
        ...formData,
        ...(image_url && { image_url }),
        image: undefined // Remove the image file from the data sent to the API
      };
      
      const updatedProduct = await api.updateProduct(id, updates);
      
      // Update the local state
      setProducts(prev => 
        prev.map(product => String(product.id) === id ? updatedProduct : product)
      );
      
      return updatedProduct;
    } catch (err) {
      setError((err as Error).message);
      console.error('Error updating product:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a product
  const deleteProduct = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await api.deleteProduct(id);
      
      // Update the local state
      setProducts(prev => prev.filter(product => String(product.id) !== id));
      setTotalCount(prev => prev - 1);
    } catch (err) {
      setError((err as Error).message);
      console.error('Error deleting product:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Fetch products on mount if required
  useEffect(() => {
    if (options.fetchOnMount !== false) {
      fetchProducts();
    }
  }, [fetchProducts, options.fetchOnMount]);

  return {
    products,
    totalCount,
    isLoading,
    error,
    filters,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    updateFilters,
    resetFilters
  };
} 