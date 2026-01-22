/**
 * Collection of utility helper functions
 */

import { getSupabaseConfig } from './supabaseClient';

/**
 * Debounce function to limit the rate at which a function can fire
 * @param func The function to debounce
 * @param wait The delay in milliseconds
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Convert a Databutton static asset URL to a Supabase storage URL
export const convertToSupabaseUrl = (dataButtonUrl: string, bucketName: string = 'client-website-images'): string => {
  if (!dataButtonUrl) return '';
  
  // Check if it's already a Supabase URL
  if (dataButtonUrl.includes('storage.googleapis.com') || 
      dataButtonUrl.includes('.supabase.co/storage/v1/object/public')) {
    return dataButtonUrl;
  }
  
  try {
    // Extract filename from Databutton URL
    const urlObj = new URL(dataButtonUrl);
    const pathSegments = urlObj.pathname.split('/');
    const filename = pathSegments[pathSegments.length - 1];
    
    // Get Supabase URL from config
    const config = getSupabaseConfig();
    if (!config.url) return dataButtonUrl;
    
    // Construct Supabase URL
    return `${config.url}/storage/v1/object/public/${bucketName}/${filename}`;
  } catch (e) {
    console.error('Error converting URL:', e);
    return dataButtonUrl;
  }
};

// Convert a batch of URLs from Databutton to Supabase
export const convertUrlsBatch = (urls: string[], bucketName: string = 'client-website-images'): string[] => {
  return urls.map(url => convertToSupabaseUrl(url, bucketName));
};
