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

import React from 'react';
import { UniversalHeader } from 'components/UniversalHeader';
import { Footer } from 'components/Footer';
import { AuthTheme } from 'utils/authTheme';
import { OfflineBanner } from 'components/OfflineBanner';

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthLayout({ children, className = '' }: AuthLayoutProps) {
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
          backgroundImage: `url('https://static.databutton.com/public/88a315b0-faa2-491d-9215-cf1e283cdee2/Sketch_Logo_Cottage_16x9.png')`,
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
