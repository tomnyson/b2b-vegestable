'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import { getUser, updateUserProfile, UserProfile } from '../../lib/auth';
import { getUserOrders, Order, getOrderById, cancelOrder, generateInvoice } from '../../lib/order-api';
import { getCustomerDetailsFromAuth, CustomerDetails, getUserAddresses } from '../../lib/customer-api';
// import { getProductById } from '../../lib/product-api'; // Not used in the provided code
import Header from '../../components/Header';
import OrderDetailModal from '../../components/OrderDetailModal';
import InvoicesTab from './InvoicesTab'; // Assuming InvoicesTab.tsx exists in the same directory
import { Switch } from '@headlessui/react';
import type { User } from '@supabase/supabase-js';

// Address suggestion interface
interface AddressSuggestion {
  name: string;
  address: string;
  longitude?: number;
  latitude?: number;
}

// TabType definition
type TabType = 'profile' | 'orders' | 'invoices' | 'notifications';

// Notification settings type
interface NotificationSettings {
  orderUpdates: boolean;
  promotions: boolean;
  newProducts: boolean;
  newsletter: boolean;
}

// Types





interface Address {
  id: string;
  address: string;
  isDefault: boolean;
  longitude?: number;
  latitude?: number;
}



export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('profile');

  // User data states
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    // address: '', // This seems to be superseded by the addresses array
  });

  // Multiple addresses state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editAddress, setEditAddress] = useState('');

  // Address suggestion states
  // const [addressQuery, setAddressQuery] = useState(''); // Combined with newAddress for simplicity of input
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Newsletter and notification settings
  const [newsLetterSubscribed, setNewsLetterSubscribed] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    orderUpdates: true, // Default to true as per original code
    promotions: false,
    newProducts: false,
    newsletter: false // Aligned with newsLetterSubscribed state
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Active tab state - initialize from URL parameter
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Order detail modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [orderActionLoading, setOrderActionLoading] = useState(false);
  const [orderActionError, setOrderActionError] = useState('');
  const [orderActionSuccess, setOrderActionSuccess] = useState('');
  const [initialModalTab, setInitialModalTab] = useState<'details' | 'invoice'>('details');

  // Buy Again state
  const [isBuyingAgain, setIsBuyingAgain] = useState(false);
  const [buyAgainSuccess, setBuyAgainSuccess] = useState('');
  const [buyAgainError, setBuyAgainError] = useState('');

  // Add state for temporarily storing coordinates
  const [addressCoordinates, setAddressCoordinates] = useState<{
    longitude?: number;
    latitude?: number;
  }>({});

  // Handle URL parameter changes
  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam && ['profile', 'orders', 'invoices', 'notifications'].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
    } else if (tabParam) { // If tab param exists but is invalid, default to profile
      setActiveTab('profile');
      router.replace(`/${locale}/profile`); // Optional: clean URL
    }
  }, [searchParams, locale, router]);

  // Fetch user data on component mount
  useEffect(() => {
    async function fetchUserData() {
      try {
        setIsLoading(true);

        const userData = await getUser();
        if (!userData) {
          router.push(`/${locale}/login`);
          return;
        }

        setUser(userData);

        const details = await getCustomerDetailsFromAuth(userData);
        if (details) {
          setCustomerDetails(details);
          setFormData({
            name: details.name || '',
            email: details.email || '', // email comes from auth usually, but details can supplement
            phone: details.phone || '',
          });

          // Initialize addresses from customer details if available
          const userAddresses = await getUserAddresses(userData.id);
          if (userAddresses) {
            setAddresses(userAddresses);
          }

          setNewsLetterSubscribed(details.newsletter_subscribed || false);
          setNotificationSettings({
            orderUpdates: details.notifications?.orderUpdates ?? true,
            promotions: details.notifications?.promotions ?? false,
            newProducts: details.notifications?.newProducts ?? false,
            newsletter: details.newsletter_subscribed ?? false,
          });
        }

        const orders = await getUserOrders(userData.id);
        setUserOrders(orders);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error(t('messages.fetchError'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, [router, locale, t]); // t added as it's used in error toast

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle checkbox changes for notification settings
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => { // This handler was not used in the original JSX for Switch, Switch has its own onChange.
    const { name, checked } = e.target; // Keeping it in case it's used elsewhere or for future regular checkboxes

    if (name === 'newsletter') { // This specific name 'newsletter' seems to relate to a direct boolean state
      setNewsLetterSubscribed(checked);
      setNotificationSettings(prev => ({ ...prev, newsletter: checked })); // Sync with notificationSettings
    } else {
      setNotificationSettings(prev => ({
        ...prev,
        [name as keyof NotificationSettings]: checked // Type assertion
      }));
    }
  };

  // Handle input change for new address with suggestions
  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setNewAddress(query);
    // setAddressQuery(query); // Removed as newAddress serves this purpose

    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    if (query.length > 2) {
      suggestionTimeoutRef.current = setTimeout(() => {
        fetchAddressSuggestions(query);
      }, 500);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const fetchAddressSuggestions = async (query: string) => {
    if (query.length < 3) return;

    try {
      setIsSearching(true);
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();

      if (data && data.features) {
        const addressSuggestions: AddressSuggestion[] = data.features
          .filter((feature: any) => feature.properties.name)
          .map((feature: any) => {
            const props = feature.properties;
            const parts = [
              props.name, props.street, props.housenumber, props.postcode, props.city, props.state, props.country
            ].filter(Boolean);

            const coordinates = feature.geometry?.coordinates || [];
            return {
              name: props.name,
              address: parts.join(', '),
              longitude: coordinates[0],
              latitude: coordinates[1]
            };
          });

        setSuggestions(addressSuggestions);
        setShowSuggestions(addressSuggestions.length > 0);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      toast.error(t('messages.addressSuggestionError'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setNewAddress(suggestion.address);
    setAddressCoordinates({
      longitude: suggestion.longitude,
      latitude: suggestion.latitude
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAddAddress = () => {
    if (!newAddress.trim()) return;

    const newId = `addr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const isDefault = addresses.length === 0;

    setAddresses(prev => [...prev, {
      id: newId,
      address: newAddress,
      isDefault,
      longitude: addressCoordinates.longitude,
      latitude: addressCoordinates.latitude
    }]);

    setNewAddress('');
    // setAddressQuery(''); // Not needed
    setSuggestions([]);
    setShowSuggestions(false);
    setAddressCoordinates({});

          toast.success(t('messages.addressAdded'));
  };

  const handleRemoveAddress = (id: string) => {
    setAddresses(prev => {
      const updated = prev.filter(addr => addr.id !== id);
      if (updated.length > 0 && !updated.some(addr => addr.isDefault)) {
        updated[0].isDefault = true; // Ensure one address is always default if list not empty
      }
      return updated;
    });
          toast.info(t('messages.addressDeleted'));
  };

  const handleSetDefaultAddress = (id: string) => {
    setAddresses(prev => prev.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
          toast.success(t('messages.defaultAddressSet'));
  };

  const handleStartEditAddress = (id: string) => {
    const addressToEdit = addresses.find(addr => addr.id === id);
    if (addressToEdit) {
      setEditingAddressId(id);
      setEditAddress(addressToEdit.address);
      setAddressCoordinates({ // Pre-fill coordinates for editing
        longitude: addressToEdit.longitude,
        latitude: addressToEdit.latitude
      });
    }
  };

  const handleEditAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setEditAddress(newValue);

    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    if (newValue.length > 2) {
      suggestionTimeoutRef.current = setTimeout(() => {
        fetchAddressCoordinates(newValue); // Fetches coordinates for the new text
      }, 500);
    }
  };

  const fetchAddressCoordinates = async (address: string) => { // For editor
    if (address.length < 3) {
      setAddressCoordinates({}); // Clear if address is too short
      return;
    }

    try {
      setIsSearching(true); // Consider a different loading state for this specific input if needed
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1`);
      const data = await response.json();

      if (data && data.features && data.features.length > 0) {
        const coordinates = data.features[0].geometry?.coordinates || [];
        setAddressCoordinates({
          longitude: coordinates[0],
          latitude: coordinates[1]
        });
      } else {
        setAddressCoordinates({}); // No coordinates found
      }
    } catch (error) {
      console.error('Error fetching address coordinates:', error);
      setAddressCoordinates({}); // Error, clear coordinates
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveEditAddress = () => {
    if (!editingAddressId || !editAddress.trim()) return;

    setAddresses(prev => prev.map(addr =>
      addr.id === editingAddressId
        ? {
          ...addr,
          address: editAddress,
          longitude: addressCoordinates.longitude, // Use newly fetched/updated coordinates
          latitude: addressCoordinates.latitude
        }
        : addr
    ));

    setEditingAddressId(null);
    setEditAddress('');
    setAddressCoordinates({});
          toast.success(t('messages.addressUpdated'));
  };

  const handleCancelEditAddress = () => {
    setEditingAddressId(null);
    setEditAddress('');
    setAddressCoordinates({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSaving(true);
      setSaveSuccess(false);
      setSaveError('');

      const defaultAddress = addresses.find(addr => addr.isDefault);

      // Prepare UserProfile update payload
      const profileUpdateData: Partial<UserProfile> = { // Use Partial for flexibility
        name: formData.name,
        phone: formData.phone,
        address: defaultAddress?.address || '', // Main address string for compatibility if needed
        // longitude: defaultAddress?.longitude, // If main longitude/latitude are still needed
        // latitude: defaultAddress?.latitude,  // on the root UserProfile object
        addresses: addresses, // Full list of addresses
        newsletter_subscribed: newsLetterSubscribed,
        notifications: notificationSettings
      };

      await updateUserProfile(user.id, profileUpdateData);

      setSaveSuccess(true);
      toast.success(t('messages.saveSuccess'));

      // Refresh customer details to reflect changes
      const updatedDetails = await getCustomerDetailsFromAuth(user);
      if (updatedDetails) {
        setCustomerDetails(updatedDetails);
        // Optionally re-sync addresses if server modifies them
        if (updatedDetails.addresses && Array.isArray(updatedDetails.addresses)) {
          setAddresses(updatedDetails.addresses);
        }
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error.message || t('errors.updateProfileFailed');
      setSaveError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenOrderDetail = async (orderId: string, initialTab: 'details' | 'invoice' = 'details') => {
    try {
      const orderDetail = await getOrderById(orderId);
      if (orderDetail) {
        setSelectedOrder(orderDetail);
        setInitialModalTab(initialTab);
        setIsDetailModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error(t('orders.fetchDetailError'));
    }
  };

  const handleCloseOrderDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedOrder(null);
    setOrderActionError('');
    setOrderActionSuccess('');
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    if (!orderId) return;
    try {
      setOrderActionLoading(true);
      setOrderActionError('');

      const updatedOrder = await cancelOrder(orderId, reason);

      setUserOrders(prev =>
        prev.map(order =>
          order.id === orderId ? updatedOrder : order
        )
      );

      setSelectedOrder(updatedOrder); // Update the selected order in modal too
      setOrderActionSuccess(t('orders.cancelSuccess'));
      toast.success(t('orders.cancelSuccess'));

      setTimeout(() => {
        // Do not close modal automatically, user might want to see the new status
        // setIsDetailModalOpen(false); 
        // setSelectedOrder(null);
        setOrderActionSuccess(''); // Clear success message after a while
      }, 3000);

    } catch (error: any) {
      console.error('Error cancelling order:', error);
              const msg = error.message || t('orders.cancelError');
        setOrderActionError(msg);
        toast.error(msg);
    } finally {
      setOrderActionLoading(false);
    }
  };

  const handleDownloadInvoice = async (orderId: string): Promise<void> => {
    try {
      await generateInvoice(orderId);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error(t('errors.downloadInvoiceFailed'));
    }
  };

  const handleBuyAgain = async (order: Order) => {
    try {
      setIsBuyingAgain(true);
      setBuyAgainSuccess('');
      setBuyAgainError('');

      let cart: Array<{ product_id: string, quantity: number }> = [];

      for (const item of order.items) {
        if (item.product_id) {
          cart.push({
            product_id: item.product_id,
            quantity: item.quantity
          });
        }
      }

      localStorage.setItem('pendingCart', JSON.stringify(cart));
      setBuyAgainSuccess(t('orders.buyAgainSuccess'));
      toast.success(t('orders.buyAgainSuccess'));

      setTimeout(() => {
        router.push(`/${locale}/store`);
      }, 1500);
    } catch (error: any) {
      console.error('Error adding order to cart:', error);
      const msg = error.message || t('errors.buyAgainFailed');
      setBuyAgainError(msg);
      toast.error(msg);
    } finally {
      // setIsBuyingAgain(false); // Keep it true during redirect
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderAddressInput = () => (
    <div className="mt-3 relative">
      <div className="flex">
        <div className="relative flex-1">
          <input
            type="text"
            value={newAddress}
            onChange={handleAddressInputChange}
            placeholder={t('enterNewAddress')}
            className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddAddress}
          disabled={!newAddress.trim()}
          className="px-4 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
        >
          {t('add')}
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <div>{suggestion.address}</div>
              {suggestion.latitude && suggestion.longitude && (
                <div className="text-xs text-gray-500 mt-1">
                  {t('coordinates')}: {suggestion.latitude.toFixed(4)}, {suggestion.longitude.toFixed(4)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-1 text-xs text-gray-500">
        {t('addressSuggestionHelp')}
      </p>
    </div>
  );

  const renderAddressList = () => (
    <div className="space-y-3 mb-4">
      {addresses.length === 0 ? (
        <p className="text-sm text-gray-500">{t('noAddresses')}</p>
      ) : (
        addresses.map(address => (
          <div key={address.id} className="flex items-start border rounded-md p-3 bg-gray-50">
            {editingAddressId === address.id ? (
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={editAddress}
                    onChange={handleEditAddressChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                  {isSearching && ( /* This spinner is for the global isSearching, might need a specific one */
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                {addressCoordinates.latitude && addressCoordinates.longitude && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t('coordinates')}: {addressCoordinates.latitude.toFixed(4)}, {addressCoordinates.longitude.toFixed(4)}
                  </p>
                )}
                <div className="flex mt-2 space-x-2">
                  <button
                    type="button"
                    onClick={handleSaveEditAddress}
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >
                    {t('save')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEditAddress}
                    className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <p className="text-sm">{address.address}</p>
                  {address.latitude && address.longitude && (
                    <p className="text-xs text-gray-500 mt-1">
                      {t('coordinates')}: {address.latitude.toFixed(4)}, {address.longitude.toFixed(4)}
                    </p>
                  )}
                  {address.isDefault && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                      {t('default')}
                    </span>
                  )}
                </div>
                <div className="flex space-x-2 ml-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEditAddress(address.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {t('edit')}
                  </button>
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultAddress(address.id)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      {t('setDefault')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveAddress(address.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    {t('remove')}
                  </button>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );

  const pageTabs = [
    { id: 'profile' as TabType, label: t('tab') }, // Using tab assuming it's defined for tab label
    { id: 'orders' as TabType, label: t('orders.tab') },
    { id: 'invoices' as TabType, label: t('invoices.tab') },
    { id: 'notifications' as TabType, label: t('notifications.tab') }, // Changed from t('settings') to be consistent
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900">{t('updateTitle')}</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('emailAddress')}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl bg-gray-50/50 text-gray-500 cursor-not-allowed transition-all duration-200"
                        disabled
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{t('emailCannotChange')}</p>
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('fullName')}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('phoneNumber')}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('deliveryAddresses')}
                  </label>
                  {renderAddressList()}
                  {renderAddressInput()}
                </div>

                {saveSuccess && (
                  <div className="bg-emerald-50/80 backdrop-blur-lg rounded-2xl border border-emerald-200/20 p-4 flex items-center">
                    <svg className="w-5 h-5 text-emerald-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-emerald-700 font-medium">{t('updateSuccess')}</p>
                  </div>
                )}
                {saveError && (
                  <div className="bg-red-50/80 backdrop-blur-lg rounded-2xl border border-red-200/20 p-4 flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 font-medium">{saveError}</p>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-2xl text-base font-semibold transition-all duration-200 ${isSaving
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                      }`}
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400 mr-2"></div>
                        {t('saving')}...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {t('saveChanges')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        );
      case 'orders':
        return (
          <div className="space-y-6">
            {/* Buy Again Status Messages */}
            {buyAgainSuccess && (
              <div className="bg-green-50/80 backdrop-blur-lg rounded-2xl border border-green-200/20 p-4 flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-700 font-medium">{buyAgainSuccess}</p>
              </div>
            )}
            {buyAgainError && (
              <div className="bg-red-50/80 backdrop-blur-lg rounded-2xl border border-red-200/20 p-4 flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 font-medium">{buyAgainError}</p>
              </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('orders.title')}</h2>
                {userOrders.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">{t('orders.noOrders')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('labels.orderId')}
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('labels.date')}
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('labels.status')}
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('labels.actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userOrders.map((order) => (
                          <tr key={order.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{order.id?.substring(0, 4)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.order_date
                                ? new Date(order.order_date).toLocaleString(locale, {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                })
                                : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                {t(`orders.status.${order.status}`)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-3">
                                <button
                                  onClick={() => order.id && handleOpenOrderDetail(order.id)}
                                  className="text-emerald-600 hover:text-emerald-900 transition-colors"
                                >
                                  {t('orders.viewDetails')}
                                </button>
                                {order.status === 'completed' && order.items && order.items.length > 0 && (
                                  <button
                                    onClick={() => handleBuyAgain(order)}
                                    disabled={isBuyingAgain}
                                    className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md transition-colors ${isBuyingAgain
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                      }`}
                                    title={t('orders.buyAgain')}
                                  >
                                    {isBuyingAgain ? (
                                      <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400 mr-1"></div>
                                        {t('orders.adding')}
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0H17M9 19.5a1.5 1.5 0 003 0m6 0a1.5 1.5 0 003 0" />
                                        </svg>
                                        {t('orders.buyAgain')}
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'invoices':
        return (
          <InvoicesTab />
        );
      case 'notifications':
        return (
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">{t('notifications.title')}</h3>
            </div>

            <div className="space-y-4">
              {[
                { key: 'orderUpdates' as keyof NotificationSettings, label: t('notifications.orderUpdates'), description: t('notifications.orderUpdatesDesc') },
                { key: 'promotions' as keyof NotificationSettings, label: t('notifications.promotions'), description: t('notifications.promotionsDesc') },
                { key: 'newProducts' as keyof NotificationSettings, label: t('notifications.newProducts'), description: t('notifications.newProductsDesc') },
                { key: 'newsletter' as keyof NotificationSettings, label: t('notifications.newsletter'), description: t('notifications.newsletterDesc') }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{item.label}</h4>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <Switch
                    checked={item.key === 'newsletter' ? newsLetterSubscribed : notificationSettings[item.key]}
                    onChange={(checked: boolean) => {
                      if (item.key === 'newsletter') {
                        setNewsLetterSubscribed(checked);
                        // Also update in notificationSettings object if it's there
                        setNotificationSettings(prev => ({ ...prev, newsletter: checked }));
                      } else {
                        setNotificationSettings(prev => ({ ...prev, [item.key]: checked }));
                      }
                    }}
                    className={`${(item.key === 'newsletter' ? newsLetterSubscribed : notificationSettings[item.key]) ? 'bg-emerald-600' : 'bg-gray-200'} 
                               relative inline-flex h-6 w-11 items-center rounded-full transition-colors 
                               focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`}
                  >
                    <span className={`${(item.key === 'newsletter' ? newsLetterSubscribed : notificationSettings[item.key]) ? 'translate-x-6' : 'translate-x-1'} 
                                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                  </Switch>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-100">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500 mb-4"></div>
          <p className="text-gray-600 font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

    if (!user && !isLoading) { 
    // This case should ideally be handled by redirect in fetchUserData,
    // but as a fallback or if fetchUserData fails before redirect.
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-100">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-500 mb-4"></div>
          <p className="text-gray-600 font-medium">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {user && (
            <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-xl p-6 mb-8 border border-white/30">
              <h1 className="text-3xl font-bold text-gray-800">
                {t('welcome')}, {customerDetails?.name || user?.email || t('guest')}!
              </h1>
              <p className="text-gray-600 mt-1">{t('manageInfo')}</p>
            </div>
          )}

          <div className="mt-8">
            <div className="mb-6">
              <div className="sm:hidden">
                <label htmlFor="tabs" className="sr-only">{t('selectTab')}</label>
                <select
                  id="tabs"
                  name="tabs"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                  onChange={(e) => setActiveTab(e.target.value as TabType)}
                  value={activeTab}
                >
                  {pageTabs.map((tab) => (
                    <option key={tab.id} value={tab.id}>{tab.label}</option>
                  ))}
                </select>
              </div>
              <div className="hidden sm:block">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {pageTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`${activeTab === tab.id
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-150 outline-none focus:ring-2 focus:ring-emerald-400 rounded-t-md`}
                        aria-current={activeTab === tab.id ? 'page' : undefined}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            <div className="mt-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>

      {isDetailModalOpen && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={handleCloseOrderDetail}
          onCancel={handleCancelOrder}
          onDownloadInvoice={handleDownloadInvoice}
          initialActiveTab={initialModalTab}
        />
      )}
    </>
  );
}