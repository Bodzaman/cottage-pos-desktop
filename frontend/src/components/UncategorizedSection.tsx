import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Link2, Eye, EyeOff } from 'lucide-react';
import { MediaAsset } from 'utils/mediaLibraryUtils';
import { MediaGrid } from 'components/MediaGrid';

interface UncategorizedSectionProps {
  assets: MediaAsset[];
  title: string;
  description: string;
  onAutoLink?: () => Promise<void>;
  isAutoLinking?: boolean;
  className?: string;
}

export default function UncategorizedSection({
  assets,
  title,
  description,
  onAutoLink,
  isAutoLinking = false,
  className = '',
}: UncategorizedSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (assets.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Alert className="border-orange-500/30 bg-orange-500/5">
        <AlertTriangle className="h-5 w-5 text-orange-500" />
        <AlertTitle className="text-orange-400 font-semibold flex items-center justify-between">
          <span>
            {title} ({assets.length})
          </span>
          <div className="flex items-center gap-2">
            {onAutoLink && (
              <Button
                size="sm"
                variant="outline"
                onClick={onAutoLink}
                disabled={isAutoLinking}
                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
              >
                <Link2 className="h-3 w-3 mr-1" />
                {isAutoLinking ? 'Linking...' : 'Auto-Link'}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
            >
              {isExpanded ? (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Show
                </>
              )}
            </Button>
          </div>
        </AlertTitle>
        <AlertDescription className="text-orange-300/80 mt-2">
          {description}
        </AlertDescription>
      </Alert>

      {/* Collapsible Media Grid */}
      {isExpanded && (
        <div className="animate-in fade-in-50 slide-in-from-top-2 duration-200">
          <MediaGrid
            items={assets.map((asset) => ({
              id: asset.asset_id || asset.id,
              name: asset.file_name || '',
              friendlyName: asset.friendly_name || asset.file_name || '',
              size: asset.file_size || 0,
              url: asset.url || '',
              updatedAt: asset.upload_date || new Date().toISOString(),
              type: asset.type || 'image',
              tags: asset.tags || [],
              usage: asset.usage,
              description: asset.description,
            }))}
            onDelete={undefined} // Disable delete from uncategorized section
            onSelect={undefined} // Disable select from uncategorized section
          />
        </div>
      )}
    </div>
  );
}
