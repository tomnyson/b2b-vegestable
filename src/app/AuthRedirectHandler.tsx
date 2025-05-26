'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { handleOAuthSession } from '../lib/auth';

export default function AuthRedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    async function handleAuthRedirect() {
      try {
        const session = await handleOAuthSession();
        
        if (session) {
          console.log('Successfully handled OAuth session');
        }
      } catch (error) {
        console.error('Error handling OAuth redirect:', error);
      }
    }

    handleAuthRedirect();
  }, [router]);

  // This component doesn't render anything
  return null;
} 