import { useState, useRef, useEffect } from 'react';
import { Order, OrderItem } from '../../../lib/order-api';
import { Product } from '../../../lib/product-api';
import { sendInvoiceEmail } from '../../../lib/email-api';
import { supabase } from '../../../lib/supabase';
import { AppSettings, getAppSettings, SUPPORTED_CURRENCIES } from '../../../lib/settings-api';
import { getUserById } from '../../../lib/users-api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const [activeTab, setActiveTab] = useState<'details' | 'invoice'>('details');
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoadingDriver, setIsLoadingDriver] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
      } finally {
        setIsLoadingSettings(false);
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

  // Customer data is now fetched via API join, no need for separate fetch

  // PDF generation and download function using jsPDF
  const handlePrintRequest = async () => {
    // First switch to invoice tab to make it visible
    setActiveTab('invoice');
    
    // Use setTimeout to let the DOM update
    setTimeout(async () => {
      if (!invoiceRef.current) {
        console.error("Invoice ref not available");
        return;
      }
      
      try {
        // Show loading state
        setIsGeneratingPdf(true);
        console.log("Generating PDF...");
        
                 // Add comprehensive CSS override to prevent oklch color issues and improve PDF layout
         const overrideStyle = document.createElement('style');
         overrideStyle.setAttribute('data-pdf-override', 'true');
         overrideStyle.textContent = `
           * {
             color: black !important;
             background-color: white !important;
             border-color: #d1d5db !important;
             outline-color: transparent !important;
             text-decoration-color: currentColor !important;
             caret-color: currentColor !important;
             accent-color: #3b82f6 !important;
             --tw-bg-opacity: 1 !important;
             --tw-text-opacity: 1 !important;
             --tw-border-opacity: 1 !important;
             line-height: 1.6 !important;
             font-family: 'Arial', 'Helvetica', sans-serif !important;
           }
           
           .invoice-content {
             padding: 30px !important;
             max-width: 800px !important;
             margin: 0 auto !important;
             line-height: 1.8 !important;
           }
           
           h1, h2, h3 {
             line-height: 1.4 !important;
             margin-bottom: 16px !important;
             margin-top: 20px !important;
           }
           
           h1 {
             font-size: 28px !important;
             font-weight: bold !important;
             margin-bottom: 8px !important;
           }
           
           h2 {
             font-size: 18px !important;
             font-weight: 600 !important;
             margin-bottom: 12px !important;
           }
           
           p {
             line-height: 1.8 !important;
             margin-bottom: 8px !important;
             font-size: 14px !important;
           }
           
           .grid {
             display: grid !important;
             gap: 20px !important;
             margin-bottom: 24px !important;
           }
           
           .grid-cols-2 {
             grid-template-columns: 1fr 1fr !important;
           }
           
           .bg-gray-100 { 
             background-color: #f8f9fa !important; 
             padding: 12px !important;
             border-radius: 4px !important;
           }
           .bg-gray-50 { 
             background-color: #f9fafb !important; 
             padding: 8px !important;
           }
           .text-gray-700 { color: #374151 !important; }
           .text-gray-900 { color: #111827 !important; }
           .text-gray-600 { color: #4b5563 !important; }
           .text-gray-500 { color: #6b7280 !important; }
           .font-bold { font-weight: bold !important; }
           .font-medium { font-weight: 500 !important; }
           .font-semibold { font-weight: 600 !important; }
           .border-b { border-bottom: 1px solid #d1d5db !important; }
           .border-gray-300 { border-color: #d1d5db !important; }
           .border-gray-200 { border-color: #e5e7eb !important; }
           
           table { 
             border-collapse: collapse !important; 
             width: 100% !important;
             margin: 20px 0 !important;
             font-size: 14px !important;
           }
           
           th { 
             background-color: #f8f9fa !important;
             border: 1px solid #d1d5db !important; 
             padding: 12px 8px !important;
             text-align: left !important;
             font-weight: 600 !important;
             line-height: 1.5 !important;
           }
           
           td { 
             border: 1px solid #d1d5db !important; 
             padding: 12px 8px !important;
             line-height: 1.6 !important;
             vertical-align: top !important;
           }
           
           .text-right {
             text-align: right !important;
           }
           
           .text-left {
             text-align: left !important;
           }
           
           .text-center {
             text-align: center !important;
           }
           
           .mb-8 {
             margin-bottom: 32px !important;
           }
           
           .mb-2 {
             margin-bottom: 8px !important;
           }
           
           .mt-2 {
             margin-top: 8px !important;
           }
           
           .flex {
             display: flex !important;
           }
           
           .justify-between {
             justify-content: space-between !important;
           }
           
           .items-start {
             align-items: flex-start !important;
           }
           
           img {
             max-height: 60px !important;
             width: auto !important;
             margin-bottom: 12px !important;
           }
           
           .invoice-header {
             margin-bottom: 30px !important;
             padding-bottom: 20px !important;
             border-bottom: 2px solid #e5e7eb !important;
           }
           
           .invoice-footer {
             margin-top: 30px !important;
             padding-top: 20px !important;
             border-top: 1px solid #e5e7eb !important;
             text-align: center !important;
             line-height: 1.6 !important;
           }
         `;
        document.head.appendChild(overrideStyle);
        
        // Wait for styles to be applied
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Configure html2canvas options for better quality
        const canvas = await html2canvas(invoiceRef.current, {
          scale: 1.5, // Reduced scale to avoid memory issues
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: invoiceRef.current.scrollWidth,
          height: invoiceRef.current.scrollHeight,
          windowWidth: 1200,
          windowHeight: 800,
          onclone: (clonedDoc) => {
            // Additional cleanup in the cloned document
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((el: any) => {
              // Remove any style attributes that might contain oklch
              if (el.style) {
                // Clear problematic CSS properties
                el.style.removeProperty('color');
                el.style.removeProperty('background-color');
                el.style.removeProperty('border-color');
                // Set safe defaults
                el.style.color = 'black';
                el.style.backgroundColor = 'white';
                el.style.borderColor = '#d1d5db';
              }
            });
          }
        });
        
                 // Remove override style
         document.head.removeChild(overrideStyle);

        // Get canvas dimensions
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        // Create PDF document
        const pdf = new jsPDF('p', 'mm', 'a4');
        let position = 0;

        // Add first page
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if content is longer than one page
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Generate filename with order ID and current date
        const currentDate = new Date().toISOString().split('T')[0];
        const filename = `invoice-${order?.id || 'unknown'}-${currentDate}.pdf`;

        // Download the PDF
        pdf.save(filename);
        
        console.log(`PDF generated and downloaded: ${filename}`);
        
      } catch (err) {
        console.error("Error generating PDF:", err);
        alert("There was an error generating the PDF. Please try again.");
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 300);
  };

  // Send invoice email function
  const handleSendInvoiceEmail = async () => {
    if (!order || !order.id) {
      setEmailError('Cannot send invoice: order information is missing');
      return;
    }

    // Get customer email from order (now includes joined user data)
    let customerEmail = order.customer?.email;
    
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
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-6 sm:p-8 lg:p-12"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col border border-gray-100 backdrop-blur-sm">
        {/* Header */}
        <div className="modal-header flex justify-between items-center border-b border-gray-200 p-6 bg-gradient-to-r from-emerald-50 to-teal-50">
          <h2 className="text-2xl font-bold text-gray-800">📋 Order Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs flex border-b border-gray-200 bg-gray-50 px-6">
          <button
            className={`py-4 px-6 font-semibold text-sm transition-all duration-200 ${
              activeTab === 'details' 
                ? 'text-emerald-600 border-b-3 border-emerald-600 bg-white -mb-px rounded-t-lg' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-t-lg'
            }`}
            onClick={() => setActiveTab('details')}
          >
            📋 Order Details
          </button>
          <button
            className={`py-4 px-6 font-semibold text-sm transition-all duration-200 ml-2 ${
              activeTab === 'invoice' 
                ? 'text-emerald-600 border-b-3 border-emerald-600 bg-white -mb-px rounded-t-lg' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-t-lg'
            }`}
            onClick={() => setActiveTab('invoice')}
          >
            🧾 Invoice
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Details tab content */}
          <div className={`${activeTab === 'details' ? 'block' : 'hidden'}`}>
            <div className="space-y-8">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    📦 Order Information
                  </h3>
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

                <div className="bg-blue-50 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    👤 Customer Information
                  </h3>
                  {order.customer ? (
                    <>
                      <p className="mt-1">
                        <span className="font-medium">Name:</span> {order.customer.name || 'N/A'}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span> {order.customer?.email || 'N/A'}
                      </p>
                      <p>
                        <span className="font-medium">Phone:</span> {order.customer.phone || 'N/A'}
                      </p>
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
                      <p>
                        <span className="font-medium">Phone:</span> N/A
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  🚚 Delivery Information
                </h3>
                <p className="mt-1"><span className="font-medium">Address:</span> {order.delivery_address || 'Not specified'}</p>
                
                {/* Customer Phone */}
                <p className="mt-1">
                  <span className="font-medium">Customer Phone:</span> {order.customer?.phone || 'N/A'}
                </p>
                
                {/* Driver Information */}
                {order.assigned_driver_id ? (
                  <div className="mt-3 border-t border-green-200 pt-3">
                    <p className="font-medium text-gray-700 mb-2">📱 Assigned Driver:</p>
                    {isLoadingDriver ? (
                      <p className="text-gray-500 text-sm">Loading driver information...</p>
                    ) : driver ? (
                      <div className="ml-4 space-y-1">
                        <p><span className="font-medium">Name:</span> {driver.name || 'N/A'}</p>
                        <p><span className="font-medium">Email:</span> {driver.email || 'N/A'}</p>
                        <p><span className="font-medium">Phone:</span> {driver.phone || 'N/A'}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm ml-4">Driver information not available</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 pt-3 border-t border-green-200"><span className="font-medium">Driver:</span> Not assigned</p>
                )}
                
                {order.notes && (
                  <div className="mt-3 border-t border-green-200 pt-3">
                    <p><span className="font-medium">Notes:</span> {order.notes}</p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="bg-purple-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  🛒 Order Items
                </h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
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
                         
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice tab content */}
          <div className={`${activeTab === 'invoice' ? 'block' : 'hidden'}`}>
            <div ref={invoiceRef} className="invoice-content p-6 print:p-0 print:shadow-none">
              <div className="max-w-3xl mx-auto bg-white print:shadow-none">
                <div className="invoice-header flex justify-between items-start mb-8">
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
                    </div>
                  </div>
                </div>
                
                <table className="min-w-full border border-gray-300 mb-8">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 border-b text-left">Item</th>
                      <th className="py-2 px-4 border-b text-left">SKU</th>
                      <th className="py-2 px-4 border-b text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-2 px-4 border-b">
                          {getProductName(item)}
                        </td>
                        <td className="py-2 px-4 border-b text-left">{item.product?.sku}</td>
                        <td className="py-2 px-4 border-b text-right">
                          {item.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="mb-8">
                  <h2 className="text-gray-700 font-semibold mb-2">Notes:</h2>
                  <p className="text-gray-700">{order.notes || 'No additional notes'}</p>
                </div>
                
                <div className="invoice-footer text-center text-gray-600 text-sm">
                  <p>Thank you for your business!</p>
                  {appSettings?.company_name && <p>© {new Date().getFullYear()} {appSettings.company_name}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {emailSent && (
          <div className="mx-6 mb-4 p-4 bg-green-50 text-green-700 rounded-xl text-center font-medium border border-green-200">
            ✅ Invoice email sent successfully!
          </div>
        )}

        {emailError && (
          <div className="mx-6 mb-4 p-4 bg-red-50 text-red-700 rounded-xl text-center font-medium border border-red-200">
            ❌ Error: {emailError}
          </div>
        )}

        {/* Footer */}
        <div className="modal-footer border-t border-gray-200 p-6 bg-gray-50 flex flex-col sm:flex-row justify-between gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 font-medium"
          >
            ❌ Close
          </button>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSendInvoiceEmail}
              disabled={sendingEmail}
              className={`px-6 py-3 flex items-center justify-center space-x-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 
                ${sendingEmail 
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'} 
                text-white`}
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
                  <span>📧 Email Invoice</span>
                </>
              )}
            </button>
            
                        <button
              onClick={handlePrintRequest}
              disabled={isGeneratingPdf}
              className={`px-6 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isGeneratingPdf 
                  ? 'bg-emerald-400 cursor-not-allowed text-white'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg'
              }`}
            >
              {isGeneratingPdf ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating PDF...</span>
                </>
              ) : (
                <span>📄 Download PDF</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 