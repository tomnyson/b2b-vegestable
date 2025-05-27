'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { getUser, getUserProfile } from '../../../lib/auth';
import { AppSettings, getAppSettings, updateAppSettings, uploadLogo, SUPPORTED_LANGUAGES, SUPPORTED_CURRENCIES, getDefaultMenuSettings } from '../../../lib/settings-api';

export default function AdminSettingsPage() {
  const router = useRouter();
  const t = useTranslations('settings');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // File input ref for logo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [logoUrl, setLogoUrl] = useState('');
  const [vatPercentage, setVatPercentage] = useState('');
  const [language, setLanguage] = useState('');
  const [currency, setCurrency] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  
  // Menu configuration state
  const [enableOverview, setEnableOverview] = useState(true);
  const [enableProducts, setEnableProducts] = useState(true);
  const [enableOrders, setEnableOrders] = useState(true);
  const [enableOrderSummary, setEnableOrderSummary] = useState(true);
  const [enableUsers, setEnableUsers] = useState(true);
  const [enableDrivers, setEnableDrivers] = useState(true);
  const [enableSettings, setEnableSettings] = useState(true);
  const [enableStore, setEnableStore] = useState(true);
  
  // Logo preview
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // Check authorization and load settings
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        
        // Check if user is admin
        const user = await getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        
        const userProfile = await getUserProfile(user.id);
        if (userProfile?.role !== 'admin') {
          router.push('/dashboard');
          return;
        }
        
        // Load app settings
        const appSettings = await getAppSettings();
        setSettings(appSettings);
        
        // Initialize form fields
        if (appSettings) {
          setLogoUrl(appSettings.logo_url || '');
          setVatPercentage(appSettings.vat_percentage?.toString() || '');
          setLanguage(appSettings.default_language || 'en');
          setCurrency(appSettings.default_currency || 'USD');
          setCompanyName(appSettings.company_name || '');
          setSupportEmail(appSettings.support_email || '');
          setSupportPhone(appSettings.support_phone || '');
          setLogoPreview(appSettings.logo_url || null);
          
          // Initialize menu settings with defaults if not set
          const defaults = getDefaultMenuSettings();
          setEnableOverview(appSettings.enable_overview ?? defaults.enable_overview);
          setEnableProducts(appSettings.enable_products ?? defaults.enable_products);
          setEnableOrders(appSettings.enable_orders ?? defaults.enable_orders);
          setEnableOrderSummary(appSettings.enable_order_summary ?? defaults.enable_order_summary);
          setEnableUsers(appSettings.enable_users ?? defaults.enable_users);
          setEnableDrivers(appSettings.enable_drivers ?? defaults.enable_drivers);
          setEnableSettings(appSettings.enable_settings ?? defaults.enable_settings);
          setEnableStore(appSettings.enable_store ?? defaults.enable_store);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setErrorMessage(t('loadingError'));
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [router, t]);
  
  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Trigger file input click
  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setErrorMessage('');
      setSuccessMessage('');
      
      // Upload logo if new file selected
      if (fileInputRef.current?.files?.length) {
        const file = fileInputRef.current.files[0];
        const newLogoUrl = await uploadLogo(file);
        setLogoUrl(newLogoUrl);
      }
      
      // Update settings
      const updatedSettings = await updateAppSettings({
        logo_url: logoPreview || logoUrl,
        vat_percentage: parseFloat(vatPercentage) || 0,
        default_language: language,
        default_currency: currency,
        company_name: companyName,
        support_email: supportEmail,
        support_phone: supportPhone,
        // Menu configuration
        enable_overview: enableOverview,
        enable_products: enableProducts,
        enable_orders: enableOrders,
        enable_order_summary: enableOrderSummary,
        enable_users: enableUsers,
        enable_drivers: enableDrivers,
        enable_settings: enableSettings,
        enable_store: enableStore
      });
      
      setSettings(updatedSettings);
      setSuccessMessage(t('saveSuccess'));
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setErrorMessage(t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
          <span className="ml-2">{t('loading')}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-600 mt-1">{t('subtitle')}</p>
      </div>
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-md">
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md">
          {errorMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Logo Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t('branding')}</h2>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              {t('companyLogo')}
            </label>
            
            <div className="flex items-start space-x-4">
              <div 
                onClick={handleLogoClick}
                className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
              >
                {logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt={t('logoPreview')}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-1 text-xs text-gray-500">{t('clickToUpload')}</p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">
                  {t('logoDescription')}
                </p>
                <p className="text-xs text-gray-500">
                  {t('logoFormats')}
                </p>
                
                {logoPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogoPreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    {t('remove')}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="companyName" className="block text-gray-700 text-sm font-medium mb-2">
              {t('companyName')}
            </label>
            <input
              type="text"
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder={t('companyNamePlaceholder')}
            />
          </div>
        </div>
        
        {/* Tax Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t('taxSettings')}</h2>
          
          <div>
            <label htmlFor="vatPercentage" className="block text-gray-700 text-sm font-medium mb-2">
              {t('vatPercentage')}
            </label>
            <div className="flex items-center">
              <input
                type="number"
                id="vatPercentage"
                value={vatPercentage}
                onChange={(e) => setVatPercentage(e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="0.00"
                step="0.01"
                min="0"
                max="100"
              />
              <span className="ml-2 text-gray-600">%</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {t('vatDescription')}
            </p>
          </div>
        </div>
        
        {/* Localization Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t('localization')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="language" className="block text-gray-700 text-sm font-medium mb-2">
                {t('defaultLanguage')}
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full min-w-[180px] px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="currency" className="block text-gray-700 text-sm font-medium mb-2">
                {t('defaultCurrency')}
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full min-w-[200px] px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                {SUPPORTED_CURRENCIES.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {curr.name} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Contact Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t('supportContact')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="supportEmail" className="block text-gray-700 text-sm font-medium mb-2">
                {t('supportEmail')}
              </label>
              <input
                type="email"
                id="supportEmail"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder={t('supportEmailPlaceholder')}
              />
            </div>
            
            <div>
              <label htmlFor="supportPhone" className="block text-gray-700 text-sm font-medium mb-2">
                {t('supportPhone')}
              </label>
              <input
                type="tel"
                id="supportPhone"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder={t('supportPhonePlaceholder')}
              />
            </div>
          </div>
        </div>
        
        {/* Menu Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t('menuConfiguration')}</h2>
          <p className="text-sm text-gray-600 mb-6">{t('menuConfigurationDescription')}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overview Page */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">{t('enableOverview')}</h3>
                <p className="text-xs text-gray-500 mt-1">{t('overviewDescription')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={enableOverview}
                  onChange={(e) => setEnableOverview(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* Products Page */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">{t('enableProducts')}</h3>
                <p className="text-xs text-gray-500 mt-1">{t('productsDescription')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={enableProducts}
                  onChange={(e) => setEnableProducts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* Orders Page */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">{t('enableOrders')}</h3>
                <p className="text-xs text-gray-500 mt-1">{t('ordersDescription')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={enableOrders}
                  onChange={(e) => setEnableOrders(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* Order Summary Page */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">{t('enableOrderSummary')}</h3>
                <p className="text-xs text-gray-500 mt-1">{t('orderSummaryDescription')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={enableOrderSummary}
                  onChange={(e) => setEnableOrderSummary(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* Users Page */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">{t('enableUsers')}</h3>
                <p className="text-xs text-gray-500 mt-1">{t('usersDescription')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={enableUsers}
                  onChange={(e) => setEnableUsers(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* Drivers Page */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">{t('enableDrivers')}</h3>
                <p className="text-xs text-gray-500 mt-1">{t('driversDescription')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={enableDrivers}
                  onChange={(e) => setEnableDrivers(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* Settings Page */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">{t('enableSettings')}</h3>
                <p className="text-xs text-gray-500 mt-1">{t('settingsDescription')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={enableSettings}
                  onChange={(e) => setEnableSettings(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* Store Page */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">{t('enableStore')}</h3>
                <p className="text-xs text-gray-500 mt-1">{t('storeDescription')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={enableStore}
                  onChange={(e) => setEnableStore(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center"
          >
            {isSaving && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSaving ? t('saving') : t('saveSettings')}
          </button>
        </div>
      </form>
    </div>
  );
} 