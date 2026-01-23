/**
 * Settings Types
 *
 * Types related to restaurant settings, opening hours, and custom serving sizes.
 */

// ================================
// OPENING HOURS TYPES
// ================================

/**
 * Days of the week for scheduling
 */
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

/**
 * A time shift representing open/close times
 */
export interface TimeShift {
  open: string;
  close: string;
}

/**
 * Schedule for a single day, including multiple shifts
 */
export interface DaySchedule {
  isOpen: boolean;
  shifts: TimeShift[];
}

/**
 * Full opening hours configuration for all days
 */
export interface OpeningHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

// ================================
// CUSTOM SERVING SIZE TYPES
// ================================

/**
 * Response from API for custom serving sizes
 */
export interface CustomServingSizeResponse {
  id: string;
  name: string;
  volume: string;
  category: string;
  is_default: boolean;
  restaurant_id?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Request body for creating a custom serving size
 */
export interface CustomServingSizeCreate {
  name: string;
  volume: string;
  category: string;
  restaurant_id?: string;
  is_default?: boolean;
}

/**
 * Request body for updating a custom serving size
 */
export interface CustomServingSizeUpdate {
  name?: string;
  volume?: string;
  category?: string;
  is_default?: boolean;
}
