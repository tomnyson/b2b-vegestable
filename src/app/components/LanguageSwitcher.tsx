'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useCurrency } from '../hooks/useCurrency';

interface LanguageSwitcherProps {
  className?: string;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
];

// Language to currency mapping
const LANGUAGE_CURRENCY_MAP: Record<string, string> = {
  'en': 'USD', // English -> US Dollar
  'de': 'EUR', // German -> Euro
  'vi': 'VND', // Vietnamese -> Vietnamese Dong
};

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const t = useTranslations('navigation');
  const { changeCurrency } = useCurrency();

  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLocale) || SUPPORTED_LANGUAGES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.language-switcher')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  const handleLanguageSelect = (languageCode: string) => {
    setIsOpen(false);
    
    // Extract the current path without locale
    const pathWithoutLocale = pathname ? pathname.replace(`/${currentLocale}`, '') || '/' : '/';
    
    // Navigate to the new locale
    router.push(`/${languageCode}${pathWithoutLocale}`);

    // Change currency based on the selected language
    const newCurrency = LANGUAGE_CURRENCY_MAP[languageCode];
    if (newCurrency) {
      changeCurrency(newCurrency);
    }
  };

  return (
    <div className={`relative language-switcher z-[1000] ${className}`}>
      {/* Language Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-2 py-1 text-sm hover:bg-gray-50 transition"
      >
        <span>{currentLanguage.flag}</span>
        <span className="font-semibold">{currentLanguage.code.toUpperCase()}</span>
        {isOpen ? (
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Language Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-24 bg-white border border-gray-200 rounded shadow-lg z-50">
          {SUPPORTED_LANGUAGES.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              className={`w-full px-2 py-1 text-left text-sm flex items-center space-x-2 hover:bg-gray-100 ${
                currentLocale === language.code ? 'font-bold text-emerald-700' : 'text-gray-700'
              }`}
            >
              <span className="w-5">{language.flag}</span>
              <span>{language.code.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;