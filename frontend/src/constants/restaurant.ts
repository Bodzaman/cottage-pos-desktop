/**
 * Centralized restaurant contact information
 * Use these constants instead of hardcoding values throughout the codebase
 */

export const RESTAURANT_INFO = {
  name: 'Cottage Tandoori',

  // Phone numbers
  phone: {
    primary: '01903 743605',
    primaryRaw: '01903743605', // For tel: links
    secondary: '01903 745974',
    secondaryRaw: '01903745974', // For tel: links
  },

  // Address
  address: {
    street: '25 West Street',
    town: 'Storrington',
    postcode: 'RH20 4DZ',
    full: '25 West Street, Storrington, RH20 4DZ',
  },

  // Email
  email: {
    info: 'info@cottagetandoori.com',
    reservations: 'reservations@cottagetandoori.com',
  },

  // Opening hours
  hours: {
    lunch: '12:00 - 14:00',
    dinner: '17:30 - 22:00',
    dinnerWeekend: '17:30 - 22:30',
    lastSeating: '21:00',
  },
} as const;

export type RestaurantInfo = typeof RESTAURANT_INFO;
