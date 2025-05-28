'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { getAppSettings, AppSettings } from '../lib/settings-api';

export default function HomePage({ params }: { params: { locale: string } }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations('home');

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load app settings for branding
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getAppSettings();
        setAppSettings(settings);
      } catch (error) {
        console.error('Error loading app settings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadSettings();
  }, []);

  const aboutFeatures = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7" />
        </svg>
      ),
      title: t('about.freshProducts.title'),
      description: t('about.freshProducts.description')
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5-5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      ),
      title: t('about.asianFood.title'),
      description: t('about.asianFood.description')
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: t('about.cateringDelivery.title'),
      description: t('about.cateringDelivery.description')
    }
  ];

  const products = [
    {
      name: t('products.seasonalVegetables'),
      image: "https://images.unsplash.com/photo-1607305387299-a3d9611cd469?auto=format&fit=crop&q=80&w=800",
      description: t('products.seasonalVegetablesDesc')
    },
    {
      name: t('products.saladsHerbs'),
      image: "https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&q=80&w=800",
      description: t('products.saladsHerbsDesc')
    },
    {
      name: t('products.asianNoodles'),
      image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&q=80&w=800",
      description: t('products.asianNoodlesDesc')
    },
    {
      name: t('products.seasonalFruit'),
      image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=800",
      description: t('products.seasonalFruitDesc')
    },
    {
      name: t('products.sweetChiliSauce'),
      image: "https://preview--onepagemetin.lovable.app/lovable-uploads/f835738c-42d8-445e-993e-9117b58f013d.png",
      description: t('products.sweetChiliSauceDesc')
    },
    {
      name: t('products.hoisinOysterSauce'),
      image: "https://preview--onepagemetin.lovable.app/lovable-uploads/f835738c-42d8-445e-993e-9117b58f013d.png",
      description: t('products.hoisinOysterSauceDesc')
    },
    {
      name: t('products.soySauce'),
      image: "https://preview--onepagemetin.lovable.app/lovable-uploads/f835738c-42d8-445e-993e-9117b58f013d.png",
      description: t('products.soySauceDesc')
    },
    {
      name: t('products.thaiSpecialties'),
      image: "https://preview--onepagemetin.lovable.app/lovable-uploads/f835738c-42d8-445e-993e-9117b58f013d.png",
      description: t('products.thaiSpecialtiesDesc')
    }
  ];

  const deliveryFeatures = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: t('delivery.fastDelivery.title'),
      description: t('delivery.fastDelivery.description')
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: t('delivery.topRestaurants.title'),
      description: t('delivery.topRestaurants.description')
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: t('delivery.qualityDelivery.title'),
      description: t('delivery.qualityDelivery.description')
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16">
            {appSettings?.logo_url && (
              <img 
                src={appSettings.logo_url} 
                alt="Loading Logo" 
                className="w-full h-full object-contain"
              />
            )}
          </div>
          <svg className="animate-spin h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <span className="text-gray-600 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        scrollY > 50 
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' 
          : 'bg-white/90 backdrop-blur-md'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href={`/${params.locale}`} className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                {appSettings?.logo_url && (
                  <img 
                    src={appSettings.logo_url} 
                    alt="Logo" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                )}
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {appSettings?.company_name}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#about" className="text-gray-700 hover:text-emerald-600 font-medium">{t('navigation.aboutUs')}</Link>
              <Link href="#products" className="text-gray-700 hover:text-emerald-600 font-medium">{t('navigation.products')}</Link>
              <Link href="#delivery" className="text-gray-700 hover:text-emerald-600 font-medium">{t('navigation.delivery')}</Link>
              <Link href="#contact" className="text-gray-700 hover:text-emerald-600 font-medium">{t('navigation.contact')}</Link>
              <LanguageSwitcher />
              <Link 
                href={`/${params.locale}/login`}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 font-medium"
              >
                {t('navigation.login')}
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
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
            <div className="md:hidden bg-white border-t border-gray-100 py-4">
              <div className="flex flex-col space-y-4 px-4">
                <Link href="#about" className="text-gray-700 hover:text-emerald-600 font-medium">{t('navigation.aboutUs')}</Link>
                <Link href="#products" className="text-gray-700 hover:text-emerald-600 font-medium">{t('navigation.products')}</Link>
                <Link href="#delivery" className="text-gray-700 hover:text-emerald-600 font-medium">{t('navigation.delivery')}</Link>
                <Link href="#contact" className="text-gray-700 hover:text-emerald-600 font-medium">{t('navigation.contact')}</Link>
                <Link href={`/${params.locale}/login`} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-center">{t('navigation.login')}</Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60">
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1470058869958-2a77ade41c02?auto=format&fit=crop&crop=entropy&w=800&q=80')`
            }}
          />
        </div>
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-5xl lg:text-7xl font-bold mb-6">
            {t('hero.title')}
          </h1>
          <p className="text-xl lg:text-2xl mb-8 opacity-90">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href={`/${params.locale}/store`}
              className="px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 font-semibold"
            >
              {t('hero.viewProducts')}
            </Link>
            <Link 
              href="#contact"
              className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white hover:text-gray-900 transition-all duration-200 font-semibold"
            >
              {t('hero.contactUs')}
            </Link>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{t('about.title')}</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t('about.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {aboutFeatures.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{t('products.title')}</h2>
            <p className="text-lg text-gray-600">
              {t('products.subtitle')}
            </p>
          </div>

          {/* Product Categories */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div 
                  className="h-48 bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${product.image}')`
                  }}
                />
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm">{product.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery Service Section */}
      <section id="delivery" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{t('delivery.title')}</h2>
            <p className="text-lg text-gray-600">
              {t('delivery.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {deliveryFeatures.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Delivery Fleet Image */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto">
            <img 
              src="https://preview--onepagemetin.lovable.app/lovable-uploads/66c9387b-0093-46c2-9817-559d92e0084b.png" 
              alt={t('delivery.fleetCaption')}
              className="w-full h-auto"
            />
            <div className="bg-gray-50 p-4 text-center">
              <p className="text-sm text-gray-600">
                {t('delivery.fleetCaption')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Web App Promotion Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-emerald-50 rounded-lg p-8 text-center max-w-4xl mx-auto shadow-lg border border-emerald-200">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <div className="md:w-1/3">
                <div className="bg-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-12 w-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="md:w-2/3 md:text-left">
                <h3 className="text-3xl font-bold mb-4 text-emerald-600">{t('webApp.title')}</h3>
                <p className="text-lg mb-6 text-gray-600">
                  {t('webApp.description')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Link 
                    href={`/${params.locale}/store`}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 font-semibold flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {t('webApp.orderNow')}
                  </Link>
                  <Link 
                    href="#about"
                    className="px-6 py-3 border border-emerald-300 text-emerald-700 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 font-semibold"
                  >
                    {t('webApp.learnMore')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Opening Hours */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('openingHours.title')}</h2>
            <p className="text-gray-600">{t('openingHours.subtitle')}</p>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="font-medium text-gray-900">{t('openingHours.mondayFriday')}</span>
                <span className="text-gray-600">{t('openingHours.hours')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="font-medium text-gray-900">{t('openingHours.saturday')}</span>
                <span className="text-gray-600">{t('openingHours.hours')}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-gray-900">{t('openingHours.sunday')}</span>
                <span className="text-gray-600">{t('openingHours.closed')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{t('contact.title')}</h2>
            <p className="text-lg text-gray-600">
              {t('contact.subtitle')}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-gray-50 rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">{t('contact.writeToUs')}</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('contact.name')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder={t('contact.namePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('contact.email')}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder={t('contact.emailPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('contact.phone')}</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder={t('contact.phonePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('contact.message')}</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder={t('contact.messagePlaceholder')}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 font-semibold"
                >
                  {t('contact.sendMessage')}
                </button>
              </form>
            </div>

            {/* Contact Details */}
            <div className="space-y-8">
              <div className="bg-gray-50 rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">{t('contact.contactDetails')}</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-red-500 rounded-full mt-1"></div>
                    <div>
                      <p className="font-medium text-gray-900">{t('contact.address')}</p>
                      <p className="text-gray-600 whitespace-pre-line">
                        {t('contact.addressDetails')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-emerald-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">{t('contact.phone')}</p>
                      <p className="text-gray-600">{t('contact.phoneNumber')}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-emerald-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">{t('contact.email')}</p>
                      <p className="text-gray-600">{t('contact.emailAddress')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="bg-gray-50 rounded-lg shadow-lg overflow-hidden h-96">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2570.327511567128!2d7.559244076868924!3d49.44996435543122!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4796654dcbc0bed3%3A0x73bf35cf87a01c96!2sMerkurstra%C3%9Fe%2021%2C%2066877%20Ramstein-Miesenbach!5e0!3m2!1sen!2sde!4v1716505544320!5m2!1sen!2sde" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={true} 
                  loading="lazy"
                  title="Standort Karte"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Link href={`/${params.locale}`} className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-lg font-semibold">{t('hero.title')}</span>
            </Link>
            <p className="text-gray-400 mb-6">
              {t('footer.copyright')}
            </p>
            <div className="flex justify-center space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">{t('footer.privacyPolicy')}</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">{t('footer.termsOfService')}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}