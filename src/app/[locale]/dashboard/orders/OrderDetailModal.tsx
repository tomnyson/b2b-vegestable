import { useState, useRef, useEffect } from 'react';
import { Order, OrderItem } from '../../../lib/order-api';
import { AppSettings, getAppSettings, SUPPORTED_CURRENCIES } from '../../../lib/settings-api';
import { getUserById } from '../../../lib/users-api';
import { useTranslations } from 'next-intl';

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
}


// Driver interface
interface Driver {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  role: string;
}

// Ensure type safety with product info
interface OrderItemWithProduct extends OrderItem {
  product?: {
    id: string;
    name_en: string;
    name_vi?: string;
    name_tr?: string;
    description?: string;
    price: number;
    unit: string;
    sku: string;
    image_url?: string;
    category?: string;
    is_active: boolean;
    stock: number;
  };
}

export default function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const t = useTranslations('orderDetail');
  const [activeTab, setActiveTab] = useState<'details' | 'invoice'>('details');
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoadingDriver, setIsLoadingDriver] = useState(false);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Handle backdrop click to close modal
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };
  
  // Load application settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getAppSettings();
        setAppSettings(settings);
      } catch (error) {
        console.error('Error loading app settings:', error);
      } 
    }
    
    loadSettings();
  }, []);

  // Load driver information if assigned
  useEffect(() => {
    async function loadDriver() {
      if (!order?.assigned_driver_id) {
        setDriver(null);
        return;
      }

      setIsLoadingDriver(true);
      try {
        const driverData = await getUserById(order.assigned_driver_id);
        setDriver(driverData);
      } catch (error) {
        console.error('Error loading driver details:', error);
        setDriver(null);
      } finally {
        setIsLoadingDriver(false);
      }
    }

    loadDriver();
  }, [order?.assigned_driver_id]);

  if (!order) return null;

  // Cast items to our extended type to ensure type safety
  const orderItemsExtended = order.items as OrderItemWithProduct[];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full";
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'processing':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'completed':
        return `${baseClasses} bg-emerald-100 text-emerald-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Get the product name in the appropriate language
  const getProductName = (item: OrderItemWithProduct): string => {
    if (!item.product) return `Product ID: ${item.product_id}`;
    return item.product.name_en;
  };

  // Get currency symbol based on app settings
  const getCurrencySymbol = () => {
    if (!appSettings?.default_currency) return '$';
    
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === appSettings.default_currency);
    return currency?.symbol || '$';
  };

  // Calculate VAT amount
  const calculateVat = (amount: number) => {
    if (!appSettings?.vat_percentage) return 0;
    return (amount * appSettings.vat_percentage) / 100;
  };

  // Currency symbol from settings
  const currencySymbol = getCurrencySymbol();
  
  // VAT calculation
  const vatAmount = calculateVat(order.total_amount);
  const totalWithVat = order.total_amount + vatAmount;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 lg:p-8"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col border border-gray-100 backdrop-blur-sm">
        {/* Header */}
        <div className="modal-header flex justify-between items-center border-b border-gray-200 p-4 lg:p-6 bg-gradient-to-r from-emerald-50 to-teal-50">
          <h2 className="text-xl font-bold text-gray-800">📋 Order Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs flex border-b border-gray-200 bg-gray-50 px-4 lg:px-6">
          <button
            className={`py-3 px-4 font-semibold text-xs transition-all duration-200 ${
              activeTab === 'details' 
                ? 'text-emerald-600 border-b-3 border-emerald-600 bg-white -mb-px rounded-t-lg' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-t-lg'
            }`}
            onClick={() => setActiveTab('details')}
          >
            📋 Order Details
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* Details tab content */}
          <div className={`${activeTab === 'details' ? 'block' : 'hidden'}`}>
            <div className="space-y-4">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
                    📦 Order Information
                  </h3>
                  <p className="mt-1 text-sm"><span className="font-medium">Date:</span> {formatDate(order.order_date)}</p>
                  <p className="text-sm"><span className="font-medium">Status:</span> 
                    <span className={`ml-1 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(order.status)}`}>
                      {t(`status.${order.status}`)}
                    </span>
                  </p>
                  <p className="text-sm"><span className="font-medium">Delivery Date:</span> 
                    <span className={`ml-1 px-2 py-0.5 text-xs font-medium rounded-full`}>
                      {order.delivery_date ? formatDate(order.delivery_date) : 'N/A'}
                    </span>
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
                    👤 Customer Information
                  </h3>
                  {order.customer ? (
                    <>
                      <p className="mt-1 text-sm">
                        <span className="font-medium">Name:</span> {order.customer.name || 'N/A'}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Email:</span> {order.customer?.email || 'N/A'}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Phone:</span> {order.customer.phone || 'N/A'}
                      </p>
                      {order.customer.address && (
                        <p className="text-sm">
                          <span className="font-medium">Address:</span> {order.customer.address}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      {order.user_id && (
                        <p className="text-gray-700 text-sm">Account: {order.user_id}</p>
                      )}
                      <p className="text-sm">
                        <span className="font-medium">Phone:</span> N/A
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
                  🚚 Delivery Information
                </h3>
                <p className="mt-1 text-sm"><span className="font-medium">Address:</span> {order.delivery_address || 'Not specified'}</p>
                
                {/* Customer Phone */}
                <p className="mt-1 text-sm">
                  <span className="font-medium">Customer Phone:</span> {order.customer?.phone || 'N/A'}
                </p>
                
                {/* Driver Information */}
                {order.assigned_driver_id ? (
                  <div className="mt-3 border-t border-green-200 pt-3">
                    <p className="font-medium text-gray-700 mb-2 text-sm">📱 Assigned Driver:</p>
                    {isLoadingDriver ? (
                      <p className="text-gray-500 text-xs">Loading driver information...</p>
                    ) : driver ? (
                      <div className="ml-4 space-y-1">
                        <p className="text-sm"><span className="font-medium">Name:</span> {driver.name || 'N/A'}</p>
                        <p className="text-sm"><span className="font-medium">Email:</span> {driver.email || 'N/A'}</p>
                        <p className="text-sm"><span className="font-medium">Phone:</span> {driver.phone || 'N/A'}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-xs ml-4">Driver information not available</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 pt-3 border-t border-green-200 text-sm"><span className="font-medium">Driver:</span> Not assigned</p>
                )}
                
                {order.notes && (
                  <div className="mt-3 border-t border-green-200 pt-3">
                    <p className="text-sm"><span className="font-medium">Notes:</span> {order.notes}</p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
                  🛒 Order Items
                </h3>
                {orderItemsExtended.length === 0 ? (
                  <div className="p-8 text-center">
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-gray-600 font-medium text-xs">{t('noItemsFound')}</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View */}
                    <div className="block lg:hidden divide-y divide-gray-100">
                      {orderItemsExtended.map((item, index) => (
                        <div key={index} className="p-3 hover:bg-emerald-50/50 transition-colors duration-200">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-semibold text-gray-900 truncate">
                                  {getProductName(item)}
                                </h4>
                                {item.product?.sku && (
                                  <p className="text-xs text-gray-500">SKU: {item.product.sku}</p>
                                )}
                              </div>
                              <div className="ml-3 text-right">
                                <div className="text-xs font-bold text-emerald-600">
                                  ${(item.unit_price * item.quantity).toFixed(2)}
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>${item.unit_price.toFixed(2)} × {item.quantity} {item.product?.unit}</span>
                              <span>{t('quantity')}: {item.quantity}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                          <tr>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              {t('product')}
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              {t('sku')}
                            </th>
                            <th scope="col" className="px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              {t('quantity')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white/50 divide-y divide-gray-100">
                          {orderItemsExtended.map((item, index) => (
                            <tr key={index} className="hover:bg-emerald-50/50 transition-colors duration-200">
                              <td className="px-3 py-2">
                                <div className="text-xs font-semibold text-gray-900">
                                  {getProductName(item)}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="text-xs text-gray-600">
                                  {item.product?.sku || t('notAvailable')}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <div className="text-xs font-medium text-gray-900">
                                  {item.quantity} {item.product?.unit}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 lg:p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg font-medium text-sm"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
} 