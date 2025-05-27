import { getAppSettings, getDefaultMenuSettings } from './settings-api';

export type MenuPage = 
  | 'overview' 
  | 'products' 
  | 'orders' 
  | 'order_summary' 
  | 'users' 
  | 'drivers' 
  | 'settings' 
  | 'store';

/**
 * Check if a specific menu page is enabled
 */
export async function isMenuPageEnabled(pageName: MenuPage): Promise<boolean> {
  try {
    const settings = await getAppSettings();
    const defaults = getDefaultMenuSettings();
    
    if (!settings) {
      // If no settings exist, use defaults (all enabled)
      return defaults[`enable_${pageName}` as keyof typeof defaults] ?? true;
    }
    
    // Check the specific setting, default to enabled if not set
    const settingKey = `enable_${pageName}` as keyof typeof settings;
    return settings[settingKey] !== false;
  } catch (error) {
    console.error('Error checking menu page status:', error);
    // Default to enabled on error
    return true;
  }
}

/**
 * Get the redirect path for disabled pages
 */
export function getRedirectPath(locale: string = 'en'): string {
  return `/${locale}/dashboard`;
}

/**
 * Map URL paths to menu page names
 */
export function getMenuPageFromPath(pathname: string): MenuPage | null {
  const segments = pathname.split('/');
  const lastSegment = segments[segments.length - 1];
  
  switch (lastSegment) {
    case 'dashboard':
      return 'overview';
    case 'products':
      return 'products';
    case 'orders':
      return 'orders';
    case 'summary':
      return 'order_summary';
    case 'users':
      return 'users';
    case 'drivers':
      return 'drivers';
    case 'settings':
      return 'settings';
    case 'store':
      return 'store';
    default:
      return null;
  }
}

/**
 * Check if user can access a specific path
 */
export async function canAccessPath(pathname: string): Promise<boolean> {
  const menuPage = getMenuPageFromPath(pathname);
  
  if (!menuPage) {
    // If we can't determine the menu page, allow access
    return true;
  }
  
  return await isMenuPageEnabled(menuPage);
} 