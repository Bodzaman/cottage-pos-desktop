import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Monitor, Tablet, Smartphone } from 'lucide-react';
import { CMSPageSelector } from './CMSPageSelector';
import { colors } from '../../utils/InternalDesignSystem';
import type { CMSPage } from '../../utils/websiteCmsTypes';

const VIEWPORT_WIDTHS = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

interface CMSPreviewPanelProps {
  previewPage: CMSPage;
  onPreviewPageChange: (page: CMSPage) => void;
}

export function CMSPreviewPanel({ previewPage, onPreviewPageChange }: CMSPreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);

  const previewUrl = getPreviewUrl(previewPage);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: colors.background.primary }}>
      {/* Preview Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 backdrop-blur-md"
        style={{ backgroundColor: 'rgba(26, 26, 26, 0.6)', borderBottom: `1px solid ${colors.border.light}` }}>
        <CMSPageSelector value={previewPage} onChange={onPreviewPageChange} label="Preview Page:" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7"
            style={{ color: viewport === 'desktop' ? colors.purple.light : 'rgba(255,255,255,0.5)' }}
            onClick={() => setViewport('desktop')}
            title="Desktop view"
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7"
            style={{ color: viewport === 'tablet' ? colors.purple.light : 'rgba(255,255,255,0.5)' }}
            onClick={() => setViewport('tablet')}
            title="Tablet view"
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7"
            style={{ color: viewport === 'mobile' ? colors.purple.light : 'rgba(255,255,255,0.5)' }}
            onClick={() => setViewport('mobile')}
            title="Mobile view"
          >
            <Smartphone className="h-4 w-4" />
          </Button>
          <div className="w-px h-4 mx-1" style={{ backgroundColor: colors.border.medium }} />
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-white/50 hover:text-white"
            onClick={handleRefresh}
            title="Refresh preview"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Iframe Container */}
      <div className="flex-1 flex items-start justify-center overflow-auto p-4">
        <div
          className="bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300"
          style={{
            width: VIEWPORT_WIDTHS[viewport],
            maxWidth: '100%',
            height: viewport === 'desktop' ? '100%' : 'calc(100vh - 200px)',
          }}
        >
          <iframe
            ref={iframeRef}
            key={refreshKey}
            src={previewUrl}
            className="w-full h-full border-0"
            title="Website Preview"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>
      </div>
    </div>
  );
}

function getPreviewUrl(page: CMSPage): string {
  const paths: Record<CMSPage, string> = {
    home: '/',
    about: '/about',
    contact: '/contact',
    gallery: '/gallery',
  };
  const baseUrl = import.meta.env.VITE_WEBSITE_URL || '';
  return `${baseUrl}${paths[page]}?preview=draft`;
}
