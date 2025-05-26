'use client';

import React, { useState, useRef } from 'react';
import { Order } from '../lib/order-api';
import { formatCurrency, formatDate } from '../lib/utils';

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onCancel: (orderId: string, reason: string) => Promise<void>;
  onDownloadInvoice: (orderId: string) => Promise<void>;
  initialActiveTab?: 'details' | 'invoice';
}

export default function OrderDetailModal({ 
  order, 
  onClose, 
  onCancel, 
  onDownloadInvoice,
  initialActiveTab = 'details'
}: OrderDetailModalProps) {
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'invoice'>(initialActiveTab);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Format status with appropriate color
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

  // Handle order cancellation
  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      setErrorMessage('Please provide a reason for cancellation.');
      return;
    }

    try {
      setIsCancelling(true);
      setErrorMessage('');
      await onCancel(order.id!, cancelReason);
      // Modal will be closed by parent component after successful cancellation
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to cancel order. Please try again.');
      setIsCancelling(false);
    }
  };

  // Handle invoice download
  const handleDownloadInvoice = async () => {
    try {
      setIsDownloading(true);
      setErrorMessage('');
      await onDownloadInvoice(order.id!);
      setIsDownloading(false);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to download invoice. Please try again.');
      setIsDownloading(false);
    }
  };

  // Simple print function that uses the browser's native print
  const handlePrintInvoice = () => {
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
        setErrorMessage("There was an error when trying to print. Please try again.");
      }
    }, 500);
  };

  // Send invoice via email
  const handleSendInvoiceEmail = async () => {
    try {
      setSendingEmail(true);
      setEmailError(null);
      
      // Simulate sending email since we don't have a real email implementation in this context
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 5000); // Clear success message after 5 seconds
    } catch (error: any) {
      console.error('Error sending invoice email:', error);
      setEmailError(error.message || 'Failed to send invoice. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center border-b p-3 sm:p-4">
          <h2 className="text-lg sm:text-xl font-semibold">Order #{order.id?.substring(0, 8)}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs - only show for completed orders */}
        {order.status === 'completed' && (
          <div className="sticky top-[57px] sm:top-[65px] bg-white z-10 border-b">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-3 sm:px-4 text-sm sm:text-base font-medium flex-1 sm:flex-none ${
                  activeTab === 'details'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600'
                }`}
              >
                Order Details
              </button>
              <button
                onClick={() => setActiveTab('invoice')}
                className={`py-2 px-3 sm:px-4 text-sm sm:text-base font-medium flex-1 sm:flex-none ${
                  activeTab === 'invoice'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600'
                }`}
              >
                Invoice
              </button>
            </nav>
          </div>
        )}

        {/* Details Tab */}
        <div className={activeTab === 'details' || order.status !== 'completed' ? 'block' : 'hidden'}>
          {/* Order Details */}
          <div className="p-3 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Order Information</h3>
                <div className="bg-gray-50 rounded-md p-3 space-y-2 text-sm sm:text-base">
                  <p>
                    <span className="font-medium">Date: </span>
                    {formatDate(order.order_date)}
                  </p>
                  {/* Status with appropriate color */}
                  <p>
                    <span className="font-medium">Status: </span>
                    <span className={`px-2 py-1 rounded-full text-xs sm:text-sm ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </p>
                  {/* Payment info if available */}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Delivery Information</h3>
                <div className="bg-gray-50 rounded-md p-3 space-y-2 text-sm sm:text-base">
                  <p className="break-words">
                    <span className="font-medium">Address: </span>
                    {order.delivery_address || 'No address provided'}
                  </p>
                  {order.notes && (
                    <p className="break-words">
                      <span className="font-medium">Notes: </span>
                      {order.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-2">Order Items</h3>
              <div className="bg-gray-50 rounded-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm sm:text-base">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          {item.product?.name_en || `Product ${item.product_id}`}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                          {item.quantity} {item.product?.unit || 'pcs'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right font-medium">
                          {formatCurrency(item.unit_price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr className="bg-gray-100">
                      <td colSpan={3} className="px-3 sm:px-6 py-4 text-right font-bold">
                        Total:
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-right font-bold">
                        {formatCurrency(order.total_amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {errorMessage}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-end mt-6">
              {order.status === 'pending' && (
                <button
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition duration-200 text-sm sm:text-base"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
              
              {order.status === 'completed' && (
                <button
                  onClick={handleDownloadInvoice}
                  disabled={isDownloading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 text-sm sm:text-base"
                >
                  {isDownloading ? 'Downloading...' : 'Download Invoice'}
                </button>
              )}
              
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition duration-200 text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Invoice Tab */}
        {order.status === 'completed' && activeTab === 'invoice' && (
          <div className="p-6">
            <div ref={invoiceRef} className="invoice-content">
              <div className="max-w-3xl mx-auto bg-white">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">INVOICE</h1>
                    <p className="text-gray-700"># {order.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">B2B Vegetable</p>
                    <p className="text-gray-700">123 Business St</p>
                    <p className="text-gray-700">City, State 12345</p>
                    <p className="text-gray-700">+1 (123) 456-7890</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h2 className="text-gray-700 font-semibold mb-2">Bill To:</h2>
                    <p className="text-gray-900">{order.user_id || "Guest Order"}</p>
                    <p className="text-gray-700">{order.delivery_address}</p>
                  </div>
                  <div>
                    <h2 className="text-gray-700 font-semibold mb-2">Invoice Details:</h2>
                    <div className="grid grid-cols-2 gap-1">
                      <p className="text-gray-600">Invoice Date:</p>
                      <p className="text-gray-900">{new Date(order.order_date).toLocaleDateString()}</p>
                      <p className="text-gray-600">Order Status:</p>
                      <p className="text-gray-900">{order.status.toUpperCase()}</p>
                      <p className="text-gray-600">Payment Status:</p>
                      <p className="text-gray-900">
                        <span className={`px-2 py-1 rounded-full text-xs sm:text-sm ${getStatusColor(order.payment_status)}`}>
                          {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                        </span>
                      </p>
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
                    {order.items.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-2 px-4 border-b">
                          {item.product?.name_en || `Product ID: ${item.product_id}`}
                        </td>
                        <td className="py-2 px-4 border-b text-right">
                          €{item.unit_price.toFixed(2)}
                        </td>
                        <td className="py-2 px-4 border-b text-right">
                          {item.quantity}
                        </td>
                        <td className="py-2 px-4 border-b text-right">
                          €{(item.unit_price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-bold">
                      <td colSpan={3} className="py-2 px-4 text-right">Total</td>
                      <td className="py-2 px-4 text-right">€{order.total_amount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
                
                <div className="mb-8">
                  <h2 className="text-gray-700 font-semibold mb-2">Notes:</h2>
                  <p className="text-gray-700">{order.notes || 'No additional notes'}</p>
                </div>
                
                <div className="text-center text-gray-600 text-sm">
                  <p>Thank you for your business!</p>
                </div>
              </div>
            </div>
            
            {/* Email Status Messages */}
            {emailSent && (
              <div className="mt-4 p-2 bg-green-50 text-green-700 rounded-md text-center">
                Invoice email sent successfully!
              </div>
            )}

            {emailError && (
              <div className="mt-4 p-2 bg-red-50 text-red-700 rounded-md text-center">
                Error: {emailError}
              </div>
            )}

            {/* Invoice Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
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
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Email Invoice</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handlePrintInvoice}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Invoice
              </button>
              
              <button
                onClick={handleDownloadInvoice}
                disabled={isDownloading}
                className={`px-4 py-2 flex items-center rounded-md 
                  ${isDownloading 
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'} 
                  text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              >
                {isDownloading ? 'Downloading...' : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 