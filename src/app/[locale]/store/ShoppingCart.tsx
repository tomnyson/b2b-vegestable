'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Product } from '../../lib/product-api';
import { formatPriceSync } from '../../lib/settings-api';
import Image from 'next/image';

interface ShoppingCartProps {
  items: { product: Product; quantity: number }[];
  total: number;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  onCustomerInfoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  orderNotes: string;
  onOrderNotesChange: (notes: string) => void;
  onSaveOrder: () => void;
  isLoggedIn: boolean;
  onProceedToCheckout: () => boolean;
  userAddresses?: Array<{
    id: string;
    address: string;
    isDefault: boolean;
    longitude?: number;
    latitude?: number;
  }>;
  onSelectAddress?: (address: string) => void;
  currency?: string; // Currency code
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({
  items,
  total,
  customerInfo,
  onCustomerInfoChange,
  onUpdateQuantity,
  onRemoveItem,
  orderNotes,
  onOrderNotesChange,
  onSaveOrder,
  isLoggedIn,
  onProceedToCheckout,
  userAddresses,
  onSelectAddress,
  currency
}) => {
  const t = useTranslations('store');
  // State for confirmation modal
  const [showConfirmation, setShowConfirmation] = useState(false);
  // State for address selection dropdown
  const [showAddressSelection, setShowAddressSelection] = useState(false);
  
  // Handle checkout process
  const handleCheckout = () => {
    // Check stock availability before proceeding
    // const stockIssues = items.filter(item => {
    //   if (item.product.stock !== undefined && item.product.stock < item.quantity) {
    //     return true;
    //   }
    //   return false;
    // });

    // if (stockIssues.length > 0) {
    //   const issueMessages = stockIssues.map(item => 
    //     `${item.product.name_en}: ${t('products.available')} ${item.product.stock}, ${t('cart.requested')} ${item.quantity}`
    //   );
    //   alert(`${t('cart.stockIssues')}:\n${issueMessages.join('\n')}`);
    //   return false;
    // }

    if (onProceedToCheckout()) {
      // Show confirmation modal instead of immediately saving
      setShowConfirmation(true);
      return true;
    }
    return false;
  };

  // Handle confirmed order
  const handleConfirmOrder = () => {
    onSaveOrder();
    setShowConfirmation(false);
  };

  // Handle address selection
  const handleAddressChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onSelectAddress) {
      onSelectAddress(e.target.value);
    }
  };

  // Check if cart is empty
  const isCartEmpty = items.length === 0;

  return (
    <div className="p-6 lg:p-8">
      {/* Cart Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          {t('cart.title')}
        </h2>
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0L17 18" />
          </svg>
          <span className="text-sm font-medium text-gray-600">
            {items.reduce((acc, item) => acc + item.quantity, 0)} {t('cart.items')}
          </span>
        </div>
      </div>

      {isCartEmpty ? (
        <div className="text-center py-12">
          <div className="flex flex-col items-center">
            <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0L17 18" />
            </svg>
            <p className="text-gray-500 font-medium text-lg mb-2">{t('cart.empty')}</p>
            <p className="text-gray-400 text-sm">{t('cart.emptyDescription')}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Cart Items */}
          <div className="space-y-4 mb-6">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 p-4 hover:shadow-lg transition-all duration-200">
                <div className="flex items-start space-x-4">
                  {/* Product Image */}
                  <div className="h-16 w-16 relative rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
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
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{product.name_en}</h3>
                        <p className="text-xs text-gray-500">{product.unit || 'kg'}</p>
                        {product.stock !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">
                            {product.stock <= 0 
                              ? <span className="text-red-500 font-medium">{t('products.outOfStock')}</span> 
                              : `${product.stock} ${t('products.available')}`}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-emerald-600">{formatPriceSync(product.price * quantity, currency)}</div>
                        <div className="text-xs text-gray-500">{formatPriceSync(product.price, currency)}/{t('cart.unitPrice')}</div>
                      </div>
                    </div>

                    {/* Quantity Controls and Remove */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center bg-gray-100 rounded-xl">
                        <button
                          onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                          disabled={quantity <= 1}
                          className="p-2 rounded-l-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="px-3 py-2 min-w-[2.5rem] text-center text-sm font-medium">{quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                          className="p-2 rounded-r-xl hover:bg-gray-200 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(product.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                        aria-label={t('cart.remove')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 mb-6 border border-emerald-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">{t('cart.totalItems')}</span>
              <span className="text-lg font-bold text-emerald-700">{items.reduce((acc, item) => acc + item.quantity, 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-gray-900">{t('cart.totalAmount')}</span>
              <span className="text-2xl font-bold text-emerald-600">{formatPriceSync(total, currency)}</span>
            </div>
          </div>

          {/* Order Notes */}
          <div className="mb-6">
            <label htmlFor="order-notes" className="block text-sm font-medium text-gray-700 mb-2">
              {t('cart.orderNotes')}
            </label>
            <textarea
              id="order-notes"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm resize-none"
              placeholder={t('cart.orderNotesPlaceholder')}
              value={orderNotes}
              onChange={(e) => onOrderNotesChange(e.target.value)}
            />
          </div>
        </>
      )}
      
      {/* Place Order Button */}
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isCartEmpty}
        className={`w-full flex justify-center items-center px-6 py-4 rounded-2xl text-base font-semibold transition-all duration-200 ${
          isCartEmpty
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
        }`}
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {t('cart.placeOrder')}
      </button>

      {/* Order Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                {t('cart.confirmOrder')}
              </h3>
              <p className="text-sm text-gray-600">{t('cart.confirmDescription')}</p>
            </div>
            
            {/* Order Items */}
            <div className="mb-6">
              <h4 className="font-semibold text-sm text-gray-700 mb-3">{t('cart.orderItems')}</h4>
              <div className="space-y-2">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">{product.name_en}</span>
                        {product.stock !== undefined && (
                          <span className="text-xs text-gray-500 block mt-1">
                            ({quantity} of {product.stock} available)
                          </span>
                        )}
                      </div>
                      <div className="text-right ml-3">
                        <span className="text-sm font-semibold text-emerald-600">{quantity} {product.unit || 'kg'}</span>
                        <div className="text-xs text-gray-500">{formatPriceSync(product.price * quantity, currency)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
              <div className="flex justify-between items-center text-base font-semibold">
                <span className="text-gray-900">{t('cart.totalAmount')}</span>
                <span className="text-emerald-600">{formatPriceSync(total, currency)}</span>
              </div>
            </div>
            
            {/* Order Notes */}
            {orderNotes && (
              <div className="mb-6 bg-gray-50 rounded-2xl p-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">{t('cart.yourNotes')}</h4>
                <p className="text-sm text-gray-600">{orderNotes}</p>
              </div>
            )}
            
            {/* Delivery Address Section */}
            <div className="mb-6">
              <h4 className="font-semibold text-sm text-gray-700 mb-3">{t('cart.deliveryAddress')}</h4>
              
              {userAddresses && userAddresses.length > 0 ? (
                <div>
                  {showAddressSelection ? (
                    <div className="space-y-3">
                      <select 
                        className="w-full min-w-[280px] px-4 py-3 border border-gray-300 rounded-2xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                        value={customerInfo.address}
                        onChange={handleAddressChange}
                      >
                        {userAddresses.map(address => (
                          <option key={address.id} value={address.address}>
                            {address.address} {address.isDefault ? t('cart.defaultAddress') : ''}
                          </option>
                        ))}
                      </select>
                      <button 
                        className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                        onClick={() => setShowAddressSelection(false)}
                      >
                        {t('cart.confirmSelection')}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                      <p className="text-sm text-gray-700 flex-1">{customerInfo.address}</p>
                      <button 
                        className="text-sm text-emerald-600 hover:text-emerald-800 font-medium ml-3"
                        onClick={() => setShowAddressSelection(true)}
                      >
                        {t('cart.changeAddress')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-sm text-gray-700">{customerInfo.address || t('cart.noAddress')}</p>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col-reverse lg:flex-row lg:justify-end lg:space-x-3 space-y-3 space-y-reverse lg:space-y-0">
              <button
                onClick={() => setShowConfirmation(false)}
                className="w-full lg:w-auto px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all duration-200"
              >
                {t('cart.cancel')}
              </button>
              <button
                onClick={handleConfirmOrder}
                className="w-full lg:w-auto px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{t('cart.confirm')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingCart; 