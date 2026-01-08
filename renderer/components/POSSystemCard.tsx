import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Monitor, 
  Wifi, 
  WifiOff,
  ChefHat,
  Hash,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { colors, cardStyle } from '../utils/designSystem';
import { Category, MenuItem } from '../utils/menuTypes';

// Types for the component
interface MenuPreviewData {
  categories: Category[];
  menuItems: MenuItem[];
  lastUpdated: string;
  totalItems: number;
  activeItems: number;
}

interface MenuStatusData {
  isConnected: boolean;
  lastSync: string;
  itemCount: number;
  syncStatus: 'connected' | 'syncing' | 'error';
}

interface POSSystemCardProps {
  menuData: MenuPreviewData | null;
  menuStatus: MenuStatusData;
  isLoading: boolean;
}

const POSSystemCard: React.FC<POSSystemCardProps> = ({ 
  menuData, 
  menuStatus, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <Card style={cardStyle} className="h-[400px]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5" style={{ color: colors.brand.purple }} />
            <CardTitle className="text-lg">POS System</CardTitle>
          </div>
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            Loading staff interface...
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.brand.purple }}></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sampleItems = menuData?.menuItems.slice(0, 3) || [];
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  
  const posUrl = 'https://exoticcreations.riff.works/cottage-tandoori-quickserve-ai/pos';

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIframeError(true);
    setIframeLoaded(true);
  };

  return (
    <Card style={cardStyle} className="h-[600px]">  {/* Increased height for iframe */}
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5" style={{ color: colors.brand.purple }} />
          <CardTitle className="text-lg">POS System</CardTitle>
        </div>
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          Staff ordering interface
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* POS Stats */}
          <div className="flex items-center gap-4 text-xs" style={{ color: colors.text.secondary }}>
            <div className="flex items-center gap-1">
              <ChefHat className="h-3 w-3" />
              <span>{menuStatus.itemCount} items</span>
            </div>
            <div className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              <span>Quick codes</span>
            </div>
          </div>
          
          <Separator style={{ backgroundColor: colors.border.light }} />
          
          {/* Live POS Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium" style={{ color: colors.text.secondary }}>Live Preview:</div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs" 
                onClick={() => window.open(posUrl, '_blank')}
                style={{ color: colors.brand.purple }}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open Full
              </Button>
            </div>
            
            <div className="relative h-48 rounded border" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.light }}>
              {!iframeLoaded && !iframeError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-xs" style={{ color: colors.text.secondary }}>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading preview...
                  </div>
                </div>
              )}
              
              {iframeError ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Monitor className="h-8 w-8 mx-auto opacity-30" />
                    <p className="text-xs" style={{ color: colors.text.secondary }}>
                      Preview unavailable
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-6 px-2 text-xs" 
                      onClick={() => window.open(posUrl, '_blank')}
                    >
                      View Live POS
                    </Button>
                  </div>
                </div>
              ) : (
                <iframe 
                  src={posUrl}
                  title="POS System Preview"
                  className="w-full h-full border-0 rounded"
                  style={{ 
                    backgroundColor: 'white',
                    opacity: iframeLoaded ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    transform: 'scale(0.25)',
                    transformOrigin: 'top left',
                    width: '400%',
                    height: '400%'
                  }}
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                />
              )}
            </div>
          </div>
          
          {/* Quick Access Items */}
          <div className="space-y-2">
            <div className="text-xs font-medium" style={{ color: colors.text.secondary }}>Quick Access:</div>
            <div className="grid grid-cols-1 gap-1">
              {sampleItems.length > 0 ? (
                sampleItems.slice(0, 2).map((item, index) => (
                  <div key={item.id} className="flex justify-between items-center py-1.5 px-2 rounded bg-gray-800/30">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: colors.brand.purple, color: 'white' }}>
                        {(index + 1).toString().padStart(2, '0')}
                      </div>
                      <span className="text-xs text-white truncate" style={{ maxWidth: '120px' }}>{item.name}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Monitor className="h-6 w-6 mx-auto mb-1 opacity-30" />
                  <p className="text-xs" style={{ color: colors.text.secondary }}>
                    No items configured
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      <Separator style={{ backgroundColor: colors.border.light }} />
      
      <div className="px-6 py-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            {menuStatus.syncStatus === 'connected' ? (
              <Wifi className="h-3 w-3" style={{ color: colors.brand.purple }} />
            ) : (
              <WifiOff className="h-3 w-3" style={{ color: colors.text.secondary }} />
            )}
            <span style={{ color: colors.text.secondary }}>
              Sync: {menuStatus.syncStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <span style={{ color: colors.text.secondary }}>🔄 Real-time</span>
        </div>
      </div>
    </Card>
  );
};

export default POSSystemCard;
