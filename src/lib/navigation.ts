import intlConfig from '../../next-intl.config';

export const locales = intlConfig.locales;
export type Locale = typeof locales[number];

export const languageNames: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  vi: 'Tiếng Việt',
}; 