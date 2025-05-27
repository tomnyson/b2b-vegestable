'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Product } from '../../lib/product-api';
import { formatPriceSync } from '../../lib/settings-api';
import Image from 'next/image';

interface ProductListProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  onSearch: (term: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  popularProductIds?: string[]; // Optional array of popular product IDs
  currency?: string; // Currency code
  isSearching?: boolean; // Optional prop to show search loading state
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  loading,
  error,
  searchTerm,
  onSearch,
  currentPage,
  totalPages,
  onPageChange,
  onAddToCart,
  popularProductIds = [], // Default to empty array
  currency,
  isSearching
}) => {
  const t = useTranslations('store');
  const locale = useLocale();
  // State for quantity inputs
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Get or set quantity for a product
  const getQuantity = (productId: string): number => {
    return quantities[productId] || 1;
  };

  // Handle quantity change
  const handleQuantityChange = (productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    if (product && product.stock !== undefined) {
      // Ensure quantity doesn't exceed available stock
      newQuantity = Math.min(Math.max(1, newQuantity), product.stock);
    } else {
      // If no stock info available, just ensure it's at least 1
      newQuantity = Math.max(1, newQuantity);
    }

    setQuantities({
      ...quantities,
      [productId]: newQuantity
    });
  };

  // Handle add to cart
  const handleAddToCart = (product: Product) => {
    const quantity = getQuantity(product.id);
    onAddToCart(product, quantity);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 xl:p-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          <p className="text-base sm:text-lg font-medium text-gray-700 text-center">{t('products.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50/80 backdrop-blur-lg rounded-2xl border border-red-200/20 p-4 sm:p-6 flex items-start sm:items-center">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 mr-3 flex-shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-700 font-medium text-sm sm:text-base">{error}</p>
        </div>
      </div>
    );
  }

  // Function to determine if a product is frequently ordered
  const isFrequentlyOrdered = (product: Product) => {
    // Check if the product ID is in the list of popular product IDs
    return popularProductIds.includes(product.id);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Search and Filter Controls */}
      <div className="mb-6 sm:mb-8 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 gap-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent leading-tight">{t('products.title')}</h2>
          <div className="flex items-center justify-between sm:justify-end space-x-4">
            {/* Order History Link */}
            <a
              href={`/${locale}/profile?tab=orders`}
              className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium text-sm space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{t('orderHistory')}</span>
            </a>
            
            {/* Products Count */}
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 flex-shrink-0">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7" />
              </svg>
              <span className="whitespace-nowrap font-medium">{products.length} {t('products.productsAvailable')}</span>
            </div>
          </div>
        </div>

        <div className="w-full">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder={t('products.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="block w-full pl-12 pr-4 py-3 sm:py-4 border border-gray-200 rounded-2xl text-sm sm:text-base leading-5 bg-white/80 backdrop-blur-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 shadow-lg hover:shadow-xl"
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <div className="animate-spin h-5 w-5 border-2 border-emerald-500 rounded-full border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products Display */}
      {products.length > 0 ? (
        <>
          {/* Mobile and Tablet Card View */}
          <div className="block xl:hidden space-y-4 sm:space-y-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/20 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                                      {/* Product Image */}
                  <div className="h-24 w-24 sm:h-20 sm:w-20 relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0 mx-auto sm:mx-0 shadow-lg">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name_en}
                        fill
                        sizes="(max-width: 640px) 96px, 80px"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="text-center sm:text-left">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">{product.name_en}</h3>
                      {isFrequentlyOrdered(product) && (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 mt-2 shadow-sm">
                          ⭐ {t('products.bestSeller')}
                        </span>
                      )}
                    </div>

                    {/* Price and Unit */}
                    <div className="text-center sm:text-left">
                      <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{formatPriceSync(product.price, currency)}</div>
                      <div className="text-sm text-gray-600 font-medium">{t('products.per')} {product.unit || 'kg'}</div>
                    </div>

                    {/* Stock Info */}
                    <div className="flex justify-center sm:justify-start">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 shadow-sm">
                        {product.stock !== undefined ? `${product.stock} ${t('products.available')}` : t('products.inStock')}
                      </span>
                    </div>

                    {/* Quantity Controls and Add to Cart */}
                    <div className="flex flex-col xs:flex-row items-center justify-center sm:justify-start space-y-3 xs:space-y-0 xs:space-x-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center bg-white/80 backdrop-blur-lg rounded-xl border border-gray-200 shadow-lg">
                        <button
                          onClick={() => handleQuantityChange(product.id, getQuantity(product.id) - 1)}
                          className="p-2.5 rounded-l-xl hover:bg-emerald-50 transition-all duration-200 text-gray-600 hover:text-emerald-600"
                          aria-label="Decrease quantity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="px-4 py-2.5 min-w-[3rem] text-center text-sm font-semibold text-gray-900">
                          {getQuantity(product.id)}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(product.id, getQuantity(product.id) + 1)}
                          className="p-2.5 rounded-r-xl hover:bg-emerald-50 transition-all duration-200 text-gray-600 hover:text-emerald-600"
                          disabled={product.stock !== undefined && getQuantity(product.id) >= product.stock}
                          aria-label="Increase quantity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        onClick={() => handleAddToCart(product)}
                        className={`w-full xs:w-auto px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-105 ${product.stock !== undefined && product.stock <= 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl'
                          }`}
                        disabled={product.stock !== undefined && product.stock <= 0}
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0L17 18" />
                        </svg>
                        <span className="truncate">{product.stock !== undefined && product.stock <= 0 ? t('products.outOfStock') : t('products.addToCart')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden xl:block">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 shadow-xl">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                    <tr>
                      <th scope="col" className="px-6 py-5 text-left text-xs font-bold text-gray-800 uppercase tracking-wider min-w-[200px]">
                        {t('labels.productName')}
                      </th>
                      <th scope="col" className="px-6 py-5 text-left text-xs font-bold text-gray-800 uppercase tracking-wider min-w-[140px]">
                        {t('labels.price')} & {t('labels.unit')}
                      </th>
          
                      <th scope="col" className="px-6 py-5 text-center text-xs font-bold text-gray-800 uppercase tracking-wider min-w-[120px]">
                        {t('labels.quantity')}
                      </th>
                      <th scope="col" className="px-6 py-5 text-center text-xs font-bold text-gray-800 uppercase tracking-wider min-w-[160px]">
                        {t('labels.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/40 divide-y divide-gray-100">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-emerald-50/70 transition-all duration-300 hover:shadow-lg">
                        <td className="px-6 py-5">
                          <div className="flex items-center space-x-3">
                            <div className="h-16 w-16 relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0 shadow-lg">
                              {product.image_url ? (
                                                                  <Image
                                    src={product.image_url}
                                    alt={product.name_en}
                                    fill
                                    sizes="64px"
                                    style={{ objectFit: 'cover' }}
                                  />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-base font-bold text-gray-900 break-words leading-tight">
                                {product.name_en}
                              </div>
                              {isFrequentlyOrdered(product) && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 mt-2 shadow-sm">
                                  ⭐ {t('products.bestSeller')}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent break-words">{formatPriceSync(product.price, currency)}</div>
                          <div className="text-sm text-gray-600 font-medium break-words">{t('products.per')} {product.unit || 'kg'}</div>
                        </td>
                    
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center">
                            <div className="flex items-center bg-gray-100 rounded-lg">
                              <button
                                onClick={() => handleQuantityChange(product.id, getQuantity(product.id) - 1)}
                                className="p-2 rounded-l-lg hover:bg-gray-200 transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="px-3 py-2 min-w-[2.5rem] text-center text-sm font-medium">
                                {getQuantity(product.id)}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(product.id, getQuantity(product.id) + 1)}
                                className="p-2 rounded-r-lg hover:bg-gray-200 transition-colors"
                                disabled={product.stock !== undefined && getQuantity(product.id) >= product.stock}
                                aria-label="Increase quantity"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => handleAddToCart(product)}
                            className={`inline-flex items-center px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 space-x-2 whitespace-nowrap ${product.stock !== undefined && product.stock <= 0
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl'
                              }`}
                            disabled={product.stock !== undefined && product.stock <= 0}
                          >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0L17 18" />
                            </svg>
                            <span className="break-words">
                              {product.stock !== undefined && product.stock <= 0 ? t('products.outOfStock') : t('products.addToCart')}
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-8 sm:p-12 text-center">
          <div className="flex flex-col items-center">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7" />
            </svg>
            <p className="text-gray-500 font-medium text-base sm:text-lg mb-2">{t('products.noProductsFound')}</p>
            <p className="text-gray-400 text-sm sm:text-base">{t('products.noProductsDescription')}</p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 sm:mt-8 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="text-xs sm:text-sm text-gray-700 text-center lg:text-left">
            {t('pagination.showing')} <span className="font-semibold">{currentPage}</span> {t('pagination.of')}{' '}
            <span className="font-semibold">{totalPages}</span>
          </div>
          <div className="flex items-center justify-center space-x-1 sm:space-x-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className={`px-3 sm:px-4 py-2 rounded-lg border font-medium text-xs sm:text-sm transition-all duration-200 flex items-center space-x-1 ${currentPage <= 1
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                  : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400'
                }`}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">{t('pagination.previous')}</span>
            </button>

            <div className="flex items-center space-x-1">
              {[...Array(Math.min(totalPages, 5))].map((_, idx) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = idx + 1;
                } else {
                  if (currentPage <= 3) {
                    pageNum = idx + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + idx;
                  } else {
                    pageNum = currentPage - 2 + idx;
                  }
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-2.5 sm:px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 ${currentPage === pageNum
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-emerald-50 border border-gray-200'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className={`px-3 sm:px-4 py-2 rounded-lg border font-medium text-xs sm:text-sm transition-all duration-200 flex items-center space-x-1 ${currentPage >= totalPages
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                  : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400'
                }`}
            >
              <span className="hidden sm:inline">{t('pagination.next')}</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList; 