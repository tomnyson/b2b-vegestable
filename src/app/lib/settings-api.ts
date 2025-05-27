import { supabase } from './supabase';

export interface AppSettings {
  id?: string;
  logo_url?: string;
  vat_percentage?: number;
  default_language?: string;
  default_currency?: string;
  company_name?: string;
  support_email?: string;
  support_phone?: string;
  // Menu page toggles
  enable_overview?: boolean;
  enable_products?: boolean;
  enable_orders?: boolean;
  enable_order_summary?: boolean;
  enable_invoices?: boolean;
  enable_users?: boolean;
  enable_drivers?: boolean;
  enable_settings?: boolean;
  enable_store?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get the current application settings
 */
export async function getAppSettings(): Promise<AppSettings | null> {
  try {
    // Get the first settings record (there should only be one)
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {  // Not found
        return null;
      }
      console.error('Error fetching app settings:', error);
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error('Get app settings failed:', err);
    throw err;
  }
}

/**
 * Update application settings
 */
export async function updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  try {
    // Check if settings exist
    const currentSettings = await getAppSettings();
    
    if (!currentSettings) {
      // Create settings if they don't exist
      const { data, error } = await supabase
        .from('settings')
        .insert({
          ...settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating app settings:', error);
        throw error;
      }
      
      return data;
    } else {
      // Update existing settings
      const { data, error } = await supabase
        .from('settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSettings.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating app settings:', error);
        throw error;
      }
      
      return data;
    }
  } catch (err) {
    console.error('Update app settings failed:', err);
    throw err;
  }
}

/**
 * Upload a logo image and update the app settings with the new logo URL
 */
export async function uploadLogo(file: File): Promise<string> {
  try {
    // Generate a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;
    
    // Upload the file to Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from('app-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading logo:', uploadError);
      throw uploadError;
    }
    
    // Get the public URL
    const { data } = supabase
      .storage
      .from('app-assets')
      .getPublicUrl(filePath);
    
    const publicUrl = data.publicUrl;
    
    // Update app settings with the new logo URL
    await updateAppSettings({ logo_url: publicUrl });
    
    return publicUrl;
  } catch (err) {
    console.error('Logo upload failed:', err);
    throw err;
  }
}

/**
 * Supported languages in the application
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ar', name: 'Arabic' }
];

/**
 * Supported currencies in the application
 */
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' }
];

/**
 * Get currency information by code
 */
export function getCurrencyInfo(currencyCode: string) {
  return SUPPORTED_CURRENCIES.find(currency => currency.code === currencyCode) || SUPPORTED_CURRENCIES[0];
}

/**
 * Get default menu settings (all enabled by default)
 */
export function getDefaultMenuSettings() {
  return {
    enable_overview: true,
    enable_products: true,
    enable_orders: true,
    enable_order_summary: true,
    enable_users: true,
    enable_drivers: true,
    enable_settings: true,
    enable_store: true,
  };
}

/**
 * Check if a specific menu page is enabled
 */
export async function isMenuPageEnabled(pageName: keyof ReturnType<typeof getDefaultMenuSettings>): Promise<boolean> {
  try {
    const settings = await getAppSettings();
    if (!settings) {
      // If no settings exist, default to enabled
      const defaults = getDefaultMenuSettings();
      return defaults[pageName];
    }
    
    // If setting is undefined, default to enabled
    return settings[pageName] !== false;
  } catch (error) {
    console.error('Error checking menu page status:', error);
    // Default to enabled on error
    return true;
  }
}

/**
 * Format price with currency symbol based on app settings
 */
export async function formatPrice(price: number): Promise<string> {
  try {
    const settings = await getAppSettings();
    const currencyCode = settings?.default_currency || 'USD';
    const currencyInfo = getCurrencyInfo(currencyCode);
    
    // Format based on currency
    if (currencyCode === 'VND') {
      // No decimal places for Vietnamese Dong
      return `${Math.round(price)}${currencyInfo.symbol}`;
    } else {
      // Two decimal places for other currencies
      return `${currencyInfo.symbol}${price.toFixed(2)}`;
    }
  } catch (error) {
    console.error('Error formatting price:', error);
    // Fallback to USD
    return `$${price.toFixed(2)}`;
  }
}

/**
 * Format price synchronously with provided currency info
 */
export function formatPriceSync(price: number, currencyCode: string = 'USD'): string {
  const currencyInfo = getCurrencyInfo(currencyCode);
  
  // Format based on currency
  if (currencyCode === 'VND') {
    // No decimal places for Vietnamese Dong, symbol after amount
    return `${Math.round(price)}${currencyInfo.symbol}`;
  } else {
    // Two decimal places for other currencies, symbol before amount
    return `${currencyInfo.symbol}${price.toFixed(2)}`;
  }
} 