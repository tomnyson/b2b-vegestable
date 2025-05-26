import {getRequestConfig} from 'next-intl/server';
import {locales} from './navigation';

export default getRequestConfig(async ({locale}) => {
  // Validate that the locale is supported
  const validLocale = locales.includes(locale as any) ? locale : 'en';
  
  // Load messages for the locale
  const messages = (await import(`../messages/${validLocale}/common.json`)).default;
  
  return {
    locale: validLocale as string,
    messages,
    // You can pass the messages to the timezones and now.js as well
    timeZone: 'America/Los_Angeles',
    now: new Date(),
  };
}); 