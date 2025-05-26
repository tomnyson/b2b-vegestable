'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function HomePage({ params }: { params: { locale: string } }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const t = useTranslations('home');

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: t('features.fastDelivery.title'),
      description: t('features.fastDelivery.description')
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: t('features.qualityAssured.title'),
      description: t('features.qualityAssured.description')
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      title: t('features.competitivePricing.title'),
      description: t('features.competitivePricing.description')
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: t('features.smartAnalytics.title'),
      description: t('features.smartAnalytics.description')
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: t('features.teamManagement.title'),
      description: t('features.teamManagement.description')
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      title: t('features.support247.title'),
      description: t('features.support247.description')
    }
  ];

  const stats = [
    { value: "500+", label: t('stats.happyClients') },
    { value: "50K+", label: t('stats.ordersDelivered') },
    { value: "99.9%", label: t('stats.uptime') },
    { value: "24/7", label: t('stats.support') }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        scrollY > 50 
          ? 'bg-white/90 backdrop-blur-lg shadow-lg border-b border-white/20' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo */}
            <Link href={`/${params.locale}`} className="flex items-center space-x-3 group">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                <svg className="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                B2B Vegetable
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors duration-200">
                {t('navigation.features')}
              </Link>
              <Link href="#about" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors duration-200">
                {t('navigation.about')}
              </Link>
              <Link href="#contact" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors duration-200">
                {t('navigation.contact')}
              </Link>
              <LanguageSwitcher />
              <Link 
                href={`/${params.locale}/login`}
                className="px-4 py-2 text-emerald-600 border border-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all duration-200"
              >
                {t('navigation.signIn')}
              </Link>
              <Link 
                href={`/${params.locale}/register`}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                {t('navigation.getStarted')}
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-gray-100 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden bg-white/95 backdrop-blur-lg border-t border-gray-100 py-4 animate-fade-in">
              <div className="flex flex-col space-y-4 px-4">
                <Link href="#features" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors duration-200">
                  {t('navigation.features')}
                </Link>
                <Link href="#about" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors duration-200">
                  {t('navigation.about')}
                </Link>
                <Link href="#contact" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors duration-200">
                  {t('navigation.contact')}
                </Link>
                <div className="py-2">
                  <LanguageSwitcher />
                </div>
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                  <Link 
                    href={`/${params.locale}/login`}
                    className="px-4 py-2 text-center text-emerald-600 border border-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all duration-200"
                  >
                    {t('navigation.signIn')}
                  </Link>
                  <Link 
                    href={`/${params.locale}/register`}
                    className="px-6 py-2 text-center bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg"
                  >
                    {t('navigation.getStarted')}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 lg:pt-32 pb-16 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                {t('hero.title')} 
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"> {t('hero.titleHighlight')}</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  href={`/${params.locale}/register`}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 shadow-xl text-center"
                >
                  {t('hero.startFreeTrial')}
                </Link>
                <Link 
                  href={`/${params.locale}/store`}
                  className="px-8 py-4 border-2 border-emerald-500 text-emerald-600 rounded-2xl font-semibold hover:bg-emerald-50 transition-all duration-200 text-center"
                >
                  {t('hero.browseProducts')}
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl p-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-emerald-50 rounded-xl p-4 text-center">
                      <div className="w-12 h-12 bg-emerald-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-gray-700">{t('heroCard.qualityAssured')}</p>
                    </div>
                    <div className="bg-teal-50 rounded-xl p-4 text-center">
                      <div className="w-12 h-12 bg-teal-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-gray-700">{t('heroCard.fastDelivery')}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-2">24/7</div>
                    <p className="text-gray-600 font-medium">{t('heroCard.supportAvailable')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-emerald-600 mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {t('features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-emerald-500 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-xl text-emerald-100 mb-8 leading-relaxed">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href={`/${params.locale}/register`}
              className="px-8 py-4 bg-white text-emerald-600 rounded-2xl font-semibold hover:bg-emerald-50 transition-all duration-200 transform hover:scale-105 shadow-xl"
            >
              {t('cta.getStartedToday')}
            </Link>
            <Link 
              href={`/${params.locale}/login`}
              className="px-8 py-4 border-2 border-white text-white rounded-2xl font-semibold hover:bg-white hover:text-emerald-600 transition-all duration-200"
            >
              {t('cta.signInToAccount')}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <Link href={`/${params.locale}`} className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="text-xl font-bold">B2B Vegetable</span>
              </Link>
              <p className="text-gray-400 mb-4 leading-relaxed">
                {t('footer.description')}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('footer.quickLinks')}</h3>
              <div className="space-y-2">
                <Link href={`/${params.locale}/store`} className="block text-gray-400 hover:text-white transition-colors duration-200">
                  {t('footer.browseProducts')}
                </Link>
                <Link href={`/${params.locale}/login`} className="block text-gray-400 hover:text-white transition-colors duration-200">
                  {t('footer.signIn')}
                </Link>
                <Link href={`/${params.locale}/register`} className="block text-gray-400 hover:text-white transition-colors duration-200">
                  {t('footer.register')}
                </Link>
              </div>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('footer.support')}</h3>
              <div className="space-y-2">
                <Link href="/help" className="block text-gray-400 hover:text-white transition-colors duration-200">
                  {t('footer.helpCenter')}
                </Link>
                <Link href="/contact" className="block text-gray-400 hover:text-white transition-colors duration-200">
                  {t('footer.contactUs')}
                </Link>
                <Link href="/terms" className="block text-gray-400 hover:text-white transition-colors duration-200">
                  {t('footer.termsOfService')}
                </Link>
                <Link href="/privacy" className="block text-gray-400 hover:text-white transition-colors duration-200">
                  {t('footer.privacyPolicy')}
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              {t('footer.copyright')}
            </p>
          </div>
        </div>
      </footer>

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
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}