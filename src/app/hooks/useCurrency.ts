'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { getAppSettings } from '../lib/settings-api';

const CURRENCY_STORAGE_KEY = 'preferred_currency';

// Language to currency mapping - same as in LanguageSwitcher
const LANGUAGE_CURRENCY_MAP: Record<string, string> = {
  'en': 'USD', // English -> US Dollar
  'de': 'EUR', // German -> Euro
  'vi': 'VND', // Vietnamese -> Vietnamese Dong
  'es': 'USD', // Spanish -> US Dollar
  'zh': 'USD', // Chinese -> US Dollar  
  'fr': 'EUR'  // French -> Euro
};

export function useCurrency() {
  const [currency, setCurrency] = useState<string>('USD');
  const [isLoading, setIsLoading] = useState(true);
  const currentLocale = useLocale();

  // Load currency preference on mount
  useEffect(() => {
    const loadCurrency = async () => {
      try {
        // First try to get user's saved preference
        const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
        
        if (savedCurrency) {
          setCurrency(savedCurrency);
        } else {
          // If no saved preference, use currency based on current language
          const localeCurrency = LANGUAGE_CURRENCY_MAP[currentLocale];
          if (localeCurrency) {
            setCurrency(localeCurrency);
          } else {
            // Fall back to app settings default
            const settings = await getAppSettings();
            const defaultCurrency = settings?.default_currency || 'USD';
            setCurrency(defaultCurrency);
          }
        }
      } catch (error) {
        console.error('Error loading currency preference:', error);
        // Ultimate fallback based on locale
        const localeCurrency = LANGUAGE_CURRENCY_MAP[currentLocale] || 'USD';
        setCurrency(localeCurrency);
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrency();
  }, [currentLocale]);

  // Function to change currency and save to localStorage
  const changeCurrency = (newCurrency: string) => {
    setCurrency(newCurrency);
    localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
  };

  return {
    currency,
    changeCurrency,
    isLoading
  };
} 