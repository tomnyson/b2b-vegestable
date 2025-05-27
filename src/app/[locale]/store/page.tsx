'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Product, getPaginatedProducts, getProductById, getPopularProductIds } from '../../lib/product-api';
import { getUser } from '../../lib/auth';
import { getCustomerDetailsFromAuth, CustomerDetails, getUserAddresses } from '../../lib/customer-api';
import { createOrder } from '../../lib/order-api';
import { getAppSettings, formatPriceSync, getCurrencyInfo } from '../../lib/settings-api';
import { useCurrency } from '../../hooks/useCurrency';
import { toast } from 'react-toastify';
import ProductList from './ProductList';
import ShoppingCart from './ShoppingCart';
import AuthModal from './AuthModal';
import Header from '../../components/Header';
import CurrencySwitcher from '../../components/CurrencySwitcher';

export default function StorePage() {
  const t = useTranslations('store');
  // Currency management
  const { currency, changeCurrency, isLoading: currencyLoading } = useCurrency();
  
  // Product listing state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [popularProductIds, setPopularProductIds] = useState<string[]>([]);
  const itemsPerPage = 8;

  // Authentication state
  const [user, setUser] = useState<any>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [userAddresses, setUserAddresses] = useState<Array<{
    id: string;
    address: string;
    isDefault: boolean;
    longitude?: number;
    latitude?: number;
  }>>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Shopping cart state
  const [cartItems, setCartItems] = useState<{product: Product, quantity: number}[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  
  // Function to load products - defined at component level so it can be called from saveOrder
  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getPaginatedProducts(
        currentPage,
        itemsPerPage,
        'name_en',
        'asc',
        searchTerm || undefined
      );
      
      setProducts(result.products);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      console.error('Error loading products:', err);
      setError(err.message || t('productsError'));
    } finally {
      setLoading(false);
    }
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isSearching) {
        setCurrentPage(1);
        setIsSearching(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm, isSearching]);

  // Fetch user data when the component mounts
  useEffect(() => {
    async function fetchUserData() {
      setIsCheckingAuth(true);
      try {
        // Check for authentication
        const userData = await getUser();
        if (userData) {
          setUser(userData);
          
          // Get customer details from auth
          const details = await getCustomerDetailsFromAuth(userData);
          if (details) {
            setCustomerDetails(details);
            setCustomerInfo({
              name: details.name || '',
              email: details.email || '',
              phone: details.phone || '',
              address: details.address || ''
            });

            // Fetch user addresses
            if (details.addresses && details.addresses.length > 0) {
              setUserAddresses(details.addresses);
              // Set default address as the current address if available
              const defaultAddress = details.addresses.find(addr => addr.isDefault);
              if (defaultAddress) {
                setCustomerInfo(prev => ({
                  ...prev,
                  address: defaultAddress.address
                }));
              }
            } else {
              // Get addresses from dedicated function if not included in details
              const addresses = await getUserAddresses(userData.id);
              if (addresses && addresses.length > 0) {
                setUserAddresses(addresses);
                // Set default address as the current address if available
                const defaultAddress = addresses.find(addr => addr.isDefault);
                if (defaultAddress) {
                  setCustomerInfo(prev => ({
                    ...prev,
                    address: defaultAddress.address
                  }));
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    }
    
    fetchUserData();
  }, []);

  // Load products when the component mounts
  useEffect(() => {
    if (!isSearching) {
      loadProducts();
    }
  }, [currentPage, searchTerm, isSearching]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check for pending cart from Buy Again feature
  useEffect(() => {
    // Only process if we're not checking auth (to ensure user is set correctly)
    if (!isCheckingAuth && user) {
      const pendingCart = localStorage.getItem('pendingCart');
      
      if (pendingCart) {
        try {
          const cartData = JSON.parse(pendingCart);
          
          // We need to load the actual product data for each item
          const loadPendingCart = async () => {
            const loadedItems: {product: Product, quantity: number}[] = [];
            
            for (const item of cartData) {
              try {
                const product = await getProductById(item.product_id);
                if (product) {
                  loadedItems.push({
                    product,
                    quantity: item.quantity
                  });
                }
              } catch (err) {
                console.error(`Failed to load product ${item.product_id}:`, err);
              }
            }
            
            // Update cart with loaded items
            if (loadedItems.length > 0) {
              setCartItems(prev => {
                // Merge with existing cart - if product already exists, add quantities
                const mergedCart = [...prev];
                
                for (const newItem of loadedItems) {
                  const existingIndex = mergedCart.findIndex(item => 
                    item.product.id === newItem.product.id
                  );
                  
                  if (existingIndex >= 0) {
                    // Item already in cart, update quantity
                    mergedCart[existingIndex].quantity += newItem.quantity;
                  } else {
                    // Add new item
                    mergedCart.push(newItem);
                  }
                }
                
                return mergedCart;
              });
              
              // Show success message
              alert(t('itemsAdded'));
            }
          };
          
          loadPendingCart();
          
          // Clear the pending cart from localStorage
          localStorage.removeItem('pendingCart');
        } catch (err) {
          console.error('Error processing pending cart:', err);
        }
      }
    }
  }, [isCheckingAuth, user]);

  // Load popular products
  useEffect(() => {
    async function fetchPopularProducts() {
      try {
        const popularIds = await getPopularProductIds(10);
        setPopularProductIds(popularIds);
      } catch (err) {
        console.error('Error fetching popular products:', err);
      }
    }
    
    fetchPopularProducts();
  }, []);

  // Add product to cart
  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems(prev => {
      // Check if item is already in cart
      const existingItemIndex = prev.findIndex(item => item.product.id === product.id);
      
      // Calculate total quantity after adding
      let newQuantity = quantity;
      if (existingItemIndex >= 0) {
        newQuantity += prev[existingItemIndex].quantity;
      }
      
      // Check against stock if available
      if (product.stock !== undefined) {
        if (newQuantity > product.stock) {
          // Show toast warning if exceeding stock
          toast.warning(t('messages.stockWarning', { stock: product.stock, product: product.name_en }));
          newQuantity = product.stock;
        }
        
        // If completely out of stock
        if (product.stock <= 0) {
          toast.error(t('messages.outOfStockError', { product: product.name_en }));
          return prev; // Don't modify cart
        }
      }
      
      if (existingItemIndex >= 0) {
        // Update quantity if already in cart
        const updatedItems = [...prev];
        updatedItems[existingItemIndex].quantity = newQuantity;
        return updatedItems;
      } else {
        // Add new item
        return [...prev, { product, quantity: newQuantity }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  // Update item quantity in cart
  const updateCartQuantity = (productId: string, quantity: number) => {
    setCartItems(prev => 
      prev.map(item => {
        if (item.product.id === productId) {
          // Enforce minimum quantity of 1
          let newQuantity = Math.max(1, quantity);
          
          // Check against stock limits if available
          if (item.product.stock !== undefined) {
            const maxAllowed = item.product.stock;
            
            if (newQuantity > maxAllowed) {
              toast.warning(t('messages.stockWarning', { stock: maxAllowed, product: item.product.name_en }));
              newQuantity = maxAllowed;
            }
          }
          
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  // Calculate cart total
  const cartTotal = cartItems.reduce(
    (total, item) => total + (item.product.price * item.quantity), 
    0
  );

  // Handle search input
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setIsSearching(true);
  };

  // Handle customer info change
  const handleCustomerInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle address selection
  const handleAddressSelect = (address: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      address: address
    }));
  };

  // Proceed to checkout handler - check if user is logged in
  const handleProceedToCheckout = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return false;
    }

    // User is logged in, proceed to checkout
    return true;
  };

  // Authentication success handler
  const handleAuthSuccess = async (userData: any) => {
    setUser(userData);
    setIsAuthModalOpen(false);

    // Get comprehensive customer details
    const details = await getCustomerDetailsFromAuth(userData);
    
    if (details) {
      setCustomerDetails(details);
      setCustomerInfo({
        name: details.name || '',
        email: details.email || '',
        phone: details.phone || '',
        address: details.address || ''
      });
    } else {
      // Fallback to basic user data
      setCustomerInfo({
        name: userData.user_metadata?.full_name || userData.email || '',
        email: userData.email || '',
        phone: '',
        address: ''
      });
    }
  };

  // Save order
  const saveOrder = async () => {
    if (cartItems.length === 0) {
      toast.error(t('cartEmpty'));
      return;
    }
    
    try {
      // Prepare order data
      const orderItems = cartItems.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price
      }));
      
      const orderData = {
        user_id: user?.id,
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        delivery_address: customerInfo.address,
        order_date: new Date().toISOString(),
        total_amount: cartTotal,
        notes: orderNotes,
        status: 'pending' as const,
        payment_status: 'pending' as const,
        items: orderItems
      };
      
      // Submit order using Supabase directly
      const order = await createOrder(orderData);
      
      // Order successful
      toast.success(`${t('orderSubmitted')} #${order.id || 'N/A'}`);
      
      // Clear cart after successful order
      setCartItems([]);
      setOrderNotes('');
      
      // Refresh products to get updated stock information
      loadProducts();
      
      // Refresh the popular products list
      const popularIds = await getPopularProductIds(10);
      setPopularProductIds(popularIds);
      
    } catch (err: any) {
      console.error('Error saving order:', err);
      toast.error(`${t('orderError')}: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-8 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="text-center lg:text-left">
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
                  {t('title')}
                </h1>
                <p className="text-gray-600 text-lg max-w-2xl">
                  {t('description')}
                </p>
              </div>
            </div>
          </div>
          
          {/* Welcome Banner */}
          {user && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-8 mb-8 text-white">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h2 className="text-xl font-semibold">{t('welcome')}, {customerInfo.name || user.email}!</h2>
                  </div>
                  <p className="text-emerald-100">
                    {customerInfo.address 
                      ? `${t('orderDelivery')} ${customerInfo.address}`
                      : t('completeAddress')}
                  </p>
                </div>
                <div className="mt-4 lg:mt-0 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-emerald-200 text-sm">{t('products.inStock')}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col xl:flex-row gap-8">
            {/* Left Column - Product Listing */}
            <div className="xl:w-2/3">
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                <ProductList 
                  products={products} 
                  loading={loading} 
                  error={error}
                  searchTerm={searchTerm}
                  onSearch={handleSearch}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  onAddToCart={addToCart}
                  popularProductIds={popularProductIds}
                  currency={currency}
                  isSearching={isSearching}
                />
              </div>
            </div>
            
            {/* Right Column - Shopping Cart */}
            <div className="xl:w-1/3">
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden sticky top-8">
                <ShoppingCart 
                  items={cartItems} 
                  total={cartTotal}
                  customerInfo={customerInfo}
                  onCustomerInfoChange={handleCustomerInfoChange}
                  onUpdateQuantity={updateCartQuantity}
                  onRemoveItem={removeFromCart}
                  orderNotes={orderNotes}
                  onOrderNotesChange={setOrderNotes}
                  onSaveOrder={saveOrder}
                  isLoggedIn={!!user}
                  onProceedToCheckout={handleProceedToCheckout}
                  userAddresses={userAddresses}
                  onSelectAddress={handleAddressSelect}
                  currency={currency}
                />
              </div>
            </div>
          </div>
          
          {/* Authentication Modal */}
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onSuccess={handleAuthSuccess}
          />
        </div>
      </div>
    </>
  );
} 