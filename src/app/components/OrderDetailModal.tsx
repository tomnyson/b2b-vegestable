'use client';

import React, { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('orders');
  const commonT = useTranslations('common');
  
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
      setErrorMessage(t('cancelReasonRequired'));
      return;
    }

    try {
      setIsCancelling(true);
      setErrorMessage('');
      await onCancel(order.id!, cancelReason);
      // Modal will be closed by parent component after successful cancellation
    } catch (error: any) {
      setErrorMessage(error.message || t('cancelOrderFailed'));
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
      setErrorMessage(error.message || t('downloadInvoiceFailed'));
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
        setErrorMessage(t('printError'));
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
      setEmailError(error.message || t('sendInvoiceEmailFailed'));
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center border-b p-3 sm:p-4">
          <h2 className="text-lg sm:text-xl font-semibold">
            {t('orderNumber', { orderNumber: order.id?.substring(0, 8) || 'N/A' })}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            aria-label={commonT('actions.cancel')}
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
                {t('orderDetails')}
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
                <h3 className="font-medium text-gray-700 mb-2">{t('orderInformation')}</h3>
                <div className="bg-gray-50 rounded-md p-3 space-y-2 text-sm sm:text-base">
                  <p>
                    <span className="font-medium">{commonT('labels.date')}: </span>
                    {formatDate(order.order_date)}
                  </p>
                  {/* Status with appropriate color */}
                  <p>
                    <span className="font-medium">{commonT('labels.status')}: </span>
                    <span className={`px-2 py-1 rounded-full text-xs sm:text-sm ${getStatusColor(order.status)}`}>
                      {t(`status.${order.status}`)}
                    </span>
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">{t('deliveryInformation')}</h3>
                <div className="bg-gray-50 rounded-md p-3 space-y-2 text-sm sm:text-base">
                  <p className="break-words">
                    <span className="font-medium">{commonT('labels.address')}: </span>
                    {order.delivery_address || t('noAddressProvided')}
                  </p>
                  {order.notes && (
                    <p className="break-words">
                      <span className="font-medium">{t('notes')}: </span>
                      {order.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-2">{t('orderItems')}</h3>
              <div className="bg-gray-50 rounded-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm sm:text-base">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        {commonT('labels.productName')}
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        {t('sku')}
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        {commonT('labels.unit')}
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        {commonT('labels.quantity')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          {item.product?.name_en || t('productWithId', { productId: item.product_id })}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          {item.product?.sku}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          {item.product?.unit}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                          {item.quantity} {item.product?.unit || 'pcs'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
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
                  {isCancelling ? t('cancelling') : t('cancelOrder')}
                </button>
              )}
              
              {order.status === 'completed' && (
                <button
                  onClick={handleDownloadInvoice}
                  disabled={isDownloading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 text-sm sm:text-base"
                >
                  {isDownloading ? t('downloading') : t('downloadInvoice')}
                </button>
              )}
              
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition duration-200 text-sm sm:text-base"
              >
                {commonT('actions.cancel')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 