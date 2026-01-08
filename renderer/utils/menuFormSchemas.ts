/**
 * Form validation schemas for menu-related components
 * 
 * This file contains Zod schemas for validating form input in various
 * menu management forms throughout the application.
 */

import { z } from 'zod';

/**
 * Menu item form validation schema
 */
export const menuItemSchema = z.object({
  // Added status for draft/published state
  status: z.enum(['draft', 'published']).default('published'),
  // Added preferred aspect ratio for images
  preferred_aspect_ratio: z.enum(['square', 'widescreen']).default('square'),
  // Added media type field to specify image or video
  media_type: z.enum(['image', 'video']).default('image'),
  name: z.string().min(2, { message: 'Item name must be at least 2 characters' }),
  description: z.string().optional().nullable(),
  category_id: z.string().optional().nullable(),
  default_spice_level: z.coerce.number().int().min(0).max(5).default(0),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  display_order: z.coerce.number().int().nonnegative().default(0),
  print_order: z.coerce.number().int().nonnegative().default(0),
  print_to_kitchen: z.boolean().default(true),
  inherit_category_print_settings: z.boolean().default(true),
  dietary_tags: z.array(z.string()).optional().nullable(),
  // AI-enhanced voice fields
  voice_description: z.string().optional().nullable(),
  spoken_alias: z.string().optional().nullable(),
  voice_upsell_suggestion: z.string().optional().nullable(),
  
  // Customization fields that match database schema
  customizations: z.array(z.string()).optional().nullable(),
  required_customizations: z.array(z.string()).optional().nullable(),
  
  // Special instructions and notes fields for unified Add-ons & Instructions tab
  special_instructions: z.string().optional().nullable(),
  instructions_customer_visible: z.boolean().default(false),
  instructions_staff_only: z.boolean().default(false),
  
  // Media fields - handles both images and videos
  image_url: z.string().nullable().optional(), // For backward compatibility, could be image or video URL
  image_name: z.string().nullable().optional(), // Friendly name of the primary media
  image_asset_id: z.string().nullable().optional(), // Reference to the media_assets table for primary media
  image_url_widescreen: z.string().nullable().optional(), // For backward compatibility, secondary media URL
  image_wide_name: z.string().nullable().optional(), // Friendly name of the secondary media
  image_widescreen_asset_id: z.string().nullable().optional(), // Reference to the media_assets table for secondary media
  media_type_widescreen: z.enum(['image', 'video']).nullable().optional(), // Media type for secondary image/video
  // New fields for better media handling
  primary_media_id: z.string().nullable().optional(), // Primary media asset ID
  primary_media_type: z.enum(['image', 'video']).nullable().optional(), // Type of primary media
  primary_media_url: z.string().nullable().optional(), // URL of primary media
  secondary_media_id: z.string().nullable().optional(), // Secondary media asset ID
  secondary_media_type: z.enum(['image', 'video']).nullable().optional(), // Type of secondary media
  secondary_media_url: z.string().nullable().optional(), // URL of secondary media
  // Progressive pricing fields for simple menu items
  has_variants: z.boolean().default(false),
  price: z.coerce.number().min(0, { message: 'Takeaway price must be a positive number' }).optional(),
  price_dine_in: z.union([z.coerce.number().min(0), z.null()]).optional(),
  price_delivery: z.union([z.coerce.number().min(0), z.null()]).optional(),
  
  variants: z.array(z.object({
    id: z.string().optional(),
    protein_type_id: z.union([z.string(), z.null()]).optional(),
    name: z.union([z.string(), z.null()]).optional(), // Optional custom name for the variant (acts as POS Label override)
    description: z.union([z.string(), z.null()]).optional(), // Variant-specific description
    price: z.coerce.number().min(0, { message: 'Takeaway price must be a positive number' }),
    price_dine_in: z.union([z.coerce.number().min(0), z.null()]).optional(),
    price_delivery: z.union([z.coerce.number().min(0), z.null()]).optional(),
    is_default: z.boolean().default(false),
    image_url: z.union([z.string(), z.null()]).optional(), // Variant-specific image URL (legacy)
    // Enhanced media support for variants
    media_id: z.string().nullable().optional(), // Variant-specific media asset ID
    media_type: z.enum(['image', 'video']).nullable().optional(), // Type of variant media
    media_url: z.string().nullable().optional() // URL of variant media
  })).min(1, { message: 'At least one price variant is required' })
});

/**
 * Category form validation schema
 */
export const categorySchema = z.object({
  name: z.string().min(2, { message: 'Category name must be at least 2 characters' }),
  description: z.string().optional().nullable(),
  display_order: z.coerce.number().int().nonnegative().default(0),
  parent_category_id: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

/**
 * Protein type form validation schema
 */
export const proteinTypeSchema = z.object({
  name: z.string().min(2, { message: 'Protein type name must be at least 2 characters' }),
  display_order: z.coerce.number().int().nonnegative().default(0),
});

/**
 * Batch price update validation schema
 */
export const batchPriceUpdateSchema = z.object({
  priceType: z.enum(['takeaway', 'dine_in', 'delivery']),
  applyTo: z.enum(['all', 'category']),
  categoryId: z.string().optional(),
  action: z.enum(['set', 'increase', 'decrease']),
  value: z.coerce.number().min(0),
  percentage: z.boolean().default(false),
});

// Export types derived from schemas
export interface MenuItemFormValues {
  id?: string;
  name: string;
  description: string | null;
  category_id: string | null;
  default_spice_level: number;
  featured: boolean;
  active: boolean;
  display_order: number;
  print_order: number;
  print_to_kitchen: boolean;
  inherit_category_print_settings: boolean;
  dietary_tags: string[];
  image_url?: string | null;
  image_url_widescreen?: string | null;
  image_asset_id?: string | null;
  image_widescreen_asset_id?: string | null;
  image_name?: string | null;
  image_wide_name?: string | null;
  preferred_aspect_ratio?: string | null;
  media_type?: 'image' | 'video' | null;
  status?: string;
  // AI-enhanced voice fields
  voice_description?: string | null;
  spoken_alias?: string | null;
  voice_upsell_suggestion?: string | null;
  // New fields for better media handling
  primary_media_id?: string | null;
  primary_media_type?: 'image' | 'video' | null;
  primary_media_url?: string | null;
  secondary_media_id?: string | null;
  secondary_media_type?: 'image' | 'video' | null;
  secondary_media_url?: string | null;
  // Customization fields
  customizations?: string[] | null;
  required_customizations?: string[] | null;
  
  // Special instructions and notes fields for unified Add-ons & Instructions tab
  special_instructions?: string | null;
  instructions_customer_visible?: boolean;
  instructions_staff_only?: boolean;
  
  // Progressive pricing fields for simple menu items (matching schema)
  has_variants: boolean;
  price?: number | null;
  price_dine_in?: number | null;
  price_delivery?: number | null;
  variants: {
    id?: string;
    protein_type_id: string | null;
    name: string | null; // POS Label field
    description: string | null; // Variant-specific description
    price: number;
    price_dine_in: number | null;
    price_delivery: number | null;
    is_default: boolean;
    image_url: string | null;
    // Enhanced media support for variants
    media_id?: string | null;
    media_type?: 'image' | 'video' | null;
    media_url?: string | null;
  }[];
}
export type CategoryFormValues = z.infer<typeof categorySchema>;
export type ProteinTypeFormValues = z.infer<typeof proteinTypeSchema>;
export type BatchPriceUpdateFormValues = z.infer<typeof batchPriceUpdateSchema>;