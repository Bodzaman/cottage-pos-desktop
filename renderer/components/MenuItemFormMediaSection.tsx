import React from 'react';
import { Camera } from 'lucide-react';
import { globalColors } from '../utils/QSAIDesign';
import { MenuItemMedia } from './MenuItemMedia';
import type { UseFormSetValue } from 'react-hook-form';
import type { MenuItemFormInput } from '../utils/menuFormValidation';

/**
 * Media data interface
 */
interface MediaData {
  image_url: string;
  image_url_widescreen: string;
  image_asset_id: string;
  image_widescreen_asset_id: string;
  preferred_aspect_ratio: 'square' | 'landscape';
}

/**
 * Props for MediaSection component
 */
interface MediaSectionProps {
  /** Current media data */
  mediaData: MediaData;
  /** Callback to update form values */
  setValue: UseFormSetValue<MenuItemFormInput>;
  /** Container style object */
  containerStyle: React.CSSProperties;
}

/**
 * MediaSection Component
 * 
 * Wrapper for MenuItemMedia component with section styling and header.
 * Handles media updates and propagates changes to form state.
 * 
 * @component
 */
export const MenuItemFormMediaSection = React.memo<MediaSectionProps>(({ 
  mediaData, 
  setValue, 
  containerStyle 
}) => {
  const handleMediaChange = React.useCallback((updatedMedia: MediaData) => {
    console.log('\n' + '='.repeat(80));
    console.log('📸 [MenuItemFormMediaSection] handleMediaChange CALLED');
    console.log('='.repeat(80));
    console.log('Received updatedMedia object:', updatedMedia);
    console.log('  image_url:', updatedMedia.image_url || '(not set)');
    console.log('  image_url_widescreen:', updatedMedia.image_url_widescreen || '(not set)');
    console.log('  image_asset_id:', updatedMedia.image_asset_id || '(not set)');
    console.log('  image_widescreen_asset_id:', updatedMedia.image_widescreen_asset_id || '(not set)');
    console.log('  preferred_aspect_ratio:', updatedMedia.preferred_aspect_ratio);
    console.log('\n🔧 Calling setValue for each field...');
    
    setValue('image_url', updatedMedia.image_url, { shouldDirty: true });
    console.log('  ✅ setValue(image_url) called');
    setValue('image_url_widescreen', updatedMedia.image_url_widescreen, { shouldDirty: true });
    console.log('  ✅ setValue(image_url_widescreen) called');
    setValue('image_asset_id', updatedMedia.image_asset_id, { shouldDirty: true });
    console.log('  ✅ setValue(image_asset_id) called with:', updatedMedia.image_asset_id);
    setValue('image_widescreen_asset_id', updatedMedia.image_widescreen_asset_id, { shouldDirty: true });
    console.log('  ✅ setValue(image_widescreen_asset_id) called with:', updatedMedia.image_widescreen_asset_id);
    setValue('preferred_aspect_ratio', updatedMedia.preferred_aspect_ratio, { shouldDirty: true });
    console.log('  ✅ setValue(preferred_aspect_ratio) called');
    console.log('='.repeat(80) + '\n');
  }, [setValue]);

  return (
    <div style={containerStyle} className="mb-8 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: globalColors.purple.primary }}
        >
          <Camera className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-semibold" style={{ color: globalColors.text.primary }}>
          Media & Images
        </h3>
      </div>
      
      <MenuItemMedia
        media={mediaData}
        onChange={handleMediaChange}
      />
    </div>
  );
});

MenuItemFormMediaSection.displayName = 'MenuItemFormMediaSection';
