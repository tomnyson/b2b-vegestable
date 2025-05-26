'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { SUPPORTED_CURRENCIES, getCurrencyInfo } from '../lib/settings-api';

interface CurrencySwitcherProps {
  currentCurrency: string;
  onCurrencyChange: (currency: string) => void;
  className?: string;
}

const CurrencySwitcher: React.FC<CurrencySwitcherProps> = ({
  currentCurrency,
  onCurrencyChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('currency');
  const currentCurrencyInfo = getCurrencyInfo(currentCurrency);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.currency-switcher')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  const handleCurrencySelect = (currencyCode: string) => {
    onCurrencyChange(currencyCode);
    setIsOpen(false);
  };

  return (
    <div className={`relative currency-switcher ${className}`}>
      {/* Currency Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white hover:border-gray-300 transition-all duration-200 shadow-sm min-w-[110px]"
        aria-label="Select Currency"
      >
        <span className="text-lg font-semibold text-gray-700">
          {currentCurrencyInfo.symbol}
        </span>
        <span className="text-sm font-medium text-gray-600">
          {currentCurrencyInfo.code}
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

      {/* Currency Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white/95 backdrop-blur-lg border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              {t('selectCurrency')}
            </div>
            {SUPPORTED_CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleCurrencySelect(currency.code)}
                className={`w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors duration-200 flex items-center justify-between ${
                  currentCurrency === currency.code 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-lg font-semibold w-6 text-center flex-shrink-0">
                    {currency.symbol}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {currency.code}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {currency.name}
                    </div>
                  </div>
                </div>
                {currentCurrency === currency.code && (
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

export default CurrencySwitcher; 