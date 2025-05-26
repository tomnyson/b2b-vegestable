'use client';

import { useEffect } from 'react';
import AuthRedirectHandler from './AuthRedirectHandler';

export default function ClientRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This client component wraps the application to handle OAuth sessions
  return (
    <>
      <AuthRedirectHandler />
      {children}
    </>
  );
} 