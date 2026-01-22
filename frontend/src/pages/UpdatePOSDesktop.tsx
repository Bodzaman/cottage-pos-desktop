import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Rocket, GitBranch, Package, AlertCircle, CheckCircle2, Clock, Download, Settings, ExternalLink, Monitor, RefreshCw, GitCommit, Printer, Layers, Map, FileCode2, FolderSync } from 'lucide-react';
import brain from 'brain';
import { colors, cardStyle } from '../utils/designSystem';
import { globalColors } from '../utils/QSAIDesign';
import {
  SyncFileResult,
  AnalyzeDependenciesResponse,
  UpdateFileMappingResponse,
} from '../brain/data-contracts';

// Types not in data-contracts - defined locally
interface SyncPOSUIRequest {
  include_full_bundle?: boolean;
  target_path?: string;
}

interface SyncPOSUIResponse {
  success: boolean;
  files_synced?: number;
  files_result?: SyncFileResult[];
  error?: string;
}

interface GetCurrentMappingResponse {
  success: boolean;
  mappings?: Record<string, string>;
  error?: string;
}

interface VersionInfo {
  current_version: string;
  next_patch_version: string;
  next_minor_version: string;
  next_major_version: string;
  has_releases: boolean;
}

interface ReleaseDownloadInfo {
  success: boolean;
  version?: string;
  windows_exe_url?: string;
  windows_exe_name?: string;
  release_url?: string;
  release_name?: string;
  published_at?: string;
  is_building?: boolean;
  error_message?: string;
  checksum?: string;
  download_url?: string;
  release_notes?: string;
}

interface SyncStatus {
  step: 'idle' | 'syncing' | 'creating_release' | 'building' | 'complete' | 'error';
  message: string;
  details?: string[];
  filesResult?: SyncFileResult[];
  progress?: number;
}

export default function UpdatePOSDesktop() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [versionIncrement, setVersionIncrement] = useState<'patch' | 'minor' | 'major'>('patch');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [updateStatus, setUpdateStatus] = useState<{
    step: 'idle' | 'extracting' | 'creating' | 'building' | 'complete' | 'error';
    message: string;
    details?: string[];
  }>({
    step: 'idle',
    message: ''
  });
  const [syncResults, setSyncResults] = useState<any>(null);
  const [lastSyncResult, setLastSyncResult] = useState<SyncPOSUIResponse | null>(null);

  // MAP Dependencies state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeDependenciesResponse | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, boolean>>({});
  const [isApplyingMapping, setIsApplyingMapping] = useState(false);
  const [isMappingComplete, setIsMappingComplete] = useState(false);

  // Sync type state (UI only vs Full Bundle)
  const [syncType, setSyncType] = useState<'ui-only' | 'full-bundle'>('ui-only');

  // Missing state declarations - added for type safety
  const [downloadInfo, setDownloadInfo] = useState<ReleaseDownloadInfo | null>(null);
  const [downloadInfoLoading, setDownloadInfoLoading] = useState(false);
  const [lastReleaseData, setLastReleaseData] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ step: 'idle', message: '' });

  // Load version information and download info on component mount
  useEffect(() => {
    loadVersionInfo();
    loadDownloadInfo();
  }, []);

  const loadVersionInfo = async () => {
    try {
      const response = await brain.get_pos_desktop_version();
      const data = await response.json();
      // Fix: Use data directly instead of data.version_info
      if (data.success) {
        setVersionInfo({
          current_version: data.current_version || 'Unknown',
          latest_version: data.latest_version || 'Unknown',
          needs_update: data.needs_update || false
        });
      } else {
        toast.error('Failed to load version information: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to load version info:', error);
      toast.error('Failed to load version information');
    }
  };

  const loadDownloadInfo = async () => {
    setDownloadInfoLoading(true);
    try {
      const response = await brain.get_latest_pos_release();
      const data = await response.json();
      
      // Transform GitHub release data to match expected format
      const installer = data.assets.find((asset: any) => asset.name.endsWith('.exe'));
      
      setDownloadInfo({
        success: true,
        version: data.tag_name || 'Unknown',
        download_url: installer?.browser_download_url || '',
        release_notes: data.body || ''
      });
    } catch (error) {
      console.error('Failed to load download info:', error);
      setDownloadInfo({
        success: false,
        error_message: 'Failed to load release information'
      });
    } finally {
      setDownloadInfoLoading(false);
    }
  };

  const getNextVersionPreview = (): string => {
    if (!versionInfo) return 'Loading...';
    
    // Use API-provided next version instead of calculating
    switch (versionIncrement) {
      case 'major':
        return versionInfo.next_major_version || 'N/A';
      case 'minor':
        return versionInfo.next_minor_version || 'N/A';
      case 'patch':
      default:
        return versionInfo.next_patch_version || 'N/A';
    }
  };

  const handleUpdatePOSDesktop = async () => {
    setIsLoading(true);
    setUpdateStatus({ step: 'extracting', message: 'Extracting POS Desktop code...' });
    
    try {
      const requestBody = {
        version_increment: versionIncrement,
        release_notes: releaseNotes || undefined
      };

      setUpdateStatus({ step: 'creating', message: 'Creating GitHub release...' });

      const response = await brain.create_release(requestBody as any);
      const result = await response.json() as any;

      if (result.success) {
        setLastReleaseData(result);

        // Show completion after a brief delay
        setTimeout(() => {
          setUpdateStatus({
            step: 'complete',
            message: 'Update complete!'
          });

          // Reload version info to show updated current version
          loadVersionInfo();
        }, 2000);

        toast.success('POS Desktop update completed successfully!');
      } else {
        throw new Error(result.error || 'Update failed');
      }
    } catch (error) {
      console.error('Update failed:', error);
      setUpdateStatus({
        step: 'error',
        message: 'Update failed'
      });
      toast.error('Failed to update POS Desktop');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncOnly = async () => {
    setIsSyncing(true);
    const isFullBundle = syncType === 'full-bundle';
    const syncTypeLabel = isFullBundle ? 'Full POS Bundle' : 'POS UI';
    setSyncStatus({ step: 'syncing', message: `Starting ${syncTypeLabel} sync to GitHub...`, progress: 10 });

    try {
      const requestBody = {
        commit_message: isFullBundle
          ? 'chore: sync full POS bundle (UI + Electron)'
          : 'chore: sync POS Desktop UI changes',
        file_filter: null,
        create_release: false,
        full_bundle: isFullBundle
      };

      setSyncStatus({ step: 'syncing', message: `Syncing ${syncTypeLabel}...` });

      const response = await brain.sync_pos_files(requestBody);
      const data = await response.json() as any;

      if (data.success) {
        setLastSyncResult(data);
        setSyncStatus({ step: 'complete', message: 'Sync complete!' });
        toast.success(`${syncTypeLabel} synced to GitHub successfully!`);
      } else {
        throw new Error(data.errors?.[0] || data.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus({
        step: 'error',
        message: 'Sync failed'
      });
      toast.error(`Failed to sync ${syncTypeLabel}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncAndRelease = async () => {
    // Validate required fields
    if (!versionIncrement) {
      setSyncStatus({ step: 'error', message: 'Please select a version increment (Patch, Minor, or Major)', progress: 0 });
      return;
    }

    if (!releaseNotes?.trim()) {
      setSyncStatus({ step: 'error', message: 'Please provide release notes before syncing & releasing', progress: 0 });
      return;
    }

    setIsSyncing(true);
    const isFullBundle = syncType === 'full-bundle';
    const syncTypeLabel = isFullBundle ? 'Full POS Bundle' : 'POS UI';
    setSyncStatus({ step: 'syncing', message: `Syncing ${syncTypeLabel} and creating release...`, progress: 20 });

    try {
      const requestBody = {
        commit_message: isFullBundle
          ? `chore: sync full POS bundle (UI + Electron) (${versionIncrement})`
          : `chore: sync POS Desktop UI changes (${versionIncrement})`,
        file_filter: null,
        create_release: true,
        version_increment: versionIncrement,
        release_notes: releaseNotes,
        full_bundle: isFullBundle
      };

      const response = await brain.sync_pos_files(requestBody);
      const data = await response.json() as any;

      if (data.success) {
        // Show building status
        setTimeout(() => {
          setSyncStatus({
            step: 'building',
            message: 'Building release...'
          });
        }, 1000);

        // Show completion
        setTimeout(() => {
          setSyncStatus({
            step: 'complete',
            message: 'Sync & Release complete!'
          });

          setLastSyncResult(data);
          setLastReleaseData(data.release_data);

          // Reload version and download info
          loadVersionInfo();
          loadDownloadInfo();
        }, 2000);

        toast.success(`${syncTypeLabel} Sync & Release completed successfully!`);
      } else {
        throw new Error(data.errors?.[0] || data.error || 'Sync & Release failed');
      }
    } catch (error) {
      console.error('Sync & Release failed:', error);
      setSyncStatus({
        step: 'error',
        message: 'Sync & Release failed'
      });
      toast.error(`Failed to sync & release ${syncTypeLabel}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // MAP button handlers
  const handleAnalyzeDependencies = async () => {
    setIsAnalyzing(true);
    try {
      const response = await brain.analyze_pos_dependencies();
      const result: AnalyzeDependenciesResponse = await response.json();
      
      if (result.success) {
        setAnalysisResult(result);
        
        // Pre-select all unmapped files
        const initialSelection: Record<string, boolean> = {};
        result.unmapped.forEach((file) => {
          const key = file.databutton_path || '';
          if (key) {
            initialSelection[key] = true;
          }
        });
        setSelectedFiles(initialSelection);
        
        // Show modal
        setShowMappingModal(true);
        
        if (result.unmapped.length === 0) {
          toast.success('All dependencies already mapped! ✅');
        } else {
          toast.info(`Found ${result.unmapped.length} unmapped dependencies`);
        }
      } else {
        toast.error(result.message || 'Failed to analyze dependencies');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Failed to analyze dependencies');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleFile = (databuttonPath: string) => {
    setSelectedFiles(prev => ({
      ...prev,
      [databuttonPath]: !prev[databuttonPath]
    }));
  };

  const handleApplyMapping = async () => {
    if (!analysisResult) return;
    
    setIsApplyingMapping(true);
    try {
      // Filter to only selected files
      const filesToAdd = analysisResult.unmapped
        .filter(file => selectedFiles[file.databutton_path || ''])
        .map(file => ({
          databutton_path: file.databutton_path || '',
          github_path: file.github_path || ''
        }));
      
      if (filesToAdd.length === 0) {
        toast.warning('No files selected to map');
        return;
      }
      
      const response = await brain.update_file_mapping({ files_to_add: filesToAdd });
      const result: UpdateFileMappingResponse = await response.json();
      
      if (result.success) {
        toast.success(`✅ Successfully mapped ${result.added_count} files! Total: ${result.new_total}`);
        setIsMappingComplete(true);
        setShowMappingModal(false);
        
        // Reset state
        setAnalysisResult(null);
        setSelectedFiles({});
      } else {
        toast.error(result.message || 'Failed to update mapping');
      }
    } catch (error) {
      console.error('Mapping update failed:', error);
      toast.error('Failed to update file mapping');
    } finally {
      setIsApplyingMapping(false);
    }
  };

  const getProgressValue = () => {
    switch (updateStatus.step) {
      case 'idle': return 0;
      case 'extracting': return 25;
      case 'creating': return 50;
      case 'building': return 75;
      case 'complete': return 100;
      case 'error': return 0;
      default: return 0;
    }
  };

  const getStatusIcon = () => {
    switch (updateStatus.step) {
      case 'complete':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'extracting':
      case 'creating':
      case 'building':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Rocket className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (updateStatus.step) {
      case 'complete': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'extracting':
      case 'creating':
      case 'building': return 'text-blue-600';
      default: return 'text-gray-600';
    }
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
        {/* Header with Navigation */}
        <div className="flex items-center justify-between">
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
                  Create new GitHub release with latest POS code
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sync POS UI Card */}
          <Card style={cardStyle}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5" style={{ color: colors.brand.purple }} />
                <span>Sync POS UI</span>
              </CardTitle>
              <CardDescription style={{ color: colors.text.secondary }}>
                One-click sync latest POS UI files to GitHub and create release
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 1: MAP Dependencies */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold" style={{ color: colors.text.primary }}>Step 1: Map Dependencies</h4>
                  {isMappingComplete && (
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={handleAnalyzeDependencies}
                  disabled={isAnalyzing}
                  className="w-full"
                  variant="outline"
                  style={{ 
                    borderColor: colors.brand.purple,
                    color: isMappingComplete ? colors.brand.turquoise : colors.text.primary,
                    backgroundColor: colors.background.tertiary
                  }}
                >
                  {isAnalyzing ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Map className="h-4 w-4 mr-2" />
                      {isMappingComplete ? '✅ Mapping Complete - Re-analyze' : '🗺️ MAP Dependencies'}
                    </>
                  )}
                </Button>
                <p className="text-xs" style={{ color: colors.text.secondary }}>
                  💡 Auto-discover missing files before syncing
                </p>
              </div>

              <Separator style={{ backgroundColor: colors.border.light }} />

              {/* Step 2: Select Sync Type */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold" style={{ color: colors.text.primary }}>Step 2: Select Sync Type</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      syncType === 'ui-only' ? 'border-purple-500 bg-purple-500/10' : 'border-transparent hover:border-purple-500/50'
                    }`}
                    style={{ backgroundColor: syncType === 'ui-only' ? colors.brand.purple + '15' : colors.background.tertiary }}
                    onClick={() => setSyncType('ui-only')}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <RefreshCw className="h-4 w-4" style={{ color: syncType === 'ui-only' ? colors.brand.purple : colors.text.secondary }} />
                      <span className="font-medium text-sm" style={{ color: syncType === 'ui-only' ? colors.brand.purple : colors.text.primary }}>
                        UI Only
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: colors.text.secondary }}>
                      Sync frontend UI components only (faster)
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      syncType === 'full-bundle' ? 'border-purple-500 bg-purple-500/10' : 'border-transparent hover:border-purple-500/50'
                    }`}
                    style={{ backgroundColor: syncType === 'full-bundle' ? colors.brand.purple + '15' : colors.background.tertiary }}
                    onClick={() => setSyncType('full-bundle')}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <FolderSync className="h-4 w-4" style={{ color: syncType === 'full-bundle' ? colors.brand.purple : colors.text.secondary }} />
                      <span className="font-medium text-sm" style={{ color: syncType === 'full-bundle' ? colors.brand.purple : colors.text.primary }}>
                        Full Bundle
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: colors.text.secondary }}>
                      UI + Electron files (main.js, preload.js, etc.)
                    </p>
                  </div>
                </div>
                {syncType === 'full-bundle' && (
                  <Alert style={{ backgroundColor: colors.brand.turquoise + '10', borderColor: colors.brand.turquoise }}>
                    <Package className="h-4 w-4" style={{ color: colors.brand.turquoise }} />
                    <AlertDescription style={{ color: colors.text.secondary }}>
                      <strong>Full Bundle</strong> includes: main.js, preload.js, settings-preload.js, settings.html, vite.config.ts, package.json
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator style={{ backgroundColor: colors.border.light }} />

              {/* Step 3: Sync to GitHub */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold" style={{ color: colors.text.primary }}>Step 3: Sync to GitHub</h4>
                {!isMappingComplete && (
                  <Alert style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.light }}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription style={{ color: colors.text.secondary }}>
                      Please MAP dependencies first to ensure complete sync
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Version Increment Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                    Version Increment Type
                  </Label>
                  <Select value={versionIncrement} onValueChange={(value: 'patch' | 'minor' | 'major') => setVersionIncrement(value)}>
                    <SelectTrigger style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.light }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patch">Patch (Bug fixes) - v{versionInfo?.next_patch_version || '...'}</SelectItem>
                      <SelectItem value="minor">Minor (New features) - v{versionInfo?.next_minor_version || '...'}</SelectItem>
                      <SelectItem value="major">Major (Breaking changes) - v{versionInfo?.next_major_version || '...'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Release Notes */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                    Release Notes
                  </Label>
                  <Textarea
                    placeholder="Describe the changes in this release..."
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
                
                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button
                    onClick={handleSyncAndRelease}
                    disabled={isSyncing || !versionInfo}
                    className="flex-1"
                    style={{ 
                      backgroundColor: colors.brand.purple,
                      color: 'white'
                    }}
                  >
                    {isSyncing && syncStatus.step !== 'idle' ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Sync & Release...
                      </>
                    ) : (
                      <>
                        <GitCommit className="h-4 w-4 mr-2" />
                        Sync & Release
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleSyncOnly}
                    disabled={isSyncing}
                    variant="outline"
                    className="flex-1"
                    style={{ borderColor: colors.border.light, color: colors.text.secondary }}
                  >
                    {isSyncing && syncStatus.step === 'syncing' ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Only
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Sync Progress */}
                {syncStatus.step !== 'idle' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: colors.text.secondary }}>Sync Progress</span>
                      <span className="text-sm" style={{ color: colors.text.secondary }}>{syncStatus.progress || 0}%</span>
                    </div>
                    <Progress value={syncStatus.progress || 0} className="w-full" />
                    
                    <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
                      {syncStatus.step === 'complete' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : syncStatus.step === 'error' ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-blue-500 animate-spin" />
                      )}
                      <div>
                        <p className={`font-medium ${
                          syncStatus.step === 'complete' ? 'text-green-600' :
                          syncStatus.step === 'error' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {syncStatus.message}
                        </p>
                        {syncStatus.details && (
                          <div className="mt-2 space-y-1">
                            {syncStatus.details.map((detail, index) => (
                              <div key={index} className="flex items-center space-x-2 text-sm">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                <span style={{ color: colors.text.secondary }}>{detail}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* File Sync Results */}
                    {syncStatus.filesResult && syncStatus.filesResult.length > 0 && (
                      <details className="text-sm">
                        <summary className="cursor-pointer font-medium mb-2" style={{ color: colors.text.secondary }}>
                          📁 File Sync Details ({syncStatus.filesResult.length} files)
                        </summary>
                        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                          {syncStatus.filesResult.map((file, index) => (
                            <div key={index} className="flex items-center space-x-2 text-xs p-2 rounded" style={{ backgroundColor: colors.background.tertiary }}>
                              {file.status === 'success' ? (
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                              ) : file.status === 'error' ? (
                                <AlertCircle className="h-3 w-3 text-red-500" />
                              ) : (
                                <Clock className="h-3 w-3 text-yellow-500" />
                              )}
                              <span className="font-mono flex-1" style={{ color: colors.text.primary }}>
                                {file.file_path}
                              </span>
                              <Badge 
                                variant={file.status === 'success' ? 'secondary' : 'destructive'}
                                className={`text-xs ${
                                  file.status === 'success' ? 'bg-green-500/20 text-green-300' :
                                  file.status === 'error' ? 'bg-red-500/20 text-red-300' :
                                  'bg-yellow-500/20 text-yellow-300'
                                }`}
                              >
                                {file.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
                
                {/* How it works */}
                <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: colors.background.tertiary + '50' }}>
                  <h4 className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>💡 How it works:</h4>
                  <ol className="text-xs space-y-1" style={{ color: colors.text.secondary }}>
                    <li>1. <strong>MAP</strong>: Discover and add missing file dependencies</li>
                    <li>2. <strong>Select</strong>: Choose UI Only (fast) or Full Bundle (includes Electron)</li>
                    <li>3. <strong>Sync</strong>: Updates GitHub repo with selected files</li>
                    <li>4. <strong>Release</strong>: Creates new version tag and GitHub release</li>
                    <li>5. <strong>Build</strong>: GitHub Actions builds new desktop installer</li>
                    <li>6. <strong>Auto-update</strong>: Existing apps detect and install update</li>
                  </ol>
                  {syncType === 'full-bundle' && (
                    <div className="mt-2 pt-2 border-t" style={{ borderColor: colors.border.light }}>
                      <p className="text-xs font-medium" style={{ color: colors.brand.turquoise }}>
                        📦 Full Bundle includes Electron files for USB thermal printing
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Download POS Desktop Card */}
          <Card style={cardStyle}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Layers className="h-5 w-5" style={{ color: colors.brand.purple }} />
                <span>Combined Installer</span>
              </CardTitle>
              <CardDescription style={{ color: colors.text.secondary }}>
                Download the all-in-one Windows installer (POS Desktop + Printer Service)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {downloadInfoLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" style={{ backgroundColor: colors.background.tertiary }} />
                  <Skeleton className="h-10 w-full" style={{ backgroundColor: colors.background.tertiary }} />
                  <Skeleton className="h-4 w-1/2" style={{ backgroundColor: colors.background.tertiary }} />
                </div>
              ) : downloadInfo?.success ? (
                <div className="space-y-4">
                  {downloadInfo.is_building ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-yellow-500">
                        <Clock className="h-4 w-4 animate-spin" />
                        <span className="text-sm font-medium">Building... please wait</span>
                      </div>
                      <Button 
                        disabled 
                        className="w-full"
                        style={{ backgroundColor: colors.background.tertiary, color: colors.text.secondary }}
                      >
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Building latest version...
                      </Button>
                      <p className="text-xs" style={{ color: colors.text.secondary }}>
                        The installer is being built. Please check back in a few minutes.
                      </p>
                    </div>
                  ) : downloadInfo.windows_exe_url ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
                        <div>
                          <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>Latest Version</p>
                          <p className="text-lg font-bold" style={{ color: colors.brand.purple }}>
                            v{downloadInfo.version}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                          Available
                        </Badge>
                      </div>
                      
                      <Button 
                        onClick={() => window.open(downloadInfo.windows_exe_url, '_blank')}
                        className="w-full"
                        style={{ backgroundColor: colors.brand.purple, color: 'white' }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Combined Installer (v{downloadInfo.version})
                      </Button>
                      
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(downloadInfo.release_url, '_blank')}
                        className="w-full"
                        style={{ borderColor: colors.border.light, color: colors.text.secondary }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View release on GitHub
                      </Button>
                      
                      <div className="text-xs" style={{ color: colors.text.secondary }}>
                        <p className="font-medium mb-2">📦 What's Included:</p>
                        <div className="space-y-1 ml-2">
                          <div className="flex items-center space-x-2">
                            <Monitor className="h-3 w-3" style={{ color: colors.brand.purple }} />
                            <span>POS Desktop Application (Electron)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Printer className="h-3 w-3" style={{ color: colors.brand.purple }} />
                            <span>Thermal Printer Service (Node.js + NSSM)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            <span>Auto-start on boot</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            <span>Auto-restart on failure</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg" style={{ backgroundColor: colors.background.tertiary + '50' }}>
                        <p className="text-xs font-medium mb-1" style={{ color: colors.text.secondary }}>💡 Installation Note:</p>
                        <p className="text-xs" style={{ color: colors.text.secondary }}>
                          Only needed for first install. The POS app auto‑updates afterwards. The printer service runs as a Windows service in the background.
                        </p>
                      </div>
                      
                      {downloadInfo.checksum && (
                        <details className="text-xs" style={{ color: colors.text.secondary }}>
                          <summary className="cursor-pointer font-medium mb-1">🔒 Verify download (optional)</summary>
                          <div className="mt-2 p-2 rounded" style={{ backgroundColor: colors.background.tertiary }}>
                            <p className="font-mono break-all">{downloadInfo.checksum}</p>
                          </div>
                        </details>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Installer not found</span>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => window.open(downloadInfo.release_url, '_blank')}
                        className="w-full"
                        style={{ borderColor: colors.border.light, color: colors.text.secondary }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View release on GitHub
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Alert style={{ backgroundColor: colors.background.tertiary + '80', borderColor: 'rgb(239 68 68)' }}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription style={{ color: colors.text.primary }}>
                      {downloadInfo?.error_message || 'Failed to load download information'}
                    </AlertDescription>
                  </Alert>
                  <Button 
                    variant="outline"
                    onClick={loadDownloadInfo}
                    className="w-full"
                    style={{ borderColor: colors.border.light, color: colors.text.secondary }}
                  >
                    Try again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Version Information Card */}
          <Card style={cardStyle}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GitBranch className="h-5 w-5" style={{ color: colors.brand.purple }} />
                <span>Version Information</span>
              </CardTitle>
              <CardDescription style={{ color: colors.text.secondary }}>
                Current release status and next version preview
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Version */}
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>Current Version</p>
                  <p className="text-lg font-bold" style={{ color: colors.text.primary }}>
                    {versionInfo?.current_version || 'Loading...'}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                  Live
                </Badge>
              </div>

              {/* Next Version Preview */}
              <div className="space-y-3">
                <Label className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                  Version Increment Type
                </Label>
                <Select value={versionIncrement} onValueChange={(value: 'patch' | 'minor' | 'major') => setVersionIncrement(value)}>
                  <SelectTrigger style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.light }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patch">Patch (Bug fixes)</SelectItem>
                    <SelectItem value="minor">Minor (New features)</SelectItem>
                    <SelectItem value="major">Major (Breaking changes)</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>Next Version</p>
                    <p className="text-lg font-bold" style={{ color: colors.brand.purple }}>
                      {getNextVersionPreview()}
                    </p>
                  </div>
                  <Badge variant="outline" style={{ borderColor: colors.brand.purple, color: colors.brand.purple }}>
                    Preview
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Release Configuration Card */}
          <Card style={cardStyle}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" style={{ color: colors.brand.purple }} />
                <span>Release Configuration</span>
              </CardTitle>
              <CardDescription style={{ color: colors.text.secondary }}>
                Configure release notes and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                  Release Notes (Optional)
                </Label>
                <Textarea
                  placeholder="Describe the changes in this release..."
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
              
              <Button
                onClick={handleUpdatePOSDesktop}
                disabled={isLoading || !versionInfo}
                className="w-full"
                style={{ 
                  backgroundColor: colors.brand.purple,
                  color: 'white'
                }}
              >
                {isLoading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Creating Release...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Create GitHub Release
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Status and Progress Card - Full Width */}
        <Card style={cardStyle}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {getStatusIcon()}
              <span>Release Status</span>
            </CardTitle>
            <CardDescription style={{ color: colors.text.secondary }}>
              Real-time progress of the GitHub release process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: colors.text.secondary }}>Progress</span>
                <span className="text-sm" style={{ color: colors.text.secondary }}>{getProgressValue()}%</span>
              </div>
              <Progress value={getProgressValue()} className="w-full" />
            </div>

            {/* Current Status */}
            <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
              {getStatusIcon()}
              <div>
                <p className={`font-medium ${getStatusColor()}`}>{updateStatus.message}</p>
                {updateStatus.step !== 'idle' && (
                  <p className="text-sm" style={{ color: colors.text.secondary }}>
                    {updateStatus.step === 'extracting' && 'Packaging POS Desktop code for release...'}
                    {updateStatus.step === 'creating' && 'Setting up GitHub release and triggering build...'}
                    {updateStatus.step === 'building' && 'GitHub Actions building desktop application...'}
                    {updateStatus.step === 'complete' && 'Release published and ready for download!'}
                    {updateStatus.step === 'error' && 'Please try again or contact support.'}
                  </p>
                )}
              </div>
            </div>

            {/* Detailed Steps */}
            {updateStatus.details && updateStatus.details.length > 0 && (
              <div className="space-y-2">
                <Separator style={{ backgroundColor: colors.border.light }} />
                <h4 className="text-sm font-medium" style={{ color: colors.text.secondary }}>Completed Steps:</h4>
                <div className="space-y-2">
                  {updateStatus.details.map((detail, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span style={{ color: colors.text.primary }}>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Download Link */}
            {updateStatus.step === 'complete' && lastReleaseData?.release_url && (
              <Alert style={{ backgroundColor: colors.background.tertiary + '80', borderColor: colors.brand.purple }}>
                <Download className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span style={{ color: colors.text.primary }}>Release created successfully!</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(lastReleaseData.release_url, '_blank')}
                      style={{ borderColor: colors.brand.purple, color: colors.brand.purple }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      View on GitHub
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mapping Discovery Modal */}
      <MappingDiscoveryModal
        open={showMappingModal}
        onClose={() => setShowMappingModal(false)}
        analysisResult={analysisResult}
        selectedFiles={selectedFiles}
        onToggleFile={handleToggleFile}
        onApplyMapping={handleApplyMapping}
        isApplying={isApplyingMapping}
      />
    </div>
  );
}

// Mapping Discovery Modal Component
interface MappingDiscoveryModalProps {
  open: boolean;
  onClose: () => void;
  analysisResult: AnalyzeDependenciesResponse | null;
  selectedFiles: Record<string, boolean>;
  onToggleFile: (path: string) => void;
  onApplyMapping: () => void;
  isApplying: boolean;
}

function MappingDiscoveryModal({
  open,
  onClose,
  analysisResult,
  selectedFiles,
  onToggleFile,
  onApplyMapping,
  isApplying
}: MappingDiscoveryModalProps) {
  if (!analysisResult) return null;

  const selectedCount = Object.values(selectedFiles).filter(Boolean).length;
  const totalUnmapped = analysisResult.unmapped.length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
        style={{ 
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.purple,
          color: colors.text.primary
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <Map className="h-6 w-6" style={{ color: colors.brand.purple }} />
            <span>🗺️ Dependency Mapping Discovery</span>
          </DialogTitle>
          <DialogDescription style={{ color: colors.text.secondary }}>
            {totalUnmapped === 0 
              ? '✅ All dependencies are already mapped!' 
              : `Found ${totalUnmapped} new files to map. Select which to include in the sync.`
            }
          </DialogDescription>
        </DialogHeader>

        {totalUnmapped > 0 && (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4 p-4 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
              <div>
                <p className="text-xs" style={{ color: colors.text.secondary }}>Found</p>
                <p className="text-2xl font-bold" style={{ color: colors.brand.purple }}>{totalUnmapped}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: colors.text.secondary }}>Selected</p>
                <p className="text-2xl font-bold" style={{ color: colors.brand.turquoise }}>{selectedCount}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: colors.text.secondary }}>Coverage After</p>
                <p className="text-2xl font-bold" style={{ color: colors.brand.turquoise }}>
                  {Math.round((analysisResult.already_mapped.length + selectedCount) / analysisResult.total_imports * 100)}%
                </p>
              </div>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto space-y-2 p-4" style={{ backgroundColor: colors.background.primary }}>
              {analysisResult.unmapped.map((file) => {
                const databuttonPath = file.databutton_path || '';
                const githubPath = file.github_path || '';
                const isComponent = databuttonPath.includes('/components/');
                
                return (
                  <div
                    key={databuttonPath}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                    style={{ backgroundColor: colors.background.tertiary }}
                    onClick={() => onToggleFile(databuttonPath)}
                  >
                    <Checkbox
                      checked={selectedFiles[databuttonPath] || false}
                      onCheckedChange={() => onToggleFile(databuttonPath)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {isComponent ? (
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                            🧩 Component
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                            ⚙️ Util
                          </Badge>
                        )}
                        <FileCode2 className="h-4 w-4" style={{ color: colors.text.secondary }} />
                      </div>
                      <p className="text-sm font-mono mt-1 truncate" style={{ color: colors.text.primary }}>
                        {databuttonPath.split('/').pop()}
                      </p>
                      <p className="text-xs font-mono mt-1 truncate" style={{ color: colors.text.secondary }}>
                        → {githubPath}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t" style={{ borderColor: colors.border.light }}>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isApplying}
                style={{ borderColor: colors.border.light }}
              >
                Cancel
              </Button>
              <Button
                onClick={onApplyMapping}
                disabled={selectedCount === 0 || isApplying}
                style={{ 
                  backgroundColor: colors.brand.purple,
                  color: 'white'
                }}
              >
                {isApplying ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Apply Mapping ({selectedCount})
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {totalUnmapped === 0 && (
          <div className="text-center py-8">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-semibold" style={{ color: colors.text.primary }}>All Set!</p>
            <p className="text-sm mt-2" style={{ color: colors.text.secondary }}>
              Current mapping: {analysisResult.already_mapped.length} files ({analysisResult.total_coverage}% coverage)
            </p>
            <Button
              onClick={onClose}
              className="mt-4"
              style={{ 
                backgroundColor: colors.brand.purple,
                color: 'white'
              }}
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
