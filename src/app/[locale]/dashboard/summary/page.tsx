'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getUser, getUserProfile } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { exportOrderSummaryToPDF } from '../../../lib/pdf-utils';
import { toast } from 'react-toastify';
import RouteProtection from '../../../components/RouteProtection';
import { getAppSettings, AppSettings } from '../../../lib/settings-api';
import { getOrderFilterRangeByDelivery } from '../../../lib/utils';

interface ProductSummary {
  id: string;
  name_en: string;
  unit: string;
  total_quantity: number;
  sku?: string;
}

export default function OrderSummaryPage() {
  const router = useRouter();
  const t = useTranslations('summary');
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<ProductSummary[]>([]);
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState<string | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [deliveryFilter, setDeliveryFilter] = useState<'today' | 'tomorrow' | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        // Get current authenticated user
        const userData = await getUser();
        if (!userData) {
          // Redirect to login if not logged in
          router.push('/login');
          return;
        }

        // Get user profile to check role
        const profile = await getUserProfile(userData.id);
        if (profile?.role !== 'admin') {
          // Redirect to store if not an admin
          router.push('/store');
          return;
        }

        // User is authorized, load summary data
        await fetchSummaryData();
      } catch (error: any) {
        console.error('Error checking authorization:', error);
        setError(t('authError'));
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  // Load app settings on component mount
  useEffect(() => {
    async function loadAppSettings() {
      try {
        const settings = await getAppSettings();
        setAppSettings(settings);
      } catch (err) {
        console.error('Error loading app settings:', err);
      }
    }

    loadAppSettings();
  }, []);

  // Fetch summary data
  const fetchSummaryData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // SQL query to aggregate order items by product
      const { data, error } = await supabase
        .rpc('get_product_order_summary', {
          start_date: dateRange.startDate,
          end_date: dateRange.endDate
        });

      if (error) {
        throw error;
      }

      // If RPC function doesn't exist, use this fallback query
      if (!data) {
        // Get all orders in the date range
        const { data: orders, error: orderError } = await supabase
          .from('orders')
          .select('id, order_date')
          .gte('order_date', `${dateRange.startDate}T00:00:00.000Z`)
          .lte('order_date', `${dateRange.endDate}T23:59:59.999Z`)
          .eq('status', 'pending')
          .or('status.eq.processing');

        if (orderError) throw orderError;
        if (!orders || orders.length === 0) {
          setSummaryData([]);
          setIsLoading(false);
          return;
        }

        // Get all order items for these orders
        const orderIds = orders.map(order => order.id);
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('product_id, quantity')
          .in('order_id', orderIds);

        if (itemsError) throw itemsError;

        // Aggregate quantities by product
        const productQuantities: Record<string, number> = {};
        orderItems?.forEach(item => {
          if (!productQuantities[item.product_id]) {
            productQuantities[item.product_id] = 0;
          }
          productQuantities[item.product_id] += item.quantity;
        });

        // Get product details
        const productIds = Object.keys(productQuantities);
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name_en, unit, sku');

        if (productsError) throw productsError;

        // Create summary data
        const summary = products?.map(product => ({
          id: product.id,
          name_en: product.name_en,
          unit: product.unit,
          sku: product.sku,
          total_quantity: productQuantities[product.id] || 0,
        })) || [];

        setSummaryData(summary);
      } else {
        // If the RPC function exists, use its result
        setSummaryData(data);
      }
    } catch (error: any) {
      console.error('Error fetching summary data:', error);
      setError(error.message || t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle date range change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSummaryData();
  };

  // Handle PDF export
  const handleExportPDF = () => {
    try {
      if (summaryData.length === 0) {
        toast.warning('No data to export. Please adjust your date range.');
        return;
      }

      exportOrderSummaryToPDF({
        title: 'Order Summary Report',
        dateRange: dateRange,
        data: summaryData,
        companyName: appSettings?.company_name || 'B2B Vegetable Management System',
        generatedBy: 'Admin Dashboard'
      });

      toast.success('PDF exported successfully!');
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF. Please try again.');
    }
  };

  // Handle delivery filter
  const handleDeliveryFilter = (type: 'today' | 'tomorrow' | null) => {
    setDeliveryFilter(type);

    if (!type) {
      // Clear filter - reset to default date range
      setDateRange({
        startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      });
      return;
    }

    const dateRange = getOrderFilterRangeByDelivery(
      type,
      appSettings?.order_cutoff_time || '18:00',
      appSettings?.delivery_days || [1, 2, 3, 4, 5, 6]
    );

    if (dateRange) {
      setDateRange({
        startDate: dateRange.from.toISOString().split('T')[0],
        endDate: dateRange.to.toISOString().split('T')[0],
      });
    }
  };

  // Handle clearing all filters
  const handleClearFilters = () => {
    setDeliveryFilter(null);
    setDateRange({
      startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    });
  };

  // Loading state
  if (isLoading && summaryData.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 p-4 lg:p-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
          <p className="text-sm font-medium text-gray-700">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50/80 backdrop-blur-lg rounded-lg shadow-2xl border border-red-200/20 p-4 lg:p-6">
        <div className="flex items-center">
          <svg className="w-4 h-4 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 font-medium text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <RouteProtection>
      <style jsx>{`
        .print-area {
          @media print {
            margin: 0;
            padding: 0;
            box-shadow: none;
            border: none;
            background: white !important;
          }
        }
        
        .no-print {
          @media print {
            display: none !important;
          }
        }
        
        .print-header {
          @media print {
            display: block !important;
          }
        }
      `}</style>
      <div className="space-y-4">
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
            <div className="mt-4 lg:mt-0 flex items-center space-x-2 text-xs text-gray-500">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{summaryData.length} products tracked</span>
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 p-4 lg:p-6 no-print">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-4 h-4 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Date Range Filter
          </h2>

          {/* Delivery Filter Buttons */}
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => handleDeliveryFilter('today')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${deliveryFilter === 'today'
                  ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 border-2 border-transparent'
                }`}
            >
              {t('todayDeliveries')}
            </button>
            <button
              onClick={() => handleDeliveryFilter('tomorrow')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${deliveryFilter === 'tomorrow'
                  ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 border-2 border-transparent'
                }`}
            >
              {t('tomorrowDeliveries')}
            </button>
            {deliveryFilter && (
              <button
                onClick={() => handleDeliveryFilter(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200"
              >
                {t('clearDeliveryFilter')}
              </button>
            )}
          </div>

          {/* Existing date range form */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-xs font-medium text-gray-700 mb-1">
                {t('startDate')}
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-xs font-medium text-gray-700 mb-1">
                {t('endDate')}
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm"
              />
            </div>

            <div className="lg:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    <span>Filtering...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                    </svg>
                    <span>{t('filter')}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Clear filters button */}
          {(deliveryFilter) && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={handleClearFilters}
                className="flex items-center text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t('clearFilters')}
              </button>
            </div>
          )}
        </div>

        {/* Summary Content */}
        <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 overflow-hidden print-area">
          <div className="px-4 lg:px-6 py-4 border-b border-gray-100">
            {/* Print Header - Only visible when printing */}
            <div className="print-header hidden mb-4">
              <h1 className="text-xl font-bold text-gray-900 mb-2">{appSettings?.company_name || 'B2B Vegetable Management System'}</h1>
              <h2 className="text-base font-semibold text-gray-800 mb-2">Order Summary Report</h2>
              <p className="text-gray-600 mb-1 text-sm">
                Date Range: {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
              </p>
              <p className="text-gray-600 text-xs">
                Generated on: {new Date().toLocaleString()} | Total Products: {summaryData.length}
              </p>
              <hr className="mt-3 mb-3" />
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base lg:text-base font-bold text-gray-900">{t('productQuantitiesSummary')}</h2>
                <p className="text-gray-600 mt-1 text-sm">{t('totalQuantitiesNeeded')}</p>
              </div>
              <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row gap-2 no-print">
                <button
                  onClick={handleExportPDF}
                  disabled={summaryData.length === 0}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export PDF</span>
                </button>
              </div>
            </div>
          </div>

          {summaryData.length === 0 ? (
            <div className="p-8 text-center">
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 font-medium text-sm mb-2">{t('noOrdersFound')}</p>
                <p className="text-gray-400 text-xs">Try adjusting your date range to see more data</p>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden">
                <div className="divide-y divide-gray-100">
                  {summaryData.map((product) => (
                    <div key={product.id} className="p-4 hover:bg-emerald-50/50 transition-colors duration-200">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">{product.name_en}</h4>
                            {product.sku && (
                              <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                            )}
                          </div>
                          <div className="ml-3 text-right">
                            <div className="text-xl font-bold text-emerald-600">{product.total_quantity}</div>
                            <div className="text-xs text-gray-500">{product.unit}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('product')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('sku')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('totalQuantity')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 divide-y divide-gray-100">
                    {summaryData.map((product) => (
                      <tr key={product.id} className="hover:bg-emerald-50/50 transition-colors duration-200">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs font-semibold text-gray-900">
                            {product.name_en}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-600">
                            {product.sku || t('notAvailable')}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <span className="text-xl font-bold text-emerald-600">{product.total_quantity}</span>
                            <span className="text-xs text-gray-500 font-medium">{product.unit}</span>
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
    </RouteProtection>
  );
} 