import React from 'react';
import { MediaLibraryContent } from 'components/MediaLibraryContent';
import { gridBackgroundStyle, colors } from 'utils/designSystem';

/**
 * MediaLibrary Page
 * 
 * Full-page wrapper for the Media Library.
 * The actual functionality is in MediaLibraryContent component,
 * which is also used in AdminTabsContent.
 */
export default function MediaLibrary() {
  return (
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8"
      style={{ ...gridBackgroundStyle, color: colors.text.primary }}
    >
      <div className="max-w-screen-2xl mx-auto">
        <MediaLibraryContent />
      </div>
    </div>
  );
}
