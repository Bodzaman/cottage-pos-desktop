import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowLeft,
  Rocket,
  GitBranch,
  GitCommit,
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
  Globe,
  Monitor,
  HelpCircle,
  XCircle,
} from 'lucide-react';
import { colors, cardStyle } from '../utils/designSystem';
import { supabase } from '../utils/supabaseClient';

// GitHub repository info
const GITHUB_OWNER = 'Bodzaman';
const GITHUB_REPO = 'cottage-pos-desktop';
const MAIN_REPO = 'cottage-tandoori-app';

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

interface GitStatus {
  files: string[];
  branch: string;
  ahead: number;
  behind: number;
  clean: boolean;
}

interface VercelDeployment {
  id: string;
  url: string;
  state: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  createdAt: number;
  meta?: {
    githubCommitSha?: string;
    githubCommitRef?: string;
  };
}

type PipelineStep = 'idle' | 'syncing' | 'committing' | 'pushing' | 'waiting_sync' | 'releasing' | 'complete' | 'error';

interface PipelineState {
  step: PipelineStep;
  mergeSha?: string;
  syncUrl?: string;
  releaseUrl?: string;
  buildUrl?: string;
  error?: string;
}

// Friendly error message helper
const getFriendlyError = (error: string): { message: string; fix?: string } => {
  if (error.includes('conflict')) {
    return {
      message: 'Merge conflict detected',
      fix: 'Resolve conflicts locally: git pull origin main, fix conflicts, push, then retry.'
    };
  }
  if (error.includes('not found')) {
    return {
      message: 'Resource not found',
      fix: 'Make sure the branch exists and is pushed to GitHub.'
    };
  }
  if (error.includes('Tag') && error.includes('already exists')) {
    return {
      message: 'Version already exists',
      fix: 'Select a different version bump (e.g., minor instead of patch).'
    };
  }
  if (error.includes('timed out')) {
    return {
      message: 'Sync workflow timed out',
      fix: 'Check GitHub Actions directly. The workflow may still be running.'
    };
  }
  return { message: error };
};

// Info tooltip component
const InfoTooltip = ({ content }: { content: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="h-4 w-4 ml-1 cursor-help" style={{ color: colors.text.secondary }} />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs" style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}>
        <p className="text-sm" style={{ color: colors.text.primary }}>{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

// Status indicator component
const StatusIndicator = ({
  label,
  status,
  tooltip
}: {
  label: string;
  status: 'ready' | 'pending' | 'error' | 'building' | 'unknown';
  tooltip: string
}) => {
  const statusColors = {
    ready: 'text-green-500',
    pending: 'text-amber-500',
    error: 'text-red-500',
    building: 'text-amber-500',
    unknown: 'text-gray-400'
  };

  const statusIcons = {
    ready: <CheckCircle2 className={`h-4 w-4 ${statusColors[status]}`} />,
    pending: <Clock className={`h-4 w-4 ${statusColors[status]}`} />,
    error: <XCircle className={`h-4 w-4 ${statusColors[status]}`} />,
    building: <Loader2 className={`h-4 w-4 animate-spin ${statusColors[status]}`} />,
    unknown: <Circle className={`h-4 w-4 ${statusColors[status]}`} />
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: colors.background.tertiary }}>
            {statusIcons[status]}
            <span className="text-xs font-medium" style={{ color: colors.text.primary }}>{label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}>
          <p className="text-sm" style={{ color: colors.text.primary }}>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default function DeploymentHub() {
  const navigate = useNavigate();
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Global state
  const [latestRelease, setLatestRelease] = useState<GitHubRelease | null>(null);
  const [isLoadingRelease, setIsLoadingRelease] = useState(true);
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [isLoadingGitStatus, setIsLoadingGitStatus] = useState(false);
  const [vercelDeployment, setVercelDeployment] = useState<VercelDeployment | null>(null);
  const [isLoadingVercel, setIsLoadingVercel] = useState(false);

  // Card 1: Prepare Code state
  const [isSyncing, setIsSyncing] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);

  // Card 2: Deploy Electron state
  const [versionBump, setVersionBump] = useState<'patch' | 'minor' | 'major'>('patch');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [pipeline, setPipeline] = useState<PipelineState>({ step: 'idle' });
  const [syncWorkflowUrl, setSyncWorkflowUrl] = useState<string | null>(null);
  const [syncComplete, setSyncComplete] = useState(false);

  // Card 4: Deploy All state
  const [deployAllCommitMessage, setDeployAllCommitMessage] = useState('');
  const [deployAllReleaseNotes, setDeployAllReleaseNotes] = useState('');
  const [deployAllBump, setDeployAllBump] = useState<'patch' | 'minor' | 'major'>('patch');
  const [fullPipeline, setFullPipeline] = useState<PipelineState>({ step: 'idle' });

  useEffect(() => {
    loadLatestRelease();
    loadGitStatus();
    loadVercelStatus();
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

  const loadGitStatus = async () => {
    setIsLoadingGitStatus(true);
    try {
      const response = await fetch('/routes/git-status');
      const data = await response.json();
      if (data.success) {
        setGitStatus(data);
      }
    } catch (error) {
      console.error('Failed to load git status:', error);
    } finally {
      setIsLoadingGitStatus(false);
    }
  };

  const loadVercelStatus = async () => {
    setIsLoadingVercel(true);
    try {
      const response = await fetch('/routes/vercel-status');
      const data = await response.json();
      if (data.success && data.deployment) {
        setVercelDeployment(data.deployment);
      }
    } catch (error) {
      console.error('Failed to load Vercel status:', error);
    } finally {
      setIsLoadingVercel(false);
    }
  };

  const getNextVersion = (bump: 'patch' | 'minor' | 'major' = versionBump): string => {
    const currentVersion = latestRelease?.tag_name?.replace('v', '') || '1.0.0';
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    switch (bump) {
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

  // Status helpers
  const getLocalStatus = (): 'ready' | 'pending' | 'unknown' => {
    if (!gitStatus) return 'unknown';
    return gitStatus.clean ? 'ready' : 'pending';
  };

  const getMainStatus = (): 'ready' | 'pending' | 'unknown' => {
    if (!gitStatus) return 'unknown';
    if (gitStatus.ahead > 0) return 'pending';
    return 'ready';
  };

  const getElectronStatus = (): 'ready' | 'building' | 'pending' | 'unknown' => {
    if (pipeline.step === 'waiting_sync' || pipeline.step === 'releasing') return 'building';
    if (syncComplete) return 'ready';
    return 'pending';
  };

  const getWebStatus = (): 'ready' | 'building' | 'error' | 'unknown' => {
    if (!vercelDeployment) return 'unknown';
    switch (vercelDeployment.state) {
      case 'READY': return 'ready';
      case 'BUILDING': return 'building';
      case 'ERROR': return 'error';
      default: return 'unknown';
    }
  };

  // Card 1: Prepare Code handlers
  // Note: Local git operations must be run in terminal - backend can't execute them
  const handleLocalSync = async () => {
    // Show toast with instructions since backend can't run local commands
    toast.info(
      'Run in terminal: make sync-electron',
      { duration: 8000, description: 'Syncs brain methods, Vite aliases, and dependencies' }
    );
    // Also copy to clipboard
    navigator.clipboard.writeText('make sync-electron');
  };

  const handleCommitAndPush = async () => {
    if (!commitMessage.trim()) {
      toast.error('Please enter a commit message');
      return;
    }

    // Generate the git commands
    const commands = `git add -A && git commit -m "${commitMessage.trim()}" && git push origin main`;

    // Show toast with instructions
    toast.info(
      'Run in terminal to commit and push:',
      { duration: 10000, description: commands }
    );

    // Copy to clipboard
    navigator.clipboard.writeText(commands);
    toast.success('Commands copied to clipboard!');
  };

  // Check sync workflow status
  const checkSyncWorkflow = async (sha?: string) => {
    try {
      const response = await fetch(`/routes/pipeline-sync-status${sha ? `?merge_sha=${sha}` : ''}`);
      const data = await response.json();
      if (data.workflow_url) {
        setSyncWorkflowUrl(data.workflow_url);
      }
      if (data.status === 'completed' && data.conclusion === 'success') {
        setSyncComplete(true);
      } else if (data.skipped) {
        setSyncComplete(true);
      }
    } catch (error) {
      console.error('Failed to check sync workflow:', error);
    }
  };

  // Card 2: Deploy Electron handler
  const handleDeployElectron = async () => {
    if (!releaseNotes.trim()) {
      toast.error('Please add release notes');
      return;
    }

    setPipeline({ step: 'releasing' });
    try {
      const nextVersion = getNextVersion();
      const { data, error } = await supabase.functions.invoke('release-electron', {
        body: { version: nextVersion, releaseNotes: releaseNotes.trim() }
      });

      if (error || !data?.success) {
        const errorMsg = error?.message || data?.error || 'Release creation failed';
        setPipeline({ step: 'error', error: errorMsg });
        toast.error('Failed to create release');
        return;
      }

      const actionsUrl = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/actions`;
      setPipeline({
        step: 'complete',
        releaseUrl: data.releaseUrl,
        buildUrl: actionsUrl
      });
      toast.success(`Release v${nextVersion} created!`);
      setReleaseNotes('');
      setTimeout(loadLatestRelease, 5000);
    } catch (error: any) {
      setPipeline({ step: 'error', error: error.message });
      toast.error('Release failed: ' + error.message);
    }
  };

  // Card 4: Deploy All handler
  // Note: This provides a guided workflow since backend can't run local git commands
  const handleDeployAll = async () => {
    if (!deployAllCommitMessage.trim() || !deployAllReleaseNotes.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Generate commands for the user
    const commands = [
      'make sync-electron',
      `git add -A && git commit -m "${deployAllCommitMessage.trim()}"`,
      'git push origin main'
    ].join(' && ');

    // Copy commands to clipboard
    navigator.clipboard.writeText(commands);
    toast.info('Step 1 of 2: Run these commands in your terminal (copied to clipboard)', {
      duration: 15000,
      description: commands
    });

    // Show a prompt to continue after they've pushed
    setFullPipeline({ step: 'waiting_sync' });
    toast.info('After pushing, click "Continue" below to create the release', { duration: 10000 });
  };

  // Continue Deploy All after user has pushed
  const continueDeployAll = async () => {
    if (!deployAllReleaseNotes.trim()) {
      toast.error('Please add release notes');
      return;
    }

    setFullPipeline({ step: 'releasing' });
    try {
      // Check for latest commit to use as merge_sha
      const gitResponse = await fetch('/routes/git-status');
      const gitData = await gitResponse.json();

      if (gitData.success && gitData.latest_commit_sha) {
        // Poll sync status with latest commit
        const syncResult = await pollSyncStatus(gitData.latest_commit_sha);
        if (syncResult.workflow_url) {
          setFullPipeline(prev => ({ ...prev, syncUrl: syncResult.workflow_url }));
        }
      }

      // Create release
      const nextVersion = getNextVersion(deployAllBump);
      const { data, error } = await supabase.functions.invoke('release-electron', {
        body: { version: nextVersion, releaseNotes: deployAllReleaseNotes.trim() }
      });

      if (error || !data?.success) {
        setFullPipeline({ step: 'error', error: error?.message || data?.error || 'Release failed' });
        toast.error('Release creation failed');
        return;
      }

      // Success!
      const actionsUrl = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/actions`;
      setFullPipeline({
        step: 'complete',
        releaseUrl: data.releaseUrl,
        buildUrl: actionsUrl
      });
      toast.success(`Full deployment complete! Release v${nextVersion} created`);
      setDeployAllCommitMessage('');
      setDeployAllReleaseNotes('');
      loadLatestRelease();
      loadGitStatus();
      loadVercelStatus();

    } catch (error: any) {
      setFullPipeline({ step: 'error', error: error.message });
      toast.error('Deployment failed: ' + error.message);
    }
  };

  const pollSyncStatus = async (mergeSha: string): Promise<any> => {
    const maxAttempts = 180; // 15 minutes
    await new Promise(resolve => setTimeout(resolve, 3000));

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`/routes/pipeline-sync-status?merge_sha=${mergeSha}`);
        const data = await response.json();

        if (data.workflow_url) {
          setFullPipeline(prev => ({ ...prev, syncUrl: data.workflow_url }));
        }

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
    return { success: false, skipped: false, message: 'Sync timed out after 15 minutes' };
  };

  const resetPipeline = () => {
    setPipeline({ step: 'idle' });
    setSyncComplete(false);
    setSyncWorkflowUrl(null);
  };

  const resetFullPipeline = () => {
    setFullPipeline({ step: 'idle' });
  };

  // Pipeline stepper for Card 2
  const ElectronPipelineStepper = () => {
    const steps = [
      { key: 'releasing', label: 'Create Release', desc: `Publish v${getNextVersion()} on GitHub` },
      { key: 'building', label: 'Build Installer', desc: 'GitHub Actions builds the .exe' },
    ];

    const stepOrder = ['releasing', 'building', 'complete'];
    const currentIdx = stepOrder.indexOf(pipeline.step === 'complete' ? 'complete' : pipeline.step);

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
                </p>
                <p className="text-xs" style={{ color: colors.text.secondary }}>{step.desc}</p>
              </div>
            </div>
          );
        })}

        {pipeline.step === 'error' && pipeline.error && (
          <Alert className="mt-3" style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300 text-sm">
              <p className="font-medium">{getFriendlyError(pipeline.error).message}</p>
              {getFriendlyError(pipeline.error).fix && (
                <p className="text-xs mt-1 text-red-200">{getFriendlyError(pipeline.error).fix}</p>
              )}
            </AlertDescription>
          </Alert>
        )}

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

        {(pipeline.step === 'error' || pipeline.step === 'complete') && (
          <Button variant="ghost" size="sm" onClick={resetPipeline} className="mt-2"
            style={{ color: colors.text.secondary }}>
            <RefreshCw className="h-3 w-3 mr-1" /> Reset
          </Button>
        )}
      </div>
    );
  };

  // Full pipeline stepper for Card 4
  const FullPipelineStepper = () => {
    const steps = [
      { key: 'syncing', label: 'Local Sync', desc: 'Syncing electron dependencies' },
      { key: 'committing', label: 'Commit & Push', desc: 'Pushing to main branch' },
      { key: 'waiting_sync', label: 'GitHub Sync', desc: 'Waiting for sync workflow' },
      { key: 'releasing', label: 'Create Release', desc: `Publishing v${getNextVersion(deployAllBump)}` },
    ];

    const stepOrder = ['syncing', 'committing', 'waiting_sync', 'releasing', 'complete'];
    const currentIdx = stepOrder.indexOf(fullPipeline.step === 'complete' ? 'complete' : fullPipeline.step);

    const getStepStatus = (stepKey: string) => {
      const stepIdx = stepOrder.indexOf(stepKey);
      if (fullPipeline.step === 'error') {
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
      <div className="space-y-2 mt-4">
        {steps.map((step) => {
          const status = getStepStatus(step.key);
          return (
            <div key={step.key} className="flex items-center space-x-3">
              <div>{getIcon(status)}</div>
              <div className="flex-1">
                <p className="text-xs font-medium" style={{
                  color: status === 'active' ? colors.brand.purple :
                         status === 'complete' ? '#6EE7B7' :
                         status === 'error' ? '#F87171' : colors.text.secondary
                }}>
                  {step.label}
                  {step.key === 'waiting_sync' && fullPipeline.syncUrl && (
                    <a href={fullPipeline.syncUrl} target="_blank" rel="noopener noreferrer"
                      className="ml-2 underline" style={{ color: colors.brand.turquoise }}>
                      View
                    </a>
                  )}
                </p>
              </div>
            </div>
          );
        })}

        {fullPipeline.step === 'error' && fullPipeline.error && (
          <Alert className="mt-3" style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300 text-sm">
              <p className="font-medium">{getFriendlyError(fullPipeline.error).message}</p>
              {getFriendlyError(fullPipeline.error).fix && (
                <p className="text-xs mt-1 text-red-200">{getFriendlyError(fullPipeline.error).fix}</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {fullPipeline.step === 'complete' && (
          <div className="flex flex-wrap gap-2 mt-3">
            {fullPipeline.releaseUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(fullPipeline.releaseUrl, '_blank')}
                style={{ borderColor: colors.brand.purple, color: colors.brand.purple }}>
                <ExternalLink className="h-3 w-3 mr-1" /> View Release
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => window.open('https://cottage-tandoori-app.vercel.app', '_blank')}
              style={{ borderColor: colors.brand.turquoise, color: colors.brand.turquoise }}>
              <ExternalLink className="h-3 w-3 mr-1" /> View Web
            </Button>
          </div>
        )}

        {(fullPipeline.step === 'error' || fullPipeline.step === 'complete') && (
          <Button variant="ghost" size="sm" onClick={resetFullPipeline} className="mt-2"
            style={{ color: colors.text.secondary }}>
            <RefreshCw className="h-3 w-3 mr-1" /> Reset
          </Button>
        )}
      </div>
    );
  };

  const isPipelineActive = pipeline.step !== 'idle' && pipeline.step !== 'error' && pipeline.step !== 'complete';
  const isFullPipelineActive = fullPipeline.step !== 'idle' && fullPipeline.step !== 'error' && fullPipeline.step !== 'complete';

  return (
    <div className="min-h-screen p-6" style={{ background: colors.background.primary, color: colors.text.primary }}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: colors.brand.purple + '20' }}>
                <Rocket className="h-6 w-6" style={{ color: colors.brand.purple }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                  Deployment Hub
                </h1>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  Manage code sync and deployments
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Global Status Bar */}
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: colors.background.secondary }}>
          <StatusIndicator
            label="Local"
            status={getLocalStatus()}
            tooltip={gitStatus?.clean ? 'No uncommitted changes' : `${gitStatus?.files.length || 0} files changed`}
          />
          <StatusIndicator
            label="Main"
            status={getMainStatus()}
            tooltip={gitStatus?.ahead ? `${gitStatus.ahead} commits ahead of remote` : 'Up to date with remote'}
          />
          <StatusIndicator
            label="Electron"
            status={getElectronStatus()}
            tooltip={syncComplete ? 'Code synced to cottage-pos-desktop' : 'Waiting for sync workflow'}
          />
          <StatusIndicator
            label="Web"
            status={getWebStatus()}
            tooltip={vercelDeployment ? `Last deploy: ${new Date(vercelDeployment.createdAt).toLocaleDateString()}` : 'Loading Vercel status...'}
          />
          <Button variant="ghost" size="sm" onClick={() => { loadGitStatus(); loadVercelStatus(); checkSyncWorkflow(); }}
            style={{ color: colors.text.secondary, marginLeft: 'auto' }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* 4-Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ============ CARD 1: PREPARE CODE ============ */}
          <Card style={cardStyle}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GitCommit className="h-5 w-5 mr-2" style={{ color: colors.brand.turquoise }} />
                Prepare Code
                <InfoTooltip content="Sync electron dependencies and commit changes to main. This prepares your code for deployment." />
              </CardTitle>
              <CardDescription style={{ color: colors.text.secondary }}>
                Sync, commit, and push changes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 1: Local Sync */}
              <div className="space-y-2">
                <Label className="flex items-center" style={{ color: colors.text.secondary }}>
                  Step 1: Sync Electron Code
                  <InfoTooltip content="Runs 'make sync-electron' to sync brain methods, Vite aliases, and dependencies from frontend to electron folder." />
                </Label>
                <Button onClick={handleLocalSync} disabled={isSyncing} className="w-full"
                  style={{ backgroundColor: colors.background.tertiary, color: colors.text.primary }}>
                  {isSyncing ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Syncing...</>
                  ) : (
                    <><RefreshCw className="h-4 w-4 mr-2" /> Run Local Sync</>
                  )}
                </Button>
              </div>

              {/* Step 2: Git Status */}
              <div className="space-y-2">
                <Label style={{ color: colors.text.secondary }}>Step 2: Review Changes</Label>
                {isLoadingGitStatus ? (
                  <Skeleton className="h-20 w-full" style={{ backgroundColor: colors.background.tertiary }} />
                ) : gitStatus?.clean ? (
                  <div className="p-3 rounded-lg text-center" style={{ backgroundColor: colors.background.tertiary }}>
                    <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    <p className="text-sm" style={{ color: colors.text.secondary }}>Working tree clean</p>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg max-h-32 overflow-y-auto" style={{ backgroundColor: colors.background.tertiary }}>
                    <p className="text-xs font-medium mb-2" style={{ color: colors.text.secondary }}>
                      {gitStatus?.files.length} files changed
                    </p>
                    {gitStatus?.files.slice(0, 5).map((file, i) => (
                      <p key={i} className="text-xs font-mono truncate" style={{ color: colors.text.primary }}>{file}</p>
                    ))}
                    {(gitStatus?.files.length || 0) > 5 && (
                      <p className="text-xs mt-1" style={{ color: colors.text.secondary }}>
                        +{(gitStatus?.files.length || 0) - 5} more
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Step 3: Commit */}
              <div className="space-y-2">
                <Label className="flex items-center" style={{ color: colors.text.secondary }}>
                  Step 3: Commit & Push
                  <InfoTooltip content="Commits all changes and pushes to main. This triggers the GitHub sync workflow automatically." />
                </Label>
                <Input
                  placeholder="V4.1.2 - Feature description"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  disabled={isCommitting || gitStatus?.clean}
                  style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.light, color: colors.text.primary }}
                />
                <Button onClick={handleCommitAndPush} disabled={isCommitting || !commitMessage.trim() || gitStatus?.clean}
                  className="w-full" style={{ backgroundColor: colors.brand.turquoise, color: 'white' }}>
                  {isCommitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Committing...</>
                  ) : (
                    <><GitCommit className="h-4 w-4 mr-2" /> Commit & Push to Main</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ============ CARD 2: DEPLOY ELECTRON ============ */}
          <Card style={{ ...cardStyle, border: `2px solid ${colors.brand.purple}40` }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Monitor className="h-5 w-5 mr-2" style={{ color: colors.brand.purple }} />
                  Deploy Electron
                  <InfoTooltip content="Deploys to cottage-pos-desktop which builds the Windows .exe installer. The restaurant uses this daily." />
                </CardTitle>
                <Badge className="bg-red-500/20 text-red-300 border-red-500/30">HIGH PRIORITY</Badge>
              </div>
              <CardDescription style={{ color: colors.text.secondary }}>
                Windows POS Desktop (cottage-pos-desktop)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Version */}
              <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
                <span className="text-sm" style={{ color: colors.text.secondary }}>Current Version</span>
                {isLoadingRelease ? (
                  <Skeleton className="h-6 w-16" style={{ backgroundColor: colors.background.secondary }} />
                ) : (
                  <Badge style={{ backgroundColor: colors.brand.purple + '20', color: colors.brand.purple }}>
                    {latestRelease?.tag_name || 'v1.0.0'}
                  </Badge>
                )}
              </div>

              {/* Version Bump */}
              <div className="space-y-2">
                <Label style={{ color: colors.text.secondary }}>Version Bump</Label>
                <div className="grid grid-cols-3 gap-2">
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
                <p className="text-xs text-center" style={{ color: colors.brand.purple }}>
                  Next: v{getNextVersion()}
                </p>
              </div>

              {/* Release Notes */}
              <div className="space-y-2">
                <Label style={{ color: colors.text.secondary }}>Release Notes *</Label>
                <Textarea
                  placeholder="What changed in this release?"
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  rows={3}
                  disabled={isPipelineActive}
                  style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.light, color: colors.text.primary }}
                />
              </div>

              {/* Prerequisites */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
                <p className="text-xs font-medium mb-2" style={{ color: colors.text.secondary }}>Prerequisites:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    {gitStatus?.clean && gitStatus?.ahead === 0 ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-amber-500" />
                    )}
                    <span style={{ color: colors.text.primary }}>Code pushed to main</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {syncComplete ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <Clock className="h-3 w-3 text-amber-500" />
                    )}
                    <span style={{ color: colors.text.primary }}>Sync workflow complete</span>
                    {syncWorkflowUrl && (
                      <a href={syncWorkflowUrl} target="_blank" rel="noopener noreferrer"
                        className="underline" style={{ color: colors.brand.turquoise }}>(View)</a>
                    )}
                  </div>
                </div>
              </div>

              {/* Deploy Button */}
              {pipeline.step === 'idle' ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-full h-12 font-semibold" disabled={!releaseNotes.trim()}
                      style={{ backgroundColor: colors.brand.purple, color: 'white' }}>
                      <Rocket className="h-5 w-5 mr-2" />
                      Deploy Electron v{getNextVersion()}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}>
                    <AlertDialogHeader>
                      <AlertDialogTitle style={{ color: colors.text.primary }}>
                        Confirm Electron Deployment
                      </AlertDialogTitle>
                      <AlertDialogDescription style={{ color: colors.text.secondary }}>
                        This will:
                        <ul className="list-disc ml-4 mt-2 space-y-1">
                          <li>Create release <strong style={{ color: colors.brand.purple }}>v{getNextVersion()}</strong> on cottage-pos-desktop</li>
                          <li>Trigger Windows installer build (~10-15 min)</li>
                        </ul>
                        <p className="mt-3 text-xs">Make sure code is synced to the POS repo first.</p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel style={{ color: colors.text.secondary, borderColor: colors.border.light }}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeployElectron}
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
                  <span className="text-sm" style={{ color: colors.text.secondary }}>Deploying...</span>
                </div>
              )}

              {pipeline.step !== 'idle' && <ElectronPipelineStepper />}
            </CardContent>
          </Card>

          {/* ============ CARD 3: DEPLOY WEB ============ */}
          <Card style={cardStyle}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" style={{ color: colors.brand.turquoise }} />
                Deploy Web
                <InfoTooltip content="Web deployments are automatic. When you push to main, Vercel builds and deploys within 2-3 minutes." />
              </CardTitle>
              <CardDescription style={{ color: colors.text.secondary }}>
                Vercel (Auto-deploys on push to main)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Production Status */}
              <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
                <span className="text-sm" style={{ color: colors.text.secondary }}>Production</span>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Live
                  </Badge>
                  <a href="https://cottage-tandoori-app.vercel.app" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" style={{ color: colors.text.secondary }} />
                  </a>
                </div>
              </div>

              {/* Latest Deploy */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm" style={{ color: colors.text.secondary }}>Latest Deploy</span>
                  {isLoadingVercel ? (
                    <Skeleton className="h-5 w-24" style={{ backgroundColor: colors.background.secondary }} />
                  ) : vercelDeployment ? (
                    <div className="flex items-center gap-2">
                      {vercelDeployment.state === 'READY' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {vercelDeployment.state === 'BUILDING' && <Loader2 className="h-4 w-4 animate-spin text-amber-500" />}
                      {vercelDeployment.state === 'ERROR' && <XCircle className="h-4 w-4 text-red-500" />}
                      <span className="text-sm" style={{ color: colors.text.primary }}>
                        {new Date(vercelDeployment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm" style={{ color: colors.text.secondary }}>Unknown</span>
                  )}
                </div>
                {vercelDeployment?.meta?.githubCommitSha && (
                  <p className="text-xs" style={{ color: colors.text.secondary }}>
                    Commit: {vercelDeployment.meta.githubCommitSha.slice(0, 7)}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1"
                  onClick={() => window.open('https://vercel.com/bodruz-zamans-projects/cottage-tandoori-app', '_blank')}
                  style={{ borderColor: colors.border.light, color: colors.text.primary }}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Deployments
                </Button>
                <Button variant="outline" onClick={loadVercelStatus}
                  style={{ borderColor: colors.border.light, color: colors.text.secondary }}>
                  <RefreshCw className={`h-4 w-4 ${isLoadingVercel ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {/* Info */}
              <Alert style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.light }}>
                <Clock className="h-4 w-4" style={{ color: colors.text.secondary }} />
                <AlertDescription className="text-sm" style={{ color: colors.text.secondary }}>
                  Web deploys automatically when you push to main. No manual action needed.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* ============ CARD 4: DEPLOY ALL ============ */}
          <Card style={{ ...cardStyle, border: `2px solid ${colors.brand.turquoise}40` }}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" style={{ color: '#F59E0B' }} />
                Deploy All
                <InfoTooltip content="One-click deployment: syncs, commits, pushes, waits for sync, creates Electron release. Web auto-deploys in parallel." />
              </CardTitle>
              <CardDescription style={{ color: colors.text.secondary }}>
                One-click full deployment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* What this does */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
                <p className="text-xs font-medium mb-2" style={{ color: colors.text.secondary }}>This will:</p>
                <ol className="text-xs space-y-1">
                  {[
                    'Run local sync (make sync-electron)',
                    'Commit & push to main',
                    'Wait for GitHub sync workflow',
                    'Create Electron release & trigger build',
                    'Vercel auto-deploys web (parallel)'
                  ].map((step, i) => (
                    <li key={i} className="flex items-center gap-2" style={{ color: colors.text.primary }}>
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                        style={{ backgroundColor: colors.brand.purple, color: 'white' }}>{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Inputs */}
              <div className="space-y-3">
                <div>
                  <Label style={{ color: colors.text.secondary }}>Commit Message *</Label>
                  <Input
                    placeholder="V4.1.2 - Feature description"
                    value={deployAllCommitMessage}
                    onChange={(e) => setDeployAllCommitMessage(e.target.value)}
                    disabled={isFullPipelineActive}
                    style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.light, color: colors.text.primary }}
                  />
                </div>
                <div>
                  <Label style={{ color: colors.text.secondary }}>Version Bump *</Label>
                  <Select value={deployAllBump} onValueChange={(v: any) => setDeployAllBump(v)} disabled={isFullPipelineActive}>
                    <SelectTrigger style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.light, color: colors.text.primary }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}>
                      <SelectItem value="patch" style={{ color: colors.text.primary }}>Patch (v{getNextVersion('patch')})</SelectItem>
                      <SelectItem value="minor" style={{ color: colors.text.primary }}>Minor (v{getNextVersion('minor')})</SelectItem>
                      <SelectItem value="major" style={{ color: colors.text.primary }}>Major (v{getNextVersion('major')})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label style={{ color: colors.text.secondary }}>Release Notes *</Label>
                  <Textarea
                    placeholder="What changed?"
                    value={deployAllReleaseNotes}
                    onChange={(e) => setDeployAllReleaseNotes(e.target.value)}
                    rows={2}
                    disabled={isFullPipelineActive}
                    style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.light, color: colors.text.primary }}
                  />
                </div>
              </div>

              {/* Deploy Button */}
              {fullPipeline.step === 'idle' ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-full h-12 font-semibold"
                      disabled={!deployAllCommitMessage.trim() || !deployAllReleaseNotes.trim()}
                      style={{ background: `linear-gradient(to right, ${colors.brand.purple}, #F59E0B)`, color: 'white' }}>
                      <Rocket className="h-5 w-5 mr-2" />
                      Deploy Everything
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}>
                    <AlertDialogHeader>
                      <AlertDialogTitle style={{ color: colors.text.primary }}>
                        Confirm Full Deployment
                      </AlertDialogTitle>
                      <AlertDialogDescription style={{ color: colors.text.secondary }}>
                        This will guide you through the complete deployment:
                        <ol className="list-decimal ml-4 mt-2 space-y-1">
                          <li><strong>Step 1:</strong> Copy commands to sync, commit & push (run in terminal)</li>
                          <li><strong>Step 2:</strong> Click Continue to create Electron release <strong style={{ color: colors.brand.purple }}>v{getNextVersion(deployAllBump)}</strong></li>
                        </ol>
                        <p className="mt-3 text-xs">Vercel will auto-deploy the web app when you push.</p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel style={{ color: colors.text.secondary, borderColor: colors.border.light }}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeployAll}
                        style={{ background: `linear-gradient(to right, ${colors.brand.purple}, #F59E0B)`, color: 'white' }}>
                        <Rocket className="h-4 w-4 mr-2" />
                        Start Deployment
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : fullPipeline.step === 'waiting_sync' ? (
                <div className="space-y-3">
                  <Alert style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.light }}>
                    <Clock className="h-4 w-4" style={{ color: colors.brand.turquoise }} />
                    <AlertDescription className="text-sm" style={{ color: colors.text.primary }}>
                      Run the copied commands in your terminal, then click Continue.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-2">
                    <Button onClick={continueDeployAll} className="flex-1"
                      style={{ backgroundColor: colors.brand.purple, color: 'white' }}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Continue - Create Release
                    </Button>
                    <Button variant="outline" onClick={resetFullPipeline}
                      style={{ borderColor: colors.border.light, color: colors.text.secondary }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : fullPipeline.step === 'releasing' ? (
                <div className="w-full h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: colors.background.tertiary }}>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" style={{ color: colors.brand.purple }} />
                  <span className="text-sm" style={{ color: colors.text.secondary }}>Creating release...</span>
                </div>
              ) : null}

              {fullPipeline.step !== 'idle' && <FullPipelineStepper />}
            </CardContent>
          </Card>

        </div>

        {/* Current Release Info */}
        <Card style={cardStyle}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" style={{ color: colors.brand.purple }} />
              Current Electron Release
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRelease ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-24" style={{ backgroundColor: colors.background.tertiary }} />
                <Skeleton className="h-10 flex-1" style={{ backgroundColor: colors.background.tertiary }} />
              </div>
            ) : latestRelease ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
                  <p className="text-2xl font-bold" style={{ color: colors.brand.purple }}>
                    {latestRelease.tag_name}
                  </p>
                  <p className="text-xs" style={{ color: colors.text.secondary }}>
                    {new Date(latestRelease.published_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getInstallerUrl() && (
                    <Button onClick={() => window.open(getInstallerUrl()!, '_blank')}
                      style={{ backgroundColor: colors.brand.purple, color: 'white' }}>
                      <Download className="h-4 w-4 mr-2" /> Download Installer
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => window.open(latestRelease.html_url, '_blank')}
                    style={{ borderColor: colors.border.light, color: colors.text.secondary }}>
                    <ExternalLink className="h-4 w-4 mr-2" /> View on GitHub
                  </Button>
                  <Button variant="ghost" onClick={loadLatestRelease} disabled={isLoadingRelease}
                    style={{ color: colors.text.secondary }}>
                    <RefreshCw className={`h-4 w-4 ${isLoadingRelease ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Package className="h-12 w-12 mx-auto mb-3" style={{ color: colors.text.secondary }} />
                <p style={{ color: colors.text.secondary }}>No releases yet</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
