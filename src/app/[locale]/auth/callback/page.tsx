'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase'; // hoặc đường dẫn tới file supabase client của bạn

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = Array.isArray(params?.locale) ? params?.locale[0] : params?.locale || 'en';
  const t = useTranslations('auth');

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        router.push(`/${locale}/login`);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const role = user?.user_metadata?.role;

      if (role === 'admin') {
        router.push(`/${locale}/dashboard`);
      } else if (role === 'driver') {
        router.push(`/${locale}/driver`);
      } else {
        router.push(`/${locale}/store`);
      }
      return;
    };

    checkSession();
  }, [router, searchParams, locale]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-gray-600 text-sm">{t('authenticating')}</div>
    </div>
  );
}