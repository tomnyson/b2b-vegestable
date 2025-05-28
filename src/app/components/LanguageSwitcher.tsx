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
        className="flex items-center space-x-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white hover:border-gray-300 transition-all duration-200 shadow-sm min-w-[120px] relative z-[1000]"
        aria-label="Select Language"
      >
        <span className="text-lg">
          {currentLanguage.flag}
        </span>
        <span className="text-sm font-medium text-gray-600">
          {currentLanguage.code.toUpperCase()}
        </span>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Language Dropdown */}
      {isOpen && (
        <div className="top-[calc(100%+0.5rem)] right-0 mt-2 w-64 bg-white/95 backdrop-blur-lg border border-gray-200 rounded-xl shadow-2xl z-[1001] overflow-hidden">
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              {t('language')}
            </div>
            {SUPPORTED_LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageSelect(language.code)}
                className={`w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors duration-200 flex items-center justify-between ${
                  currentLocale === language.code 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-lg w-6 text-center flex-shrink-0">
                    {language.flag}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {language.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {language.code.toUpperCase()} → {LANGUAGE_CURRENCY_MAP[language.code]}
                    </div>
                  </div>
                </div>
                {currentLocale === language.code && (
                  <svg className="w-4 h-4 text-emerald-600 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;