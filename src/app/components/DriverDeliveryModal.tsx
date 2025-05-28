import React from 'react';
import { useTranslations } from 'next-intl';
import { Order } from '../lib/order-api';
import { UserProfile } from '../../lib/auth';

interface DriverDeliveryModalProps {
  delivery: Order;
  onClose: () => void;
  onUpdateStatus?: (deliveryId: string, newStatus: Order['status']) => Promise<void>;
  isUpdatingStatus?: boolean;
}

interface ExtendedCustomerProfile extends UserProfile {
  profile_image?: string;
}

export default function DriverDeliveryModal({ 
  delivery, 
  onClose,
  onUpdateStatus,
  isUpdatingStatus = false 
}: DriverDeliveryModalProps) {
  const t = useTranslations('driver');
  const tCommon = useTranslations('labels');
  const tActions = useTranslations('actions');

  // Check if the customer has address coordinates 
  // The coordinates might be in different places depending on data structure
  const customerProfile = delivery.customer as unknown as ExtendedCustomerProfile;
  
  // Try to find coordinates in a few different places in the data structure
  let longitude: number | undefined;
  let latitude: number | undefined;
  
  // Option 1: Coordinates might be in the addresses array (if customer has one)
  if (customerProfile?.addresses?.length) {
    const defaultAddress = customerProfile.addresses.find(addr => addr.isDefault);
    if (defaultAddress) {
      longitude = defaultAddress.longitude;
      latitude = defaultAddress.latitude;
    }
  }
  
  // Option 2: Coordinates might be directly on the customer profile
  if (!longitude && !latitude && customerProfile?.longitude && customerProfile?.latitude) {
    longitude = customerProfile.longitude;
    latitude = customerProfile.latitude;
  }
  
  // Check if we have valid coordinates
  const hasCoordinates = typeof longitude === 'number' && typeof latitude === 'number';
  
  // Generate Google Maps URL
  const googleMapsUrl = hasCoordinates 
    ? `https://www.google.com/maps?q=${latitude},${longitude}` 
    : delivery.delivery_address 
      ? `https://maps.google.com/?q=${encodeURIComponent(delivery.delivery_address)}` 
      : null;

  // Helper function to get customer name
  const getCustomerName = () => {
    if (delivery.customer && delivery.customer.name) {
      return delivery.customer.name;
    } else {
      return t('anonymousCustomer');
    }
  };

  // Helper function to get customer email
  const getCustomerEmail = () => {
    return customerProfile?.email || delivery.customer?.email || 'N/A';
  };
  
  // Helper function to get customer phone
  const getCustomerPhone = () => {
    return customerProfile?.phone || delivery.customer?.phone || null;
  };

  // Helper function to get product name with fallback
  const getProductName = (item: any) => {
    // Try different possible product name fields
    if (item.product?.name_en) return item.product.name_en;
    if (item.product?.name) return item.product.name;
    if (item.product_name) return item.product_name;
    return `${t('product')} #${item.product_id}`;
  };

  // Helper function to get product unit
  const getProductUnit = (item: any) => {
    if (item.product?.unit) return item.product.unit;
    if (item.unit) return item.unit;
    return '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/90 backdrop-blur-lg z-10 border-b border-gray-100 p-4 sm:p-6 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {t('deliveryDetails')}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 sm:p-6 space-y-6">
          {/* Customer Information */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
            <h3 className="text-gray-700 font-semibold mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {t('customer')}
            </h3>
            {delivery.customer ? (
              <div className="flex items-start">
                <div className="flex-shrink-0 h-12 w-12">
                  {customerProfile?.profile_image ? (
                    <img
                      className="h-12 w-12 rounded-full border-2 border-white shadow-sm"
                      src={customerProfile.profile_image}
                      alt={getCustomerName()}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center border-2 border-white shadow-sm">
                      <span className="text-white text-lg font-semibold">
                        {getCustomerName().charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-gray-900 font-semibold text-lg">
                    {getCustomerName()}
                  </p>
                  <p className="text-gray-600 text-sm">{getCustomerEmail()}</p>
                  {getCustomerPhone() && (
                    <p className="text-gray-600 text-sm mt-1">
                      <a 
                        href={`tel:${getCustomerPhone()}`} 
                        className="hover:text-emerald-600 inline-flex items-center transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {getCustomerPhone()}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-900 font-semibold">{t('anonymousCustomer')}</p>
            )}
          </div>
          
          {/* Delivery Date */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-gray-700 font-semibold mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t('deliveryDate')}
            </h3>
            <p className="text-gray-900 text-lg">
              {delivery.order_date ? new Date(delivery.order_date).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          
          {/* Status Section */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-gray-700 font-semibold flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {tCommon('status')}
              </h3>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                delivery.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                delivery.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                delivery.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {t(delivery.status)}
              </span>
            </div>
            
            {/* Status update buttons */}
            {onUpdateStatus && (
              <div className="flex flex-wrap gap-2">
                {delivery.status === 'pending' && (
                  <button
                    onClick={() => delivery.id && onUpdateStatus(delivery.id, 'processing')}
                    disabled={isUpdatingStatus || !delivery.id}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                    {t('startDelivery')}
                  </button>
                )}
                
                {delivery.status === 'processing' && (
                  <button
                    onClick={() => delivery.id && onUpdateStatus(delivery.id, 'completed')}
                    disabled={isUpdatingStatus || !delivery.id}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('markDelivered')}
                  </button>
                )}
                
                {isUpdatingStatus && (
                  <span className="text-sm text-gray-500 ml-2 flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('updating')}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Address Section */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-gray-700 font-semibold mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {tCommon('address')}
            </h3>
            <div className="bg-white rounded-xl p-3 border border-gray-200">
              <p className="text-gray-900 break-words">{delivery.delivery_address || t('noAddressProvided')}</p>
              
              {/* Show coordinates if available */}
              {hasCoordinates && (
                <p className="text-xs text-gray-500 mt-2">
                  {t('coordinates')}: {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
                </p>
              )}
            </div>
            
            {/* Google Maps link */}
            {googleMapsUrl && (
              <a 
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                <svg width="16" height="16" className="mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor"/>
                </svg>
                {t('openInMaps')}
              </a>
            )}
          </div>
          
          {/* Order items summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-gray-700 font-semibold mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {t('orderItems')}
            </h3>
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('item')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {tCommon('quantity')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {delivery.items?.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {getProductName(item)}
                          </div>
                          {item.product?.sku && (
                            <div className="text-xs text-gray-500">
                              SKU: {item.product.sku}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-gray-900">
                            {item.quantity} {getProductUnit(item)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button 
              onClick={onClose} 
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              {tActions('cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 