'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import RouteProtection from '../../../components/RouteProtection';
import { getAllOrders, Order, updateOrderStatus, assignDriverToOrder, getOrderById } from '../../../lib/order-api';
import { getAppSettings, AppSettings } from '../../../lib/settings-api';
import { getOrderFilterRangeByDelivery, getNextDeliveryDate, formatDate } from '../../../lib/utils';
import { getDrivers } from '../../../lib/driver-api';
import OrderDetailModal from './OrderDetailModal';
import toast from 'react-hot-toast';
import Loading from '@/app/components/Loading';
import Pagination from '@/app/components/Pagination';





export default function OrdersPage() {
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [deliveryFilter, setDeliveryFilter] = useState<'today' | 'tomorrow' | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
  };

  // Get next delivery date based on settings

  // Add state for detail modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  
  // Add loading states for status and driver updates
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [assigningDriver, setAssigningDriver] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isSearching) {
        setCurrentPage(1);
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, isSearching]);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsSearching(true);
  };

  // Fetch settings, orders, and drivers
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Get settings if not loaded yet
        if (!settings) {
          const loadedSettings = await getAppSettings();
          setSettings(loadedSettings);
        }

        // Get date range for delivery filter
        let dateRange = null;
        if (deliveryFilter) {
          dateRange = getOrderFilterRangeByDelivery(
            deliveryFilter,
            settings?.order_cutoff_time || '18:00',
            settings?.delivery_days || [1, 2, 3, 4, 5, 6]
          );
        }

        // Get orders with pagination
        const result = await getAllOrders({
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
          sortBy: 'order_date',
          sortDirection: 'desc',
          status: statusFilter ? statusFilter as any : undefined,
          search: searchQuery,
          dateRange: dateRange ? {
            from: dateRange.from.toISOString(),
            to: dateRange.to.toISOString()
          } : undefined
        });
        setOrders(result.orders);
        setTotalPages(Math.ceil(result.count / itemsPerPage));
        setTotalCount(result.count);
        setTotalOrders(result.count);

        // Get available drivers
        const driversData = await getDrivers();
        setDrivers(driversData);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || t('loadingError'));
      } finally {
        setLoading(false);
      }
    }

    if (!isSearching) {
      fetchData();
    }
  }, [currentPage, statusFilter, itemsPerPage, searchQuery, isSearching, t, settings, deliveryFilter]);

  // Format date for display


  // Handle status update
  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      setUpdatingStatus(orderId);
      const updatedOrder = await updateOrderStatus(orderId, newStatus);
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? updatedOrder : order
        )
      );
      toast.success(t('statusUpdateSuccess', { status: t(`status.${newStatus}`) }));
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast.error(t('statusUpdateError'));
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Handle driver assignment
  const handleAssignDriver = async (orderId: string, driverId: string) => {
    try {
      setAssigningDriver(orderId);
      const updatedOrder = await assignDriverToOrder(orderId, driverId);
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? updatedOrder : order
        )
      );
      toast.success(t('driverAssignSuccess'));
    } catch (err: any) {
      console.error('Error assigning driver:', err);
      toast.error(t('driverAssignError'));
    } finally {
      setAssigningDriver(null);
    }
  };

  // Add a function to open the order detail modal
  const handleViewDetails = async (orderId: string) => {
    try {
      setLoadingOrderDetails(true);
      const orderDetails = await getOrderById(orderId);
      setSelectedOrder(orderDetails);
      setDetailModalOpen(true);
    } catch (err: any) {
      console.error('Error fetching order details:', err);
      alert(`${t('orderDetailsError')}: ${err.message}`);
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  // Calculate total pages

  // Handle clearing all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  // Get status badge styling
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

  // Handle delivery filter
  const handleDeliveryFilter = async (type: 'today' | 'tomorrow' | null) => {
    setDeliveryFilter(type);
    setCurrentPage(1);
    
    if (!type) {
      // Clear filter
      setSearchQuery('');
      setStatusFilter('');
      return;
    }

    const dateRange = getOrderFilterRangeByDelivery(
      type,
      settings?.order_cutoff_time || '18:00',
      settings?.delivery_days || [1, 2, 3, 4, 5, 6]
    );

    if (dateRange) {
      try {
        const result = await getAllOrders({
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
          sortBy: 'order_date',
          sortDirection: 'desc',
          status: statusFilter ? statusFilter as any : undefined,
          search: searchQuery,
          dateRange: {
            from: dateRange.from.toISOString(),
            to: dateRange.to.toISOString()
          }
        });
        setOrders(result.orders);
        setTotalOrders(result.count);
        setTotalCount(result.count);
        
      } catch (err) {
        console.error('Error filtering orders:', err);
        toast.error(t('loadingError'));
      }
    }
  };

  // Loading state
  if (loading && orders.length === 0) {
    return (
      <Loading />
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
          <p className="text-red-700 font-medium text-sm">{t('loadingError')}: {error}</p>
        </div>
      </div>
    );
  }
  // Wait for settings to be loaded before rendering
  if (!settings) {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <p className="text-base font-medium text-gray-700">{t('loading')}</p>
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
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {t('title')}
              </h1>
              <p className="mt-1 text-gray-600 text-base">
                Manage customer orders and track delivery status
              </p>
            </div>
            <div className="mt-4 lg:mt-0 flex items-center space-x-2 text-xs text-gray-500">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <span>{t('totalOrders', { total: totalOrders })}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 p-4 lg:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label htmlFor="search-filter" className="block text-xs font-medium text-gray-700 mb-1">
                {t('search')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="search-filter"
                  type="text"
                  className="block w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white/50 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                {isSearching && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="animate-spin h-3 w-3 border-2 border-emerald-500 rounded-full border-t-transparent"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="block text-xs font-medium text-gray-700 mb-1">
                {t('filterByStatus')}
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm"
              >
                <option value="">{t('allOrders')}</option>
                <option value="pending">{t('status.pending')}</option>
                <option value="processing">{t('status.processing')}</option>
                <option value="completed">{t('status.completed')}</option>
                <option value="cancelled">{t('status.cancelled')}</option>
              </select>
            </div>
          </div>

          {/* Delivery Filter Buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => handleDeliveryFilter('today')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                deliveryFilter === 'today'
                  ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 border-2 border-transparent'
              }`}
            >
              {t('todayDeliveries')}
            </button>
            <button
              onClick={() => handleDeliveryFilter('tomorrow')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                deliveryFilter === 'tomorrow'
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

          {/* Clear filters button */}
          {(searchQuery || statusFilter || deliveryFilter) && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  handleClearFilters();
                  handleDeliveryFilter(null);
                }}
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

        {/* Orders Content */}
        {orders.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 p-8">
            <div className="text-center">
              {searchQuery || statusFilter || deliveryFilter ? (
                <div>
                  <svg
                    className="h-12 w-12 text-gray-400 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 font-medium text-base mb-3">{t('noOrdersFound')}</p>
                  <button
                    onClick={() => {
                      handleClearFilters();
                      handleDeliveryFilter(null);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg font-medium text-sm"
                  >
                    {t('clearAllFilters')}
                  </button>
                </div>
              ) : (
                <div>
                  <svg
                    className="h-12 w-12 text-gray-400 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-600 font-medium text-base">{t('noOrdersYet')}</p>
                  <p className="text-gray-500 mt-1 text-sm">{t('noOrdersDescription')}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 overflow-hidden">
              {/* Mobile Card View */}
              <div className="block lg:hidden">
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900">{t('orders')}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {orders.map((order, index) => (
                    <div key={order.id} className="p-4 hover:bg-emerald-50/50 transition-colors duration-200">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-gray-500">STT</p>
                            <p className="font-semibold text-gray-900 text-sm">#{((currentPage - 1) * itemsPerPage) + index + 1}</p>
                          </div>
                          <span className={getStatusBadge(order.status)}>
                            {t(`status.${order.status}`)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="font-medium text-gray-500">{t('date')}:</p>
                            <p className="text-gray-900">{formatDate(order.order_date)}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-500">{t('total')}:</p>
                            <p className="text-gray-900 font-semibold">${order.total_amount.toFixed(2)}</p>
                          </div>
                        </div>

                        <div>
                          <p className="font-medium text-gray-500 text-xs">{t('customer')}:</p>
                          <p className="text-gray-900">{order.customer?.email || (order.user_id ? order.user_id : t('guestOrder'))}</p>
                          <p className="text-gray-500 text-xs mt-1">{order.delivery_address}</p>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">{tCommon('labels.status')}</label>
                            <select
                              className="block w-full min-w-[140px] px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              value={order.status}
                              onChange={(e) => handleStatusUpdate(order.id!, e.target.value as Order['status'])}
                              disabled={updatingStatus === order.id}
                            >
                              <option value="pending">{t('status.pending')}</option>
                              <option value="processing">{t('status.processing')}</option>
                              <option value="completed">{t('status.completed')}</option>
                              <option value="cancelled">{t('status.cancelled')}</option>
                            </select>
                          </div>

                          <div className='min-w-[140px]'>
                            <label className="block text-xs font-medium text-gray-500 mb-1">{t('driver')}</label>
                            <select
                              className="block w-full min-w-[140px] px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              value={order.assigned_driver_id || ''}
                              onChange={(e) => handleAssignDriver(order.id!, e.target.value)}
                              disabled={assigningDriver === order.id}
                            >
                              <option value="">{t('notAssigned')}</option>
                              {drivers.map((driver) => (
                                <option key={driver.id} value={driver.id}>
                                  {driver.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <button
                          className="w-full px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors font-medium text-sm"
                          onClick={() => handleViewDetails(order.id!)}
                        >
                          {t('viewDetails')}
                        </button>
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
                      <th scope="col" className="px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        STT
                      </th>
                      <th scope="col" className="px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('date')}
                      </th>
                      <th scope="col" className="px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('deliveryDate')}
                      </th>
                      <th scope="col" className="px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('customer')}
                      </th>
                      {/* <th scope="col" className="px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      {t('total')}
                    </th> */}
                      <th scope="col" className="px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {tCommon('labels.status')}
                      </th>
                      <th scope="col" className="px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('driver')}
                      </th>
                      <th scope="col" className="px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 divide-y divide-gray-100">
                    {orders.map((order, index) => (
                      <tr key={order.id} className="hover:bg-emerald-50/50 transition-colors duration-200">
                        <td className="px-6 py-2 whitespace-nowrap text-sm font-semibold text-gray-900">
                          #{((currentPage - 1) * itemsPerPage) + index + 1}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(order.order_date)}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-600">
                          {order.delivery_date != null
                            ? formatDate(order.delivery_date)
                            : formatDate(getNextDeliveryDate(
                                new Date(order.order_date),
                                settings?.order_cutoff_time,
                                settings?.delivery_days
                              ).toISOString())}
                        </td>
                        <td className="px-6 py-2 text-sm text-gray-600 max-w-xs">
                          <div className="font-medium text-gray-900">{order.customer?.email || (order.user_id ? order.user_id : t('guestOrder'))}</div>
                          <div className="text-xs text-gray-500 truncate">{order.delivery_address}</div>
                        </td>
                        {/* <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        ${order.total_amount.toFixed(2)}
                      </td> */}
                        <td className="px-6 py-2 whitespace-nowrap">
                          <select
                            className={`min-w-[120px] px-3 py-1.5 text-xs font-medium rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                  order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                    'bg-red-100 text-red-800'
                              }`}
                            value={order.status}
                            onChange={(e) => handleStatusUpdate(order.id!, e.target.value as Order['status'])}
                          >
                            <option value="pending">{t('status.pending')}</option>
                            <option value="processing">{t('status.processing')}</option>
                            <option value="completed">{t('status.completed')}</option>
                            <option value="cancelled">{t('status.cancelled')}</option>
                          </select>
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm">
                          <select
                            className="block w-full min-w-[160px] px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            value={order.assigned_driver_id || ''}
                            onChange={(e) => handleAssignDriver(order.id!, e.target.value)}
                            disabled={assigningDriver === order.id}
                          >
                            <option value="">{t('notAssigned')}</option>
                            {drivers.map((driver) => (
                              <option key={driver.id} value={driver.id}>
                                {driver.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm font-medium">
                          <button
                            className="text-emerald-600 hover:text-emerald-900 p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                            onClick={() => handleViewDetails(order.id!)}
                            title={t('viewDetails')}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={handleItemsPerPageChange}
              t={tCommon}
              itemName="orders"
            />
          </>
        )}
        

        {/* Order Detail Modal */}
        {detailModalOpen && selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => {
              console.log('onClose');
              setDetailModalOpen(false);
              setSelectedOrder(null);
            }}
          />
        )}

        {/* Loading overlay for order details */}
        {loadingOrderDetails && (
          <Loading />
        )}
      </div>
    </RouteProtection>
  );
} 