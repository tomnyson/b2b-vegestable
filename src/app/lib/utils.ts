import { set } from 'date-fns';


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

// Filter function for delivery dates
export function getOrderFilterRangeByDelivery(
  type: 'today' | 'tomorrow',
  cutoffTime: string = '18:00',
  deliveryDays: number[] = [1, 2, 3, 4, 5, 6] // default Mon-Sat
): { from: Date; to: Date } | null {
  const now = new Date();

  // Parse cutoffTime (VD: '18:00')
  const [cutoffHour, cutoffMinute] = cutoffTime.split(':').map(Number);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const startYesterday = set(yesterday, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
  const endYesterdayCutoff = set(yesterday, { hours: cutoffHour - 1, minutes: 59, seconds: 59 });

  const startYesterdayCutoff = set(yesterday, { hours: cutoffHour, minutes: 0, seconds: 0 });
  const endTodayCutoff = set(now, { hours: cutoffHour - 1, minutes: 59, seconds: 59 });

  if (type === 'today') {
    return {
      from: startYesterday,
      to: endYesterdayCutoff,
    };
  } else if (type === 'tomorrow') {
    return {
      from: startYesterdayCutoff,
      to: endTodayCutoff,
    };
  }

  return null;
}

export function getNextDeliveryDate(
  orderDate: Date,
  cutoffTime: string | undefined,
  deliveryDays: number[] | undefined
): Date {
  const [cutoffHour, cutoffMinute] = (cutoffTime ?? '18:00').split(':').map(Number);

  const cutoffDateTime = new Date(orderDate);
  cutoffDateTime.setHours(cutoffHour, cutoffMinute, 0, 0);

  let baseDeliveryDate = new Date(orderDate);

  // If placed before cutoff → deliver next day; else → day after
  if (orderDate <= cutoffDateTime) {
    baseDeliveryDate.setDate(baseDeliveryDate.getDate() + 1);
  } else {
    baseDeliveryDate.setDate(baseDeliveryDate.getDate() + 2);
  }

  // Ensure deliveryDays is always an array of numbers for includes()
  const availableDays = Array.isArray(deliveryDays) ? deliveryDays : [1, 2, 3, 4, 5, 6];

  // Skip to next available delivery day
  while (!availableDays.includes(baseDeliveryDate.getDay())) {
    baseDeliveryDate.setDate(baseDeliveryDate.getDate() + 1);
  }

  return baseDeliveryDate;
}