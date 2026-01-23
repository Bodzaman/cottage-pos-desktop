import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Rocket,
  GitBranch,
  Package,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { colors, cardStyle } from '../utils/designSystem';
import { supabase } from '../utils/supabaseClient';

// GitHub repository info
const GITHUB_OWNER = 'Bodzaman';
const GITHUB_REPO = 'cottage-pos-desktop';

interface GitHubRelease {
  tag_name: string;
  name: string;
  html_url: string;
  published_at: string;
  body: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
    size: number;
  }>;
}

interface ReleaseStatus {
  step: 'idle' | 'releasing' | 'building' | 'complete' | 'error';
  message: string;
  releaseUrl?: string;
  workflowUrl?: string;
}

// Local version from package.json (hardcoded for now, could be dynamic)
const LOCAL_VERSION = '1.0.0';

export default function UpdatePOSDesktop() {
  const navigate = useNavigate();

  // State
  const [latestRelease, setLatestRelease] = useState<GitHubRelease | null>(null);
  const [isLoadingRelease, setIsLoadingRelease] = useState(true);
  const [versionBump, setVersionBump] = useState<'patch' | 'minor' | 'major'>('patch');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [releaseStatus, setReleaseStatus] = useState<ReleaseStatus>({ step: 'idle', message: '' });
  const [isReleasing, setIsReleasing] = useState(false);

  // Load latest release on mount
  useEffect(() => {
    loadLatestRelease();
  }, []);

  const loadLatestRelease = async () => {
    setIsLoadingRelease(true);
    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`
      );

      if (response.ok) {
        const data = await response.json();
        setLatestRelease(data);
      } else if (response.status === 404) {
        // No releases yet
        setLatestRelease(null);
      } else {
        throw new Error('Failed to fetch release');
      }
    } catch (error) {
      console.error('Failed to load latest release:', error);
      toast.error('Failed to load release information');
    } finally {
      setIsLoadingRelease(false);
    }
  };

  // Calculate next version based on current and bump type
  const getNextVersion = (): string => {
    const currentVersion = latestRelease?.tag_name?.replace('v', '') || LOCAL_VERSION;
    const [major, minor, patch] = currentVersion.split('.').map(Number);

    switch (versionBump) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
      default:
        return `${major}.${minor}.${patch + 1}`;
    }
  };

  // Handle release creation
  const handleCreateRelease = async () => {
    if (!releaseNotes.trim()) {
      toast.error('Please add release notes');
      return;
    }

    setIsReleasing(true);
    setReleaseStatus({ step: 'releasing', message: 'Creating GitHub release...' });

    try {
      const nextVersion = getNextVersion();

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('release-electron', {
        body: {
          version: nextVersion,
          releaseNotes: releaseNotes.trim()
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to create release');
      }

      if (!data.success) {
        throw new Error(data.error || 'Release creation failed');
      }

      // Success!
      setReleaseStatus({
        step: 'building',
        message: 'Release created! GitHub Actions is building the installer...',
        releaseUrl: data.release?.url,
        workflowUrl: data.workflowRunUrl
      });

      toast.success(`Release v${nextVersion} created successfully!`);

      // Reset form
      setReleaseNotes('');

      // Reload release info after a delay
      setTimeout(() => {
        loadLatestRelease();
        setReleaseStatus({
          step: 'complete',
          message: 'Release created and build triggered!',
          releaseUrl: data.release?.url,
          workflowUrl: data.workflowRunUrl
        });
      }, 3000);

    } catch (error: any) {
      console.error('Release failed:', error);
      setReleaseStatus({
        step: 'error',
        message: error.message || 'Failed to create release'
      });
      toast.error('Failed to create release: ' + (error.message || 'Unknown error'));
    } finally {
      setIsReleasing(false);
    }
  };

  // Get installer download URL from release assets
  const getInstallerUrl = (): string | null => {
    if (!latestRelease?.assets) return null;
    const installer = latestRelease.assets.find(a => a.name.endsWith('.exe'));
    return installer?.browser_download_url || null;
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: colors.background.primary,
        color: colors.text.primary
      }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: colors.brand.purple + '20' }}>
              <Package className="h-6 w-6" style={{ color: colors.brand.purple }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                Update POS Desktop
              </h1>
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                Create new releases for the Windows Electron app
              </p>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Current Status Card */}
          <Card style={cardStyle}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GitBranch className="h-5 w-5" style={{ color: colors.brand.purple }} />
                <span>Current Release</span>
              </CardTitle>
              <CardDescription style={{ color: colors.text.secondary }}>
                Latest published version on GitHub
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingRelease ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" style={{ backgroundColor: colors.background.tertiary }} />
                  <Skeleton className="h-10 w-full" style={{ backgroundColor: colors.background.tertiary }} />
                </div>
              ) : latestRelease ? (
                <>
                  <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
                    <div>
                      <p className="text-sm" style={{ color: colors.text.secondary }}>Version</p>
                      <p className="text-2xl font-bold" style={{ color: colors.brand.purple }}>
                        {latestRelease.tag_name}
                      </p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Latest
                    </Badge>
                  </div>

                  <p className="text-xs" style={{ color: colors.text.secondary }}>
                    Published: {new Date(latestRelease.published_at).toLocaleDateString()}
                  </p>

                  {getInstallerUrl() ? (
                    <Button
                      onClick={() => window.open(getInstallerUrl()!, '_blank')}
                      className="w-full"
                      style={{ backgroundColor: colors.brand.purple, color: 'white' }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Installer
                    </Button>
                  ) : (
                    <Alert style={{ backgroundColor: colors.background.tertiary }}>
                      <Clock className="h-4 w-4" />
                      <AlertDescription style={{ color: colors.text.secondary }}>
                        Installer is being built. Check back in a few minutes.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(latestRelease.html_url, '_blank')}
                    className="w-full"
                    style={{ borderColor: colors.border.light, color: colors.text.secondary }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on GitHub
                  </Button>
                </>
              ) : (
                <div className="text-center py-6">
                  <Package className="h-12 w-12 mx-auto mb-3" style={{ color: colors.text.secondary }} />
                  <p style={{ color: colors.text.secondary }}>No releases yet</p>
                  <p className="text-sm mt-2" style={{ color: colors.text.secondary }}>
                    Create your first release below
                  </p>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={loadLatestRelease}
                disabled={isLoadingRelease}
                className="w-full"
                style={{ color: colors.text.secondary }}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingRelease ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardContent>
          </Card>

          {/* Create Release Card */}
          <Card style={cardStyle}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Rocket className="h-5 w-5" style={{ color: colors.brand.purple }} />
                <span>Create New Release</span>
              </CardTitle>
              <CardDescription style={{ color: colors.text.secondary }}>
                Publish a new version to GitHub and trigger the build
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Version Bump Selection */}
              <div className="space-y-2">
                <Label style={{ color: colors.text.secondary }}>Version Bump</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['patch', 'minor', 'major'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setVersionBump(type)}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        versionBump === type
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-transparent hover:border-purple-500/50'
                      }`}
                      style={{ backgroundColor: versionBump === type ? colors.brand.purple + '15' : colors.background.tertiary }}
                    >
                      <p className="font-medium capitalize" style={{ color: versionBump === type ? colors.brand.purple : colors.text.primary }}>
                        {type}
                      </p>
                      <p className="text-xs mt-1" style={{ color: colors.text.secondary }}>
                        {type === 'patch' && 'Bug fixes'}
                        {type === 'minor' && 'New features'}
                        {type === 'major' && 'Breaking changes'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Next Version Preview */}
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
                <span style={{ color: colors.text.secondary }}>Next version:</span>
                <Badge variant="outline" style={{ borderColor: colors.brand.purple, color: colors.brand.purple }}>
                  v{getNextVersion()}
                </Badge>
              </div>

              <Separator style={{ backgroundColor: colors.border.light }} />

              {/* Release Notes */}
              <div className="space-y-2">
                <Label style={{ color: colors.text.secondary }}>Release Notes *</Label>
                <Textarea
                  placeholder="Describe what's new in this release..."
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  rows={4}
                  style={{
                    backgroundColor: colors.background.tertiary,
                    borderColor: colors.border.light,
                    color: colors.text.primary
                  }}
                />
              </div>

              {/* Create Release Button */}
              <Button
                onClick={handleCreateRelease}
                disabled={isReleasing || !releaseNotes.trim()}
                className="w-full"
                style={{ backgroundColor: colors.brand.purple, color: 'white' }}
              >
                {isReleasing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Creating Release...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Create Release v{getNextVersion()}
                  </>
                )}
              </Button>

              {/* Status Display */}
              {releaseStatus.step !== 'idle' && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
                  <div className="flex items-center space-x-2">
                    {releaseStatus.step === 'complete' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : releaseStatus.step === 'error' ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-blue-500 animate-spin" />
                    )}
                    <span className={
                      releaseStatus.step === 'complete' ? 'text-green-500' :
                      releaseStatus.step === 'error' ? 'text-red-500' : 'text-blue-500'
                    }>
                      {releaseStatus.message}
                    </span>
                  </div>

                  {releaseStatus.releaseUrl && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => window.open(releaseStatus.releaseUrl, '_blank')}
                      className="mt-2 p-0"
                      style={{ color: colors.brand.purple }}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Release
                    </Button>
                  )}

                  {releaseStatus.workflowUrl && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => window.open(releaseStatus.workflowUrl, '_blank')}
                      className="mt-2 ml-4 p-0"
                      style={{ color: colors.brand.turquoise }}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Build
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* How It Works Card */}
        <Card style={cardStyle}>
          <CardHeader>
            <CardTitle style={{ color: colors.text.primary }}>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { icon: '1️⃣', title: 'Create Release', desc: 'Choose version bump and add notes' },
                { icon: '2️⃣', title: 'GitHub Release', desc: 'Creates tag and release on GitHub' },
                { icon: '3️⃣', title: 'Auto Build', desc: 'GitHub Actions builds Windows installer' },
                { icon: '4️⃣', title: 'Auto Update', desc: 'Desktop apps detect and install update' },
              ].map((step, i) => (
                <div key={i} className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
                  <div className="text-2xl mb-2">{step.icon}</div>
                  <p className="font-medium" style={{ color: colors.text.primary }}>{step.title}</p>
                  <p className="text-xs mt-1" style={{ color: colors.text.secondary }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
