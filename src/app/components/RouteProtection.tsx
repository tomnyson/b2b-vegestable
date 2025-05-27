'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { canAccessPath, getRedirectPath, getMenuPageFromPath } from '../lib/route-protection';

interface RouteProtectionProps {
  children: React.ReactNode;
  fallbackComponent?: React.ReactNode;
}

export default function RouteProtection({ children, fallbackComponent }: RouteProtectionProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('labels');

  useEffect(() => {
    async function checkAccess() {
      try {
        setIsChecking(true);
        
        // Check if pathname exists
        if (!pathname) {
          setHasAccess(true);
          return;
        }
        
        // Check if the current path is accessible
        const canAccess = await canAccessPath(pathname);
        
        if (!canAccess) {
          // Get the menu page name for better error messaging
          const menuPage = getMenuPageFromPath(pathname);
          console.warn(`Access denied to disabled page: ${menuPage}`);
          
          // Redirect to dashboard
          const redirectPath = getRedirectPath(locale);
          router.replace(redirectPath);
          return;
        }
        
        setHasAccess(true);
      } catch (error) {
        console.error('Error checking route access:', error);
        // On error, allow access (fail open)
        setHasAccess(true);
      } finally {
        setIsChecking(false);
      }
    }

    checkAccess();
  }, [pathname, locale, router]);

  // Show loading state while checking
  if (isChecking) {
    return fallbackComponent || (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <p className="text-lg font-medium text-gray-700">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // If access is denied, show nothing (redirect is happening)
  if (!hasAccess) {
    return null;
  }

  // Render children if access is granted
  return <>{children}</>;
} 