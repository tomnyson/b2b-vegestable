import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { languageNames, locales } from '../lib/navigation';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  
  // Convert locales array to objects with display names
  const localeOptions = locales.map(code => ({
    code,
    name: languageNames[code]
  }));

  // Get the path without the locale prefix to switch correctly
  const getPathWithoutLocale = () => {
    if (!pathname) return '/dashboard';
    
    const segments = pathname.split('/');
    const isLocaleSegment = locales.includes(segments[1]);
    
    if (isLocaleSegment) {
      const pathWithoutLocale = '/' + segments.slice(2).join('/');
      return pathWithoutLocale === '/' ? '/dashboard' : pathWithoutLocale;
    }
    
    return pathname === '/' ? '/dashboard' : pathname;
  };

  const basePath = getPathWithoutLocale();

  return (
    <div className="language-switcher">
      <div className="grid grid-cols-2 gap-1">
        {localeOptions.map((l) => (
          <Link
            key={l.code}
            href={`/${l.code}${basePath}`}
            className={`px-2 py-1 text-xs rounded text-center transition-colors ${
              locale === l.code 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title={l.name}
          >
            {l.code.toUpperCase()}
          </Link>
        ))}
      </div>
    </div>
  );
} 