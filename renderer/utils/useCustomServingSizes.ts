import { useState, useEffect } from 'react';
import { apiClient } from 'app';
import { CustomServingSizeResponse } from 'types';
import { toast } from 'sonner';

// Interface for enhanced serving size display in forms
export interface EnhancedServingSize {
  id: string;
  name: string;
  volume: string;
  category: string;
  is_default: boolean;
  field_name: string; // e.g., 'serving_size_125ml_glass' or 'custom_large_glass'
  display_label: string; // e.g., '125ml Glass' or 'Large Glass (500ml)'
  icon: string;
  color_class: string;
}

export function useCustomServingSizes() {
  const [servingSizes, setServingSizes] = useState<CustomServingSizeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get category icon - defined early to avoid hoisting issues
  const getCategoryIcon = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'glass': case 'carafe': return '🍷';
      case 'bottle': case 'magnum': return '🍾';
      case 'pint': return '🍺';
      default: return '🥤';
    }
  };

  // Default/system serving sizes that map to existing form fields
  const defaultServingSizes: EnhancedServingSize[] = [
    {
      id: 'default_125ml_glass',
      name: '125ml Glass',
      volume: '125ml',
      category: 'Glass',
      is_default: true,
      field_name: 'serving_size_125ml_glass',
      display_label: '125ml Glass',
      icon: '🍷',
      color_class: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800'
    },
    {
      id: 'default_175ml_glass',
      name: '175ml Glass',
      volume: '175ml',
      category: 'Glass',
      is_default: true,
      field_name: 'serving_size_175ml_glass',
      display_label: '175ml Glass',
      icon: '🍷',
      color_class: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800'
    },
    {
      id: 'default_250ml_glass',
      name: '250ml Glass',
      volume: '250ml',
      category: 'Glass',
      is_default: true,
      field_name: 'serving_size_250ml_glass',
      display_label: '250ml Glass',
      icon: '🍷',
      color_class: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800'
    },
    {
      id: 'default_330ml_bottle',
      name: '330ml Bottle',
      volume: '330ml',
      category: 'Bottle',
      is_default: true,
      field_name: 'serving_size_330ml_bottle',
      display_label: '330ml Bottle',
      icon: '🍺',
      color_class: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
    },
    {
      id: 'default_half_pint',
      name: 'Half Pint',
      volume: '284ml',
      category: 'Pint',
      is_default: true,
      field_name: 'serving_size_half_pint',
      display_label: 'Half Pint',
      icon: '🍺',
      color_class: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
    },
    {
      id: 'default_pint',
      name: 'Pint',
      volume: '568ml',
      category: 'Pint',
      is_default: true,
      field_name: 'serving_size_pint',
      display_label: 'Pint',
      icon: '🍺',
      color_class: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
    },
    {
      id: 'default_bottle',
      name: 'Bottle',
      volume: '750ml',
      category: 'Bottle',
      is_default: true,
      field_name: 'serving_size_bottle',
      display_label: 'Bottle',
      icon: '🍾',
      color_class: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
    }
  ];

  const loadServingSizes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.list_custom_serving_sizes({});
      const data = await response.json();
      setServingSizes(data);
    } catch (err) {
      console.error('Failed to load serving sizes:', err);
      setError('Failed to load serving sizes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServingSizes();
  }, []);

  // Convert custom serving sizes to enhanced format
  const customEnhancedSizes: EnhancedServingSize[] = servingSizes
    .filter(size => !size.is_default) // Only custom sizes
    .map(size => ({
      id: size.id,
      name: size.name,
      volume: size.volume,
      category: size.category,
      is_default: false,
      field_name: `custom_${size.id}`,
      display_label: `${size.name} (${size.volume})`,
      icon: getCategoryIcon(size.category),
      color_class: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
    }));

  // Helper functions
  const getDefaultSizes = () => servingSizes.filter(size => size.is_default);
  const getCustomSizes = () => servingSizes.filter(size => !size.is_default);
  
  const getSizesByCategory = (category: string) => 
    servingSizes.filter(size => size.category.toLowerCase() === category.toLowerCase());
  
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'glass': case 'carafe': return 'purple';
      case 'bottle': case 'magnum': return 'blue';
      case 'pint': return 'amber';
      default: return 'gray';
    }
  };
  
  // Legacy mapping for backwards compatibility
  const mapToLegacyFieldName = (size: CustomServingSizeResponse): string => {
    const name = size.name.toLowerCase().replace(/\s+/g, '_');
    return `serving_size_${name}`;
  };
  
  const mapToLegacyPriceFieldName = (size: CustomServingSizeResponse): string => {
    const name = size.name.toLowerCase().replace(/\s+/g, '_');
    return `serving_size_${name}_price`;
  };

  // Combined serving sizes for display in forms
  const allEnhancedSizes: EnhancedServingSize[] = [...defaultServingSizes, ...customEnhancedSizes];

  // Create serving size by category
  const addCustomServingSize = async (name: string, volume: string, category: string) => {
    try {
      const response = await apiClient.create_custom_serving_size({
        name: name.trim(),
        volume: volume.trim(),
        category,
        restaurant_id: 'cottage_tandoori',
        is_default: false
      });
      const newSize = await response.json();
      setServingSizes(prev => [...prev, newSize]);
      toast.success(`Added custom serving size: ${name}`);
      return newSize;
    } catch (error) {
      console.error('Failed to create custom serving size:', error);
      toast.error('Failed to create custom serving size');
      throw error;
    }
  };

  return {
    servingSizes, // Raw serving sizes from API
    allEnhancedSizes, // Combined default + custom for display
    defaultServingSizes, // System default sizes
    customEnhancedSizes, // Custom sizes only
    loading,
    error,
    reload: loadServingSizes,
    getDefaultSizes,
    getCustomSizes,
    getSizesByCategory,
    getCategoryIcon,
    getCategoryColor,
    mapToLegacyFieldName,
    mapToLegacyPriceFieldName,
    addCustomServingSize
  };
}
