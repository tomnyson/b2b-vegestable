'use client';

import Link from 'next/link';
import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Privacy Policy
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose max-w-none">
          <h3>1. Information We Collect</h3>
          <p>
            We collect information you provide directly to us, such as when you create or modify your account, 
            place orders, contact customer support, or otherwise communicate with us. This information may include 
            your name, email address, phone number, delivery address, and payment information.
          </p>

          <h3>2. How We Use Your Information</h3>
          <p>
            We use the information we collect to:
          </p>
          <ul>
            <li>Process and deliver your orders</li>
            <li>Send you technical notices and support messages</li>
            <li>Communicate with you about products, services, and events</li>
            <li>Monitor and analyze trends and usage</li>
            <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
            <li>Personalize your experience</li>
          </ul>

          <h3>3. Sharing of Information</h3>
          <p>
            We may share the information we collect as follows:
          </p>
          <ul>
            <li>With vendors and service providers who perform services on our behalf</li>
            <li>In connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition</li>
            <li>To comply with laws or respond to lawful requests</li>
            <li>To protect the rights, property, and safety of our users and others</li>
          </ul>

          <h3>4. Data Security</h3>
          <p>
            We take reasonable measures to help protect your personal information from loss, theft, misuse, 
            unauthorized access, disclosure, alteration, and destruction.
          </p>

          <h3>5. Your Choices</h3>
          <p>
            You may update, correct, or delete your account information at any time by logging into your account 
            or contacting us. You may also opt out of receiving promotional communications from us by following 
            the instructions in those communications.
          </p>

          <h3>6. Changes to This Policy</h3>
          <p>
            We may update this privacy policy from time to time. We will notify you of any changes by posting 
            the new policy on this page and updating the "Last updated" date.
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