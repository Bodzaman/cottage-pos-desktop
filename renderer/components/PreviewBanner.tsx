/**
 * Preview Mode Banner
 * 
 * Shows a warning banner at the top of pages when in draft preview mode.
 * Only visible when ?preview=draft is in the URL.
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { isPreviewMode } from 'utils/previewMode';

export default function PreviewBanner() {
  // Only show banner in preview mode
  if (!isPreviewMode()) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 w-full">
      <Alert className="rounded-none border-0 border-b bg-orange-500/90 text-white backdrop-blur-sm">
        <AlertTriangle className="h-5 w-5" />
        <AlertDescription className="font-semibold">
          ⚠️ DRAFT PREVIEW MODE - Changes are not published yet
        </AlertDescription>
      </Alert>
    </div>
  );
}
