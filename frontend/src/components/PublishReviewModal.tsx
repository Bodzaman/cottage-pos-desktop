/**
 * PublishReviewModal
 *
 * A modal that shows all pending draft changes before publishing.
 * Displays menu items, customizations, and set meals that will be published.
 */

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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileEdit, FilePlus2, ArrowRight, AlertCircle, CheckCircle2, RefreshCw, Utensils, Settings, Package } from 'lucide-react';
import { toast } from 'sonner';
import { getDraftItemsWithChanges, getDraftCustomizations, getDraftSetMeals, publishMenuDirect, createSnapshotsForPublish } from '../utils/supabaseQueries';
import type { DraftItemChange, FieldChange } from '../utils/draftTypes';
import { formatFieldValue } from '../utils/draftTypes';

interface DraftCustomization {
  id: string;
  name: string;
  customization_group?: string;
}

interface DraftSetMeal {
  id: string;
  name: string;
  code?: string;
}

interface PublishReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublishSuccess: () => void;
  draftCount: number;
}

export default function PublishReviewModal({
  isOpen,
  onClose,
  onPublishSuccess,
  draftCount,
}: PublishReviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftItems, setDraftItems] = useState<DraftItemChange[]>([]);
  const [draftCustomizations, setDraftCustomizations] = useState<DraftCustomization[]>([]);
  const [draftSetMeals, setDraftSetMeals] = useState<DraftSetMeal[]>([]);
  const [activeTab, setActiveTab] = useState('items');

  // Fetch draft changes when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllDraftChanges();
    }
  }, [isOpen]);

  const fetchAllDraftChanges = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all draft entity types in parallel
      const [itemsResult, customizationsResult, setMealsResult] = await Promise.all([
        getDraftItemsWithChanges(),
        getDraftCustomizations(),
        getDraftSetMeals(),
      ]);

      if (!itemsResult.success) {
        setError(itemsResult.error || 'Failed to load draft menu items');
        return;
      }

      setDraftItems(itemsResult.draft_items);
      setDraftCustomizations(customizationsResult.items || []);
      setDraftSetMeals(setMealsResult.items || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);

    try {
      // First, create snapshots for all draft menu items being published
      const itemIds = draftItems.map((d) => d.item_id);
      if (itemIds.length > 0) {
        await createSnapshotsForPublish(itemIds);
      }

      // Then publish the menu (direct to Supabase - web app, no backend needed)
      const result = await publishMenuDirect();

      if (!result.success) {
        toast.error(result.message || 'Failed to publish menu');
        return;
      }

      // Show detailed success message
      const totalPublished = draftItems.length + draftCustomizations.length + draftSetMeals.length;
      toast.success(result.message || `Published ${totalPublished} items`);
      onPublishSuccess();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPublishing(false);
    }
  };

  // Total count across all entity types
  const totalDraftCount = draftItems.length + draftCustomizations.length + draftSetMeals.length;

  // Separate new and modified items
  const newItems = draftItems.filter((d) => d.is_new);
  const modifiedItems = draftItems.filter((d) => !d.is_new);

  // Render a single field change
  const renderFieldChange = (change: FieldChange) => (
    <div key={change.field} className="flex items-center gap-2 text-sm py-1">
      <span className="text-gray-400 min-w-[120px]">{change.label}:</span>
      <span className="text-red-400 line-through">
        {formatFieldValue(change.oldValue, change.type)}
      </span>
      <ArrowRight className="h-3 w-3 text-gray-500" />
      <span className="text-emerald-400 font-medium">
        {formatFieldValue(change.newValue, change.type)}
      </span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80dvh] overflow-hidden flex flex-col bg-[rgba(26,26,26,0.95)] text-white border-[rgba(124,93,250,0.3)] backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <FileEdit className="h-5 w-5 text-[#7C3AED]" />
            Review Changes Before Publishing
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Review all draft changes below. Publishing will make these items live on all channels.
          </DialogDescription>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="flex gap-3 py-4 border-b border-white/10">
          <div className="flex-1 text-center p-3 rounded-lg bg-[rgba(124,58,237,0.1)] border border-[rgba(124,93,250,0.3)]">
            <div className="text-2xl font-bold text-[#7C3AED]">{totalDraftCount}</div>
            <div className="text-sm text-gray-400">Total Drafts</div>
          </div>
          <div className="flex-1 text-center p-3 rounded-lg bg-[rgba(59,130,246,0.1)] border border-blue-500/30">
            <div className="text-2xl font-bold text-blue-400">{draftItems.length}</div>
            <div className="text-sm text-gray-400">Menu Items</div>
          </div>
          <div className="flex-1 text-center p-3 rounded-lg bg-[rgba(245,158,11,0.1)] border border-amber-500/30">
            <div className="text-2xl font-bold text-amber-400">{draftCustomizations.length}</div>
            <div className="text-sm text-gray-400">Add-ons</div>
          </div>
          <div className="flex-1 text-center p-3 rounded-lg bg-[rgba(16,185,129,0.1)] border border-emerald-500/30">
            <div className="text-2xl font-bold text-emerald-400">{draftSetMeals.length}</div>
            <div className="text-sm text-gray-400">Set Meals</div>
          </div>
        </div>

        {/* Content Area with Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#7C3AED] mb-4" />
              <p className="text-gray-400">Loading draft changes...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-8 w-8 text-red-400 mb-4" />
              <p className="text-red-400 mb-4">{error}</p>
              <Button variant="outline" onClick={fetchAllDraftChanges} className="gap-2 border-[rgba(124,93,250,0.4)] text-white hover:bg-[rgba(124,93,250,0.1)]">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : totalDraftCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-4" />
              <p className="text-gray-400">No pending changes to publish</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3 bg-[#111] rounded-lg p-1">
                <TabsTrigger value="items" className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-white/5 transition-colors">
                  <Utensils className="h-4 w-4" />
                  Items ({draftItems.length})
                </TabsTrigger>
                <TabsTrigger value="customizations" className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-white/5 transition-colors">
                  <Settings className="h-4 w-4" />
                  Add-ons ({draftCustomizations.length})
                </TabsTrigger>
                <TabsTrigger value="setmeals" className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-white/5 transition-colors">
                  <Package className="h-4 w-4" />
                  Set Meals ({draftSetMeals.length})
                </TabsTrigger>
              </TabsList>

              {/* Menu Items Tab */}
              <TabsContent value="items" className="flex-1 overflow-y-auto space-y-4 py-4 pr-2 mt-0">
                {draftItems.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No draft menu items</p>
                ) : (
                  <>
                    {/* New Items */}
                    {newItems.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                          <FilePlus2 className="h-4 w-4" />
                          New Items ({newItems.length})
                        </h3>
                        <div className="space-y-2">
                          {newItems.map((item) => (
                            <div
                              key={item.item_id}
                              className="p-3 rounded-lg bg-[rgba(16,185,129,0.05)] border border-emerald-500/20"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">NEW</Badge>
                                  <span className="font-medium text-white">{item.name}</span>
                                </div>
                                {item.category_name && (
                                  <span className="text-sm text-gray-500">{item.category_name}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Modified Items */}
                    {modifiedItems.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                          <FileEdit className="h-4 w-4" />
                          Modified Items ({modifiedItems.length})
                        </h3>
                        <div className="space-y-3">
                          {modifiedItems.map((item) => (
                            <div
                              key={item.item_id}
                              className="p-3 rounded-lg bg-[rgba(245,158,11,0.05)] border border-amber-500/20"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">MODIFIED</Badge>
                                  <span className="font-medium text-white">{item.name}</span>
                                </div>
                                {item.category_name && (
                                  <span className="text-sm text-gray-500">{item.category_name}</span>
                                )}
                              </div>
                              {item.changes.length > 0 ? (
                                <div className="pl-4 border-l-2 border-amber-500/30">
                                  {item.changes.map(renderFieldChange)}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 pl-4">
                                  No specific field changes detected (variant changes or metadata update)
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Customizations Tab */}
              <TabsContent value="customizations" className="flex-1 overflow-y-auto space-y-2 py-4 pr-2 mt-0">
                {draftCustomizations.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No draft customizations</p>
                ) : (
                  <div className="space-y-2">
                    {draftCustomizations.map((customization) => (
                      <div
                        key={customization.id}
                        className="p-3 rounded-lg bg-[rgba(245,158,11,0.05)] border border-amber-500/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">DRAFT</Badge>
                            <span className="font-medium text-white">{customization.name}</span>
                          </div>
                          {customization.customization_group && (
                            <span className="text-sm text-gray-500">{customization.customization_group}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Set Meals Tab */}
              <TabsContent value="setmeals" className="flex-1 overflow-y-auto space-y-2 py-4 pr-2 mt-0">
                {draftSetMeals.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No draft set meals</p>
                ) : (
                  <div className="space-y-2">
                    {draftSetMeals.map((setMeal) => (
                      <div
                        key={setMeal.id}
                        className="p-3 rounded-lg bg-[rgba(16,185,129,0.05)] border border-emerald-500/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">DRAFT</Badge>
                            <span className="font-medium text-white">{setMeal.name}</span>
                          </div>
                          {setMeal.code && (
                            <span className="text-sm text-gray-500">Code: {setMeal.code}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        <DialogFooter className="border-t border-white/10 pt-4">
          <Button variant="outline" onClick={onClose} disabled={publishing} className="border-[rgba(124,93,250,0.4)] text-white hover:bg-[rgba(124,93,250,0.1)]">
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={loading || publishing || totalDraftCount === 0}
            className="bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(26,26,26,0.95)]"
          >
            {publishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Publish All ({totalDraftCount})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
