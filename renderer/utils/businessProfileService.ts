import { apiClient } from 'app';
import { toast } from 'sonner';
import { useRestaurantSettings } from './useRestaurantSettings';
import type { BusinessProfile } from './useRestaurantSettings';
import { defaultBusinessProfile } from './useRestaurantSettings';
import { createContext, useContext, useMemo } from 'react';

// Export the BusinessProfile and defaultBusinessProfile types from our centralized hook
export type { BusinessProfile } from './useRestaurantSettings';
export { defaultBusinessProfile } from './useRestaurantSettings';

// Business profile service class
// This service now acts as a compatibility layer for legacy code
// It uses the centralized useRestaurantSettings hook internally
export class BusinessProfileService {
  private static instance: BusinessProfileService;
  private _cachedProfile: BusinessProfile | null = null;
  
  private constructor() {
    // Private constructor to enforce singleton
  }
  
  public static getInstance(): BusinessProfileService {
    if (!BusinessProfileService.instance) {
      BusinessProfileService.instance = new BusinessProfileService();
    }
    return BusinessProfileService.instance;
  }
  
  // Get the restaurant profile from the server
  public async getProfile(): Promise<BusinessProfile> {
    // Return cached profile if available
    if (this._cachedProfile) {
      return this._cachedProfile;
    }
    
    try {
      // Try to get the profile from centralized restaurant settings
      // We use a custom hook pattern that works with this service class
      const settingsHookData = await this.getRestaurantSettingsData();
      
      if (settingsHookData && settingsHookData.business_profile) {
        this._cachedProfile = settingsHookData.business_profile;
        return settingsHookData.business_profile;
      } else {
        // If no profile is found in restaurant settings, use default
        console.log('No profile found in restaurant settings, using default');
        this._cachedProfile = defaultBusinessProfile;
        return defaultBusinessProfile;
      }
    } catch (error) {
      console.error("Error getting business profile:", error);
      // Return default profile if there's an error
      this._cachedProfile = defaultBusinessProfile;
      return defaultBusinessProfile;
    }
  }
  
  // Get profile directly from the centralized hook data
  private async getRestaurantSettingsData() {
    try {
      // Since this is a service class and not a React component, we can't use hooks in the conventional way
      // Here we're using the hook outside of a component which is not ideal,
      // but it serves as a compatibility layer for legacy code
      const { loadSettings } = useRestaurantSettings();
      
      // Use the hook's loadSettings method to get the latest settings
      const settingsData = await loadSettings();
      
      // Return the settings data if available
      if (settingsData) {
        return settingsData;
      }
      return null;
    } catch (error) {
      console.error("Error fetching restaurant settings:", error);
      return null;
    }
  }
  
  // Get a variable by its path from the business profile
  public async getProfileVariable(variablePath: string): Promise<string> {
    const profile = await this.getProfile();
    
    // Handle nested paths like "business.address"
    const parts = variablePath.split('.');
    if (parts.length === 1) {
      // Simple path like "name"
      const key = parts[0];
      return profile[key as keyof BusinessProfile] || '';
    } else if (parts.length === 2 && parts[0] === 'business') {
      // Path like "business.name"
      const key = parts[1];
      return profile[key as keyof BusinessProfile] || '';
    }
    
    return '';
  }
  
  // Update business profile
  public async updateBusinessProfile(profileData: Partial<BusinessProfile>): Promise<boolean> {
    try {
      // Get the current profile
      const currentProfile = await this.getProfile();
      
      // Merge with new data
      const updatedProfile = {
        ...currentProfile,
        ...profileData
      } as BusinessProfile;
      
      // Use the centralized updateProfileFromRestaurantSettings method
      return await this.updateProfileFromRestaurantSettings(updatedProfile);
    } catch (error) {
      console.error("Error updating business profile:", error);
      toast.error(`Failed to update business profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }
  
  // Get all variables as a mapping from variable name to value
  public async getProfileVariables(): Promise<Record<string, string>> {
    const profile = await this.getProfile();
    
    const variables: Record<string, string> = {};
    
    // Add each profile field with both simple and business. prefixed versions
    Object.entries(profile).forEach(([key, value]) => {
      if (typeof value === 'string') {
        variables[key] = value;
        variables[`business.${key}`] = value;
      }
    });
    
    return variables;
  }
  
  // Resolve template variables in a string using the business profile
  public async resolveTemplateVariables(template: string): Promise<string> {
    const variables = await this.getProfileVariables();
    
    // Replace all {{variable}} patterns with their values
    return template.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const trimmedName = variableName.trim();
      return variables[trimmedName] || match;
    });
  }
  
  // Check if a string contains business profile variables
  public containsProfileVariables(text: string): boolean {
    // Check for patterns like {{business.name}} or {{name}}
    return /\{\{\s*(business\.)?[a-zA-Z_]+\s*\}\}/g.test(text);
  }
  
  // Clear the cached profile
  public clearCache(): void {
    this._cachedProfile = null;
  }

  // Update profile from Restaurant Settings and notify template service
  public async updateProfileFromRestaurantSettings(profile: BusinessProfile): Promise<boolean> {
    try {
      // Get a temporary reference to the hook's instance
      // This creates a temporary hook reference just for this one operation
      // It's not ideal to use hooks outside React components, but this is a compatibility layer
      const { updateProfile } = useRestaurantSettings();
      
      // Update the profile using the hook's method
      const success = await updateProfile(profile);
      
      if (success) {
        // Update the cached profile
        this._cachedProfile = profile;
        
        return true;
      } else {
        // Error already handled by the hook (toast displayed)
        return false;
      }
    } catch (error) {
      console.error('Error updating profile from restaurant settings:', error);
      toast.error('Error updating business profile');
      return false;
    }
  }
  

  

}

// Export a singleton instance
export const businessProfileService = BusinessProfileService.getInstance();
