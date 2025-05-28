'use client';

import { useEffect } from 'react';
import AuthRedirectHandler from './AuthRedirectHandler';
import ErrorBoundary from './components/ErrorBoundary';

export default function ClientRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This client component wraps the application to handle OAuth sessions
  return (
    <ErrorBoundary>
      <AuthRedirectHandler />
      {children}
    </ErrorBoundary>
  );
} 