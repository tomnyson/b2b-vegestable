import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { Inter } from 'next/font/google';
import { ToastContainer } from 'react-toastify';
import './globals.css';
import 'react-toastify/dist/ReactToastify.css';
import ClientRootLayout from '../ClientRootLayout';
import { locales } from '@/lib/navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'B2B Vegetable App',
  description: 'A web app for B2B vegetable ordering',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
};

// Define which locales are supported
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate that the locale is supported
  if (!locales.includes(locale as any)) {
    notFound();
  }

  let messages;
  try {
    messages = (await import(`../../messages/${locale}/common.json`)).default;
  } catch (error) {
    notFound();
  }

  return (
    <html lang={locale} className={`${inter.className} scroll-smooth`}>
      <body className="min-h-screen bg-gray-100 overflow-x-hidden">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ClientRootLayout>
            {children}
          </ClientRootLayout>
        </NextIntlClientProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          className="toast-container-custom"
        />
      </body>
    </html>
  );
}