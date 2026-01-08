import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ChefHat, Download, ExternalLink, Monitor, AlertCircle, CheckCircle2, GitBranch, Package } from 'lucide-react';
import { apiClient } from 'app';
import { cardStyle } from '../utils/designSystem';
import { globalColors } from '../utils/QSAIDesign';

interface KDSReleaseInfo {
  success: boolean;
  version?: string;
  download_url?: string;
  release_url?: string;
  release_name?: string;
  published_at?: string;
  error_message?: string;
}

export default function UpdateKDS() {
  const navigate = useNavigate();
  const [downloadInfo, setDownloadInfo] = useState<KDSReleaseInfo | null>(null);
  const [downloadInfoLoading, setDownloadInfoLoading] = useState(true);
  const [systemInfo, setSystemInfo] = useState<{
    platform: string;
    userAgent: string;
    screenResolution: string;
  } | null>(null);

  // Load system information
  useEffect(() => {
    const platform = navigator.platform || 'Unknown';
    const userAgent = navigator.userAgent;
    const screenResolution = `${window.screen.width}x${window.screen.height}`;
    
    setSystemInfo({
      platform,
      userAgent,
      screenResolution
    });
  }, []);

  // Load latest KDS release information
  useEffect(() => {
    loadDownloadInfo();
  }, []);

  const loadDownloadInfo = async () => {
    setDownloadInfoLoading(true);
    try {
      const response = await apiClient.get_latest_release();
      const data = await response.json();
      setDownloadInfo(data);
    } catch (error) {
      console.error('Failed to load KDS download info:', error);
      setDownloadInfo({
        success: false,
        error_message: 'Failed to load download information'
      });
    } finally {
      setDownloadInfoLoading(false);
    }
  };

  const getRecommendedPlatform = (): string => {
    if (!systemInfo) return 'Unknown';
    
    const ua = systemInfo.userAgent.toLowerCase();
    if (ua.includes('win')) return 'Windows';
    if (ua.includes('mac')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    return 'Unknown';
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)'
      }}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/pos-desktop')}
              className="flex items-center gap-2"
              style={{ color: globalColors.text.secondary }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to POS
            </Button>
            <div className="flex items-center gap-3">
              <ChefHat className="w-8 h-8" style={{ color: '#EF4444' }} />
              <div>
                <h1
                  className="text-3xl font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #EF4444 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Kitchen Display System
                </h1>
                <p className="text-sm" style={{ color: globalColors.text.muted }}>
                  Desktop Application Management
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* System Information Card */}
        <Card style={cardStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: globalColors.text.primary }}>
              <Monitor className="w-5 h-5" />
              System Information
            </CardTitle>
            <CardDescription style={{ color: globalColors.text.muted }}>
              Current device and environment details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {systemInfo ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium" style={{ color: globalColors.text.muted }}>
                    Platform
                  </div>
                  <div className="text-lg" style={{ color: globalColors.text.primary }}>
                    {systemInfo.platform}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: globalColors.text.muted }}>
                    Recommended Build
                  </div>
                  <div className="text-lg" style={{ color: globalColors.text.primary }}>
                    {getRecommendedPlatform()}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: globalColors.text.muted }}>
                    Screen Resolution
                  </div>
                  <div className="text-lg" style={{ color: globalColors.text.primary }}>
                    {systemInfo.screenResolution}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: globalColors.text.muted }}>
                    User Agent
                  </div>
                  <div className="text-sm truncate" style={{ color: globalColors.text.primary }}>
                    {systemInfo.userAgent}
                  </div>
                </div>
              </div>
            ) : (
              <Skeleton className="h-20 w-full" />
            )}
          </CardContent>
        </Card>

        {/* Download Section */}
        <Card style={cardStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: globalColors.text.primary }}>
              <Package className="w-5 h-5" />
              Latest KDS Release
            </CardTitle>
            <CardDescription style={{ color: globalColors.text.muted }}>
              Download the standalone Kitchen Display desktop application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {downloadInfoLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-8 w-3/4" />
              </div>
            ) : downloadInfo?.success ? (
              <div className="space-y-4">
                {/* Version Info */}
                <div className="flex items-center justify-between p-4 rounded-lg" style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  <div>
                    <div className="text-sm font-medium" style={{ color: globalColors.text.muted }}>
                      Latest Version
                    </div>
                    <div className="text-2xl font-bold" style={{ color: '#EF4444' }}>
                      {downloadInfo.version || 'N/A'}
                    </div>
                    {downloadInfo.published_at && (
                      <div className="text-xs" style={{ color: globalColors.text.muted }}>
                        Released {new Date(downloadInfo.published_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <Badge
                    className="text-sm px-3 py-1"
                    style={{
                      background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                      color: '#FFFFFF'
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Available
                  </Badge>
                </div>

                {/* Download Buttons */}
                <div className="space-y-3">
                  {downloadInfo.download_url && (
                    <Button
                      onClick={() => window.open(downloadInfo.download_url, '_blank')}
                      className="w-full flex items-center justify-center gap-2 text-lg py-6"
                      style={{
                        background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                        color: '#FFFFFF',
                        border: '2px solid rgba(239, 68, 68, 0.5)'
                      }}
                    >
                      <Download className="w-5 h-5" />
                      Download KDS Desktop App ({getRecommendedPlatform()})
                    </Button>
                  )}

                  {downloadInfo.release_url && (
                    <Button
                      onClick={() => window.open(downloadInfo.release_url, '_blank')}
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                      style={{
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        color: globalColors.text.secondary
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Release on GitHub
                    </Button>
                  )}
                </div>

                {/* Release Name */}
                {downloadInfo.release_name && (
                  <div className="text-sm" style={{ color: globalColors.text.muted }}>
                    <strong>Release:</strong> {downloadInfo.release_name}
                  </div>
                )}
              </div>
            ) : (
              <Alert style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                <AlertCircle className="h-4 w-4" style={{ color: '#EF4444' }} />
                <AlertDescription style={{ color: '#EF4444' }}>
                  {downloadInfo?.error_message || 'No releases available yet'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Installation Instructions */}
        <Card style={cardStyle}>
          <CardHeader>
            <CardTitle style={{ color: globalColors.text.primary }}>
              Installation Instructions
            </CardTitle>
            <CardDescription style={{ color: globalColors.text.muted }}>
              How to install and configure the Kitchen Display desktop app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3" style={{ color: globalColors.text.secondary }}>
              <div className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                    color: '#FFFFFF'
                  }}
                >
                  1
                </div>
                <div>
                  <div className="font-medium">Download the installer</div>
                  <div className="text-sm" style={{ color: globalColors.text.muted }}>
                    Click the download button above to get the appropriate installer for your operating system.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                    color: '#FFFFFF'
                  }}
                >
                  2
                </div>
                <div>
                  <div className="font-medium">Run the installer</div>
                  <div className="text-sm" style={{ color: globalColors.text.muted }}>
                    Double-click the downloaded file and follow the installation wizard.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                    color: '#FFFFFF'
                  }}
                >
                  3
                </div>
                <div>
                  <div className="font-medium">Set up PIN lock</div>
                  <div className="text-sm" style={{ color: globalColors.text.muted }}>
                    On first launch, configure your 4-digit PIN for kitchen staff access control.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                    color: '#FFFFFF'
                  }}
                >
                  4
                </div>
                <div>
                  <div className="font-medium">Configure auto-start (optional)</div>
                  <div className="text-sm" style={{ color: globalColors.text.muted }}>
                    Set the app to launch automatically when the kitchen display device boots up.
                  </div>
                </div>
              </div>
            </div>

            <Separator style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

            <Alert style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <AlertDescription style={{ color: '#60A5FA' }}>
                <strong>💡 Tip:</strong> For best results, use a dedicated display with 1920x1080 resolution in fullscreen mode.
                Press F11 to toggle fullscreen in the desktop app.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Support & Help */}
        <Card style={cardStyle}>
          <CardHeader>
            <CardTitle style={{ color: globalColors.text.primary }}>
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2" style={{ color: globalColors.text.secondary }}>
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4" style={{ color: '#EF4444' }} />
                <span>View source code and report issues on GitHub</span>
              </div>
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4" style={{ color: '#EF4444' }} />
                <span>Contact your system administrator for PIN reset</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
