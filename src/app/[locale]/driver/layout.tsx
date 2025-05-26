'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, getUserProfile } from '../../lib/auth';

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        // Get current authenticated user
        const userData = await getUser();
        if (!userData) {
          // Redirect to login if not logged in
          router.push('/login');
          return;
        }
        
        // Get user profile to check role
        const profile = await getUserProfile(userData.id);
        if (profile?.role !== 'driver') {
          // Redirect to store if not a driver
          router.push('/store');
          return;
        }
        
        // User is authorized
        setIsAuthorized(true);
      } catch (error) {
        console.error('Error checking authorization:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAuth();
  }, [router]);

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