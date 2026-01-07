import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertTriangle, ImageIcon, Video } from 'lucide-react';
import { apiClient } from 'app';
import { MediaItem, getMediaDisplayName } from 'utils/mediaLibraryUtils';
import { extractApiError, isNotFoundError } from '../utils/apiErrorHandler';

export interface MenuItemUsage {
  id: string;
  name: string;
  asset_field: string;
  asset_type: string;
}

export interface AssetUsageInfo {
  success: boolean;
  message: string;
  asset_id: string;
  asset_name?: string;
  total_usage_count: number;
  menu_items: MenuItemUsage[];
  can_delete: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  asset: MediaItem | null;
  onConfirmDelete: (asset: MediaItem, replacementAssetId?: string) => Promise<void>;
  availableAssets: MediaItem[];
}

export const SmartDeleteDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  asset,
  onConfirmDelete,
  availableAssets,
}) => {
  const [usageInfo, setUsageInfo] = useState<AssetUsageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<'replace' | 'remove' | 'cancel'>('cancel');
  const [selectedReplacementId, setSelectedReplacementId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Check asset usage when dialog opens
  useEffect(() => {
    if (isOpen && asset) {
      checkAssetUsage();
    } else {
      resetState();
    }
  }, [isOpen, asset]);

  const resetState = () => {
    setUsageInfo(null);
    setError(null);
    setSelectedAction('cancel');
    setSelectedReplacementId('');
    setIsProcessing(false);
  };

  const checkAssetUsage = async () => {
    if (!asset) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get_asset_usage({ assetId: asset.id });
      const data: AssetUsageInfo = await response.json();
      
      setUsageInfo(data);
      
      // Set default action based on usage
      if (data.can_delete) {
        setSelectedAction('remove'); // No usage, safe to delete
      } else {
        setSelectedAction('replace'); // In use, suggest replacement
      }
    } catch (err: any) {
      // Handle 404 - asset doesn't exist (probably already deleted)
      if (isNotFoundError(err)) {
        console.warn(`Asset ${asset.id} not found - treating as already deleted`);
        // Set usage info to allow deletion
        setUsageInfo({
          success: true,
          message: 'Asset not found in database',
          asset_id: asset.id,
          asset_name: asset.name,
          total_usage_count: 0,
          menu_items: [],
          can_delete: true
        });
        setSelectedAction('remove');
        return;
      }
      
      // Extract user-friendly error message
      const apiError = extractApiError(err);
      setError(`Failed to check asset usage: ${apiError.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!asset || !usageInfo) return;
    
    setIsProcessing(true);
    
    try {
      if (selectedAction === 'replace' && selectedReplacementId) {
        // Replace with selected asset, then delete
        await onConfirmDelete(asset, selectedReplacementId);
      } else if (selectedAction === 'remove') {
        // Remove references and delete
        await onConfirmDelete(asset);
      }
      
      onClose();
    } catch (err) {
      // Error handling is done in parent component
    } finally {
      setIsProcessing(false);
    }
  };

  const getAvailableReplacements = () => {
    if (!asset) return [];
    
    return availableAssets.filter(item => 
      item.id !== asset.id && item.type === asset.type
    );
  };

  const renderAssetIcon = (type: string) => {
    return type === 'image' ? (
      <ImageIcon className="h-4 w-4" />
    ) : (
      <Video className="h-4 w-4" />
    );
  };

  if (!asset) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Delete Media Asset
          </DialogTitle>
          <DialogDescription>
            You're about to delete <strong>{getMediaDisplayName(asset)}</strong>. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Checking asset usage...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {usageInfo && (
            <>
              {usageInfo.can_delete ? (
                <Alert>
                  <AlertDescription>
                    This asset is not being used by any menu items and can be safely deleted.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warning:</strong> This asset is currently being used by {usageInfo.total_usage_count} menu item(s).
                    </AlertDescription>
                  </Alert>

                  {/* Show affected menu items */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Affected Menu Items:</h4>
                    <div className="space-y-2">
                      {usageInfo.menu_items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.name}</span>
                          <Badge variant="outline">
                            {item.asset_type} image
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Action selection */}
                  <div className="space-y-4">
                    <h4 className="font-medium">What would you like to do?</h4>
                    
                    <div className="space-y-3">
                      {/* Replace option */}
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          id="replace"
                          name="action"
                          value="replace"
                          checked={selectedAction === 'replace'}
                          onChange={(e) => setSelectedAction(e.target.value as 'replace')}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label htmlFor="replace" className="font-medium cursor-pointer">
                            Replace with another asset
                          </label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Choose a replacement asset and update all menu items
                          </p>
                          
                          {selectedAction === 'replace' && (
                            <div className="mt-3">
                              <select
                                value={selectedReplacementId}
                                onChange={(e) => setSelectedReplacementId(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                required
                              >
                                <option value="">Select a replacement asset...</option>
                                {getAvailableReplacements().map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {getMediaDisplayName(item)} ({item.type})
                                  </option>
                                ))}
                              </select>
                              
                              {getAvailableReplacements().length === 0 && (
                                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                  No compatible replacement assets available
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Remove option */}
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          id="remove"
                          name="action"
                          value="remove"
                          checked={selectedAction === 'remove'}
                          onChange={(e) => setSelectedAction(e.target.value as 'remove')}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label htmlFor="remove" className="font-medium cursor-pointer">
                            Remove from menu items entirely
                          </label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Remove asset references and delete the asset (menu items will have no image)
                          </p>
                        </div>
                      </div>

                      {/* Cancel option */}
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          id="cancel"
                          name="action"
                          value="cancel"
                          checked={selectedAction === 'cancel'}
                          onChange={(e) => setSelectedAction(e.target.value as 'cancel')}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label htmlFor="cancel" className="font-medium cursor-pointer">
                            Keep the asset
                          </label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Cancel deletion and keep the asset
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          
          {usageInfo && selectedAction !== 'cancel' && (
            <Button
              variant={selectedAction === 'remove' ? 'destructive' : 'default'}
              onClick={handleConfirmAction}
              disabled={isProcessing || (selectedAction === 'replace' && !selectedReplacementId)}
            >
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {selectedAction === 'replace' ? 'Replace & Delete' : 'Remove & Delete'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
