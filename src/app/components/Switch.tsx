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
      switch: 'h-6 w-20 sm:h-7 sm:w-14',
      thumb: 'h-3 w-3 sm:h-4 sm:w-4',
      translateChecked: 'translate-x-8 sm:translate-x-2',
      translateUnchecked: 'translate-x-1',
      label: 'text-sm'
    },
    md: {
      switch: 'h-6 w-11 sm:h-7 sm:w-14',
      thumb: 'h-4 w-4 sm:h-5 sm:w-5',
      translateChecked: 'translate-x-5 sm:translate-x-7',
      translateUnchecked: 'translate-x-1',
      label: 'text-sm sm:text-base'
    },
    lg: {
      switch: 'h-7 w-14 sm:h-8 sm:w-16',
      thumb: 'h-5 w-5 sm:h-6 sm:w-6',
      translateChecked: 'translate-x-7 sm:translate-x-8',
      translateUnchecked: 'translate-x-1',
      label: 'text-base sm:text-lg'
    }
  };

  const {
    switch: switchClass,
    thumb: thumbClass,
    translateChecked,
    translateUnchecked,
    label: labelClass
  } = sizeClasses[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {label && (
        <span className={`font-medium text-gray-700 ${labelClass} select-none leading-none`}>
          {label}
        </span>
      )}
      <button
        type="button"
        className={`
          relative inline-flex ${switchClass} flex-shrink-0 items-center justify-start
          rounded-full border-2 border-transparent transition-all duration-300 ease-in-out
          ${checked 
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-200/50' 
            : 'bg-gray-200 hover:bg-gray-300'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:shadow-md focus:shadow-lg transform hover:scale-105 active:scale-95'
          }
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
          touch-manipulation
        `}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        aria-pressed={checked}
        aria-label={label || 'Toggle switch'}
        role="switch"
      >
        <span
          className={`
            ${thumbClass} inline-block transform bg-white rounded-full 
            shadow-lg ring-0 transition-all duration-300 ease-in-out
            ${checked ? translateChecked : translateUnchecked}
            ${checked ? 'shadow-emerald-100' : 'shadow-gray-300'}
          `}
        />
      </button>
    </div>
  );
}