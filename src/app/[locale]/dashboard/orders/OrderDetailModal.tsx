import { useState, useRef, useEffect } from 'react';
import { Order, OrderItem } from '../../../lib/order-api';
import { Product } from '../../../lib/product-api';
import { sendInvoiceEmail } from '../../../lib/email-api';
import { supabase } from '../../../lib/supabase';
import { AppSettings, getAppSettings, SUPPORTED_CURRENCIES } from '../../../lib/settings-api';

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
}

// Extended customer interface to ensure proper typing
interface ExtendedCustomer {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  profile_image?: string;
  address?: string;
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
  const [activeTab, setActiveTab] = useState<'details' | 'invoice'>('details');
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  
  // Load application settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getAppSettings();
        setAppSettings(settings);
      } catch (error) {
        console.error('Error loading app settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    }
    
    loadSettings();
  }, []);

  // When the component mounts, fetch customer details if not already available
  useEffect(() => {
    async function fetchCustomerDetails() {
      if (!order || !order.user_id || order.customer) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, name, phone, address')
          .eq('id', order.user_id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          // Manually add the customer data to our order object
          order.customer = {
            id: data.id,
            email: data.email,
            name: `${data.name}`,
            phone: data.phone,
            address: data.address
          };
        }
      } catch (err) {
        console.error('Error fetching customer details:', err);
      }
    }
    
    fetchCustomerDetails();
  }, [order]);

  // Simple print function that uses the browser's native print
  const handlePrintRequest = () => {
    // First switch to invoice tab to make it visible
    setActiveTab('invoice');
    
    // Use setTimeout to let the DOM update
    setTimeout(() => {
      if (!invoiceRef.current) {
        console.error("Invoice ref not available");
        return;
      }
      
      try {
        // Create a print-specific stylesheet
        const printStyle = document.createElement('style');
        printStyle.textContent = `
          @media print {
            body * {
              visibility: hidden;
            }
            .invoice-content, .invoice-content * {
              visibility: visible !important;
            }
            .invoice-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px;
            }
          }
        `;
        document.head.appendChild(printStyle);

        // Execute print
        window.print();
        
        // Cleanup after printing
        setTimeout(() => {
          document.head.removeChild(printStyle);
        }, 500);
        
      } catch (err) {
        console.error("Error while printing:", err);
        alert("There was an error when trying to print. Please try again.");
      }
    }, 500); // Increased timeout for DOM to update
  };

  // Send invoice email function
  const handleSendInvoiceEmail = async () => {
    if (!order || !order.id) {
      setEmailError('Cannot send invoice: order information is missing');
      return;
    }

    // Get customer email from order or from user input
    let customerEmail = order.customer?.email;
    
    // If no email found, try to get it from user table if we have user ID
    if (!customerEmail && order.user_id) {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('email')
          .eq('id', order.user_id)
          .single();
        
        if (userData?.email) {
          customerEmail = userData.email;
        }
      } catch (err) {
        console.error('Failed to fetch user email:', err);
      }
    }
    
    // If still no email, prompt the user
    if (!customerEmail) {
      const promptEmail = prompt('Enter customer email:');
      customerEmail = promptEmail || undefined;
    }
    
    if (!customerEmail) {
      setEmailError('Cannot send invoice: customer email is required');
      return;
    }

    try {
      setSendingEmail(true);
      setEmailError(null);
      setEmailSent(false);

      // For HTML invoice, we can use the DOM content from the invoice view
      let invoiceHtml = '';
      if (invoiceRef.current) {
        // First switch to invoice tab to make sure it's rendered
        setActiveTab('invoice');
        await new Promise(resolve => setTimeout(resolve, 100)); // Give time for rendering
        invoiceHtml = invoiceRef.current.innerHTML;
      }

      // Send the email via our API endpoint
      const result = await sendInvoiceEmail(order.id, customerEmail, invoiceHtml);
      
      if (result.success) {
        setEmailSent(true);
        
        // If we didn't have the email in the order, save it for future use
        // if (!order.customer_email && order.id) {
        //   try {
        //     await supabase
        //       .from('orders')
        //       .update({ customer_email: customerEmail })
        //       .eq('id', order.id);
        //   } catch (updateErr) {
        //     console.error('Could not save email to order:', updateErr);
        //     // Don't fail the overall process if this update fails
        //   }
        }
        
        setTimeout(() => setEmailSent(false), 5000); // Clear success message after 5 seconds
      // } else {
      //   // setEmailError(result.message || 'Failed to send email');
      // }
    } catch (err: any) {
      console.error('Error sending invoice email:', err);
      // Check for specific CORS errors
      if (err.message && err.message.includes('CORS')) {
        setEmailError('A CORS error occurred. Please contact your administrator.');
      } else {
        setEmailError(err.message || 'An error occurred while sending the invoice');
      }
    } finally {
      setSendingEmail(false);
    }
  };

  if (!order) return null;

  // Cast items to our extended type to ensure type safety
  const orderItems = order.items as OrderItemWithProduct[];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="modal-header flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold">Order {order.id?.substring(0, 8)}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs flex border-b">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'details' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('details')}
          >
            Order Details
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'invoice' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('invoice')}
          >
            Invoice
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Details tab content */}
          <div className={`${activeTab === 'details' ? 'block' : 'hidden'}`}>
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Order Information</h3>
                  <p className="mt-1"><span className="font-medium">Date:</span> {formatDate(order.order_date)}</p>
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-1 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </p>
                  <p><span className="font-medium">Payment:</span> 
                    <span className={`ml-1 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(order.payment_status)}`}>
                      {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                    </span>
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Customer Information</h3>
                  {order.customer ? (
                    <>
                      <p className="mt-1">
                        <span className="font-medium">Name:</span> {order.customer.name || 'N/A'}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span> {order.customer?.email || 'N/A'}
                      </p>
                      {order.customer.phone && (
                        <p>
                          <span className="font-medium">Phone:</span> {order.customer.phone}
                        </p>
                      )}
                      {order.customer.address && (
                        <p>
                          <span className="font-medium">Address:</span> {order.customer.address}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      {order.user_id && (
                        <p className="text-gray-700">Account: {order.user_id}</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Delivery Information</h3>
                <p className="mt-1"><span className="font-medium">Address:</span> {order.delivery_address || 'Not specified'}</p>
                {order.assigned_driver_id && (
                  <p><span className="font-medium">Driver ID:</span> {order.assigned_driver_id}</p>
                )}
                {order.notes && (
                  <p><span className="font-medium">Notes:</span> {order.notes}</p>
                )}
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Order Items</h3>
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orderItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                            {getProductName(item)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500 text-right">
                            ${item.unit_price.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500 text-right">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                            ${(item.unit_price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">Total</td>
                        <td className="px-4 py-2 text-sm font-bold text-gray-900 text-right">${order.total_amount.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice tab content */}
          <div className={`${activeTab === 'invoice' ? 'block' : 'hidden'}`}>
            <div ref={invoiceRef} className="invoice-content p-6 print:p-0 print:shadow-none">
              <div className="max-w-3xl mx-auto bg-white print:shadow-none">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">INVOICE</h1>
                    <p className="text-gray-700"># {order.id}</p>
                  </div>
                  <div className="text-right">
                    {appSettings?.logo_url && (
                      <img 
                        src={appSettings.logo_url} 
                        alt="Company Logo" 
                        className="h-16 mb-2 ml-auto"
                      />
                    )}
                    <p className="font-bold text-gray-900">{appSettings?.company_name || 'B2B Vegetable'}</p>
                    <p className="text-gray-700">123 Business St</p>
                    <p className="text-gray-700">City, State 12345</p>
                    <p className="text-gray-700">{appSettings?.support_phone || '+1 (123) 456-7890'}</p>
                    <p className="text-gray-700">{appSettings?.support_email || 'support@example.com'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h2 className="text-gray-700 font-semibold mb-2">Bill To:</h2>
                    {order.customer ? (
                      <>
                        <p className="text-gray-900 font-medium">
                          {order.customer.name  
                            ? `${order.customer.name}`
                            : order.customer.email}
                        </p>
                        <p className="text-gray-700">{order.customer?.email || 'N/A'}</p>
                        {order.customer.phone && (
                          <p className="text-gray-700">{order.customer.phone}</p>
                        )}
                        {order.customer.address && (
                          <p className="text-gray-700">{order.customer.address}</p>
                        )}
                        {order.delivery_address && order.delivery_address !== order.customer.address && (
                          <div className="mt-2">
                            <p className="text-gray-700 font-medium">Shipping Address:</p>
                            <p className="text-gray-700">{order.delivery_address}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {order.user_id && (
                          <p className="text-gray-700">Account: {order.user_id}</p>
                        )}
                        {order.delivery_address && (
                          <div className="mt-2">
                            <p className="text-gray-700 font-medium">Shipping Address:</p>
                            <p className="text-gray-700">{order.delivery_address}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div>
                    <h2 className="text-gray-700 font-semibold mb-2">Invoice Details:</h2>
                    <div className="grid grid-cols-2 gap-1">
                      <p className="text-gray-600">Invoice Date:</p>
                      <p className="text-gray-900">{new Date(order.order_date).toLocaleDateString()}</p>
                      <p className="text-gray-600">Order Status:</p>
                      <p className="text-gray-900">{order.status.toUpperCase()}</p>
                      <p className="text-gray-600">Payment Status:</p>
                      <p className="text-gray-900">{order.payment_status.toUpperCase()}</p>
                      <p className="text-gray-600">Currency:</p>
                      <p className="text-gray-900">{appSettings?.default_currency || 'USD'}</p>
                    </div>
                  </div>
                </div>
                
                <table className="min-w-full border border-gray-300 mb-8">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 border-b text-left">Item</th>
                      <th className="py-2 px-4 border-b text-right">Unit Price</th>
                      <th className="py-2 px-4 border-b text-right">Quantity</th>
                      <th className="py-2 px-4 border-b text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-2 px-4 border-b">
                          {getProductName(item)}
                        </td>
                        <td className="py-2 px-4 border-b text-right">
                          {currencySymbol}{item.unit_price.toFixed(2)}
                        </td>
                        <td className="py-2 px-4 border-b text-right">
                          {item.quantity}
                        </td>
                        <td className="py-2 px-4 border-b text-right">
                          {currencySymbol}{(item.unit_price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="py-2 px-4 text-right">Subtotal</td>
                      <td className="py-2 px-4 text-right">{currencySymbol}{order.total_amount.toFixed(2)}</td>
                    </tr>
                    {appSettings?.vat_percentage ? (
                      <tr className="bg-gray-50">
                        <td colSpan={3} className="py-2 px-4 text-right">VAT ({appSettings.vat_percentage}%)</td>
                        <td className="py-2 px-4 text-right">{currencySymbol}{vatAmount.toFixed(2)}</td>
                      </tr>
                    ) : null}
                    <tr className="bg-gray-100 font-bold">
                      <td colSpan={3} className="py-2 px-4 text-right">Total</td>
                      <td className="py-2 px-4 text-right">{currencySymbol}{(appSettings?.vat_percentage ? totalWithVat : order.total_amount).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
                
                <div className="mb-8">
                  <h2 className="text-gray-700 font-semibold mb-2">Notes:</h2>
                  <p className="text-gray-700">{order.notes || 'No additional notes'}</p>
                </div>
                
                <div className="text-center text-gray-600 text-sm">
                  <p>Thank you for your business!</p>
                  {appSettings?.company_name && <p>© {new Date().getFullYear()} {appSettings.company_name}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {emailSent && (
          <div className="mx-4 mb-2 p-2 bg-green-50 text-green-700 rounded-md text-center">
            Invoice email sent successfully!
          </div>
        )}

        {emailError && (
          <div className="mx-4 mb-2 p-2 bg-red-50 text-red-700 rounded-md text-center">
            Error: {emailError}
          </div>
        )}

        {/* Footer */}
        <div className="modal-footer border-t p-4 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Close
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={handleSendInvoiceEmail}
              disabled={sendingEmail}
              className={`px-4 py-2 flex items-center space-x-1 rounded-md 
                ${sendingEmail 
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'} 
                text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {sendingEmail ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Email Invoice</span>
                </>
              )}
            </button>
            
            <button
              onClick={handlePrintRequest}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Print Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 