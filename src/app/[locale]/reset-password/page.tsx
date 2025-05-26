'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import React from 'react';
import { updatePassword } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

export default function ResetPassword({ params }: { params: { locale: string } }) {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sessionValid, setSessionValid] = useState(true);
  const router = useRouter();
  const t = useTranslations('resetPassword');

  // Check if user is authenticated with a recovery token
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError(t('invalidResetLink'));
        setSessionValid(false);
      }
    };
    
    checkSession();
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (formData.password !== formData.confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }
    
    if (formData.password.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }
    
    setLoading(true);
    
    try {
      await updatePassword(formData.password);
      setSuccess(t('passwordUpdateSuccess'));
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push(`/${params.locale}/login`);
      }, 3000);
    } catch (err) {
      console.error('Password update error:', err);
      setError(err instanceof Error ? err.message : t('passwordUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href={`/${params.locale}`} className="inline-flex items-center space-x-3 group mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              B2B Vegetable
            </span>
          </Link>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded-xl animate-fade-in">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-emerald-700 font-medium">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-xl animate-shake">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                {t('newPasswordLabel')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                placeholder={t('newPasswordPlaceholder')}
                disabled={loading || !sessionValid}
                minLength={6}
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                {t('confirmPasswordLabel')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                placeholder={t('confirmPasswordPlaceholder')}
                disabled={loading || !sessionValid}
                minLength={6}
              />
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Password Requirements</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>{t('passwordRequirements')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !sessionValid}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-6 rounded-2xl font-semibold hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              {loading ? t('updating') : t('updatePassword')}
            </button>
          </form>

          {/* Invalid Session State */}
          {!sessionValid && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Session Expired</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Your reset link has expired. Please request a new password reset.</p>
                  </div>
                  <div className="mt-3">
                    <Link 
                      href={`/${params.locale}/forgot-password`}
                      className="text-sm bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg hover:bg-yellow-200 transition-colors font-medium"
                    >
                      Request New Reset Link
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="text-center mt-8 space-y-4">
          <p className="text-gray-600">
            <Link 
              href={`/${params.locale}/login`} 
              className="text-emerald-600 hover:text-emerald-500 font-semibold transition-colors"
            >
              {t('backToLogin')}
            </Link>
          </p>
          
          <Link 
            href={`/${params.locale}`}
            className="inline-flex items-center text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('backToHome')}
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
} 