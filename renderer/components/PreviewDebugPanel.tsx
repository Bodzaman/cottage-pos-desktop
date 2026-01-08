import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Eye, Image, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isPreviewMode, getPreviewMode } from '../utils/previewMode';

interface PreviewDebugPanelProps {
  heroImages: string[];
  previewMode: 'draft' | 'published';
  lastContentTimestamp: string | null;
  contentLoading: boolean;
}

export function PreviewDebugPanel({
  heroImages,
  previewMode,
  lastContentTimestamp,
  contentLoading
}: PreviewDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messageLog, setMessageLog] = useState<Array<{ time: string; message: string }>>([]);

  // Toggle panel with Ctrl+Shift+D or Cmd+Shift+D
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        console.log('[Debug Panel] Toggled:', !isOpen);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  // Listen for postMessage events for debugging
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      const timestamp = new Date().toLocaleTimeString();
      const message = `PostMessage: ${JSON.stringify(event.data)}`;
      
      setMessageLog(prev => [
        { time: timestamp, message },
        ...prev.slice(0, 9) // Keep last 10 messages
      ]);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!isOpen) {
    // Floating toggle button
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[100] rounded-full w-12 h-12 p-0 shadow-lg"
        style={{
          background: 'rgba(91, 33, 182, 0.9)',
          border: '2px solid rgba(255, 255, 255, 0.2)'
        }}
        title="Open Debug Panel (Ctrl+Shift+D)"
      >
        <Eye className="h-5 w-5 text-white" />
      </Button>
    );
  }

  return (
    <Card
      className="fixed bottom-4 right-4 z-[100] w-96 max-h-[600px] overflow-hidden shadow-2xl"
      style={{
        background: 'rgba(15, 15, 15, 0.95)',
        border: '2px solid rgba(91, 33, 182, 0.5)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{
          borderColor: 'rgba(91, 33, 182, 0.3)',
          background: 'rgba(91, 33, 182, 0.1)'
        }}
      >
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-purple-400" />
          <h3 className="font-semibold text-white">Preview Debugger</h3>
        </div>
        <Button
          onClick={() => setIsOpen(false)}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
        {/* Preview Mode Status */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Preview Mode</span>
            <Badge
              className="text-xs"
              style={{
                background: previewMode === 'draft' ? '#f97316' : '#22c55e',
                color: 'white'
              }}
            >
              {previewMode.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>URL Param: {isPreviewMode() ? '?preview=draft' : 'none'}</span>
          </div>
        </div>

        {/* Loading State */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Content Loading</span>
            <Badge
              className="text-xs"
              style={{
                background: contentLoading ? '#eab308' : '#22c55e',
                color: 'white'
              }}
            >
              {contentLoading ? 'LOADING' : 'READY'}
            </Badge>
          </div>
        </div>

        {/* Hero Images */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Image className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-gray-400">Hero Carousel Images</span>
            <Badge className="text-xs bg-purple-600">{heroImages.length}</Badge>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {heroImages.length > 0 ? (
              heroImages.map((url, idx) => (
                <div key={idx} className="text-xs text-gray-500 truncate font-mono">
                  {idx + 1}. {url.substring(url.lastIndexOf('/') + 1)}
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-600 italic">No images loaded</div>
            )}
          </div>
        </div>

        {/* Last Update Timestamp */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-gray-400">Last Content Update</span>
          </div>
          <div className="text-xs text-gray-500 font-mono">
            {lastContentTimestamp || 'No timestamp yet'}
          </div>
        </div>

        {/* PostMessage Log */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">PostMessage Log</span>
            <Button
              onClick={() => setMessageLog([])}
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-gray-500 hover:text-white"
            >
              Clear
            </Button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto bg-black/30 rounded p-2">
            {messageLog.length > 0 ? (
              messageLog.map((log, idx) => (
                <div key={idx} className="text-xs">
                  <span className="text-purple-400">{log.time}</span>
                  <span className="text-gray-500 ml-2">{log.message}</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-600 italic">No messages received</div>
            )}
          </div>
        </div>

        {/* Manual Refresh */}
        <div>
          <Button
            onClick={() => window.location.reload()}
            className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
            Force Refresh Page
          </Button>
        </div>

        {/* Keyboard Shortcut Hint */}
        <div className="pt-2 border-t border-gray-800">
          <div className="text-xs text-gray-600 text-center">
            Press <kbd className="px-1 py-0.5 bg-gray-800 rounded text-purple-400">Ctrl+Shift+D</kbd> to toggle
          </div>
        </div>
      </div>
    </Card>
  );
}
