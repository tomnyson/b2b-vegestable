'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { getUser, updateUserProfile, UserProfile } from '../../lib/auth';
import { getUserOrders, Order, getOrderById, cancelOrder, generateInvoice } from '../../lib/order-api';
import { getCustomerDetailsFromAuth, CustomerDetails } from '../../lib/customer-api';
import { getProductById } from '../../lib/product-api';
import Header from '../../components/Header';
import OrderDetailModal from '../../components/OrderDetailModal';

// Address suggestion interface
interface AddressSuggestion {
  name: string;
  address: string;
  longitude?: number;
  latitude?: number;
}

export default function ProfilePage() {
  const router = useRouter();
  
  // User data states
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  // Multiple addresses state
  const [addresses, setAddresses] = useState<Array<{
    id: string; 
    address: string; 
    isDefault: boolean;
    longitude?: number;
    latitude?: number;
  }>>([]);
  const [newAddress, setNewAddress] = useState('');
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editAddress, setEditAddress] = useState('');
  
  // Address suggestion states
  const [addressQuery, setAddressQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Newsletter and notification settings
  const [newsLetterSubscribed, setNewsLetterSubscribed] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    orderUpdates: true,
    promotions: false,
    newProducts: false,
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'orders', or 'notifications'
  
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
  
  // Fetch user data on component mount
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
        
        // Get user details
        const details = await getCustomerDetailsFromAuth(userData);
        if (details) {
          setCustomerDetails(details);
          setFormData({
            name: details.name || '',
            email: details.email || '',
            phone: details.phone || '',
            address: details.address || '',
          });

          // Initialize with existing address if any
          if (details.address) {
            setAddresses([{
              id: '1',
              address: details.address,
              isDefault: true
            }]);
          }

          // Initialize newsletter and notification settings from user data
          // This would come from your actual API in a real implementation
          setNewsLetterSubscribed(details.newsletter_subscribed || false);
          setNotificationSettings({
            orderUpdates: details.notifications?.orderUpdates || true,
            promotions: details.notifications?.promotions || false,
            newProducts: details.notifications?.newProducts || false,
          });
        }
        
        // Get user orders
        const orders = await getUserOrders(userData.id);
        setUserOrders(orders);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserData();
  }, [router]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle checkbox changes for notification settings
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    if (name === 'newsletter') {
      setNewsLetterSubscribed(checked);
    } else {
      setNotificationSettings(prev => ({
        ...prev,
        [name]: checked
      }));
    }
  };

  // Handle input change for new address with suggestions
  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setNewAddress(query);
    setAddressQuery(query);

    // Clear previous timeout
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    // Set new timeout to prevent too many API calls
    if (query.length > 2) {
      suggestionTimeoutRef.current = setTimeout(() => {
        fetchAddressSuggestions(query);
      }, 500);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Fetch address suggestions from Photon API
  const fetchAddressSuggestions = async (query: string) => {
    if (query.length < 3) return;

    try {
      setIsSearching(true);
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data && data.features) {
        const addressSuggestions: AddressSuggestion[] = data.features
          .filter((feature: any) => feature.properties.name)
          .map((feature: any) => {
            const props = feature.properties;
            const parts = [
              props.name,
              props.street,
              props.district,
              props.city,
              props.state,
              props.country
            ].filter(Boolean);
            
            // Extract longitude and latitude from geometry
            const coordinates = feature.geometry?.coordinates || [];
            const longitude = coordinates[0];
            const latitude = coordinates[1];
            
            return {
              name: props.name,
              address: parts.join(', '),
              longitude: longitude,
              latitude: latitude
            };
          });

        setSuggestions(addressSuggestions.slice(0, 5)); // Limit to 5 suggestions
        setShowSuggestions(addressSuggestions.length > 0);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      toast.error('Failed to fetch address suggestions');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle selecting an address suggestion
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setNewAddress(suggestion.address);
    // Store the coordinates for later use when adding the address
    setAddressCoordinates({
      longitude: suggestion.longitude,
      latitude: suggestion.latitude
    });
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
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

  // Handle adding a new address
  const handleAddAddress = () => {
    if (!newAddress.trim()) return;
    
    const newId = `address_${Date.now()}`;
    // If this is the first address, make it default
    const isDefault = addresses.length === 0;
    
    setAddresses(prev => [...prev, {
      id: newId,
      address: newAddress,
      isDefault,
      longitude: addressCoordinates.longitude,
      latitude: addressCoordinates.latitude
    }]);
    
    setNewAddress('');
    setAddressQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setAddressCoordinates({}); // Clear coordinates for next address
    
    toast.success('Address added successfully');
  };

  // Handle removing an address
  const handleRemoveAddress = (id: string) => {
    const addressToRemove = addresses.find(addr => addr.id === id);
    const wasDefault = addressToRemove?.isDefault || false;
    
    const updatedAddresses = addresses.filter(addr => addr.id !== id);
    
    // If removed address was default and we have other addresses, make the first one default
    if (wasDefault && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
    }
    
    setAddresses(updatedAddresses);
  };

  // Handle setting an address as default
  const handleSetDefaultAddress = (id: string) => {
    setAddresses(prev => prev.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
  };

  // Handle editing an address
  const handleStartEditAddress = (id: string) => {
    const address = addresses.find(addr => addr.id === id);
    if (address) {
      setEditingAddressId(id);
      setEditAddress(address.address);
      // Store the coordinates of the address being edited
      setAddressCoordinates({
        longitude: address.longitude,
        latitude: address.latitude
      });
    }
  };

  const handleSaveEditAddress = () => {
    if (!editingAddressId || !editAddress.trim()) return;
    
    setAddresses(prev => prev.map(addr => 
      addr.id === editingAddressId 
        ? { 
            ...addr, 
            address: editAddress,
            // Preserve existing coordinates
            longitude: addressCoordinates.longitude || addr.longitude,
            latitude: addressCoordinates.latitude || addr.latitude
          }
        : addr
    ));
    
    setEditingAddressId(null);
    setEditAddress('');
    setAddressCoordinates({}); // Clear coordinates
    
    toast.success('Address updated successfully');
  };

  const handleCancelEditAddress = () => {
    setEditingAddressId(null);
    setEditAddress('');
    setAddressCoordinates({}); // Clear coordinates
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setSaveSuccess(false);
      setSaveError('');
      
      if (!user) return;
      
      // Get default address for profile update
      const defaultAddress = addresses.find(addr => addr.isDefault);
      const addressText = defaultAddress?.address || '';
      
      // Update profile in profiles table
      await updateUserProfile(user.id, {
        name: formData.name,
        phone: formData.phone,
        address: addressText,
        // Remove separate longitude/latitude fields - they should only be in the addresses array
        // longitude: defaultAddress?.longitude,
        // latitude: defaultAddress?.latitude,
        // Include all addresses with coordinates
        addresses: addresses,
        newsletter_subscribed: newsLetterSubscribed,
        notifications: notificationSettings
      });
      
      setSaveSuccess(true);
      toast.success('Profile updated successfully with address coordinates');
      
      // Refresh customer details
      const updatedDetails = await getCustomerDetailsFromAuth(user);
      if (updatedDetails) {
        setCustomerDetails(updatedDetails);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setSaveError(error.message || 'Failed to update profile');
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle opening order detail modal
  const handleOpenOrderDetail = async (orderId: string, initialTab: 'details' | 'invoice' = 'details') => {
    try {
      setOrderActionLoading(true);
      setOrderActionError('');
      setInitialModalTab(initialTab);
      
      // Get detailed order information
      const orderDetail = await getOrderById(orderId);
      
      if (orderDetail) {
        setSelectedOrder(orderDetail);
        setIsDetailModalOpen(true);
      } else {
        setOrderActionError('Order not found.');
      }
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      setOrderActionError(error.message || 'Failed to fetch order details');
    } finally {
      setOrderActionLoading(false);
    }
  };
  
  // Handle closing order detail modal
  const handleCloseOrderDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedOrder(null);
    setOrderActionError('');
    setOrderActionSuccess('');
  };
  
  // Handle order cancellation
  const handleCancelOrder = async (orderId: string, reason: string) => {
    try {
      setOrderActionLoading(true);
      setOrderActionError('');
      
      // Cancel the order
      const updatedOrder = await cancelOrder(orderId, reason);
      
      // Update orders list
      setUserOrders(prev => 
        prev.map(order => 
          order.id === orderId ? updatedOrder : order
        )
      );
      
      setSelectedOrder(updatedOrder);
      setOrderActionSuccess('Order cancelled successfully!');
      
      // Close modal after a delay
      setTimeout(() => {
        setIsDetailModalOpen(false);
        setSelectedOrder(null);
        setOrderActionSuccess('');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      setOrderActionError(error.message || 'Failed to cancel order');
    } finally {
      setOrderActionLoading(false);
    }
  };
  
  // Handle invoice download
  const handleDownloadInvoice = async (orderId: string) => {
    try {
      setOrderActionLoading(true);
      setOrderActionError('');
      
      // Open order detail with invoice tab active
      await handleOpenOrderDetail(orderId, 'invoice');
      
    } catch (error: any) {
      console.error('Error downloading invoice:', error);
      setOrderActionError(error.message || 'Failed to download invoice');
    } finally {
      setOrderActionLoading(false);
    }
  };
  
  // Handle "Buy Again" action - add order items to cart and redirect to store
  const handleBuyAgain = async (order: Order) => {
    try {
      setIsBuyingAgain(true);
      setBuyAgainError('');
      
      // Initialize a cart in localStorage (simulating cart state)
      let cart: Array<{product_id: string, quantity: number}> = [];
      
      // Add order items to cart
      for (const item of order.items) {
        if (item.product_id) {
          cart.push({
            product_id: item.product_id,
            quantity: item.quantity
          });
        }
      }
      
      // Store cart in localStorage to be accessed from store page
      localStorage.setItem('pendingCart', JSON.stringify(cart));
      
      setBuyAgainSuccess('Order added to cart! Redirecting to store...');
      
      // Redirect to store page after a short delay
      setTimeout(() => {
        router.push('/store');
      }, 1500);
    } catch (error: any) {
      console.error('Error adding order to cart:', error);
      setBuyAgainError(error.message || 'Failed to add items to cart');
      setIsBuyingAgain(false);
    }
  };
  
  // Format order status with appropriate color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };
  
  // Render address input with suggestions
  const renderAddressInput = () => {
    return (
      <div className="mt-3 relative">
        <div className="flex">
          <div className="relative flex-1">
            <input
              type="text"
              value={newAddress}
              onChange={handleAddressInputChange}
              placeholder="Enter a new address"
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
            className="px-4 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Add
          </button>
        </div>
        
        {showSuggestions && (
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
                    Coordinates: {suggestion.latitude.toFixed(6)}, {suggestion.longitude.toFixed(6)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <p className="mt-1 text-xs text-gray-500">
          Start typing to see address suggestions or add your address manually
        </p>
      </div>
    );
  };
  
  // Handle address editing
  const handleEditAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setEditAddress(newValue);
    
    // Clear previous timeout
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    // Set new timeout to prevent too many API calls
    if (newValue.length > 2) {
      suggestionTimeoutRef.current = setTimeout(() => {
        // Look up coordinates for the edited address
        fetchAddressCoordinates(newValue);
      }, 500);
    }
  };

  // Fetch coordinates for an address
  const fetchAddressCoordinates = async (address: string) => {
    if (address.length < 3) return;

    try {
      setIsSearching(true);
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(address)}`);
      const data = await response.json();

      if (data && data.features && data.features.length > 0) {
        // Use the first result as the best match
        const coordinates = data.features[0].geometry?.coordinates || [];
        const longitude = coordinates[0];
        const latitude = coordinates[1];
        
        // Store coordinates for use when saving
        setAddressCoordinates({
          longitude: longitude,
          latitude: latitude
        });
      }
    } catch (error) {
      console.error('Error fetching address coordinates:', error);
      // Don't show a toast here to avoid annoying the user during typing
    } finally {
      setIsSearching(false);
    }
  };

  // Update address list display to show coordinates
  const renderAddressList = () => {
    return (
      <div className="space-y-3 mb-4">
        {addresses.length === 0 ? (
          <p className="text-sm text-gray-500">No addresses added yet</p>
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
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex mt-2 space-x-2">
                    <button
                      type="button"
                      onClick={handleSaveEditAddress}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditAddress}
                      className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="text-sm">{address.address}</p>
                    {address.latitude && address.longitude && (
                      <p className="text-xs text-gray-500 mt-1">
                        Lat: {address.latitude.toFixed(6)}, Long: {address.longitude.toFixed(6)}
                      </p>
                    )}
                    {address.isDefault && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleStartEditAddress(address.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    {!address.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(address.id)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveAddress(address.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
          <div className="container mx-auto px-4 py-8">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                <p className="text-lg font-medium text-gray-700">Loading your profile...</p>
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-8 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  My Account
                </h1>
                <p className="mt-2 text-gray-600 text-lg">
                  Manage your profile information, orders, and preferences
                </p>
              </div>
              <div className="mt-4 lg:mt-0 flex items-center space-x-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Welcome back, {user?.email}</span>
              </div>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 mb-8 overflow-hidden">
            <nav className="flex flex-col lg:flex-row">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-all duration-200 ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-all duration-200 ${
                  activeTab === 'orders'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Order History
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-all duration-200 ${
                  activeTab === 'notifications'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a1 1 0 011-1h3a1 1 0 011 1v5z" />
                </svg>
                Notifications & Settings
              </button>
            </nav>
          </div>
          
          {/* Profile Information Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-8">
              <div className="flex items-center space-x-3 mb-6">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <h2 className="text-2xl font-bold text-gray-900">Update Your Profile</h2>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
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
                      <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                    </div>
                    
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
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
                      Phone Number
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
                  
                  {/* Addresses Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Delivery Addresses
                    </label>
                    
                    {/* List of existing addresses */}
                    {renderAddressList()}
                    
                    {/* Add new address with suggestions */}
                    {renderAddressInput()}
                  </div>
                  
                  {saveSuccess && (
                    <div className="bg-emerald-50/80 backdrop-blur-lg rounded-2xl border border-emerald-200/20 p-4 flex items-center">
                      <svg className="w-5 h-5 text-emerald-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-emerald-700 font-medium">Profile updated successfully!</p>
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
                      className={`w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-2xl text-base font-semibold transition-all duration-200 ${
                        isSaving 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400 mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
          
          {/* Notifications & Settings Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-8">
              <div className="flex items-center space-x-3 mb-6">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a1 1 0 011-1h3a1 1 0 011 1v5z" />
                </svg>
                <h2 className="text-2xl font-bold text-gray-900">Notifications & Preferences</h2>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-8">
                  {/* Newsletter Section */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Newsletter Subscription
                    </h3>
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center h-5">
                        <input
                          id="newsletter"
                          name="newsletter"
                          type="checkbox"
                          checked={newsLetterSubscribed}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="newsletter" className="text-sm font-medium text-gray-900">
                          Subscribe to our newsletter
                        </label>
                        <p className="text-sm text-gray-600 mt-1">
                          Get the latest updates about new products, promotions, and special offers delivered to your inbox.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Notification Preferences */}
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-3">Notification Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="orderUpdates"
                            name="orderUpdates"
                            type="checkbox"
                            checked={notificationSettings.orderUpdates}
                            onChange={handleCheckboxChange}
                            className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="orderUpdates" className="font-medium text-gray-700">Order updates</label>
                          <p className="text-gray-500">Receive notifications about your order status and delivery.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="promotions"
                            name="promotions"
                            type="checkbox"
                            checked={notificationSettings.promotions}
                            onChange={handleCheckboxChange}
                            className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="promotions" className="font-medium text-gray-700">Promotions and discounts</label>
                          <p className="text-gray-500">Get notified about special offers, promotions, and seasonal discounts.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="newProducts"
                            name="newProducts"
                            type="checkbox"
                            checked={notificationSettings.newProducts}
                            onChange={handleCheckboxChange}
                            className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="newProducts" className="font-medium text-gray-700">New product announcements</label>
                          <p className="text-gray-500">Be the first to know when we add new products to our catalog.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {saveSuccess && (
                    <div className="p-3 bg-green-50 text-green-800 rounded-md">
                      Notification preferences updated successfully!
                    </div>
                  )}
                  
                  {saveError && (
                    <div className="p-3 bg-red-50 text-red-800 rounded-md">
                      {saveError}
                    </div>
                  )}
                  
                  <div>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 ${
                        isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                      }`}
                    >
                      {isSaving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
          
          {/* Order History Tab */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <h2 className="text-lg font-medium text-gray-900 p-6 border-b border-gray-200">
                Your Order History
              </h2>
              
              {orderActionError && (
                <div className="mx-6 mt-4 p-3 bg-red-50 text-red-800 rounded-md">
                  {orderActionError}
                </div>
              )}
              
              {orderActionSuccess && (
                <div className="mx-6 mt-4 p-3 bg-green-50 text-green-800 rounded-md">
                  {orderActionSuccess}
                </div>
              )}
              
              {buyAgainSuccess && (
                <div className="mx-6 mt-4 p-3 bg-green-50 text-green-800 rounded-md">
                  {buyAgainSuccess}
                </div>
              )}
              
              {buyAgainError && (
                <div className="mx-6 mt-4 p-3 bg-red-50 text-red-800 rounded-md">
                  {buyAgainError}
                </div>
              )}
              
              {userOrders.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">You haven't placed any orders yet.</p>
                  <button
                    onClick={() => router.push('/store')}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{order.id?.substring(0, 8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            €{order.total_amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end">
                            <button
                              onClick={() => handleOpenOrderDetail(order.id!)}
                              className="text-green-600 hover:text-green-900 mx-2"
                            >
                              View
                            </button>
                            
                            {order.status === 'completed' && (
                              <>
                                <button
                                  onClick={() => handleDownloadInvoice(order.id!)}
                                  className="text-blue-600 hover:text-blue-900 mx-2"
                                >
                                  Invoice
                                </button>
                                <button
                                  onClick={() => handleBuyAgain(order)}
                                  disabled={isBuyingAgain}
                                  className="text-indigo-600 hover:text-indigo-900 mx-2"
                                >
                                  {isBuyingAgain ? 'Processing...' : 'Buy Again'}
                                </button>
                              </>
                            )}
                            
                            {order.status === 'pending' && (
                              <button
                                onClick={() => handleOpenOrderDetail(order.id!)}
                                className="text-red-600 hover:text-red-900 mx-2"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {/* Order Detail Modal */}
          {isDetailModalOpen && selectedOrder && (
            <OrderDetailModal
              order={selectedOrder}
              onClose={handleCloseOrderDetail}
              onCancel={handleCancelOrder}
              onDownloadInvoice={handleDownloadInvoice}
              initialActiveTab={initialModalTab}
            />
          )}
        </div>
      </div>
    </>
  );
} 