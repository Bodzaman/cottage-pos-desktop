/**
 * AuthLayout - Unified Layout for Authentication Pages
 * 
 * This component wraps all auth-related pages (Login, SignUp, ForgotPassword, CustomerPortal)
 * with consistent structure, styling, and background.
 * 
 * Features:
 * - Full-screen background watermark (Cottage logo)
 * - UniversalHeader with AUTH_NAV context
 * - Footer with minimal variant
 * - Centered content container
 * - Consistent spacing and z-index management
 * 
 * Usage:
 * ```tsx
 * <AuthLayout>
 *   <YourAuthPageContent />
 * </AuthLayout>
 * ```
 */

import React, { useEffect, useState } from 'react';
import { UniversalHeader } from 'components/UniversalHeader';
import { Footer } from 'components/Footer';
import { AuthTheme } from 'utils/authTheme';
import { OfflineBanner } from 'components/OfflineBanner';
import { apiClient } from 'app';
import { usePreviewMode } from 'utils/previewMode';

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthLayout({ children, className = '' }: AuthLayoutProps) {
  // ✅ Preview mode support
  const previewMode = usePreviewMode();
  
  // ✅ Database-driven logo watermark
  const [logoUrl, setLogoUrl] = useState('https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/Sketch_Logo_Cottage_16x9.png');
  
  // ✅ Load logo from database
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = previewMode === 'draft'
          ? await apiClient.get_all_draft_content({ page: 'auth' })
          : await apiClient.get_published_content({ page: 'auth' });
        
        const data = await response.json();
        
        if (data.success && data.items) {
          const logoItem = data.items.find((item: any) => 
            item.section === 'branding' && item.type === 'image'
          );
          if (logoItem) {
            const url = previewMode === 'draft' ? logoItem.draft_media_url : logoItem.published_media_url;
            if (url) {
              setLogoUrl(url); // ✅ Decode URL
              console.log('✅ Loaded auth logo from database');
            }
          }
        }
      } catch (error) {
        console.error('Failed to load auth logo from database:', error);
      }
    };
    
    loadLogo();
  }, [previewMode]);
  
  // ✅ Listen for CMS updates (postMessage from parent iframe)
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'CMS_CONTENT_UPDATED' && event.data?.page === 'auth') {
        try {
          const response = await apiClient.get_all_draft_content({ page: 'auth' });
          const data = await response.json();
          
          if (data.success && data.items) {
            const logoItem = data.items.find((item: any) => item.section === 'branding' && item.type === 'image');
            if (logoItem?.draft_media_url) {
              setLogoUrl(logoItem.draft_media_url); // ✅ Decode URL
            }
          }
        } catch (error) {
          console.error('Failed to update auth logo via postMessage:', error);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div 
      className="min-h-screen text-[#EAECEF] relative"
      style={{ background: AuthTheme.colors.background }}
    >
      {/* Offline Status Banner */}
      <OfflineBanner />
      
      {/* Full-size cottage logo watermark */}
      <div 
        className="absolute inset-0 bg-center bg-no-repeat opacity-20 brightness-110"
        style={{
          backgroundImage: `url('${logoUrl}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center'
        }}
      />
      
      {/* Content with higher z-index */}
      <div className="relative z-10">
        {/* Universal Header with AUTH_NAV context */}
        <UniversalHeader context="AUTH_NAV" />

        {/* Main Content */}
        <div className="relative">
          <div className={`flex min-h-screen items-center justify-center px-4 py-8 pt-24 ${className}`}>
            {children}
          </div>
        </div>

        {/* Footer */}
        <Footer variant="minimal" />
      </div>
    </div>
  );
}
