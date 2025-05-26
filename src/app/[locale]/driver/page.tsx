'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getUser, UserProfile, getUserProfile } from '../../lib/auth';
import { getDriverOrders, Order, updateOrderStatus } from '../../lib/order-api';
import Header from '../../components/Header';
import DriverDeliveryModal from '../../components/DriverDeliveryModal';

export default function DriverDeliveriesPage() {
  const router = useRouter();
  const t = useTranslations('driver');
  const tCommon = useTranslations('labels');
  const tActions = useTranslations('actions');
  
  // User data states
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<Order[]>([]);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Detail modal state
  const [selectedDelivery, setSelectedDelivery] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Status update state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');

  // Fetch user data and assigned deliveries on component mount
  useEffect(() => {
    async function fetchUserData() {
      try {
        setIsLoading(true);
        
        // Get current authenticated user
        const userData = await getUser();
        if (!userData) {
          // Redirect to login if not logged in
          router.push('/login');
          return;
        }
        
        setUser(userData);
        
        // Get user profile
        const profile = await getUserProfile(userData.id);
        setUserProfile(profile);
        
        // Check if user is a driver
        if (profile?.role !== 'driver') {
          alert(t('accessDenied'));
          router.push('/store');
          return;
        }
        
        // Get driver assigned orders
        const driverDeliveries = await getDriverOrders(userData.id);
        setDeliveries(driverDeliveries);
      } catch (error) {
        console.error('Error fetching driver data:', error);
        setUpdateError(t('loadingError'));
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserData();
  }, [router, t]);
  
  // Filter deliveries based on search term and status filter
  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = searchTerm === '' || 
      (delivery.customer?.email && delivery.customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (delivery.delivery_address && delivery.delivery_address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (delivery.customer?.name && delivery.customer.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Handle opening delivery detail modal
  const handleOpenDeliveryDetail = (delivery: Order) => {
    setSelectedDelivery(delivery);
    setIsDetailModalOpen(true);
  };
  
  // Handle closing delivery detail modal
  const handleCloseDeliveryDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedDelivery(null);
  };
  
  // Handle delivery status update
  const handleUpdateStatus = async (deliveryId: string, newStatus: Order['status']) => {
    try {
      setIsUpdatingStatus(true);
      setUpdateError('');
      setUpdateSuccess('');
      
      // Update the order status
      const updatedOrder = await updateOrderStatus(deliveryId, newStatus);
      
      // Update deliveries list
      setDeliveries(prev => 
        prev.map(delivery => 
          delivery.id === deliveryId ? updatedOrder : delivery
        )
      );
      
      setUpdateSuccess(t('statusUpdateSuccess', { status: t(newStatus) }));
      
      // Clear success message after a delay
      setTimeout(() => {
        setUpdateSuccess('');
      }, 3000);
    } catch (error: any) {
      console.error('Error updating delivery status:', error);
      setUpdateError(error.message || t('statusUpdateError'));
    } finally {
      setIsUpdatingStatus(false);
    }
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

  // Get delivery statistics
  const getDeliveryStats = () => {
    const total = deliveries.length;
    const pending = deliveries.filter(d => d.status === 'pending').length;
    const processing = deliveries.filter(d => d.status === 'processing').length;
    const completed = deliveries.filter(d => d.status === 'completed').length;
    
    return { total, pending, processing, completed };
  };

  const stats = getDeliveryStats();

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8">
          <div className="container mx-auto px-4">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                <p className="text-lg font-medium text-gray-700">{tCommon('loading')}</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8">
        <div className="container mx-auto px-4 space-y-6">
          
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {t('title')}
                </h1>
                <p className="mt-2 text-gray-600 text-lg">
                  {t('subtitle')}
                </p>
                {userProfile && (
                  <p className="mt-1 text-sm text-gray-500">
                    {t('welcomeBack', { name: userProfile.name || 'Driver' })}
                  </p>
                )}
              </div>
              <div className="mt-4 lg:mt-0 flex items-center space-x-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <span>{stats.total} {t('totalDeliveries')}</span>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('totalDeliveries')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-gradient-to-r from-yellow-500 to-orange-600">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('pendingDeliveries')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('inProgressDeliveries')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.processing}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('completedDeliveries')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Search */}
              <div className="lg:col-span-2">
                <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  {tActions('search')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="search-filter"
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-2xl leading-5 bg-white/50 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    placeholder={t('searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Status Filter */}
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('filterByStatus')}
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full min-w-[160px] px-4 py-3 border border-gray-300 rounded-2xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                >
                  <option value="all">{t('allStatuses')}</option>
                  <option value="pending">{t('pending')}</option>
                  <option value="processing">{t('processing')}</option>
                  <option value="completed">{t('completed')}</option>
                  <option value="cancelled">{t('cancelled')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {updateSuccess && (
            <div className="bg-emerald-50/80 backdrop-blur-lg rounded-2xl shadow-xl border border-emerald-200/20 p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-emerald-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-emerald-700 font-medium">{updateSuccess}</p>
              </div>
            </div>
          )}
          
          {updateError && (
            <div className="bg-red-50/80 backdrop-blur-lg rounded-2xl shadow-xl border border-red-200/20 p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 font-medium">{updateError}</p>
              </div>
            </div>
          )}

          {/* Deliveries Content */}
          {filteredDeliveries.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-12">
              <div className="text-center">
                <svg 
                  className="h-16 w-16 text-gray-400 mx-auto mb-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-600 font-medium text-lg mb-4">
                  {searchTerm || statusFilter !== 'all' ? t('noDeliveriesFound') : t('noDeliveriesYet')}
                </p>
                {searchTerm || statusFilter !== 'all' ? (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg font-medium"
                  >
                    {t('clearFilters')}
                  </button>
                ) : (
                  <p className="text-gray-500">{t('noDeliveriesDescription')}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              {/* Mobile Card View */}
              <div className="block lg:hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">{t('deliveries')}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {filteredDeliveries.map((delivery) => (
                    <div key={delivery.id} className="p-6 hover:bg-emerald-50/50 transition-colors duration-200">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-500">{t('orderId')}</p>
                            <p className="font-semibold text-gray-900">{delivery.id?.substring(0, 8)}...</p>
                          </div>
                          <span className={getStatusBadge(delivery.status)}>
                            {t(delivery.status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-500">{tCommon('date')}:</p>
                            <p className="text-gray-900">{delivery.order_date ? new Date(delivery.order_date).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-500">{t('items')}:</p>
                            <p className="text-gray-900 font-semibold">{delivery.items?.length || 0}</p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="font-medium text-gray-500 text-sm">{t('customer')}:</p>
                          <p className="text-gray-900">
                            {delivery.customer?.name || t('anonymousCustomer')}
                          </p>
                          {delivery.delivery_address && (
                            <p className="text-gray-500 text-xs mt-1 truncate">{delivery.delivery_address}</p>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleOpenDeliveryDetail(delivery)}
                            className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors font-medium text-sm"
                          >
                            {tActions('view')}
                          </button>
                          
                          {delivery.status === 'pending' && (
                            <button
                              onClick={() => delivery.id && handleUpdateStatus(delivery.id, 'processing')}
                              disabled={isUpdatingStatus || !delivery.id}
                              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors font-medium text-sm disabled:opacity-50"
                            >
                              {t('startDelivery')}
                            </button>
                          )}
                          
                          {delivery.status === 'processing' && (
                            <button
                              onClick={() => delivery.id && handleUpdateStatus(delivery.id, 'completed')}
                              disabled={isUpdatingStatus || !delivery.id}
                              className="px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors font-medium text-sm disabled:opacity-50"
                            >
                              {t('markDelivered')}
                            </button>
                          )}
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
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('customer')}
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {tCommon('date')}
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {tCommon('status')}
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('items')}
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {tCommon('actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 divide-y divide-gray-100">
                    {filteredDeliveries.map((delivery) => (
                      <tr key={delivery.id} className="hover:bg-emerald-50/50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {delivery.customer?.profile_image ? (
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={delivery.customer.profile_image}
                                  alt={delivery.customer.name || ''}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-500 text-sm font-medium">
                                    {(delivery.customer?.name || 'U').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {delivery.customer?.name || t('anonymousCustomer')}
                              </div>
                              {delivery.customer?.phone && (
                                <div className="text-sm text-gray-500">
                                  <a href={`tel:${delivery.customer.phone}`} className="hover:text-emerald-600">
                                    {delivery.customer.phone}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {delivery.order_date ? new Date(delivery.order_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadge(delivery.status)}>
                            {t(delivery.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {delivery.items?.length || 0} {t('itemsCount')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleOpenDeliveryDetail(delivery)}
                              className="text-emerald-600 hover:text-emerald-900 p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                              title={tActions('view')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            
                            {delivery.status === 'pending' && (
                              <button
                                onClick={() => delivery.id && handleUpdateStatus(delivery.id, 'processing')}
                                disabled={isUpdatingStatus || !delivery.id}
                                className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                title={t('startDelivery')}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                </svg>
                              </button>
                            )}
                            
                            {delivery.status === 'processing' && (
                              <button
                                onClick={() => delivery.id && handleUpdateStatus(delivery.id, 'completed')}
                                disabled={isUpdatingStatus || !delivery.id}
                                className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title={t('markDelivered')}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Delivery Detail Modal */}
          {isDetailModalOpen && selectedDelivery && (
            <DriverDeliveryModal
              delivery={selectedDelivery}
              onClose={handleCloseDeliveryDetail}
              onUpdateStatus={handleUpdateStatus}
              isUpdatingStatus={isUpdatingStatus}
            />
          )}
        </div>
      </div>
    </>
  );
} 