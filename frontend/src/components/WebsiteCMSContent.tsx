import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CMSPublishBar } from './cms/CMSPublishBar';
import { CMSPageSelector } from './cms/CMSPageSelector';
import { CMSEditorPanel } from './cms/CMSEditorPanel';
import { CMSPreviewPanel } from './cms/CMSPreviewPanel';
import { ThemeEditor } from './cms/sections/ThemeEditor';
import { LayoutEditor } from './cms/sections/LayoutEditor';
import { colors, InternalTheme } from '../utils/InternalDesignSystem';
import type { CMSPage, CMSSubTab } from '../utils/websiteCmsTypes';

/**
 * WebsiteCMSContent - Main CMS shell with split-panel editor/preview.
 *
 * Used by both:
 * - /website-management standalone page
 * - /admin?tab=website admin tab
 */
export default function WebsiteCMSContent() {
  const [activePage, setActivePage] = useState<CMSPage>('home');
  const [previewPage, setPreviewPage] = useState<CMSPage>('home');
  const [activeSubTab, setActiveSubTab] = useState<CMSSubTab>('content');

  // Sync preview page when editor page changes
  const handlePageChange = (page: CMSPage) => {
    setActivePage(page);
    setPreviewPage(page);
  };

  return (
    <div
      className={`flex flex-col h-[calc(100vh-120px)] min-h-[600px] overflow-hidden ${InternalTheme.classes.surfacePanel}`}
    >
      {/* Top Publish Bar */}
      <CMSPublishBar />

      {/* Sub-tabs: Content / Theme / Layout */}
      <div className="border-b border-white/[0.07]">
        <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as CMSSubTab)}>
          <div className="flex items-center justify-between px-4 py-2">
            <TabsList className={`h-8 ${InternalTheme.classes.surfaceInset}`}>
              <TabsTrigger
                value="content"
                className="text-xs data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white data-[state=active]:shadow-[0_0_12px_rgba(124,58,237,0.3)] text-white/60 h-6 px-3"
              >
                Content
              </TabsTrigger>
              <TabsTrigger
                value="theme"
                className="text-xs data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white data-[state=active]:shadow-[0_0_12px_rgba(124,58,237,0.3)] text-white/60 h-6 px-3"
              >
                Theme
              </TabsTrigger>
              <TabsTrigger
                value="layout"
                className="text-xs data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white data-[state=active]:shadow-[0_0_12px_rgba(124,58,237,0.3)] text-white/60 h-6 px-3"
              >
                Layout
              </TabsTrigger>
            </TabsList>

            {activeSubTab === 'content' && (
              <CMSPageSelector value={activePage} onChange={handlePageChange} />
            )}
          </div>

          {/* Split Panel */}
          <div className="flex flex-1 min-h-0" style={{ height: 'calc(100vh - 240px)' }}>
            {/* Left Panel - Editor */}
            <div className="w-[40%] min-w-[320px] overflow-hidden flex flex-col border-r border-white/[0.07]">
              <TabsContent value="content" className="flex-1 overflow-y-auto m-0">
                <CMSEditorPanel activePage={activePage} />
              </TabsContent>
              <TabsContent value="theme" className="flex-1 overflow-y-auto m-0">
                <ThemeEditor />
              </TabsContent>
              <TabsContent value="layout" className="flex-1 overflow-y-auto m-0">
                <LayoutEditor page={activePage} />
              </TabsContent>
            </div>

            {/* Right Panel - Preview */}
            <div className="flex-1 overflow-hidden">
              <CMSPreviewPanel previewPage={previewPage} onPreviewPageChange={setPreviewPage} />
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
