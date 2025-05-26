/**
 * Format a date string into a readable format
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Format options
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Error';
  }
}

/**
 * Format a price/amount as currency
 * @param amount - Number to format
 * @param currency - Currency code (default: EUR)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Truncate a string to a maximum length
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  
  return `${str.substring(0, maxLength)}...`;
}

/**
 * Debounce a function call
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
} 