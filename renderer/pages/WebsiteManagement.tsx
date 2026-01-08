import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimpleAuth } from 'utils/simple-auth-context';
import { Save, Trash2, Eye, ChevronDown, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { globalColors, panelStyle, styles } from 'utils/QSAIDesign';
import { APP_BASE_PATH, apiClient } from 'app';
import ContentImageManager from 'components/ContentImageManager';
import ContentTextManager from 'components/ContentTextManager';
import { ThemeEditor } from 'components/ThemeEditor';
import { LayoutEditor } from 'components/LayoutEditor';
import { toast } from 'sonner';
import { PreviewDebugPanel } from 'components/PreviewDebugPanel';

// Page configuration
type PageId = 'home' | 'about' | 'contact' | 'gallery' | 'auth' | 'dishes';

interface PageConfig {
  id: PageId;
  name: string;
  route: string;
  sections: string[];
  sectionMapping?: Record<string, string>; // ✅ Map UI section names → database section names
}

const PAGES: PageConfig[] = [
  { 
    id: 'home', 
    name: 'Home', 
    route: '/', 
    sections: ['Hero', 'Features', 'Testimonials', 'CTA'],
    sectionMapping: {
      'Hero': 'hero_carousel',  // ✅ Map Hero → hero_carousel in database
      'Features': 'features',
      'Testimonials': 'testimonials',
      'CTA': 'cta'
    }
  },
  { 
    id: 'about', 
    name: 'About', 
    route: '/about', 
    sections: ['Story', 'Team', 'Values'],
    sectionMapping: {
      'Story': 'story',
      'Team': 'team',
      'Values': 'values'
    }
  },
  { 
    id: 'contact', 
    name: 'Contact', 
    route: '/contact', 
    sections: ['Form', 'Map', 'Info'],
    sectionMapping: {
      'Form': 'form',
      'Map': 'map',
      'Info': 'info'
    }
  },
  { 
    id: 'gallery', 
    name: 'Gallery', 
    route: '/gallery', 
    sections: ['Photos'],
    sectionMapping: {
      'Photos': 'photos'
    }
  },
  { 
    id: 'auth', 
    name: 'Auth', 
    route: '/auth', 
    sections: ['Login', 'Signup'],
    sectionMapping: {
      'Login': 'login',
      'Signup': 'signup'
    }
  },
  { 
    id: 'dishes', 
    name: 'Dishes', 
    route: '/dishes', 
    sections: ['Menu', 'Categories'],
    sectionMapping: {
      'Menu': 'menu',
      'Categories': 'categories'
    }
  },
];

type TabId = 'content' | 'theme' | 'layout';

export default function WebsiteManagement() {
  const navigate = useNavigate();
  // ADMIN PROTECTION REMOVED FOR TESTING
  
  // State
  const [selectedPage, setSelectedPage] = useState<PageId>('home');
  const [selectedTab, setSelectedTab] = useState<TabId>('content');
  const [unpublishedCount, setUnpublishedCount] = useState(0);
  const [previewPage, setPreviewPage] = useState<PageId>('home');
  const [iframeKey, setIframeKey] = useState(0);
  const [contentChangeCounter, setContentChangeCounter] = useState(0);
  const [lastContentTimestamp, setLastContentTimestamp] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);

  // Mock change counts per tab
  const tabChanges = {
    content: 3,
    theme: 0,
    layout: 2,
  };

  const currentPageConfig = PAGES.find(p => p.id === selectedPage) || PAGES[0];
  const previewPageConfig = PAGES.find(p => p.id === previewPage) || PAGES[0];

  // Handle content changes - now just increments iframe key
  const handleContentChange = () => {
    setContentChangeCounter(prev => prev + 1);
    // Trigger immediate iframe refresh
    setIframeKey(prev => prev + 1);
  };

  // Handle theme changes - now just increments iframe key
  const handleThemeChange = () => {
    setContentChangeCounter(prev => prev + 1);
    // Trigger immediate iframe refresh
    setIframeKey(prev => prev + 1);
  };

  // Auto-refresh polling: Check for content changes every 3 seconds
  React.useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let isActive = true;

    const pollForChanges = async () => {
      if (!isActive) return;
      
      try {
        // Poll draft content for the current preview page
        const response = await apiClient.get_all_draft_content({ page: previewPage });
        const data = await response.json();
        
        if (data.success && data.items && data.items.length > 0) {
          // Find the most recent update timestamp across all content items
          const timestamps = data.items
            .map((item: any) => item.updated_at)
            .filter(Boolean)
            .sort()
            .reverse();
          
          const latestTimestamp = timestamps[0];
          
          // If timestamp changed since last poll, reload iframe
          if (lastContentTimestamp && latestTimestamp && latestTimestamp !== lastContentTimestamp) {
            console.log('[CMS Preview] Content changed, refreshing preview...');
            setIframeKey(prev => prev + 1);
          }
          
          // Update tracked timestamp
          if (latestTimestamp) {
            setLastContentTimestamp(latestTimestamp);
          }
        }
      } catch (error) {
        console.error('[CMS Preview] Polling error:', error);
      }
    };

    // Initial poll to set baseline timestamp
    pollForChanges();
    
    // Poll every 3 seconds
    pollInterval = setInterval(pollForChanges, 3000);

    // Cleanup on unmount
    return () => {
      isActive = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [previewPage]);

  // Fetch unpublished count
  React.useEffect(() => {
    const fetchUnpublishedCount = async () => {
      try {
        const response = await apiClient.get_unpublished_count();
        const data = await response.json();
        if (data.success) {
          setUnpublishedCount(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch unpublished count:', error);
      }
    };
    fetchUnpublishedCount();
  }, [contentChangeCounter]);

  // Handle Publish All
  const handlePublishAll = async () => {
    if (unpublishedCount === 0) {
      toast.info('No unpublished changes to publish');
      return;
    }

    if (!confirm(`Publish ${unpublishedCount} changes? This will make them live on the public website.`)) {
      return;
    }

    setIsPublishing(true);
    try {
      const response = await apiClient.publish_all({ confirm: true });
      const data = await response.json();

      if (data.success) {
        toast.success(`✅ Published ${data.total_published} changes`);
        setUnpublishedCount(0);
        setContentChangeCounter(prev => prev + 1);
        // Refresh iframe to show published content
        setIframeKey(prev => prev + 1);
      } else {
        toast.error('Failed to publish changes');
      }
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish changes');
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle Discard All
  const handleDiscardAll = async () => {
    if (unpublishedCount === 0) {
      toast.info('No draft changes to discard');
      return;
    }

    if (!confirm(`⚠️ Discard ${unpublishedCount} draft changes? This cannot be undone!\n\nAll draft changes will be reset to the currently published version.`)) {
      return;
    }

    setIsDiscarding(true);
    try {
      const response = await apiClient.discard_all({ confirm: true });
      const data = await response.json();

      if (data.success) {
        toast.success(`🗑️ Discarded ${data.total_discarded} draft changes`);
        setUnpublishedCount(0);
        setContentChangeCounter(prev => prev + 1);
        // Refresh iframe to show reverted content
        setIframeKey(prev => prev + 1);
      } else {
        toast.error('Failed to discard changes');
      }
    } catch (error) {
      console.error('Discard error:', error);
      toast.error('Failed to discard changes');
    } finally {
      setIsDiscarding(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        ...styles.gridBackground,
        color: globalColors.text.primary,
      }}
    >
      {/* Vignette Effect */}
      <div style={styles.vignette} />

      <div className="relative z-10 h-screen flex flex-col">
        {/* Top Bar */}
        <div
          className="border-b px-6 py-4 flex items-center justify-between"
          style={{
            background: globalColors.background.panel,
            borderColor: globalColors.border.light,
          }}
        >
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold" style={{ color: globalColors.text.primary }}>
              Website Management
            </h1>
            {unpublishedCount > 0 && (
              <Badge
                variant="secondary"
                className="px-3 py-1.5 font-semibold animate-pulse"
                style={{
                  background: globalColors.purple.primary,
                  color: globalColors.text.primary,
                  boxShadow: `0 0 20px ${globalColors.purple.glow}`,
                }}
              >
                🔴 {unpublishedCount} Unpublished Change{unpublishedCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Publish & Discard Actions */}
            <Button
              variant="outline"
              size="default"
              className="gap-2"
              style={{
                borderColor: globalColors.border.medium,
                color: globalColors.text.secondary,
              }}
              onClick={handleDiscardAll}
              disabled={unpublishedCount === 0 || isDiscarding || isPublishing}
            >
              {isDiscarding ? (
                <RefreshCcw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isDiscarding ? 'Discarding...' : 'Discard Changes'}
            </Button>
            <Button
              size="default"
              className="gap-2"
              style={{
                background: unpublishedCount === 0 ? globalColors.background.tertiary : globalColors.purple.primary,
                color: unpublishedCount === 0 ? globalColors.text.muted : globalColors.text.primary,
                cursor: unpublishedCount === 0 ? 'not-allowed' : 'pointer',
              }}
              disabled={unpublishedCount === 0 || isPublishing || isDiscarding}
              onClick={handlePublishAll}
            >
              {isPublishing ? (
                <RefreshCcw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isPublishing ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </div>

        {/* Split Panel Layout */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left Panel - Editor */}
          <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
            <div
              className="h-full flex flex-col"
              style={{
                background: globalColors.background.panel,
                borderRight: `1px solid ${globalColors.border.light}`,
              }}
            >
              {/* Tabs */}
              <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as TabId)} className="flex-1 flex flex-col">
                <div
                  className="border-b px-4"
                  style={{ borderColor: globalColors.border.light }}
                >
                  <TabsList
                    className="w-full grid grid-cols-3 gap-0"
                    style={{
                      background: 'transparent',
                      borderRadius: 0,
                    }}
                  >
                    <TabsTrigger
                      value="content"
                      className="relative data-[state=active]:bg-transparent"
                      style={{
                        color: selectedTab === 'content' ? globalColors.purple.primary : globalColors.text.muted,
                        borderBottom: selectedTab === 'content' ? `2px solid ${globalColors.purple.primary}` : 'none',
                      }}
                    >
                      Content
                      {tabChanges.content > 0 && (
                        <Badge
                          className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                          style={{
                            background: globalColors.purple.primary,
                            color: globalColors.text.primary,
                          }}
                        >
                          {tabChanges.content}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="theme"
                      className="relative data-[state=active]:bg-transparent"
                      style={{
                        color: selectedTab === 'theme' ? globalColors.purple.primary : globalColors.text.muted,
                        borderBottom: selectedTab === 'theme' ? `2px solid ${globalColors.purple.primary}` : 'none',
                      }}
                    >
                      Theme
                      {tabChanges.theme > 0 && (
                        <Badge
                          className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                          style={{
                            background: globalColors.purple.primary,
                            color: globalColors.text.primary,
                          }}
                        >
                          {tabChanges.theme}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="layout"
                      className="relative data-[state=active]:bg-transparent"
                      style={{
                        color: selectedTab === 'layout' ? globalColors.purple.primary : globalColors.text.muted,
                        borderBottom: selectedTab === 'layout' ? `2px solid ${globalColors.purple.primary}` : 'none',
                      }}
                    >
                      Layout
                      {tabChanges.layout > 0 && (
                        <Badge
                          className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                          style={{
                            background: globalColors.purple.primary,
                            color: globalColors.text.primary,
                          }}
                        >
                          {tabChanges.layout}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Page Selector */}
                <div
                  className="px-4 py-3 border-b"
                  style={{ borderColor: globalColors.border.light }}
                >
                  <label
                    className="text-sm font-medium mb-2 block"
                    style={{ color: globalColors.text.secondary }}
                  >
                    Select Page:
                  </label>
                  <Select value={selectedPage} onValueChange={(v) => {
                    setSelectedPage(v as PageId);
                    setPreviewPage(v as PageId);
                    setIframeKey(prev => prev + 1);
                  }}>
                    <SelectTrigger
                      style={{
                        background: globalColors.background.secondary,
                        borderColor: globalColors.border.medium,
                        color: globalColors.text.primary,
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        background: globalColors.background.panel,
                        borderColor: globalColors.border.medium,
                      }}
                    >
                      {PAGES.map((page) => (
                        <SelectItem
                          key={page.id}
                          value={page.id}
                          style={{
                            color: globalColors.text.primary,
                          }}
                        >
                          {page.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tab Content with Sections */}
                <ScrollArea className="flex-1">
                  <div className="pb-8" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                    <TabsContent value="content" className="m-0 p-6">
                      <Accordion type="single" collapsible className="space-y-4">
                        {currentPageConfig.sections.map((section) => {
                          const dbSection = currentPageConfig.sectionMapping?.[section] || section.toLowerCase();
                          
                          return (
                          <AccordionItem
                            key={section}
                            value={section}
                            style={{
                              ...panelStyle,
                              borderColor: globalColors.border.medium,
                            }}
                          >
                            <AccordionTrigger
                              className="px-4 hover:no-underline"
                              style={{ color: globalColors.text.primary }}
                            >
                              {section}
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-6 pt-2">
                              <div className="space-y-8">
                                {/* Text Content */}
                                <div>
                                  <h4 className="text-sm font-semibold mb-4" style={{ color: globalColors.text.primary }}>
                                    Text Content
                                  </h4>
                                  <ContentTextManager
                                    page={currentPageConfig.id}
                                    section={dbSection}
                                    onContentChange={handleContentChange}
                                  />
                                </div>

                                {/* Divider */}
                                <div className="border-t" style={{ borderColor: globalColors.border.medium }} />

                                {/* Images */}
                                <div>
                                  <h4 className="text-sm font-semibold mb-4" style={{ color: globalColors.text.primary }}>
                                    Images
                                  </h4>
                                  <ContentImageManager
                                    page={currentPageConfig.id}
                                    section={dbSection}
                                    onContentChange={handleContentChange}
                                  />
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </TabsContent>

                    <TabsContent value="theme" className="m-0 p-6">
                      <ThemeEditor onThemeChange={handleThemeChange} />
                    </TabsContent>

                    <TabsContent value="layout" className="m-0 p-6">
                      {selectedTab === 'layout' && (
                        <div className="h-full">
                          <LayoutEditor onLayoutChange={handleContentChange} />
                        </div>
                      )}
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>
            </div>
          </ResizablePanel>

          {/* Resizable Handle */}
          <ResizableHandle withHandle />

          {/* Right Panel - Preview */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <div
              className="h-full flex flex-col"
              style={{ background: globalColors.background.secondary }}
            >
              {/* Draft Mode Warning Banner */}
              <Alert
                className="m-4 mb-0 rounded-lg border"
                style={{
                  background: `${globalColors.purple.primary}20`,
                  borderColor: globalColors.purple.primary,
                }}
              >
                <Eye className="h-4 w-4" style={{ color: globalColors.purple.primary }} />
                <AlertDescription style={{ color: globalColors.text.primary }}>
                  <strong>Draft Mode:</strong> Viewing unpublished changes. Changes will only be visible to the public after clicking "Publish All".
                </AlertDescription>
              </Alert>

              {/* Preview Controls */}
              <div className="px-4 py-3 flex items-center gap-3">
                <label
                  className="text-sm font-medium"
                  style={{ color: globalColors.text.secondary }}
                >
                  Preview Page:
                </label>
                <Select value={previewPage} onValueChange={(v) => {
                  setPreviewPage(v as PageId);
                  setIframeKey(prev => prev + 1);
                }}>
                  <SelectTrigger
                    className="w-[200px]"
                    style={{
                      background: globalColors.background.panel,
                      borderColor: globalColors.border.medium,
                      color: globalColors.text.primary,
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      background: globalColors.background.panel,
                      borderColor: globalColors.border.medium,
                    }}
                  >
                    {PAGES.map((page) => (
                      <SelectItem
                        key={page.id}
                        value={page.id}
                        style={{ color: globalColors.text.primary }}
                      >
                        {page.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex-1" />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIframeKey(prev => prev + 1);
                    }}
                    style={{
                      borderColor: globalColors.border.medium,
                      color: globalColors.text.secondary,
                    }}
                    title="Refresh Preview"
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentIndex = PAGES.findIndex(p => p.id === previewPage);
                      const prevIndex = currentIndex > 0 ? currentIndex - 1 : PAGES.length - 1;
                      setPreviewPage(PAGES[prevIndex].id);
                      setIframeKey(prev => prev + 1);
                    }}
                    style={{
                      borderColor: globalColors.border.medium,
                      color: globalColors.text.secondary,
                    }}
                  >
                    ← Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentIndex = PAGES.findIndex(p => p.id === previewPage);
                      const nextIndex = currentIndex < PAGES.length - 1 ? currentIndex + 1 : 0;
                      setPreviewPage(PAGES[nextIndex].id);
                      setIframeKey(prev => prev + 1);
                    }}
                    style={{
                      borderColor: globalColors.border.medium,
                      color: globalColors.text.secondary,
                    }}
                  >
                    Next →
                  </Button>
                </div>
              </div>

              {/* Preview Iframe */}
              <div className="flex-1 px-4 pb-4">
                <iframe
                  key={`${previewPage}-${iframeKey}`}
                  src={`${APP_BASE_PATH}${previewPageConfig.route}?preview=draft&t=${iframeKey}`}
                  className="w-full h-full rounded-lg border"
                  style={{
                    background: 'white',
                    borderColor: globalColors.border.medium,
                  }}
                  title="Website Preview"
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
