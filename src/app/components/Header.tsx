'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getUser, signOut, getUserProfile } from '../../lib/auth';
import { getAppSettings, AppSettings } from '../lib/settings-api';
import { useState, useEffect } from 'react';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const pathname = usePathname();
  const t = useTranslations('navigation');
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  
  useEffect(() => {
    async function checkAuth() {
      try {
        const [userData, settings] = await Promise.all([
          getUser(),
          getAppSettings()
        ]);
        
        if (userData) {
          setUser(userData);
          
          // Get user profile to determine role
          const profile = await getUserProfile(userData.id);
          if (profile) {
            setUserRole(profile.role);
          }
        }
        
        setAppSettings(settings);
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, []);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-green-600 flex items-center">
            {appSettings?.logo_url ? (
              <img 
                src={appSettings.logo_url} 
                alt="Logo" 
                className="w-8 h-8 mr-2 object-cover rounded-lg"
              />
            ) : (
              <span className="mr-2">🥬</span>
            )}
            {appSettings?.company_name || 'B2B Vegetable'}
          </Link>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMobileMenu}
              className="text-gray-700 hover:text-green-600 focus:outline-none"
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/store" 
              className={`text-sm font-medium ${
                pathname === '/store' 
                  ? 'text-green-600' 
                  : 'text-gray-700 hover:text-green-500'
              }`}
            >
              {t('store')}
            </Link>
            
            {user ? (
              <>
                <Link 
                  href="/profile" 
                  className={`text-sm font-medium ${
                    pathname === '/profile' 
                      ? 'text-green-600' 
                      : 'text-gray-700 hover:text-green-500'
                  }`}
                >
                  {t('profile')}
                </Link>
                
                {/* Show Driver link only for users with driver role */}
                {userRole === 'driver' && (
                  <Link 
                    href="/driver" 
                    className={`text-sm font-medium ${
                      pathname === '/driver' 
                        ? 'text-green-600' 
                        : 'text-gray-700 hover:text-green-500'
                    }`}
                  >
                    {t('deliveries')}
                  </Link>
                )}
                
                <button 
                  onClick={handleSignOut}
                  className="text-sm font-medium text-gray-700 hover:text-red-500"
                >
                  {t('signOut')}
                </button>
              </>
            ) : (
              <Link 
                href="/login" 
                className={`text-sm font-medium ${
                  pathname === '/login' 
                    ? 'text-green-600' 
                    : 'text-gray-700 hover:text-green-500'
                }`}
              >
                {t('signIn')}
              </Link>
            )}
            
            {/* Language Switcher */}
            <LanguageSwitcher className="mx-2" />
          </nav>
        </div>
        
        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-2 border-t pt-4 space-y-4">
            <Link 
              href="/store" 
              className={`block text-sm font-medium ${
                pathname === '/store' 
                  ? 'text-green-600' 
                  : 'text-gray-700 hover:text-green-500'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('store')}
            </Link>
            
            {user ? (
              <>
                <Link 
                  href="/profile" 
                  className={`block text-sm font-medium ${
                    pathname === '/profile' 
                      ? 'text-green-600' 
                      : 'text-gray-700 hover:text-green-500'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('profile')}
                </Link>
                
                {/* Show Driver link only for users with driver role */}
                {userRole === 'driver' && (
                  <Link 
                    href="/driver" 
                    className={`block text-sm font-medium ${
                      pathname === '/driver' 
                        ? 'text-green-600' 
                        : 'text-gray-700 hover:text-green-500'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('deliveries')}
                  </Link>
                )}
                
                <button 
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left text-sm font-medium text-gray-700 hover:text-red-500"
                >
                  {t('signOut')}
                </button>
              </>
            ) : (
              <Link 
                href="/login" 
                className={`block text-sm font-medium ${
                  pathname === '/login' 
                    ? 'text-green-600' 
                    : 'text-gray-700 hover:text-green-500'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('signIn')}
              </Link>
            )}
            
            {/* Language and Currency Switcher for Mobile */}
            <div className="py-4 border-t border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {t('language')}
              </div>
              <LanguageSwitcher />
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 