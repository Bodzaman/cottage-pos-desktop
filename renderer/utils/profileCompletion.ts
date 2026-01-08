import { CustomerProfile, CustomerAddress } from './simple-auth-context';

/**
 * Calculate profile completion percentage based on filled fields
 * 
 * Criteria:
 * - First name (20%)
 * - Last name (20%)
 * - Phone number (20%)
 * - Email verified (20%)
 * - Profile image (10%)
 * - At least one address (10%)
 */
export interface ProfileCompletionResult {
  percentage: number;
  missingFields: string[];
  nextAction: string | null;
}

export function calculateProfileCompletion(
  profile: CustomerProfile | null,
  addresses: CustomerAddress[]
): ProfileCompletionResult {
  if (!profile) {
    return {
      percentage: 0,
      missingFields: ['profile'],
      nextAction: 'Create your profile to get started'
    };
  }

  let percentage = 0;
  const missingFields: string[] = [];

  // First name (25%)
  if (profile.first_name && profile.first_name.trim()) {
    percentage += 25;
  } else {
    missingFields.push('first_name');
  }

  // Last name (25%)
  if (profile.last_name && profile.last_name.trim()) {
    percentage += 25;
  } else {
    missingFields.push('last_name');
  }

  // Phone number (25%)
  if (profile.phone && profile.phone.trim()) {
    percentage += 25;
  } else {
    missingFields.push('phone');
  }

  // Profile image (15%)
  if (profile.image_url) {
    percentage += 15;
  } else {
    missingFields.push('image_url');
  }

  // At least one address (10%)
  if (addresses.length > 0) {
    percentage += 10;
  } else {
    missingFields.push('address');
  }

  // Determine next action
  let nextAction: string | undefined;
  if (missingFields.includes('first_name')) {
    nextAction = 'Add your first name';
  } else if (missingFields.includes('last_name')) {
    nextAction = 'Add your last name';
  } else if (missingFields.includes('phone')) {
    nextAction = 'Add your phone number';
  } else if (missingFields.includes('image_url')) {
    nextAction = 'Upload a profile picture';
  } else if (missingFields.includes('address')) {
    nextAction = 'Add a delivery address';
  }

  return {
    percentage,
    missingFields,
    nextAction
  };
}

/**
 * Get completion color based on percentage
 */
export function getCompletionColor(percentage: number): string {
  if (percentage === 100) return '#10B981'; // Green
  if (percentage >= 70) return '#F59E0B'; // Amber
  return '#EF4444'; // Red
}

/**
 * Get completion message
 */
export function getCompletionMessage(result: ProfileCompletionResult): string {
  const { percentage, nextAction } = result;
  
  if (percentage === 100) {
    return 'Your profile is complete! 🎉';
  }
  
  if (nextAction) {
    return `${percentage}% complete - ${nextAction}`;
  }
  
  return `${percentage}% complete`;
}
