'use client';

import { useLocale } from 'next-intl';

export default function TestLocale() {
  const locale = useLocale();
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Locale Test Page</h1>
      <p>Current locale: <strong>{locale}</strong></p>
    </div>
  );
} 