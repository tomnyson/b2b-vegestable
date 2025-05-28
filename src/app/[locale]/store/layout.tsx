'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getUser, getUserProfile } from '../../lib/auth';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        // Get current authenticated user
        const userData = await getUser();
        if (!userData) {
          // Redirect to login if not authenticated
          const locale = pathname?.split('/')[1] || '';
          router.push(`/${locale}/login?redirect=${encodeURIComponent(pathname || '/store')}`);
          return;
        }
        
        // Get user profile to check role
        const profile = await getUserProfile(userData.id);
        if (profile?.role === 'driver') {
          // Redirect drivers to their deliveries page
          router.push('/driver');
          return;
        }
        
        // Allow access for customers and admins
        setIsAuthorized(true);
      } catch (error) {
        console.error('Error checking authorization:', error);
        // Redirect to login on error
        const locale = pathname?.split('/')[1] || '';
        router.push(`/${locale}/login?redirect=${encodeURIComponent(pathname || '/store')}`);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAuth();
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
        <p className="ml-2">Loading...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return (
    <div>
      {children}
    </div>
  );
} 