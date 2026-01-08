import { useState, useEffect } from 'react';
import { apiClient } from 'app';
import { usePreviewMode } from './previewMode';

/**
 * Hook to load voice audio (dial tone) from database
 * Supports preview mode and falls back to default audio on error
 */
export function useVoiceAudio() {
  const previewMode = usePreviewMode();
  const [dialToneUrl, setDialToneUrl] = useState<string>(
    'https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/Phone Dial Tone.MP3'
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAudio = async () => {
      try {
        setIsLoading(true);
        
        const response = previewMode === 'draft'
          ? await apiClient.get_all_draft_content({ page: 'voice' })
          : await apiClient.get_published_content({ page: 'voice' });
        
        const data = await response.json();
        
        if (data.success && data.items) {
          // Extract dial tone audio
          const audioItem = data.items.find((item: any) => 
            item.section === 'audio' && item.type === 'audio'
          );
          
          if (audioItem) {
            const url = previewMode === 'draft' ? audioItem.draft_media_url : audioItem.published_media_url;
            if (url) {
              setDialToneUrl(url);
              console.log('✅ Loaded voice dial tone from database');
            }
          }
        }
      } catch (error) {
        console.error('Failed to load voice audio from database:', error);
        // Keep fallback audio on error
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAudio();
  }, [previewMode]);

  return { dialToneUrl, isLoading };
}
