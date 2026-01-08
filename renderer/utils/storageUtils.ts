import { apiClient } from 'app';
import { toast } from 'sonner';
import { convertToSupabaseUrl } from './helpers';

// Check if the required Supabase storage buckets exist
export const checkStorageBuckets = async () => {
  try {
    const response = await apiClient.check_bucket_status();
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking storage buckets:', error);
    return { buckets_exist: false, buckets: [] };
  }
};

// Initialize storage buckets in Supabase
export const initializeStorageBuckets = async () => {
  try {
    const response = await apiClient.initialize_storage_buckets();
    const data = await response.json();
    
    if (data.status === 'success') {
      toast.success(data.message);
      return true;
    } else {
      toast.error(data.message || 'Failed to initialize buckets');
      return false;
    }
  } catch (error) {
    toast.error('Failed to initialize storage buckets');
    console.error('Error initializing storage buckets:', error);
    return false;
  }
};

// Migrate website images from Databutton to Supabase
export const migrateWebsiteImages = async () => {
  try {
    const response = await apiClient.migrate_images({
      source_type: 'databutton',
      target_bucket: 'client-website-images'
    });
    const data = await response.json();
    
    if (data.status === 'started') {
      toast.success(data.message || 'Migration started successfully');
      return true;
    } else {
      toast.error(data.message || 'Failed to start migration');
      return false;
    }
  } catch (error) {
    toast.error('Failed to migrate images');
    console.error('Error migrating images:', error);
    return false;
  }
};

// Migrate menu images from Databutton to Supabase
export const migrateMenuImages = async () => {
  try {
    const response = await apiClient.migrate_images({
      source_type: 'databutton',
      target_bucket: 'client-menu-images'
    });
    const data = await response.json();
    
    if (data.status === 'started') {
      toast.success(data.message || 'Migration started successfully');
      return true;
    } else {
      toast.error(data.message || 'Failed to start migration');
      return false;
    }
  } catch (error) {
    toast.error('Failed to migrate images');
    console.error('Error migrating images:', error);
    return false;
  }
};

// Check migration status
export const checkMigrationStatus = async () => {
  try {
    const response = await apiClient.get_migration_status();
    return await response.json();
  } catch (error) {
    console.error('Error checking migration status:', error);
    return null;
  }
};

// Get URL for an image in Supabase storage
export const getImageUrl = (filename: string, bucket: string = 'client-website-images') => {
  // If it's already a full URL (Databutton or Supabase), use convertToSupabaseUrl
  if (filename.startsWith('http')) {
    return convertToSupabaseUrl(filename, bucket);
  }
  
  // Otherwise, just return the filename itself (relative path)
  return filename;
};
