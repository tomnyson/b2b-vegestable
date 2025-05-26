'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { sendDriverAssignmentEmail, sendOrderCompletionEmails } from '@/app/lib/email-api';

export default function TestEmailsPage() {
  const t = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [testData, setTestData] = useState({
    orderId: '',
    driverId: '',
    adminId: '',
    customerEmail: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setTestData(prev => ({ ...prev, [field]: value }));
  };

  const testDriverAssignment = async () => {
    if (!testData.orderId || !testData.driverId) {
      setMessage('Please provide Order ID and Driver ID');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await sendDriverAssignmentEmail(testData.orderId, testData.driverId, testData.adminId || undefined);
      setMessage('✅ Driver assignment email sent successfully!');
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testOrderCompletion = async () => {
    if (!testData.orderId || !testData.driverId) {
      setMessage('Please provide Order ID and Driver ID');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await sendOrderCompletionEmails(testData.orderId, testData.driverId);
      setMessage('✅ Order completion emails sent successfully!');
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            📧 Email Notification Testing
          </h1>
          <p className="text-lg text-gray-600">
            Test driver assignment and order completion email notifications
          </p>
        </div>

        {/* Test Form */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Test Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order ID *
              </label>
              <input
                type="text"
                value={testData.orderId}
                onChange={(e) => handleInputChange('orderId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter order ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver ID *
              </label>
              <input
                type="text"
                value={testData.driverId}
                onChange={(e) => handleInputChange('driverId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter driver ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin ID (optional)
              </label>
              <input
                type="text"
                value={testData.adminId}
                onChange={(e) => handleInputChange('adminId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter admin ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Email (optional)
              </label>
              <input
                type="email"
                value={testData.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter customer email"
              />
            </div>
          </div>

          {/* Test Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <button
              onClick={testDriverAssignment}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Testing...
                </>
              ) : (
                <>
                  🚚 Test Driver Assignment Email
                </>
              )}
            </button>

            <button
              onClick={testOrderCompletion}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Testing...
                </>
              ) : (
                <>
                  ✅ Test Order Completion Emails
                </>
              )}
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-lg ${
              message.includes('✅') 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              🚚 Driver Assignment Email
            </h3>
            <ul className="text-gray-600 space-y-2">
              <li>• Sent to driver when assigned to an order</li>
              <li>• Includes order details and customer information</li>
              <li>• Contains special instructions if any</li>
              <li>• Prompts driver to log into dashboard</li>
            </ul>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              ✅ Order Completion Emails
            </h3>
            <ul className="text-gray-600 space-y-2">
              <li>• Customer email: Delivery confirmation</li>
              <li>• Admin email: Completion notification</li>
              <li>• Includes delivery details and items</li>
              <li>• Automatic when driver marks order complete</li>
            </ul>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 mt-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">📋 How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Automatic Triggers:</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Admin assigns driver to order → Driver gets email</li>
                <li>• Driver marks order complete → Customer & admin get emails</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Email Content:</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Professional HTML templates</li>
                <li>• Company branding and contact info</li>
                <li>• Order details and customer information</li>
                <li>• Responsive design for all devices</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 