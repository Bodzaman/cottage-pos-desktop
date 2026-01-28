import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Rocket,
  GitBranch,
  GitMerge,
  Package,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  RefreshCw,
  Loader2,
  Circle,
  Zap,
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

interface BranchInfo {
  name: string;
  sha: string;
  protected: boolean;
}

type PipelineStep = 'idle' | 'merging' | 'syncing' | 'releasing' | 'building' | 'complete' | 'error';

interface PipelineState {
  step: PipelineStep;
  mergeSha?: string;
  mergeUrl?: string;
  syncUrl?: string;
  syncSkipped?: boolean;
  releaseUrl?: string;
  buildUrl?: string;
  error?: string;
}

const LOCAL_VERSION = '1.0.0';

export default function UpdatePOSDesktop() {
  const navigate = useNavigate();
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Release state
  const [latestRelease, setLatestRelease] = useState<GitHubRelease | null>(null);
  const [isLoadingRelease, setIsLoadingRelease] = useState(true);

  // Pipeline state
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [versionBump, setVersionBump] = useState<'patch' | 'minor' | 'major'>('patch');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [pipeline, setPipeline] = useState<PipelineState>({ step: 'idle' });

  // Manual release state (kept for advanced use)
  const [manualReleaseNotes, setManualReleaseNotes] = useState('');
  const [isManualReleasing, setIsManualReleasing] = useState(false);

  useEffect(() => {
    loadLatestRelease();
    loadBranches();
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  const loadLatestRelease = async () => {
    setIsLoadingRelease(true);
    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`
      );
      if (response.ok) {
        setLatestRelease(await response.json());
      } else if (response.status === 404) {
        setLatestRelease(null);
      }
    } catch (error) {
      console.error('Failed to load latest release:', error);
    } finally {
      setIsLoadingRelease(false);
    }
  };

  const loadBranches = async () => {
    setIsLoadingBranches(true);
    try {
      const response = await fetch('/routes/list-branches');
      const data = await response.json();
      if (data.success) {
        setBranches(data.branches);
        // Default to first non-main, non-protected branch
        const defaultBranch = data.branches.find((b: BranchInfo) => b.name !== 'main' && !b.protected);
        if (defaultBranch) setSelectedBranch(defaultBranch.name);
      } else {
        console.error('Branch load failed:', data.error);
        toast.error(data.error || 'Failed to load branches');
      }
    } catch (error) {
      console.error('Failed to load branches:', error);
      toast.error('Failed to load branches');
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const getNextVersion = (): string => {
    const currentVersion = latestRelease?.tag_name?.replace('v', '') || LOCAL_VERSION;
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    switch (versionBump) {
      case 'major': return `${major + 1}.0.0`;
      case 'minor': return `${major}.${minor + 1}.0`;
      case 'patch':
      default: return `${major}.${minor}.${patch + 1}`;
    }
  };

  const getInstallerUrl = (): string | null => {
    if (!latestRelease?.assets) return null;
    const installer = latestRelease.assets.find(a => a.name.endsWith('.exe'));
    return installer?.browser_download_url || null;
  };

  // --- Pipeline Execution ---
  const executePipeline = async () => {
    if (!selectedBranch || !releaseNotes.trim()) return;

    // Step 1: Merge
    setPipeline({ step: 'merging' });
    try {
      const mergeResponse = await fetch('/routes/deploy-pos-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_name: selectedBranch,
          version_increment: versionBump,
          release_notes: releaseNotes.trim()
        })
      });
      const mergeData = await mergeResponse.json();

      if (!mergeData.success) {
        setPipeline({ step: 'error', error: mergeData.error || mergeData.message });
        toast.error(mergeData.error || 'Merge failed');
        return;
      }

      const mergeSha = mergeData.merge_sha;
      const mergeUrl = mergeData.merge_url;
      setPipeline({ step: 'syncing', mergeSha, mergeUrl });
      toast.success('Branch merged to main');

      // Step 2: Poll sync status
      const syncResult = await pollSyncStatus(mergeSha);

      if (!syncResult.success && !syncResult.skipped) {
        setPipeline(prev => ({
          ...prev,
          step: 'error',
          error: syncResult.message || 'Sync workflow failed',
          syncUrl: syncResult.workflow_url
        }));
        toast.error('Sync workflow failed');
        return;
      }

      setPipeline(prev => ({
        ...prev,
        step: 'releasing',
        syncSkipped: syncResult.skipped,
        syncUrl: syncResult.workflow_url
      }));

      if (syncResult.skipped) {
        toast.info('No frontend changes to sync — proceeding to release');
      } else {
        toast.success('Frontend synced to POS Desktop repo');
      }

      // Step 3: Create release
      const nextVersion = getNextVersion();
      const { data: releaseData, error: releaseError } = await supabase.functions.invoke('release-electron', {
        body: {
          version: nextVersion,
          releaseNotes: releaseNotes.trim()
        }
      });

      if (releaseError || !releaseData?.success) {
        setPipeline(prev => ({
          ...prev,
          step: 'error',
          error: releaseError?.message || releaseData?.error || 'Release creation failed'
        }));
        toast.error('Failed to create release');
        return;
      }

      // Step 4: Complete
      // Edge Function returns: { success, tagName, version, releaseUrl, releaseId }
      const actionsUrl = `https://github.com/Bodzaman/cottage-pos-desktop/actions`;
      setPipeline(prev => ({
        ...prev,
        step: 'complete',
        releaseUrl: releaseData.releaseUrl || releaseData.release?.html_url,
        buildUrl: actionsUrl
      }));

      toast.success(`Release v${nextVersion} created — build triggered!`);
      setReleaseNotes('');
      setTimeout(loadLatestRelease, 5000);

    } catch (error: any) {
      setPipeline(prev => ({ ...prev, step: 'error', error: error.message }));
      toast.error('Pipeline failed: ' + error.message);
    }
  };

  const pollSyncStatus = async (mergeSha: string): Promise<any> => {
    const maxAttempts = 60;
    // Initial delay to let the workflow trigger
    await new Promise(resolve => setTimeout(resolve, 3000));

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`/routes/pipeline-sync-status?merge_sha=${mergeSha}`);
        const data = await response.json();

        if (data.skipped) {
          return { success: true, skipped: true, message: data.message };
        }

        if (data.status === 'completed') {
          if (data.conclusion === 'success') {
            return { success: true, skipped: false, workflow_url: data.workflow_url };
          } else {
            return { success: false, skipped: false, message: `Workflow ${data.conclusion}`, workflow_url: data.workflow_url };
          }
        }
      } catch {
        // Network error, keep polling
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    return { success: false, skipped: false, message: 'Sync timed out after 5 minutes' };
  };

  const resetPipeline = () => setPipeline({ step: 'idle' });

  // --- Manual Release (kept for advanced use) ---
  const handleManualRelease = async () => {
    if (!manualReleaseNotes.trim()) {
      toast.error('Please add release notes');
      return;
    }
    setIsManualReleasing(true);
    try {
      const nextVersion = getNextVersion();
      const { data, error } = await supabase.functions.invoke('release-electron', {
        body: { version: nextVersion, releaseNotes: manualReleaseNotes.trim() }
      });
      if (error || !data?.success) throw new Error(error?.message || data?.error || 'Failed');
      toast.success(`Release v${nextVersion} created!`);
      setManualReleaseNotes('');
      setTimeout(loadLatestRelease, 3000);
    } catch (error: any) {
      toast.error('Release failed: ' + error.message);
    } finally {
      setIsManualReleasing(false);
    }
  };

  // --- Pipeline Stepper Component ---
  const PipelineStepper = () => {
    const steps = [
      { key: 'merging', label: 'Merge to Main', desc: `Merge ${selectedBranch || 'branch'} into main` },
      { key: 'syncing', label: 'Sync to POS Repo', desc: 'Push frontend code to cottage-pos-desktop' },
      { key: 'releasing', label: 'Create Release', desc: `Publish v${getNextVersion()} on GitHub` },
      { key: 'building', label: 'Build Installer', desc: 'GitHub Actions builds the .exe' },
    ];

    const stepOrder = ['merging', 'syncing', 'releasing', 'building', 'complete'];
    const currentIdx = stepOrder.indexOf(pipeline.step);

    const getStepStatus = (stepKey: string) => {
      const stepIdx = stepOrder.indexOf(stepKey);
      if (pipeline.step === 'error') {
        if (stepIdx < currentIdx) return 'complete';
        if (stepIdx === currentIdx) return 'error';
        return 'pending';
      }
      if (stepIdx < currentIdx) return 'complete';
      if (stepIdx === currentIdx) return 'active';
      return 'pending';
    };

    const getIcon = (status: string) => {
      switch (status) {
        case 'complete': return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
        case 'active': return <Loader2 className="h-5 w-5 animate-spin" style={{ color: colors.brand.purple }} />;
        case 'error': return <AlertCircle className="h-5 w-5 text-red-400" />;
        default: return <Circle className="h-5 w-5" style={{ color: colors.text.secondary }} />;
      }
    };

    return (
      <div className="space-y-3 mt-4">
        {steps.map((step) => {
          const status = getStepStatus(step.key);
          return (
            <div key={step.key} className="flex items-start space-x-3">
              <div className="mt-0.5">{getIcon(status)}</div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{
                  color: status === 'active' ? colors.brand.purple :
                         status === 'complete' ? '#6EE7B7' :
                         status === 'error' ? '#F87171' : colors.text.secondary
                }}>
                  {step.label}
                  {step.key === 'syncing' && pipeline.syncSkipped && (
                    <span className="ml-2 text-xs text-yellow-400">(skipped — no changes)</span>
                  )}
                </p>
                <p className="text-xs" style={{ color: colors.text.secondary }}>{step.desc}</p>
              </div>
            </div>
          );
        })}

        {/* Error message */}
        {pipeline.step === 'error' && pipeline.error && (
          <Alert className="mt-3" style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300 text-sm">{pipeline.error}</AlertDescription>
          </Alert>
        )}

        {/* Completion links */}
        {pipeline.step === 'complete' && (
          <div className="flex flex-wrap gap-2 mt-3">
            {pipeline.releaseUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(pipeline.releaseUrl, '_blank')}
                style={{ borderColor: colors.brand.purple, color: colors.brand.purple }}>
                <ExternalLink className="h-3 w-3 mr-1" /> View Release
              </Button>
            )}
            {pipeline.buildUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(pipeline.buildUrl, '_blank')}
                style={{ borderColor: colors.brand.turquoise, color: colors.brand.turquoise }}>
                <ExternalLink className="h-3 w-3 mr-1" /> View Build
              </Button>
            )}
          </div>
        )}

        {/* Reset button for error/complete states */}
        {(pipeline.step === 'error' || pipeline.step === 'complete') && (
          <Button variant="ghost" size="sm" onClick={resetPipeline} className="mt-2"
            style={{ color: colors.text.secondary }}>
            <RefreshCw className="h-3 w-3 mr-1" /> Reset Pipeline
          </Button>
        )}
      </div>
    );
  };

  const isPipelineActive = pipeline.step !== 'idle' && pipeline.step !== 'error' && pipeline.step !== 'complete';

  return (
    <div className="min-h-screen p-6" style={{ background: colors.background.primary, color: colors.text.primary }}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: colors.brand.purple + '20' }}>
              <Package className="h-6 w-6" style={{ color: colors.brand.purple }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                POS Desktop Deployment
              </h1>
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                Merge, sync, and release the Electron POS app
              </p>
            </div>
          </div>
        </div>

        {/* ============ FULL PIPELINE DEPLOY CARD ============ */}
        <Card style={{
          ...cardStyle,
          border: `1px solid ${colors.brand.purple}40`,
          boxShadow: `0 0 20px ${colors.brand.purple}10`
        }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" style={{ color: colors.brand.purple }} />
              <span>Deploy Full Pipeline</span>
              {latestRelease && (
                <Badge variant="outline" className="ml-auto text-xs"
                  style={{ borderColor: colors.brand.purple, color: colors.brand.purple }}>
                  Next: v{getNextVersion()}
                </Badge>
              )}
            </CardTitle>
            <CardDescription style={{ color: colors.text.secondary }}>
              One click: merge branch to main, sync frontend to POS repo, create release, and trigger build
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Branch + Version row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Branch Selector */}
              <div className="space-y-2">
                <Label style={{ color: colors.text.secondary }}>Branch to Deploy</Label>
                {isLoadingBranches ? (
                  <Skeleton className="h-10 w-full" style={{ backgroundColor: colors.background.tertiary }} />
                ) : (
                  <Select value={selectedBranch} onValueChange={setSelectedBranch} disabled={isPipelineActive}>
                    <SelectTrigger style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.light, color: colors.text.primary }}>
                      <SelectValue placeholder="Select branch..." />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}>
                      {branches.filter(b => b.name !== 'main').map(branch => (
                        <SelectItem key={branch.name} value={branch.name} style={{ color: colors.text.primary }}>
                          <div className="flex items-center space-x-2">
                            <GitBranch className="h-3 w-3" style={{ color: colors.text.secondary }} />
                            <span>{branch.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Version Bump */}
              <div className="space-y-2">
                <Label style={{ color: colors.text.secondary }}>Version Bump</Label>
                <div className="grid grid-cols-3 gap-1">
                  {(['patch', 'minor', 'major'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setVersionBump(type)}
                      disabled={isPipelineActive}
                      className={`p-2 rounded-lg border transition-all text-center ${
                        versionBump === type ? 'border-purple-500' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: versionBump === type ? colors.brand.purple + '15' : colors.background.tertiary }}
                    >
                      <p className="text-xs font-medium capitalize" style={{ color: versionBump === type ? colors.brand.purple : colors.text.primary }}>
                        {type}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Release Notes */}
            <div className="space-y-2">
              <Label style={{ color: colors.text.secondary }}>Release Notes *</Label>
              <Textarea
                placeholder="Describe what's new in this release..."
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                rows={3}
                disabled={isPipelineActive}
                style={{
                  backgroundColor: colors.background.tertiary,
                  borderColor: colors.border.light,
                  color: colors.text.primary
                }}
              />
            </div>

            {/* Deploy Button with Confirmation */}
            {pipeline.step === 'idle' ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full h-12 text-base font-semibold"
                    disabled={!selectedBranch || !releaseNotes.trim()}
                    style={{ backgroundColor: colors.brand.purple, color: 'white' }}
                  >
                    <Rocket className="h-5 w-5 mr-2" />
                    Deploy v{getNextVersion()} from {selectedBranch || '...'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}>
                  <AlertDialogHeader>
                    <AlertDialogTitle style={{ color: colors.text.primary }}>
                      Confirm Full Pipeline Deploy
                    </AlertDialogTitle>
                    <AlertDialogDescription style={{ color: colors.text.secondary }}>
                      This will:
                      <ul className="list-disc ml-4 mt-2 space-y-1">
                        <li>Merge <strong style={{ color: colors.text.primary }}>{selectedBranch}</strong> into <strong style={{ color: colors.text.primary }}>main</strong></li>
                        <li>Sync frontend code to the POS Desktop repo</li>
                        <li>Create release <strong style={{ color: colors.brand.purple }}>v{getNextVersion()}</strong></li>
                        <li>Trigger Windows installer build</li>
                      </ul>
                      <p className="mt-3 text-xs">This action cannot be undone. The merge is permanent.</p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel style={{ color: colors.text.secondary, borderColor: colors.border.light }}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={executePipeline}
                      style={{ backgroundColor: colors.brand.purple, color: 'white' }}>
                      <Rocket className="h-4 w-4 mr-2" />
                      Deploy v{getNextVersion()}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <div className="w-full h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colors.background.tertiary }}>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" style={{ color: colors.brand.purple }} />
                <span className="text-sm" style={{ color: colors.text.secondary }}>Pipeline in progress...</span>
              </div>
            )}

            {/* Pipeline Stepper (visible when active) */}
            {pipeline.step !== 'idle' && <PipelineStepper />}
          </CardContent>
        </Card>

        {/* ============ EXISTING TWO-COLUMN GRID ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Current Release Card */}
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
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Latest
                    </Badge>
                  </div>
                  <p className="text-xs" style={{ color: colors.text.secondary }}>
                    Published: {new Date(latestRelease.published_at).toLocaleDateString()}
                  </p>
                  {getInstallerUrl() ? (
                    <Button onClick={() => window.open(getInstallerUrl()!, '_blank')} className="w-full"
                      style={{ backgroundColor: colors.brand.purple, color: 'white' }}>
                      <Download className="h-4 w-4 mr-2" /> Download Installer
                    </Button>
                  ) : (
                    <Alert style={{ backgroundColor: colors.background.tertiary }}>
                      <Clock className="h-4 w-4" />
                      <AlertDescription style={{ color: colors.text.secondary }}>
                        Installer is being built. Check back shortly.
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button variant="outline" size="sm" onClick={() => window.open(latestRelease.html_url, '_blank')}
                    className="w-full" style={{ borderColor: colors.border.light, color: colors.text.secondary }}>
                    <ExternalLink className="h-4 w-4 mr-2" /> View on GitHub
                  </Button>
                </>
              ) : (
                <div className="text-center py-6">
                  <Package className="h-12 w-12 mx-auto mb-3" style={{ color: colors.text.secondary }} />
                  <p style={{ color: colors.text.secondary }}>No releases yet</p>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={loadLatestRelease} disabled={isLoadingRelease}
                className="w-full" style={{ color: colors.text.secondary }}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingRelease ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </CardContent>
          </Card>

          {/* Manual Release Card (for advanced use) */}
          <Card style={cardStyle}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Rocket className="h-5 w-5" style={{ color: colors.text.secondary }} />
                <span>Manual Release</span>
              </CardTitle>
              <CardDescription style={{ color: colors.text.secondary }}>
                Create a release without merging (code already synced)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label style={{ color: colors.text.secondary }}>Release Notes *</Label>
                <Textarea
                  placeholder="Describe what's new..."
                  value={manualReleaseNotes}
                  onChange={(e) => setManualReleaseNotes(e.target.value)}
                  rows={3}
                  style={{
                    backgroundColor: colors.background.tertiary,
                    borderColor: colors.border.light,
                    color: colors.text.primary
                  }}
                />
              </div>
              <Button onClick={handleManualRelease} disabled={isManualReleasing || !manualReleaseNotes.trim()}
                className="w-full" variant="outline"
                style={{ borderColor: colors.brand.purple, color: colors.brand.purple }}>
                {isManualReleasing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                ) : (
                  <><Rocket className="h-4 w-4 mr-2" /> Release v{getNextVersion()}</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card style={cardStyle}>
          <CardHeader>
            <CardTitle style={{ color: colors.text.primary }}>How the Pipeline Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                { icon: <GitBranch className="h-5 w-5" />, title: 'Select Branch', desc: 'Choose your working branch' },
                { icon: <GitMerge className="h-5 w-5" />, title: 'Merge to Main', desc: 'Merge into main branch' },
                { icon: <RefreshCw className="h-5 w-5" />, title: 'Auto Sync', desc: 'Frontend syncs to POS repo' },
                { icon: <Rocket className="h-5 w-5" />, title: 'Release', desc: 'GitHub Release created' },
                { icon: <Download className="h-5 w-5" />, title: 'Auto Update', desc: 'POS desktops get the update' },
              ].map((step, i) => (
                <div key={i} className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
                  <div className="flex justify-center mb-2" style={{ color: colors.brand.purple }}>{step.icon}</div>
                  <p className="text-xs font-medium" style={{ color: colors.text.primary }}>{step.title}</p>
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
