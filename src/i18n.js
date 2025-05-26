import {getRequestConfig} from 'next-intl/server';

// Can be imported from a shared config
const locales = ['en', 'de', 'vi'];

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  const validLocale = locales.includes(locale) ? locale : 'en';
  
  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}/common.json`)).default
  };
}); 