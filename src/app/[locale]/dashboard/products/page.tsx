'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useTranslations } from 'next-intl';
import RouteProtection from '../../../components/RouteProtection';
import AddProductModal from './AddProductModal';
import EditProductModal from './EditProductModal';
import ImportProductModal from './ImportProductModal';
import Pagination from '@/app/components/Pagination';
import { Product, getPaginatedProducts, deleteProduct, toggleProductStatus } from '../../../lib/product-api';
import Loading from '@/app/components/Loading';
import Switch from '@/app/components/Switch';

type SortField = 'name_en' | 'unit' | 'price' | 'stock' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function ProductsPage() {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isSearching) {
        setCurrentPage(1);
        setIsSearching(false);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [searchTerm, isSearching]);

  // Reset to page 1 when itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Fetch products from Supabase
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const result = await getPaginatedProducts(
          currentPage,
          itemsPerPage,
          sortField,
          sortDirection,
          searchTerm || undefined
        );
        
        setProducts(result.products);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalCount);
        setError(null);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!isSearching) {
      fetchProducts();
    }
  }, [currentPage, itemsPerPage, sortField, sortDirection, searchTerm, isSearching]);

  // Handle column sorting
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsSearching(true);
  };

  const handleAddProduct = async (data: any) => {
    try {
      setLoading(true);
      // Refresh products list
      const result = await getPaginatedProducts(
        currentPage,
        itemsPerPage,
        sortField,
        sortDirection,
        searchTerm || undefined
      );
      
      setProducts(result.products);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
      
      // Show success toast
      toast.success(`${t('addProductSuccess')}: "${data.name_en}"`);
    } catch (err: any) {
      console.error('Error adding product:', err);
      toast.error(`${t('addProductError')}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (data: any) => {
    try {
      setLoading(true);
      // Product data is already updated by the updateProduct call in the modal
      console.log('Product updated:', data);
      
      // Refresh products list
      const result = await getPaginatedProducts(
        currentPage,
        itemsPerPage,
        sortField,
        sortDirection,
        searchTerm || undefined
      );
      
      setProducts(result.products);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
      
      // Show success toast
      toast.success(`${t('updateProductSuccess')}: "${data.name_en}"`);
    } catch (err: any) {
      console.error('Error updating product:', err);
      toast.error(`${t('updateProductError')}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('deleteConfirm'))) {
      try {
        setLoading(true);
        await deleteProduct(id);
        
        // Refresh products list
        const result = await getPaginatedProducts(
          currentPage,
          itemsPerPage,
          sortField,
          sortDirection,
          searchTerm || undefined
        );
        
        setProducts(result.products);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalCount);
        
        // Show success toast
        toast.success(t('deleteProductSuccess'));
      } catch (err: any) {
        console.error('Error deleting product:', err);
        toast.error(`${t('deleteProductError')}: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      setLoading(true);
      await toggleProductStatus(id, isActive);
      
      // Refresh products list
      const result = await getPaginatedProducts(
        currentPage,
        itemsPerPage,
        sortField,
        sortDirection,
        searchTerm || undefined
      );
      
      setProducts(result.products);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
      
      // Show success toast
      toast.success(
        isActive 
          ? t('productDeactivatedSuccess')
          : t('productActivatedSuccess')
      );
    } catch (err: any) {
      console.error('Error toggling product status:', err);
      toast.error(`${t('statusUpdateError')}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setEditModalOpen(true);
  };

  const handleImportComplete = async (importedCount: number) => {
    try {
      // Refresh products list after import
      const result = await getPaginatedProducts(
        currentPage,
        itemsPerPage,
        sortField,
        sortDirection,
        searchTerm || undefined
      );
      
      setProducts(result.products);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
      
      // Close the import modal
      setImportModalOpen(false);
    } catch (err: any) {
      console.error('Error refreshing products after import:', err);
              toast.error(`${t('refreshError')}: ${err.message}`);
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-emerald-600 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-emerald-600 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Loading state
  if (loading && products.length === 0) {
    return (
      <Loading /> 
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-red-200/20 p-6 lg:p-8">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {t('loadingError')}: {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RouteProtection>
      <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl lg:text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="mt-1 text-gray-600 text-base">
              {t('subtitle')}
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setImportModalOpen(true)}
               className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center space-x-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span>{t('importCSV')}</span>
            </button>
            <button
              onClick={() => setAddModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center space-x-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{t('addProduct')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Statistics */}
      <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-1">
              {t('searchProducts')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white/50 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin h-3 w-3 border-2 border-emerald-500 rounded-full border-t-transparent"></div>
                </div>
              )}
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-3">
            <div className="text-xl font-bold text-emerald-700">{totalCount}</div>
            <div className="text-xs text-gray-600">{t('totalProducts')}</div>
          </div>
          
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-3">
            <div className="text-xl font-bold text-teal-700">{products.filter(p => p.is_active).length}</div>
            <div className="text-xs text-gray-600">{t('activeProducts')}</div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 overflow-hidden">
        {/* Mobile Card View */}
        <div className="block lg:hidden">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">{t('products')}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {products.length > 0 ? (
              products.map((product) => (
                <div key={product.id} className="p-4 hover:bg-emerald-50/50 transition-colors duration-200">
                  <div className="flex items-start space-x-3">
                    {product.image_url && (
                      <img 
                        src={product.image_url} 
                        alt={product.name_en} 
                        className="h-12 w-12 rounded-lg object-cover border-2 border-emerald-100"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-base font-semibold text-gray-900 truncate">{product.name_en}</h4>
                          <Switch
                            checked={product.is_active}
                            onChange={() => handleToggleStatus(product.id, product.is_active)}
                            size="sm"
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">{t('unit')}:</span> {product.unit}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleEditClick(product)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-xs"
                        >
                          {t('edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-xs"
                        >
                          {t('delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-gray-500 font-medium text-sm">{t('noProductsFound')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
              <tr>
                <th 
                  className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 transition-colors duration-200"
                  onClick={() => handleSort('name_en')}
                >
                  <div className="flex items-center">
                    {t('productName')}
                    {renderSortIcon('name_en')}
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 transition-colors duration-200"
                  onClick={() => handleSort('unit')}
                >
                  <div className="flex items-center">
                    {t('unit')}
                    {renderSortIcon('unit')}
                  </div>
                </th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-gray-100">
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-emerald-50/50 transition-colors duration-200">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {product.image_url && (
                          <img 
                            src={product.image_url} 
                            alt={product.name_en} 
                            className="h-10 w-10 rounded-lg object-cover border-2 border-emerald-100"
                          />
                        )}
                        <div className="text-sm font-semibold text-gray-900">{product.name_en}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {product.unit}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-center">
                      <Switch
                        checked={product.is_active} 
                        onChange={() => handleToggleStatus(product.id, product.is_active)}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditClick(product)}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded-lg transition-colors"
                          title={t('edit')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('delete')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <p className="text-gray-500 font-medium text-sm">{t('noProductsFound')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        t={tCommon}
        itemName="products"
      />

      {/* Add Product Modal */}
      <AddProductModal
        open={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddProduct}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        open={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleUpdateProduct}
        product={selectedProduct}
      />

      {/* Import Product Modal */}
      <ImportProductModal
        isOpen={isImportModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
    </RouteProtection>
  );
} 