import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ArrowLeft,
  Rocket,
  Package,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  RefreshCw,
  Loader2,
  Circle,
  Globe,
  Monitor,
  Server,
  GitCommit,
  FileText,
  ChevronDown,
  ChevronRight,
  Info,
  Terminal,
} from 'lucide-react';
import { colors, cardStyle } from '../utils/designSystem';

// ============================================================================
// Types
// ============================================================================

interface VersionInfo {
  electron: {
    version: string;
    release_url: string;
    published_at: string;
    name: string;
  } | null;
  web: {
    deployment_url: string;
    state: string;
    latency_ms: number;
  } | null;
}

interface FileChange {
  path: string;
  status: string;
  staged: boolean;
}

interface GitStatus {
  success: boolean;
  is_local: boolean;
  branch: string;
  files: FileChange[];
  total_files: number;
  has_changes: boolean;
  error?: string;
}

interface FileDiff {
  path: string;
  additions: number;
  deletions: number;
}

type DeployType = 'till' | 'web' | 'everything';
type PipelineStep = 'idle' | 'committing' | 'bumping' | 'triggering' | 'building' | 'complete' | 'error';

// ============================================================================
// Component
// ============================================================================

export default function DeploymentHub() {
  const navigate = useNavigate();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Git state
  const [isLocal, setIsLocal] = useState<boolean | null>(null);
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [isLoadingGit, setIsLoadingGit] = useState(true);
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [fileDiffs, setFileDiffs] = useState<FileDiff[]>([]);

  // Deploy state
  const [versions, setVersions] = useState<VersionInfo | null>(null);
  const [isLoadingVersions, setIsLoadingVersions] = useState(true);
  const [selectedDeploy, setSelectedDeploy] = useState<DeployType>('till');
  const [versionBump, setVersionBump] = useState<'patch' | 'minor' | 'major'>('patch');
  const [releaseNotes, setReleaseNotes] = useState('');

  // Pipeline state
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>('idle');
  const [workflowRunId, setWorkflowRunId] = useState<number | null>(null);
  const [workflowUrl, setWorkflowUrl] = useState<string | null>(null);
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Data Loading
  // ============================================================================

  const checkIsLocal = useCallback(async () => {
    try {
      const response = await fetch('/routes/git/is-local');
      const data = await response.json();
      setIsLocal(data.is_local);
      return data.is_local;
    } catch {
      setIsLocal(false);
      return false;
    }
  }, []);

  const loadGitStatus = useCallback(async () => {
    setIsLoadingGit(true);
    try {
      const response = await fetch('/routes/git/status');
      const data = await response.json();
      setGitStatus(data);
      setIsLocal(data.is_local);
    } catch (err) {
      console.error('Failed to load git status:', err);
      setIsLocal(false);
    } finally {
      setIsLoadingGit(false);
    }
  }, []);

  const loadFileDiffs = useCallback(async () => {
    if (!isLocal) return;
    try {
      const response = await fetch('/routes/git/diff');
      const data = await response.json();
      if (data.success) {
        setFileDiffs(data.files);
      }
    } catch (err) {
      console.error('Failed to load diffs:', err);
    }
  }, [isLocal]);

  const loadVersions = useCallback(async () => {
    setIsLoadingVersions(true);
    try {
      const response = await fetch('/routes/current-versions');
      const data = await response.json();
      if (data.success) {
        setVersions(data);
      }
    } catch (err) {
      console.error('Failed to load versions:', err);
    } finally {
      setIsLoadingVersions(false);
    }
  }, []);

  useEffect(() => {
    loadGitStatus();
    loadVersions();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadGitStatus, loadVersions]);

  useEffect(() => {
    if (showDiff && isLocal) {
      loadFileDiffs();
    }
  }, [showDiff, isLocal, loadFileDiffs]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleCommitAndPush = async () => {
    if (!commitMessage.trim()) {
      toast.error('Please enter a commit message');
      return;
    }

    setIsCommitting(true);
    try {
      const response = await fetch('/routes/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMessage.trim() })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Committed and pushed (${data.commit_sha})`);
        setCommitMessage('');
        loadGitStatus();
      } else {
        toast.error(data.error || 'Failed to commit');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to commit');
    } finally {
      setIsCommitting(false);
    }
  };

  const getNextVersion = (): string => {
    const currentVersion = versions?.electron?.version || '1.0.0';
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    switch (versionBump) {
      case 'major': return `${major + 1}.0.0`;
      case 'minor': return `${major}.${minor + 1}.0`;
      case 'patch':
      default: return `${major}.${minor}.${patch + 1}`;
    }
  };

  const pollBuildStatus = (runId: number) => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/routes/build-status/${runId}`);
        const data = await response.json();

        if (data.success) {
          if (data.status === 'completed') {
            if (pollRef.current) clearInterval(pollRef.current);

            if (data.conclusion === 'success') {
              setPipelineStep('complete');
              toast.success('Build completed successfully!');
              loadVersions();
            } else {
              setPipelineStep('error');
              setError(`Build ${data.conclusion || 'failed'}`);
              toast.error(`Build ${data.conclusion || 'failed'}`);
            }
          }
        }
      } catch (err) {
        console.error('Failed to poll build status:', err);
      }
    }, 10000);
  };

  const handleDeploy = async () => {
    if (!releaseNotes.trim()) {
      toast.error('Please add release notes');
      return;
    }

    setError(null);
    setPipelineStep('triggering');

    try {
      const response = await fetch('/routes/trigger-electron-build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version_bump: versionBump,
          release_notes: releaseNotes.trim()
        })
      });

      const data = await response.json();

      if (!data.success) {
        setPipelineStep('error');
        setError(data.error || data.message);
        toast.error(data.message || 'Failed to trigger build');
        return;
      }

      setNewVersion(data.new_version);
      setWorkflowRunId(data.workflow_run_id);
      setWorkflowUrl(data.workflow_url);
      setPipelineStep('building');
      toast.success(`Build triggered for v${data.new_version}`);

      if (data.workflow_run_id) {
        pollBuildStatus(data.workflow_run_id);
      }
    } catch (err: any) {
      setPipelineStep('error');
      setError(err.message);
      toast.error('Failed to trigger build');
    }
  };

  const resetPipeline = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setPipelineStep('idle');
    setWorkflowRunId(null);
    setWorkflowUrl(null);
    setNewVersion(null);
    setError(null);
    setReleaseNotes('');
  };

  const refreshAll = () => {
    loadGitStatus();
    loadVersions();
  };

  const isPipelineActive = pipelineStep !== 'idle' && pipelineStep !== 'error' && pipelineStep !== 'complete';

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'M': return <span className="text-amber-400">M</span>;
      case 'A': return <span className="text-emerald-400">A</span>;
      case 'D': return <span className="text-red-400">D</span>;
      case '?': return <span className="text-blue-400">?</span>;
      default: return <span className="text-gray-400">{status}</span>;
    }
  };

  const PipelineStepper = () => {
    const steps = [
      { key: 'triggering', label: 'Trigger Build', desc: 'Starting GitHub Actions' },
      { key: 'building', label: 'Building', desc: 'Building Windows installer (~15 min)' },
    ];

    const stepOrder = ['triggering', 'building', 'complete'];
    const currentIdx = stepOrder.indexOf(pipelineStep === 'complete' ? 'complete' : pipelineStep);

    const getStepStatus = (stepKey: string) => {
      const stepIdx = stepOrder.indexOf(stepKey);
      if (pipelineStep === 'error') {
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

        {pipelineStep === 'error' && error && (
          <Alert className="mt-3" style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300 text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {pipelineStep === 'complete' && (
          <Alert className="mt-3" style={{ backgroundColor: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.3)' }}>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <AlertDescription className="text-emerald-300 text-sm">
              Build completed! v{newVersion} is now available.
            </AlertDescription>
          </Alert>
        )}

        {workflowUrl && (
          <Button variant="outline" size="sm" onClick={() => window.open(workflowUrl, '_blank')}
            style={{ borderColor: colors.brand.turquoise, color: colors.brand.turquoise }}>
            <ExternalLink className="h-3 w-3 mr-1" /> View Build Logs
          </Button>
        )}

        {(pipelineStep === 'error' || pipelineStep === 'complete') && (
          <Button variant="ghost" size="sm" onClick={resetPipeline} className="mt-2"
            style={{ color: colors.text.secondary }}>
            <RefreshCw className="h-3 w-3 mr-1" /> Reset
          </Button>
        )}
      </div>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="min-h-screen p-6" style={{ background: colors.background.primary, color: colors.text.primary }}>
      <div className="max-w-4xl mx-auto space-y-6">

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
                  Release Manager
                </h1>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  Commit changes and deploy to production
                </p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={refreshAll} disabled={isLoadingGit || isLoadingVersions}>
            <RefreshCw className={`h-4 w-4 ${(isLoadingGit || isLoadingVersions) ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* System Status */}
        <Card style={cardStyle}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" style={{ color: colors.brand.purple }} />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Website */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="h-4 w-4" style={{ color: colors.brand.turquoise }} />
                  <span className="text-xs font-medium" style={{ color: colors.text.secondary }}>Website</span>
                </div>
                <Badge className={versions?.web?.state === 'READY' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}>
                  {isLoadingVersions ? '...' : versions?.web?.state === 'READY' ? 'Live' : 'Unknown'}
                </Badge>
              </div>

              {/* Backend */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
                <div className="flex items-center gap-2 mb-1">
                  <Server className="h-4 w-4" style={{ color: colors.brand.purple }} />
                  <span className="text-xs font-medium" style={{ color: colors.text.secondary }}>Backend</span>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300">Live</Badge>
              </div>

              {/* Till Version */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
                <div className="flex items-center gap-2 mb-1">
                  <Monitor className="h-4 w-4" style={{ color: colors.brand.blue }} />
                  <span className="text-xs font-medium" style={{ color: colors.text.secondary }}>Till (POS)</span>
                </div>
                {isLoadingVersions ? (
                  <Skeleton className="h-5 w-14" style={{ backgroundColor: colors.background.secondary }} />
                ) : (
                  <Badge style={{ backgroundColor: colors.brand.blue + '20', color: colors.brand.blue }}>
                    v{versions?.electron?.version || '—'}
                  </Badge>
                )}
              </div>

              {/* Git Branch */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
                <div className="flex items-center gap-2 mb-1">
                  <GitCommit className="h-4 w-4" style={{ color: colors.text.secondary }} />
                  <span className="text-xs font-medium" style={{ color: colors.text.secondary }}>Branch</span>
                </div>
                <Badge variant="outline" style={{ borderColor: colors.border.light, color: colors.text.primary }}>
                  {gitStatus?.branch || 'main'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Commit Changes */}
        <Card style={cardStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: colors.brand.turquoise + '20', color: colors.brand.turquoise }}>
                1
              </div>
              <GitCommit className="h-5 w-5" style={{ color: colors.brand.turquoise }} />
              Commit Your Changes
            </CardTitle>
            <CardDescription style={{ color: colors.text.secondary }}>
              Stage and push your local changes before deploying
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLocal === false ? (
              // Production mode - show instructions
              <Alert style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.light }}>
                <Terminal className="h-4 w-4" style={{ color: colors.text.secondary }} />
                <AlertDescription style={{ color: colors.text.secondary }}>
                  <p className="font-medium mb-2">Git operations require local access</p>
                  <p className="text-sm mb-2">To commit changes, run the app locally:</p>
                  <code className="text-xs bg-black/30 px-2 py-1 rounded">cd cottage-tandoori-app && make run-frontend</code>
                  <p className="text-sm mt-3 mb-1">Or commit via terminal:</p>
                  <code className="text-xs bg-black/30 px-2 py-1 rounded">git add -A && git commit -m "message" && git push</code>
                  <p className="text-sm mt-4 italic">Already committed? Skip to deploy below.</p>
                </AlertDescription>
              </Alert>
            ) : isLoadingGit ? (
              // Loading
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.brand.turquoise }} />
              </div>
            ) : gitStatus?.has_changes ? (
              // Has changes - show commit UI
              <div className="space-y-4">
                {/* File list */}
                <Collapsible open={showDiff} onOpenChange={setShowDiff}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full p-3 rounded-lg flex items-center justify-between"
                      style={{ backgroundColor: colors.background.tertiary }}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" style={{ color: colors.brand.turquoise }} />
                        <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                          {gitStatus.total_files} file{gitStatus.total_files !== 1 ? 's' : ''} changed
                        </span>
                      </div>
                      {showDiff ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 p-3 rounded-lg max-h-48 overflow-y-auto"
                      style={{ backgroundColor: colors.background.tertiary }}>
                      {gitStatus.files.slice(0, 20).map((file, idx) => {
                        const diff = fileDiffs.find(d => d.path === file.path);
                        return (
                          <div key={idx} className="flex items-center justify-between py-1 text-xs font-mono">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(file.status)}
                              <span style={{ color: colors.text.secondary }}>{file.path}</span>
                            </div>
                            {diff && (
                              <span>
                                <span className="text-emerald-400">+{diff.additions}</span>
                                {' '}
                                <span className="text-red-400">-{diff.deletions}</span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                      {gitStatus.total_files > 20 && (
                        <p className="text-xs mt-2" style={{ color: colors.text.secondary }}>
                          ... and {gitStatus.total_files - 20} more files
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Commit message */}
                <div className="space-y-2">
                  <Label style={{ color: colors.text.secondary }}>Commit Message</Label>
                  <Input
                    placeholder="What did you change?"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    disabled={isCommitting}
                    style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.light, color: colors.text.primary }}
                  />
                </div>

                {/* Commit button */}
                <Button
                  onClick={handleCommitAndPush}
                  disabled={!commitMessage.trim() || isCommitting}
                  className="w-full"
                  style={{ backgroundColor: colors.brand.turquoise, color: 'white' }}
                >
                  {isCommitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Committing...</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Commit & Push</>
                  )}
                </Button>
              </div>
            ) : (
              // No changes
              <Alert style={{ backgroundColor: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.3)' }}>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <AlertDescription className="text-emerald-300 text-sm">
                  Working directory is clean. No changes to commit.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Deploy */}
        <Card style={{ ...cardStyle, border: `2px solid ${colors.brand.purple}40` }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: colors.brand.purple + '20', color: colors.brand.purple }}>
                2
              </div>
              <Rocket className="h-5 w-5" style={{ color: colors.brand.purple }} />
              Deploy
            </CardTitle>
            <CardDescription style={{ color: colors.text.secondary }}>
              Choose what to deploy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Deployment Type Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Till Update */}
              <button
                onClick={() => setSelectedDeploy('till')}
                disabled={isPipelineActive}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedDeploy === 'till' ? 'border-blue-500' : 'border-transparent'
                }`}
                style={{ backgroundColor: selectedDeploy === 'till' ? colors.brand.blue + '10' : colors.background.tertiary }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Monitor className="h-5 w-5" style={{ color: colors.brand.blue }} />
                  <span className="font-medium" style={{ color: colors.text.primary }}>Till Update</span>
                </div>
                <p className="text-xs mb-2" style={{ color: colors.text.secondary }}>
                  Build new POS desktop installer
                </p>
                <div className="flex items-center gap-2">
                  <Badge className="text-xs" style={{ backgroundColor: colors.brand.blue + '20', color: colors.brand.blue }}>
                    Most Common
                  </Badge>
                  <span className="text-xs" style={{ color: colors.text.secondary }}>~15 min</span>
                </div>
              </button>

              {/* Web + Backend (Info Only) */}
              <div
                className="p-4 rounded-lg border-2 border-transparent opacity-75"
                style={{ backgroundColor: colors.background.tertiary }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-5 w-5" style={{ color: colors.brand.turquoise }} />
                  <span className="font-medium" style={{ color: colors.text.primary }}>Web + Backend</span>
                </div>
                <p className="text-xs mb-2" style={{ color: colors.text.secondary }}>
                  Auto-deploys when you push to main
                </p>
                <div className="flex items-center gap-2">
                  <Badge className="text-xs bg-emerald-500/20 text-emerald-300">Automatic</Badge>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs"
                    style={{ color: colors.brand.turquoise }}
                    onClick={() => window.open('https://vercel.com/bodruz-zamans-projects/cottage-tandoori-app', '_blank')}>
                    <ExternalLink className="h-3 w-3 mr-1" /> Vercel
                  </Button>
                </div>
              </div>

              {/* Everything */}
              <button
                onClick={() => setSelectedDeploy('everything')}
                disabled={isPipelineActive}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedDeploy === 'everything' ? 'border-purple-500' : 'border-transparent'
                }`}
                style={{ backgroundColor: selectedDeploy === 'everything' ? colors.brand.purple + '10' : colors.background.tertiary }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Rocket className="h-5 w-5" style={{ color: colors.brand.purple }} />
                  <span className="font-medium" style={{ color: colors.text.primary }}>Everything</span>
                </div>
                <p className="text-xs mb-2" style={{ color: colors.text.secondary }}>
                  Full release (all systems)
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-xs" style={{ color: colors.text.secondary }}>~20 min</span>
                </div>
              </button>
            </div>

            {/* Version Bump (only for till/everything) */}
            {(selectedDeploy === 'till' || selectedDeploy === 'everything') && (
              <>
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
                    {versions?.electron?.version || '1.0.0'} → <strong>v{getNextVersion()}</strong>
                  </p>
                </div>

                {/* Release Notes */}
                <div className="space-y-2">
                  <Label style={{ color: colors.text.secondary }}>Release Notes *</Label>
                  <Textarea
                    placeholder="What changed in this release?"
                    value={releaseNotes}
                    onChange={(e) => setReleaseNotes(e.target.value)}
                    rows={2}
                    disabled={isPipelineActive}
                    style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.light, color: colors.text.primary }}
                  />
                </div>

                {/* Deploy Button */}
                {pipelineStep === 'idle' ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full h-12 font-semibold" disabled={!releaseNotes.trim()}
                        style={{ backgroundColor: colors.brand.purple, color: 'white' }}>
                        <Rocket className="h-5 w-5 mr-2" />
                        Deploy {selectedDeploy === 'till' ? 'Till Update' : 'Everything'} v{getNextVersion()}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}>
                      <AlertDialogHeader>
                        <AlertDialogTitle style={{ color: colors.text.primary }}>
                          Confirm Deploy
                        </AlertDialogTitle>
                        <AlertDialogDescription style={{ color: colors.text.secondary }}>
                          This will:
                          <ul className="list-disc ml-4 mt-2 space-y-1">
                            <li>Bump version to <strong style={{ color: colors.brand.purple }}>v{getNextVersion()}</strong></li>
                            <li>Commit the version change to main</li>
                            <li>Build Windows installer (~15 min)</li>
                            <li>Publish to cottage-pos-desktop releases</li>
                          </ul>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel style={{ color: colors.text.secondary, borderColor: colors.border.light }}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeploy}
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
                    <span className="text-sm" style={{ color: colors.text.secondary }}>
                      {pipelineStep === 'building' ? 'Building... (this takes ~15 minutes)' : 'Processing...'}
                    </span>
                  </div>
                )}

                {/* Pipeline Progress */}
                {pipelineStep !== 'idle' && <PipelineStepper />}
              </>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Alert style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.light }}>
          <Info className="h-4 w-4" style={{ color: colors.text.secondary }} />
          <AlertDescription className="text-xs" style={{ color: colors.text.secondary }}>
            <strong>Tip:</strong> Web & backend deploy automatically when you push to main.
            This page is mainly for building Till (POS desktop) updates.
          </AlertDescription>
        </Alert>

      </div>
    </div>
  );
}
