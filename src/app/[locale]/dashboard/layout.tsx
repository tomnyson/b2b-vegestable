'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getUser, getUserProfile, signOut } from '../../../lib/auth';
import { getAppSettings, AppSettings } from '../../lib/settings-api';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/app/components/LanguageSwitcher';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();

  // Build navigation items with translations and locale-aware URLs
  const navigation = [
    {
      name: t('navigation.overview'),
      href: pathname?.split('/').slice(0, 3).join('/') || '/dashboard',
      enabled: appSettings?.enable_overview !== false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      name: t('navigation.products'),
      href: `${pathname?.split('/').slice(0, 3).join('/')}/products` || '/dashboard/products',
      enabled: appSettings?.enable_products !== false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      name: t('navigation.orders'),
      href: `${pathname?.split('/').slice(0, 3).join('/')}/orders` || '/dashboard/orders',
      enabled: appSettings?.enable_orders !== false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      name: t('navigation.orderSummary'),
      href: `${pathname?.split('/').slice(0, 3).join('/')}/summary` || '/dashboard/summary',
      enabled: appSettings?.enable_order_summary !== false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      name: t('navigation.users'),
      href: `${pathname?.split('/').slice(0, 3).join('/')}/users` || '/dashboard/users',
      enabled: appSettings?.enable_users !== false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    {
      name: t('navigation.drivers'),
      href: `${pathname?.split('/').slice(0, 3).join('/')}/drivers` || '/dashboard/drivers',
      enabled: appSettings?.enable_drivers !== false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      name: t('navigation.settings'),
      href: `${pathname?.split('/').slice(0, 3).join('/')}/settings` || '/dashboard/settings',
      enabled: appSettings?.enable_settings !== false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      name: t('navigation.store'),
      href: '/store',
      enabled: appSettings?.enable_store !== false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m-.4-2l.4 2m0 0L5 9m0 0L5 9m0 0l4 8m0 0l8-8M7 13l-2-5m2 5l2 2.5M17 13v6a1 1 0 01-1 1H8a1 1 0 01-1-1v-6" />
        </svg>
      )
    },
    {
      name: t('navigation.invoices'),
      href: `${pathname?.split('/').slice(0, 3).join('/')}/invoices` || '/dashboard/invoices',
      enabled: appSettings?.enable_invoices !== false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17h6m-6-4h6m-7 8l-2 2-2-2-2 2-2-2V5a2 2 0 012-2h14a2 2 0 012 2v16l-2-2-2 2-2-2-2 2-2-2z" />
        </svg>
      )
    }
  ].filter(item => item.enabled); // Filter out disabled menu items

  useEffect(() => {
    async function fetchUserData() {
      try {
        const userData = await getUser();
        if (!userData) {
          router.push('/login');
          return;
        }

        setUser(userData);

        // Get user profile
        const profile = await getUserProfile(userData.id);
        setUserProfile(profile);

        // Check if user is admin
        if (profile?.role !== 'admin') {
          router.push('/store');
          return;
        }

        // Load app settings for menu configuration
        try {
          const settings = await getAppSettings();
          setAppSettings(settings);
        } catch (settingsError) {
          console.error('Error loading app settings:', settingsError);
          // Continue without settings - all menus will be enabled by default
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [router]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <p className="text-lg font-medium text-gray-700">{t('labels.loading')}</p>
        </div>
      </div>
    );
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 ${sidebarOpen ? 'w-72' : 'w-20'
        } lg:${sidebarOpen ? 'w-72' : 'w-20'} ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } transition-all duration-300 ease-in-out`}>

        <div className="flex flex-col h-full bg-white/90 backdrop-blur-xl shadow-2xl border-r border-white/20">
          {/* Logo Section */}
          <div className="flex items-center justify-between h-20 px-6 bg-gradient-to-r from-emerald-500 to-teal-600">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm overflow-hidden">
                {appSettings?.logo_url ? (
                  <img
                    src={appSettings.logo_url}
                    alt="Logo"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {appSettings?.company_name || t('appName')}
                  </h1>
                  <p className="text-emerald-100 text-xs font-medium">Admin Dashboard</p>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-white/80 hover:text-white p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Toggle Button - Desktop Only */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex absolute -right-4 top-24 bg-white rounded-full p-2 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 z-10 group"
          >
            <svg
              className={`w-4 h-4 text-gray-600 group-hover:text-emerald-600 transition-colors ${sidebarOpen ? 'rotate-0' : 'rotate-180'
                }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-200 group ${isActive
                      ? 'text-emerald-600 text-bold'
                      : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  title={!sidebarOpen ? item.name : ''}
                >
                  <span className={`flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-gray-500 group-hover:text-emerald-600'}`}>
                    {item.icon}
                  </span>
                  {sidebarOpen && (
                    <span className="ml-3 truncate">{item.name}</span>
                  )}
                  {!sidebarOpen && (
                    <span className="absolute left-20 bg-gray-900 text-white text-xs rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.name}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Language Switcher */}
          <div className="px-6 py-4 border-t border-gray-100 relative">
            <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
              {t('labels.language')}
            </p>
              <LanguageSwitcher />
          </div>

          {/* User Profile */}
          <div className="p-6 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">
                    {userProfile?.name?.[0] || user?.email?.[0] || 'A'}
                  </span>
                </div>
              </div>
              {sidebarOpen && (
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {userProfile?.name || user?.email || t('labels.admin')}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {userProfile?.role || 'Admin'}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors flex items-center"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t('actions.logout')}
                  </button>
                </div>
              )}
              {!sidebarOpen && (
                <div className="absolute left-20 bg-gray-900 text-white text-xs rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 group">
                  <p className="font-medium">{userProfile?.name || user?.email}</p>
                  <p className="text-gray-300">{userProfile?.role || 'Admin'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-xl shadow-lg border-b border-white/20">
        <div className="flex items-center justify-between h-16 px-4">
          <button
            onClick={toggleMobileMenu}
            className="p-2 text-gray-600 hover:text-emerald-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center overflow-hidden">
              {appSettings?.logo_url ? (
                <img
                  src={appSettings.logo_url}
                  alt="Logo"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {appSettings?.company_name || t('appName')}
            </span>
          </div>

          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <span className="text-sm font-bold text-white">
              {userProfile?.name?.[0] || user?.email?.[0] || 'A'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'lg:pl-72' : 'lg:pl-20'} transition-all duration-300 pt-16 lg:pt-0`}>
        <main className="p-6 lg:p-8 min-h-screen">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 