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
} from 'lucide-react';
import { colors, cardStyle } from '../utils/designSystem';

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

interface BuildStatus {
  status: 'queued' | 'in_progress' | 'completed' | null;
  conclusion: 'success' | 'failure' | 'cancelled' | null;
  logs_url: string | null;
  started_at: string | null;
}

type PipelineStep = 'idle' | 'bumping' | 'triggering' | 'building' | 'complete' | 'error';

export default function DeploymentHub() {
  const navigate = useNavigate();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // State
  const [versions, setVersions] = useState<VersionInfo | null>(null);
  const [isLoadingVersions, setIsLoadingVersions] = useState(true);
  const [versionBump, setVersionBump] = useState<'patch' | 'minor' | 'major'>('patch');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>('idle');
  const [workflowRunId, setWorkflowRunId] = useState<number | null>(null);
  const [workflowUrl, setWorkflowUrl] = useState<string | null>(null);
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const loadVersions = async () => {
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

  const getInstallerUrl = (): string | null => {
    if (!versions?.electron?.version) return null;
    const version = versions.electron.version;
    return `https://github.com/Bodzaman/cottage-pos-desktop/releases/download/v${version}/Cottage.Tandoori.POS.Setup.${version}.exe`;
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
    }, 10000); // Poll every 10 seconds
  };

  const handleBuildRelease = async () => {
    if (!releaseNotes.trim()) {
      toast.error('Please add release notes');
      return;
    }

    setError(null);
    setPipelineStep('bumping');

    try {
      // Step 1: Trigger the build
      setPipelineStep('triggering');
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

      // Step 2: Start polling for build status
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

  const isPipelineActive = pipelineStep !== 'idle' && pipelineStep !== 'error' && pipelineStep !== 'complete';

  // Pipeline stepper component
  const PipelineStepper = () => {
    const steps = [
      { key: 'bumping', label: 'Bump Version', desc: 'Updating package.json' },
      { key: 'triggering', label: 'Trigger Build', desc: 'Starting GitHub Actions' },
      { key: 'building', label: 'Building', desc: 'Building Windows installer' },
    ];

    const stepOrder = ['bumping', 'triggering', 'building', 'complete'];
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
            <AlertDescription className="text-red-300 text-sm">
              {error}
            </AlertDescription>
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
                  Deployment Hub
                </h1>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  Build and deploy Electron POS
                </p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={loadVersions} disabled={isLoadingVersions}>
            <RefreshCw className={`h-4 w-4 ${isLoadingVersions ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Current Versions Card */}
        <Card style={cardStyle}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" style={{ color: colors.brand.purple }} />
              Current Versions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Electron Version */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" style={{ color: colors.brand.purple }} />
                    <span className="text-sm font-medium" style={{ color: colors.text.primary }}>Electron POS</span>
                  </div>
                  {isLoadingVersions ? (
                    <Skeleton className="h-6 w-16" style={{ backgroundColor: colors.background.secondary }} />
                  ) : (
                    <Badge style={{ backgroundColor: colors.brand.purple + '20', color: colors.brand.purple }}>
                      v{versions?.electron?.version || '—'}
                    </Badge>
                  )}
                </div>
                {versions?.electron && (
                  <div className="flex gap-2 mt-3">
                    {getInstallerUrl() && (
                      <Button size="sm" variant="outline" onClick={() => window.open(getInstallerUrl()!, '_blank')}
                        style={{ borderColor: colors.brand.purple, color: colors.brand.purple }}>
                        <Download className="h-3 w-3 mr-1" /> Download
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => window.open(versions.electron!.release_url, '_blank')}
                      style={{ color: colors.text.secondary }}>
                      <ExternalLink className="h-3 w-3 mr-1" /> GitHub
                    </Button>
                  </div>
                )}
              </div>

              {/* Web Version */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" style={{ color: colors.brand.turquoise }} />
                    <span className="text-sm font-medium" style={{ color: colors.text.primary }}>Web App</span>
                  </div>
                  {isLoadingVersions ? (
                    <Skeleton className="h-6 w-16" style={{ backgroundColor: colors.background.secondary }} />
                  ) : (
                    <Badge className={versions?.web?.state === 'READY' ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}>
                      {versions?.web?.state === 'READY' ? 'Live' : 'Unknown'}
                    </Badge>
                  )}
                </div>
                <Button size="sm" variant="ghost" onClick={() => window.open('https://cottage-tandoori-app.vercel.app', '_blank')}
                  style={{ color: colors.text.secondary }} className="mt-3">
                  <ExternalLink className="h-3 w-3 mr-1" /> Visit Site
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Build New Release Card */}
        <Card style={{ ...cardStyle, border: `2px solid ${colors.brand.purple}40` }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" style={{ color: colors.brand.purple }} />
              Build New Release
            </CardTitle>
            <CardDescription style={{ color: colors.text.secondary }}>
              Bump version, commit, and trigger the Windows installer build
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
                    disabled={isPipelineActive}
                    className={`p-3 rounded-lg border transition-all text-center ${
                      versionBump === type ? 'border-purple-500' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: versionBump === type ? colors.brand.purple + '15' : colors.background.tertiary }}
                  >
                    <p className="text-sm font-medium capitalize" style={{ color: versionBump === type ? colors.brand.purple : colors.text.primary }}>
                      {type}
                    </p>
                    <p className="text-xs mt-1" style={{ color: colors.text.secondary }}>
                      {type === 'patch' ? 'Bug fixes' : type === 'minor' ? 'New features' : 'Breaking changes'}
                    </p>
                  </button>
                ))}
              </div>
              <p className="text-sm text-center mt-2" style={{ color: colors.brand.purple }}>
                {versions?.electron?.version || '1.0.0'} → <strong>v{getNextVersion()}</strong>
              </p>
            </div>

            {/* Release Notes */}
            <div className="space-y-2">
              <Label style={{ color: colors.text.secondary }}>Release Notes *</Label>
              <Textarea
                placeholder="What changed in this release? (e.g., Fixed printer timeout, Added new menu features)"
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                rows={3}
                disabled={isPipelineActive}
                style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.light, color: colors.text.primary }}
              />
            </div>

            {/* Build Button */}
            {pipelineStep === 'idle' ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full h-12 font-semibold" disabled={!releaseNotes.trim()}
                    style={{ backgroundColor: colors.brand.purple, color: 'white' }}>
                    <Rocket className="h-5 w-5 mr-2" />
                    Build & Release v{getNextVersion()}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}>
                  <AlertDialogHeader>
                    <AlertDialogTitle style={{ color: colors.text.primary }}>
                      Confirm Build & Release
                    </AlertDialogTitle>
                    <AlertDialogDescription style={{ color: colors.text.secondary }}>
                      This will:
                      <ul className="list-disc ml-4 mt-2 space-y-1">
                        <li>Bump version to <strong style={{ color: colors.brand.purple }}>v{getNextVersion()}</strong></li>
                        <li>Commit the version change to main</li>
                        <li>Trigger the Windows installer build (~10-15 min)</li>
                        <li>Publish to cottage-pos-desktop releases</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel style={{ color: colors.text.secondary, borderColor: colors.border.light }}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleBuildRelease}
                      style={{ backgroundColor: colors.brand.purple, color: 'white' }}>
                      <Rocket className="h-4 w-4 mr-2" />
                      Build v{getNextVersion()}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <div className="w-full h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colors.background.tertiary }}>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" style={{ color: colors.brand.purple }} />
                <span className="text-sm" style={{ color: colors.text.secondary }}>
                  {pipelineStep === 'building' ? 'Building... (this takes 10-15 minutes)' : 'Processing...'}
                </span>
              </div>
            )}

            {/* Pipeline Progress */}
            {pipelineStep !== 'idle' && <PipelineStepper />}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card style={cardStyle}>
          <CardContent className="pt-6">
            <Alert style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.light }}>
              <Clock className="h-4 w-4" style={{ color: colors.text.secondary }} />
              <AlertDescription className="text-sm" style={{ color: colors.text.secondary }}>
                <strong>Web deployments are automatic.</strong> When you push to main, Vercel builds and deploys the web app within 2-3 minutes.
                This page is for building the Electron POS desktop installer.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
