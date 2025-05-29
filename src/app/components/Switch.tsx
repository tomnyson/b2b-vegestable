'use client';

import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export default function Switch({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  className = ''
}: SwitchProps) {
  const sizeClasses = {
    sm: {
      switch: 'h-5 w-9 sm:h-6 sm:w-10',
      thumb: 'h-4 w-4 sm:h-5 sm:w-5',
      translateChecked: 'translate-x-4 sm:translate-x-5',
      translateUnchecked: 'translate-x-0'
    },
    md: {
      switch: 'h-6 w-11 sm:h-7 sm:w-12',
      thumb: 'h-5 w-5 sm:h-6 sm:w-6',
      translateChecked: 'translate-x-5 sm:translate-x-6',
      translateUnchecked: 'translate-x-0'
    },
    lg: {
      switch: 'h-7 w-13 sm:h-8 sm:w-14',
      thumb: 'h-6 w-6 sm:h-7 sm:w-7',
      translateChecked: 'translate-x-6 sm:translate-x-7',
      translateUnchecked: 'translate-x-0'
    }
  };

  const {
    switch: switchClass,
    thumb: thumbClass,
    translateChecked,
    translateUnchecked
  } = sizeClasses[size];

  return (
    <div className={`flex items-center ${className}`}>
      {label && (
        <span className="text-sm font-medium text-gray-700 mr-3">
          {label}
        </span>
      )}
      <button
        type="button"
        className={`
          relative inline-flex ${switchClass} items-center justify-center rounded-full border-2 border-transparent 
          ${checked 
            ? 'bg-emerald-600 focus:ring-emerald-500' 
            : 'bg-gray-200 focus:ring-gray-300'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:shadow-md'
          }
          focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out
        `}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        aria-pressed={checked}
        aria-label={label || 'Toggle switch'}
      >
        <span
          className={`
            ${thumbClass} inline-block transform bg-white rounded-full shadow-lg ring-0 transition-transform duration-200 ease-in-out
            ${checked ? translateChecked : translateUnchecked}
          `}
        />
      </button>
    </div>
  );
}