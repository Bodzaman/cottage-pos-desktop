import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ImageIcon,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { MediaItem, getSmartDisplayName, deleteMedia } from '../utils/mediaLibraryUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { extractApiError, isNotFoundError, getErrorMessage } from '../utils/apiErrorHandler';

interface AssetUsageInfo {
  id: string;
  name: string;
  friendlyName?: string;
  isUsed: boolean;
  usageCount: number;
  linkedItems: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  notFound?: boolean; // Asset doesn't exist in database (404)
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedAssets: MediaItem[];
  availableAssets: MediaItem[];
  onSuccess: () => void;
}

type BulkAction = 'replace' | 'remove' | 'skip';

/**
 * SmartBulkDeleteDialog - Handles batch deletion with usage awareness
 * 
 * Features:
 * - Analyzes all selected assets for usage
 * - Groups into: unused (safe) vs used (needs action)
 * - For used assets: batch replace or batch remove references
 * - Processes deletions with progress tracking
 */
export const SmartBulkDeleteDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  selectedAssets,
  availableAssets,
  onSuccess,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [usageData, setUsageData] = useState<Map<string, AssetUsageInfo>>(new Map());
  const [error, setError] = useState<string | null>(null);
  
  const [selectedAction, setSelectedAction] = useState<BulkAction>('remove');
  const [selectedReplacementId, setSelectedReplacementId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);

  // Analyze all selected assets when dialog opens
  useEffect(() => {
    if (isOpen && selectedAssets.length > 0) {
      analyzeAllAssets();
    } else {
      resetState();
    }
  }, [isOpen, selectedAssets]);

  const resetState = () => {
    setUsageData(new Map());
    setError(null);
    setSelectedAction('remove');
    setSelectedReplacementId('');
    setIsProcessing(false);
    setProcessedCount(0);
  };

  const analyzeAllAssets = async () => {
    setIsAnalyzing(true);
    setError(null);
    const newUsageData = new Map<string, AssetUsageInfo>();

    try {
      // Check usage for each asset
      for (const asset of selectedAssets) {
        try {
          const response = await apiClient.get_asset_usage({ assetId: asset.id });
          
          // Handle 404 - asset doesn't exist
          if (response.status === 404) {
            console.warn(`Asset ${asset.id} not found (404) - treating as already deleted`);
            newUsageData.set(asset.id, {
              id: asset.id,
              name: asset.name,
              friendlyName: asset.friendlyName,
              isUsed: false,
              usageCount: 0,
              linkedItems: [],
              canDelete: true,
              status: 'not_found'
            });
            continue;
          }

          const data = await response.json();

          newUsageData.set(asset.id, {
            id: asset.id,
            name: asset.name,
            friendlyName: asset.friendlyName,
            isUsed: data.is_used || false,
            usageCount: data.usage_count || 0,
            linkedItems: data.linked_items || [],
            notFound: false,
          });
        } catch (err: any) {
          console.error(`Failed to check usage for ${asset.id}:`, err);
          
          // Check if it's a 404 error from the catch block
          if (err?.status === 404 || err?.error?.status === 404) {
            console.warn(`Asset ${asset.id} not found (404 in catch) - treating as already deleted`);
            newUsageData.set(asset.id, {
              id: asset.id,
              name: asset.name,
              friendlyName: asset.friendlyName,
              isUsed: false,
              usageCount: 0,
              linkedItems: [],
              notFound: true,
            });
          } else {
            // Unknown error - mark as potentially used to be safe
            newUsageData.set(asset.id, {
              id: asset.id,
              name: asset.name,
              friendlyName: asset.friendlyName,
              isUsed: true, // Assume used to be safe
              usageCount: 0,
              linkedItems: [],
              notFound: false,
            });
          }
        }
      }

      setUsageData(newUsageData);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze assets');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setProcessedCount(0);
    
    // Detailed result tracking
    const results = {
      deleted: 0,
      failed: 0,
      skippedNotFound: 0,
      skippedInUse: 0,
      referencesHandled: 0,
    };

    try {
      // ═══════════════════════════════════════════════════════════
      // CATEGORIZE ASSETS
      // ═══════════════════════════════════════════════════════════
      const allAssets = Array.from(usageData.values());
      const usedAssets = allAssets.filter(a => a.isUsed && !a.notFound);
      const unusedAssets = allAssets.filter(a => !a.isUsed && !a.notFound);
      const notFoundAssets = allAssets.filter(a => a.notFound);

      console.log('📊 Asset Categories:', {
        total: allAssets.length,
        used: usedAssets.length,
        unused: unusedAssets.length,
        notFound: notFoundAssets.length,
      });

      // ═══════════════════════════════════════════════════════════
      // PHASE 1: SKIP NOT FOUND ASSETS
      // ═══════════════════════════════════════════════════════════
      results.skippedNotFound = notFoundAssets.length;
      if (notFoundAssets.length > 0) {
        console.log(`⏭️  Skipping ${notFoundAssets.length} assets that don't exist in database`);
      }

      // ═══════════════════════════════════════════════════════════
      // PHASE 2: HANDLE USED ASSETS (REPLACE OR REMOVE REFERENCES)
      // ═══════════════════════════════════════════════════════════
      if (usedAssets.length > 0) {
        if (selectedAction === 'replace' && selectedReplacementId) {
          // Replace all references with new asset
          console.log(`🔄 Replacing ${usedAssets.length} assets with new asset...`);
          
          for (const asset of usedAssets) {
            try {
              const replaceResponse = await apiClient.replace_asset_in_menu_items({
                old_asset_id: asset.id,
                new_asset_id: selectedReplacementId,
              });
              const replaceData = await replaceResponse.json();
              
              if (!replaceData.success) {
                throw new Error(replaceData.message || 'Replace failed');
              }
              
              results.referencesHandled++;
              setProcessedCount(prev => prev + 1);
            } catch (err: any) {
              console.error(`❌ Failed to replace references for ${asset.id}:`, err);
              results.failed++;
            }
          }
        } else if (selectedAction === 'remove') {
          // Remove all references before deletion
          console.log(`🗑️  Removing references from ${usedAssets.length} assets...`);
          
          for (const asset of usedAssets) {
            try {
              const removeResponse = await apiClient.remove_asset_references({
                asset_id: asset.id,
              });
              const removeData = await removeResponse.json();
              
              if (!removeData.success) {
                console.warn(`⚠️  Warning: Failed to remove references for ${asset.id}:`, removeData.message);
              } else {
                results.referencesHandled++;
              }
              
              setProcessedCount(prev => prev + 1);
            } catch (err: any) {
              console.warn(`⚠️  Warning: Failed to remove references for ${asset.id}:`, err);
            }
          }
        } else if (selectedAction === 'skip') {
          // User chose to skip used assets
          results.skippedInUse = usedAssets.length;
          console.log(`⏭️  Skipping ${usedAssets.length} assets that are in use`);
        }
      }

      // ═══════════════════════════════════════════════════════════
      // PHASE 3: DELETE ASSETS
      // ═══════════════════════════════════════════════════════════
      // Determine which assets to delete based on user action
      let assetsToDelete: AssetUsageInfo[] = [];
      
      if (selectedAction === 'skip') {
        // Only delete unused assets
        assetsToDelete = unusedAssets;
      } else {
        // Delete both used (after handling refs) and unused assets
        // But NEVER delete notFound assets
        assetsToDelete = [...usedAssets, ...unusedAssets];
      }

      console.log(`🗑️  Deleting ${assetsToDelete.length} assets...`);

      for (const asset of assetsToDelete) {
        try {
          await deleteMedia(asset.id);
          results.deleted++;
          setProcessedCount(prev => prev + 1);
        } catch (err: any) {
          console.error(`❌ Failed to delete ${asset.id}:`, err);
          results.failed++;
        }
      }

      // ═══════════════════════════════════════════════════════════
      // PHASE 4: SHOW COMPREHENSIVE RESULTS
      // ═══════════════════════════════════════════════════════════
      toast.dismiss();
      
      const messages: string[] = [];
      
      if (results.deleted > 0) {
        messages.push(`✅ Deleted ${results.deleted} ${results.deleted === 1 ? 'asset' : 'assets'}`);
      }
      
      if (results.skippedNotFound > 0) {
        messages.push(`⏭️  Skipped ${results.skippedNotFound} missing ${results.skippedNotFound === 1 ? 'asset' : 'assets'}`);
      }
      
      if (results.skippedInUse > 0) {
        messages.push(`⏭️  Skipped ${results.skippedInUse} ${results.skippedInUse === 1 ? 'asset' : 'assets'} in use`);
      }
      
      if (results.failed > 0) {
        messages.push(`❌ Failed to process ${results.failed} ${results.failed === 1 ? 'asset' : 'assets'}`);
      }

      // Display results
      if (results.deleted > 0 && results.failed === 0) {
        toast.success(messages.join(' • '));
      } else if (results.deleted > 0 && results.failed > 0) {
        toast.warning(messages.join(' • '));
      } else if (results.failed > 0) {
        toast.error(messages.join(' • '));
      } else {
        toast.info(messages.join(' • ') || 'No assets were deleted');
      }

      console.log('📊 Final Results:', results);

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(`Bulk delete failed: ${err.message}`);
      console.error('💥 Bulk delete error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Categorize assets
  const usedAssets = Array.from(usageData.values()).filter(a => a.isUsed && !a.notFound);
  const unusedAssets = Array.from(usageData.values()).filter(a => !a.isUsed && !a.notFound);
  const notFoundAssets = Array.from(usageData.values()).filter(a => a.notFound);
  const totalAssets = selectedAssets.length;

  // Filter replacement options (exclude selected assets)
  const selectedIds = new Set(selectedAssets.map(a => a.id));
  const replacementOptions = availableAssets.filter(a => !selectedIds.has(a.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Bulk Delete ({totalAssets} {totalAssets === 1 ? 'Asset' : 'Assets'})
          </DialogTitle>
          <DialogDescription>
            {isAnalyzing
              ? 'Analyzing asset usage...'
              : `${usedAssets.length} in use, ${unusedAssets.length} unused`}
          </DialogDescription>
        </DialogHeader>

        {/* Analysis Phase */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            <p className="text-sm text-muted-foreground">
              Checking {totalAssets} {totalAssets === 1 ? 'asset' : 'assets'}...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results & Actions */}
        {!isAnalyzing && !error && usageData.size > 0 && (
          <Tabs defaultValue="summary" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="used">
                In Use ({usedAssets.length})
              </TabsTrigger>
              <TabsTrigger value="unused">
                Unused ({unusedAssets.length})
              </TabsTrigger>
              <TabsTrigger value="notfound">
                Not Found ({notFoundAssets.length})
              </TabsTrigger>
            </TabsList>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-4 flex-1 overflow-auto">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <h4 className="font-semibold text-green-400">Unused Assets</h4>
                  </div>
                  <p className="text-2xl font-bold text-green-300">{unusedAssets.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Safe to delete immediately</p>
                </div>

                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <h4 className="font-semibold text-orange-400">In Use</h4>
                  </div>
                  <p className="text-2xl font-bold text-orange-300">{usedAssets.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Requires action before deletion</p>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                    <h4 className="font-semibold text-blue-400">Not Found</h4>
                  </div>
                  <p className="text-2xl font-bold text-blue-300">{notFoundAssets.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Already deleted or missing</p>
                </div>
              </div>

              {/* Action Selection (only if there are used assets) */}
              {usedAssets.length > 0 && (
                <div className="space-y-3 p-4 bg-card/40 border border-border/50 rounded-lg">
                  <h4 className="font-semibold text-sm">What to do with used assets?</h4>
                  <RadioGroup value={selectedAction} onValueChange={(v) => setSelectedAction(v as BulkAction)}>
                    <div className="flex items-start space-x-2 p-3 border border-border/30 rounded-md hover:bg-card/30">
                      <RadioGroupItem value="remove" id="remove" />
                      <Label htmlFor="remove" className="flex-1 cursor-pointer">
                        <div className="font-medium">Remove References</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Unlink assets from menu items, then delete them
                        </p>
                      </Label>
                    </div>

                    <div className="flex items-start space-x-2 p-3 border border-border/30 rounded-md hover:bg-card/30">
                      <RadioGroupItem value="replace" id="replace" />
                      <Label htmlFor="replace" className="flex-1 cursor-pointer">
                        <div className="font-medium">Replace with Another Asset</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Swap all references to a different asset before deletion
                        </p>
                      </Label>
                    </div>

                    {selectedAction === 'replace' && (
                      <div className="ml-6 mt-2 space-y-2">
                        <Label className="text-xs">Choose Replacement:</Label>
                        <select
                          value={selectedReplacementId}
                          onChange={(e) => setSelectedReplacementId(e.target.value)}
                          className="w-full p-2 bg-background border border-border rounded-md text-sm"
                        >
                          <option value="">-- Select an asset --</option>
                          {replacementOptions.map(asset => (
                            <option key={asset.id} value={asset.id}>
                              {getSmartDisplayName(asset)} ({asset.name})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex items-start space-x-2 p-3 border border-border/30 rounded-md hover:bg-card/30">
                      <RadioGroupItem value="skip" id="skip" />
                      <Label htmlFor="skip" className="flex-1 cursor-pointer">
                        <div className="font-medium">Skip Used Assets</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Only delete the {unusedAssets.length} unused {unusedAssets.length === 1 ? 'asset' : 'assets'}
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </TabsContent>

            {/* Used Assets Tab */}
            <TabsContent value="used" className="flex-1 overflow-hidden">
              <ScrollArea className="h-[300px] pr-4">
                {usedAssets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p>No assets are in use</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {usedAssets.map(asset => (
                      <div key={asset.id} className="p-3 bg-card/30 border border-border/30 rounded-md">
                        <div className="flex items-start gap-3">
                          <ImageIcon className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {getSmartDisplayName({ ...asset, friendlyName: asset.friendlyName || asset.name })}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Used in {asset.usageCount} {asset.usageCount === 1 ? 'item' : 'items'}
                            </p>
                            {asset.linkedItems.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {asset.linkedItems.slice(0, 3).map((item, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs mr-1">
                                    {item.name}
                                  </Badge>
                                ))}
                                {asset.linkedItems.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{asset.linkedItems.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Unused Assets Tab */}
            <TabsContent value="unused" className="flex-1 overflow-hidden">
              <ScrollArea className="h-[300px] pr-4">
                {unusedAssets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                    <p>All selected assets are in use</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {unusedAssets.map(asset => (
                      <div key={asset.id} className="p-3 bg-card/30 border border-border/30 rounded-md">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {getSmartDisplayName({ ...asset, friendlyName: asset.friendlyName || asset.name })}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              Not linked to any items
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Not Found Assets Tab */}
            <TabsContent value="notfound" className="flex-1 overflow-hidden">
              <ScrollArea className="h-[300px] pr-4">
                {notFoundAssets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p>All assets exist in database</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notFoundAssets.map(asset => (
                      <div key={asset.id} className="p-3 bg-card/30 border border-blue-500/20 rounded-md">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {getSmartDisplayName({ ...asset, friendlyName: asset.friendlyName || asset.name })}
                            </p>
                            <p className="text-xs text-blue-400 mt-1">
                              Asset not found in database (already deleted?)
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Will be skipped during deletion
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        {/* Footer Actions */}
        <DialogFooter className="flex-shrink-0">
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mr-auto">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing {processedCount} / {totalAssets}...
            </div>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing || isAnalyzing}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={analyzeAllAssets}
            disabled={isProcessing || isAnalyzing}
            className="border-purple-500/50"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Re-analyze
          </Button>
          <Button
            variant="destructive"
            onClick={handleBulkDelete}
            disabled={
              isProcessing ||
              isAnalyzing ||
              usageData.size === 0 ||
              (selectedAction === 'replace' && !selectedReplacementId)
            }
            className="bg-red-600 hover:bg-red-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete {selectedAction === 'skip' ? unusedAssets.length : totalAssets}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
