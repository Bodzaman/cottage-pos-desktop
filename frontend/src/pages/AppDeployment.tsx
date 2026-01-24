import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Rocket, GitBranch, Package, CheckCircle2, Download,
  ExternalLink, RefreshCw, Loader2, Layers, Monitor, Globe, Server,
} from 'lucide-react';
import { colors, cardStyle } from '../utils/designSystem';
import { supabase } from '../utils/supabaseClient';
import DeploymentStatusCard from '../components/deployment/DeploymentStatusCard';
import DeployPipelineStepper, {
  FlowType, PipelineStepInfo, PipelineError, StepStatus
} from '../components/deployment/DeployPipelineStepper';

interface BranchInfo {
  name: string;
  sha: string;
  protected: boolean;
  last_commit_date?: string;
  last_commit_message?: string;
}

interface DeploymentTarget {
  status: 'online' | 'offline' | 'loading';
  details?: string;
  version?: string;
  url?: string;
  latency_ms?: number;
}

interface DeploymentStatus {
  website: DeploymentTarget;
  backend: DeploymentTarget;
  desktop: DeploymentTarget;
}

type PipelinePhase = 'idle' | 'running' | 'complete' | 'error';

const FLOW_STEPS: Record<FlowType, { key: string; label: string; description: string }[]> = {
  everything: [
    { key: 'merge', label: 'Prepare Changes', description: 'Merge your working version into main' },
    { key: 'website', label: 'Update Website', description: 'Deploy to Vercel' },
    { key: 'backend', label: 'Update Kitchen System', description: 'Deploy to Cloud Run' },
    { key: 'sync', label: 'Sync Till Software', description: 'Push code to POS Desktop repo' },
    { key: 'release', label: 'Package Till Update', description: 'Create a new version on GitHub' },
    { key: 'build', label: 'Build Installer', description: 'Build the Windows installer' },
  ],
  till: [
    { key: 'merge', label: 'Prepare Changes', description: 'Merge your working version into main' },
    { key: 'sync', label: 'Sync Till Software', description: 'Push code to POS Desktop repo' },
    { key: 'release', label: 'Package Till Update', description: 'Create a new version on GitHub' },
    { key: 'build', label: 'Build Installer', description: 'Build the Windows installer' },
  ],
  'app-only': [
    { key: 'merge', label: 'Prepare Changes', description: 'Merge your working version into main' },
    { key: 'website', label: 'Update Website', description: 'Deploy to Vercel' },
    { key: 'backend', label: 'Update Kitchen System', description: 'Deploy to Cloud Run' },
  ],
};

const VERSION_LABELS = {
  patch: 'Small fix',
  minor: 'New feature',
  major: 'Big update',
};

export default function AppDeployment() {
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<number>(0);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Status state
  const [deployStatus, setDeployStatus] = useState<DeploymentStatus>({
    website: { status: 'loading' },
    backend: { status: 'loading' },
    desktop: { status: 'loading' },
  });

  // Branch state
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  // Deploy config
  const [versionBump, setVersionBump] = useState<'patch' | 'minor' | 'major'>('patch');
  const [releaseNotes, setReleaseNotes] = useState('');

  // Pipeline state
  const [activeFlow, setActiveFlow] = useState<FlowType | null>(null);
  const [pipelinePhase, setPipelinePhase] = useState<PipelinePhase>('idle');
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStepInfo[]>([]);
  const [pipelineError, setPipelineError] = useState<PipelineError | null>(null);
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  const [completionLinks, setCompletionLinks] = useState<{ label: string; url: string; color: string }[]>([]);

  // Latest release (for version calculation)
  const [latestVersion, setLatestVersion] = useState<string>('1.0.0');

  useEffect(() => {
    loadDeploymentStatus();
    loadBranches();
    loadLatestRelease();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, []);

  const loadDeploymentStatus = async () => {
    try {
      const response = await fetch('/routes/deployment-status');
      const data = await response.json();
      if (data.success) {
        setDeployStatus({
          website: {
            status: data.targets.website?.is_live ? 'online' : 'offline',
            details: data.targets.website?.url,
            latency_ms: data.targets.website?.latency_ms,
          },
          backend: {
            status: data.targets.backend?.is_live ? 'online' : 'offline',
            details: data.targets.backend?.region || 'europe-west2',
          },
          desktop: {
            status: data.targets.desktop?.latest_version ? 'online' : 'offline',
            version: data.targets.desktop?.latest_version,
            url: data.targets.desktop?.download_url,
          },
        });
      }
    } catch {
      // Keep loading state or set offline
    }
  };

  const loadBranches = async () => {
    setIsLoadingBranches(true);
    try {
      const response = await fetch('/routes/list-branches');
      const data = await response.json();
      if (data.success) {
        // Sort by last_commit_date descending, exclude main
        const sorted = (data.branches as BranchInfo[])
          .filter(b => b.name !== 'main' && !b.protected)
          .sort((a, b) => {
            if (!a.last_commit_date) return 1;
            if (!b.last_commit_date) return -1;
            return new Date(b.last_commit_date).getTime() - new Date(a.last_commit_date).getTime();
          });
        setBranches(sorted);
        if (sorted.length > 0) setSelectedBranch(sorted[0].name);
      }
    } catch {
      toast.error('Failed to load branches');
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const loadLatestRelease = async () => {
    try {
      const response = await fetch(
        'https://api.github.com/repos/Bodzaman/cottage-pos-desktop/releases/latest'
      );
      if (response.ok) {
        const data = await response.json();
        const version = data.tag_name?.replace('v', '') || '1.0.0';
        setLatestVersion(version);
      }
    } catch {
      // Use default
    }
  };

  const getNextVersion = (): string => {
    const [major, minor, patch] = latestVersion.split('.').map(Number);
    switch (versionBump) {
      case 'major': return `${major + 1}.0.0`;
      case 'minor': return `${major}.${minor + 1}.0`;
      case 'patch':
      default: return `${major}.${minor}.${patch + 1}`;
    }
  };

  // --- Pipeline Execution ---
  const initSteps = (flow: FlowType): PipelineStepInfo[] => {
    return FLOW_STEPS[flow].map(s => ({
      ...s,
      status: 'pending' as StepStatus,
    }));
  };

  const updateStep = (stepKey: string, updates: Partial<PipelineStepInfo>) => {
    setPipelineSteps(prev => prev.map(s => s.key === stepKey ? { ...s, ...updates } : s));
  };

  const startElapsedTimer = () => {
    elapsedRef.current = 0;
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    elapsedTimerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setPipelineSteps(prev => prev.map(s =>
        s.status === 'active' ? { ...s, elapsedSeconds: elapsedRef.current } : s
      ));
    }, 1000);
  };

  const stopElapsedTimer = () => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  };

  const executePipeline = async (flow: FlowType) => {
    if (!selectedBranch || !releaseNotes.trim()) {
      toast.error('Please select a branch and add release notes');
      return;
    }

    setActiveFlow(flow);
    setPipelinePhase('running');
    setPipelineError(null);
    setCompletionLinks([]);
    const steps = initSteps(flow);
    setPipelineSteps(steps);

    try {
      // Step 1: Merge
      updateStep('merge', { status: 'active' });
      startElapsedTimer();

      const mergeResponse = await fetch('/routes/deploy-pos-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_name: selectedBranch,
          version_increment: versionBump,
          release_notes: releaseNotes.trim(),
        }),
      });
      const mergeData = await mergeResponse.json();

      if (!mergeData.success) {
        throw new Error(mergeData.error || mergeData.message || 'Merge failed');
      }

      stopElapsedTimer();
      updateStep('merge', { status: 'complete' });
      toast.success('Changes prepared successfully');

      const mergeSha = mergeData.merge_sha;
      const links: { label: string; url: string; color: string }[] = [];
      if (mergeData.merge_url) links.push({ label: 'View Merge', url: mergeData.merge_url, color: colors.brand.purple });

      // For flows that include website/backend, those deploy automatically on push to main
      // We just note them as in-progress
      if (flow === 'everything' || flow === 'app-only') {
        updateStep('website', { status: 'active', currentSubStep: 'Vercel auto-deploys on push to main...' });
        updateStep('backend', { status: 'active', currentSubStep: 'Cloud Run auto-deploys on push to main...' });

        // Give them a moment then mark complete (auto-deploy triggered by merge)
        await new Promise(r => setTimeout(r, 3000));
        updateStep('website', { status: 'complete' });
        updateStep('backend', { status: 'complete' });
        toast.success('Website and Kitchen System deploys triggered');
      }

      // For flows that include sync
      if (flow === 'everything' || flow === 'till') {
        updateStep('sync', { status: 'active' });
        startElapsedTimer();

        const syncResult = await pollSyncStatus(mergeSha);

        stopElapsedTimer();
        if (!syncResult.success && !syncResult.skipped) {
          updateStep('sync', { status: 'error' });
          await handleWorkflowError(syncResult.run_id, 'cottage-tandoori-app-', 'Sync Till Software');
          return;
        }

        updateStep('sync', {
          status: syncResult.skipped ? 'skipped' : 'complete',
        });

        if (syncResult.skipped) {
          toast.info('No frontend changes to sync — skipping');
        } else {
          toast.success('Till software synced');
          if (syncResult.workflow_url) links.push({ label: 'View Sync', url: syncResult.workflow_url, color: colors.brand.turquoise });
        }

        // Step: Release
        updateStep('release', { status: 'active' });
        startElapsedTimer();

        const nextVersion = getNextVersion();
        const { data: releaseData, error: releaseError } = await supabase.functions.invoke('release-electron', {
          body: { version: nextVersion, releaseNotes: releaseNotes.trim() },
        });

        stopElapsedTimer();
        if (releaseError || !releaseData?.success) {
          updateStep('release', { status: 'error' });
          setPipelineError({
            failedStep: 'Package Till Update',
            rawError: releaseError?.message || releaseData?.error || 'Release creation failed',
            friendlyExplanation: 'Failed to create a new version package on GitHub.',
            fixGuide: 'Check that the release-electron Edge Function is deployed and the GitHub token is valid.',
          });
          setPipelinePhase('error');
          return;
        }

        updateStep('release', { status: 'complete' });
        toast.success(`Version v${nextVersion} packaged`);

        if (releaseData.release?.html_url) links.push({ label: 'View Release', url: releaseData.release.html_url, color: colors.brand.purple });

        // Step: Build
        updateStep('build', { status: 'active', currentSubStep: 'Build triggered by release...' });
        startElapsedTimer();

        if (releaseData.workflowRunUrl) {
          links.push({ label: 'View Build', url: releaseData.workflowRunUrl, color: colors.brand.turquoise });
          // Try to extract run_id from URL
          const runIdMatch = releaseData.workflowRunUrl.match(/\/runs\/(\d+)/);
          if (runIdMatch) {
            const runId = parseInt(runIdMatch[1]);
            setActiveRunId(runId);
            await pollBuildProgress(runId, 'cottage-pos-desktop');
          } else {
            // Can't poll, just mark as complete after a delay
            await new Promise(r => setTimeout(r, 5000));
          }
        } else {
          await new Promise(r => setTimeout(r, 3000));
        }

        stopElapsedTimer();
        // Check if build errored during polling
        const buildStep = pipelineSteps.find(s => s.key === 'build');
        if (buildStep?.status !== 'error') {
          updateStep('build', { status: 'complete' });
        }
      }

      // If we got here for app-only, we're done after website+backend
      setCompletionLinks(links);
      setPipelinePhase('complete');
      toast.success('Deployment complete!');
      setReleaseNotes('');
      setTimeout(loadDeploymentStatus, 10000);

    } catch (error: any) {
      stopElapsedTimer();
      // Find the active step and mark it as error
      setPipelineSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' as StepStatus } : s));
      setPipelineError({
        failedStep: pipelineSteps.find(s => s.status === 'active')?.label || 'Unknown',
        rawError: error.message,
        friendlyExplanation: 'Something went wrong during the deployment.',
        fixGuide: 'Check the error above and try again.',
      });
      setPipelinePhase('error');
      toast.error('Deployment failed: ' + error.message);
    }
  };

  const pollSyncStatus = async (mergeSha: string): Promise<any> => {
    await new Promise(r => setTimeout(r, 3000));

    for (let i = 0; i < 60; i++) {
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
            return { success: false, skipped: false, message: `Workflow ${data.conclusion}`, workflow_url: data.workflow_url, run_id: data.run_id };
          }
        }

        // Update progress if available
        if (data.run_id) setActiveRunId(data.run_id);
        updateStep('sync', { currentSubStep: data.current_step || 'Waiting for sync...' });
      } catch {
        // Keep polling
      }

      await new Promise(r => setTimeout(r, 5000));
    }

    return { success: false, skipped: false, message: 'Sync timed out after 5 minutes' };
  };

  const pollBuildProgress = async (runId: number, repo: string) => {
    for (let i = 0; i < 120; i++) {
      try {
        const response = await fetch(`/routes/workflow-progress?run_id=${runId}&repo=${repo}`);
        const data = await response.json();

        if (data.success) {
          const progress = data.steps_total > 0
            ? Math.round((data.steps_completed / data.steps_total) * 100)
            : 0;

          updateStep('build', {
            progress,
            currentSubStep: data.current_step_name || 'Building...',
            elapsedSeconds: data.elapsed_seconds,
          });

          if (data.status === 'completed') {
            if (data.conclusion === 'success') {
              updateStep('build', { status: 'complete', progress: 100 });
              return;
            } else {
              updateStep('build', { status: 'error' });
              await handleWorkflowError(runId, repo, 'Build Installer');
              return;
            }
          }
        }
      } catch {
        // Keep polling
      }

      await new Promise(r => setTimeout(r, 10000));
    }
  };

  const handleWorkflowError = async (runId: number | undefined, repo: string, stepName: string) => {
    if (!runId) {
      setPipelineError({
        failedStep: stepName,
        rawError: 'Workflow failed',
        friendlyExplanation: 'The workflow failed but no details are available.',
        fixGuide: 'Check GitHub Actions for more details.',
      });
      setPipelinePhase('error');
      return;
    }

    try {
      const response = await fetch(`/routes/workflow-error?run_id=${runId}&repo=${repo}`);
      const data = await response.json();
      if (data.success) {
        setPipelineError({
          failedStep: data.failed_step || stepName,
          rawError: data.raw_error,
          friendlyExplanation: data.friendly_explanation,
          fixGuide: data.fix_guide,
          logsUrl: data.logs_url,
          isKnownError: data.is_known_error,
        });
      } else {
        setPipelineError({
          failedStep: stepName,
          rawError: data.error || 'Unknown error',
          friendlyExplanation: 'Could not fetch error details.',
        });
      }
    } catch {
      setPipelineError({
        failedStep: stepName,
        rawError: 'Failed to fetch error details',
      });
    }
    setPipelinePhase('error');
  };

  const cancelWorkflow = async () => {
    if (!activeRunId) return;

    const repo = activeFlow === 'till' || activeFlow === 'everything'
      ? 'cottage-pos-desktop'
      : 'cottage-tandoori-app-';

    try {
      const response = await fetch('/routes/cancel-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id: activeRunId, repo }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Workflow cancelled');
        resetPipeline();
      } else {
        toast.error('Failed to cancel: ' + (data.error || 'Unknown error'));
      }
    } catch {
      toast.error('Failed to cancel workflow');
    }
  };

  const resetPipeline = () => {
    stopElapsedTimer();
    if (pollRef.current) clearInterval(pollRef.current);
    setActiveFlow(null);
    setPipelinePhase('idle');
    setPipelineSteps([]);
    setPipelineError(null);
    setActiveRunId(null);
    setCompletionLinks([]);
  };

  const retryPipeline = () => {
    if (activeFlow) {
      resetPipeline();
      // Small delay before retrying
      setTimeout(() => executePipeline(activeFlow!), 500);
    }
  };

  const isPipelineActive = pipelinePhase === 'running';
  const canCancel = isPipelineActive && activeRunId != null;
  // Don't allow cancel during merge step (irreversible)
  const canCancelNow = canCancel && !pipelineSteps.some(s => s.key === 'merge' && s.status === 'active');

  return (
    <div className="min-h-screen p-6" style={{ background: colors.background.primary, color: colors.text.primary }}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: colors.brand.purple + '20' }}>
            <Rocket className="h-6 w-6" style={{ color: colors.brand.purple }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
              App Deployment
            </h1>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              Deploy your apps with one click
            </p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DeploymentStatusCard
            title="Website"
            type="website"
            status={deployStatus.website.status}
            details={deployStatus.website.details}
          />
          <DeploymentStatusCard
            title="Kitchen System"
            type="backend"
            status={deployStatus.backend.status}
            details={deployStatus.backend.details}
          />
          <DeploymentStatusCard
            title="Till Software"
            type="desktop"
            status={deployStatus.desktop.status}
            version={deployStatus.desktop.version}
          />
        </div>

        {/* Deploy Configuration */}
        <Card style={{ ...cardStyle, border: `1px solid ${colors.brand.purple}30` }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2" style={{ color: colors.text.primary }}>
              <Package className="h-5 w-5" style={{ color: colors.brand.purple }} />
              <span>Deploy</span>
              <Badge variant="outline" className="ml-auto text-xs"
                style={{ borderColor: colors.brand.purple + '50', color: colors.brand.purple }}>
                Next: v{getNextVersion()}
              </Badge>
            </CardTitle>
            <CardDescription style={{ color: colors.text.secondary }}>
              Choose what to deploy and we'll handle the rest
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Branch + Version Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Branch Selector */}
              <div className="space-y-2">
                <Label style={{ color: colors.text.secondary }}>Your working version</Label>
                {isLoadingBranches ? (
                  <Skeleton className="h-10 w-full" style={{ backgroundColor: colors.background.tertiary }} />
                ) : (
                  <Select value={selectedBranch} onValueChange={setSelectedBranch} disabled={isPipelineActive}>
                    <SelectTrigger style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.light, color: colors.text.primary }}>
                      <SelectValue placeholder="Select branch..." />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}>
                      {branches.map(branch => (
                        <SelectItem key={branch.name} value={branch.name} style={{ color: colors.text.primary }}>
                          <div className="flex items-center space-x-2">
                            <GitBranch className="h-3 w-3" style={{ color: colors.text.secondary }} />
                            <span>{branch.name}</span>
                            {branch.last_commit_message && (
                              <span className="text-xs truncate max-w-[150px]" style={{ color: colors.text.tertiary }}>
                                — {branch.last_commit_message}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Version Bump */}
              <div className="space-y-2">
                <Label style={{ color: colors.text.secondary }}>What kind of update?</Label>
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
                      <p className="text-xs font-medium" style={{ color: versionBump === type ? colors.brand.purple : colors.text.primary }}>
                        {VERSION_LABELS[type]}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Release Notes */}
            <div className="space-y-2">
              <Label style={{ color: colors.text.secondary }}>What's changed? *</Label>
              <Textarea
                placeholder="Describe what's new in this update..."
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                rows={3}
                disabled={isPipelineActive}
                style={{
                  backgroundColor: colors.background.tertiary,
                  borderColor: colors.border.light,
                  color: colors.text.primary,
                }}
              />
            </div>

            {/* Deploy Buttons */}
            {pipelinePhase === 'idle' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Deploy Everything */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="h-14 flex flex-col items-center justify-center"
                      disabled={!selectedBranch || !releaseNotes.trim()}
                      style={{ backgroundColor: colors.brand.purple, color: 'white' }}
                    >
                      <Layers className="h-4 w-4 mb-0.5" />
                      <span className="text-xs font-semibold">Deploy Everything</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}>
                    <AlertDialogHeader>
                      <AlertDialogTitle style={{ color: colors.text.primary }}>Deploy Everything</AlertDialogTitle>
                      <AlertDialogDescription style={{ color: colors.text.secondary }}>
                        This will update all systems:
                        <ul className="list-disc ml-4 mt-2 space-y-1">
                          <li>Prepare changes (merge <strong style={{ color: colors.text.primary }}>{selectedBranch}</strong> to main)</li>
                          <li>Update the <strong style={{ color: colors.text.primary }}>website</strong> (Vercel)</li>
                          <li>Update the <strong style={{ color: colors.text.primary }}>kitchen system</strong> (Cloud Run)</li>
                          <li>Sync and build <strong style={{ color: colors.text.primary }}>till software</strong> v{getNextVersion()}</li>
                        </ul>
                        <p className="mt-3 text-xs">The merge cannot be undone once started.</p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel style={{ color: colors.text.secondary }}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => executePipeline('everything')}
                        style={{ backgroundColor: colors.brand.purple, color: 'white' }}>
                        <Rocket className="h-4 w-4 mr-2" /> Deploy Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Deploy Till */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="h-14 flex flex-col items-center justify-center"
                      variant="outline"
                      disabled={!selectedBranch || !releaseNotes.trim()}
                      style={{ borderColor: colors.brand.turquoise + '50', color: colors.brand.turquoise }}
                    >
                      <Monitor className="h-4 w-4 mb-0.5" />
                      <span className="text-xs font-semibold">Deploy Till</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}>
                    <AlertDialogHeader>
                      <AlertDialogTitle style={{ color: colors.text.primary }}>Deploy Till Software</AlertDialogTitle>
                      <AlertDialogDescription style={{ color: colors.text.secondary }}>
                        This will update the till (POS Desktop) only:
                        <ul className="list-disc ml-4 mt-2 space-y-1">
                          <li>Prepare changes (merge to main)</li>
                          <li>Sync till software code</li>
                          <li>Package update v{getNextVersion()}</li>
                          <li>Build the Windows installer</li>
                        </ul>
                        <p className="mt-2 text-xs">Website and kitchen system won't be affected.</p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel style={{ color: colors.text.secondary }}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => executePipeline('till')}
                        style={{ backgroundColor: colors.brand.turquoise, color: 'white' }}>
                        <Monitor className="h-4 w-4 mr-2" /> Deploy Till
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Deploy App Only */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="h-14 flex flex-col items-center justify-center"
                      variant="outline"
                      disabled={!selectedBranch || !releaseNotes.trim()}
                      style={{ borderColor: colors.brand.blue + '50', color: colors.brand.blue }}
                    >
                      <Globe className="h-4 w-4 mb-0.5" />
                      <span className="text-xs font-semibold">Deploy App Only</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}>
                    <AlertDialogHeader>
                      <AlertDialogTitle style={{ color: colors.text.primary }}>Deploy App Only</AlertDialogTitle>
                      <AlertDialogDescription style={{ color: colors.text.secondary }}>
                        This will update the website and kitchen system only:
                        <ul className="list-disc ml-4 mt-2 space-y-1">
                          <li>Prepare changes (merge to main)</li>
                          <li>Update the website (Vercel auto-deploy)</li>
                          <li>Update the kitchen system (Cloud Run auto-deploy)</li>
                        </ul>
                        <p className="mt-2 text-xs">Till software won't be affected.</p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel style={{ color: colors.text.secondary }}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => executePipeline('app-only')}
                        style={{ backgroundColor: colors.brand.blue, color: 'white' }}>
                        <Globe className="h-4 w-4 mr-2" /> Deploy App
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {/* Active Pipeline Stepper */}
            {pipelinePhase !== 'idle' && (
              <DeployPipelineStepper
                steps={pipelineSteps}
                error={pipelineError}
                onCancel={canCancelNow ? cancelWorkflow : undefined}
                onRetry={pipelinePhase === 'error' ? retryPipeline : undefined}
                onReset={resetPipeline}
                canCancel={canCancelNow}
                isComplete={pipelinePhase === 'complete'}
                completionLinks={completionLinks}
              />
            )}
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card style={cardStyle}>
          <CardHeader>
            <CardTitle className="text-base" style={{ color: colors.text.primary }}>How it works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: <GitBranch className="h-5 w-5" />, title: 'Choose version', desc: 'Pick your working branch' },
                { icon: <Package className="h-5 w-5" />, title: 'Prepare', desc: 'Changes get merged' },
                { icon: <Rocket className="h-5 w-5" />, title: 'Deploy', desc: 'Systems get updated' },
                { icon: <Download className="h-5 w-5" />, title: 'Done', desc: 'Apps auto-update' },
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
