'use client';

import Link from 'next/link';
import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Terms of Service
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose max-w-none">
          <h3>1. Acceptance of Terms</h3>
          <p>
            By accessing and using this service, you accept and agree to be bound by the terms and provisions of this agreement.
            If you do not agree to abide by the above, please do not use this service.
          </p>

          <h3>2. Description of Service</h3>
          <p>
            Our platform provides B2B customers with the ability to order fresh vegetables and produce online for delivery.
            We reserve the right to modify, suspend or discontinue the service at any time without notice.
          </p>

          <h3>3. Registration and Account</h3>
          <p>
            In order to use our service, you must:
          </p>
          <ul>
            <li>Register for an account</li>
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain and update your information as needed</li>
            <li>Keep your password secure and confidential</li>
          </ul>
          <p>
            You are responsible for all activities that occur under your account.
          </p>

          <h3>4. Ordering and Payment</h3>
          <p>
            By placing an order, you agree to pay the specified price for the products ordered. 
            All payments must be made through our approved payment methods. Prices are subject to change without notice.
          </p>

          <h3>5. Delivery</h3>
          <p>
            We will make reasonable efforts to deliver orders on time, but we do not guarantee delivery times.
            You are responsible for ensuring that someone is available to receive the delivery at the specified address.
          </p>

          <h3>6. Product Quality</h3>
          <p>
            We strive to provide fresh, high-quality products. If you are not satisfied with the quality of any product,
            please contact us within 24 hours of delivery to discuss potential remedies.
          </p>

          <h3>7. Limitation of Liability</h3>
          <p>
            Our service is provided on an "as is" and "as available" basis. We do not guarantee that the service will be uninterrupted,
            timely, secure, or error-free. We will not be liable for any direct, indirect, incidental, consequential, or exemplary damages.
          </p>

          <h3>8. Changes to Terms</h3>
          <p>
            We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on our website.
            Your continued use of the service after any such changes constitutes your acceptance of the new terms.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 