// Essential utility functions for currency, time, and data formatting
// Extracted from Cottage Tandoori POS system for Electron integration

export const formatters = {
  // Currency formatting for restaurant pricing
  currency: (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  },

  // Time formatting for orders and timestamps
  time: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Date formatting for order history
  date: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  },

  // Phone number formatting for customer data
  phone: (phone: string): string => {
    if (!phone) return '';
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    // Format as UK mobile: +44 7XXX XXX XXX
    if (cleaned.startsWith('44') && cleaned.length === 12) {
      return `+44 ${cleaned.slice(2, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
    }
    // Format as standard UK: 07XXX XXX XXX
    if (cleaned.startsWith('07') && cleaned.length === 11) {
      return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    }
    return phone; // Return original if no pattern matches
  },

  // Order number formatting
  orderNumber: (num: number | string): string => {
    const n = typeof num === 'string' ? parseInt(num) : num;
    return `#${String(n).padStart(4, '0')}`;
  },

  // Table number formatting
  tableNumber: (num: number | string): string => {
    return `Table ${num}`;
  }
};

export default formatters;
